from sqlalchemy.orm import Session
from sqlalchemy import func, case

from db.model.session import Session as SessionModel
from db.model.conversation import Conversation as ConversationModel
from db.model.message import Message as MessageModel
from db.model.feedback import Feedback as FeedbackModel
from schema.admin import StatsResponse

class CRUDStats:
    """
    CRUD class for retrieving aggregated system-wide statistics.

    This class does not inherit from CRUDBase because its purpose is to
    query and aggregate data from multiple models, rather than performing
    standard CRUD operations on a single model.
    """

    def get_dashboard_stats(self, db: Session) -> StatsResponse:
        """
        Performs several aggregate queries to get high-level KPIs for the admin dashboard.

        This method is designed to be efficient by minimizing the number of separate
        database queries.

        Args:
            db (Session): The database session.

        Returns:
            StatsResponse: A Pydantic model containing the calculated statistics.
        """
        total_sessions = db.query(func.count(SessionModel.id)).scalar()
        total_conversations = db.query(func.count(ConversationModel.id)).scalar()
        total_messages = db.query(func.count(MessageModel.id)).scalar()
        
        # Calculate average rating and feedback counts in a single, efficient query
        feedback_stats = db.query(
            func.avg(FeedbackModel.rating),
            func.count(case((FeedbackModel.rating > 0, FeedbackModel.id), else_=None)),
            func.count(case((FeedbackModel.rating < 0, FeedbackModel.id), else_=None))
        ).one()
        
        avg_rating, positive_feedback_count, negative_feedback_count = feedback_stats
        
        return StatsResponse(
            total_sessions=total_sessions or 0,
            total_conversations=total_conversations or 0,
            total_messages=total_messages or 0,
            avg_rating=round(avg_rating, 2) if avg_rating is not None else None,
            positive_feedback_count=positive_feedback_count or 0,
            negative_feedback_count=negative_feedback_count or 0,
        )

# Create a singleton instance for the application to use, maintaining consistency
stats = CRUDStats()