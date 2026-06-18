import joblib
from pathlib import Path
import sys

# Dynamically patch scikit-learn version differences for unpickling
try:
    import sklearn.compose._column_transformer
    if not hasattr(sklearn.compose._column_transformer, "_RemainderColsList"):
        class MockRemainderColsList(list):
            pass
        sklearn.compose._column_transformer._RemainderColsList = MockRemainderColsList
except ImportError:
    pass

from backend.config import MODELS_DIR
from backend.utils.helpers import logger

# Global cached encoders/preprocessors
_preprocessor = None
_knn_encoder = None

def load_priority_preprocessor():
    """
    Loads the ColumnTransformer preprocessor used by the models.
    (Note: The model pipelines themselves often contain the preprocessor,
     but we might need it for direct encoding).
    """
    global _preprocessor
    if _preprocessor is None:
        path = MODELS_DIR / "feature_encoder.pkl"
        if path.exists():
            try:
                _preprocessor = joblib.load(path)
                logger.info("Successfully loaded feature_encoder.pkl")
            except Exception as e:
                logger.exception(f"Error loading feature_encoder.pkl: {e}")
        else:
            logger.warning("feature_encoder.pkl not found")
    return _preprocessor

def load_knn_encoder():
    """
    Loads the specific encoder used for the K-NN recommendation engine.
    """
    global _knn_encoder
    if _knn_encoder is None:
        path = MODELS_DIR / "recommendation_encoder.pkl"
        if not path.exists():
            # Fallback to feature_encoder if recommendation_encoder is missing
            path = MODELS_DIR / "feature_encoder.pkl"
            
        if path.exists():
            try:
                _knn_encoder = joblib.load(path)
                logger.info(f"Successfully loaded K-NN encoder from {path.name}")
            except Exception as e:
                logger.exception(f"Error loading K-NN encoder: {e}")
        else:
            logger.warning("No encoder found for K-NN recommendation engine")
    return _knn_encoder
