from datetime import datetime, timezone
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from bson import ObjectId
from app.config.config import Config
from app.models.merchant_model import create_merchant_doc

# Global database variable
db = None

def connect_db():
    global db
    try:
        client = MongoClient(
            Config.MONGO_URI,
            serverSelectionTimeoutMS=5000,
            tlsAllowInvalidCertificates=True
        )
        client.admin.command("ping")
        db = client.get_database("expendora")
        db["merchants"].create_index("name", unique=True)
        db["sessions"].create_index("user_id")
        print("[OK] Connected to MongoDB Atlas")
    except ConnectionFailure as e:
        print(f"[ERROR] Failed to connect to MongoDB Atlas: {e}")

def get_db():
    return db


# ─────────────────────────────────────────────
# Receipt database operations
# ─────────────────────────────────────────────

def save_receipt(receipt_doc):
    if db is None:
        raise Exception("Database not connected. Call connect_db() first.")
    result = db["receipts"].insert_one(receipt_doc)
    return str(result.inserted_id)


def get_receipts_by_user(user_id):
    if db is None:
        raise Exception("Database not connected. Call connect_db() first.")
    receipts = db["receipts"].find(
        {"user_id": user_id}
    ).sort("uploaded_at", -1)
    return list(receipts)


# ─────────────────────────────────────────────
# Merchant database operations
# ─────────────────────────────────────────────

def find_merchant(text: str):
    if db is None:
        return None

    text_lower = text.lower().strip()
    collection = db["merchants"]

    exact = collection.find_one({"name": text_lower})
    if exact:
        return exact

    alias_match = collection.find_one({"aliases": text_lower})
    if alias_match:
        return alias_match

    for merchant in collection.find():
        name = merchant["name"].lower()
        if text_lower == name or name in text_lower or text_lower in name:
            return merchant
        for alias in merchant.get("aliases", []):
            if text_lower == alias or alias in text_lower or text_lower in alias:
                return merchant

    return None


def save_merchant(name: str, aliases: list, category: str):
    if db is None:
        return None

    doc = create_merchant_doc(name, aliases, category)
    try:
        result = db["merchants"].update_one(
            {"name": doc["name"]},
            {"$setOnInsert": doc},
            upsert=True,
        )
        return str(result.upserted_id) if result.upserted_id else None
    except Exception as e:
        print(f"[WARNING] Could not save merchant '{name}': {e}")
        return None


def seed_merchant(name: str, aliases: list, category: str):
    if db is None:
        return False

    doc = create_merchant_doc(name, aliases, category)
    try:
        db["merchants"].update_one(
            {"name": doc["name"]},
            {"$set": doc},
            upsert=True,
        )
        return True
    except Exception:
        return False


# ─────────────────────────────────────────────
# Expense database operations
# ─────────────────────────────────────────────

def save_expense(expense_doc):
    if db is None:
        raise Exception("Database not connected. Call connect_db() first.")
    result = db["expenses"].insert_one(expense_doc)
    return str(result.inserted_id)


def get_expenses_by_user(user_id, filters=None, sort_field="date", sort_order=-1,
                         page=1, limit=20):
    if db is None:
        raise Exception("Database not connected. Call connect_db() first.")

    query = {"userId": ObjectId(user_id)}

    if filters:
        if filters.get("category"):
            query["category"] = filters["category"]
        if filters.get("month"):
            query["date"] = {"$regex": f"^{filters['month']}"}
        if filters.get("start_date") or filters.get("end_date"):
            date_filter = {}
            if filters.get("start_date"):
                date_filter["$gte"] = filters["start_date"]
            if filters.get("end_date"):
                date_filter["$lte"] = filters["end_date"]
            if date_filter:
                query["date"] = date_filter
        if filters.get("payment_method"):
            query["paymentMethod"] = filters["payment_method"]

    total = db["expenses"].count_documents(query)
    expenses = (
        db["expenses"]
        .find(query)
        .sort(sort_field, sort_order)
        .skip((page - 1) * limit)
        .limit(limit)
    )

    return list(expenses), total


def get_expense_by_id(expense_id):
    if db is None:
        raise Exception("Database not connected. Call connect_db() first.")
    return db["expenses"].find_one({"_id": ObjectId(expense_id)})


def update_expense(expense_id, update_data):
    if db is None:
        raise Exception("Database not connected. Call connect_db() first.")
    update_data["updatedAt"] = datetime.now(timezone.utc)
    result = db["expenses"].update_one(
        {"_id": ObjectId(expense_id)},
        {"$set": update_data}
    )
    return result.modified_count


def delete_expense(expense_id):
    if db is None:
        raise Exception("Database not connected. Call connect_db() first.")
    result = db["expenses"].delete_one({"_id": ObjectId(expense_id)})
    return result.deleted_count
