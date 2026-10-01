# Product Requirements Document (PRD)
## Geospatial AI/ML System for Urban Heat Mitigation & Cooling Strategy Optimization

**Version:** 1.0
**Date:** August 16, 2026
**Project Area:** Mumbai & Navi Mumbai
**Theme:** Clean & Green Technology (with Smart Automation approach)

---

## 1. Overview

### 1.1 What is this document?
This PRD defines *what* we are building, *why* we are building it, *who* it's for, and *how* it should work — in enough detail that both a human team member and an AI coding assistant can understand the project without prior context and start implementing it correctly.

### 1.2 One-line summary
A system that ingests satellite and weather data for a city, uses AI/ML to find and explain urban heat hotspots, and recommends where to place cooling interventions (trees, cool roofs, water bodies) to reduce surface temperature by a predictable number of degrees.

---

## 2. Problem Statement

Cities like Mumbai experience the **Urban Heat Island (UHI) effect** — built-up areas (concrete, asphalt, dense buildings) absorb and re-radiate heat, making urban zones significantly hotter than surrounding areas. This causes:

- Increased heat-related health risks (heat stress, heat stroke, higher mortality during heatwaves)
- Higher energy consumption (more AC usage → more heat released → feedback loop)
- Reduced outdoor livability and productivity
- Disproportionate impact on low-income, high-density neighborhoods with less green cover

**Currently, city planners lack a data-driven, quantitative tool** to answer:
- Where exactly are the worst heat hotspots?
- What is actually causing them (vegetation loss? building density? lack of water bodies?)
- If we intervene (plant trees, change roofing), how much cooler will it actually get, and where should we intervene first given limited budget/space?

This project builds that tool.

---

## 3. Goals & Objectives

| # | Objective | Description |
|---|---|---|
| 1 | **Identify** | Detect and map urban heat hotspots using satellite-derived Land Surface Temperature (LST) |
| 2 | **Explain** | Quantify which factors (land cover, vegetation, building form, population, weather) drive heat in each area |
| 3 | **Model** | Build a physics-informed ML model that predicts LST from these drivers — reliable enough to simulate scenarios it hasn't literally seen before |
| 4 | **Optimize** | Simulate cooling interventions and find the best combination/placement for maximum temperature reduction under real-world constraints |
| 5 | **Recommend** | Output a ranked, spatially-mapped action plan with estimated °C reduction per intervention |

### Non-goals (out of scope for this version)
- Real-time / live monitoring (this is a scenario-planning tool, not a live dashboard — unless explicitly extended later)
- Indoor thermal comfort modeling
- Direct policy/regulatory implementation — we provide recommendations, not enforcement
- Cities beyond Mumbai/Navi Mumbai in the initial version

---

## 4. Target Users / Stakeholders

| User | Need |
|---|---|
| **Urban planners / municipal corporations (e.g., BMC, NMMC)** | Prioritize where to invest limited budget for heat mitigation infrastructure |
| **Environmental researchers** | Quantified, reproducible driver analysis of urban heat |
| **Disaster management authorities** | Identify highest-risk zones ahead of heatwave season |
| **Hackathon/academic evaluators (your guide)** | Understand technical soundness, novelty (physics-informed ML), and real-world applicability |

---

## 5. Input Data (Dataset Requirements)

All data is raster (GeoTIFF, `.tif`) format, spatially aligned to Mumbai/Navi Mumbai, at a consistent resolution and coordinate reference system (CRS).

| Layer | File | Type | Role in System |
|---|---|---|---|
| Land Surface Temperature | `LST_2024.tif` | Continuous (°C/K) | **Target variable** — what we predict/explain |
| Land Use/Land Cover | `LULC.tif` | Categorical | Primary driver — built-up vs vegetation vs water vs bare soil |
| Vegetation Index | `NDVI_2024.tif` | Continuous (-1 to 1) | Driver — greenness/vegetation health, cooling proxy |
| Building Height | `BuildingHeight.tif` | Continuous (m) | Driver — urban canyon/airflow effect |
| Built Surface Fraction | `BuiltSurface.tif` | Continuous (0-1) | Driver — impervious surface density |
| Population Density | `PopDensity.tif` | Continuous (people/km²) | Driver — anthropogenic heat + prioritization for human impact |
| Air Temperature | `AirTemp.tif` | Continuous (°C) | Contextual/validation — felt temperature vs surface temperature |
| Dew Point | `Dewpoint.tif` | Continuous (°C) | Derives humidity — affects evapotranspiration cooling |
| Wind Speed | `WindSpeed.tif` | Continuous (m/s) | Driver — heat dispersion factor |

### 5.1 Data sources referenced in problem statement (for extension/validation)
- Landsat 8, ECOSTRESS (LST)
- Sentinel-2/Landsat (LULC)
- ERA5, Central Pollution Control Board (meteorological variables)
- OpenStreetMap, Global Human Settlement Layer, UT-GLOBUS (urban morphology)
- Optional physics tools: SOLWEIG, InVEST

---

## 6. System Architecture / Functional Requirements

### FR1 — Data Preprocessing Pipeline
- Co-register all raster layers to a common grid (same resolution, CRS, extent)
- Handle missing/cloud-masked pixels (interpolation or masking)
- Normalize/scale continuous variables for ML input
- Output: a single stacked, analysis-ready multi-band raster dataset

### FR2 — Hotspot Detection Module
- Input: preprocessed LST layer
- Process: generate heat stress classification (e.g., quantile-based or anomaly-based thresholds) + spatial autocorrelation test (Getis-Ord Gi*)
- Output: hotspot map (statistically significant hot clusters vs cold clusters vs not significant)

### FR3 — Driver Analysis Module
- Input: LST + all driver layers
- Process: correlation analysis (Pearson/Spearman) + Random Forest regression + SHAP value computation
- Output: ranked feature importance table/chart (e.g., "Built Surface: 38%, NDVI: 27%, Building Height: 15%...")

### FR4 — Physics-Informed ML Model (core model)
- Input: driver layers (LULC, NDVI, building height, built surface, pop density, air temp, dewpoint, wind speed)
- Output: predicted LST
- Architecture: neural network (or hybrid ML) with a **custom loss function** = data loss (prediction error) + physics residual loss (violation of surface energy balance equations, informed by SOLWEIG-style radiative transfer principles)
- Requirement: model must generalize to unseen intervention scenarios (e.g., predicting LST after adding vegetation where none currently exists), not just interpolate within observed data

### FR5 — Scenario Simulation Engine
- Input: baseline data + a proposed intervention (e.g., "increase NDVI by X in region Y", "reduce built surface by Z%", "increase albedo in region Y")
- Process: modify the relevant input layer(s) → re-run trained model (FR4) → get predicted new LST
- Output: predicted ΔT (temperature change) for that scenario

### FR6 — Optimization Module
- Input: set of possible intervention types + candidate locations + constraints (budget, space availability, feasibility)
- Process: search algorithm (Genetic Algorithm or Bayesian Optimization) that calls the Scenario Simulation Engine (FR5) repeatedly to evaluate candidate solutions
- Output: optimal set of interventions (type + location + amount) that maximizes total cooling within constraints

### FR7 — Validation Module
- Compare model predictions against held-out real data / documented case studies of similar interventions
- Report error metrics (RMSE, MAE) and uncertainty bounds

### FR8 — Output/Reporting Module
- Generate final ranked intervention list: location, intervention type, predicted °C reduction, cost/feasibility notes
- Generate visual maps (heat maps, hotspot maps, before/after simulation maps)

---

## 7. Data Flow Summary

```
Raw satellite/weather rasters
        ↓
FR1: Preprocessing (align, clean, normalize)
        ↓
    ┌───┴────┐
    ↓        ↓
FR2: Hotspot   FR3: Driver Analysis
Detection      (correlation + SHAP)
    ↓        ↓
    └───┬────┘
        ↓
FR4: Physics-Informed ML Model (trained on drivers → LST)
        ↓
FR5: Scenario Simulation (modify inputs, re-predict)
        ↓
FR6: Optimization (search best intervention combo)
        ↓
FR7: Validation (check against real/benchmark data)
        ↓
FR8: Final Output (ranked interventions + maps)
```

---

## 8. Non-Functional Requirements

| Requirement | Detail |
|---|---|
| **Accuracy** | Model predictions should be validated with acceptable error margin (e.g., RMSE within a few °C, to be defined after baseline testing) |
| **Interpretability** | Driver analysis must be explainable (SHAP-based), not a black box — critical for planner trust and guide evaluation |
| **Generalizability** | Physics-informed constraints so the model behaves sensibly on unseen scenarios, not just memorized patterns |
| **Reproducibility** | Pipeline should be scriptable/repeatable on new data (e.g., a different year or a different city later) |
| **Scalability (future)** | Architecture should allow extension to other Indian cities using the same pipeline |
| **Visualization** | All key outputs (hotspots, drivers, scenarios) must be presentable as clear maps/charts for non-technical stakeholders |

---

## 9. Success Metrics

| Metric | Target/Purpose |
|---|---|
| Hotspot detection accuracy | Statistically significant clusters align with known hot zones (visual/expert validation) |
| Driver model performance (R², RMSE) | Random Forest / SHAP model should explain a high proportion of LST variance |
| Physics-informed model validation error | Predicted vs actual LST error within acceptable bounds on held-out data |
| Scenario realism | Simulated cooling effects should be consistent with published literature values (e.g., known cooling effect of X% tree cover) |
| Optimization output usefulness | Recommended interventions should be spatially feasible and prioritized sensibly (e.g., not recommending a park in a highway pixel) |

---

## 10. Key Risks & Assumptions

| Risk/Assumption | Mitigation |
|---|---|
| Satellite data (cloud cover, resolution mismatch) may have gaps | Use interpolation/masking; document limitations |
| Physics-informed loss function is complex to implement correctly | Start with a simpler energy-balance approximation before full SOLWEIG integration |
| Limited ground-truth data for validating intervention effectiveness | Use published literature benchmarks (e.g., known NDVI-vs-LST relationships) as proxy validation |
| Optimization search space could be very large | Constrain search space using feasibility filters (e.g., only public land, only within budget) before optimization runs |
| Model may not generalize well to extreme/unseen scenarios | Physics constraints specifically designed to address this; test explicitly on out-of-distribution scenarios |

---

## 11. Deliverables (Final Outcomes)

1. **Heat Stress Maps** — showing hotspots across Mumbai/Navi Mumbai
2. **Driver Importance Report** — quantified ranking of what causes heat in each zone
3. **Validated Physics-Informed ML Model** — trained and tested
4. **Scenario Evaluation Results** — cooling effect of different intervention types
5. **Final Optimized Intervention Plan** — type, location, and estimated °C reduction per recommendation

---

## 12. How This Should Be Explained (for guide/presentation)

1. **The problem:** Mumbai has heat islands; we don't know exactly where, why, or what to do about it with limited resources.
2. **The data:** 9 satellite/weather layers covering temperature, land cover, vegetation, buildings, population, and atmosphere — all mapped pixel-by-pixel over the city.
3. **The method:** Find hotspots statistically → explain them with explainable AI → model heat physics with AI that respects real-world energy balance laws → simulate "what-if" cooling interventions → let an optimization algorithm find the best combination → validate against real data.
4. **The output:** A ranked, mapped action plan telling the city exactly what to build, where, and how much cooler it will get.
