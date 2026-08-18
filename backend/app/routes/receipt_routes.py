from flask import Blueprint
from app.middleware.auth_middleware import require_auth
from app.controllers.receipt_controller import upload_receipt

receipt_bp = Blueprint('receipts', __name__, url_prefix='/receipts')


@receipt_bp.route('/upload', methods=['POST'])
@require_auth # <-- JWT check via Authorization header

def upload():
    return upload_receipt()


def init_receipt_routes(app):
    app.register_blueprint(receipt_bp)
