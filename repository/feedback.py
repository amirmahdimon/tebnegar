import uuid
from sqlalchemy.orm import Session

from .base import CRUDBase
from db.model.feedback import Feedback
from schema.feedback import FeedbackCreate
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload

class CRUDFfeedback(CRUDBase[Feedback, FeedbackCreate, FeedbackCreate]):
    def create_with_message_id(self, db: Session, *, message_id: uuid.UUID, obj_in: FeedbackCreate) -> Feedback:
        """
        Creates a feedback record linked to a specific message.
        """
        db_obj = self.model(message_id=message_id, **obj_in.dict())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_multi_with_filter(self, db: Session, *, rating: Optional[int] = None, skip: int = 0, limit: int = 100) -> List[Feedback]:
        """
        Get multiple feedback records with optional filtering by rating.
        Eagerly loads the related message content for admin review.
        """
        query = db.query(self.model).options(joinedload(self.model.message))
        
        if rating is not None:
            query = query.filter(Feedback.rating == rating)
            
        return query.order_by(Feedback.created_at.desc()).offset(skip).limit(limit).all()


# Singleton instance
feedback = CRUDFfeedback(Feedback)