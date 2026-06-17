"""
Astram Traffic Event Intelligence — Local Development Server
Run with: python run.py
"""
import uvicorn
from backend.config import PORT, HOST, DEBUG

if __name__ == "__main__":
    uvicorn.run(
        "backend.app:app",
        host=HOST,
        port=PORT,
        reload=DEBUG,
        log_level="info"
    )
