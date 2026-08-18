import os
from functools import wraps
from flask import request, jsonify
from bson import ObjectId
from app.utils.jwt_utils import verify_token, session_is_expired
from app.database.db import get_db


def require_auth(f):
    """
    Decorator to protect routes that require authentication.
    Checks the Authorization header for a valid Bearer JWT token
    and verifies the session document still exists in the DB.

    Usage:
        @app.route('/protected')
        @require_auth
        def protected_route():
            ...
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", None)

        if not auth_header:
            return jsonify({
                "success": False,
                "message": "Authorization header is missing"
            }), 401

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return jsonify({
                "success": False,
                "message": "Invalid authorization format. Use: Bearer <token>"
            }), 401

        token = parts[1]

        payload = verify_token(token)
        if payload is None:
            return jsonify({
                "success": False,
                "message": "Invalid or expired token"
            }), 401

        db = get_db()
        if db is None:
            return jsonify({
                "success": False,
                "message": "Database connection failed"
            }), 500

        # Check that the session document still exists
        session = db.sessions.find_one({"_id": ObjectId(payload["session_id"])})
        if not session:
            return jsonify({
                "success": False,
                "message": "Session expired. You have been logged in from another device."
            }), 401

        # Defense-in-depth: reject sessions whose 20-day window has elapsed
        if session_is_expired(session):
            db.sessions.delete_one({"_id": session["_id"]})
            return jsonify({
                "success": False,
                "message": "Session expired. Please log in again."
            }), 401

        request.current_user = payload
        return f(*args, **kwargs)

    return decorated

def require_api_key(f):
    """
    Decorator to protect internal routes via an API Key.
    Checks the X-API-KEY header against the N8N_API_KEY env var.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        api_key = request.headers.get("X-API-KEY")
        expected_key = os.environ.get("N8N_API_KEY", "default_secret_n8n_key")
        
        if not api_key or api_key != expected_key:
            return jsonify({
                "success": False,
                "message": "Forbidden: Invalid API Key"
            }), 403
            
        return f(*args, **kwargs)
    return decorated
