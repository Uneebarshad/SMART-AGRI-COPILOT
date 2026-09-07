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
from app.services.weather_service import get_weather as fetch_weather

logger = logging.getLogger("smart_agri_copilot.dashboard")

router = APIRouter()

# Fallback weather data used when the weather service is unavailable
# (missing API key, provider error, unsupported district, etc.).
DEFAULT_WEATHER = {
    "current": {
        "temperature_c": 34,
        "rain_chance_pct": 40,
        "humidity_pct": 62,
        "wind_kmh": 12,
    },
    "advisories": [
        {
            "tone": "success",
            "text_localized": {
                "en": "Current weather data is unavailable; use local conditions before spraying.",
                "ur": "موجودہ موسمی ڈیٹا دستیاب نہیں؛ سپرے سے پہلے مقامی حالات دیکھیں۔",
                "ur-Latn": "Mojooda mausami data dastiyab nahi; spray se pehle maqami halaat dekhein.",
            },
        }
    ],
}

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
    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == user.id, Notification.read.is_(False))
        .order_by(Notification.created_at.desc())
        .limit(5)
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

    # -- Weather: try real provider, fall back to defaults --------------------
    district_id = (user.district or _DEFAULT_DISTRICT).strip().lower()
    weather_lang = lang
    try:
        weather_data = fetch_weather(district=district_id, lang=weather_lang)
        # Adapt the full weather payload into the dashboard's compact shape
        current = weather_data.get("current", {})
        dashboard_weather = {
            "current": {
                "temperature_c": current.get("temperature", 0),
                "rain_chance_pct": current.get("precipitation_chance", 0),
                "humidity_pct": current.get("humidity", 0),
                "wind_kmh": current.get("wind_speed", 0),
                "feels_like_c": current.get("feels_like", 0),
                "condition": current.get("condition", ""),
                "condition_text": current.get("condition_text", ""),
            },
            "advisories": weather_data.get("advisories", []),
        }
    except Exception:
        logger.debug("Dashboard weather: falling back to DEFAULT_WEATHER")
        dashboard_weather = DEFAULT_WEATHER

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
