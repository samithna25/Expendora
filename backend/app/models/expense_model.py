from datetime import datetime, timezone
from bson import ObjectId


def create_expense(user_id, merchant, amount, category, date,
                   receipt_id=None, currency=None, payment_method=None, notes=None):
    now = datetime.now(timezone.utc)
    return {
        "userId": ObjectId(user_id),
        "merchant": merchant,
        "amount": float(amount),
        "category": category,
        "date": date,
        "receiptId": receipt_id,
        "currency": currency,
        "paymentMethod": payment_method,
        "notes": notes,
        "createdAt": now,
        "updatedAt": now,
    }


def serialize_expense(doc):
    return {
        "id": str(doc["_id"]),
        "userId": str(doc["userId"]),
        "merchant": doc["merchant"],
        "amount": doc["amount"],
        "category": doc["category"],
        "date": doc["date"],
        "receiptId": doc.get("receiptId"),
        "currency": doc.get("currency"),
        "paymentMethod": doc.get("paymentMethod"),
        "notes": doc.get("notes"),
        "createdAt": doc["createdAt"].isoformat() if isinstance(doc["createdAt"], datetime) else doc["createdAt"],
        "updatedAt": doc["updatedAt"].isoformat() if isinstance(doc["updatedAt"], datetime) else doc["updatedAt"],
    }
