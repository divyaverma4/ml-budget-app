from functools import wraps
from flask import request, jsonify, g
from firebase_admin import auth


def require_auth(f):
    """
    Decorator that verifies the Firebase ID token sent in the
    Authorization: Bearer <token> header.

    On success, sets g.uid to the verified user's uid so route
    handlers never need to trust a client-supplied uid param.
    """

    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or malformed Authorization header"}), 401

        id_token = auth_header.split("Bearer ")[1].strip()

        try:
            decoded = auth.verify_id_token(id_token)
            g.uid = decoded["uid"]
        except auth.ExpiredIdTokenError:
            return jsonify({"error": "Token expired"}), 401
        except auth.InvalidIdTokenError:
            return jsonify({"error": "Invalid token"}), 401
        except Exception as e:
            return jsonify({"error": f"Auth error: {str(e)}"}), 401

        return f(*args, **kwargs)

    return decorated