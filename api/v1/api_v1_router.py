from fastapi import APIRouter
from .endpoints import sessions, conversations, messages, feedback

api_router = APIRouter()

api_router.include_router(sessions.router, prefix="/sessions", tags=["Sessions"])
api_router.include_router(conversations.router, prefix="/conversations", tags=["Conversations"])
api_router.include_router(messages.router, prefix="/messages", tags=["Messages"])
api_router.include_router(feedback.router, prefix="/feedback", tags=["Feedback"])