from flask import Flask, jsonify
from app.database.db import connect_db
from app.routes.auth_routes import init_routes
from app.routes.receipt_routes import init_receipt_routes

def create_app():
    app = Flask(__name__)

    # Connect to MongoDB Atlas on startup
    connect_db()

    # Initialize routes
    init_routes(app)
    init_receipt_routes(app)

    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'message': 'Server is running successfully!'
        }), 200

    return app
