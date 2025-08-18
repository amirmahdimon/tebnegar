import uuid
import time
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from dependency.dependencies import get_db
from schema.message import MessageCreate, AIResponseMessage
from repository import message
from services.ai.manager import ai_manager # Assuming your AI manager is set up

router = APIRouter()

@router.post("/{conversation_id}", response_model=AIResponseMessage)
def post_user_message(
    conversation_id: uuid.UUID,
    message_in: MessageCreate,
    db: Session = Depends(get_db)
):
    """
    The main endpoint for a user to send a message and get an AI response.
    """
    # 1. Save the user's message
    message.create_user_message(db=db, conversation_id=conversation_id, obj_in=message_in)
    
    # 2. Call the AI service
    start_time = time.time()
    # This is a simplified call. Your actual manager might return a structured object.
    ai_response_text = ai_manager.get_assessment(symptoms=message_in.content)
    end_time = time.time()
    
    # 3. Create a structured analysis object (dummy data for now)
    analysis_data = {
        "potential_conditions": [{"condition": "Example", "score": 0.7}], # Replace with real data
        "criticality_flag": False,
        "processing_time_ms": int((end_time - start_time) * 1000),
        "ai_provider": "gemini-pro",
        "token_usage": {"prompt": 100, "completion": 200} # Replace with real data
    }
    
    # 4. Save the AI's message and its analysis
    ai_message = message.create_ai_message_with_analysis(
        db=db,
        conversation_id=conversation_id,
        content=ai_response_text,
        analysis_data=analysis_data
    )
    
    return ai_message