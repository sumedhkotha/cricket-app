import os

def _load_env_files():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    for env_name in [".env", ".env.local"]:
        env_path = os.path.join(base_dir, env_name)
        if os.path.isfile(env_path):
            try:
                with open(env_path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            k = k.strip()
                            v = v.strip().strip("'\"")
                            if k not in os.environ:
                                os.environ[k] = v
            except Exception:
                pass

_load_env_files()

class Settings:
    PROJECT_NAME: str = "Cricket Vault API"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "cricket_vault_super_secret_jwt_key_2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # MongoDB Config
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "cricket_vault_db")
    
    # Razorpay Config (defaults to provided test credentials)
    RAZORPAY_KEY_ID: str = os.getenv("RAZORPAY_KEY_ID", "rzp_test_TlJXyXiG8OLp2d")
    RAZORPAY_KEY_SECRET: str = os.getenv("RAZORPAY_KEY_SECRET", "7yXEkwARCvTRb6JbPA47cFy5")
    RAZORPAY_WEBHOOK_SECRET: str = os.getenv("RAZORPAY_WEBHOOK_SECRET", "cricketvault_webhook_secret_demo")
    IS_MOCK_PAYMENTS: bool = os.getenv("MOCK_PAYMENTS", "false" if os.getenv("RAZORPAY_KEY_ID", "rzp_test_TlJXyXiG8OLp2d") != "rzp_test_cricketvault_demo" else "true").lower() == "true"

    # Cricket Live Data API Config
    CRICKET_DATA_API_KEY: str = os.getenv("CRICKET_DATA_API_KEY", "")
    CRICKET_API_PROVIDER: str = os.getenv("CRICKET_API_PROVIDER", "cricapi")
    CRICKET_CACHE_TTL_SECONDS: int = int(os.getenv("CRICKET_CACHE_TTL_SECONDS", "30"))

    # Uploads (uses /tmp on serverless environments like Vercel)
    UPLOAD_DIR: str = "/tmp/uploads" if os.getenv("VERCEL") else os.path.join(os.path.dirname(__file__), "uploads")

settings = Settings()

