from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, utc_now


class Recommendation(Base):
    """Farming recommendation (frontend-spec.md §15.10)."""

    __tablename__ = "recommendations"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    category: Mapped[str] = mapped_column(String(32), nullable=False)
    priority: Mapped[str] = mapped_column(String(16), default="medium", nullable=False)
    status: Mapped[str] = mapped_column(String(16), default="pending", nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    summary: Mapped[str | None] = mapped_column(String(300), nullable=True)
    details: Mapped[str | None] = mapped_column(Text, nullable=True)
    crop: Mapped[str | None] = mapped_column(String(60), nullable=True)
    field_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    recommendation_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    why: Mapped[str | None] = mapped_column(Text, nullable=True)
    timing: Mapped[str | None] = mapped_column(String(160), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
