import os
import uuid
from datetime import datetime
from flask import request, jsonify
from werkzeug.utils import secure_filename
from app.utils.validators import is_file_present, allowed_file, is_valid_file_size

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'uploads')


def upload_receipt():
    if not is_file_present(request.files):
        return jsonify({
            'status': 'error',
            'message': 'No file provided'
        }), 400

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

    return jsonify({
        'status': 'success',
        'message': 'Receipt uploaded successfully',
        'data': {
            'original_filename': original_filename,
            'saved_filename': saved_filename,
            'size_bytes': os.path.getsize(file_path),
            'uploaded_at': datetime.utcnow().isoformat()
        }
    }), 201
