import re
from flask import request, jsonify
from bson import ObjectId
from app.database.db import (
    save_expense,
    get_expenses_by_user,
    get_expense_by_id,
    update_expense,
    delete_expense,
)
from app.models.expense_model import create_expense, serialize_expense

VALID_CATEGORIES = {"Food", "Transport", "Shopping", "Bills", "Entertainment", "Other"}
DATE_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def _get_user_id():
    return request.current_user["user_id"]


def _validate_expense_input(data, require_all=True):
    errors = {}

    if require_all or "merchant" in data:
        merchant = data.get("merchant")
        if not merchant or not str(merchant).strip():
            errors["merchant"] = "Merchant is required and must be a non-empty string."

    if require_all or "amount" in data:
        amount = data.get("amount")
        if amount is None:
            errors["amount"] = "Amount is required."
        else:
            try:
                amount = float(amount)
                if amount <= 0:
                    errors["amount"] = "Amount must be a positive number."
            except (ValueError, TypeError):
                errors["amount"] = "Amount must be a valid number."

    if require_all or "category" in data:
        category = data.get("category")
        if not category:
            errors["category"] = "Category is required."
        elif category not in VALID_CATEGORIES:
            errors["category"] = f"Category must be one of: {', '.join(sorted(VALID_CATEGORIES))}."

    if require_all or "date" in data:
        date = data.get("date")
        if not date:
            errors["date"] = "Date is required."
        elif not DATE_PATTERN.match(str(date)):
            errors["date"] = "Date must be in YYYY-MM-DD format."

    return errors


def list_expenses():
    user_id = _get_user_id()
    category = request.args.get("category")
    month = request.args.get("month")
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    payment_method = request.args.get("payment_method")
    sort = request.args.get("sort", "date")
    order = request.args.get("order", "desc")
    page = int(request.args.get("page", 1))
    limit = min(int(request.args.get("limit", 20)), 100)

    sort_field = "date" if sort == "date" else "amount"
    sort_order = -1 if order == "desc" else 1

    filters = {}
    if category:
        filters["category"] = category
    if month:
        filters["month"] = month
    if start_date:
        filters["start_date"] = start_date
    if end_date:
        filters["end_date"] = end_date
    if payment_method:
        filters["payment_method"] = payment_method

    try:
        expenses, total = get_expenses_by_user(
            user_id, filters=filters, sort_field=sort_field,
            sort_order=sort_order, page=page, limit=limit
        )
    except Exception:
        return jsonify({"status": "error", "message": "Failed to fetch expenses"}), 500

    total_pages = max(1, (total + limit - 1) // limit)

    return jsonify({
        "status": "success",
        "data": {
            "expenses": [serialize_expense(e) for e in expenses],
            "pagination": {
                "page": page,
                "limit": limit,
                "total_results": total,
                "total_pages": total_pages,
            },
        }
    }), 200


def create_expense_route():
    user_id = _get_user_id()
    data = request.get_json(silent=True)

    if data is None:
        return jsonify({"status": "error", "message": "Request body is required."}), 400

    errors = _validate_expense_input(data, require_all=True)
    if errors:
        return jsonify({
            "status": "error",
            "message": "Validation failed.",
            "errors": errors,
        }), 400

    expense_doc = create_expense(
        user_id=user_id,
        merchant=str(data["merchant"]).strip(),
        amount=float(data["amount"]),
        category=data["category"],
        date=data["date"],
        receipt_id=data.get("receiptId") or data.get("receipt_id"),
        currency=data.get("currency"),
        payment_method=data.get("payment_method") or data.get("paymentMethod"),
        notes=data.get("notes"),
    )

    try:
        expense_id = save_expense(expense_doc)
    except Exception:
        return jsonify({"status": "error", "message": "Failed to save expense."}), 500

    expense_doc["_id"] = ObjectId(expense_id)

    try:
        from app.database.db import get_db
        from app.services.analytics_service import get_dashboard_analytics
        from app.services.n8n_service import trigger_budget_alert_webhook
        from datetime import datetime

        db = get_db()
        if db is not None:
            user = db["users"].find_one({"_id": ObjectId(user_id)})
            if user and user.get("email"):
                current_month = datetime.utcnow().strftime("%Y-%m")
                analytics = get_dashboard_analytics(user_id, current_month)
                budget_status = analytics.get("budget_status", {})
                limit = budget_status.get("monthly_limit") or analytics.get("monthly_total", 0)
                spent = budget_status.get("monthly_spent", analytics.get("monthly_total", 0))
                percentage = budget_status.get("percentage_used")
                if percentage is None and limit > 0:
                    percentage = round((spent / limit) * 100, 1)

                if limit > 0 and percentage is not None and percentage >= 75:
                    trigger_budget_alert_webhook(
                        user_id=user_id,
                        email=user["email"],
                        budget=limit,
                        spent=spent,
                        percentage=percentage,
                    )
    except Exception as e:
        print(f"Error triggering budget alert: {e}")

    return jsonify({
        "status": "success",
        "message": "Expense created successfully.",
        "data": serialize_expense(expense_doc),
    }), 201


def get_expense():
    user_id = _get_user_id()
    expense_id = request.view_args.get("id")

    try:
        expense = get_expense_by_id(expense_id)
    except Exception:
        return jsonify({"status": "error", "message": "Expense not found."}), 404

    if not expense:
        return jsonify({"status": "error", "message": "Expense not found."}), 404

    if str(expense["userId"]) != user_id:
        return jsonify({"status": "error", "message": "Forbidden: this expense does not belong to you."}), 403

    return jsonify({
        "status": "success",
        "data": serialize_expense(expense),
    }), 200


def update_expense_route():
    user_id = _get_user_id()
    expense_id = request.view_args.get("id")
    data = request.get_json(silent=True)

    if data is None:
        return jsonify({"status": "error", "message": "Request body is required."}), 400

    try:
        expense = get_expense_by_id(expense_id)
    except Exception:
        return jsonify({"status": "error", "message": "Expense not found."}), 404

    if not expense:
        return jsonify({"status": "error", "message": "Expense not found."}), 404

    if str(expense["userId"]) != user_id:
        return jsonify({"status": "error", "message": "Forbidden: this expense does not belong to you."}), 403

    errors = _validate_expense_input(data, require_all=False)
    if errors:
        return jsonify({
            "status": "error",
            "message": "Validation failed.",
            "errors": errors,
        }), 400

    update_data = {}
    for field in ("merchant", "amount", "category", "date",
                  "currency", "paymentMethod", "payment_method", "notes"):
        if field in data:
            value = data[field]
            if field == "payment_method":
                update_data["paymentMethod"] = value
            elif field == "paymentMethod":
                update_data["paymentMethod"] = value
            else:
                update_data[field] = value

    if "merchant" in update_data:
        update_data["merchant"] = str(update_data["merchant"]).strip()
    if "amount" in update_data:
        update_data["amount"] = float(update_data["amount"])

    if "receiptId" in data:
        update_data["receiptId"] = data["receiptId"]
    if "receipt_id" in data:
        update_data["receiptId"] = data["receipt_id"]

    if not update_data:
        return jsonify({"status": "error", "message": "No valid fields to update."}), 400

    try:
        modified = update_expense(expense_id, update_data)
    except Exception:
        return jsonify({"status": "error", "message": "Failed to update expense."}), 500

    if modified == 0:
        return jsonify({"status": "error", "message": "No changes made."}), 200

    updated = get_expense_by_id(expense_id)

    return jsonify({
        "status": "success",
        "message": "Expense updated successfully.",
        "data": serialize_expense(updated),
    }), 200


def by_category():
    user_id = _get_user_id()
    from app.database.db import get_db
    db = get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not connected."}), 500

    try:
        pipeline = [
            {"$match": {"userId": ObjectId(user_id)}},
            {"$group": {
                "_id": "$category",
                "total": {"$sum": "$amount"},
                "count": {"$sum": 1},
            }},
            {"$sort": {"total": -1}},
        ]
        results = list(db["expenses"].aggregate(pipeline))
    except Exception:
        return jsonify({"status": "error", "message": "Failed to aggregate expenses."}), 500

    categories = [
        {"category": r["_id"], "total": r["total"], "count": r["count"]}
        for r in results
    ]

    return jsonify({"status": "success", "data": {"categories": categories}}), 200


def monthly_trend():
    user_id = _get_user_id()
    from app.database.db import get_db
    db = get_db()
    if db is None:
        return jsonify({"status": "error", "message": "Database not connected."}), 500

    try:
        pipeline = [
            {"$match": {"userId": ObjectId(user_id)}},
            {"$group": {
                "_id": {"$substr": ["$date", 0, 7]},
                "total": {"$sum": "$amount"},
                "count": {"$sum": 1},
            }},
            {"$sort": {"_id": 1}},
        ]
        results = list(db["expenses"].aggregate(pipeline))
    except Exception:
        return jsonify({"status": "error", "message": "Failed to aggregate expenses."}), 500

    months = [
        {"month": r["_id"], "total": r["total"], "count": r["count"]}
        for r in results
    ]

    return jsonify({"status": "success", "data": {"months": months}}), 200


def delete_expense_route():
    user_id = _get_user_id()
    expense_id = request.view_args.get("id")

    try:
        expense = get_expense_by_id(expense_id)
    except Exception:
        return jsonify({"status": "error", "message": "Expense not found."}), 404

    if not expense:
        return jsonify({"status": "error", "message": "Expense not found."}), 404

    if str(expense["userId"]) != user_id:
        return jsonify({"status": "error", "message": "Forbidden: this expense does not belong to you."}), 403

    try:
        deleted = delete_expense(expense_id)
    except Exception:
        return jsonify({"status": "error", "message": "Failed to delete expense."}), 500

    if deleted == 0:
        return jsonify({"status": "error", "message": "Expense not found."}), 404

    return jsonify({
        "status": "success",
        "message": "Expense deleted successfully.",
    }), 200
