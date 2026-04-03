"""
User Profile Routes
====================
Firestore doc: users/{uid}
Actual fields: monthly_income, savings_rate, debt_to_income,
               emergency_fund, email, name, risk_score
"""

from flask import Blueprint, request, jsonify, g
from firebase_admin import firestore
from firebase_config import get_db
from routes.auth import require_auth

profile_bp = Blueprint("profile", __name__)


@profile_bp.route("/profile", methods=["GET"])
@require_auth
def get_profile():
    """
    GET /api/profile
    Returns the authenticated user's financial profile from users/{uid}.
    """
    db = get_db()
    doc = db.collection("users").document(g.uid).get()

    if not doc.exists:
        return jsonify({
            "uid": g.uid,
            "monthly_income": 0,
            "savings_rate": 0,
            "debt_to_income": 0,
            "emergency_fund": 0,
            "risk_score": 0,
            "email": "",
            "name": "",
            "profile_exists": False,
        }), 200

    data = doc.to_dict()
    return jsonify({
        "uid": g.uid,
        "monthly_income": data.get("monthly_income", 0),
        "savings_rate": data.get("savings_rate", 0),
        "debt_to_income": data.get("debt_to_income", 0),
        "emergency_fund": data.get("emergency_fund", 0),
        "risk_score": data.get("risk_score", 0),
        "email": data.get("email", ""),
        "name": data.get("name", ""),
        "profile_exists": True,
    }), 200


@profile_bp.route("/profile", methods=["PUT"])
@require_auth
def update_profile():
    """
    PUT /api/profile
    Body: { monthly_income?, savings_rate?, debt_to_income?,
            emergency_fund?, name?, email? }

    Updates users/{uid}. Only overwrites fields that are sent.
    This is what /api/predict auto-mode reads from.
    """
    db = get_db()
    data = request.get_json(silent=True) or {}

    allowed_fields = [
        "monthly_income", "savings_rate", "debt_to_income",
        "emergency_fund", "risk_score", "name", "email",
    ]

    updates = {}
    for field in allowed_fields:
        if field in data:
            if field in ("name", "email"):
                updates[field] = str(data[field])
            else:
                updates[field] = float(data[field])

    if not updates:
        return jsonify({"error": "No valid fields to update"}), 400

    updates["updated_at"] = firestore.SERVER_TIMESTAMP

    db.collection("users").document(g.uid).set(updates, merge=True)

    return jsonify({
        "uid": g.uid,
        "message": "Profile updated",
        "updated_fields": list(updates.keys()),
    }), 200
