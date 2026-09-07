"""Recommendation endpoints (user-scoped, no AI generation yet)."""

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import error_response, get_current_user
from app.models.recommendation import Recommendation
from app.models.user import User
from app.schemas import RecommendationCreate, RecommendationRead, RecommendationUpdate
from app.services.history_service import create_history_event

router = APIRouter()


@router.post(
    "/recommendations", response_model=RecommendationRead, status_code=201
)
def create_recommendation(
    payload: RecommendationCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rec = Recommendation(user_id=user.id, **payload.model_dump())
    db.add(rec)
    db.commit()
    db.refresh(rec)

    create_history_event(
        db=db,
        user_id=user.id,
        event_type="recommendation",
        title=f"New recommendation: {rec.title}",
        description=rec.summary or rec.details or "",
        related_entity_type="recommendation",
        related_entity_id=str(rec.id),
        field_name=rec.field_name,
        crop=rec.crop,
        status="Action needed",
    )

    return rec


@router.get("/recommendations", response_model=list[RecommendationRead])
def list_recommendations(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Recommendation)
        .filter(Recommendation.user_id == user.id)
        .order_by(Recommendation.created_at.desc())
        .all()
    )


@router.get("/recommendations/{rec_id}", response_model=RecommendationRead)
def get_recommendation(
    rec_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rec = (
        db.query(Recommendation)
        .filter(
            Recommendation.id == rec_id,
            Recommendation.user_id == user.id,
        )
        .first()
    )
    if not rec:
        return error_response(404, "not_found", "Recommendation not found")
    return rec


@router.patch("/recommendations/{rec_id}", response_model=RecommendationRead)
def update_recommendation(
    rec_id: int,
    payload: RecommendationUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rec = (
        db.query(Recommendation)
        .filter(
            Recommendation.id == rec_id,
            Recommendation.user_id == user.id,
        )
        .first()
    )
    if not rec:
        return error_response(404, "not_found", "Recommendation not found")
    for attr, value in payload.model_dump(exclude_unset=True).items():
        setattr(rec, attr, value)
    db.commit()
    db.refresh(rec)
    return rec


@router.delete(
    "/recommendations/{rec_id}", response_model=None, status_code=204
)
def delete_recommendation(
    rec_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rec = (
        db.query(Recommendation)
        .filter(
            Recommendation.id == rec_id,
            Recommendation.user_id == user.id,
        )
        .first()
    )
    if not rec:
        return error_response(404, "not_found", "Recommendation not found")
    db.delete(rec)
    db.commit()
    return Response(status_code=204)
