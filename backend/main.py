import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import settings
from backend.database import get_db
from backend.seed import seed_database
import os
from fastapi.staticfiles import StaticFiles
from backend.routers.auth_routes import router as auth_router
from backend.routers.admin_routes import router as admin_router
from backend.routers.coach_routes import router as coach_router
from backend.routers.player_routes import router as player_router
from backend.routers.payments_routes import router as payments_router
from backend.routers.notifications_routes import router as notifications_router
from backend.routers.directory_routes import router as directory_router
from backend.routers.upload_routes import router as upload_router
from backend.routers.cricket_routes import router as cricket_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB & run seed if empty
    get_db()
    seed_database(force=False)
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan,
    docs_url="/docs",
    openapi_url="/openapi.json"
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure upload directory exists and mount static files
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/api/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include Routers with /api prefix
app.include_router(auth_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(coach_router, prefix="/api")
app.include_router(player_router, prefix="/api")
app.include_router(payments_router, prefix="/api")
app.include_router(notifications_router, prefix="/api")
app.include_router(directory_router, prefix="/api")
app.include_router(upload_router, prefix="/api")
app.include_router(cricket_router, prefix="/api")

@app.get("/")
def root():
    return {"message": "Cricket Vault API is running smoothly", "version": "1.0.0"}

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
