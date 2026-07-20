from flask import Blueprint
from app.middleware.auth_middleware import require_auth
from app.controllers.report_controller import (
    get_dashboard_data,
    get_reports_summary,
    get_historical_trend,
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


def init_report_routes(app):
    app.register_blueprint(report_bp)
