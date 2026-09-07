from datetime import datetime

from sqlalchemy import Boolean, DateTime, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, utc_now


class User(Base):
    """Farmer profile, preferences, and authentication credentials."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str | None] = mapped_column(String(120), nullable=True, default=None)
    email: Mapped[str | None] = mapped_column(
        String(255), nullable=True, default=None, index=True, unique=True
    )
    language: Mapped[str] = mapped_column(String(8), default="en", nullable=False)
    district: Mapped[str | None] = mapped_column(String(80), nullable=True)
    preferences: Mapped[dict | None] = mapped_column(JSON, nullable=True, default=None)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True, default=None)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )

    # -- Password-reset token fields --
    # Stores a SHA-256 hash of the raw reset token (never the raw token itself).
    password_reset_token_hash: Mapped[str | None] = mapped_column(
        String(64), nullable=True, default=None
    )
    password_reset_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, default=None
    )

    fields: Mapped[list["Field"]] = relationship(  # noqa: F821
        back_populates="user", cascade="all, delete-orphan"
    )
