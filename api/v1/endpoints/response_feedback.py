import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from dependency.dependencies import get_db
from schema.response_feedback import ResponseFeedbackCreate, ResponseFeedbackResponse
from repository import response_feedback

router = APIRouter()

@router.post("/{message_id}", response_model=ResponseFeedbackResponse)
def submit_or_update_response_feedback(
    message_id: uuid.UUID,
    feedback_in: ResponseFeedbackCreate,
    db: Session = Depends(get_db)
):
    """
    Submits or updates feedback (like/dislike) for a specific AI-generated message.
    This operation is idempotent.
    """
    # The endpoint is now clean. All complex logic is in the repository.
    # We call the new 'upsert' method.
    saved_feedback = response_feedback.upsert(db=db, message_id=message_id, obj_in=feedback_in)
    
    if not saved_feedback:
        raise HTTPException(status_code=400, detail="Failed to save feedback")
    
    return ResponseFeedbackResponse(message="Feedback received. Thank you!")