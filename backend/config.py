import os

class Settings:
    PROJECT_NAME: str = "Cricket Vault API"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "cricket_vault_super_secret_jwt_key_2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # MongoDB Config
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "cricket_vault_db")
    
    # Razorpay Config
    RAZORPAY_KEY_ID: str = os.getenv("RAZORPAY_KEY_ID", "rzp_test_cricketvault_demo")
    RAZORPAY_KEY_SECRET: str = os.getenv("RAZORPAY_KEY_SECRET", "cricketvault_secret_demo")
    IS_MOCK_PAYMENTS: bool = os.getenv("MOCK_PAYMENTS", "true").lower() == "true"

    # Cricket Live Data API Config
    CRICKET_DATA_API_KEY: str = os.getenv("CRICKET_DATA_API_KEY", "")
    CRICKET_API_PROVIDER: str = os.getenv("CRICKET_API_PROVIDER", "cricapi")
    CRICKET_CACHE_TTL_SECONDS: int = int(os.getenv("CRICKET_CACHE_TTL_SECONDS", "30"))

    # Uploads (uses /tmp on serverless environments like Vercel)
    UPLOAD_DIR: str = "/tmp/uploads" if os.getenv("VERCEL") else os.path.join(os.path.dirname(__file__), "uploads")

settings = Settings()

