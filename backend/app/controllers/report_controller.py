import logging
from datetime import datetime, timezone, timedelta
from flask import request, jsonify, send_file
from app.database.db import get_db
from app.services.pdf_service import generate_monthly_pdf
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

def get_monthly_batch_data():
    """
    GET /internal/monthly-batch
    Returns aggregated spending metrics for all users for the previous month.
    Designed to be called by n8n scheduled workflow.
    """
    try:
        db = get_db()
        users = list(db["users"].find({}))
        
        # Calculate the previous month (YYYY-MM)
        now = datetime.now(timezone.utc)
        first_day_this_month = now.replace(day=1)
        last_month_date = first_day_this_month - timedelta(days=1)
        target_month = last_month_date.strftime("%Y-%m")
        
        batch_data = []
        for u in users:
            user_id = str(u["_id"])
            budget = float(u.get("monthly_budget")) if u.get("monthly_budget") else None
            try:
                data = get_dashboard_analytics(user_id=user_id, month=target_month, total_monthly_limit=budget)
                batch_data.append({
                    "user_id": user_id,
                    "name": u.get("name", "User"),
                    "email": u.get("email"),
                    "month": target_month,
                    "monthly_total": data.get("monthly_total", 0),
                    "top_category": data.get("top_category"),
                    "budget_status": data.get("budget_status"),
                    "insights": data.get("insights")
                })
            except Exception as e:
                logger.error(f"[get_monthly_batch_data] Error processing user {user_id}: {e}")
                
        return jsonify({
            "status": "success",
            "target_month": target_month,
            "data": batch_data
        }), 200
        
    except Exception as e:
        logger.error("[get_monthly_batch_data] Exception: %s", e)
        return jsonify({
            "status": "error",
            "message": "Failed to generate monthly batch data.",
        }), 500

def download_monthly_pdf():
    """
    GET /reports/pdf
    Generates and returns a PDF of the monthly spending report.
    """
    user_id = _get_user_id()
    month = request.args.get("month")
    budget = request.args.get("budget", type=float)

    try:
        # Get the same analytics data used for the dashboard
        data = get_dashboard_analytics(user_id=user_id, month=month, total_monthly_limit=budget)
        
        # We also need the user's name
        db = get_db()
        from bson import ObjectId
        user = db["users"].find_one({"_id": ObjectId(user_id)})
        user_name = user.get("name", "User") if user else "User"
        
        # Generate the PDF
        actual_month = data.get("month", "Unknown Month")
        pdf_buffer = generate_monthly_pdf(user_name, actual_month, data)
        
        filename = f"Expendora_Report_{actual_month}.pdf"
        
        return send_file(
            pdf_buffer,
            as_attachment=True,
            download_name=filename,
            mimetype='application/pdf'
        )
        
    except Exception as e:
        logger.error("[download_monthly_pdf] Exception: %s", e)
        return jsonify({
            "status": "error",
            "message": "Failed to generate PDF.",
        }), 500
