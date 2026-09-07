"""History endpoints — user-scoped activity history."""

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import error_response, get_current_user
from app.models.history import ActivityHistory
from app.models.user import User
from app.schemas import ActivityHistoryRead

router = APIRouter()


@router.get("/history", response_model=list[ActivityHistoryRead])
def list_history(
    event_type: str | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = (
        db.query(ActivityHistory)
        .filter(ActivityHistory.user_id == user.id)
    )
    if event_type:
        query = query.filter(ActivityHistory.event_type == event_type)
    return query.order_by(ActivityHistory.occurred_at.desc()).all()


@router.get("/history/{history_id}", response_model=ActivityHistoryRead)
def get_history_item(
    history_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = (
        db.query(ActivityHistory)
        .filter(
            ActivityHistory.id == history_id,
            ActivityHistory.user_id == user.id,
        )
        .first()
    )
    if not item:
        return error_response(404, "not_found", "History entry not found")
    return item


@router.delete("/history/{history_id}", response_model=None, status_code=204)
def delete_history_item(
    history_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = (
        db.query(ActivityHistory)
        .filter(
            ActivityHistory.id == history_id,
            ActivityHistory.user_id == user.id,
        )
        .first()
    )
    if not item:
        return error_response(404, "not_found", "History entry not found")
    db.delete(item)
    db.commit()
    return Response(status_code=204)
