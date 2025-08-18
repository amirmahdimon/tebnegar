import uuid
from sqlalchemy.orm import Session

from .base import CRUDBase
from db.model.message import Message, SenderType
from db.model.ai_analysis import AIAnalysis
from schema.message import MessageCreate # No update schema for messages

class CRUDMessage(CRUDBase[Message, MessageCreate, MessageCreate]):
    def create_user_message(
        self, db: Session, *, conversation_id: uuid.UUID, obj_in: MessageCreate
    ) -> Message:
        """
        Creates a message specifically from a user.
        """
        db_obj = self.model(
            conversation_id=conversation_id,
            sender_type=SenderType.USER,
            content=obj_in.content
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def create_ai_message_with_analysis(
        self, db: Session, *, conversation_id: uuid.UUID, content: str, analysis_data: dict
    ) -> Message:
        """
        Creates an AI message and its associated analysis record in a single transaction.
        """
        ai_message = self.model(
            conversation_id=conversation_id,
            sender_type=SenderType.AI,
            content=content
        )
        db.add(ai_message)
        db.flush()  # Flush to get the ai_message.id

        ai_analysis = AIAnalysis(
            message_id=ai_message.id,
            **analysis_data
        )
        db.add(ai_analysis)
        db.commit()
        db.refresh(ai_message)
        return ai_message

# Singleton instance
message = CRUDMessage(Message)