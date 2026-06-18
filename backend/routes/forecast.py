from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.schemas import ForecastRequest, ForecastResponse
from backend.database import get_db
from backend.services.predictor import predict_event_impact
from backend.services.risk_calendar import get_risk_calendar_simple

router = APIRouter(prefix="/forecast", tags=["Forecasting"])

@router.post("", response_model=ForecastResponse)
def get_forecast(payload: ForecastRequest, db: Session = Depends(get_db)):
    """
    Predicts priority and duration for a given traffic event description.
    Also returns matching historical analogues and recommended police station.
    """
    from backend.services.recommender import recommend
    # Convert payload to dictionary
    event_dict = payload.dict()
    
    # Run recommendation service which encapsulates predictor + K-NN similarity
    recs = recommend(event_dict, db)
    return recs

@router.get("/risk-calendar")
def get_risk_calendar_legacy(db: Session = Depends(get_db)):
    """
    Legacy endpoint: Returns the corridor x hour event count heatmap data.
    For the enhanced version with cause breakdown, use /risk-calendar instead.
    """
    return get_risk_calendar_simple(db)
