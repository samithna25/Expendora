from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash
from bson import ObjectId
from app.database.db import get_db
from app.models.user_model import create_user
from app.utils.jwt_utils import generate_token
from flask import jsonify, request
import re

def validate_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    return len(password) >= 6

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