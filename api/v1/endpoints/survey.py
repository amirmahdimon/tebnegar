from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import schema
from db import model
from db.session import SessionLocal

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=schema.survey.SurveyResponse)
def submit_survey(
    request: schema.survey.SurveyRequest,
    db: Session = Depends(get_db)
):
    """
    Receives user feedback and stores it in the database.
    """
    survey_entry = model.survey_response.SurveyResponse(
        session_id=request.session_id,
        rating=request.rating,
        comment=request.comment
    )
    db.add(survey_entry)
    db.commit()

    return schema.survey.SurveyResponse(message="Thank you for your feedback!")