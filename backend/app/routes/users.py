"""User endpoints — authenticated user profile."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

from app.database import get_db
from app.dependencies import error_response, get_current_user
from app.models.user import User
from app.schemas import UserRead, UserUpdate

router = APIRouter()


@router.get("/users/me", response_model=UserRead)
def get_current_user_profile(user: User = Depends(get_current_user)):
    """Return the currently authenticated user profile."""
    return user


@router.patch("/users/me", response_model=UserRead)
def update_current_user(
    payload: UserUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Partially update the authenticated user's profile.

    Only fields present in the request body are applied.  The ``preferences``
    field is *merged* into the existing JSON object rather than replaced, so a
    client can change a single preference without overwriting the rest.
    """
    changes = payload.model_dump(exclude_unset=True)

    if not changes:
        # Nothing to update — return current state unchanged.
        return user

    # -- Merge preferences rather than replacing the whole object -----------
    if "preferences" in changes:
        incoming = changes.pop("preferences")  # dict | None
        existing = user.preferences if isinstance(user.preferences, dict) else {}
        if incoming is not None:
            existing.update(incoming)
        changes["preferences"] = existing

    # -- Apply scalar fields ------------------------------------------------
    for attr, value in changes.items():
        setattr(user, attr, value)

    # SQLAlchemy does not detect in-place JSON mutation, so flag it.
    if "preferences" in changes:
        flag_modified(user, "preferences")

    db.commit()
    db.refresh(user)
    return user
