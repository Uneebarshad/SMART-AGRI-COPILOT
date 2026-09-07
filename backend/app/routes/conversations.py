"""Conversation and Message endpoints (user-scoped)."""

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import error_response, get_current_user
from app.models.conversation import Conversation, Message
from app.models.user import User
from app.schemas import ConversationCreate, ConversationRead, MessageCreate, MessageRead

router = APIRouter()


# -- Conversations ------------------------------------------------------------


@router.post("/conversations", response_model=ConversationRead, status_code=201)
def create_conversation(
    payload: ConversationCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conversation = Conversation(user_id=user.id, title=payload.title)
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return conversation


@router.get("/conversations", response_model=list[ConversationRead])
def list_conversations(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Conversation)
        .filter(Conversation.user_id == user.id)
        .order_by(Conversation.updated_at.desc())
        .all()
    )


@router.get("/conversations/{conversation_id}", response_model=ConversationRead)
def get_conversation(
    conversation_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conversation = (
        db.query(Conversation)
        .filter(
            Conversation.id == conversation_id,
            Conversation.user_id == user.id,
        )
        .first()
    )
    if not conversation:
        return error_response(404, "not_found", "Conversation not found")
    return conversation


@router.delete(
    "/conversations/{conversation_id}", response_model=None, status_code=204
)
def delete_conversation(
    conversation_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conversation = (
        db.query(Conversation)
        .filter(
            Conversation.id == conversation_id,
            Conversation.user_id == user.id,
        )
        .first()
    )
    if not conversation:
        return error_response(404, "not_found", "Conversation not found")
    db.delete(conversation)
    db.commit()
    return Response(status_code=204)


# -- Messages -----------------------------------------------------------------


@router.post(
    "/conversations/{conversation_id}/messages",
    response_model=MessageRead,
    status_code=201,
)
def add_message(
    conversation_id: str,
    payload: MessageCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conversation = (
        db.query(Conversation)
        .filter(
            Conversation.id == conversation_id,
            Conversation.user_id == user.id,
        )
        .first()
    )
    if not conversation:
        return error_response(404, "not_found", "Conversation not found")

    message = Message(conversation_id=conversation_id, **payload.model_dump())
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


@router.get(
    "/conversations/{conversation_id}/messages",
    response_model=list[MessageRead],
)
def list_messages(
    conversation_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conversation = (
        db.query(Conversation)
        .filter(
            Conversation.id == conversation_id,
            Conversation.user_id == user.id,
        )
        .first()
    )
    if not conversation:
        return error_response(404, "not_found", "Conversation not found")

    return (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at)
        .all()
    )
