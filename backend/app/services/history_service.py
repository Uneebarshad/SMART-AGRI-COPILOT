"""History service — creates activity history records automatically.

Other backend services call create_history_event() to log user actions.
"""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.history import ActivityHistory


def create_history_event(
    *,
    db: Session,
    user_id: int,
    event_type: str,
    title: str,
    description: str | None = None,
    full_description: str | None = None,
    related_entity_type: str | None = None,
    related_entity_id: str | None = None,
    field_name: str | None = None,
    crop: str | None = None,
    status: str = "Completed",
    metadata_json: dict | None = None,
) -> ActivityHistory:
    """Persist a new activity history event."""
    event = ActivityHistory(
        user_id=user_id,
        event_type=event_type,
        title=title,
        description=description,
        full_description=full_description,
        related_entity_type=related_entity_type,
        related_entity_id=related_entity_id,
        field_name=field_name,
        crop=crop,
        status=status,
        metadata_json=metadata_json,
    )
    db.add(event)
    db.commit()
    return event
