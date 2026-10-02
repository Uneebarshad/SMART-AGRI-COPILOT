from fastapi import APIRouter, Request

router = APIRouter()


@router.get("/health")
async def health_check(request: Request):
    """Deployment-verification probe — generic status only.

    The raw database error text is deliberately NOT returned: connection
    errors can embed the full PostgreSQL DSN (user/password/host).  Details
    stay server-side in the application logs (see lifespan in app.main).
    """
    db_available = bool(getattr(request.app.state, "db_ready", False))
    return {
        "status": "ok" if db_available else "degraded",
        "database": {"available": db_available},
    }
