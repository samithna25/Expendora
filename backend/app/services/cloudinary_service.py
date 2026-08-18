import os
import cloudinary
import cloudinary.uploader
from app.config.config import Config

cloudinary.config(
    cloud_name=Config.CLOUDINARY_CLOUD_NAME,
    api_key=Config.CLOUDINARY_API_KEY,
    api_secret=Config.CLOUDINARY_API_SECRET,
    secure=True  
)


def upload_receipt_image(file_path):
    try:
        result = cloudinary.uploader.upload(
            file_path,
            folder="expendora/receipts",   
            resource_type="image",         
            overwrite=False,              
        )

        return {
            "secure_url": result["secure_url"],   
            "public_id":  result["public_id"],    
        }

    except Exception as e:
        raise Exception(f"Cloudinary upload failed: {str(e)}")

    finally:
        _delete_temp_file(file_path)


def upload_profile_image(file_path):
    try:
        result = cloudinary.uploader.upload(
            file_path,
            folder="expendora/profiles",
            resource_type="image",
            overwrite=False,
        )

        return {
            "secure_url": result["secure_url"],
            "public_id":  result["public_id"],
        }
    except Exception as e:
        raise Exception(f"Cloudinary profile upload failed: {str(e)}")
    finally:
        _delete_temp_file(file_path)


def delete_receipt_image(public_id):
    try:
        result = cloudinary.uploader.destroy(public_id, resource_type="image")
        return result

    except Exception as e:
        raise Exception(f"Cloudinary deletion failed: {str(e)}")

def _delete_temp_file(file_path):
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except OSError as e:
        print(f"[WARNING] Could not delete temp file '{file_path}': {e}")
