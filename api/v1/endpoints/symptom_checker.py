from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import schema
from db import model
from services.ai.manager import ai_manager
from db.session import SessionLocal
from dependency import get_db

router = APIRouter()


@router.post("/", response_model=schema.symptom.SymptomCheckResponse)
def check_symptoms(
    request: schema.symptom.SymptomCheckRequest,
    db: Session = Depends(get_db)
):
    """
    Receives user symptoms, gets an assessment from the AI service,
    and logs the interaction to the database.
    """
    # 1. Get assessment from the AI service
    ai_response = ai_manager.get_assessment(request.symptoms)

    # 2. Log the interaction in the database
    log_entry = model.symptom_log.SymptomLog(
        session_id=request.session_id,
        symptoms_text=request.symptoms,
        ai_response=ai_response
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)

    # TODO: check whether log_entry.id is compatible with log_id
    return schema.symptom.SymptomCheckResponse(
        session_id=request.session_id,
        assessment=ai_response,
        log_id=log_entry.id # type: ignore
    )