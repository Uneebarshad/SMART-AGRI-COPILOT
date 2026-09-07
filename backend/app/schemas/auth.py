"""Pydantic schemas for authentication request/response payloads."""

import re

from pydantic import BaseModel, field_validator

_EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")

# Minimum password length — simple but reasonable for a hackathon.
MIN_PASSWORD_LENGTH = 6


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

    @field_validator("name")
    @classmethod
    def _validate_name(cls, v: str) -> str:
        stripped = (v or "").strip()
        if not stripped:
            raise ValueError("name is required")
        if len(stripped) > 120:
            raise ValueError("name must be at most 120 characters")
        return stripped

    @field_validator("email")
    @classmethod
    def _validate_email(cls, v: str) -> str:
        stripped = (v or "").strip()
        if not stripped:
            raise ValueError("email is required")
        if len(stripped) > 255:
            raise ValueError("email must be at most 255 characters")
        if not _EMAIL_RE.match(stripped):
            raise ValueError("email format is invalid")
        return stripped.lower()

    @field_validator("password")
    @classmethod
    def _validate_password(cls, v: str) -> str:
        if v is None or len(v) < MIN_PASSWORD_LENGTH:
            raise ValueError(
                f"password must be at least {MIN_PASSWORD_LENGTH} characters"
            )
        if len(v) > 200:
            raise ValueError("password is too long")
        return v


class RegisterResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserSummary"


class LoginRequest(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def _validate_email(cls, v: str) -> str:
        stripped = (v or "").strip()
        if not stripped:
            raise ValueError("email is required")
        return stripped.lower()

    @field_validator("password")
    @classmethod
    def _validate_password(cls, v: str) -> str:
        if not v:
            raise ValueError("password is required")
        return v


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserSummary"


class UserSummary(BaseModel):
    id: int
    name: str | None = None
    email: str | None = None

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Password-reset schemas
# ---------------------------------------------------------------------------


class ForgotPasswordRequest(BaseModel):
    email: str

    @field_validator("email")
    @classmethod
    def _validate_email(cls, v: str) -> str:
        stripped = (v or "").strip()
        if not stripped:
            raise ValueError("email is required")
        if len(stripped) > 255:
            raise ValueError("email must be at most 255 characters")
        if not _EMAIL_RE.match(stripped):
            raise ValueError("email format is invalid")
        return stripped.lower()


class ForgotPasswordResponse(BaseModel):
    """Generic response — identical regardless of whether the email exists."""
    message: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

    @field_validator("token")
    @classmethod
    def _validate_token(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("token is required")
        return v.strip()

    @field_validator("new_password")
    @classmethod
    def _validate_password(cls, v: str) -> str:
        if v is None or len(v) < MIN_PASSWORD_LENGTH:
            raise ValueError(
                f"password must be at least {MIN_PASSWORD_LENGTH} characters"
            )
        if len(v) > 200:
            raise ValueError("password is too long")
        return v


class ResetPasswordResponse(BaseModel):
    message: str


# Resolve forward references.
RegisterResponse.model_rebuild()
TokenResponse.model_rebuild()
