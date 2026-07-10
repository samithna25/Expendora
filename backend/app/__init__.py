from flask import Flask, jsonify
from app.database.db import connect_db

def create_app():
    app = Flask(__name__)

    # Connect to MongoDB Atlas on startup
    connect_db()

    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'message': 'Server is running successfully!'
        }), 200

    return app
