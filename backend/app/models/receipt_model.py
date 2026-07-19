from datetime import datetime, timezone
from bson import ObjectId


def create_receipt(user_id, image_url=None, public_id=None, original_filename=None,
                   amount=None, category=None, description=None, date=None):
    return {
        "user_id":           ObjectId(user_id),
        "image_url":         image_url,
        "public_id":         public_id,
        "original_filename": original_filename,
        "amount":            amount,
        "category":          category,
        "description":       description,
        "date":              date,
        "uploaded_at":       datetime.now(timezone.utc),
    }
