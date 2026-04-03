"""
Budget Routes
=============
Firestore doc: budgets/{uid}
Actual fields: category, needs, wants, savings, total,
               generated_at, strict_mode, warnings

The ML model predicts a budget category (standard, low_savings,
low_emergency, high_debt), then we compute the needs/wants/savings
split based on that category.
"""

from flask import Blueprint, request, jsonify, g
from firebase_admin import firestore
from firebase_config import get_db
from routes.auth import require_auth
from datetime import datetime, timezone

budget_bp = Blueprint("budget", __name__)

# --------------------------------------------------------------------------
# Budget category -> needs/wants/savings percentages
# These come from the synthetic data generator in generate_synthetic_data.py
# --------------------------------------------------------------------------
BUDGET_SPLITS = {
    "standard":      {"needs": 0.50, "wants": 0.30, "savings": 0.20},
    "low_savings":   {"needs": 0.50, "wants": 0.35, "savings": 0.15},
    "low_emergency": {"needs": 0.50, "wants": 0.25, "savings": 0.25},
    "high_debt":     {"needs": 0.50, "wants": 0.15, "savings": 0.35},
}


@budget_bp.route("/budget", methods=["GET"])
@require_auth
def get_budget():
    """
    GET /api/budget
    Returns the budget doc for the authenticated user.
    Also aggregates current month spending from variable_expenses
    and fixed_expenses.
    """
    db = get_db()

    # Read budgets/{uid}
    budget_snap = db.collection("budgets").document(g.uid).get()
    budget_data = budget_snap.to_dict() if budget_snap.exists else {}

    # Read users/{uid} for income
    user_snap = db.collection("users").document(g.uid).get()
    user_data = user_snap.to_dict() if user_snap.exists else {}

    # Aggregate current month spending
    variable_total = _aggregate_expenses(g.uid, db, "variable_expenses")
    fixed_total = _aggregate_expenses(g.uid, db, "fixed_expenses")

    return jsonify({
        "category": budget_data.get("category", ""),
        "needs": budget_data.get("needs", 0),
        "wants": budget_data.get("wants", 0),
        "savings": budget_data.get("savings", 0),
        "total": budget_data.get("total", 0),
        "strict_mode": budget_data.get("strict_mode", False),
        "warnings": budget_data.get("warnings", []),
        "generated_at": (
            budget_data["generated_at"].isoformat()
            if budget_data.get("generated_at") and hasattr(budget_data["generated_at"], "isoformat")
            else budget_data.get("generated_at")
        ),
        "monthly_income": user_data.get("monthly_income", 0),
        "spending": {
            "variable_expenses": round(variable_total, 2),
            "fixed_expenses": round(fixed_total, 2),
            "total": round(variable_total + fixed_total, 2),
        },
    }), 200


@budget_bp.route("/budget/optimize", methods=["POST"])
@require_auth
def optimize_budget():
    """
    POST /api/budget/optimize
    Runs the ML model and writes the result to budgets/{uid}
    in the correct schema: category, needs, wants, savings, total, etc.

    Optional body: { strict_mode: true/false }
    """
    db = get_db()

    # --- Get user profile ---
    user_doc = db.collection("users").document(g.uid).get()
    if not user_doc.exists:
        return jsonify({"error": "User profile not found. Update profile first."}), 404

    profile = user_doc.to_dict()
    monthly_income = float(profile.get("monthly_income", 0))

    if monthly_income <= 0:
        return jsonify({"error": "monthly_income must be greater than 0"}), 400

    # --- Aggregate expenses ---
    variable_total = _aggregate_expenses(g.uid, db, "variable_expenses")
    fixed_total = _aggregate_expenses(g.uid, db, "fixed_expenses")

    # --- Build features for ML model ---
    emergency_fund = float(profile.get("emergency_fund", 0))
    features = {
        "monthly_income": monthly_income,
        "fixed_expenses": fixed_total,
        "variable_expenses": variable_total,
        "savings_rate": float(profile.get("savings_rate", 0)),
        "debt_to_income": float(profile.get("debt_to_income", 0)),
        "emergency_fund_months": (
            emergency_fund / monthly_income if monthly_income > 0 else 0.0
        ),
        "spending_volatility": float(profile.get("spending_volatility", 0.3)),
    }

    # --- Run prediction ---
    from routes.spending import _run_prediction
    result = _run_prediction(features)
    category = result["budget_category"]

    # --- Compute dollar amounts using needs/wants/savings split ---
    splits = BUDGET_SPLITS.get(category, BUDGET_SPLITS["standard"])
    needs = round(monthly_income * splits["needs"], 2)
    wants = round(monthly_income * splits["wants"], 2)
    savings = round(monthly_income * splits["savings"], 2)
    total = round(needs + wants + savings, 2)

    # --- Check for warnings ---
    warnings = []
    total_spending = variable_total + fixed_total
    if total_spending > needs + wants:
        warnings.append("Current spending exceeds recommended needs + wants budget")
    if float(profile.get("savings_rate", 0)) < splits["savings"]:
        warnings.append("Your savings rate is below the recommended target")

    # --- Check strict_mode from request body ---
    body = request.get_json(silent=True) or {}
    strict_mode = body.get("strict_mode", False)

    # --- Write to budgets/{uid} in the actual Firestore schema ---
    budget_doc = {
        "category": category,
        "needs": needs,
        "wants": wants,
        "savings": savings,
        "total": total,
        "generated_at": firestore.SERVER_TIMESTAMP,
        "strict_mode": bool(strict_mode),
        "warnings": warnings,
    }

    db.collection("budgets").document(g.uid).set(budget_doc)

    return jsonify({
        "uid": g.uid,
        "category": category,
        "needs": needs,
        "wants": wants,
        "savings": savings,
        "total": total,
        "strict_mode": strict_mode,
        "warnings": warnings,
        "confidence": result["confidence"],
        "class_probabilities": result["class_probabilities"],
        "features_used": features,
    }), 200


def _aggregate_expenses(uid: str, db, collection_name: str) -> float:
    """Sum expenses for a user from the current month."""
    now = datetime.now(timezone.utc)
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    docs = (
        db.collection(collection_name)
        .where("uid", "==", uid)
        .where("timestamp", ">=", start_of_month)
        .stream()
    )
    return sum(doc.to_dict().get("amount", 0) for doc in docs)
