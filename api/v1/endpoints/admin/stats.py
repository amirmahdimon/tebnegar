from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from schema.admin.stats import StatsResponse
from repository import stats
from dependency import get_db

router = APIRouter()

@router.get("/",response_model=StatsResponse)
def get_system_stats(db: Session = Depends(get_db)):
    """
    Retrieve high-level system statistics (admin-only).
    """
    return stats.stats.get_dashboard_stats(db=db)