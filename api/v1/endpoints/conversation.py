import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List

from dependency.dependencies import get_db, get_current_user_optional
from schema.conversation import ConversationHistory, ConversationInDB, ConversationCreate, ConversationCreateInternal, ConversationUpdate, ConversationTitle
from db.model.user import User
from repository import conversation as conversation_repo
from services.ai.ai_manager import ai_manager

router = APIRouter()

@router.get("/", response_model=List[ConversationHistory])
def list_conversations(
    session_id: uuid.UUID | None = Query(None), # <-- session_id is now an optional query param
    db: Session = Depends(get_db),
    user: User | None = Depends(get_current_user_optional) # <-- Use the optional dependency
):
    """
    Get all conversation histories. This endpoint handles both anonymous
    and authenticated users.

    - **Authenticated users (JWT provided):** Returns all conversations
      associated with the user. The `session_id` parameter is ignored.
    - **Anonymous users (no JWT):** The `session_id` query parameter is
      required. Returns all conversations for that session.
    """
    if user:
        # Authenticated Flow: The user object from the JWT is the source of truth.
        return conversation_repo.get_all_by_user_id(db=db, user_id=user.id) # type: ignore
    else:
        # Anonymous Flow: The user is None, so we rely on the session_id.
        if session_id:
            return conversation_repo.get_all_by_session_id(db=db, session_id=session_id)
        else:
            # This is an invalid request for an anonymous user.
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The 'session_id' query parameter is required for anonymous users."
            )

@router.get("/{conversation_id}/messages", response_model=ConversationInDB)
def get_conversation_messages(conversation_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Get a single conversation with all its messages.
    """
    conv = conversation_repo.get(db=db, id=conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv

@router.post("/", response_model=ConversationInDB, status_code=201)
def create_new_conversation(
    conversation_in: ConversationCreate, db: Session = Depends(get_db),
    user: User | None = Depends(get_current_user_optional)
):
    """ Creates a new conversation for either an anonymous or authenticated user. """

    if not conversation_in.session_id and not user:
        raise HTTPException(status_code=400, detail="Either session_id must be provided for anonymous users, or a valid JWT token for authenticated users.")
    
    conv_to_create = ConversationCreateInternal()

    # Anonymous user: they MUST provide a session_id.
    if conversation_in.session_id:
        conv_to_create.session_id = conversation_in.session_id
    else:
        conv_to_create.user_id = user.id # type: ignore

    return conversation_repo.create(db=db, obj_in=conv_to_create)

    

@router.patch("/{conversation_id}", response_model=ConversationInDB)
def update_conversation_title(
    conversation_id: uuid.UUID,
    conversation_in: ConversationUpdate,
    db: Session = Depends(get_db),
):
    """
    Updates the title of a conversation.
    """
    db_conversation = conversation_repo.get(db=db, id=conversation_id)
    if not db_conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    return conversation_repo.update(db=db, db_obj=db_conversation, obj_in=conversation_in)

@router.delete("/{conversation_id}", status_code=204)
def delete_conversation(conversation_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Deletes a conversation and all its messages.
    """
    db_conversation = conversation_repo.get(db=db, id=conversation_id)
    if not db_conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    conversation_repo.remove(db=db, id=conversation_id)
    return None



@router.post("/{conversation_id}/generate-title", response_model=ConversationTitle)
def generate_and_update_conversation_title(
    conversation_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    """
    Generates a title for the conversation using the active AI session
    without polluting the chat history, and updates the database.
    """
    # 1. Verify the conversation exists in our database.
    db_conversation = conversation_repo.get(db=db, id=conversation_id)
    if not db_conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # 2. Call the AI manager's new method to get the title.
    #    The conversation_id is used as the patient_id for the session.
    new_title = ai_manager.generate_title(patient_id=str(conversation_id))

    # 3. Prepare the update data.
    update_data = ConversationUpdate(title=new_title)

    # 4. Save the new title to the database.
    updated_conversation = conversation_repo.update(
        db=db, db_obj=db_conversation, obj_in=update_data
    )

    return ConversationTitle(title=new_title)
