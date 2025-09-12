# crud/crud_conversation.py

import uuid
from typing import List
from sqlalchemy.orm import Session
from fastapi import HTTPException

from .base import CRUDBase
from db.model.conversation import Conversation
from db.model.session import Session as SessionModel
from schema.conversation import ConversationCreateInternal, ConversationUpdate


class CRUDConversation(CRUDBase[Conversation, ConversationCreateInternal, ConversationUpdate]):
    """
    CRUD methods for Conversation, with custom methods for specific business logic.
    """
    
    def create(self, db: Session, *, obj_in: ConversationCreateInternal) -> Conversation:
        """
        Overrides the base create method to handle conversation creation.
        The base method is more generic; this is tailored to our needs.
        """
        # The title will use the default "New Chat" from the model definition.
        if obj_in.session_id:
            db_obj = self.model(session_id=obj_in.session_id)
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
            return db_obj
        elif obj_in.user_id:
            # If a user_id is provided instead of session_id, find or create an active session for the user.
            from repository import session as session_repo
            active_session = session_repo.get_or_create_active_session_for_user(db, user_id=obj_in.user_id)
            db_obj = self.model(session_id=active_session.id)
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
            return db_obj
        else:
            raise HTTPException(status_code=400, detail="Either session_id or user_id must be provided to create a conversation.")

    def get_all_by_session_id(self, db: Session, *, session_id: uuid.UUID) -> List[Conversation]:
        """
        Get all conversations for a specific session, ordered by most recent.
        """
        return (
            db.query(self.model)
            .filter(Conversation.session_id == session_id)
            .order_by(Conversation.created_at.desc())
            .all()
        )
    def get_all_by_user_id(self, db: Session, *, user_id: uuid.UUID) -> List[Conversation]:
        """
        Retrieves all conversation histories for a given authenticated user.
        
        It works by finding all sessions linked to the user and then joining
        to the conversations within those sessions.
        """
        return (
            db.query(self.model)
            .join(self.model.session)
            .filter(SessionModel.user_id == user_id)
            .order_by(self.model.created_at.desc())
            .all()
        )

    def search_by_content(self, db: Session, *, keyword: str, skip: int = 0, limit: int = 100 ) -> List[Conversation]:
        """
        Searches for conversations containing a message with the given keyword.
        """
        from db.model.message import Message
        # This subquery finds conversation_ids that have a matching message
        subquery = (
            db.query(Message.conversation_id)
            .filter(Message.content.ilike(f"%{keyword}%"))
            .distinct()
            .subquery()
        )
        
        # The main query fetches the conversations based on the subquery results
        return (
            db.query(self.model)
            .filter(Conversation.id.in_(subquery)) # type: ignore
            .order_by(Conversation.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

# Singleton instance for use in the API layer
conversation = CRUDConversation(Conversation)