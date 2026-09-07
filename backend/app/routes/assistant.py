"""Assistant chat endpoint — LLM-powered conversational agriculture copilot."""

import logging

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import error_response, get_current_user
from app.models.conversation import Conversation, Message
from app.models.history import ActivityHistory
from app.models.user import User
from app.schemas import MessageRead
from app.services.history_service import create_history_event
from app.services.llm_service import (
    LLMConfigurationError,
    LLMProviderError,
    generate_response,
)
from app.services.weather_service import (
    WeatherConfigurationError,
    WeatherDistrictError,
    WeatherProviderError,
    get_weather,
)

logger = logging.getLogger("smart_agri_copilot.assistant")

router = APIRouter()

# Maximum number of prior messages to include in the LLM context window.
_MAX_HISTORY_MESSAGES = 20


class ChatRequest(BaseModel):
    conversation_id: str
    message: str
    language: str = "en"


@router.post("/assistant/chat", response_model=MessageRead, status_code=201)
def chat(
    payload: ChatRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Send a user message, generate an AI response, persist both, return the
    assistant message (MessageRead shape)."""

    # -- Validate input ------------------------------------------------------
    user_content = payload.message.strip()
    if not user_content:
        return error_response(400, "validation_error", "Message must not be empty.")

    language = payload.language or "en"

    # -- Validate conversation ownership -------------------------------------
    conversation = (
        db.query(Conversation)
        .filter(
            Conversation.id == payload.conversation_id,
            Conversation.user_id == user.id,
        )
        .first()
    )
    if not conversation:
        return error_response(404, "not_found", "Conversation not found")

    # -- Load conversation history for the LLM context -----------------------
    prior_messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation.id)
        .order_by(Message.created_at.desc())
        .limit(_MAX_HISTORY_MESSAGES)
        .all()
    )
    # Reverse so oldest-first for the LLM context.
    history = [
        {"role": msg.role, "content": msg.content}
        for msg in reversed(prior_messages)
    ]

    # -- Call the LLM service ------------------------------------------------
    context = _build_assistant_context(user)
    logger.info(
        "Assistant context: user=%s district=%r context_len=%d has_weather=%s",
        user.id, user.district, len(context), "Current weather" in context,
    )

    try:
        llm_result = generate_response(
            history=history,
            user_message=user_content,
            language=language,
            context=context,
        )
    except LLMConfigurationError:
        logger.error("LLM service not configured")
        return error_response(
            503,
            "llm_not_configured",
            "The AI assistant is not configured yet. Please try again later.",
        )
    except LLMProviderError as exc:
        logger.error("LLM provider error: %s", exc)
        return error_response(
            502,
            "llm_provider_error",
            "The AI assistant could not generate a response. Please try again.",
        )

    # -- Persist the assistant message ---------------------------------------
    assistant_message = Message(
        conversation_id=conversation.id,
        role="assistant",
        content=llm_result.content,
        sources=llm_result.sources,
        follow_ups=llm_result.follow_ups,
    )
    db.add(assistant_message)
    db.commit()
    db.refresh(assistant_message)

    # -- Log ONE history entry per conversation (skip if already exists) ------
    existing_history = (
        db.query(ActivityHistory)
        .filter(
            ActivityHistory.user_id == user.id,
            ActivityHistory.related_entity_type == "conversation",
            ActivityHistory.related_entity_id == conversation.id,
        )
        .first()
    )
    if not existing_history:
        create_history_event(
            db=db,
            user_id=user.id,
            event_type="assistant",
            title=conversation.title or "Assistant conversation",
            description=user_content[:200],
            full_description=f'You asked: "{user_content[:200]}" and received an AI-powered response.',
            related_entity_type="conversation",
            related_entity_id=conversation.id,
            status="Completed",
        )

    return assistant_message


# ---------------------------------------------------------------------------
# Context builder — farmer profile + fields + weather
# ---------------------------------------------------------------------------


def _build_assistant_context(user: User) -> str:
    """Build a text block of farmer profile, field, and weather data.

    Only non-sensitive agricultural/profile information is included.
    Gracefully degrades when optional data is missing.
    """
    parts: list[str] = []

    # -- Farmer profile -------------------------------------------------------
    profile_lines: list[str] = []
    if user.name:
        profile_lines.append(f"Name: {user.name}")
    if user.district:
        profile_lines.append(f"District: {user.district}")
    if user.language:
        profile_lines.append(f"Preferred language: {user.language}")

    if profile_lines:
        parts.append("Farmer:\n" + "\n".join(profile_lines))

    # -- Fields ---------------------------------------------------------------
    try:
        fields = user.fields  # relationship loaded via session
    except Exception:
        fields = []

    if fields:
        field_lines: list[str] = []
        for f in fields:
            details: list[str] = []
            if f.name:
                details.append(f"Name: {f.name}")
            if f.crop:
                details.append(f"Crop: {f.crop}")
            if f.area_ha is not None:
                details.append(f"Area: {f.area_ha} ha")
            if f.location:
                details.append(f"Location: {f.location}")
            if f.soil:
                soil_parts = []
                for key in ("ph", "moisture", "organicMatter"):
                    val = f.soil.get(key)
                    if val and val not in ("Not measured", "", None):
                        soil_parts.append(f"{key}: {val}")
                if soil_parts:
                    details.append(f"Soil: {', '.join(soil_parts)}")
            if f.growth_stage:
                details.append(f"Growth stage: {f.growth_stage}")
            if f.status:
                details.append(f"Status: {f.status}")
            if f.irrigation_method:
                details.append(f"Irrigation: {f.irrigation_method}")
            if details:
                field_lines.append("- " + ", ".join(details))
        if field_lines:
            parts.append("Fields:\n" + "\n".join(field_lines))

    # -- Weather --------------------------------------------------------------
    if user.district:
        try:
            weather = get_weather(district=user.district, lang=user.language or "en")
            current = weather.get("current", {})
            weather_lines: list[str] = []
            if current.get("temperature") is not None:
                weather_lines.append(f"Temperature: {current['temperature']}°C")
            if current.get("condition_text"):
                weather_lines.append(f"Condition: {current['condition_text']}")
            if current.get("humidity") is not None:
                weather_lines.append(f"Humidity: {current['humidity']}%")
            if current.get("wind_speed") is not None:
                weather_lines.append(f"Wind: {current['wind_speed']} km/h {current.get('wind_direction', '')}")
            if current.get("precipitation") is not None:
                weather_lines.append(f"Precipitation: {current['precipitation']} mm")
            if current.get("precipitation_chance") is not None:
                weather_lines.append(f"Rain chance: {current['precipitation_chance']}%")
            if weather_lines:
                parts.append(f"Current weather ({weather.get('district', user.district)}):\n" + "\n".join(weather_lines))
                logger.info("Weather context included for district %r", user.district)
            else:
                logger.info("Weather returned no current data for district %r", user.district)
        except (WeatherConfigurationError, WeatherDistrictError, WeatherProviderError) as exc:
            logger.info("Weather unavailable for district %r: %s", user.district, type(exc).__name__)
        except Exception:
            logger.warning("Unexpected error fetching weather for district %r", user.district, exc_info=True)
    else:
        logger.info("Weather skipped: user %s has no district set", user.id)

    return "\n\n".join(parts) if parts else ""
