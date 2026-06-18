# 🚦 Gridlock Bengaluru — Traffic Event Intelligence Platform

Gridlock Bengaluru is a real-time predictive traffic management, dispatch, and resourcing recommendation platform designed for the Astram AI Traffic pipeline. The platform integrates machine learning forecasting, spatial risk calendar heatmaps, nearest-neighbor historical incident recommendations, and an active post-event closed learning loop.

## 🚀 Live Link
* **Live Deployment URL**: [Click here to visit Gridlock Bengaluru](https://traffic-event-intelligence.onrender.com)

---

## 💻 Tech Stack
* **Frontend**: React (v19), Vite, Leaflet & React-Leaflet (Map visualization), Recharts (Analytics graphs), Axios.
* **Backend**: FastAPI (Python ASGI framework), Uvicorn.
* **Database**: Serverless PostgreSQL (Neon.tech) with PostGIS spatial extension, SQLite (Local development fallback), SQLAlchemy (ORM).
* **Machine Learning**: XGBoost (Classifier & Regressor), Scikit-Learn (k-Nearest Neighbors similarity engine), Pandas, NumPy.

---

## 🛠 Architecture & Features

1. **Cleaned Event Datasets & Preprocessing**:
   * Preprocesses 8,000+ historical events in Bengaluru.
   * Auto-assigns missing event zones by checking latitude and longitude using spatial raycasting.
2. **Corridor Risk Heatmap**:
   * Aggregates incident frequencies and average duration metrics into an interactive corridor × hour grid.
   * Computes a Top-K Hit Rate validation metric.
3. **Priority Classifier & Duration Regressor**:
   * Predicts priority (`High` vs `Low`) using an XGBoost Classifier.
   * Predicts clearance duration (minutes) using an XGBoost Regressor.
4. **Similarity-Based Recommendation Engine**:
   * Finds the top 5 nearest historical analogues using `NearestNeighbors` (cosine similarity) to suggest police stations, manpower bands, and diversion routes.
   * Runs dynamically on live database records (PostgreSQL/SQLite) so that any newly logged events instantly become search candidates for future simulations.
5. **Post-Event Learning Loop**:
   * Tracks predictions vs. actual clearance times, calculates rolling MAE, and triggers on-demand model retraining.

---

## 💻 How to Run and Test Locally

### **1. Backend API Service Setup**
Make sure you are in the root directory:
```bash
# Activate virtual environment
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Re-create & seed the local SQLite database
python -m database.setup_db

# Start local Uvicorn development server
python run.py
```
*Backend is now running on **`http://localhost:8000`**.*

### **2. Frontend Dashboard Setup**
In a new terminal:
```bash
# Navigate to dashboard folder
cd traffic-dashboard

# Install node packages
npm install

# Start Vite React server
npm run dev
```
*Frontend is now running on **`http://localhost:5173`**.*
