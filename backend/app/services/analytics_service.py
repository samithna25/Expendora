import calendar
from datetime import datetime, timezone
from bson import ObjectId
from app.database.db import get_db

# Default budget thresholds (in base currency, e.g., LKR / USD)
DEFAULT_BUDGET_LIMITS = {
    "total": 150000.0,
    "Food": 50000.0,
    "Transport": 25000.0,
    "Shopping": 30000.0,
    "Bills": 40000.0,
    "Entertainment": 15000.0,
    "Other": 10000.0,
}


def get_dashboard_analytics(user_id: str, month: str = None, total_monthly_limit: float = None) -> dict:
    """
    Calculate comprehensive dashboard metrics using MongoDB aggregation.
    - Monthly total spending & transaction count
    - Daily average spending
    - Category breakdown (total, count, percentage)
    - Top spending category
    - Daily spending trend
    - Overspending alerts & budget status
    """
    db = get_db()
    if db is None:
        raise Exception("Database not connected.")

    now = datetime.now(timezone.utc)
    if not month:
        month = now.strftime("%Y-%m")

    try:
        year, month_num = map(int, month.split("-"))
        days_in_month = calendar.monthrange(year, month_num)[1]
    except (ValueError, TypeError):
        year, month_num = now.year, now.month
        month = now.strftime("%Y-%m")
        days_in_month = calendar.monthrange(year, month_num)[1]

    user_obj_id = ObjectId(user_id)

    # 1. Total monthly expenditure & transaction count
    total_pipeline = [
        {"$match": {"userId": user_obj_id, "date": {"$regex": f"^{month}"}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}, "count": {"$sum": 1}}},
    ]
    total_res = list(db["expenses"].aggregate(total_pipeline))
    monthly_total = float(total_res[0]["total"]) if total_res else 0.0
    transaction_count = int(total_res[0]["count"]) if total_res else 0

    # 2. Daily average calculation
    if month == now.strftime("%Y-%m"):
        days_elapsed = max(1, now.day)
    else:
        days_elapsed = days_in_month
    daily_average = round(monthly_total / days_elapsed, 2)

    # 3. Category breakdown
    cat_pipeline = [
        {"$match": {"userId": user_obj_id, "date": {"$regex": f"^{month}"}}},
        {
            "$group": {
                "_id": "$category",
                "total": {"$sum": "$amount"},
                "count": {"$sum": 1},
            }
        },
        {"$sort": {"total": -1}},
    ]
    cat_res = list(db["expenses"].aggregate(cat_pipeline))

    category_breakdown = []
    top_category = None

    for idx, item in enumerate(cat_res):
        cat_name = item["_id"] or "Other"
        cat_total = float(item["total"])
        pct = round((cat_total / monthly_total * 100), 1) if monthly_total > 0 else 0.0
        entry = {
            "category": cat_name,
            "total": round(cat_total, 2),
            "count": item["count"],
            "percentage": pct,
        }
        category_breakdown.append(entry)
        if idx == 0:
            top_category = entry

    # 4. Daily spending breakdown for line / bar charts
    daily_pipeline = [
        {"$match": {"userId": user_obj_id, "date": {"$regex": f"^{month}"}}},
        {"$group": {"_id": "$date", "total": {"$sum": "$amount"}, "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}},
    ]
    daily_res = list(db["expenses"].aggregate(daily_pipeline))
    daily_trend = [
        {"date": item["_id"], "total": round(float(item["total"]), 2), "count": item["count"]}
        for item in daily_res
    ]

    # 5. Overspending alerts & budget thresholds
    # Allow query-param override; fall back to user's stored budget; fall back to default
    effective_monthly_limit = total_monthly_limit
    if effective_monthly_limit is None:
        user_doc = db["users"].find_one({"_id": user_obj_id}, {"monthly_budget": 1})
        if user_doc and user_doc.get("monthly_budget"):
            effective_monthly_limit = float(user_doc["monthly_budget"])

    custom_limits = {"total": effective_monthly_limit} if effective_monthly_limit is not None else None
    alerts, budget_status = calculate_budget_alerts(monthly_total, category_breakdown, custom_limits=custom_limits)

    # 6. Natural language spending insights
    insights = generate_insights(monthly_total, top_category, alerts, monthly_limit=budget_status.get("monthly_limit"))

    return {
        "month": month,
        "monthly_total": round(monthly_total, 2),
        "transaction_count": transaction_count,
        "daily_average": daily_average,
        "top_category": top_category,
        "category_breakdown": category_breakdown,
        "daily_trend": daily_trend,
        "budget_status": budget_status,
        "alerts": alerts,
        "insights": insights,
    }


def get_historical_monthly_trend(user_id: str, limit: int = 6) -> list:
    """
    Returns aggregated spending grouped by YYYY-MM for the last N months.
    Used for historical trend charts.
    """
    db = get_db()
    if db is None:
        raise Exception("Database not connected.")

    pipeline = [
        {"$match": {"userId": ObjectId(user_id)}},
        {
            "$group": {
                "_id": {"$substr": ["$date", 0, 7]},
                "total": {"$sum": "$amount"},
                "count": {"$sum": 1},
            }
        },
        {"$sort": {"_id": 1}},
        {"$limit": limit},
    ]
    results = list(db["expenses"].aggregate(pipeline))

    return [
        {
            "month": item["_id"],
            "total": round(float(item["total"]), 2),
            "count": item["count"],
        }
        for item in results
    ]


def calculate_budget_alerts(monthly_total: float, category_breakdown: list, custom_limits: dict = None) -> tuple:
    """
    Calculates overall and per-category budget status and generates overspending alerts.
    - WARNING: spending >= 75% of budget threshold
    - EXCEEDED: spending >= 100% of budget threshold
    """
    limits = {**DEFAULT_BUDGET_LIMITS, **(custom_limits or {})}
    alerts = []

    # Overall monthly budget check
    total_limit = limits.get("total", 150000.0)
    total_pct = round((monthly_total / total_limit * 100), 1) if total_limit > 0 else 0.0

    if monthly_total >= total_limit:
        alerts.append({
            "type": "OVERALL_EXCEEDED",
            "level": "EXCEEDED",
            "category": "Overall",
            "spent": round(monthly_total, 2),
            "limit": total_limit,
            "percentage": total_pct,
            "message": f"Overall monthly budget exceeded! Spent {total_pct}% of threshold ({monthly_total:.2f} / {total_limit:.2f}).",
        })
    elif monthly_total >= (total_limit * 0.75):
        alerts.append({
            "type": "OVERALL_WARNING",
            "level": "WARNING",
            "category": "Overall",
            "spent": round(monthly_total, 2),
            "limit": total_limit,
            "percentage": total_pct,
            "message": f"Overall monthly budget near limit! Reached {total_pct}% of threshold.",
        })

    # Category budget check
    category_spending_map = {item["category"]: item["total"] for item in category_breakdown}

    for cat_name, cat_limit in limits.items():
        if cat_name == "total":
            continue

        spent = category_spending_map.get(cat_name, 0.0)
        pct = round((spent / cat_limit * 100), 1) if cat_limit > 0 else 0.0

        if spent >= cat_limit:
            alerts.append({
                "type": "CATEGORY_EXCEEDED",
                "level": "EXCEEDED",
                "category": cat_name,
                "spent": round(spent, 2),
                "limit": cat_limit,
                "percentage": pct,
                "message": f"{cat_name} budget exceeded! Spent {pct}% of limit.",
            })
        elif spent >= (cat_limit * 0.75):
            alerts.append({
                "type": "CATEGORY_WARNING",
                "level": "WARNING",
                "category": cat_name,
                "spent": round(spent, 2),
                "limit": cat_limit,
                "percentage": pct,
                "message": f"{cat_name} is near budget limit ({pct}% spent).",
            })

    budget_status = {
        "monthly_limit": total_limit,
        "monthly_spent": round(monthly_total, 2),
        "remaining": round(max(0.0, total_limit - monthly_total), 2),
        "percentage_used": total_pct,
        "is_over_budget": monthly_total >= total_limit,
    }

    return alerts, budget_status


def generate_insights(monthly_total: float, top_category: dict, alerts: list, monthly_limit: float = None) -> str:
    """Generates dynamic analytical text insights for the user."""
    if monthly_total == 0:
        return "No expenses recorded for this period yet. Start adding transactions to view analytics."

    if top_category:
        limit = monthly_limit or monthly_total
        pct = round((top_category["total"] / limit) * 100, 1) if limit > 0 else 0.0
        return f"{top_category['category']} is your highest spending category ({pct}% of total monthly budget)."

    exceeded_alerts = [a for a in alerts if a["level"] == "EXCEEDED"]
    if exceeded_alerts:
        return f"Budget Alert: You have exceeded budget limits in {len(exceeded_alerts)} areas."

    return f"Total spending for this period is {monthly_total:.2f} across all categories."
