from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, utc_now


class ActivityHistory(Base):
    """User activity history event (frontend-spec.md §15.8)."""

    __tablename__ = "activity_history"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    event_type: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    full_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    related_entity_type: Mapped[str | None] = mapped_column(String(60), nullable=True)
    related_entity_id: Mapped[str | None] = mapped_column(String(60), nullable=True)
    field_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    crop: Mapped[str | None] = mapped_column(String(60), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="Completed", nullable=False)
    metadata_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
