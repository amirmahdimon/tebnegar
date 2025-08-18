import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from dependency.dependencies import get_db
from schema.conversation import ConversationHistory, ConversationInDB
from repository import conversation

router = APIRouter()

@router.get("/{session_id}", response_model=List[ConversationHistory])
def get_session_conversations(session_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Get all conversation histories for a given session (for the sidebar).
    """
    return conversation.get_by_session_id(db=db, session_id=session_id)

@router.get("/{conversation_id}/messages", response_model=ConversationInDB)
def get_conversation_details(conversation_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Get a single conversation with all its messages.
    """
    conv = conversation.get(db=db, id=conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv