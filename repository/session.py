import uuid
from datetime import datetime, timezone
from typing import Tuple, Optional, Dict, Any
from sqlalchemy.orm import Session

from .base import CRUDBase
from db.model.session import Session as SessionModel
from db.model.conversation import Conversation as ConversationModel
from schema.session import SessionCreate

# We use Dict[str, Any] for the UpdateSchemaType as we don't have a specific one.
class CRUDSession(CRUDBase[SessionModel, SessionCreate, Dict[str, Any]]): # type: ignore
    """
    CRUD operations for Session objects.
    
    This class includes a custom method to handle the specific business logic of
    creating a session and its first conversation simultaneously.
    """

    def create_with_conversation(
        self,
        db: Session,
        *,
        obj_in: SessionCreate,
        ip_address: Optional[str],
        user_agent: Optional[str]
    ) -> Tuple[SessionModel, ConversationModel]:
        """
        Creates a new session and its initial conversation in a single transaction.

        This method is decoupled from the web request; it receives primitive types
        for IP address and user agent instead of the full Request object.

        Args:
            db (Session): The database session.
            obj_in (SessionCreate): The Pydantic schema with marketing data.
            ip_address (Optional[str]): The user's IP address.
            user_agent (Optional[str]): The user's browser user agent.

        Returns:
            Tuple[SessionModel, ConversationModel]: The newly created session and conversation.
        """
        # Use the provided Pydantic schema to create a dictionary of the object's data
        session_data = obj_in.model_dump(exclude_unset=True)
        
        # Create the SessionModel instance, adding the extracted request data
        new_session = self.model(
            **session_data,
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.add(new_session)
        # Flush the session to assign an ID to new_session without committing the transaction
        db.flush()

        # Create the first conversation, linking it to the new session's ID
        new_conversation = ConversationModel(session_id=new_session.id)
        db.add(new_conversation)
        
        # Commit the transaction to save both the session and conversation atomically
        db.commit()
        
        # Refresh the objects to get the latest state from the database
        db.refresh(new_session)
        db.refresh(new_conversation)
        
        return new_session, new_conversation


    def associate_session_with_user(self, db: Session, *, session_id: str, user_id: str) -> Session | None:
        """
        Finds an anonymous session by its ID and links it to a user account.
        """
        # We need to handle both str and UUID versions of the session_id
        try:
            session_uuid = uuid.UUID(session_id)
        except ValueError:
            # If the session_id is not a valid UUID, it can't exist in the DB.
            return None

        db_session = self.get(db, id=session_uuid)

        # Only associate if the session exists and is currently anonymous
        if db_session and db_session.user_id is None:
            db_session.user_id = user_id # type: ignore
            db.add(db_session)
            db.commit()
            db.refresh(db_session)
        
        return db_session

    def end_session(self, db: Session, *, session_id: uuid.UUID) -> Optional[SessionModel]:
        """
        Marks a session as ended by setting the ended_at timestamp.
        """
        db_obj = self.get(db=db, id=session_id)
        if db_obj and not db_obj.ended_at: # type: ignore
            db_obj.ended_at = datetime.now(timezone.utc) # type: ignore
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
        return db_obj

# Create a singleton instance of the CRUDSession class for the application to use
session = CRUDSession(SessionModel)