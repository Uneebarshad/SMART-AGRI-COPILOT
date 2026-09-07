from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, utc_now


class Disease(Base):
    """Disease library entry — shared agricultural knowledge (not user-scoped)."""

    __tablename__ = "diseases"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(80), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    crop: Mapped[str] = mapped_column(String(60), nullable=False, index=True)
    disease_type: Mapped[str] = mapped_column(String(40), nullable=False)
    severity: Mapped[str] = mapped_column(String(16), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    symptoms: Mapped[str] = mapped_column(Text, nullable=False)  # JSON-encoded list
    causes: Mapped[str] = mapped_column(Text, nullable=False)  # JSON-encoded list
    prevention: Mapped[str] = mapped_column(Text, nullable=False)  # JSON-encoded list
    recommended_actions: Mapped[str] = mapped_column(Text, nullable=False)  # JSON-encoded list
    commonness: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )
