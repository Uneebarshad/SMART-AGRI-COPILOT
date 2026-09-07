from datetime import datetime
from uuid import uuid4

from sqlalchemy import JSON, DateTime, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, utc_now


def new_scan_id() -> str:
    return f"d-{uuid4().hex[:12]}"


class DiagnosisScan(Base):
    """Stored leaf-scan result (frontend-spec.md §15.6)."""

    __tablename__ = "diagnosis_scans"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=new_scan_id)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    crop: Mapped[str | None] = mapped_column(String(60), nullable=True)
    notes: Mapped[str | None] = mapped_column(String(200), nullable=True)
    language: Mapped[str] = mapped_column(String(8), default="en", nullable=False)
    status: Mapped[str] = mapped_column(String(16), default="uncertain", nullable=False)
    disease_id: Mapped[str | None] = mapped_column(String(60), nullable=True)
    disease_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    severity: Mapped[str | None] = mapped_column(String(16), nullable=True)
    symptoms: Mapped[list | None] = mapped_column(JSON, nullable=True)
    treatment_steps: Mapped[list | None] = mapped_column(JSON, nullable=True)
    prevention: Mapped[list | None] = mapped_column(JSON, nullable=True)
    care_tips: Mapped[list | None] = mapped_column(JSON, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(300), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
