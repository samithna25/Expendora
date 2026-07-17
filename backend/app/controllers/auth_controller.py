from werkzeug.security import generate_password_hash, check_password_hash
from app.database.db import get_db
from app.models.user_model import create_user
from app.utils.jwt_utils import generate_token
from flask import jsonify
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

    token = generate_token(user_id, email)

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
            name = user.get('name', '')
            token = generate_token(user_id, email)
            return jsonify({
                'status': 'success',
                'message': 'Login successful',
                'data': {
                    'user': {
                        'id': user_id,
                        'name': name,
                        'email': email
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