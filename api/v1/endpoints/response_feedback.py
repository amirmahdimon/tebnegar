import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from dependency.dependencies import get_db
from schema.response_feedback import ResponseFeedbackCreate, ResponseFeedbackResponse
from repository import response_feedback

router = APIRouter()

@router.post("/{message_id}", response_model=ResponseFeedbackResponse)
def submit_response_feedback(
    message_id: uuid.UUID,
    feedback_in: ResponseFeedbackCreate,
    db: Session = Depends(get_db)
):
    """
    Submit feedback (like/dislike) for a specific AI-generated message.
    """
    # You might add a check here to ensure the message_id is from an AI
    response_feedback.create_with_message_id(
        db=db, message_id=message_id, obj_in=feedback_in
    )
    return ResponseFeedbackResponse()