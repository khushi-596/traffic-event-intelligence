import json
from pathlib import Path
from sqlalchemy import create_engine, Column, String, Float, Boolean, Integer, DateTime, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from backend.config import DATABASE_URL, BASE_DIR

Base = declarative_base()

# Initialize Database Engine
# If we use SQLite, allow multithreading access
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Zone DB Model
class ZoneModel(Base):
    __tablename__ = "zones"
    id = Column(Integer, primary_key=True, index=True)
    zone_name = Column(String(50), unique=True, nullable=False)
    # Store geometry as WKT or geometry depending on database type
    # For SQLite compatibility, we keep it as text/object type
    geom = Column(String, nullable=False)

# Event DB Model
class EventModel(Base):
    __tablename__ = "events"
    id = Column(String(50), primary_key=True, index=True)
    event_type = Column(String(20), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    endlatitude = Column(Float, nullable=True)
    endlongitude = Column(Float, nullable=True)
    address = Column(String, nullable=True)
    end_address = Column(String, nullable=True)
    event_cause = Column(String(100), nullable=False)
    requires_road_closure = Column(Boolean, nullable=False)
    start_datetime = Column(DateTime(timezone=True), nullable=False)
    end_datetime = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(20), nullable=True)
    authenticated = Column(String(20), nullable=True)
    modified_datetime = Column(DateTime(timezone=True), nullable=True)
    direction = Column(String(100), nullable=True)
    description = Column(String, nullable=True)
    veh_type = Column(String(100), nullable=True)
    veh_no = Column(String(100), nullable=True)
    corridor = Column(String(150), nullable=True)
    priority = Column(String(20), nullable=True)
    created_date = Column(DateTime(timezone=True), nullable=True)
    route_path = Column(String, nullable=True)
    client_id = Column(Integer, nullable=True)
    created_by_id = Column(String(50), nullable=True)
    last_modified_by_id = Column(String(50), nullable=True)
    assigned_to_police_id = Column(Integer, nullable=True)
    police_station = Column(String(150), nullable=True)
    resolved_at_address = Column(String, nullable=True)
    resolved_at_latitude = Column(Float, nullable=True)
    resolved_at_longitude = Column(Float, nullable=True)
    closed_by_id = Column(String(50), nullable=True)
    closed_datetime = Column(DateTime(timezone=True), nullable=True)
    resolved_by_id = Column(String(50), nullable=True)
    resolved_datetime = Column(DateTime(timezone=True), nullable=True)
    gba_identifier = Column(String(150), nullable=True)
    zone = Column(String(50), nullable=True)
    junction = Column(String(150), nullable=True)

# Helper function to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -------------------------------------------------------------
# Spatial Join Fallback: Point-in-Polygon Ray Casting Algorithm
# -------------------------------------------------------------
_cached_geojson = None

def load_geojson_zones():
    global _cached_geojson
    if _cached_geojson is None:
        geojson_path = Path(BASE_DIR) / "data" / "raw" / "bengaluru_zones.geojson"
        if geojson_path.exists():
            with open(geojson_path) as f:
                _cached_geojson = json.load(f)
        else:
            _cached_geojson = {"type": "FeatureCollection", "features": []}
    return _cached_geojson

def point_in_polygon(x, y, poly):
    """
    Ray-casting algorithm to determine if a point (x, y) is inside a polygon.
    x = longitude, y = latitude.
    poly is a list of [lon, lat] coordinates representing the polygon vertices.
    """
    n = len(poly)
    inside = False
    p1x, p1y = poly[0]
    for i in range(n + 1):
        p2x, p2y = poly[i % n]
        if y > min(p1y, p2y):
            if y <= max(p1y, p2y):
                if x <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or x <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y
    return inside

def get_zone_for_coordinates(lat, lon, db):
    """
    Dual-mode spatial join function:
    1. If using PostgreSQL, runs a PostGIS spatial query.
    2. If using SQLite, falls back to a pure-python ray casting check.
    """
    is_postgres = not DATABASE_URL.startswith("sqlite")
    
    if is_postgres:
        try:
            # Query PostGIS
            query = text(
                "SELECT zone_name FROM zones "
                "WHERE ST_Within(ST_SetSRID(ST_Point(:lon, :lat), 4326), geom) "
                "LIMIT 1;"
            )
            result = db.execute(query, {"lat": lat, "lon": lon}).fetchone()
            if result:
                return result[0]
        except Exception as e:
            print(f"PostGIS spatial query failed: {e}. Falling back to Python join.")
            
    # Python fallback using GeoJSON
    geojson = load_geojson_zones()
    for feature in geojson.get("features", []):
        zone_name = feature["properties"]["zone"]
        # Outer ring of polygon
        coords = feature["geometry"]["coordinates"][0]
        if point_in_polygon(lon, lat, coords):
            return zone_name
            
    return None

def init_sqlite_db():
    """
    Create SQLite tables if database is SQLite and tables do not exist.
    """
    if DATABASE_URL.startswith("sqlite"):
        Base.metadata.create_all(bind=engine)
        print("SQLite Database tables initialized.")
