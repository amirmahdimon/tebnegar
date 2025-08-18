import uuid
from sqlalchemy.orm import Session

from .base import CRUDBase
from db.model.feedback import Feedback
from schema.feedback import FeedbackCreate

class CRUDFfeedback(CRUDBase[Feedback, FeedbackCreate, FeedbackCreate]):
    def create_with_message_id(
        self, db: Session, *, message_id: uuid.UUID, obj_in: FeedbackCreate
    ) -> Feedback:
        """
        Creates a feedback record linked to a specific message.
        """
        db_obj = self.model(message_id=message_id, **obj_in.dict())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

# Singleton instance
feedback = CRUDFfeedback(Feedback)