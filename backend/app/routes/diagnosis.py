"""Diagnosis scan CRUD endpoints + Gemini Vision image analysis."""

import logging

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import error_response, get_current_user
from app.models.diagnosis import DiagnosisScan
from app.models.user import User
from app.schemas import DiagnosisScanCreate, DiagnosisScanRead
from app.services.diagnosis_service import (
    DiagnosisValidationError,
    analyze_and_persist,
)
from app.services.history_service import create_history_event
from app.services.notification_service import create_notification
from app.services.llm_service import (
    GeminiConfigurationError,
    GeminiProviderError,
)

logger = logging.getLogger("smart_agri_copilot.diagnosis")

router = APIRouter()


def _record_scan_notification(db: Session, user: User, scan: DiagnosisScan) -> None:
    """Surface a completed leaf scan in the notification inbox.

    Reflects the stored result only — no invented severity or advice.
    A notification failure never affects the scan response.
    """
    try:
        # The Gemini Vision pipeline stores 'diagnosed'; 'disease' is the
        # legacy status accepted by the manual CRUD endpoint. Treat both as a
        # positive diagnosis so real scans stop falling into the 'uncertain'
        # branch with a misleading "no firm match" inbox message.
        if scan.status in ("disease", "diagnosed"):
            notif_type = "disease"
            title = f"{scan.disease_name or 'Crop disease'} detected"
            first_step = (scan.treatment_steps or [None])[0]
            body = first_step or f"Severity: {scan.severity or 'not assessed'}."
        elif scan.status == "healthy":
            notif_type = "success"
            title = "Leaf scan: no disease detected"
            first_tip = (scan.care_tips or [None])[0]
            body = first_tip or "Your plant looked healthy in this scan."
        else:
            notif_type = "info"
            title = "Leaf scan finished without a firm match"
            body = "The photo could not be identified with confidence. Review the scan for retake tips."
        create_notification(
            db=db,
            user_id=user.id,
            type=notif_type,
            title=title,
            body=body,
            deep_link=f"/diagnosis/{scan.id}",
            dedupe_window_hours=None,
        )
    except Exception as exc:
        logger.warning(
            "Could not record scan notification (%s): %s", type(exc).__name__, exc
        )


# ---------------------------------------------------------------------------
# POST /api/diagnosis/analyze — Gemini Vision image diagnosis
# ---------------------------------------------------------------------------


@router.post("/diagnosis/analyze", response_model=DiagnosisScanRead, status_code=201)
async def analyze_diagnosis(
    image: UploadFile = File(...),
    crop: str | None = Form(None),
    notes: str | None = Form(None),
    language: str = Form("en"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Accept an image upload, analyze with Gemini Vision, persist the scan.

    Returns a DiagnosisScanRead-compatible response that the existing
    frontend result page can display directly.
    """
    # Validate that a file was actually uploaded
    if not image or not image.filename:
        return error_response(400, "invalid_upload", "No image file provided")

    # Read the image bytes
    try:
        image_bytes = await image.read()
    except Exception:
        return error_response(400, "invalid_upload", "Could not read uploaded image")

    mime_type = image.content_type or "application/octet-stream"

    # Validate language
    if language not in ("en", "ur", "ur-Latn"):
        language = "en"

    # Run the diagnosis pipeline
    try:
        scan = analyze_and_persist(
            image_bytes=image_bytes,
            mime_type=mime_type,
            crop=crop,
            notes=notes,
            language=language,
            user=user,
            db=db,
        )

        create_history_event(
            db=db,
            user_id=user.id,
            event_type="diagnosis",
            title=f"{crop or 'Crop'} leaf analysis",
            description=f"A leaf photo was reviewed for signs of disease. Result: {scan.status}.",
            full_description=f"The {crop or 'crop'} leaf scan returned status '{scan.status}'" + (
                f" with disease '{scan.disease_name}'" if scan.disease_name else ""
            ) + ".",
            related_entity_type="diagnosis",
            related_entity_id=scan.id,
            crop=crop,
            status="Reviewed",
        )

        _record_scan_notification(db, user, scan)

        return scan

    except DiagnosisValidationError as exc:
        return error_response(400, "invalid_image", str(exc))

    except GeminiConfigurationError:
        logger.warning(
            "POST /api/diagnosis/analyze rejected: GEMINI_API_KEY is not set in .env"
        )
        return error_response(
            503,
            "gemini_not_configured",
            "Image diagnosis is not available. Gemini API key is not configured.",
        )

    except GeminiProviderError as exc:
        logger.error("Gemini API failure on /api/diagnosis/analyze: %s", exc)
        return error_response(
            502,
            "diagnosis_provider_error",
            f"Image analysis failed: {exc}",
        )

    except Exception as exc:
        logger.error("Unexpected diagnosis error: %s", exc, exc_info=True)
        return error_response(
            500,
            "diagnosis_error",
            "An unexpected error occurred during image analysis.",
        )


# ---------------------------------------------------------------------------
# Existing CRUD endpoints (unchanged)
# ---------------------------------------------------------------------------


@router.post("/diagnosis/scans", response_model=DiagnosisScanRead, status_code=201)
def create_scan(
    payload: DiagnosisScanCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    scan = DiagnosisScan(user_id=user.id, **payload.model_dump())
    db.add(scan)
    db.commit()
    db.refresh(scan)

    _record_scan_notification(db, user, scan)

    return scan


@router.get("/diagnosis/scans", response_model=list[DiagnosisScanRead])
def list_scans(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(DiagnosisScan)
        .filter(DiagnosisScan.user_id == user.id)
        .order_by(DiagnosisScan.created_at.desc())
        .all()
    )


@router.get("/diagnosis/scans/{scan_id}", response_model=DiagnosisScanRead)
def get_scan(
    scan_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    scan = (
        db.query(DiagnosisScan)
        .filter(
            DiagnosisScan.id == scan_id,
            DiagnosisScan.user_id == user.id,
        )
        .first()
    )
    if not scan:
        return error_response(404, "not_found", "Diagnosis scan not found")
    return scan
