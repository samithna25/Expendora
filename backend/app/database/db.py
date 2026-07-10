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
