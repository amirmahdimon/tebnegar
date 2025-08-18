import uuid
from typing import List
from sqlalchemy.orm import Session

from .base import CRUDBase
from db.model.conversation import Conversation
from schema.conversation import ConversationCreate, ConversationUpdate # Assuming these exist

class CRUDConversation(CRUDBase[Conversation, ConversationCreate, ConversationUpdate]):
    def get_by_session_id(self, db: Session, *, session_id: uuid.UUID) -> List[Conversation]:
        """
        Get all conversations for a specific session, ordered by most recent.
        """
        return (
            db.query(self.model)
            .filter(Conversation.session_id == session_id)
            .order_by(Conversation.created_at.desc())
            .all()
        )

# Singleton instance
conversation = CRUDConversation(Conversation)