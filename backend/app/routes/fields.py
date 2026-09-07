"""Field CRUD endpoints (user-scoped)."""

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import error_response, get_current_user
from app.models.field import Field
from app.models.user import User
from app.schemas import FieldCreate, FieldRead, FieldUpdate
from app.services.history_service import create_history_event

router = APIRouter()


@router.post("/fields", response_model=FieldRead, status_code=201)
def create_field(
    payload: FieldCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    field = Field(user_id=user.id, **payload.model_dump())
    db.add(field)
    db.commit()
    db.refresh(field)

    create_history_event(
        db=db,
        user_id=user.id,
        event_type="field",
        title=f"Added {field.name}",
        description=f"A new {field.crop} field was added to your farm.",
        full_description=f"{field.name} was added with {field.crop} as the current crop. Use this field record to keep planting dates, irrigation notes, and future recommendations together.",
        related_entity_type="field",
        related_entity_id=str(field.id),
        field_name=field.name,
        crop=field.crop,
        status="Saved",
    )

    return field


@router.get("/fields", response_model=list[FieldRead])
def list_fields(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Field)
        .filter(Field.user_id == user.id)
        .order_by(Field.created_at.desc())
        .all()
    )


@router.get("/fields/{field_id}", response_model=FieldRead)
def get_field(
    field_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    field = (
        db.query(Field)
        .filter(Field.id == field_id, Field.user_id == user.id)
        .first()
    )
    if not field:
        return error_response(404, "not_found", "Field not found")
    return field


@router.patch("/fields/{field_id}", response_model=FieldRead)
def update_field(
    field_id: int,
    payload: FieldUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    field = (
        db.query(Field)
        .filter(Field.id == field_id, Field.user_id == user.id)
        .first()
    )
    if not field:
        return error_response(404, "not_found", "Field not found")
    for attr, value in payload.model_dump(exclude_unset=True).items():
        setattr(field, attr, value)
    db.commit()
    db.refresh(field)

    create_history_event(
        db=db,
        user_id=user.id,
        event_type="field",
        title=f"Updated {field.name}",
        description=f"Field details were updated for the {field.crop} crop.",
        full_description=f"{field.name} was updated. The field remains active with the latest changes applied.",
        related_entity_type="field",
        related_entity_id=str(field.id),
        field_name=field.name,
        crop=field.crop,
        status="Saved",
    )

    return field


@router.delete("/fields/{field_id}", response_model=None, status_code=204)
def delete_field(
    field_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    field = (
        db.query(Field)
        .filter(Field.id == field_id, Field.user_id == user.id)
        .first()
    )
    if not field:
        return error_response(404, "not_found", "Field not found")
    db.delete(field)
    db.commit()
    return Response(status_code=204)
