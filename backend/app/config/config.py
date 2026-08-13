import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    MONGO_URI = os.getenv("MONGO_URI")
    CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
    CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
    CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET")
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    OPENAI_VISION_MODEL = os.getenv("OPENAI_VISION_MODEL", "gpt-4o")
    OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
    OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini")

    N8N_WEBHOOK_PASSWORD_RESET = os.getenv("N8N_WEBHOOK_PASSWORD_RESET")
    N8N_WEBHOOK_BUDGET_ALERT = (
        os.getenv("N8N_WEBHOOK_BUDGET_ALERT")
        or os.getenv("N8N_WEBHOOK_BUDGET_EXCEEDED")
        or "http://localhost:5678/webhook/budget-alert"
    )
    FRONTEND_URL = os.getenv("FRONTEND_URL", "expendora://")
    BACKEND_PUBLIC_URL = os.getenv("BACKEND_PUBLIC_URL")
