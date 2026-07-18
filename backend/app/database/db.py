from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
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
            {"$setOnInsert": doc},
            upsert=True,
        )
        return True
    except Exception:
        return False
