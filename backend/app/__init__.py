from flask import Flask, jsonify
from flask_cors import CORS
from app.database.db import connect_db
from app.routes.auth_routes import init_routes
from app.routes.receipt_routes import init_receipt_routes
from app.routes.expense_routes import init_expense_routes
from app.routes.report_routes import init_report_routes
from app.services.scheduler_service import init_scheduler

def create_app():
    app = Flask(__name__)
    CORS(app)

    # Connect to MongoDB Atlas on startup
    connect_db()

    # Initialize scheduler
    init_scheduler(app)

    # Initialize routes
    init_routes(app)
    init_receipt_routes(app)
    init_expense_routes(app)
    init_report_routes(app)

    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'message': 'Server is running successfully!'
        }), 200

    return app
