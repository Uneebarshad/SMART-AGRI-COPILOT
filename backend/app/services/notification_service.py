"""Create in-app notifications from real application events.

Every notification written here originates from something that actually
happened (a weather advisory raised by the provider, a leaf scan that
completed).  Nothing in this module fabricates events, and failures to
record a notification must never break the request that triggered it.
"""

import logging
from datetime import timedelta

from sqlalchemy.orm import Session

from app.database import utc_now
from app.models.notification import Notification

logger = logging.getLogger("smart_agri_copilot.notifications")


def create_notification(
    *,
    db: Session,
    user_id: int,
    type: str,
    title: str,
    body: str,
    deep_link: str | None = None,
    dedupe_window_hours: float | None = 24,
) -> Notification | None:
    """Persist one notification, optionally deduplicating repeats.

    When ``dedupe_window_hours`` is set, an identical (user, type, title)
    notification created inside that window is skipped and ``None`` is
    returned — this keeps advisory-driven events from spamming the inbox
    on every dashboard refresh.
    """
    if dedupe_window_hours:
        since = utc_now() - timedelta(hours=dedupe_window_hours)
        existing = (
            db.query(Notification)
            .filter(
                Notification.user_id == user_id,
                Notification.type == type,
                Notification.title == title,
                Notification.created_at >= since,
            )
            .first()
        )
        if existing is not None:
            return None

    notification = Notification(
        user_id=user_id,
        type=type,
        title=title,
        body=body,
        deep_link=deep_link,
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


def notify_from_advisories(*, db: Session, user_id: int, advisories: list) -> int:
    """Turn weather advisories into notifications; returns how many were created.

    Only actionable advisories (warning tone, or the fungal-risk disease
    alert) are recorded.  The purely informational "good conditions"
    advisory is deliberately skipped — it would be noise, not news.
    """
    created = 0
    for advisory in advisories or []:
        tone = advisory.get("tone")
        adv_type = advisory.get("type", "weather")
        if tone != "warning" and adv_type != "fungal_risk":
            continue
        text = (advisory.get("text_localized") or {}).get("en", "").strip()
        if not text:
            continue
        notification = create_notification(
            db=db,
            user_id=user_id,
            type="disease" if adv_type == "fungal_risk" else "weather",
            title=title_for_advisory(adv_type),
            body=text,
            deep_link="/weather",
            dedupe_window_hours=12,
        )
        if notification is not None:
            created += 1
    return created


def title_for_advisory(adv_type: str) -> str:
    """Short human label per advisory type (stored in English, like all
    system-generated content; provider text follows the same rule)."""
    return {
        "heat_stress": "Heat stress warning",
        "cold_caution": "Cold weather caution",
        "rain_caution": "Heavy rain expected",
        "wind_caution": "Strong wind caution",
        "fungal_risk": "Fungal disease risk elevated",
    }.get(adv_type, "Weather advisory")
