"""
Member B: Database Setup & Data Loading Script
-----------------------------------------------
Loads the cleaned CSV data into the database (SQLite or PostgreSQL),
seeds the zones table, and pre-computes the risk calendar cache.

Usage:
    python -m database.setup_db
"""

import sys
import os
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

import pandas as pd
import numpy as np
from datetime import datetime

from backend.config import DATABASE_URL, DATA_DIR
from backend.database import (
    engine, Base, SessionLocal,
    EventModel, ZoneModel, PredictionLogModel,
    RiskCalendarCacheModel, EvaluationMetricModel
)
from backend.utils.helpers import logger


def create_tables():
    """Create all tables from SQLAlchemy models."""
    logger.info(f"Creating tables for: {DATABASE_URL[:50]}...")
    Base.metadata.create_all(bind=engine)
    logger.info("All tables created successfully.")


def seed_zones():
    """Load zone boundaries from bengaluru_zones.geojson."""
    import json
    geojson_path = DATA_DIR / "raw" / "bengaluru_zones.geojson"

    if not geojson_path.exists():
        logger.warning(f"Zone GeoJSON not found at {geojson_path}")
        return

    db = SessionLocal()
    try:
        existing = db.query(ZoneModel).count()
        if existing > 0:
            logger.info(f"Zones table already has {existing} records. Skipping seed.")
            return

        with open(geojson_path) as f:
            geojson = json.load(f)

        for feature in geojson.get("features", []):
            zone_name = feature["properties"]["zone"]
            coords = feature["geometry"]["coordinates"][0]
            coord_strs = [f"{lon} {lat}" for lon, lat in coords]
            wkt_polygon = f"POLYGON(({ ', '.join(coord_strs) }))"

            db_zone = ZoneModel(zone_name=zone_name, geom=wkt_polygon)
            db.add(db_zone)

        db.commit()
        logger.info(f"Successfully seeded {len(geojson['features'])} zones.")
    except Exception as e:
        db.rollback()
        logger.error(f"Zone seeding failed: {e}")
    finally:
        db.close()


def load_events_from_csv():
    """Load cleaned events CSV into the events table."""
    csv_path = DATA_DIR / "processed" / "feature_matrix.csv"

    if not csv_path.exists():
        # Try cleaned_events.csv as fallback
        csv_path = DATA_DIR / "processed" / "cleaned_events.csv"
        if not csv_path.exists():
            logger.warning("No processed CSV found to load events from.")
            return

    db = SessionLocal()
    try:
        existing = db.query(EventModel).count()
        if existing > 0:
            logger.info(f"Events table already has {existing} records. Skipping CSV load.")
            return

        logger.info(f"Loading events from {csv_path.name}...")
        df = pd.read_csv(csv_path, low_memory=False)
        logger.info(f"Loaded {len(df)} rows from CSV.")

        # Map CSV columns to EventModel fields
        datetime_cols = [
            "start_datetime", "end_datetime", "closed_datetime",
            "resolved_datetime", "created_date", "modified_datetime"
        ]
        for col in datetime_cols:
            if col in df.columns:
                df[col] = pd.to_datetime(df[col], errors="coerce", utc=True)

        # Fill null start_datetime from created_date, then drop remaining nulls
        if "start_datetime" in df.columns:
            if "created_date" in df.columns:
                mask = df["start_datetime"].isna()
                df.loc[mask, "start_datetime"] = df.loc[mask, "created_date"]
            null_count = df["start_datetime"].isna().sum()
            if null_count > 0:
                logger.warning(f"Dropping {null_count} rows with null start_datetime")
                df = df.dropna(subset=["start_datetime"])

        # Ensure ID column exists
        if "id" not in df.columns:
            if "event_id" in df.columns:
                df["id"] = df["event_id"]
            else:
                df["id"] = [f"FKID{i:06d}" for i in range(len(df))]

        # Compute duration_minutes if missing
        if "duration_minutes" not in df.columns:
            if "closed_datetime" in df.columns and "start_datetime" in df.columns:
                df["duration_minutes"] = (
                    pd.to_datetime(df["closed_datetime"]) - pd.to_datetime(df["start_datetime"])
                ).dt.total_seconds() / 60.0

        # Compute hour_of_day if missing
        if "hour_of_day" not in df.columns and "start_datetime" in df.columns:
            df["hour_of_day"] = pd.to_datetime(df["start_datetime"]).dt.hour

        if "day_of_week" not in df.columns and "start_datetime" in df.columns:
            df["day_of_week"] = pd.to_datetime(df["start_datetime"]).dt.weekday

        # Boolean conversions
        bool_cols = ["requires_road_closure", "is_weekend", "planned_flag"]
        for col in bool_cols:
            if col in df.columns:
                df[col] = df[col].fillna(False).astype(bool)

        # Optimize insertion using pandas to_sql with multi method
        event_columns = [c.name for c in EventModel.__table__.columns]
        df_db = df[df.columns.intersection(event_columns)].copy()

        # Fill missing columns with None to ensure full schema alignment
        for col in event_columns:
            if col not in df_db.columns:
                df_db[col] = None

        # Convert NaN values to None to match DB nulls
        df_db = df_db.where(pd.notnull(df_db), None)

        # Bulk insert using pandas to_sql
        df_db.to_sql(
            name="events",
            con=engine,
            if_exists="append",
            index=False,
            method="multi",
            chunksize=1000
        )
        logger.info(f"Successfully loaded {len(df_db)} events into the database.")
    except Exception as e:
        db.rollback()
        logger.error(f"Event loading failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


def load_prediction_log():
    """Load existing prediction log CSV into the prediction_log table."""
    log_path = DATA_DIR / "exports" / "prediction_log.csv"
    if not log_path.exists():
        logger.info("No prediction_log.csv found. Skipping.")
        return

    db = SessionLocal()
    try:
        existing = db.query(PredictionLogModel).count()
        if existing > 0:
            logger.info(f"Prediction log already has {existing} records. Skipping.")
            return

        df = pd.read_csv(log_path)
        logger.info(f"Loading {len(df)} prediction log entries...")

        # Optimize using pandas to_sql
        log_columns = [c.name for c in PredictionLogModel.__table__.columns if c.name != "id"]
        df_db = df[df.columns.intersection(log_columns)].copy()

        # Fill missing columns
        for col in log_columns:
            if col not in df_db.columns:
                df_db[col] = None

        # Convert NaN values to None
        df_db = df_db.where(pd.notnull(df_db), None)

        # Bulk insert
        df_db.to_sql(
            name="prediction_log",
            con=engine,
            if_exists="append",
            index=False,
            method="multi",
            chunksize=1000
        )
        logger.info(f"Loaded {len(df_db)} prediction log entries.")
    except Exception as e:
        logger.error(f"Prediction log loading failed: {e}")
    finally:
        db.close()


def precompute_risk_calendar_cache():
    """Pre-compute and cache the risk calendar aggregations."""
    db = SessionLocal()
    try:
        events = db.query(EventModel).all()
        if not events:
            logger.info("No events in DB. Skipping risk calendar cache.")
            return

        logger.info("Pre-computing risk calendar cache...")
        records = []
        for e in events:
            records.append({
                "corridor": e.corridor,
                "hour_of_day": e.hour_of_day if e.hour_of_day is not None else (
                    e.start_datetime.hour if e.start_datetime else 0
                ),
                "event_cause": e.event_cause,
                "duration_minutes": e.duration_minutes,
                "priority": e.priority
            })

        df = pd.DataFrame(records)

        # Group by corridor × hour × cause
        grouped = df.groupby(["corridor", "hour_of_day", "event_cause"]).agg(
            event_count=("corridor", "size"),
            avg_duration_minutes=("duration_minutes", "mean"),
        ).reset_index()

        # High priority percentage
        df["is_high"] = df["priority"].str.lower().str.strip() == "high"
        hp_grouped = df.groupby(["corridor", "hour_of_day", "event_cause"]).agg(
            high_priority_pct=("is_high", "mean")
        ).reset_index()

        merged = grouped.merge(hp_grouped, on=["corridor", "hour_of_day", "event_cause"], how="left")

        # Clear existing cache
        db.query(RiskCalendarCacheModel).delete()
        db.commit()

        now = datetime.utcnow()
        for _, row in merged.iterrows():
            cache_entry = RiskCalendarCacheModel(
                corridor=row["corridor"],
                hour_of_day=int(row["hour_of_day"]),
                event_cause=row["event_cause"],
                event_count=int(row["event_count"]),
                avg_duration_minutes=float(row["avg_duration_minutes"]) if pd.notna(row["avg_duration_minutes"]) else None,
                high_priority_pct=float(row["high_priority_pct"]) if pd.notna(row["high_priority_pct"]) else None,
                last_updated=now
            )
            db.add(cache_entry)

        db.commit()
        logger.info(f"Cached {len(merged)} risk calendar entries.")
    except Exception as e:
        db.rollback()
        logger.error(f"Risk calendar cache failed: {e}")
    finally:
        db.close()


def main():
    """Run the full setup pipeline."""
    print("=" * 60)
    print("Astram Traffic Event Intelligence — Database Setup")
    print(f"Database: {DATABASE_URL[:60]}...")
    print("=" * 60)

    # Step 1: Create all tables
    create_tables()

    # Step 2: Seed zones
    seed_zones()

    # Step 3: Load events from CSV
    load_events_from_csv()

    # Step 4: Load prediction log
    load_prediction_log()

    # Step 5: Pre-compute risk calendar cache
    precompute_risk_calendar_cache()

    print("\n" + "=" * 60)
    print("Database setup complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()
