import os
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "models"
DATA_DIR = BASE_DIR / "data"

# Database Configuration
# In production, Render will inject DATABASE_URL.
# If not present, we will fallback to local SQLite.
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"sqlite:///{BASE_DIR}/traffic_intelligence.db"
)

# App configurations
APP_NAME = "Astram AI Traffic Management Backend"
DEBUG = os.getenv("DEBUG", "False").lower() in ("true", "1")
PORT = int(os.getenv("PORT", "8000"))
HOST = os.getenv("HOST", "0.0.0.0")
