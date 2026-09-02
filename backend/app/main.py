from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes import health

app = FastAPI(
    title="Smart Agri Copilot API",
    description="Backend API for the AI-powered agriculture assistant",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api", tags=["health"])


@app.get("/")
async def root():
    return {"message": "Smart Agri Copilot API"}
