"""
Member B: Evaluation Metrics Service
-------------------------------------
Provides comprehensive model evaluation metrics including:
- Priority classifier accuracy (F1, precision, recall)
- Duration regressor error metrics (MAE, RMSE, median AE)
- Top-K hit rate for risk calendar
- Post-event learning loop metrics
"""

import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, Any
from backend.config import DATA_DIR, MODELS_DIR
from backend.utils.helpers import logger


def get_model_performance_summary() -> Dict[str, Any]:
    """
    Aggregates all model evaluation metrics into a single summary
    for the demo/pitch presentation.
    """
    summary = {
        "model_version": "1.0",
        "computed_at": datetime.utcnow().isoformat(),
        "training_records": 0,
        "priority_classifier": {},
        "duration_regressor": {},
        "recommendation_engine": {},
        "post_event_learning": {}
    }

    # 1. Load model metadata
    import json
    metadata_path = MODELS_DIR.parent / "deployment_assets" / "model_metadata.json"
    if metadata_path.exists():
        try:
            with open(metadata_path) as f:
                meta = json.load(f)
            summary["training_records"] = meta.get("training_records", 0)
            summary["priority_classifier"]["accuracy"] = meta.get("priority_accuracy", 0)
            summary["duration_regressor"]["median_error"] = meta.get("median_duration_error", 0)
            summary["duration_regressor"]["mean_error"] = meta.get("mean_duration_error", 0)
        except Exception as e:
            logger.error(f"Error loading model metadata: {e}")

    # 2. Load prediction log for post-event learning metrics
    prediction_log_path = DATA_DIR / "exports" / "prediction_log.csv"
    if prediction_log_path.exists():
        try:
            log_df = pd.read_csv(prediction_log_path)
            total = len(log_df)
            summary["post_event_learning"]["total_predictions_logged"] = total

            if total > 0:
                # Duration error stats
                if "duration_error" in log_df.columns:
                    errs = log_df["duration_error"].dropna()
                    summary["post_event_learning"]["rolling_mae"] = round(float(errs.mean()), 2)
                    summary["post_event_learning"]["rolling_median_ae"] = round(float(errs.median()), 2)

                # Priority accuracy
                if "priority_correct" in log_df.columns:
                    correct = log_df["priority_correct"].dropna()
                    summary["post_event_learning"]["rolling_accuracy"] = round(float(correct.mean()), 4)

        except Exception as e:
            logger.error(f"Error loading prediction log: {e}")

    # 3. Model performance CSV
    perf_path = DATA_DIR / "exports" / "model_performance.csv"
    if perf_path.exists():
        try:
            perf_df = pd.read_csv(perf_path)
            summary["performance_history"] = perf_df.to_dict(orient="records")
        except Exception as e:
            logger.error(f"Error loading model_performance.csv: {e}")

    # 4. Recommendation engine stats
    rec_path = DATA_DIR / "exports" / "recommendation_examples.csv"
    if rec_path.exists():
        try:
            rec_df = pd.read_csv(rec_path)
            summary["recommendation_engine"]["total_examples"] = len(rec_df)
        except Exception as e:
            pass

    return summary


def compute_classification_metrics() -> Dict[str, Any]:
    """
    Computes detailed classification metrics from the prediction log.
    """
    prediction_log_path = DATA_DIR / "exports" / "prediction_log.csv"
    if not prediction_log_path.exists():
        return {"message": "No prediction log available"}

    try:
        df = pd.read_csv(prediction_log_path)
        if df.empty or "actual_priority" not in df.columns:
            return {"message": "Insufficient prediction log data"}

        # Map priorities to binary safely
        def map_priority(val):
            if pd.isna(val):
                return np.nan
            val_str = str(val).strip().lower()
            if val_str in ("high", "1", "1.0"):
                return 1
            if val_str in ("low", "0", "0.0"):
                return 0
            return np.nan

        df["actual_binary"] = df["actual_priority"].apply(map_priority)
        df["pred_binary"] = df["predicted_priority"].apply(map_priority)

        # Remove NaN
        mask = df["actual_binary"].notna() & df["pred_binary"].notna()
        df = df[mask]

        if df.empty:
            return {"message": "No valid predictions to evaluate"}

        y_true = df["actual_binary"].values
        y_pred = df["pred_binary"].values

        # Manual metric computation (no sklearn dependency for this)
        tp = int(((y_true == 1) & (y_pred == 1)).sum())
        tn = int(((y_true == 0) & (y_pred == 0)).sum())
        fp = int(((y_true == 0) & (y_pred == 1)).sum())
        fn = int(((y_true == 1) & (y_pred == 0)).sum())

        total = tp + tn + fp + fn
        accuracy = (tp + tn) / total if total > 0 else 0
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0
        f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0

        return {
            "accuracy": round(accuracy, 4),
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1_score": round(f1, 4),
            "confusion_matrix": {
                "true_positive": tp,
                "true_negative": tn,
                "false_positive": fp,
                "false_negative": fn
            },
            "total_evaluated": total
        }
    except Exception as e:
        logger.error(f"Error computing classification metrics: {e}")
        return {"message": f"Error: {str(e)}"}


def compute_regression_metrics() -> Dict[str, Any]:
    """
    Computes duration regression metrics from the prediction log.
    """
    prediction_log_path = DATA_DIR / "exports" / "prediction_log.csv"
    if not prediction_log_path.exists():
        return {"message": "No prediction log available"}

    try:
        df = pd.read_csv(prediction_log_path)
        if df.empty or "actual_duration" not in df.columns:
            return {"message": "Insufficient prediction log data"}

        mask = df["actual_duration"].notna() & df["predicted_duration"].notna()
        df = df[mask]

        if df.empty:
            return {"message": "No valid duration predictions"}

        actual = df["actual_duration"].values
        predicted = df["predicted_duration"].values
        errors = np.abs(actual - predicted)

        mae = float(np.mean(errors))
        median_ae = float(np.median(errors))
        rmse = float(np.sqrt(np.mean((actual - predicted) ** 2)))

        # Percentage within various thresholds
        within_30min = float((errors <= 30).mean())
        within_60min = float((errors <= 60).mean())
        within_120min = float((errors <= 120).mean())

        return {
            "mae": round(mae, 2),
            "median_absolute_error": round(median_ae, 2),
            "rmse": round(rmse, 2),
            "within_30min_pct": round(within_30min * 100, 1),
            "within_60min_pct": round(within_60min * 100, 1),
            "within_120min_pct": round(within_120min * 100, 1),
            "total_evaluated": len(df)
        }
    except Exception as e:
        logger.error(f"Error computing regression metrics: {e}")
        return {"message": f"Error: {str(e)}"}
