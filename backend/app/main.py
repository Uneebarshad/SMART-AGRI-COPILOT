import sys
from pathlib import Path

# Ensure the backend/ directory is on sys.path so that absolute imports
# like "from app.config import settings" resolve correctly when this module
# is imported from the repository root by Vercel's Python serverless runtime.
# Locally (uvicorn from inside backend/), backend/ is already on sys.path,
# making this a harmless no-op.
_backend_dir = str(Path(__file__).resolve().parent.parent)
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.config import settings
from app.database import init_db
from app.routes import (
    assistant,
    auth,
    conversations,
    dashboard,
    diagnosis,
    diseases,
    fields,
    health,
    history,
    notifications,
    recommendations,
    users,
    weather,
)

logger = logging.getLogger("smart_agri_copilot")


@asynccontextmanager
async def lifespan(application: FastAPI):
    """Ensure database tables exist, but always let the API start."""
    db_ready, db_error = init_db()
    application.state.db_ready = db_ready
    application.state.db_error = db_error
    if db_ready:
        logger.info("Database connected and tables ensured.")
    else:
        logger.error(
            "Database unavailable - the API still starts, but database operations "
            "will fail until PostgreSQL is reachable. Cause: %s",
            db_error,
        )
    yield


app = FastAPI(
    title="Smart Agri Copilot API",
    description="Backend API for the AI-powered agriculture assistant",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(auth.router, prefix="/api", tags=["auth"])
app.include_router(users.router, prefix="/api", tags=["users"])
app.include_router(fields.router, prefix="/api", tags=["fields"])
app.include_router(conversations.router, prefix="/api", tags=["conversations"])
app.include_router(dashboard.router, prefix="/api", tags=["dashboard"])
app.include_router(diagnosis.router, prefix="/api", tags=["diagnosis"])
app.include_router(recommendations.router, prefix="/api", tags=["recommendations"])
app.include_router(notifications.router, prefix="/api", tags=["notifications"])
app.include_router(assistant.router, prefix="/api", tags=["assistant"])
app.include_router(weather.router, prefix="/api", tags=["weather"])
app.include_router(history.router, prefix="/api", tags=["history"])
app.include_router(diseases.router, prefix="/api", tags=["diseases"])


@app.exception_handler(SQLAlchemyError)
async def database_error_handler(_: Request, exc: SQLAlchemyError):
    """Report database failures through the standard error envelope."""
    logger.error("Database operation failed: %s", exc)
    return JSONResponse(
        status_code=503,
        content={
            "error": {
                "code": "database_unavailable",
                "message": "The database is currently unavailable. Please try again later.",
            }
        },
    )


@app.get("/")
async def root():
    return {"message": "Smart Agri Copilot API"}
