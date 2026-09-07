"""Notification endpoints (user-scoped, no push/email/SMS infrastructure)."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import error_response, get_current_user
from app.models.notification import Notification
from app.models.user import User
from app.schemas import NotificationRead

router = APIRouter()


@router.get("/notifications", response_model=list[NotificationRead])
def list_notifications(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Notification)
        .filter(Notification.user_id == user.id)
        .order_by(Notification.created_at.desc())
        .all()
    )


@router.patch(
    "/notifications/{notification_id}/read", response_model=NotificationRead
)
def mark_notification_read(
    notification_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == user.id,
        )
        .first()
    )
    if not notification:
        return error_response(404, "not_found", "Notification not found")
    notification.read = True
    db.commit()
    db.refresh(notification)
    return notification
