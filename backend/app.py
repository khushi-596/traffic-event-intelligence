import os
import json
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path

from backend.config import APP_NAME, DEBUG
from backend.database import init_sqlite_db, SessionLocal, ZoneModel, EventModel, get_db
from backend.routes import forecast, events, recommendations, feedback
from backend.routes import risk_calendar as risk_calendar_route
from backend.routes import evaluation as evaluation_route
from backend.utils.helpers import logger

app = FastAPI(
    title=APP_NAME,
    description=(
        "Backend services for Astram AI Traffic Event Management & Forecasting.\n\n"
        "## Endpoints\n"
        "- **POST /forecast** — Predict priority + duration for a new event\n"
        "- **GET /risk-calendar** — Corridor × hour × cause heatmap data\n"
        "- **GET /risk-calendar/top-k** — Top-K hit rate evaluation metric\n"
        "- **GET/POST /events** — Historical/live event list and creation\n"
        "- **POST /feedback** — Submit actual outcomes for learning loop\n"
        "- **GET /feedback/metrics** — Rolling error metrics for charts\n"
        "- **POST /feedback/retrain** — Trigger model retraining\n"
        "- **GET /evaluation** — Model performance summary\n"
        "- **GET /evaluation/classification** — Priority classifier metrics\n"
        "- **GET /evaluation/regression** — Duration regressor metrics\n"
        "- **POST /recommendations** — Full recommendation engine\n"
    ),
    version="1.1.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for the hackathon
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes — existing
app.include_router(forecast.router)
app.include_router(events.router)
app.include_router(recommendations.router)
app.include_router(feedback.router)

# Include API routes — new (Member B)
app.include_router(risk_calendar_route.router)
app.include_router(evaluation_route.router)

@app.on_event("startup")
def startup_event():
    """
    On startup, initialize SQLite database tables (if running SQLite fallback)
    and auto-seed the zones table from bengaluru_zones.geojson.
    """
    logger.info("Starting up Astram Traffic Backend v1.1.0...")
    
    # Initialize SQLite if relevant
    init_sqlite_db()
    
    # Auto-seed zones if they are empty
    db = SessionLocal()
    try:
        count = db.query(ZoneModel).count()
        if count == 0:
            logger.info("Zones table is empty. Auto-seeding from bengaluru_zones.geojson...")
            geojson_path = Path(__file__).resolve().parent.parent / "data" / "raw" / "bengaluru_zones.geojson"
            if geojson_path.exists():
                with open(geojson_path) as f:
                    geojson = json.load(f)
                
                for feature in geojson.get("features", []):
                    zone_name = feature["properties"]["zone"]
                    # Store geometry as WKT string
                    coords = feature["geometry"]["coordinates"][0]
                    coord_strs = [f"{lon} {lat}" for lon, lat in coords]
                    wkt_polygon = f"POLYGON(({ ', '.join(coord_strs) }))"
                    
                    db_zone = ZoneModel(zone_name=zone_name, geom=wkt_polygon)
                    db.add(db_zone)
                db.commit()
                logger.info(f"Successfully seeded {len(geojson['features'])} zones on startup!")
            else:
                logger.warning(f"bengaluru_zones.geojson not found at {geojson_path}. Startup seed skipped.")
        
        # Auto-seed events if they are empty
        event_count = db.query(EventModel).count()
        if event_count == 0:
            logger.info("Events table is empty. Auto-seeding from cleaned_events.csv...")
            csv_path = Path(__file__).resolve().parent.parent / "data" / "processed" / "cleaned_events.csv"
            if csv_path.exists():
                import pandas as pd
                df = pd.read_csv(csv_path)
                df = df.dropna(subset=["start_datetime"])
                df = df.where(pd.notnull(df), None).head(100)  # Seed 100 events for demo
                for _, row in df.iterrows():
                    start_dt = pd.to_datetime(row["start_datetime"])
                    end_dt = pd.to_datetime(row["end_datetime"]) if pd.notna(row.get("end_datetime")) else None
                    
                    db_event = EventModel(
                        id=str(row["id"]),
                        event_type=str(row["event_type"]),
                        latitude=float(row["latitude"]),
                        longitude=float(row["longitude"]),
                        endlatitude=float(row["endlatitude"]) if pd.notna(row.get("endlatitude")) else None,
                        endlongitude=float(row["endlongitude"]) if pd.notna(row.get("endlongitude")) else None,
                        address=str(row["address"]) if pd.notna(row.get("address")) else None,
                        end_address=str(row["end_address"]) if pd.notna(row.get("end_address")) else None,
                        event_cause=str(row["event_cause"]),
                        requires_road_closure=bool(row["requires_road_closure"]),
                        start_datetime=start_dt.to_pydatetime() if hasattr(start_dt, "to_pydatetime") else start_dt,
                        end_datetime=end_dt.to_pydatetime() if end_dt and hasattr(end_dt, "to_pydatetime") else end_dt,
                        status=str(row["status"]) if pd.notna(row.get("status")) else "active",
                        direction=str(row["direction"]) if pd.notna(row.get("direction")) else None,
                        description=str(row["description"]) if pd.notna(row.get("description")) else None,
                        veh_type=str(row["veh_type"]) if pd.notna(row.get("veh_type")) else None,
                        veh_no=str(row["veh_no"]) if pd.notna(row.get("veh_no")) else None,
                        corridor=str(row["corridor"]) if pd.notna(row.get("corridor")) else None,
                        priority=str(row["priority"]) if pd.notna(row.get("priority")) else "Low",
                        police_station=str(row["police_station"]) if pd.notna(row.get("police_station")) else None,
                        zone=str(row["zone"]) if pd.notna(row.get("zone")) else None,
                        junction=str(row["junction"]) if pd.notna(row.get("junction")) else None
                    )
                    db.add(db_event)
                db.commit()
                logger.info(f"Successfully seeded {len(df)} events on startup!")
            else:
                logger.warning(f"cleaned_events.csv not found at {csv_path}. Event seeding skipped.")
    except Exception as e:
        logger.error(f"Startup database seeding failed: {e}")
    finally:
        db.close()

@app.get("/")
def read_root():
    return {
        "status": "healthy",
        "app_name": APP_NAME,
        "version": "1.1.0",
        "debug_mode": DEBUG,
        "timestamp": datetime.utcnow().isoformat(),
        "endpoints": {
            "forecast": "/forecast",
            "risk_calendar": "/risk-calendar",
            "risk_calendar_top_k": "/risk-calendar/top-k",
            "events": "/events",
            "feedback": "/feedback",
            "feedback_metrics": "/feedback/metrics",
            "feedback_retrain": "/feedback/retrain",
            "evaluation": "/evaluation",
            "evaluation_classification": "/evaluation/classification",
            "evaluation_regression": "/evaluation/regression",
            "recommendations": "/recommendations",
            "docs": "/docs"
        }
    }

@app.get("/health")
def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "database": "connected",
        "ml_service": "connected"
    }
