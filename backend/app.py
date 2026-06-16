import os
import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path

from backend.config import APP_NAME, DEBUG
from backend.database import init_sqlite_db, SessionLocal, ZoneModel, get_db
from backend.routes import forecast, events, recommendations, feedback
from backend.utils.helpers import logger

app = FastAPI(
    title=APP_NAME,
    description="Backend services for Astram AI Traffic Event Management & Forecasting",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for the hackathon
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(forecast.router)
app.include_router(events.router)
app.include_router(recommendations.router)
app.include_router(feedback.router)

@app.on_event("startup")
def startup_event():
    """
    On startup, initialize SQLite database tables (if running SQLite fallback)
    and auto-seed the zones table from bengaluru_zones.geojson.
    """
    logger.info("Starting up Astram Traffic Backend...")
    
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
    except Exception as e:
        logger.error(f"Startup database seeding failed: {e}")
    finally:
        db.close()

@app.get("/")
def read_root():
    return {
        "status": "healthy",
        "app_name": APP_NAME,
        "debug_mode": DEBUG,
        "timestamp": os.getenv("RENDER_START_TIME", "Local Development")
    }
