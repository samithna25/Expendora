from flask import Blueprint
from app.middleware.auth_middleware import require_auth
from app.controllers.expense_controller import (
    list_expenses,
    create_expense_route,
    get_expense,
    update_expense_route,
    delete_expense_route,
    by_category,
    monthly_trend,
)

expense_bp = Blueprint("expenses", __name__, url_prefix="/expenses")


@expense_bp.route("", methods=["GET"])
@require_auth
def list_all():
    return list_expenses()


@expense_bp.route("", methods=["POST"])
@require_auth
def create():
    return create_expense_route()


@expense_bp.route("/by-category", methods=["GET"])
@require_auth
def category_breakdown():
    return by_category()


@expense_bp.route("/monthly-trend", methods=["GET"])
@require_auth
def trend():
    return monthly_trend()


@expense_bp.route("/<id>", methods=["GET"])
@require_auth
def get_one(id):
    return get_expense()


@expense_bp.route("/<id>", methods=["PUT"])
@require_auth
def update(id):
    return update_expense_route()


@expense_bp.route("/<id>", methods=["DELETE"])
@require_auth
def delete(id):
    return delete_expense_route()


def init_expense_routes(app):
    app.register_blueprint(expense_bp)
