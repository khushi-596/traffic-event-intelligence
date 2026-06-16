import logging
from datetime import datetime
import pytz

# Setup logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("AstramTraffic")

def parse_utc_datetime(dt_str) -> datetime:
    """
    Parse datetime string and ensure it is timezone-aware in UTC.
    """
    if not dt_str:
        return None
    
    if isinstance(dt_str, datetime):
        if dt_str.tzinfo is None:
            return dt_str.replace(tzinfo=pytz.UTC)
        return dt_str.astimezone(pytz.UTC)
        
    try:
        # Standard ISO formats
        for fmt in (
            "%Y-%m-%dT%H:%M:%S.%f%z",
            "%Y-%m-%dT%H:%M:%S%z",
            "%Y-%m-%d %H:%M:%S%z",
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%dT%H:%M:%S.%f"
        ):
            try:
                dt = datetime.strptime(str(dt_str), fmt)
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=pytz.UTC)
                else:
                    dt = dt.astimezone(pytz.UTC)
                return dt
            except ValueError:
                continue
                
        # Try pandas-style parsing if string matches
        dt = datetime.fromisoformat(str(dt_str).replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=pytz.UTC)
        return dt
    except Exception as e:
        logger.warning(f"Failed to parse datetime '{dt_str}': {e}. Returning current UTC time.")
        return datetime.utcnow().replace(tzinfo=pytz.UTC)
