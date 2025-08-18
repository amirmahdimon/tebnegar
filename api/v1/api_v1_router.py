from fastapi import APIRouter
from .endpoints import symptom_checker, survey

api_v1_router = APIRouter()
api_v1_router.include_router(symptom_checker.router, prefix="/symptom-check", tags=["Symptom Checker"])
api_v1_router.include_router(survey.router, prefix="/survey", tags=["Survey"])