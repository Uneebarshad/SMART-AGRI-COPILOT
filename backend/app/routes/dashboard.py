"""Composite dashboard payload assembled from existing user-scoped records."""

import logging

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.conversation import Conversation, Message
from app.models.diagnosis import DiagnosisScan
from app.models.field import Field
from app.models.notification import Notification
from app.models.recommendation import Recommendation
from app.models.user import User
from app.services.notification_service import notify_from_advisories
from app.services.weather_service import get_weather as fetch_weather

logger = logging.getLogger("smart_agri_copilot.dashboard")

router = APIRouter()

# Default district used when the user has not set one
_DEFAULT_DISTRICT = "lahore"


def localized(value):
    """Expose existing stored text through the frontend localization contract."""
    text = value or ""
    return {"en": text, "ur": text, "ur-Latn": text}


def notification_tone(notification_type):
    return {
        "weather": "warning",
        "disease": "danger",
        "error": "danger",
        "success": "success",
    }.get(notification_type, "info")


def recent_conversation(db: Session, user: User):
    latest_message = (
        db.query(Message)
        .join(Conversation, Conversation.id == Message.conversation_id)
        .filter(Conversation.user_id == user.id)
        .order_by(Message.created_at.desc())
        .first()
    )
    if latest_message is None:
        return None

    messages = (
        db.query(Message)
        .filter(Message.conversation_id == latest_message.conversation_id)
        .order_by(Message.created_at)
        .all()
    )
    user_message = next((message for message in reversed(messages) if message.role == "user"), None)
    assistant_message = next(
        (message for message in reversed(messages) if message.role == "assistant"), None
    )
    if user_message is None:
        return None

    return {
        "conversation_id": latest_message.conversation_id,
        "question_localized": localized(user_message.content),
        "answer_preview_localized": localized(
            assistant_message.content[:240] if assistant_message else ""
        ),
    }


@router.get("/dashboard")
def get_dashboard(
    lang: str = "en",
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return the composite payload consumed by the dashboard widgets."""
    fields = (
        db.query(Field)
        .filter(Field.user_id == user.id)
        .order_by(Field.created_at.desc())
        .all()
    )
    recommendations = (
        db.query(Recommendation)
        .filter(Recommendation.user_id == user.id)
        .order_by(Recommendation.created_at.desc())
        .all()
    )
    latest_scan = (
        db.query(DiagnosisScan)
        .filter(DiagnosisScan.user_id == user.id)
        .order_by(DiagnosisScan.created_at.desc())
        .first()
    )

    last_scan = None
    if latest_scan:
        last_scan = {
            "scan_id": latest_scan.id,
            "disease_localized": localized(latest_scan.disease_name),
            "confidence": latest_scan.confidence,
            "is_healthy": latest_scan.status == "healthy",
            "scanned_at": latest_scan.created_at,
        }

    # -- Weather: real provider only; honest "unavailable" on any failure -----
    # The dashboard must NEVER present fabricated weather as current
    # conditions.  When the provider fails (missing key, timeout, unsupported
    # district, provider error) or returns no current conditions, we report
    # weather as unavailable and the frontend hides the weather widgets.
    district_id = (user.district or _DEFAULT_DISTRICT).strip().lower()
    weather_lang = lang
    try:
        weather_data = fetch_weather(district=district_id, lang=weather_lang)
        # Adapt the full weather payload into the dashboard's compact shape.
        # Missing values stay null instead of becoming fabricated zeros; the
        # frontend renders null safely (WeatherNow / StatCard fallbacks).
        current = weather_data.get("current") or {}
        if not current:
            logger.warning(
                "Dashboard weather unavailable: provider returned no current "
                "conditions for district %r",
                district_id,
            )
            dashboard_weather = {"current": None, "advisories": []}
        else:
            dashboard_weather = {
                "current": {
                    "temperature_c": current.get("temperature"),
                    "rain_chance_pct": current.get("precipitation_chance"),
                    "humidity_pct": current.get("humidity"),
                    "wind_kmh": current.get("wind_speed"),
                    "feels_like_c": current.get("feels_like"),
                    "condition": current.get("condition"),
                    "condition_text": current.get("condition_text"),
                },
                "advisories": weather_data.get("advisories", []),
            }
    except Exception as exc:
        # Weather service exceptions are generic messages and never contain
        # the API key, so logging the text is safe.
        logger.warning(
            "Dashboard weather unavailable (%s): %s", type(exc).__name__, exc
        )
        dashboard_weather = {"current": None, "advisories": []}
    else:
        # Real weather events become real notifications (deduplicated), so the
        # inbox reflects actual conditions instead of staying permanently empty.
        # A failure here must never take the dashboard down with it.
        try:
            notify_from_advisories(
                db=db,
                user_id=user.id,
                advisories=dashboard_weather["advisories"],
            )
        except Exception as exc:
            logger.warning(
                "Could not record weather advisories as notifications (%s): %s",
                type(exc).__name__,
                exc,
            )

    # Unread notifications, queried last so advisories recorded during this
    # very request are reflected in the alerts strip immediately.
    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == user.id, Notification.read.is_(False))
        .order_by(Notification.created_at.desc())
        .limit(5)
        .all()
    )

    return {
        "district": user.district,
        "weather": dashboard_weather,
        "alerts": [
            {
                "type": notification.type,
                "tone": notification_tone(notification.type),
                "text_localized": localized(notification.body),
            }
            for notification in notifications
        ],
        "fields": [
            {
                "id": field.id,
                "name": field.name,
                "crop_localized": localized(field.crop),
                "area_ha": field.area_ha,
            }
            for field in fields
        ],
        "recent_activity": {
            "last_conversation": recent_conversation(db, user),
            "last_scan": last_scan,
        },
        "recommendations": [
            {
                "id": recommendation.id,
                "category": recommendation.category,
                "priority": recommendation.priority,
                "title_localized": localized(recommendation.title),
                "text_localized": localized(
                    recommendation.summary or recommendation.details or ""
                ),
            }
            for recommendation in recommendations
        ],
    }
