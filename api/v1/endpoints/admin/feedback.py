from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from dependency.dependencies import get_db
from schema.admin.feedback import FeedbackAdminView
from repository import feedback

router = APIRouter()

@router.get("/",response_model=List[FeedbackAdminView])
def get_all_feedback(
    rating: Optional[int] = Query(None, description="Filter by rating (1 or -1)"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """
    Retrieve and filter user feedback records (admin-only).
    """
    feedback_list = feedback.get_multi_with_filter(
        db=db, rating=rating, skip=skip, limit=limit
    )
    # Manually construct the response to include message content
    return [
        FeedbackAdminView(
            id=fb.id, # type: ignore
            message_id=fb.message_id, # type: ignore
            message_content=fb.message.content, # type: ignore
            rating=fb.rating, # type: ignore
            would_pay=fb.would_pay, # type: ignore
            comment=fb.comment, # type: ignore
            created_at=fb.created_at, # type: ignore
        ) for fb in feedback_list
    ]