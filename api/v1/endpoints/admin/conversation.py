from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from dependency.dependencies import get_db
from schema.admin.conversation import ConversationAdminView
from repository import conversation

router = APIRouter()

@router.get("/",response_model=List[ConversationAdminView])
def search_conversations(
    keyword: str = Query(..., min_length=3, description="Search term for message content"),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """
    Search conversation transcripts by keyword (admin-only).
    """
    conversations = conversation.search_by_content(
        db=db, keyword=keyword, skip=skip, limit=limit
    )
    # This is a bit inefficient but simple. For production, a better query would be needed.
    return [
        ConversationAdminView(
            id=conv.id, # type: ignore
            session_id=conv.session_id, # type: ignore
            title=conv.title, # type: ignore
            created_at=conv.created_at, # type: ignore
            message_count=len(conv.messages) 
        ) for conv in conversations
    ]