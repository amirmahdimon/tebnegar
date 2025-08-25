from fastapi import APIRouter,Depends


from .endpoints import session, conversation, message, response_feedback, auth
from .endpoints.admin import (
    stats as admin_stats, 
    response_feedback as admin_response_feedback,
    conversation as admin_conversations,
    backup as admin_backup
)
from dependency.dependencies import get_admin_api_key

router = APIRouter()

# Apply the get_api_key dependency to every route in this router.
admin_router = APIRouter(
    dependencies=[Depends(get_admin_api_key)]
)

# Public API routes
router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
router.include_router(session.router, prefix="/sessions", tags=["Sessions"])
router.include_router(conversation.router, prefix="/conversations", tags=["Conversations"])
router.include_router(message.router, prefix="/messages", tags=["Messages"])
router.include_router(response_feedback.router, prefix="/response-feedback", tags=["Feedback"])

# Admin API routes
admin_router.include_router(admin_stats.router, prefix="/stats", tags=["Admin - Stats"])
admin_router.include_router(admin_response_feedback.router, prefix="/response-feedback", tags=["Admin - Feedback"])
admin_router.include_router(admin_conversations.router, prefix="/conversations", tags=["Admin - Conversations"])
admin_router.include_router(admin_backup.router, prefix="/backup", tags=["Admin - Backup"])

# Include the admin router under a protected path
router.include_router(admin_router, prefix="/admin")
