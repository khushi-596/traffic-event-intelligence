import pandas as pd
from typing import List, Dict, Any
from backend.config import DATA_DIR
from backend.utils.helpers import logger
from backend.database import EventModel

def get_risk_calendar_data(db=None) -> List[Dict[str, Any]]:
    """
    Returns the corridor x hour event count heatmap data.
    If database has events, compiles it from the database.
    Otherwise, reads from the pre-calculated CSV.
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
