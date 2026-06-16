from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional

# Basic Event schemas
class EventBase(BaseModel):
    event_type: str = Field(..., description="unplanned or planned")
    latitude: float
    longitude: float
    endlatitude: Optional[float] = None
    endlongitude: Optional[float] = None
    address: Optional[str] = None
    end_address: Optional[str] = None
    event_cause: str
    requires_road_closure: bool
    start_datetime: datetime
    end_datetime: Optional[datetime] = None
    status: Optional[str] = "active"
    direction: Optional[str] = None
    description: Optional[str] = None
    veh_type: Optional[str] = None
    veh_no: Optional[str] = None
    corridor: Optional[str] = None
    police_station: Optional[str] = None
    junction: Optional[str] = None

class EventCreate(EventBase):
    pass

class EventResponse(EventBase):
    id: str
    zone: Optional[str] = None
    priority: Optional[str] = None
    duration_minutes: Optional[float] = None

    class Config:
        orm_mode = True
        from_attributes = True

# Forecast & Recommendation schemas
class ForecastRequest(BaseModel):
    event_cause: str = Field(..., example="Procession")
    event_type: str = Field(..., example="Planned")
    corridor: str = Field(..., example="Mysore Road")
    zone: Optional[str] = Field(None, example="West Zone")
    latitude: Optional[float] = Field(None, example=12.96)
    longitude: Optional[float] = Field(None, example=77.53)
    start_datetime: datetime = Field(default_factory=datetime.utcnow)
    requires_road_closure: bool = Field(default=False)

class SimilarEvent(BaseModel):
    event_cause: str
    corridor: Optional[str] = None
    priority: Optional[str] = None
    duration_minutes: Optional[float] = None
    police_station: Optional[str] = None

class ForecastResponse(BaseModel):
    predicted_priority: str = Field(..., example="High")
    predicted_duration_minutes: float = Field(..., example=88.0)
    recommended_station: str = Field(..., example="R.T. Nagar")
    manpower_band: str = Field(..., example="High")
    suggested_diversion: str = Field(..., example="Alternative Route")
    similar_past_events: List[SimilarEvent] = []

# Feedback schemas
class FeedbackRequest(BaseModel):
    event_id: str
    actual_duration_minutes: float
    actual_priority: str

class FeedbackResponse(BaseModel):
    status: str
    event_id: str
    message: str
    rolling_error_mae: float
    total_events_logged: int
