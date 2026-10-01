# 🏙️ UrbanCool AI — Physics-Informed ML & Geospatial AI for Urban Heat Mitigation

[![Frontend](https://img.shields.io/badge/Frontend-Vite%20%7C%20React%20%7C%20TypeScript-61DAFB?logo=react)](frontend/)
[![Backend](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python-009688?logo=fastapi)](backend/)
[![ML Pipeline](https://img.shields.io/badge/ML-PyTorch%20%7C%20Scikit--Learn%20%7C%20SHAP-EE4C2C?logo=pytorch)](backend/pipeline/)
[![Region](https://img.shields.io/badge/Region-Mumbai%20%26%20Navi%20Mumbai-FF9900)](docs/)

**UrbanCool AI** is an end-to-end Physics-Informed Machine Learning (PINN) and Geospatial AI decision-support platform designed to analyze surface thermal dynamics, detect statistical urban heat island (UHI) hotspots, identify environmental drivers, and optimize multi-million dollar green/cool infrastructure interventions across **195,202 spatial cells** in Mumbai and Navi Mumbai.

---

## 🌟 Key Features

1. **🌐 Interactive Spatial Heat Explorer**
   - High-resolution thermal mapping across 9 geospatial layers (*LST °C, Hotspots, Albedo, NDVI, Building Height, Dew Point, Air Temp, LULC, Population Density*).
   - Real-time KDTree spatial index search by neighborhood name (*Andheri, Bandra, Powai, Vashi, Kharghar, Dadar, etc.*) or coordinates.

2. **📊 Municipal Planner Dashboard**
   - **Driver Analytics**: SHAP feature importance share and non-linear partial dependence analysis (FR3).
   - **Physics-Informed ML (PINN)**: Surface energy balance physical constraint loss vs empirical data validation (FR4 & FR7).
   - **Budget Optimization Simulator**: Knapsack budget allocation engine simulating optimal cooling ROI across $1M to $50M budgets (FR6).
   - **Automated Synthesis Reporting**: Exportable publication-grade markdown reports (FR8).

3. **🤖 Multi-LLM AI Assistant**
   - Embedded domain-trained AI assistant with prompt presets (*Heat Mitigation Expert, Municipal Policy Advisor, ML Technical Auditor*) to answer spatial queries and explain model insights.

---

## 📁 Repository Structure

```
UrbanCool-AI/
├── 📄 README.md                 # Master Project Documentation & GitHub Overview
├── 📄 .gitignore                # Root Git ignore rules
│
├── 📂 frontend/                 # React 18 + Vite + TypeScript Web Application
│   ├── 📂 src/
│   │   ├── 📂 components/       # Spatial Explorer, Planner Dashboard, AI Assistant
│   │   ├── 📂 services/         # API Service layer connecting to FastAPI backend
│   │   └── 📂 types/            # TypeScript interfaces & domain types
│   ├── 📄 package.json
│   ├── 📄 vite.config.ts
│   └── 📄 README.md
│
├── 📂 backend/                  # FastAPI Web Server & Data Services
│   ├── 📄 app.py                # FastAPI endpoints (/api/public, /api/planner)
│   ├── 📄 data_loader.py        # Spatial KDTree indexer & dataset query engine
│   ├── 📄 requirements.txt      # Python dependencies
│   ├── 📄 README.md
│   └── 📂 pipeline/             # FR1–FR8 Functional Requirements Execution Engine
│       ├── 📄 run_pipeline.py   # Master runner executing FR1–FR8 sequentially
│       ├── 📄 fr1_preprocessing.py # Spatial raster alignment & scaling
│       ├── 📄 fr2_hotspot_detection.py # Getis-Ord Gi* spatial hotspot analysis
│       ├── 📄 fr3_driver_analysis.py # SHAP driver feature ranking
│       ├── 📄 fr4_physics_informed_ml.py # Physics-Informed Neural Network (PINN)
│       ├── 📄 fr5_scenario_simulation.py # Intervention scenario modeling
│       ├── 📄 fr6_optimization.py # Spatial budget & ROI optimization
│       ├── 📄 fr7_validation.py # Cross-validation & uncertainty bounds
│       └── 📄 fr8_output_reporting.py # Executive report generator
│
├── 📂 data/                     # Primary Tabular & Raster Datasets
│   ├── 📄 mumbai_heat_dataset_clean.csv # Cleaned 195k spatial cell dataset
│   └── 📄 fr1_scaler.pkl       # Feature scaling object
│
├── 📂 outputs/                  # Model Outputs, Hotspot Maps & Generated Reports
│   ├── 📄 FINAL_URBAN_HEAT_MITIGATION_REPORT.md # Executive Synthesis Report
│   ├── 📄 fr2_hotspots.csv      # Gi* hotspot spatial statistics
│   ├── 📄 fr4_piml_metrics.json # PINN validation metrics
│   ├── 📄 fr6_optimal_interventions.csv # Ranked optimal cooling locations
│   └── 📄 fr7_validation_report.json # Model residual & error bound analysis
│
└── 📂 docs/                     # Architectural Docs & Specifications
    ├── 📄 FULL_PROJECT_DOCUMENTATION.md # Technical manual & mathematical formulas
    ├── 📄 PRD_Urban_Heat_Mitigation.md # Product Requirement Document
    ├── 📄 PROGRESS.md            # Backend milestone log
    └── 📄 UI_PROGRESS.md         # Frontend design log
```

---

## ⚡ Quick Start & Installation

### Prerequisites
- **Node.js** (v18+) & **npm**
- **Python** (v3.9+)

---

### Step 1: Run the Backend API

```bash
# Navigate to backend folder
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn app:app --reload --port 8000
```
- The backend API will start at: `http://localhost:8000`
- Interactive API Docs (Swagger): `http://localhost:8000/docs`

---

### Step 2: Run the Frontend Application

```bash
# In a new terminal window, navigate to frontend
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
- Open your browser at: `http://localhost:5173`

---

### Step 3: Run the ML Pipeline (FR1 – FR8)

If you wish to re-execute the complete data processing, PINN model training, scenario simulation, and optimization pipeline:

```bash
cd backend
python pipeline/run_pipeline.py
```

---

## 🔬 Functional Requirements (FR1 - FR8) Overview

| Module | Description | Key Algorithms / Outputs |
| :--- | :--- | :--- |
| **FR1** | Data Preprocessing & Raster Alignment | Coordinate alignment, missing value interpolation, StandardScaler |
| **FR2** | Statistical Hotspot Detection | Getis-Ord $Gi^*$ statistic, $Z$-score confidence bounds ($p < 0.01$) |
| **FR3** | Driver Analysis & SHAP | Random Forest Regressor, SHAP values, Albedo vs NDVI sensitivity |
| **FR4** | Physics-Informed ML (PINN) | PyTorch PINN incorporating Surface Energy Balance conservation loss |
| **FR5** | Scenario Simulation Engine | Multi-intervention simulation (+30% NDVI, +0.25 Albedo, combined) |
| **FR6** | Spatial Budget Optimization | Greedy Knapsack ROI optimization under budget constraints ($1M–$50M) |
| **FR7** | Validation & Error Bounds | 5-fold CV ($R^2 = 0.9148$, $RMSE = 2.15^\circ\text{C}$), residual analysis |
| **FR8** | Output Reporting | Automated markdown executive report generation |

---

## 🤝 Contributing & GitHub Workflow

1. **Fork** the repository
2. Create your feature branch (`git checkout -b feature/CoolingIntervention`)
3. Commit your changes (`git commit -m "Add new green roof simulation strategy"`)
4. Push to the branch (`git push origin feature/CoolingIntervention`)
5. Open a **Pull Request**

---

## 📄 License & Acknowledgments

Developed for urban sustainability, heat resilience planning, and climate adaptation research in **Mumbai & Navi Mumbai**.
