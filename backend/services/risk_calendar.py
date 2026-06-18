"""
Step 3 + Step 8 (Member B): Enhanced Risk Calendar Service
----------------------------------------------------------
Builds the corridor × hour_of_day × event_cause pivot table and heatmap.
Includes top-K hit rate evaluation metric for the pitch.
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional
from datetime import datetime
from backend.config import DATA_DIR
from backend.utils.helpers import logger
from backend.database import EventModel


def get_risk_calendar_data(db=None, corridor_filter: str = None,
                           cause_filter: str = None) -> Dict[str, Any]:
    """
    Returns the corridor × hour event count heatmap data with optional
    event_cause breakdown. Tries DB first, falls back to CSV.

    Returns a structured response with:
      - heatmap_data: list of {corridor, hour, count, avg_duration, ...}
      - corridors: unique corridor list
      - hours: [0..23]
      - causes: unique event_cause list
      - total_events: total count
    """
    df = _load_events_df(db)

    if df.empty:
        return {
            "heatmap_data": [],
            "corridors": [],
            "hours": list(range(24)),
            "causes": [],
            "total_events": 0,
            "generated_at": datetime.utcnow().isoformat()
        }

    # Ensure hour_of_day exists and is populated
    df["hour_of_day"] = pd.to_datetime(df["start_datetime"]).dt.hour

    # Drop rows with null corridor or hour_of_day (essential pivot columns)
    df = df.dropna(subset=["corridor", "hour_of_day"])
    df["hour_of_day"] = df["hour_of_day"].astype(int)

    # Apply filters
    if corridor_filter:
        df = df[df["corridor"].str.lower() == corridor_filter.lower()]
    if cause_filter:
        df = df[df["event_cause"].str.lower() == cause_filter.lower()]

    # Build the three-dimensional pivot: corridor × hour × cause
    heatmap_records = []

    # --- Aggregate: corridor × hour (primary heatmap) ---
    pivot_ch = df.pivot_table(
        index="corridor",
        columns="hour_of_day",
        aggfunc="size",
        fill_value=0
    )

    # Also compute average duration per cell
    if "duration_minutes" in df.columns:
        pivot_dur = df.pivot_table(
            index="corridor",
            columns="hour_of_day",
            values="duration_minutes",
            aggfunc="mean",
            fill_value=0
        )
    else:
        pivot_dur = pivot_ch * 0  # zeros

    # High priority percentage per cell
    if "priority" in df.columns:
        df["is_high"] = df["priority"].str.lower().str.strip() == "high"
        pivot_hp = df.pivot_table(
            index="corridor",
            columns="hour_of_day",
            values="is_high",
            aggfunc="mean",
            fill_value=0
        )
    else:
        pivot_hp = pivot_ch * 0

    for corridor in pivot_ch.index:
        for hour in pivot_ch.columns:
            count = int(pivot_ch.loc[corridor, hour])
            avg_dur = float(pivot_dur.loc[corridor, hour]) if (corridor in pivot_dur.index and hour in pivot_dur.columns) else 0.0
            hp_pct = float(pivot_hp.loc[corridor, hour]) if (corridor in pivot_hp.index and hour in pivot_hp.columns) else 0.0
            if pd.isna(avg_dur):
                avg_dur = 0.0
            if pd.isna(hp_pct):
                hp_pct = 0.0
            heatmap_records.append({
                "corridor": corridor,
                "hour_of_day": int(hour),
                "event_count": count,
                "avg_duration_minutes": round(avg_dur, 1),
                "high_priority_pct": round(hp_pct * 100, 1)
            })

    # --- Aggregate: corridor × hour × cause (detailed breakdown) ---
    cause_breakdown = []
    if "event_cause" in df.columns:
        grouped = df.groupby(["corridor", "hour_of_day", "event_cause"]).agg(
            event_count=("event_cause", "size"),
            avg_duration=("duration_minutes", "mean") if "duration_minutes" in df.columns else ("event_cause", "size")
        ).reset_index()

        for _, row in grouped.iterrows():
            avg_dur_val = row.get("avg_duration", 0)
            if pd.isna(avg_dur_val):
                avg_dur_val = 0.0
            cause_breakdown.append({
                "corridor": row["corridor"],
                "hour_of_day": int(row["hour_of_day"]),
                "event_cause": row["event_cause"],
                "event_count": int(row["event_count"]),
                "avg_duration_minutes": round(float(avg_dur_val), 1)
            })

    corridors = sorted(df["corridor"].dropna().unique().tolist())
    causes = sorted(df["event_cause"].dropna().unique().tolist()) if "event_cause" in df.columns else []

    return {
        "heatmap_data": heatmap_records,
        "cause_breakdown": cause_breakdown,
        "corridors": corridors,
        "hours": list(range(24)),
        "causes": causes,
        "total_events": len(df),
        "generated_at": datetime.utcnow().isoformat()
    }


def get_risk_calendar_simple(db=None) -> List[Dict[str, Any]]:
    """
    Legacy-compatible: returns simple corridor × hour pivot as list of dicts.
    Used by the existing /forecast/risk-calendar endpoint.
    """
    if db is not None:
        try:
            # Query all events from DB
            events = db.query(
                EventModel.corridor,
                EventModel.start_datetime
            ).all()

            if events:
                df = pd.DataFrame(events, columns=["corridor", "start_datetime"])
                # Extract hour of day
                df["hour_of_day"] = pd.to_datetime(df["start_datetime"]).dt.hour

                # Pivot
                pivot = df.pivot_table(
                    index="corridor",
                    columns="hour_of_day",
                    aggfunc="size",
                    fill_value=0
                )

                # Format to matching list of dicts
                pivot = pivot.reset_index()
                # Rename columns from numeric hours to strings
                pivot.columns = [str(col) if isinstance(col, (int, float)) else col for col in pivot.columns]
                return pivot.to_dict(orient="records")
        except Exception as e:
            logger.error(f"Failed to query dynamic risk calendar: {e}. Falling back to CSV.")

    # Fallback to pre-calculated CSV
    path = DATA_DIR / "processed" / "risk_calendar.csv"
    if path.exists():
        try:
            df = pd.read_csv(path)
            # Rename columns like '0.0', '1.0' to '0', '1' for cleaner JSON
            rename_dict = {}
            for col in df.columns:
                if col != "corridor":
                    try:
                        rename_dict[col] = str(int(float(col)))
                    except ValueError:
                        rename_dict[col] = col
            df = df.rename(columns=rename_dict)
            return df.to_dict(orient="records")
        except Exception as e:
            logger.error(f"Error reading risk_calendar.csv: {e}")

    # Final blank fallback
    return []


def compute_top_k_hit_rate(db=None, k: int = 5) -> Dict[str, Any]:
    """
    Step 8 evaluation metric: Top-K Hit Rate.

    For each event in a held-out test set, check if the actual corridor+hour
    combination is within the top-K highest-risk slots predicted by the
    risk calendar. This gives a quick evaluation metric for the pitch.

    Returns:
        {
            "top_k_hit_rate": float (0.0 - 1.0),
            "k": int,
            "total_test_events": int,
            "hits": int,
            "details": {...}
        }
    """
    df = _load_events_df(db)

    if df.empty or len(df) < 20:
        return {
            "top_k_hit_rate": 0.0,
            "k": k,
            "total_test_events": 0,
            "hits": 0,
            "details": {"message": "Insufficient data for evaluation"}
        }

    # Ensure hour_of_day is populated
    df["hour_of_day"] = pd.to_datetime(df["start_datetime"]).dt.hour

    # Drop rows with null corridor or hour_of_day
    df = df.dropna(subset=["corridor", "hour_of_day"])
    df["hour_of_day"] = df["hour_of_day"].astype(int)

    # Sort by start_datetime for chronological split
    df = df.sort_values("start_datetime")

    # 80/20 date split
    split_idx = int(len(df) * 0.8)
    train_df = df.iloc[:split_idx]
    test_df = df.iloc[split_idx:]

    if test_df.empty:
        return {
            "top_k_hit_rate": 0.0,
            "k": k,
            "total_test_events": 0,
            "hits": 0,
            "details": {"message": "No test data after split"}
        }

    # Build risk calendar from training data
    risk_counts = train_df.groupby(["corridor", "hour_of_day"]).size().reset_index(name="count")
    risk_counts = risk_counts.sort_values("count", ascending=False)

    # Top-K riskiest slots
    top_k_slots = set()
    for _, row in risk_counts.head(k).iterrows():
        top_k_slots.add((row["corridor"], int(row["hour_of_day"])))

    # Check how many test events fall into top-K slots
    hits = 0
    total_test = len(test_df)

    for _, event in test_df.iterrows():
        corridor_val = event.get("corridor")
        hour_val = event.get("hour_of_day", -1)
        if pd.isna(corridor_val) or pd.isna(hour_val):
            continue
        event_slot = (corridor_val, int(hour_val))
        if event_slot in top_k_slots:
            hits += 1

    hit_rate = hits / total_test if total_test > 0 else 0.0

    return {
        "top_k_hit_rate": round(hit_rate, 4),
        "k": k,
        "total_test_events": total_test,
        "hits": hits,
        "top_k_slots": [
            {"corridor": c, "hour_of_day": h}
            for c, h in sorted(top_k_slots)
        ],
        "details": {
            "train_size": len(train_df),
            "test_size": total_test,
            "unique_corridors_train": int(train_df["corridor"].nunique()),
            "unique_corridors_test": int(test_df["corridor"].nunique()),
        }
    }


def _load_events_df(db=None) -> pd.DataFrame:
    """
    Helper: loads events from DB if available, else from processed CSV.
    """
    if db is not None:
        try:
            events = db.query(EventModel).all()
            if events:
                records = []
                for e in events:
                    row = {c.name: getattr(e, c.name) for c in e.__table__.columns}
                    records.append(row)
                return pd.DataFrame(records)
        except Exception as ex:
            logger.error(f"Failed to load events from DB: {ex}")

    # Fallback: load from CSV
    for csv_name in ["feature_matrix.csv", "cleaned_events.csv"]:
        path = DATA_DIR / "processed" / csv_name
        if path.exists():
            try:
                df = pd.read_csv(path)
                logger.info(f"Loaded {len(df)} events from {csv_name}")
                return df
            except Exception as e:
                logger.error(f"Error reading {csv_name}: {e}")

    return pd.DataFrame()
