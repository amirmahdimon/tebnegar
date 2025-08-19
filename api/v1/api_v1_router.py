from fastapi import APIRouter,Depends
from .endpoints import session, conversation, message, feedback
from .endpoints.admin import stats as admin_stats, feedback as admin_feedback, conversation as admin_conversations
from dependency.dependencies import get_admin_api_key

router = APIRouter()

# Apply the get_api_key dependency to every route in this router.
admin_router = APIRouter(
    dependencies=[Depends(get_admin_api_key)]
)

# Public API routes
router.include_router(session.router, prefix="/sessions", tags=["Sessions"])
router.include_router(conversation.router, prefix="/conversations", tags=["Conversations"])
router.include_router(message.router, prefix="/messages", tags=["Messages"])
router.include_router(feedback.router, prefix="/feedback", tags=["Feedback"])

# Admin API routes
admin_router.include_router(admin_stats.router, prefix="/stats", tags=["Admin - Stats"])
admin_router.include_router(admin_feedback.router, prefix="/feedback", tags=["Admin - Feedback"])
admin_router.include_router(admin_conversations.router, prefix="/conversations", tags=["Admin - Conversations"])

# Include the admin router under a protected path
router.include_router(admin_router, prefix="/admin")