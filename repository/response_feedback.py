import uuid
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload

from .base import CRUDBase
from db.model.response_feedback import ResponseFeedback, FeedbackType
from schema.response_feedback import ResponseFeedbackCreate

class CRUDResponseFeedback(CRUDBase[ResponseFeedback, ResponseFeedbackCreate, ResponseFeedbackCreate]):
    def get_multi_with_filter(self, db: Session, *, feedback_type: Optional[FeedbackType] = None, skip: int = 0, limit: int = 100) -> List[ResponseFeedback]:
        query = db.query(self.model).options(joinedload(self.model.message))
        
        if feedback_type:
            query = query.filter(ResponseFeedback.feedback_type == feedback_type)
            
        return query.order_by(ResponseFeedback.created_at.desc()).offset(skip).limit(limit).all()


    def get_by_message_id(self, db: Session, *, message_id: uuid.UUID) -> ResponseFeedback | None:
        """
        Retrieves a feedback record by its associated message_id.
        """
        return db.query(self.model).filter(self.model.message_id == message_id).first()

    def upsert(self, db: Session, *, message_id: uuid.UUID, obj_in: ResponseFeedbackCreate) -> ResponseFeedback:
        """
        Creates new feedback if it doesn't exist for a message,
        or updates it if it already exists.
        """
        # Check if feedback for this message already exists
        existing_feedback = self.get_by_message_id(db, message_id=message_id)

        if existing_feedback:
            # If it exists, update it with the new data
            updated_feedback = self.update(db, db_obj=existing_feedback, obj_in=obj_in)
            return updated_feedback
        else:
            # If it does not exist, create a new record
            # We assume your ResponseFeedback model has a `message_id` field
            new_feedback = self.model(**obj_in.model_dump(), message_id=message_id)
            db.add(new_feedback)
            db.commit()
            db.refresh(new_feedback)
            return new_feedback

# Singleton instance
response_feedback = CRUDResponseFeedback(ResponseFeedback)