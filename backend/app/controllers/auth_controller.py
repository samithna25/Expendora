from werkzeug.security import generate_password_hash, check_password_hash
from app.database.db import get_db
from flask import jsonify
import re
from datetime import datetime

def validate_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    return len(password) >= 8 and any(c.isupper() for c in password)

def register_user(data):
    if not data or 'email' not in data or 'password' not in data:
        return jsonify({
            'status': 'error',
            'message': 'Email and password are required'
        }), 400

    email = data['email']
    password = data['password']

    if not validate_email(email):
        return jsonify({
            'status': 'error',
            'message': 'Invalid email format'
        }), 400

    if not validate_password(password):
        return jsonify({
            'status': 'error',
            'message': 'Password must be at least 8 characters and include an uppercase letter'
        }), 400

    db = get_db()
    if db and db.users.find_one({'email': email}):
        return jsonify({
            'status': 'error',
            'message': 'User already exists'
        }), 409

    hashed_password = generate_password_hash(password)
    user_data = {
        'email': email,
        'password': hashed_password,
        'created_at': datetime.utcnow()
    }

    if db:
        db.users.insert_one(user_data)

    return jsonify({
        'status': 'success',
        'message': 'User registered successfully',
        'data': {
            'email': email
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
    if db:
        user = db.users.find_one({'email': email})
        if user and check_password_hash(user['password'], password):
            return jsonify({
                'status': 'success',
                'message': 'Login successful',
                'data': {
                    'email': email
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