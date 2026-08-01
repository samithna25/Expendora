import hashlib
import re
import secrets
from datetime import datetime, timedelta, timezone

from bson import ObjectId
from flask import jsonify, request
from werkzeug.security import check_password_hash, generate_password_hash

from app.database.db import get_db
from app.models.user_model import create_user
from app.services.n8n_service import trigger_password_reset_email
from app.utils.jwt_utils import generate_token
from app.utils.password_utils import hash_password
import os
import requests
import threading

def validate_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    return len(password) >= 6


def validate_reset_password(password):
    return len(password) >= 8


FORGOT_PASSWORD_MESSAGE = (
    "If this email is registered, a password reset link has been sent."
)
def trigger_welcome_email(user_id, name, email):
    """Fire-and-forget: POST to n8n welcome email webhook in a background thread."""
    def _send():
        try:
            webhook_url = os.getenv('N8N_WEBHOOK_WELCOME', 'http://localhost:5678/webhook/expendora-welcome')
            payload = {
                'userId': user_id,
                'name': name,
                'email': email
            }
            print(f"[n8n] Triggering welcome email webhook → {webhook_url}")
            response = requests.post(webhook_url, json=payload, timeout=5)
            print(f"[n8n] Webhook response: {response.status_code} {response.text}")
        except Exception as e:
            print(f"[n8n] Webhook failed: {e}")
    threading.Thread(target=_send, daemon=True).start()

def register_user(data):
    if not data or 'email' not in data or 'password' not in data:
        return jsonify({
            'status': 'error',
            'message': 'Email and password are required'
        }), 400

    email = data['email']
    password = data['password']
    name = data.get('name', '')

    if not validate_email(email):
        return jsonify({
            'status': 'error',
            'message': 'Invalid email format'
        }), 400

    if not validate_password(password):
        return jsonify({
            'status': 'error',
            'message': 'Password must be at least 6 characters'
        }), 400

    db = get_db()
    if db is not None and db.users.find_one({'email': email}) is not None:
        return jsonify({
            'status': 'error',
            'message': 'User already exists'
        }), 409

    if db is None:
        return jsonify({
            'status': 'error',
            'message': 'Database connection failed'
        }), 500

    hashed_password = generate_password_hash(password)
    user_data = create_user(name, email, hashed_password)
    result = db.users.insert_one(user_data)
    user_id = str(result.inserted_id)

    session_result = db.sessions.insert_one({
        "user_id": ObjectId(user_id),
        "created_at": datetime.now(timezone.utc)
    })
    session_id = str(session_result.inserted_id)
    token = generate_token(user_id, email, session_id=session_id)

    # Trigger n8n welcome email workflow (non-blocking)
    trigger_welcome_email(user_id, name, email)

    return jsonify({
        'status': 'success',
        'message': 'User registered successfully',
        'data': {
            'user': {
                'id': user_id,
                'name': name,
                'email': email
            },
            'token': token
        }
    }), 201

def login_user(data):
    if not data or 'email' not in data or 'password' not in data:
        return jsonify({
            'status': 'error',
            'message': 'Email and password are required'
        }), 400

    email = data['email']
    password = data['password']

    db = get_db()
    if db is not None:
        user = db.users.find_one({'email': email})
        if user and check_password_hash(user['password'], password):
            user_id = str(user['_id'])

            # Delete all existing sessions → only this device stays logged in
            db.sessions.delete_many({"user_id": ObjectId(user_id)})

            session_result = db.sessions.insert_one({
                "user_id": ObjectId(user_id),
                "created_at": datetime.now(timezone.utc)
            })
            session_id = str(session_result.inserted_id)

            name = user.get('name', '')
            token = generate_token(user_id, email, session_id=session_id)
            return jsonify({
                'status': 'success',
                'message': 'Login successful',
                'data': {
                    'user': {
                        'id': user_id,
                        'name': name,
                        'email': email,
                        'monthly_budget': user.get('monthly_budget'),
                    },
                    'token': token
                }
            }), 200
        else:
            return jsonify({
                'status': 'error',
                'message': 'Invalid credentials'
            }), 401
    else:
        return jsonify({
            'status': 'error',
            'message': 'Database connection failed'
        }), 500


def get_profile_data():
    """GET /auth/profile — return the authenticated user's profile data."""
    user_id = request.current_user["user_id"]
    db = get_db()
    if db is None:
        return jsonify({'status': 'error', 'message': 'Database connection failed'}), 500

    user = db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        return jsonify({'status': 'error', 'message': 'User not found'}), 404

    return jsonify({
        'status': 'success',
        'data': {
            'user': {
                'id': str(user['_id']),
                'name': user.get('name', ''),
                'email': user.get('email', ''),
                'monthly_budget': user.get('monthly_budget'),
            }
        }
    }), 200


def update_profile(data):
    """PUT /auth/profile — update name, monthly_budget, etc."""
    if not data:
        return jsonify({'status': 'error', 'message': 'No data provided'}), 400

    user_id = request.current_user["user_id"]
    db = get_db()
    if db is None:
        return jsonify({'status': 'error', 'message': 'Database connection failed'}), 500

    updates = {}
    if "name" in data:
        updates["name"] = data["name"]
    if "monthly_budget" in data:
        val = data["monthly_budget"]
        updates["monthly_budget"] = float(val) if val is not None else None

    if not updates:
        return jsonify({'status': 'error', 'message': 'No valid fields to update'}), 400

    db.users.update_one({"_id": ObjectId(user_id)}, {"$set": updates})

    user = db.users.find_one({"_id": ObjectId(user_id)})
    return jsonify({
        'status': 'success',
        'message': 'Profile updated',
        'data': {
            'user': {
                'id': str(user['_id']),
                'name': user.get('name', ''),
                'email': user.get('email', ''),
                'monthly_budget': user.get('monthly_budget'),
            }
        }
    }), 200


def logout_user():
    """POST /auth/logout — delete the current session document only."""
    session_id = request.current_user["session_id"]
    db = get_db()
    if db is None:
        return jsonify({'status': 'error', 'message': 'Database connection failed'}), 500

    db.sessions.delete_one({"_id": ObjectId(session_id)})

    return jsonify({
        'status': 'success',
        'message': 'Logged out successfully.'
    }), 200


def forgot_password(data):
    """POST /auth/forgot-password — generate token and trigger n8n reset email."""
    if not data or not data.get("email"):
        return jsonify({
            "success": False,
            "code": "MISSING_FIELDS",
            "message": "Email is required.",
        }), 400

    email = data["email"].strip().lower()

    if not validate_email(email):
        return jsonify({
            "success": False,
            "code": "INVALID_EMAIL",
            "message": "Email address format is invalid.",
        }), 400

    db = get_db()
    if db is not None:
        user = db.users.find_one({"email": email})
        if user:
            plain_token = secrets.token_urlsafe(32)
            token_hash = hashlib.sha256(plain_token.encode()).hexdigest()
            expires_at = datetime.now(timezone.utc) + timedelta(hours=1)

            db.reset_tokens.delete_many({"user_id": user["_id"], "used": False})
            db.reset_tokens.insert_one({
                "user_id": user["_id"],
                "token_hash": token_hash,
                "expires_at": expires_at,
                "used": False,
                "created_at": datetime.now(timezone.utc),
            })

            trigger_password_reset_email(
                email=email,
                reset_token=plain_token,
                expires_at=expires_at.isoformat(),
                user_name=user.get("name", ""),
            )

    return jsonify({
        "success": True,
        "message": FORGOT_PASSWORD_MESSAGE,
    }), 200


def reset_password(data):
    """POST /auth/reset-password — verify token and update password."""
    if not data:
        return jsonify({
            "success": False,
            "code": "MISSING_FIELDS",
            "message": "Reset token and new password are required.",
        }), 400

    reset_token = data.get("reset_token") or data.get("token")
    new_password = data.get("new_password") or data.get("password")

    if not reset_token or not new_password:
        return jsonify({
            "success": False,
            "code": "MISSING_FIELDS",
            "message": "Reset token and new password are required.",
        }), 400

    if not validate_reset_password(new_password):
        return jsonify({
            "success": False,
            "code": "WEAK_PASSWORD",
            "message": "Password must be at least 8 characters.",
        }), 400

    db = get_db()
    if db is None:
        return jsonify({
            "success": False,
            "message": "Database connection failed",
        }), 500

    token_hash = hashlib.sha256(reset_token.encode()).hexdigest()
    token_doc = db.reset_tokens.find_one({
        "token_hash": token_hash,
        "used": False,
        "expires_at": {"$gt": datetime.now(timezone.utc)},
    })

    if not token_doc:
        return jsonify({
            "success": False,
            "code": "INVALID_TOKEN",
            "message": "Reset token is invalid or has expired.",
        }), 400

    db.users.update_one(
        {"_id": token_doc["user_id"]},
        {"$set": {"password": hash_password(new_password)}},
    )
    db.reset_tokens.update_one(
        {"_id": token_doc["_id"]},
        {"$set": {"used": True, "used_at": datetime.now(timezone.utc)}},
    )
    db.sessions.delete_many({"user_id": token_doc["user_id"]})

    return jsonify({
        "success": True,
        "message": "Password has been reset successfully. Please log in.",
    }), 200