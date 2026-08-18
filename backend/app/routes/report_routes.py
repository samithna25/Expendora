from flask import Blueprint
from app.middleware.auth_middleware import require_auth, require_api_key
from app.controllers.report_controller import (
    get_dashboard_data,
    get_reports_summary,
    get_historical_trend,
    get_monthly_batch_data,
    download_monthly_pdf,
    internal_download_monthly_pdf,
)

report_bp = Blueprint("reports", __name__, url_prefix="/reports")


@report_bp.route("/dashboard", methods=["GET"])
@require_auth
def dashboard():
    return get_dashboard_data()


@report_bp.route("/summary", methods=["GET"])
@require_auth
def summary():
    return get_reports_summary()


@report_bp.route("/monthly-trend", methods=["GET"])
@require_auth
def trend():
    return get_historical_trend()


@report_bp.route("/internal/monthly-batch", methods=["GET"])
@require_api_key
def monthly_batch():
    return get_monthly_batch_data()


@report_bp.route("/internal/pdf", methods=["GET"])
@require_api_key
def internal_generate_pdf():
    return internal_download_monthly_pdf()


@report_bp.route("/pdf", methods=["GET"])
@require_auth
def generate_pdf():
    return download_monthly_pdf()


@report_bp.route("/test-trigger", methods=["GET", "POST"])
def test_trigger():
    """Manual trigger to test the monthly report email job."""
    from app.services.scheduler_service import process_monthly_reports
    from flask import current_app
    
    from datetime import datetime, timezone
    
    current_month = datetime.now(timezone.utc).strftime("%Y-%m")
    # Run synchronously to test, forcing current month so there is data!
    process_monthly_reports(current_app._get_current_object(), test_month=current_month)
    
    return {"status": "success", "message": "Triggered monthly report job successfully."}


def init_report_routes(app):
    app.register_blueprint(report_bp)
