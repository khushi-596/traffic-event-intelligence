"""
Member B: Risk Calendar API Route
-----------------------------------
Standalone /risk-calendar endpoint with:
- Full heatmap data (corridor × hour × cause)
- Top-K hit rate evaluation metric
- Filtering by corridor and cause
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from backend.database import get_db
from backend.services.risk_calendar import (
    get_risk_calendar_data,
    compute_top_k_hit_rate
)

router = APIRouter(prefix="/risk-calendar", tags=["Risk Calendar"])


@router.get("")
def get_risk_calendar(
    corridor: Optional[str] = Query(None, description="Filter by corridor name"),
    event_cause: Optional[str] = Query(None, description="Filter by event cause"),
    db: Session = Depends(get_db)
):
    """
    Returns the corridor × hour × event_cause heatmap data for risk visualization.

    This is the Step 3 deliverable — the descriptive risk calendar showing
    where and when events cluster, with average duration and high-priority
    percentage per cell.

    Optional query params:
    - corridor: filter to a specific corridor
    - event_cause: filter to a specific cause type
    """
    return get_risk_calendar_data(
        db=db,
        corridor_filter=corridor,
        cause_filter=event_cause
    )


@router.get("/top-k")
def get_top_k_hit_rate(
    k: int = Query(5, ge=1, le=50, description="Number of top risk slots"),
    db: Session = Depends(get_db)
):
    """
    Computes the top-K hit rate evaluation metric.

    Uses an 80/20 date-based train/test split:
    - Builds a risk calendar from the first 80% of events
    - Checks what % of the remaining 20% fall into the top-K riskiest slots
    - Returns the hit rate as a quick accuracy proxy for the pitch

    This metric tells you: "If we flagged only the K most dangerous corridor-hour
    slots, what fraction of future events would we catch?"
    """
    return compute_top_k_hit_rate(db=db, k=k)
