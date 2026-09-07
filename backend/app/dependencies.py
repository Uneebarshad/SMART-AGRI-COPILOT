"""Shared FastAPI dependencies for the domain/API layer."""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.services.auth import decode_access_token

_bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Resolve the authenticated user from the inbound JWT.

    Raises:
        HTTPException(401) for missing, malformed, expired or unknown-token cases.
        HTTPException(403) when the user exists but is inactive.
    """
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "missing_token", "message": "Authentication required."},
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = decode_access_token(credentials.credentials)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "invalid_token", "message": "The access token is invalid."},
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id_raw = payload.get("sub")
    try:
        user_id = int(user_id_raw)
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "invalid_token", "message": "The access token is malformed."},
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "unknown_user", "message": "The token does not match any user."},
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "inactive_user", "message": "This account has been deactivated."},
        )

    return user


def get_demo_user(db: Session = Depends(get_db)) -> User:
    """Return the single demo user, creating one on first call.

    .. deprecated:: 0.2.0
        Retained only as a fallback during migration.  Private endpoints
        should use :func:`get_current_user` instead.
    """
    user = db.query(User).first()
    if user is None:
        user = User(language="en")
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


def error_response(status_code: int, code: str, message: str):
    """Build the standard error envelope response."""
    from fastapi.responses import JSONResponse

    return JSONResponse(
        status_code=status_code,
        content={"error": {"code": code, "message": message}},
    )
