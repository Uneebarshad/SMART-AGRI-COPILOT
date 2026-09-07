from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, utc_now


def default_soil() -> dict[str, str]:
    return {"ph": "Not measured", "moisture": "Not measured", "organicMatter": "Not measured"}


class Field(Base):
    """A farmer's plot (frontend-spec.md §15.12)."""

    __tablename__ = "fields"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    location: Mapped[str] = mapped_column(String(160), default="", nullable=False)
    crop: Mapped[str] = mapped_column(String(60), nullable=False)
    area_ha: Mapped[float] = mapped_column(Float, nullable=False)
    sowing_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    harvest_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(
        String(32), default="Recently Planted", nullable=False
    )
    growth_stage: Mapped[str] = mapped_column(
        String(32), default="Seedling", nullable=False
    )
    irrigation_method: Mapped[str] = mapped_column(
        String(80), default="", nullable=False
    )
    notes: Mapped[str] = mapped_column(Text, default="", nullable=False)
    soil: Mapped[dict[str, str]] = mapped_column(
        JSON, default=default_soil, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )

    user: Mapped["User"] = relationship(back_populates="fields")  # noqa: F821
