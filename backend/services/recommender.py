import os
import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any, List
from sklearn.neighbors import NearestNeighbors
from backend.config import DATA_DIR
from backend.utils.helpers import logger
from backend.utils.preprocessing import load_knn_encoder
from backend.services.predictor import predict_event_impact

# Cache for historical data
_historical_planned = None
_historical_unplanned = None

def load_historical_data():
    """
    Loads historical datasets from the processed data directory.
    """
    global _historical_planned, _historical_unplanned
    
    if _historical_planned is None:
        path = DATA_DIR / "processed" / "planned_events.csv"
        if path.exists():
            _historical_planned = pd.read_csv(path)
            logger.info("Loaded historical planned events")
        else:
            logger.warning(f"planned_events.csv not found at {path}")
            _historical_planned = pd.DataFrame()
            
    if _historical_unplanned is None:
        path = DATA_DIR / "processed" / "unplanned_events.csv"
        if path.exists():
            _historical_unplanned = pd.read_csv(path)
            logger.info("Loaded historical unplanned events")
        else:
            logger.warning(f"unplanned_events.csv not found at {path}")
            _historical_unplanned = pd.DataFrame()
            
    return _historical_planned, _historical_unplanned

def recommend(event_dict: Dict[str, Any], db=None) -> Dict[str, Any]:
    """
    Fulfills Step 6: Similarity-Based Recommendation Engine
    Returns predictions + resourcing recommendations + analogues.
    """
    # 1. Run predictions first
    predictions = predict_event_impact(event_dict, db)
    engineered = predictions["engineered_features"]
    
    # 2. Get similarity features
    # These must match the features used to train the encoder
    similarity_features = [
        "event_cause", "event_type", "corridor", "zone",
        "hour_of_day", "day_of_week", "requires_road_closure",
        "planned_flag", "is_peak_hour"
    ]
    
    # Load historical datasets
    planned_df, unplanned_df = load_historical_data()
    
    # Determine which subset to search
    is_planned = engineered.get("planned_flag", 0) == 1
    hist_df = planned_df if is_planned else unplanned_df
    
    # Fallback to the other dataset if one is empty
    if hist_df.empty:
        hist_df = unplanned_df if not unplanned_df.empty else planned_df
        
    if hist_df.empty:
        # If both are empty, return baseline empty recommendations
        return {
            "predicted_priority": predictions["predicted_priority"],
            "predicted_duration_minutes": predictions["predicted_duration_minutes"],
            "recommended_station": event_dict.get("police_station", "Unknown Station"),
            "manpower_band": "Medium",
            "suggested_diversion": "Use alternate routes.",
            "similar_past_events": []
        }
        
    # Copy candidates to filter
    candidate_df = hist_df.copy()
    
    # Clean and filter by cause if possible
    cause = str(event_dict.get("event_cause", "")).lower().strip()
    if cause and "event_cause" in candidate_df.columns:
        candidate_df["event_cause_clean"] = candidate_df["event_cause"].astype(str).str.lower().str.strip()
        same_cause = candidate_df[candidate_df["event_cause_clean"] == cause]
        if len(same_cause) >= 10:
            candidate_df = same_cause
            
    # Load K-NN encoder
    encoder = load_knn_encoder()
    
    # Prepare target event for K-NN
    # Ensure all similarity features exist
    target_event_df = pd.DataFrame([engineered])[similarity_features]
    
    # Transform candidate features
    # Ensure columns exist in candidate
    for col in similarity_features:
        if col not in candidate_df.columns:
            candidate_df[col] = np.nan
            
    try:
        # Encode candidates and target
        X_candidates = encoder.transform(candidate_df[similarity_features])
        X_target = encoder.transform(target_event_df)
        
        # Fit K-NN on candidates on-the-fly (extremely fast)
        n_neighbors = min(10, len(candidate_df))
        knn = NearestNeighbors(n_neighbors=n_neighbors, metric="cosine")
        knn.fit(X_candidates)
        
        distances, indices = knn.kneighbors(X_target)
        neighbors = candidate_df.iloc[indices[0]].copy()
        
        # Add distance
        neighbors["distance"] = distances[0]
        
        # Extract fields from analogues
        # 1. Recommended police station (mode of neighbors)
        recommended_station = "Unknown Station"
        if "police_station" in neighbors.columns:
            stations = neighbors["police_station"].dropna()
            if not stations.empty:
                recommended_station = stations.mode().iloc[0]
                
        if recommended_station == "Unknown Station" or pd.isna(recommended_station):
            recommended_station = event_dict.get("police_station") or "Central Traffic Control"
            
        # 2. Typical resolution time and manpower band
        avg_dur = neighbors["duration_minutes"].dropna().mean() if "duration_minutes" in neighbors.columns else np.nan
        if pd.isna(avg_dur):
            avg_dur = predictions["predicted_duration_minutes"]
            
        if avg_dur < 60:
            manpower = "Low"
        elif avg_dur < 180:
            manpower = "Medium"
        else:
            manpower = "High"
            
        # 3. Suggested diversion template
        suggested_diversion = "Follow local traffic signs and monitor announcements."
        diversion_cols = ["route_path", "resolved_at_address", "direction"]
        for col in diversion_cols:
            if col in neighbors.columns:
                vals = neighbors[col].dropna()
                if not vals.empty:
                    suggested_diversion = f"Based on analogues, diversion was: {vals.mode().iloc[0]}"
                    break
        else:
            corridor = event_dict.get("corridor")
            if corridor:
                suggested_diversion = f"Use alternative routes near {corridor} to avoid delays."
                
        # 4. Compile similar past events (top 5)
        similar_past = []
        cols_to_include = ["event_cause", "corridor", "priority", "duration_minutes", "police_station"]
        for _, row in neighbors.head(5).iterrows():
            item = {}
            for col in cols_to_include:
                val = row.get(col)
                if pd.isna(val):
                    val = None
                item[col] = val
            similar_past.append(item)
            
    except Exception as e:
        logger.error(f"Error during recommendation similarity search: {e}")
        # Fallback recommendations if fit/transform fails
        recommended_station = event_dict.get("police_station") or "Central Traffic Control"
        manpower = "Medium"
        suggested_diversion = "Use alternative routes."
        similar_past = []
        
    return {
        "predicted_priority": predictions["predicted_priority"],
        "predicted_duration_minutes": predictions["predicted_duration_minutes"],
        "recommended_station": recommended_station,
        "manpower_band": manpower,
        "suggested_diversion": suggested_diversion,
        "similar_past_events": similar_past
    }
