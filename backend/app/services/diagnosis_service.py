"""Diagnosis service — orchestrates image validation, Gemini Vision analysis,
and DiagnosisScan persistence.

This is the single entry point for the POST /api/diagnosis/analyze endpoint.
"""

from __future__ import annotations

import logging

from sqlalchemy.orm import Session

from app.models.diagnosis import DiagnosisScan
from app.models.user import User
from app.services.llm_service import (
    GeminiConfigurationError,
    GeminiDiagnosisResult,
    GeminiProviderError,
    analyze_image_with_gemini,
)

logger = logging.getLogger("smart_agri_copilot.diagnosis")

# Maximum allowed image upload: 10 MB
MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024

ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
}


class DiagnosisValidationError(Exception):
    """Raised when the uploaded image fails validation."""


def validate_image(image_bytes: bytes, mime_type: str) -> None:
    """Validate image size and MIME type.

    Raises DiagnosisValidationError on invalid input.
    """
    if not image_bytes:
        raise DiagnosisValidationError("Uploaded image is empty")

    if mime_type not in ALLOWED_MIME_TYPES:
        raise DiagnosisValidationError(
            f"Unsupported image type '{mime_type}'. "
            f"Allowed: {', '.join(sorted(ALLOWED_MIME_TYPES))}"
        )

    if len(image_bytes) > MAX_IMAGE_SIZE_BYTES:
        max_mb = MAX_IMAGE_SIZE_BYTES // (1024 * 1024)
        raise DiagnosisValidationError(
            f"Image exceeds maximum size of {max_mb} MB"
        )


def analyze_and_persist(
    *,
    image_bytes: bytes,
    mime_type: str,
    crop: str | None,
    notes: str | None,
    language: str,
    user: User,
    db: Session,
) -> DiagnosisScan:
    """Run the full diagnosis pipeline: validate → Gemini Vision → persist.

    Returns the persisted DiagnosisScan ORM instance (compatible with
    DiagnosisScanRead via from_attributes).

    Raises:
        DiagnosisValidationError — bad image
        GeminiConfigurationError — GEMINI_API_KEY not set
        GeminiProviderError — Gemini API failure
    """
    # 1. Validate the image
    validate_image(image_bytes, mime_type)

    # 2. Call Gemini Vision
    result: GeminiDiagnosisResult = analyze_image_with_gemini(
        image_bytes=image_bytes,
        mime_type=mime_type,
        crop=crop,
        notes=notes,
        language=language,
    )

    # 3. Persist the DiagnosisScan
    scan = DiagnosisScan(
        user_id=user.id,
        crop=crop,
        notes=notes,
        language=language,
        status=result.status,
        disease_id=result.disease_id,
        disease_name=result.disease_name,
        confidence=result.confidence,
        severity=result.severity,
        symptoms=result.symptoms or None,
        treatment_steps=result.treatment_steps or None,
        prevention=result.prevention or None,
        care_tips=result.care_tips or None,
        image_url=None,  # No image storage yet
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)

    logger.info(
        "Diagnosis scan %s created for user %s — status=%s disease=%s",
        scan.id,
        user.id,
        scan.status,
        scan.disease_name,
    )

    return scan
