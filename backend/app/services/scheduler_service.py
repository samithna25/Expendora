import logging
from datetime import datetime, timezone
from dateutil.relativedelta import relativedelta
from apscheduler.schedulers.background import BackgroundScheduler
from flask import current_app

from app.database.db import get_db
from app.services.analytics_service import get_dashboard_analytics
from app.services.pdf_service import generate_monthly_pdf
from app.services.email_service import send_monthly_report_email

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()

def process_monthly_reports(app_context=None, test_month=None):
    """
    Job to generate and send monthly reports to all users.
    app_context is required because APScheduler runs in a separate thread.
    test_month (str) allows generating a report for a specific month (e.g. '2024-08') instead of last month.
    """
    logger.info("Starting monthly report generation job.")
    
    # In a real background job we need the Flask app context for DB access if they use current_app
    # However, get_db() in this project seems to not strictly require current_app based on its usage,
    # but we'll push the context just in case.
    
    def run_job():
        try:
            db = get_db()
            if db is None:
                logger.error("Could not connect to DB for monthly reports.")
                return

            users = list(db["users"].find({}))
            
            if test_month:
                target_month = test_month
            else:
                # The report is generated for the PREVIOUS month by default.
                now = datetime.now(timezone.utc)
                last_month_date = now - relativedelta(months=1)
                target_month = last_month_date.strftime("%Y-%m")
            
            logger.info(f"Processing reports for month: {target_month} for {len(users)} users.")
            
            for user in users:
                user_id = str(user["_id"])
                user_email = user.get("email")
                user_name = user.get("name", "User")
                
                if not user_email:
                    continue
                
                logger.info(f"Generating PDF for {user_email}")
                
                # 1. Get analytics data
                analytics_data = get_dashboard_analytics(user_id=user_id, month=target_month)
                
                # 2. Generate PDF
                pdf_buffer = generate_monthly_pdf(user_name=user_name, month=target_month, analytics_data=analytics_data)
                pdf_bytes = pdf_buffer.getvalue()
                
                # 3. Send Email
                send_monthly_report_email(user_id=user_id, email=user_email, user_name=user_name, month=target_month, pdf_bytes=pdf_bytes)
                
            logger.info("Monthly report generation completed successfully.")
            
        except Exception as e:
            logger.exception(f"Error during monthly report job: {e}")

    if app_context:
        with app_context.app_context():
            run_job()
    else:
        run_job()

def init_scheduler(app):
    """Initializes the background scheduler."""
    if not scheduler.running:
        # Schedule it to run on the 1st of every month at 8:00 AM
        scheduler.add_job(
            func=process_monthly_reports,
            trigger='cron',
            day=1,
            hour=8,
            minute=0,
            args=[app],
            id='monthly_report_job',
            replace_existing=True
        )
        scheduler.start()
        logger.info("APScheduler started: Monthly report job scheduled.")
