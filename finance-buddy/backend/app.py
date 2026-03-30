"""
Finance Buddy — Flask API
Connects the React Native frontend to the ML budget model + Firestore.
"""

from flask import Flask, request, jsonify
import joblib
import numpy as np
import firebase_admin
from firebase_admin import credentials, firestore

# SETUP

app = Flask(__name__)

# Firebase
cred = credentials.Certificate('serviceAccountKey.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

# ML model (load once at startup)
model = joblib.load('budget_model.joblib')
scaler = joblib.load('budget_scaler.joblib')

# Budget constraint constants
CATEGORY_RATIOS = {
    "standard":      (0.50, 0.30, 0.20),
    "low_savings":   (0.50, 0.35, 0.15),
    "low_emergency": (0.50, 0.25, 0.25),
    "high_debt":     (0.50, 0.15, 0.35),
}
SAVINGS_FLOOR = 0.15
STRICT_MODE_DTI = 0.50
MIN_WANTS_RATIO = 0.05


# HELPER: apply rule-based constraints


def apply_constraints(predicted_category, monthly_income, fixed_expenses,
                      debt_to_income, emergency_fund_months):
    warnings = []
    category = predicted_category
    strict_mode = False

    if debt_to_income > STRICT_MODE_DTI:
        if category != "high_debt":
            warnings.append(
                f"DTI ({debt_to_income:.2f}) exceeds {STRICT_MODE_DTI}. "
                f"Overriding '{category}' → 'high_debt'."
            )
            category = "high_debt"
        strict_mode = True

    if emergency_fund_months < 0.5 and category == "standard":
        category = "low_emergency"
        warnings.append(
            f"Emergency fund is only {emergency_fund_months:.1f} months. "
            f"Switching to 'low_emergency' to build a buffer."
        )

    needs_ratio, wants_ratio, savings_ratio = CATEGORY_RATIOS[category]

    if savings_ratio < SAVINGS_FLOOR:
        diff = SAVINGS_FLOOR - savings_ratio
        savings_ratio = SAVINGS_FLOOR
        wants_ratio -= diff
        warnings.append(
            f"Savings ratio raised to {SAVINGS_FLOOR:.0%} floor "
            f"(reduced wants by {diff:.0%})."
        )

    needs = fixed_expenses
    savings = monthly_income * savings_ratio
    remaining = monthly_income - needs - savings

    if remaining < 0:
        wants = monthly_income * MIN_WANTS_RATIO
        savings = max(monthly_income - needs - wants, 0)
        warnings.append(
            f"Fixed expenses (${needs:.0f}) + savings exceed income. "
            f"Savings reduced to ${savings:.0f}. Consider cutting fixed costs."
        )
    else:
        wants = remaining

    max_wants = monthly_income * wants_ratio
    if wants > max_wants and remaining >= 0:
        surplus = wants - max_wants
        wants = max_wants
        savings += surplus
        warnings.append(
            f"Wants capped at ${max_wants:.0f}. "
            f"Extra ${surplus:.0f} moved to savings."
        )

    return {
        "category": category,
        "strict_mode": strict_mode,
        "needs": round(needs, 2),
        "wants": round(wants, 2),
        "savings": round(savings, 2),
        "total": round(needs + wants + savings, 2),
        "warnings": warnings,
    }



# HELPER: get user financial data from Firestore

def get_user_data(uid):
    """Pull user profile + expenses from Firestore, return the 7 ML features."""

    user_doc = db.collection('users').document(uid).get()
    if not user_doc.exists:
        return None
    user = user_doc.to_dict()

    fixed_docs = db.collection('fixed_expenses').where('uid', '==', uid).stream()
    total_fixed = sum(doc.to_dict().get('amount', 0) for doc in fixed_docs)

    var_docs = db.collection('variable_expenses').where('uid', '==', uid).stream()
    variable_amounts = [doc.to_dict().get('amount', 0) for doc in var_docs]
    total_variable = sum(variable_amounts)

    if len(variable_amounts) > 1 and total_variable > 0:
        spending_volatility = float(np.std(variable_amounts) / np.mean(variable_amounts))
    else:
        spending_volatility = 0.0

    # Convert emergency fund from dollars to months of expenses
    emergency_fund_dollars = user.get('emergency_fund', 0)
    emergency_fund_months = emergency_fund_dollars / total_fixed if total_fixed > 0 else 0

    return {
        "monthly_income": user.get('monthly_income', 0),
        "fixed_expenses": total_fixed,
        "variable_expenses": total_variable,
        "savings_rate": user.get('savings_rate', 0),
        "debt_to_income": user.get('debt_to_income', 0),
        "emergency_fund_months": emergency_fund_months,
        "spending_volatility": spending_volatility,
    }



# ROUTES

@app.route('/predict-budget', methods=['POST'])
def predict_budget():
    """Takes a UID, returns budget recommendation."""

    data = request.get_json()
    if not data or 'uid' not in data:
        return jsonify({"error": "Missing uid"}), 400

    uid = data['uid']

    # Step 1: Get user data from Firestore
    user_data = get_user_data(uid)
    if user_data is None:
        return jsonify({"error": f"User {uid} not found"}), 404

    # Step 2: Prepare features for the model
    features = np.array([[
        user_data["monthly_income"],
        user_data["fixed_expenses"],
        user_data["variable_expenses"],
        user_data["savings_rate"],
        user_data["debt_to_income"],
        user_data["emergency_fund_months"],
        user_data["spending_volatility"],
    ]])
    features_scaled = scaler.transform(features)

    # Step 3: Model predicts category
    predicted_category = model.predict(features_scaled)[0]

    # Step 4: Apply rule-based constraints
    result = apply_constraints(
        predicted_category,
        user_data["monthly_income"],
        user_data["fixed_expenses"],
        user_data["debt_to_income"],
        user_data["emergency_fund_months"],
    )

    # Step 5: Save to Firestore
    result["generated_at"] = firestore.SERVER_TIMESTAMP
    db.collection('budgets').document(uid).set(result)

    return jsonify(result)


@app.route('/health', methods=['GET'])
def health():
    """Simple check to see if the server is running."""
    return jsonify({"status": "ok"})


# RUN

if __name__ == '__main__':
    app.run(debug=True)
