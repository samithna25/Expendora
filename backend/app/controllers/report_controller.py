import logging
from flask import request, jsonify
from app.services.analytics_service import (
    get_dashboard_analytics,
    get_historical_monthly_trend,
)

logger = logging.getLogger(__name__)


def _get_user_id():
    return request.current_user["user_id"]


def get_dashboard_data():
    """
    GET /reports/dashboard
    Returns comprehensive aggregated metrics:
    - Monthly total, daily average, top spending category
    - Category distribution breakdown
    - Daily spending trend
    - Overspending alerts & budget threshold status
    """
    user_id = _get_user_id()
    month = request.args.get("month")
    budget = request.args.get("budget", type=float)

    try:
        data = get_dashboard_analytics(user_id=user_id, month=month, total_monthly_limit=budget)
        return jsonify({
            "status": "success",
            "message": "Dashboard analytics retrieved successfully.",
            "data": data,
        }), 200
    except Exception as e:
        logger.error("[get_dashboard_data] Aggregation failed: %s", e)
        return jsonify({
            "status": "error",
            "message": "Failed to generate dashboard analytics.",
        }), 500


def get_reports_summary():
    """
    GET /reports/summary
    Returns analytics payload formatted for reporting views.
    Includes historical monthly trend and category breakdowns.
    """
    user_id = _get_user_id()
    month = request.args.get("month")
    limit = int(request.args.get("trend_limit", 6))

    try:
        dashboard_data = get_dashboard_analytics(user_id=user_id, month=month)
        historical_trend = get_historical_monthly_trend(user_id=user_id, limit=limit)

        return jsonify({
            "status": "success",
            "data": {
                "summary": {
                    "monthly_total": dashboard_data["monthly_total"],
                    "daily_average": dashboard_data["daily_average"],
                    "transaction_count": dashboard_data["transaction_count"],
                    "top_category": dashboard_data["top_category"],
                    "budget_status": dashboard_data["budget_status"],
                },
                "category_breakdown": dashboard_data["category_breakdown"],
                "monthly_trend": historical_trend,
                "alerts": dashboard_data["alerts"],
                "insights": dashboard_data["insights"],
            }
        }), 200
    except Exception as e:
        logger.error("[get_reports_summary] Exception: %s", e)
        return jsonify({
            "status": "error",
            "message": "Failed to generate reports summary.",
        }), 500


def get_historical_trend():
    """
    GET /reports/monthly-trend
    Returns historical monthly trend array for line charts.
    """
    user_id = _get_user_id()
    limit = int(request.args.get("limit", 6))

    try:
        trend = get_historical_monthly_trend(user_id=user_id, limit=limit)
        return jsonify({
            "status": "success",
            "data": {
                "months": trend,
            }
        }), 200
    except Exception as e:
        logger.error("[get_historical_trend] Exception: %s", e)
        return jsonify({
            "status": "error",
            "message": "Failed to fetch monthly trend data.",
        }), 500
