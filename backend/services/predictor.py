import joblib
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, Any
from backend.config import MODELS_DIR
from backend.utils.helpers import logger
from backend.utils.feature_builder import build_features

# Global cached models
_priority_model = None
_duration_model = None
_feature_columns = None

def load_priority_model():
    global _priority_model
    if _priority_model is None:
        path = MODELS_DIR / "priority_classifier.pkl"
        if path.exists():
            _priority_model = joblib.load(path)
            logger.info("Successfully loaded priority_classifier.pkl")
        else:
            logger.error("priority_classifier.pkl not found!")
            raise FileNotFoundError(f"priority_classifier.pkl not found in {MODELS_DIR}")
    return _priority_model

def load_duration_model():
    global _duration_model
    if _duration_model is None:
        path = MODELS_DIR / "duration_regressor.pkl"
        if path.exists():
            _duration_model = joblib.load(path)
            logger.info("Successfully loaded duration_regressor.pkl")
        else:
            logger.error("duration_regressor.pkl not found!")
            raise FileNotFoundError(f"duration_regressor.pkl not found in {MODELS_DIR}")
    return _duration_model

def load_feature_columns():
    global _feature_columns
    if _feature_columns is None:
        path = MODELS_DIR / "feature_columns.pkl"
        if path.exists():
            _feature_columns = joblib.load(path)
            logger.info("Successfully loaded feature_columns.pkl")
        else:
            # Fallback hardcoded columns
            _feature_columns = [
                "event_cause", "event_type", "corridor", "zone",
                "hour_of_day", "day_of_week", "requires_road_closure",
                "is_peak_hour", "planned_flag"
            ]
            logger.warning("feature_columns.pkl not found, using default fallback list")
    return _feature_columns

def predict_event_impact(event_dict: Dict[str, Any], db=None) -> Dict[str, Any]:
    """
    Given raw event input, engineers features, predicts priority, and then predicts duration.
    Returns:
        {
            "predicted_priority": "High" | "Low",
            "predicted_priority_val": 1 | 0,
            "predicted_duration_minutes": float
        }
    """
    # 1. Engineer features
    features = build_features(event_dict, db)
    
    # 2. Prepare features for classifier
    features_clf = load_feature_columns()
    df_clf = pd.DataFrame([features])[features_clf]
    
    # 3. Predict priority
    clf_model = load_priority_model()
    pred_priority_val = int(clf_model.predict(df_clf)[0])
    predicted_priority = "High" if pred_priority_val == 1 else "Low"
    
    # 4. Prepare features for duration regressor (requires priority_encoded)
    features_reg = features_clf + ["priority_encoded"]
    features_for_reg = features.copy()
    features_for_reg["priority_encoded"] = pred_priority_val
    df_reg = pd.DataFrame([features_for_reg])[features_reg]
    
    # 5. Predict duration
    reg_model = load_duration_model()
    pred_log_dur = reg_model.predict(df_reg)[0]
    predicted_duration_minutes = float(np.expm1(pred_log_dur))
    
    # Floor negative durations if any anomaly occurs
    predicted_duration_minutes = max(0.0, predicted_duration_minutes)
    
    return {
        "predicted_priority": predicted_priority,
        "predicted_priority_val": pred_priority_val,
        "predicted_duration_minutes": round(predicted_duration_minutes, 2),
        "engineered_features": features
    }
