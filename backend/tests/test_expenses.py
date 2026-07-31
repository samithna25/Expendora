import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime, timezone
from bson import ObjectId

from app import create_app


MOCK_USER_ID = "507f1f77bcf86cd799439011"
MOCK_EXPENSE_ID = "507f1f77bcf86cd799439012"

MOCK_SESSION_ID = "507f1f77bcf86cd799439099"


def _mock_payload():
    return {"user_id": MOCK_USER_ID, "email": "test@example.com", "session_id": MOCK_SESSION_ID}


def _fake_expense_doc(overrides=None):
    doc = {
        "_id": ObjectId(MOCK_EXPENSE_ID),
        "userId": ObjectId(MOCK_USER_ID),
        "merchant": "Starbucks KLCC",
        "amount": 18.50,
        "category": "Food",
        "date": "2026-07-07",
        "receiptId": None,
        "currency": "MYR",
        "paymentMethod": "eWallet",
        "notes": "Morning coffee",
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc),
    }
    doc.update(overrides or {})
    return doc


@pytest.fixture
def app():
    app = create_app()
    app.config.update({"TESTING": True})
    return app


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture(autouse=True)
def mock_auth():
    mock_session_doc = {"_id": ObjectId(MOCK_SESSION_ID), "user_id": ObjectId(MOCK_USER_ID)}
    mock_sessions = MagicMock()
    mock_sessions.find_one.return_value = mock_session_doc
    mock_db = MagicMock()
    mock_db.sessions = mock_sessions

    with (
        patch("app.middleware.auth_middleware.verify_token") as mock_verify,
        patch("app.middleware.auth_middleware.get_db", return_value=mock_db),
    ):
        mock_verify.return_value = _mock_payload()
        yield mock_verify


class TestListExpenses:
    def test_success(self, client):
        fake_expenses = [_fake_expense_doc()]
        with patch("app.controllers.expense_controller.get_expenses_by_user") as mock_get:
            mock_get.return_value = (fake_expenses, 1)
            resp = client.get("/expenses", headers={"Authorization": "Bearer testtoken"})

        assert resp.status_code == 200
        data = resp.get_json()
        assert data["status"] == "success"
        assert len(data["data"]["expenses"]) == 1
        assert data["data"]["expenses"][0]["merchant"] == "Starbucks KLCC"
        assert data["data"]["pagination"]["total_results"] == 1

    def test_empty(self, client):
        with patch("app.controllers.expense_controller.get_expenses_by_user") as mock_get:
            mock_get.return_value = ([], 0)
            resp = client.get("/expenses", headers={"Authorization": "Bearer testtoken"})

        assert resp.status_code == 200
        data = resp.get_json()
        assert len(data["data"]["expenses"]) == 0
        assert data["data"]["pagination"]["total_results"] == 0

    def test_with_filters(self, client):
        with patch("app.controllers.expense_controller.get_expenses_by_user") as mock_get:
            mock_get.return_value = ([_fake_expense_doc()], 1)
            resp = client.get(
                "/expenses?category=Food&month=2026-07&sort=amount&order=asc&page=1&limit=10",
                headers={"Authorization": "Bearer testtoken"},
            )

        assert resp.status_code == 200
        mock_get.assert_called_once()
        _args, kwargs = mock_get.call_args
        assert kwargs["filters"]["category"] == "Food"
        assert kwargs["filters"]["month"] == "2026-07"
        assert kwargs["sort_field"] == "amount"
        assert kwargs["sort_order"] == 1
        assert kwargs["page"] == 1
        assert kwargs["limit"] == 10

    def test_database_error(self, client):
        with patch("app.controllers.expense_controller.get_expenses_by_user") as mock_get:
            mock_get.side_effect = Exception("DB error")
            resp = client.get("/expenses", headers={"Authorization": "Bearer testtoken"})

        assert resp.status_code == 500
        assert resp.get_json()["status"] == "error"

    def test_unauthorized(self, client):
        resp = client.get("/expenses")
        assert resp.status_code == 401


class TestCreateExpense:
    valid_payload = {
        "merchant": "Grab Ride",
        "amount": 12.00,
        "category": "Transport",
        "date": "2026-07-08",
        "currency": "MYR",
        "paymentMethod": "eWallet",
        "notes": "Evening ride",
    }

    def test_success(self, client):
        with patch("app.controllers.expense_controller.save_expense") as mock_save:
            mock_save.return_value = MOCK_EXPENSE_ID
            resp = client.post(
                "/expenses",
                json=self.valid_payload,
                headers={"Authorization": "Bearer testtoken"},
            )

        assert resp.status_code == 201
        data = resp.get_json()
        assert data["status"] == "success"
        assert data["message"] == "Expense created successfully."
        assert data["data"]["merchant"] == "Grab Ride"
        assert data["data"]["amount"] == 12.0

    def test_missing_required_fields(self, client):
        resp = client.post(
            "/expenses",
            json={},
            headers={"Authorization": "Bearer testtoken"},
        )

        assert resp.status_code == 400
        data = resp.get_json()
        assert data["status"] == "error"
        assert "merchant" in data["errors"]
        assert "amount" in data["errors"]
        assert "category" in data["errors"]
        assert "date" in data["errors"]

    def test_invalid_amount(self, client):
        payload = {**self.valid_payload, "amount": -5}
        resp = client.post(
            "/expenses",
            json=payload,
            headers={"Authorization": "Bearer testtoken"},
        )

        assert resp.status_code == 400
        assert "amount" in resp.get_json()["errors"]

    def test_invalid_category(self, client):
        payload = {**self.valid_payload, "category": "InvalidCat"}
        resp = client.post(
            "/expenses",
            json=payload,
            headers={"Authorization": "Bearer testtoken"},
        )

        assert resp.status_code == 400
        assert "category" in resp.get_json()["errors"]

    def test_invalid_date_format(self, client):
        payload = {**self.valid_payload, "date": "07-08-2026"}
        resp = client.post(
            "/expenses",
            json=payload,
            headers={"Authorization": "Bearer testtoken"},
        )

        assert resp.status_code == 400
        assert "date" in resp.get_json()["errors"]

    def test_database_error(self, client):
        with patch("app.controllers.expense_controller.save_expense") as mock_save:
            mock_save.side_effect = Exception("DB error")
            resp = client.post(
                "/expenses",
                json=self.valid_payload,
                headers={"Authorization": "Bearer testtoken"},
            )

        assert resp.status_code == 500

    def test_unauthorized(self, client):
        resp = client.post("/expenses", json=self.valid_payload)
        assert resp.status_code == 401


class TestGetExpense:
    def test_success(self, client):
        fake = _fake_expense_doc()
        with patch("app.controllers.expense_controller.get_expense_by_id") as mock_get:
            mock_get.return_value = fake
            resp = client.get(
                f"/expenses/{MOCK_EXPENSE_ID}",
                headers={"Authorization": "Bearer testtoken"},
            )

        assert resp.status_code == 200
        data = resp.get_json()
        assert data["status"] == "success"
        assert data["data"]["merchant"] == "Starbucks KLCC"

    def test_not_found(self, client):
        with patch("app.controllers.expense_controller.get_expense_by_id") as mock_get:
            mock_get.return_value = None
            resp = client.get(
                f"/expenses/{MOCK_EXPENSE_ID}",
                headers={"Authorization": "Bearer testtoken"},
            )

        assert resp.status_code == 404

    def test_forbidden_other_user(self, client):
        other_user_id = "507f1f77bcf86cd799439099"
        fake = _fake_expense_doc({"userId": ObjectId(other_user_id)})
        with patch("app.controllers.expense_controller.get_expense_by_id") as mock_get:
            mock_get.return_value = fake
            resp = client.get(
                f"/expenses/{MOCK_EXPENSE_ID}",
                headers={"Authorization": "Bearer testtoken"},
            )

        assert resp.status_code == 403

    def test_unauthorized(self, client):
        resp = client.get(f"/expenses/{MOCK_EXPENSE_ID}")
        assert resp.status_code == 401


class TestUpdateExpense:
    update_payload = {"merchant": "Grab Malaysia", "amount": 15.00}

    def test_success(self, client):
        fake = _fake_expense_doc()
        with patch("app.controllers.expense_controller.get_expense_by_id") as mock_get:
            mock_get.side_effect = [fake, {**fake, "merchant": "Grab Malaysia", "amount": 15.00}]
            with patch("app.controllers.expense_controller.update_expense") as mock_upd:
                mock_upd.return_value = 1
                resp = client.put(
                    f"/expenses/{MOCK_EXPENSE_ID}",
                    json=self.update_payload,
                    headers={"Authorization": "Bearer testtoken"},
                )

        assert resp.status_code == 200
        data = resp.get_json()
        assert data["status"] == "success"
        assert data["message"] == "Expense updated successfully."

    def test_not_found(self, client):
        with patch("app.controllers.expense_controller.get_expense_by_id") as mock_get:
            mock_get.return_value = None
            resp = client.put(
                f"/expenses/{MOCK_EXPENSE_ID}",
                json=self.update_payload,
                headers={"Authorization": "Bearer testtoken"},
            )

        assert resp.status_code == 404

    def test_forbidden_other_user(self, client):
        other_user_id = "507f1f77bcf86cd799439099"
        fake = _fake_expense_doc({"userId": ObjectId(other_user_id)})
        with patch("app.controllers.expense_controller.get_expense_by_id") as mock_get:
            mock_get.return_value = fake
            resp = client.put(
                f"/expenses/{MOCK_EXPENSE_ID}",
                json=self.update_payload,
                headers={"Authorization": "Bearer testtoken"},
            )

        assert resp.status_code == 403

    def test_invalid_amount(self, client):
        fake = _fake_expense_doc()
        with patch("app.controllers.expense_controller.get_expense_by_id") as mock_get:
            mock_get.return_value = fake
            resp = client.put(
                f"/expenses/{MOCK_EXPENSE_ID}",
                json={"amount": -1},
                headers={"Authorization": "Bearer testtoken"},
            )

        assert resp.status_code == 400
        assert "amount" in resp.get_json()["errors"]

    def test_no_valid_fields(self, client):
        fake = _fake_expense_doc()
        with patch("app.controllers.expense_controller.get_expense_by_id") as mock_get:
            mock_get.return_value = fake
            with patch("app.controllers.expense_controller.update_expense") as mock_upd:
                mock_upd.return_value = 1
                resp = client.put(
                    f"/expenses/{MOCK_EXPENSE_ID}",
                    json={"unknown_field": "val"},
                    headers={"Authorization": "Bearer testtoken"},
                )

        assert resp.status_code == 400

    def test_unauthorized(self, client):
        resp = client.put(f"/expenses/{MOCK_EXPENSE_ID}", json=self.update_payload)
        assert resp.status_code == 401


class TestDeleteExpense:
    def test_success(self, client):
        fake = _fake_expense_doc()
        with patch("app.controllers.expense_controller.get_expense_by_id") as mock_get:
            mock_get.return_value = fake
            with patch("app.controllers.expense_controller.delete_expense") as mock_del:
                mock_del.return_value = 1
                resp = client.delete(
                    f"/expenses/{MOCK_EXPENSE_ID}",
                    headers={"Authorization": "Bearer testtoken"},
                )

        assert resp.status_code == 200
        data = resp.get_json()
        assert data["status"] == "success"
        assert data["message"] == "Expense deleted successfully."

    def test_not_found(self, client):
        with patch("app.controllers.expense_controller.get_expense_by_id") as mock_get:
            mock_get.return_value = None
            resp = client.delete(
                f"/expenses/{MOCK_EXPENSE_ID}",
                headers={"Authorization": "Bearer testtoken"},
            )

        assert resp.status_code == 404

    def test_forbidden_other_user(self, client):
        other_user_id = "507f1f77bcf86cd799439099"
        fake = _fake_expense_doc({"userId": ObjectId(other_user_id)})
        with patch("app.controllers.expense_controller.get_expense_by_id") as mock_get:
            mock_get.return_value = fake
            resp = client.delete(
                f"/expenses/{MOCK_EXPENSE_ID}",
                headers={"Authorization": "Bearer testtoken"},
            )

        assert resp.status_code == 403

    def test_unauthorized(self, client):
        resp = client.delete(f"/expenses/{MOCK_EXPENSE_ID}")
        assert resp.status_code == 401
