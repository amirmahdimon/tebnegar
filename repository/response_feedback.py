import uuid
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload

from .base import CRUDBase
from db.model.response_feedback import ResponseFeedback, FeedbackType
from schema.response_feedback import ResponseFeedbackCreate

class CRUDResponseFeedback(CRUDBase[ResponseFeedback, ResponseFeedbackCreate, ResponseFeedbackCreate]):
    def create_with_message_id(
        self, db: Session, *, message_id: uuid.UUID, obj_in: ResponseFeedbackCreate
    ) -> ResponseFeedback:
        db_obj = self.model(message_id=message_id, **obj_in.dict())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_multi_with_filter(
        self, db: Session, *, feedback_type: Optional[FeedbackType] = None, skip: int = 0, limit: int = 100
    ) -> List[ResponseFeedback]:
        query = db.query(self.model).options(joinedload(self.model.message))
        
        if feedback_type:
            query = query.filter(ResponseFeedback.feedback_type == feedback_type)
            
        return query.order_by(ResponseFeedback.created_at.desc()).offset(skip).limit(limit).all()

# Singleton instance
response_feedback = CRUDResponseFeedback(ResponseFeedback)