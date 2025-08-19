# crud/crud_stats.py

from sqlalchemy.orm import Session
from sqlalchemy import func, case

from db.model.session import Session as SessionModel
from db.model.conversation import Conversation as ConversationModel
from db.model.message import Message as MessageModel
# --- CHANGE HERE: Import the new model ---
from db.model.response_feedback import ResponseFeedback, FeedbackType
from schema.admin.stats import StatsResponse

class CRUDStats:
    def get_dashboard_stats(self, db: Session) -> StatsResponse:
        total_sessions = db.query(func.count(SessionModel.id)).scalar()
        total_conversations = db.query(func.count(ConversationModel.id)).scalar()
        total_messages = db.query(func.count(MessageModel.id)).scalar()
        

        feedback_stats = db.query(
            func.count(case((ResponseFeedback.feedback_type == FeedbackType.LIKE, ResponseFeedback.id), else_=None)),
            func.count(case((ResponseFeedback.feedback_type == FeedbackType.DISLIKE, ResponseFeedback.id), else_=None))
        ).one()
        
        like_count, dislike_count = feedback_stats
        
        return StatsResponse(
            total_sessions=total_sessions or 0,
            total_conversations=total_conversations or 0,
            total_messages=total_messages or 0,
            like_count=like_count or 0,
            dislike_count=dislike_count or 0,
        )

stats = CRUDStats()