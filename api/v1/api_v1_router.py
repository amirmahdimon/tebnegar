from fastapi import APIRouter
from .endpoints import session, conversation, message, feedback

api_v1_router = APIRouter()

api_v1_router.include_router(session.router, prefix="/sessions", tags=["Sessions"])
api_v1_router.include_router(conversation.router, prefix="/conversations", tags=["Conversations"])
api_v1_router.include_router(message.router, prefix="/messages", tags=["Messages"])
api_v1_router.include_router(feedback.router, prefix="/feedback", tags=["Feedback"])