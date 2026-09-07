from fastapi import APIRouter, Request

router = APIRouter()


@router.get("/health")
async def health_check(request: Request):
    """Connectivity probe; also reports the last-known database status."""
    return {
        "status": "ok",
        "database": {
            "available": getattr(request.app.state, "db_ready", False),
            "error": getattr(request.app.state, "db_error", None),
        },
    }
