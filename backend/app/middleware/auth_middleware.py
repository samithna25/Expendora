from functools import wraps
from flask import request, jsonify
from bson import ObjectId
from app.utils.jwt_utils import verify_token
from app.database.db import get_db


def require_auth(f):
    """
    Decorator to protect routes that require authentication.
    Checks the Authorization header for a valid Bearer JWT token
    and verifies the session is still active (token_version match).

    Usage:
        @app.route('/protected')
        @require_auth
        def protected_route():
            ...
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", None)

        # Check if Authorization header exists
        if not auth_header:
            return jsonify({
                "success": False,
                "message": "Authorization header is missing"
            }), 401

        # Check if it follows "Bearer <token>" format
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return jsonify({
                "success": False,
                "message": "Invalid authorization format. Use: Bearer <token>"
            }), 401

        token = parts[1]

        # Verify the token
        payload = verify_token(token)
        if payload is None:
            return jsonify({
                "success": False,
                "message": "Invalid or expired token"
            }), 401

        # Fetch user's current token_version from DB
        db = get_db()
        if db is None:
            return jsonify({
                "success": False,
                "message": "Database connection failed"
            }), 500

        user = db.users.find_one(
            {"_id": ObjectId(payload["user_id"])},
            {"token_version": 1}
        )
        if not user:
            return jsonify({
                "success": False,
                "message": "User not found"
            }), 401

        stored_version = user.get("token_version", 0)
        token_version = payload.get("token_version", -1)

        if token_version != stored_version:
            return jsonify({
                "success": False,
                "message": "Session expired. You have been logged in from another device."
            }), 401

        # Attach the decoded user info to the request for use in the route
        request.current_user = payload
        return f(*args, **kwargs)

    return decorated
