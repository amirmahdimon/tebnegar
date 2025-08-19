import uuid
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from dependency.dependencies import get_db
from schema.session import SessionCreate, NewSessionResponse
from repository import session

router = APIRouter()

@router.post("/", response_model=NewSessionResponse, status_code=201)
def create_new_session(
    request: Request,
    session_in: SessionCreate,
    db: Session = Depends(get_db),
):
    """
    Creates a new session and the first conversation.
    The frontend should call this once when the app loads.
    """
    ip_address = request.client.host # type: ignore
    user_agent = request.headers.get("user-agent")
    
    my_session, conversation = session.create_with_conversation(
        db=db, obj_in=session_in, ip_address=ip_address, user_agent=user_agent
    )
    
    return NewSessionResponse(session_id=my_session.id, conversation_id=conversation.id) # type: ignore



@router.post("/{session_id}/end", status_code=204)
def end_user_session(session_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Marks a session as ended.
    """
    db_session = session.end_session(db=db, session_id=session_id)
    if not db_session:
        # We don't raise 404 here to keep the beacon request lightweight
        # and prevent leaking info about which sessions exist.
        pass
    return None