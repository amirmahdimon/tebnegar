import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from dependency.dependencies import get_db
from schema.conversation import ConversationHistory, ConversationInDB,ConversationCreate,ConversationUpdate
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

@router.post("/", response_model=ConversationInDB, status_code=201)
def create_new_conversation(
    conversation_in: ConversationCreate, db: Session = Depends(get_db)
):
    """
    Creates a new, empty conversation for an existing session.
    Called when the user clicks the 'New Chat' button.
    """
    return conversation.create(db=db, obj_in=conversation_in)

@router.patch("/{conversation_id}", response_model=ConversationInDB)
def update_conversation_title(
    conversation_id: uuid.UUID,
    conversation_in: ConversationUpdate,
    db: Session = Depends(get_db),
):
    """
    Updates the title of a conversation.
    """
    db_conversation = conversation.get(db=db, id=conversation_id)
    if not db_conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    return conversation.update(db=db, db_obj=db_conversation, obj_in=conversation_in)

@router.delete("/{conversation_id}", status_code=204)
def delete_conversation(conversation_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Deletes a conversation and all its messages.
    """
    db_conversation = conversation.get(db=db, id=conversation_id)
    if not db_conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    conversation.remove(db=db, id=conversation_id)
    return None