from flask import Blueprint, request, jsonify, render_template_string
from urllib.parse import quote
from app.controllers.auth_controller import (
    register_user,
    login_user,
    get_profile_data,
    update_profile,
    upload_profile_picture,
    logout_user,
    forgot_password,
    reset_password,
    change_password,
)
from app.middleware.auth_middleware import require_auth
from datetime import datetime
from app.config.config import Config

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    return register_user(data)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    return login_user(data)

@auth_bp.route('/profile', methods=['GET'])
@require_auth
def get_profile():
    return get_profile_data()

@auth_bp.route('/profile', methods=['PUT'])
@require_auth
def profile():
    data = request.get_json()
    return update_profile(data)

@auth_bp.route('/profile/picture', methods=['POST'])
@require_auth
def profile_picture():
    return upload_profile_picture()

@auth_bp.route('/logout', methods=['POST'])
@require_auth
def logout():
    return logout_user()

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password_route():
    data = request.get_json()
    return forgot_password(data)

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password_route():
    data = request.get_json()
    return reset_password(data)

@auth_bp.route('/change-password', methods=['PUT'])
@require_auth
def change_password_route():
    data = request.get_json()
    return change_password(data)

@auth_bp.route('/reset-redirect', methods=['GET'])
def reset_redirect():
    """GET /auth/reset-redirect?token=<TOKEN>
    Email clients block custom URI schemes (expendora://) in <a> tags.
    This endpoint accepts a normal http:// link, then shows a real tap target
    that opens the app. Some browsers block automatic custom-scheme redirects
    after Gmail/Google tracking redirects.
    """
    token = quote(request.args.get('token', ''), safe='')
    frontend_url = (Config.FRONTEND_URL or 'expendora://').strip()
    if frontend_url.endswith('://'):
        deep_link = f'{frontend_url}reset-password?token={token}'
    else:
        deep_link = f"{frontend_url.rstrip('/')}/reset-password?token={token}"
    return render_template_string(
        """
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Open Expendora</title>
            <style>
              body {
                margin: 0;
                min-height: 100vh;
                display: grid;
                place-items: center;
                background: #0A0A0F;
                color: #FFFFFF;
                font-family: Arial, Helvetica, sans-serif;
              }
              main {
                width: min(420px, calc(100vw - 40px));
                text-align: center;
              }
              h1 {
                margin: 0 0 10px;
                font-size: 24px;
              }
              p {
                margin: 0 0 24px;
                color: rgba(255, 255, 255, 0.68);
                line-height: 1.5;
              }
              a.button {
                display: block;
                border-radius: 12px;
                background: #FACC15;
                color: #0A0A0A;
                font-weight: 700;
                padding: 16px 20px;
                text-decoration: none;
              }
              .hint {
                margin-top: 18px;
                font-size: 12px;
                color: rgba(255, 255, 255, 0.45);
                word-break: break-all;
              }
            </style>
            <script>
              window.addEventListener('load', function () {
                setTimeout(function () {
                  window.location.href = {{ deep_link|tojson }};
                }, 250);
              });
            </script>
          </head>
          <body>
            <main>
              <h1>Open Expendora</h1>
              <p>Tap the button below to continue resetting your password in the app.</p>
              <a class="button" href="{{ deep_link }}">Open Reset Password</a>
              <p class="hint">{{ deep_link }}</p>
            </main>
          </body>
        </html>
        """,
        deep_link=deep_link,
    )

def init_routes(app):
    app.register_blueprint(auth_bp)
