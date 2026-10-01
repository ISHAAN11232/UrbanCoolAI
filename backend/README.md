# UrbanCool AI - Backend & ML Engine

The backend service for **UrbanCool AI**, powering heat risk analysis, hotspot detection, physics-informed machine learning (PINN), intervention optimization, and high-performance spatial search over 195,000+ points across Mumbai & Navi Mumbai.

---

## 🏗 Backend Architecture

```
backend/
├── app.py                  # FastAPI Application Server (Port 8000)
├── data_loader.py          # KDTree Spatial Indexer & Data Lookup Service
├── requirements.txt        # Python Dependencies
├── README.md               # Backend Documentation
└── pipeline/               # ML Pipeline Execution Modules (FR1–FR8)
    ├── __init__.py
    ├── run_pipeline.py     # Master Runner to execute FR1–FR8 sequentially
    ├── fr1_preprocessing.py # Data preprocessing & raster alignment
    ├── fr2_hotspot_detection.py # Getis-Ord Gi* hotspot statistical analysis
    ├── fr3_driver_analysis.py # SHAP feature importance & driver analysis
    ├── fr4_physics_informed_ml.py # Physics-Informed Neural Network (PINN) model
    ├── fr5_scenario_simulation.py # Intervention scenario modeling engine
    ├── fr6_optimization.py # Knapsack & spatial intervention budget optimizer
    ├── fr7_validation.py # Model cross-validation & uncertainty bounds
    └── fr8_output_reporting.py # Comprehensive Markdown report generator
```

---

## 🚀 Quick Start

### 1. Requirements & Virtual Environment

Ensure Python 3.9+ is installed.

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Launch FastAPI Web Server

```bash
# Run server using uvicorn from the backend directory
uvicorn app:app --reload --port 8000
```
- API Base URL: `http://localhost:8000`
- Interactive Swagger API Docs: `http://localhost:8000/docs`
- ReDoc API Documentation: `http://localhost:8000/redoc`

---

## 🧪 Running the ML Pipeline (FR1 - FR8)

To re-run data processing, model training, PINN evaluation, scenario simulation, and optimization:

```bash
# Execute master pipeline runner
python pipeline/run_pipeline.py
```

Or execute individual modules:
```bash
python pipeline/fr1_preprocessing.py
python pipeline/fr2_hotspot_detection.py
python pipeline/fr3_driver_analysis.py
python pipeline/fr4_physics_informed_ml.py
python pipeline/fr5_scenario_simulation.py
python pipeline/fr6_optimization.py
python pipeline/fr7_validation.py
python pipeline/fr8_output_reporting.py
```

---

## 📡 Key API Endpoints

- `GET /api/public/neighborhoods`: Returns pre-indexed Mumbai & Navi Mumbai neighborhoods.
- `GET /api/public/search?q={query}`: Searches location by name or coordinates.
- `GET /api/public/cell?lat={lat}&lon={lon}`: Spatial KDTree lookup for specific coordinates.
- `GET /api/public/grid`: Retrieves thermal spatial grid data for map rendering.
- `GET /api/planner/drivers`: Returns SHAP driver feature rankings.
- `GET /api/planner/model-metrics`: Returns PINN loss and validation metrics.
- `POST /api/planner/optimize`: Budget-constrained intervention optimization simulation.
