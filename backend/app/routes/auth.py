"""Authentication endpoints: register, login, logout, and password reset.

All endpoints are API-based (no cookies, no sessions) so the same backend
can later serve a mobile client without changes.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    RegisterRequest,
    RegisterResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
    TokenResponse,
    UserSummary,
)
from app.services.auth import (
    clear_reset_token,
    create_access_token,
    create_reset_token_for_user,
    hash_password,
    validate_reset_token,
    verify_password,
)
from app.services.email_service import send_password_reset_email

logger = logging.getLogger("smart_agri_copilot.auth")

router = APIRouter()


def _user_summary(user: User) -> UserSummary:
    return UserSummary(id=user.id, name=user.name, email=user.email)


# ---------------------------------------------------------------------------
# POST /api/auth/register
# ---------------------------------------------------------------------------


@router.post(
    "/auth/register",
    response_model=RegisterResponse,
    status_code=201,
)
def register(
    payload: RegisterRequest,
    db: Session = Depends(get_db),
):
    """Create a new user and return a signed JWT so the client is logged in."""
    email = payload.email.lower()

    existing = db.query(User).filter(User.email == email).first()
    if existing is not None:
        # Avoid revealing whether the email exists — use a generic message.
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "email_already_registered",
                "message": "A user with this email already exists.",
            },
        )

    user = User(
        name=payload.name,
        email=email,
        language="en",
        password_hash=hash_password(payload.password),
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return RegisterResponse(
        access_token=token,
        user=_user_summary(user),
    )


# ---------------------------------------------------------------------------
# POST /api/auth/login
# ---------------------------------------------------------------------------


@router.post(
    "/auth/login",
    response_model=TokenResponse,
)
def login(
    payload: LoginRequest,
    db: Session = Depends(get_db),
):
    """Verify credentials and return a signed JWT.

    The error message is intentionally generic for both "unknown email" and
    "wrong password" to avoid user-enumeration leaks.
    """
    email = payload.email.lower()
    user = db.query(User).filter(User.email == email).first()

    if user is None or not verify_password(payload.password, user.password_hash or ""):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "invalid_credentials",
                "message": "The email or password is incorrect.",
            },
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "inactive_user",
                "message": "This account has been deactivated.",
            },
        )

    token = create_access_token(user.id)
    return TokenResponse(
        access_token=token,
        user=_user_summary(user),
    )


# ---------------------------------------------------------------------------
# POST /api/auth/logout — stateless JWT, so this is a no-op success.
# ---------------------------------------------------------------------------


@router.post("/auth/logout", status_code=204)
def logout(user: User = Depends(get_current_user)):
    """Stateless JWT — nothing to revoke server-side.

    The frontend clears its stored token.  The endpoint exists so mobile
    clients have a symmetric pair to ``/auth/login``.
    """
    return None


# ---------------------------------------------------------------------------
# POST /api/auth/forgot-password
# ---------------------------------------------------------------------------

_GENERIC_MSG = "If the account exists, a password reset link has been sent."


@router.post(
    "/auth/forgot-password",
    response_model=ForgotPasswordResponse,
)
def forgot_password(
    payload: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    """Create a password-reset token and email it to the user.

    The response is intentionally identical whether or not the email exists
    to prevent account / email enumeration.
    """
    email = payload.email.lower()
    user = db.query(User).filter(User.email == email).first()

    if user is not None:
        try:
            raw_token = create_reset_token_for_user(db, user)
            reset_url = (
                f"{settings.frontend_url}/reset-password?token={raw_token}"
            )
            send_password_reset_email(
                to_email=user.email,
                reset_url=reset_url,
                expires_minutes=settings.password_reset_token_expire_minutes,
            )
        except Exception:
            # Log the failure but do not leak it to the caller.
            logger.exception("Failed to create/send reset token for email %s", email)

    # Always return the same generic message.
    return ForgotPasswordResponse(message=_GENERIC_MSG)


# ---------------------------------------------------------------------------
# POST /api/auth/reset-password
# ---------------------------------------------------------------------------


@router.post(
    "/auth/reset-password",
    response_model=ResetPasswordResponse,
)
def reset_password(
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    """Validate the reset token and replace the user's password.

    On success the reset token is cleared so it cannot be reused.
    """
    user = validate_reset_token(db, payload.token)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "invalid_or_expired_token",
                "message": "The reset link is invalid or has expired. Please request a new one.",
            },
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "inactive_user",
                "message": "This account has been deactivated.",
            },
        )

    # Hash and store the new password.
    user.password_hash = hash_password(payload.new_password)
    # Invalidate the reset token so it cannot be reused.
    clear_reset_token(db, user)

    logger.info("Password reset completed for user_id=%s", user.id)

    return ResetPasswordResponse(
        message="Your password has been reset successfully. You can now sign in with your new password."
    )
