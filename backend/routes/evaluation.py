"""
Member B: Evaluation Metrics API Route
---------------------------------------
Provides model performance metrics for the demo panel.
"""

from fastapi import APIRouter
from backend.services.evaluation import (
    get_model_performance_summary,
    compute_classification_metrics,
    compute_regression_metrics
)

router = APIRouter(prefix="/evaluation", tags=["Model Evaluation"])


@router.get("")
def get_evaluation_summary():
    """
    Returns a comprehensive model performance summary including:
    - Priority classifier accuracy
    - Duration regressor MAE/RMSE
    - Post-event learning loop metrics
    - Training metadata
    """
    return get_model_performance_summary()


@router.get("/classification")
def get_classification_metrics():
    """
    Returns detailed classification metrics for the priority classifier:
    accuracy, precision, recall, F1 score, and confusion matrix.
    Computed from the post-event prediction log.
    """
    return compute_classification_metrics()


@router.get("/regression")
def get_regression_metrics():
    """
    Returns detailed regression metrics for the duration predictor:
    MAE, median AE, RMSE, and percentage within threshold bands.
    """
    return compute_regression_metrics()
