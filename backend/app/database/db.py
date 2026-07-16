from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from app.config.config import Config

# Global database variable
db = None

def connect_db():
    global db
    try:
        client = MongoClient(
            Config.MONGO_URI,
            serverSelectionTimeoutMS=5000,
            tlsAllowInvalidCertificates=True  # Fix for SSL cert issues on Windows
        )
        # Ping the server to verify the connection
        client.admin.command("ping")
        db = client.get_database("expendora")
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
