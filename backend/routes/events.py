from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid
from datetime import datetime

from backend.schemas import EventCreate, EventResponse
from backend.database import get_db, EventModel, get_zone_for_coordinates
from backend.services.predictor import predict_event_impact

router = APIRouter(prefix="/events", tags=["Events"])

@router.post("", response_model=EventResponse)
def create_event(payload: EventCreate, db: Session = Depends(get_db)):
    """
    Creates a new traffic event, performs spatial join to resolve zone,
    predicts priority/duration, and saves event to the database.
    """
    event_id = f"FKID{str(uuid.uuid4().int)[:6]}"  # Keep ID short like FKID001234
    event_dict = payload.dict()
    
    # 1. Resolve Zone spatially if not provided
    zone = event_dict.get("zone")
    if not zone and event_dict.get("latitude") and event_dict.get("longitude"):
        zone = get_zone_for_coordinates(event_dict["latitude"], event_dict["longitude"], db)
    if not zone:
        zone = "Unknown Zone"
    
    # 2. Run predictions for priority & duration
    try:
        predictions = predict_event_impact(event_dict, db)
        priority = predictions["predicted_priority"]
        duration_minutes = predictions["predicted_duration_minutes"]
    except Exception as e:
        priority = "Low"
        duration_minutes = 60.0
        
    # 3. Save to database
    db_event = EventModel(
        id=event_id,
        event_type=event_dict["event_type"],
        latitude=event_dict["latitude"],
        longitude=event_dict["longitude"],
        endlatitude=event_dict.get("endlatitude"),
        endlongitude=event_dict.get("endlongitude"),
        address=event_dict.get("address"),
        end_address=event_dict.get("end_address"),
        event_cause=event_dict["event_cause"],
        requires_road_closure=event_dict["requires_road_closure"],
        start_datetime=event_dict["start_datetime"],
        end_datetime=event_dict.get("end_datetime"),
        status=event_dict.get("status", "active"),
        direction=event_dict.get("direction"),
        description=event_dict.get("description"),
        veh_type=event_dict.get("veh_type"),
        veh_no=event_dict.get("veh_no"),
        corridor=event_dict.get("corridor"),
        police_station=event_dict.get("police_station"),
        junction=event_dict.get("junction"),
        zone=zone,
        priority=priority
    )
    
    # SQLite/Postgres compatibility: set spatial geom column if using Postgres
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    
    # Add duration field to response model dynamically
    resp = EventResponse.from_orm(db_event)
    resp.duration_minutes = duration_minutes
    return resp

@router.get("", response_model=List[EventResponse])
def get_events(limit: int = 100, db: Session = Depends(get_db)):
    """
    Retrieves the list of logged events.
    """
    events = db.query(EventModel).order_by(EventModel.start_datetime.desc()).limit(limit).all()
    # Add dummy duration_minutes for display
    resp_list = []
    for e in events:
        resp = EventResponse.from_orm(e)
        resp.duration_minutes = 64.0  # Median fallback
        resp_list.append(resp)
    return resp_list

@router.get("/{event_id}", response_model=EventResponse)
def get_event(event_id: str, db: Session = Depends(get_db)):
    """
    Retrieves details for a specific event by ID.
    """
    event = db.query(EventModel).filter(EventModel.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    resp = EventResponse.from_orm(event)
    resp.duration_minutes = 64.0
    return resp
