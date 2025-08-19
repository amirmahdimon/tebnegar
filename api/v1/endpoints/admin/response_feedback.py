from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from dependency.dependencies import get_db
from schema.admin.response_feedback import ResponseFeedbackAdminView
from repository import response_feedback as response_feedback
from db.model.response_feedback import FeedbackType

router = APIRouter()

@router.get("/", response_model=List[ResponseFeedbackAdminView])
def get_all_feedback(
    feedback_type: Optional[FeedbackType] = Query(None, description="Filter by feedback type ('like' or 'dislike')"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """
    Retrieve and filter user feedback records (admin-only).
    """
    feedback_list = response_feedback.get_multi_with_filter(db=db, feedback_type=feedback_type, skip=skip, limit=limit)
    return [
        ResponseFeedbackAdminView(
            id=fb.id, # type: ignore
            message_id=fb.message_id, # type: ignore
            message_content=fb.message.content, # type: ignore
            feedback_type=fb.feedback_type, # type: ignore
            comment=fb.comment, # type: ignore
            created_at=fb.created_at, # type: ignore
        ) for fb in feedback_list
    ]