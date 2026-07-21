from flask import Blueprint, request, jsonify
from app.controllers.auth_controller import register_user, login_user, update_profile
from app.middleware.auth_middleware import require_auth
from datetime import datetime

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    return register_user(data)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    return login_user(data)

@auth_bp.route('/profile', methods=['PUT'])
@require_auth
def profile():
    data = request.get_json()
    return update_profile(data)

def init_routes(app):
    app.register_blueprint(auth_bp)