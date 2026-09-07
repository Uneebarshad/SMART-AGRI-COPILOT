"""Seed initial history records for the demo user.

Runs once during init_db() when the activity_history table is empty.
Provides a non-empty history page for the first demo experience.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.history import ActivityHistory
from app.models.user import User

logger = logging.getLogger("smart_agri_copilot.history_seed")


def seed_history_if_empty(db: Session) -> None:
    """Insert initial demo history events if the table is empty."""
    existing_count = db.query(ActivityHistory).count()
    if existing_count > 0:
        return

    user = db.query(User).first()
    if user is None:
        return

    now = datetime.now(timezone.utc)
    events = [
        {
            "user_id": user.id,
            "event_type": "assistant",
            "title": "Asked about tomato leaf curling",
            "description": "Discussed likely causes and the first checks to make before treating the crop.",
            "full_description": "You asked why the leaves on your tomato plants were curling. Agri Copilot suggested checking watering consistency, heat stress, and early pest activity before applying any treatment.",
            "field_name": "Main Field",
            "crop": "Tomato",
            "status": "Completed",
            "occurred_at": now - timedelta(days=3, hours=2),
        },
        {
            "user_id": user.id,
            "event_type": "weather",
            "title": "Rain expected tomorrow",
            "description": "A weather insight flagged likely rain and a good window to pause irrigation.",
            "full_description": "The local forecast shows rain expected tomorrow afternoon. Hold off on planned irrigation and check drainage around the lower edge of Main Field after the rain passes.",
            "field_name": "Main Field",
            "crop": "Tomato",
            "status": "Reviewed",
            "occurred_at": now - timedelta(days=4, hours=0),
        },
        {
            "user_id": user.id,
            "event_type": "field",
            "title": "Updated Main Field information",
            "description": "Field details were updated with the current tomato crop and planting notes.",
            "full_description": "Main Field was updated to reflect the current tomato crop. The field remains active, and the planting notes now include the latest row spacing and irrigation observations.",
            "field_name": "Main Field",
            "crop": "Tomato",
            "status": "Saved",
            "occurred_at": now - timedelta(days=5, hours=1),
        },
        {
            "user_id": user.id,
            "event_type": "diagnosis",
            "title": "Tomato leaf analysis",
            "description": "A leaf photo was reviewed for signs of disease and visible stress.",
            "full_description": "The tomato leaf photo showed mild curling with no clear signs of a serious disease. Improve watering consistency, inspect the underside of leaves, and rescan if spots or yellowing appear.",
            "field_name": "Main Field",
            "crop": "Tomato",
            "status": "Reviewed",
            "occurred_at": now - timedelta(days=6, hours=3),
        },
        {
            "user_id": user.id,
            "event_type": "recommendation",
            "title": "Irrigation recommendation",
            "description": "Suggested an early-morning watering cycle based on crop stage and weather.",
            "full_description": "For the tomato crop, water deeply in the early morning and avoid wetting the leaves. Recheck soil moisture before the next cycle, especially if the forecasted rain arrives.",
            "field_name": "Main Field",
            "crop": "Tomato",
            "status": "Action needed",
            "occurred_at": now - timedelta(days=8, hours=5),
        },
        {
            "user_id": user.id,
            "event_type": "assistant",
            "title": "Asked when to fertilize wheat",
            "description": "Discussed timing a nitrogen application around the wheat growth stage.",
            "full_description": "You asked when to apply the next wheat fertilizer. The guidance was to check the crop growth stage and soil moisture first, then apply nitrogen before a light rain or irrigation where possible.",
            "field_name": "East Plot",
            "crop": "Wheat",
            "status": "Completed",
            "occurred_at": now - timedelta(days=10, hours=2),
        },
        {
            "user_id": user.id,
            "event_type": "weather",
            "title": "Heat risk for cotton",
            "description": "A warm spell was noted with a reminder to watch for moisture stress.",
            "full_description": "Temperatures are expected to stay high through the weekend. Check cotton leaves during the afternoon, keep the field free of competing weeds, and use the next cool morning for any planned field work.",
            "field_name": "East Plot",
            "crop": "Cotton",
            "status": "Reviewed",
            "occurred_at": now - timedelta(days=12, hours=1),
        },
        {
            "user_id": user.id,
            "event_type": "diagnosis",
            "title": "Wheat leaf analysis",
            "description": "A wheat leaf scan was saved with a note to monitor small pale spots.",
            "full_description": "The wheat leaf scan found small pale spots that should be monitored. Compare new growth over the next few days and seek local advice if the spots spread across the field.",
            "field_name": "East Plot",
            "crop": "Wheat",
            "status": "Saved",
            "occurred_at": now - timedelta(days=16, hours=2),
        },
        {
            "user_id": user.id,
            "event_type": "field",
            "title": "Added Riverside Field",
            "description": "A new maize field was added to keep its crop notes in one place.",
            "full_description": "Riverside Field was added with maize as its current crop. Use this field record to keep planting dates, irrigation notes, and future recommendations together.",
            "field_name": "Riverside Field",
            "crop": "Maize",
            "status": "Saved",
            "occurred_at": now - timedelta(days=23, hours=0),
        },
        {
            "user_id": user.id,
            "event_type": "recommendation",
            "title": "Pest scouting plan",
            "description": "Recommended a twice-weekly check of maize leaves and plant stems.",
            "full_description": "Walk the maize rows twice each week and inspect the newest leaves and lower stems. Record any holes, curled leaves, or visible insects so the next decision is based on what is actually present.",
            "field_name": "Riverside Field",
            "crop": "Maize",
            "status": "Action needed",
            "occurred_at": now - timedelta(days=32, hours=3),
        },
    ]

    for entry in events:
        event = ActivityHistory(**entry)
        db.add(event)

    db.commit()
    logger.info("History seeded with %d demo events for user %s.", len(events), user.id)
