import uuid
import time
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from dependency.dependencies import get_db
from schema.message import MessageCreate, AIResponseMessage
from repository import message
from services.ai.ai_manager import ai_manager

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
    message.create_user_message(
        db=db,
        conversation_id=conversation_id,
        obj_in=message_in
    )

    # 2. Call the AI service via AIManager
    start_time = time.time()
    ai_response_text = ai_manager.send_message(
        patient_id=str(conversation_id),   # patient_id = conversation_id
        message=message_in.content
    )
    end_time = time.time()

    # 3. Create a structured analysis object
    #   (token usage, provider name, conditions → to be filled by real model later)
    analysis_data = {
        "potential_conditions": [],  # leave empty until NLU/medical model added
        "criticality_flag": False,
        "processing_time_ms": int((end_time - start_time) * 1000),
        "ai_provider": type(ai_manager._provider).__name__,  # e.g. GeminiClient
        "token_usage": {}  # your provider client can fill this in if available
    }

    # 4. Save the AI's message and its analysis
    ai_message = message.create_ai_message_with_analysis(
        db=db,
        conversation_id=conversation_id,
        content=ai_response_text,
        analysis_data=analysis_data
    )

    response = AIResponseMessage.model_validate(ai_message)
    response.elapsed_time_ms = analysis_data["processing_time_ms"]

    return ai_message
