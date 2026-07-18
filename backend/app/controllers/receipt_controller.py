import os
import uuid
import logging
from flask import request, jsonify
from werkzeug.utils import secure_filename
from app.utils.validators import is_file_present, allowed_file, is_valid_file_size
from app.services.ocr_service import run_ocr
from app.services.receipt_parser import parse_receipt_text
from app.services.category_mapper import map_category
from app.services.cloudinary_service import upload_receipt_image
from app.models.receipt_model import create_receipt
from app.database.db import save_receipt

logger = logging.getLogger(__name__)

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'uploads')


def upload_receipt():
    if not is_file_present(request.files):
        return jsonify({'status': 'error', 'message': 'No file provided'}), 400

    file = request.files['file']

    if not allowed_file(file.filename):
        return jsonify({
            'status': 'error',
            'message': 'Invalid file type. Allowed: png, jpg, jpeg, gif, bmp, tiff, webp'
        }), 400

    if not is_valid_file_size(file):
        return jsonify({
            'status': 'error',
            'message': 'File size exceeds 10 MB limit'
        }), 400

    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    original_filename = secure_filename(file.filename)
    unique_id = uuid.uuid4().hex
    saved_filename = f"{unique_id}_{original_filename}"
    file_path = os.path.join(UPLOAD_FOLDER, saved_filename)
    file.save(file_path)

    user_id = request.current_user['user_id']

    ocr_result = run_ocr(file_path)
    raw_text = None
    parsed = {"merchant_name": None, "amount": None, "currency": "MYR", "date": None}

    if ocr_result.get("success"):
        raw_text = ocr_result["raw_text"]
        parsed = parse_receipt_text(raw_text)
        logger.info(
            "[upload_receipt] Parsed: merchant='%s', amount=%s, date='%s'",
            parsed["merchant_name"], parsed["amount"], parsed["date"]
        )
    else:
        logger.warning("[upload_receipt] OCR failed: %s", ocr_result.get("error"))

    try:
        cloudinary_data = upload_receipt_image(file_path)
    except Exception as e:
        logger.error("[upload_receipt] Cloudinary upload failed: %s", e)
        if os.path.exists(file_path):
            os.remove(file_path)
        return jsonify({'status': 'error', 'message': 'Image upload failed'}), 500

    category = map_category(parsed["merchant_name"], parsed.get("items_context"))

    receipt_doc = create_receipt(
        user_id=user_id,
        image_url=cloudinary_data["secure_url"],
        public_id=cloudinary_data["public_id"],
        original_filename=original_filename,
        amount=parsed["amount"],
        category=category,
        description=parsed["merchant_name"],
        date=parsed["date"],
    )

    try:
        receipt_id = save_receipt(receipt_doc)
    except Exception as e:
        logger.error("[upload_receipt] DB save failed: %s", e)
        return jsonify({
            'status': 'error',
            'message': 'Failed to save receipt record'
        }), 500

    return jsonify({
        'status': 'success',
        'message': 'Receipt processed successfully',
        'data': {
            'receipt_id': receipt_id,
            'image_url': cloudinary_data["secure_url"],
            'original_filename': original_filename,
            'merchant_name': parsed["merchant_name"],
            'amount': parsed["amount"],
            'currency': parsed["currency"],
            'date': parsed["date"],
            'category': category,
        }
    }), 201
