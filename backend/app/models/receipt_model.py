from datetime import datetime, timezone
from bson import ObjectId


def create_receipt(user_id, secure_url, public_id, original_filename):
    return {
        "user_id":           ObjectId(user_id),           
        "image_url":         secure_url,                   
        "public_id":         public_id,                    
        "original_filename": original_filename,            
        "amount":            None,                        
        "category":          None,                         
        "description":       None,                         
        "date":              None,                         
        "uploaded_at":       datetime.now(timezone.utc),   
    }
