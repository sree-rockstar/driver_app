from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from app.core.config import settings
from app.api.v1.api import api_router
from app.db.mongodb import connect_to_mongo, close_mongo_connection

app = FastAPI(
    title=settings.APP_NAME,
    openapi_url=f"/api/v1/openapi.json"
)

# Create uploads directory if it doesn't exist
Path("uploads").mkdir(exist_ok=True)

# NOTE: We do NOT mount uploads as static files for security
# Files are served through authenticated API endpoints in /api/v1/documents/file/{file_id}
# This ensures only authorized users can access their documents

# CORS middleware
# Allow all origins in DEBUG mode or if ALLOWED_ORIGINS is "*"
if settings.DEBUG or (isinstance(settings.ALLOWED_ORIGINS, list) and "*" in settings.ALLOWED_ORIGINS) or settings.ALLOWED_ORIGINS == "*":
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"https?://.*",  # Allow any IP/domain
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()


@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()


@app.get("/")
async def root():
    return {"message": "Welcome to Driver App API"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


# Include API router
app.include_router(api_router, prefix="/api/v1")


