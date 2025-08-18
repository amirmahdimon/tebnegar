# crud/crud_conversation.py

import uuid
from typing import List
from sqlalchemy.orm import Session

from .base import CRUDBase
from db.model.conversation import Conversation
from schema.conversation import ConversationCreate, ConversationUpdate


class CRUDConversation(CRUDBase[Conversation, ConversationCreate, ConversationUpdate]):
    """
    CRUD methods for Conversation, with custom methods for specific business logic.
    """
    
    def create(self, db: Session, *, obj_in: ConversationCreate) -> Conversation:
        """
        Overrides the base create method to handle conversation creation.
        The base method is more generic; this is tailored to our needs.
        """
        # The title will use the default "New Chat" from the model definition.
        db_obj = self.model(session_id=obj_in.session_id)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_by_session_id(
        self, db: Session, *, session_id: uuid.UUID
    ) -> List[Conversation]:
        """
        Get all conversations for a specific session, ordered by most recent.
        """
        return (
            db.query(self.model)
            .filter(Conversation.session_id == session_id)
            .order_by(Conversation.created_at.desc())
            .all()
        )

# Singleton instance for use in the API layer
conversation = CRUDConversation(Conversation)