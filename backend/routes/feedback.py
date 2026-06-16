from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.schemas import FeedbackRequest, FeedbackResponse
from backend.database import get_db, EventModel
from backend.services.predictor import predict_event_impact
from backend.services.post_event_learning import log_feedback, get_learning_metrics, retrain_models_pipeline

router = APIRouter(prefix="/feedback", tags=["Post-Event Learning Loop"])

@router.post("", response_model=FeedbackResponse)
def submit_feedback(payload: FeedbackRequest, db: Session = Depends(get_db)):
    """
    Submits closed-event actual priority and actual duration.
    Calculates errors relative to prediction and updates the rolling log.
    """
    # 1. Look up event in DB to get original features
    event = db.query(EventModel).filter(EventModel.id == payload.event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found in database")
        
    # Convert DB model to dict
    # Filter out sqlalchemy state
    event_dict = {c.name: getattr(event, c.name) for c in event.__table__.columns if getattr(event, c.name) is not None}
    
    # 2. Re-predict to get original predictions
    try:
        preds = predict_event_impact(event_dict, db)
        pred_priority = preds["predicted_priority"]
        pred_duration = preds["predicted_duration_minutes"]
    except Exception as e:
        # Defaults if prediction fails
        pred_priority = event.priority or "Low"
        pred_duration = 64.0
        
    # 3. Log feedback
    res = log_feedback(
        event_id=payload.event_id,
        actual_duration=payload.actual_duration_minutes,
        actual_priority=payload.actual_priority,
        predicted_duration=pred_duration,
        predicted_priority=pred_priority
    )
    
    # Update event status in DB to closed
    event.status = "closed"
    event.closed_datetime = event.end_datetime or event.start_datetime  # Simple mock closure timestamp
    db.commit()
    
    return FeedbackResponse(
        status="success",
        event_id=payload.event_id,
        message="Feedback processed successfully and added to post-event learning log.",
        rolling_error_mae=res["rolling_mae"],
        total_events_logged=res["total_records"]
    )

@router.get("/metrics")
def get_metrics():
    """
    Returns learning metrics (rolling MAE & accuracy) for UI visualizations.
    """
    return get_learning_metrics()

@router.post("/retrain")
def trigger_retraining():
    """
    Triggers actual retraining of XGBoost and Random Forest pipelines on the updated dataset.
    """
    res = retrain_models_pipeline()
    if res["status"] == "error":
        raise HTTPException(status_code=500, detail=res["message"])
    return res
