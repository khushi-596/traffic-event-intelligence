from datetime import datetime
from typing import Dict, Any
from backend.utils.helpers import parse_utc_datetime
from backend.database import get_zone_for_coordinates

# Static mapping from police station to zone (mode mapping from training data)
STATION_ZONE_MAP = {
    "adugodi": "South Zone 2",
    "ashok nagar": "Central Zone 1",
    "banashankari": "West Zone 2",
    "banaswadi": "Central Zone 1",
    "basavanagudi": "Central Zone 2",
    "bellandur": "East Zone 1",
    "byatarayanapura": "West Zone 2",
    "chamarajpet": "Central Zone 2",
    "chikkabanavara": "North Zone 2",
    "chikkajala": "North Zone 2",
    "city market": "Central Zone 2",
    "cubbon park": "Central Zone 2",
    "electronic city": "South Zone 2",
    "hal old airport": "East Zone 1",
    "hsr layout": "South Zone 2",
    "halasur": "Central Zone 1",
    "halasuru gate": "Central Zone 2",
    "hebbala": "North Zone 1",
    "hennuru": "North Zone 1",
    "high ground": "Central Zone 2",
    "hulimavu": "South Zone 1",
    "j.p. nagar": "South Zone 2",
    "jalahalli": "North Zone 2",
    "jayanagara": "South Zone 1",
    "jeevanbheemanagar": "Central Zone 1",
    "jnanabharathi": "West Zone 1",
    "k.g. halli": "North Zone 1",
    "k.r. pura": "East Zone 2",
    "k.s. layout": "South Zone 1",
    "kamakshipalya": "West Zone 1",
    "kengeri": "West Zone 1",
    "kodigehalli": "North Zone 1",
    "madiwala": "South Zone 2",
    "magadi road": "Central Zone 2",
    "mahadevapura": "East Zone 1",
    "malleshwaram": "West Zone 2",
    "mico layout": "South Zone 2",
    "peenya": "West Zone 1",
    "pulikeshinagar(f.town)": "North Zone 1",
    "r.t. nagar": "North Zone 2",
    "rajajinagar": "West Zone 1",
    "sadashivanagar": "West Zone 2",
    "sheshadripuram": "Central Zone 2",
    "shivajinagar": "Central Zone 2",
    "thalagattapura": "South Zone 1",
    "upparpet": "Central Zone 2",
    "v.v.puram (c.pet)": "Central Zone 2",
    "vijayanagara": "West Zone 2",
    "whitefield": "East Zone 1",
    "wilson garden": "Central Zone 2",
    "yelahanka": "North Zone 2",
    "yeshwanthpura": "West Zone 1"
}

def build_features(event_dict: Dict[str, Any], db=None) -> Dict[str, Any]:
    """
    Given raw event dict (FastAPI payload), engineers features required by the models.
    """
    start_dt = parse_utc_datetime(event_dict.get("start_datetime"))
    if not start_dt:
        start_dt = datetime.utcnow()
        
    hour_of_day = start_dt.hour
    day_of_week = start_dt.weekday()
    
    # 1. Planned Flag
    event_type = str(event_dict.get("event_type", "unplanned")).strip().lower()
    planned_flag = 1 if event_type == "planned" else 0
    
    # 2. Peak Hour
    # Peak hours: 4-8 AM (early morning commute/cleanup) and 7-11 PM (19-23 night congestion)
    peak_hours = [4, 5, 6, 7, 8, 19, 20, 21, 22, 23]
    is_peak_hour = 1 if hour_of_day in peak_hours else 0
    
    # 3. Road Closure
    road_closure_val = event_dict.get("requires_road_closure", False)
    if isinstance(road_closure_val, str):
        requires_road_closure = 1 if road_closure_val.lower() in ("yes", "true", "1") else 0
    else:
        requires_road_closure = 1 if road_closure_val else 0
        
    # 4. Zone Resolution (Spatial Join -> Police Station mapping -> Default)
    zone = event_dict.get("zone")
    lat = event_dict.get("latitude")
    lon = event_dict.get("longitude")
    
    if not zone and lat is not None and lon is not None and db is not None:
        zone = get_zone_for_coordinates(lat, lon, db)
        
    if not zone:
        station = str(event_dict.get("police_station", "")).strip().lower()
        zone = STATION_ZONE_MAP.get(station)
        
    if not zone:
        zone = "Unknown Zone"
        
    # 5. Time Bucket (for descriptive purposes / models if needed)
    # 4-8 early morning, 9-18 daytime, 19-23 night, 0-3 late_night
    if 4 <= hour_of_day <= 8:
        time_bucket = "early_morning"
    elif 9 <= hour_of_day <= 18:
        time_bucket = "daytime"
    elif 19 <= hour_of_day <= 23:
        time_bucket = "night"
    else:
        time_bucket = "late_night"
        
    # Lead time in hours (from created_date if available)
    created_dt_val = event_dict.get("created_date")
    lead_time_hours = 0.0
    if created_dt_val:
        created_dt = parse_utc_datetime(created_dt_val)
        delta = (start_dt - created_dt).total_seconds() / 3600.0
        lead_time_hours = max(0.0, delta)

    # Put features together
    features = {
        "event_cause": event_dict.get("event_cause", "others"),
        "event_type": "Planned" if planned_flag == 1 else "unplanned",
        "corridor": event_dict.get("corridor", "Unknown Corridor"),
        "zone": zone,
        "hour_of_day": hour_of_day,
        "day_of_week": day_of_week,
        "requires_road_closure": requires_road_closure,
        "is_peak_hour": is_peak_hour,
        "planned_flag": planned_flag,
        "time_bucket": time_bucket,
        "lead_time_hours": lead_time_hours,
        "month": start_dt.month,
        "is_weekend": 1 if day_of_week >= 5 else 0
    }
    
    return features
