from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.schemas import ForecastRequest, ForecastResponse
from backend.database import get_db
from backend.services.recommender import recommend

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])

@router.post("", response_model=ForecastResponse)
def get_recommendations(payload: ForecastRequest, db: Session = Depends(get_db)):
    """
    Given a new event, predicts its impact class and provides similarity-based 
    detour routes, station assignment, and manpower resourcing.
    """
    event_dict = payload.dict()
    recs = recommend(event_dict, db)
    return recs
