from flask import Blueprint, request, jsonify, g
from firebase_admin import firestore
from firebase_config import get_db
from routes.auth import require_auth
from datetime import datetime, timezone
import joblib
import numpy as np
import os

spending_bp = Blueprint("spending", __name__)

# ---------------------------------------------------------------------------
# ML model — loaded once at import time, not on every request
# ---------------------------------------------------------------------------

_MODEL_PATH = os.getenv("MODEL_PATH", "budget_model.joblib")
_SCALER_PATH = os.getenv("SCALER_PATH", "budget_scaler.joblib")

try:
    _model = joblib.load(_MODEL_PATH)
    _scaler = joblib.load(_SCALER_PATH)
except FileNotFoundError as e:
    raise RuntimeError(
        f"ML model files not found: {e}. "
        "Run train.py first or set MODEL_PATH / SCALER_PATH in .env."
    )

# Feature order must match training
_FEATURE_COLS = [
    "monthly_income",
    "fixed_expenses",
    "variable_expenses",
    "savings_rate",
    "debt_to_income",
    "emergency_fund_months",
    "spending_volatility",
]


def _run_prediction(feature_dict: dict) -> dict:
    """
    Given a dict with keys matching _FEATURE_COLS, returns the model
    prediction and per-class probabilities.
    """
    values = np.array([[feature_dict[col] for col in _FEATURE_COLS]])
    scaled = _scaler.transform(values)
    prediction = _model.predict(scaled)[0]
    probabilities = _model.predict_proba(scaled)[0]
    confidence = float(max(probabilities))
    class_probs = {
        cls: round(float(prob), 4)
        for cls, prob in zip(_model.classes_, probabilities)
    }
    return {
        "budget_category": prediction,
        "confidence": round(confidence, 4),
        "class_probabilities": class_probs,
    }


def _aggregate_variable_expenses(uid: str, db) -> float:
    """Sum all variable_expenses for a user (current month)."""
    now = datetime.now(timezone.utc)
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    docs = (
        db.collection("variable_expenses")
        .where("uid", "==", uid)
        .where("timestamp", ">=", start_of_month)
        .stream()
    )
    return sum(doc.to_dict().get("amount", 0) for doc in docs)


def _aggregate_fixed_expenses(uid: str, db) -> float:
    """Sum all fixed_expenses for a user (current month)."""
    now = datetime.now(timezone.utc)
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    docs = (
        db.collection("fixed_expenses")
        .where("uid", "==", uid)
        .where("timestamp", ">=", start_of_month)
        .stream()
    )
    return sum(doc.to_dict().get("amount", 0) for doc in docs)


# ---------------------------------------------------------------------------
# Variable Expenses
# ---------------------------------------------------------------------------

@spending_bp.route("/expenses/variable", methods=["POST"])
@require_auth
def add_variable_expense():
    """
    Add a variable expense.
    Body: { category, amount, note (optional) }
    """
    db = get_db()
    data = request.get_json(silent=True) or {}

    category = data.get("category", "").strip()
    amount = data.get("amount")
    note = data.get("note", "").strip()

    if not category:
        return jsonify({"error": "category is required"}), 400
    if amount is None or not isinstance(amount, (int, float)) or amount <= 0:
        return jsonify({"error": "amount must be a positive number"}), 400

    doc_ref = db.collection("variable_expenses").document()
    doc_ref.set({
        "uid": g.uid,
        "category": category,
        "amount": float(amount),
        "note": note,
        "timestamp": firestore.SERVER_TIMESTAMP,
    })

    return jsonify({"id": doc_ref.id, "message": "Variable expense added"}), 201


@spending_bp.route("/expenses/variable", methods=["GET"])
@require_auth
def get_variable_expenses():
    """
    Get all variable expenses for the authenticated user.
    Query params: limit (default 50), category (optional filter)
    """
    db = get_db()
    limit = min(int(request.args.get("limit", 50)), 200)
    category_filter = request.args.get("category")

    query = (
        db.collection("variable_expenses")
        .where("uid", "==", g.uid)
        .order_by("timestamp", direction=firestore.Query.DESCENDING)
        .limit(limit)
    )

    if category_filter:
        query = query.where("category", "==", category_filter)

    docs = query.stream()
    expenses = []
    for doc in docs:
        d = doc.to_dict()
        expenses.append({
            "id": doc.id,
            "category": d.get("category"),
            "amount": d.get("amount"),
            "note": d.get("note"),
            "timestamp": d.get("timestamp").isoformat() if d.get("timestamp") else None,
        })

    return jsonify({"expenses": expenses, "count": len(expenses)}), 200


@spending_bp.route("/expenses/variable/<expense_id>", methods=["PUT"])
@require_auth
def update_variable_expense(expense_id):
    """Update category, amount, or note on a variable expense."""
    db = get_db()
    doc_ref = db.collection("variable_expenses").document(expense_id)
    doc = doc_ref.get()

    if not doc.exists:
        return jsonify({"error": "Expense not found"}), 404
    if doc.to_dict().get("uid") != g.uid:
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json(silent=True) or {}
    updates = {}

    if "category" in data and data["category"].strip():
        updates["category"] = data["category"].strip()
    if "amount" in data:
        if not isinstance(data["amount"], (int, float)) or data["amount"] <= 0:
            return jsonify({"error": "amount must be a positive number"}), 400
        updates["amount"] = float(data["amount"])
    if "note" in data:
        updates["note"] = data["note"].strip()

    if not updates:
        return jsonify({"error": "No valid fields to update"}), 400

    doc_ref.update(updates)
    return jsonify({"message": "Updated", "id": expense_id}), 200


@spending_bp.route("/expenses/variable/<expense_id>", methods=["DELETE"])
@require_auth
def delete_variable_expense(expense_id):
    """Delete a variable expense."""
    db = get_db()
    doc_ref = db.collection("variable_expenses").document(expense_id)
    doc = doc_ref.get()

    if not doc.exists:
        return jsonify({"error": "Expense not found"}), 404
    if doc.to_dict().get("uid") != g.uid:
        return jsonify({"error": "Forbidden"}), 403

    doc_ref.delete()
    return jsonify({"message": "Deleted", "id": expense_id}), 200


# ---------------------------------------------------------------------------
# Fixed Expenses
# ---------------------------------------------------------------------------

@spending_bp.route("/expenses/fixed", methods=["POST"])
@require_auth
def add_fixed_expense():
    """
    Add a fixed expense (rent, subscriptions, etc.).
    Body: { category, amount, note (optional) }
    """
    db = get_db()
    data = request.get_json(silent=True) or {}

    category = data.get("category", "").strip()
    amount = data.get("amount")
    note = data.get("note", "").strip()

    if not category:
        return jsonify({"error": "category is required"}), 400
    if amount is None or not isinstance(amount, (int, float)) or amount <= 0:
        return jsonify({"error": "amount must be a positive number"}), 400

    doc_ref = db.collection("fixed_expenses").document()
    doc_ref.set({
        "uid": g.uid,
        "category": category,
        "amount": float(amount),
        "note": note,
        "timestamp": firestore.SERVER_TIMESTAMP,
    })

    return jsonify({"id": doc_ref.id, "message": "Fixed expense added"}), 201


@spending_bp.route("/expenses/fixed", methods=["GET"])
@require_auth
def get_fixed_expenses():
    """Get all fixed expenses for the authenticated user."""
    db = get_db()
    limit = min(int(request.args.get("limit", 50)), 200)

    docs = (
        db.collection("fixed_expenses")
        .where("uid", "==", g.uid)
        .order_by("timestamp", direction=firestore.Query.DESCENDING)
        .limit(limit)
        .stream()
    )

    expenses = []
    for doc in docs:
        d = doc.to_dict()
        expenses.append({
            "id": doc.id,
            "category": d.get("category"),
            "amount": d.get("amount"),
            "note": d.get("note"),
            "timestamp": d.get("timestamp").isoformat() if d.get("timestamp") else None,
        })

    return jsonify({"expenses": expenses, "count": len(expenses)}), 200


@spending_bp.route("/expenses/fixed/<expense_id>", methods=["PUT"])
@require_auth
def update_fixed_expense(expense_id):
    """Update a fixed expense."""
    db = get_db()
    doc_ref = db.collection("fixed_expenses").document(expense_id)
    doc = doc_ref.get()

    if not doc.exists:
        return jsonify({"error": "Expense not found"}), 404
    if doc.to_dict().get("uid") != g.uid:
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json(silent=True) or {}
    updates = {}

    if "category" in data and data["category"].strip():
        updates["category"] = data["category"].strip()
    if "amount" in data:
        if not isinstance(data["amount"], (int, float)) or data["amount"] <= 0:
            return jsonify({"error": "amount must be a positive number"}), 400
        updates["amount"] = float(data["amount"])
    if "note" in data:
        updates["note"] = data["note"].strip()

    if not updates:
        return jsonify({"error": "No valid fields to update"}), 400

    doc_ref.update(updates)
    return jsonify({"message": "Updated", "id": expense_id}), 200


@spending_bp.route("/expenses/fixed/<expense_id>", methods=["DELETE"])
@require_auth
def delete_fixed_expense(expense_id):
    """Delete a fixed expense."""
    db = get_db()
    doc_ref = db.collection("fixed_expenses").document(expense_id)
    doc = doc_ref.get()

    if not doc.exists:
        return jsonify({"error": "Expense not found"}), 404
    if doc.to_dict().get("uid") != g.uid:
        return jsonify({"error": "Forbidden"}), 403

    doc_ref.delete()
    return jsonify({"message": "Deleted", "id": expense_id}), 200


# ---------------------------------------------------------------------------
# ML Prediction endpoint
# ---------------------------------------------------------------------------

@spending_bp.route("/predict", methods=["POST"])
@require_auth
def predict():
    """
    Run the logistic regression model against the authenticated user's data.

    Two modes:
      1. Auto mode (no body): pulls live data from Firestore + user profile.
      2. Manual mode (body with feature values): useful for what-if scenarios.

    Returns budget_category, confidence, class_probabilities,
    and writes the result back to budgets/{uid} in Firestore.
    """
    db = get_db()
    data = request.get_json(silent=True) or {}
    manual_mode = any(col in data for col in _FEATURE_COLS)

    if manual_mode:
        missing = [col for col in _FEATURE_COLS if col not in data]
        if missing:
            return jsonify({
                "error": f"Manual mode requires all features. Missing: {missing}"
            }), 400
        features = {col: float(data[col]) for col in _FEATURE_COLS}

    else:
        # Pull user profile from Firestore
        user_doc = db.collection("users").document(g.uid).get()
        if not user_doc.exists:
            return jsonify({"error": "User profile not found"}), 404

        profile = user_doc.to_dict()

        # Aggregate live expense totals for current month
        variable_total = _aggregate_variable_expenses(g.uid, db)
        fixed_total = _aggregate_fixed_expenses(g.uid, db)

        monthly_income = float(profile.get("monthly_income", 0))
        savings_rate = float(profile.get("savings_rate", 0))
        debt_to_income = float(profile.get("debt_to_income", 0))
        emergency_fund = float(profile.get("emergency_fund", 0))

        # spending_volatility: stored on user doc and updated separately
        # Default to 0.3 if not yet computed
        spending_volatility = float(profile.get("spending_volatility", 0.3))

        # emergency_fund_months = emergency_fund / monthly_income
        emergency_fund_months = (
            emergency_fund / monthly_income if monthly_income > 0 else 0.0
        )

        features = {
            "monthly_income": monthly_income,
            "fixed_expenses": fixed_total,
            "variable_expenses": variable_total,
            "savings_rate": savings_rate,
            "debt_to_income": debt_to_income,
            "emergency_fund_months": emergency_fund_months,
            "spending_volatility": spending_volatility,
        }

    result = _run_prediction(features)

    # Write prediction + budget recommendation back to Firestore
    budget_ref = db.collection("budgets").document(g.uid)
    budget_ref.set({
        "budget_category": result["budget_category"],
        "confidence": result["confidence"],
        "class_probabilities": result["class_probabilities"],
        "features_used": features,
        "generated_at": firestore.SERVER_TIMESTAMP,
    }, merge=True)

    return jsonify({
        "uid": g.uid,
        "prediction": result,
        "features_used": features,
        "mode": "manual" if manual_mode else "auto",
    }), 200


# ---------------------------------------------------------------------------
# Summary endpoint — useful for the dashboard
# ---------------------------------------------------------------------------

@spending_bp.route("/summary", methods=["GET"])
@require_auth
def get_summary():
    """
    Returns current month totals and the latest budget prediction
    for the authenticated user. Single call for dashboard load.
    """
    db = get_db()

    variable_total = _aggregate_variable_expenses(g.uid, db)
    fixed_total = _aggregate_fixed_expenses(g.uid, db)

    budget_doc = db.collection("budgets").document(g.uid).get()
    budget_data = budget_doc.to_dict() if budget_doc.exists else {}

    user_doc = db.collection("users").document(g.uid).get()
    user_data = user_doc.to_dict() if user_doc.exists else {}

    return jsonify({
        "monthly_totals": {
            "variable_expenses": round(variable_total, 2),
            "fixed_expenses": round(fixed_total, 2),
            "total_spending": round(variable_total + fixed_total, 2),
        },
        "user_profile": {
            "monthly_income": user_data.get("monthly_income"),
            "savings_rate": user_data.get("savings_rate"),
            "debt_to_income": user_data.get("debt_to_income"),
            "emergency_fund": user_data.get("emergency_fund"),
            "risk_score": user_data.get("risk_score"),
        },
        "latest_prediction": {
            "budget_category": budget_data.get("budget_category"),
            "confidence": budget_data.get("confidence"),
            "generated_at": (
                budget_data["generated_at"].isoformat()
                if budget_data.get("generated_at") else None
            ),
        },
    }), 200