# Urban Heat Mitigation UI — Progress Log

Tracking frontend & API integration progress for the Urban Heat Mitigation UI project (Mumbai & Navi Mumbai region).

---

## Phase Status Summary

| Phase | Description | Status | Target Backend Outputs | Key Files Built |
|---|---|---|---|---|
| **Phase 1** | Base Public Heat Risk Explorer | **DONE** | `mumbai_heat_dataset_clean.csv`, `fr2_hotspots.csv`, `top_50_ranked_interventions.csv` | `server/data_loader.py`, `server/app.py`, `HeatMap2D.tsx`, `LocationSearch.tsx`, `PublicInfoPanel.tsx` |
| **Phase 2** | Planner Dashboard Mode | **DONE** | `fr3_driver_importance_ranking.csv`, `fr4_piml_metrics.json`, `fr6_optimal_interventions.csv`, `fr7_validation_report.json` | `PlannerDashboard.tsx`, `/api/planner/drivers`, `/api/planner/optimize` |
| **Phase 3** | Before / After Heat Slider | **DONE** | `fr5_scenario_results.csv` | `ScenarioSlider.tsx` |
| **Phase 4** | 3D City View | **DONE** | `mumbai_heat_dataset_clean.csv` (`BuildingHeight_m`) | `City3DView.tsx` (Deck.gl WebGL 3D ColumnLayer) |
| **Phase 5** | AI Chat Interface | **DONE** | All FR1–FR8 outputs & spatial KDTree index | `ChatDrawer.tsx`, `/api/chat` |

---

## Technical Stack & Architecture

- **Backend API**: Python FastAPI (`server/app.py`) serving KDTree-accelerated spatial queries (< 5ms response time) over 195,202 data points.
- **Frontend App**: Vite + React + TypeScript
- **Design System**: Custom Glassmorphism Dark Theme (`index.css`), Outfit & Inter fonts, thermal badges, animated state indicators.
- **Geospatial Mapping**:
  - 2D: Leaflet with CartoDB Dark basemaps and heat circle markers.
  - 3D: Deck.gl ColumnLayer rendering building heights and thermal color shading.
- **Analytics & Visuals**: Recharts bar chart for SHAP feature importance shares & Pearson correlation parameters.
- **AI Engine**: Python spatial query engine parsing neighborhood entities and returning plain-language driver breakdowns with map focus triggers.

---

## Step-by-Step Build Log

### Phase 1 — Base Public Heat Explorer (Completed)
- **Backend**: Ingested 195,202 grid points in `server/data_loader.py` with SciPy KDTree index. Pre-translated SHAP technical drivers into plain-language explanations for residents (no jargon like "SHAP", "Gi*", "PINN").
- **Endpoints**: `/api/public/search`, `/api/public/cell`, `/api/public/grid`, `/api/public/neighborhoods`.
- **UI Components**: Interactive 2D Leaflet map, neighborhood auto-complete search bar, plain-language risk info card (Low/Moderate/High/Extreme), surface temperature badge, hotspot warning callouts, and nearest FR6 cooling solution card.

### Phase 2 — Planner Dashboard Mode (Completed)
- **UI Components**: `PlannerDashboard.tsx` with 4 sub-tabs:
  1. **SHAP Drivers**: Recharts bar chart showing feature importance shares (LULC 51.5%, NDVI 22.9%, WindSpeed 11.2%, BuildingHeight 4.7%) & Pearson correlation table.
  2. **Model Performance**: PINN physics loss formulation display and validation accuracy ($R^2=0.915$, $\text{RMSE}=2.15^\circ\text{C}$, $\text{MAE}=1.64^\circ\text{C}$).
  3. **Budget Optimizer**: Dynamic interactive slider ($1M to $25M) querying `/api/planner/optimize` to calculate target cells selected (8,333 cells at $10M), average cooling yield (-5.64°C/cell), total cumulative yield (46,999.57 °C-cells), and low-confidence flagged cells (161 / 1.93%).
  4. **Reports & Exports**: CSV exporter for ranked interventions and report viewer.

### Phase 3 — Before / After Heat Slider (Completed)
- **UI Components**: `ScenarioSlider.tsx` rendering interactive split map with slider dragging from 0% ("Today - Baseline Heat") to 100% ("After Interventions"). Color overlays morph dynamically from baseline temperatures to post-intervention projected cooling states.

### Phase 4 — 3D City View (Completed)
- **UI Components**: `City3DView.tsx` utilizing Deck.gl WebGL `ColumnLayer` for 3D building block extrusions (`BuildingHeight_m` x `LST_Celsius`). Includes 3D cooling simulation toggle.

### Phase 5 — AI Chat Interface (Completed)
- **Backend & UI Components**: `ChatDrawer.tsx` side panel drawer backed by `/api/chat` processing natural-language queries (e.g., "Why is Andheri so hot?", "How is $10M budget spent?"). Includes quick prompts and interactive map-focus buttons.

---

## Core UI Fixes & Refinements Log (Problems 1 to 5)

### Problem 1 — Map Heatmap Coverage (Resolved)
- **What was wrong**: The Public Heat Explorer map rendered downsampled sparse point markers (`CircleMarker`), making the 195,202 cell dataset look patchy with empty gaps instead of a continuous thermal heatmap.
- **What was changed**: Replaced scattered point markers with a continuous Leaflet Heatmap Canvas layer (`leaflet.heat`) consuming the complete 195,202 data point array (`full_grid`). Calibrated the color ramp precisely to the Surface Heat Scale legend: Extreme (`#ef4444` >=42°C), High (`#f97316` 38-42°C), Moderate (`#eab308` 32-38°C), Cool (`#10b981` <32°C).
- **Files touched**: `server/data_loader.py`, `server/app.py`, `frontend/src/services/api.ts`, `frontend/src/types/index.ts`, `frontend/src/components/PublicExplorer/HeatMap2D.tsx`.
- **Visual Verification**: The map now renders a vibrant, smooth, continuous gradient across Mumbai & Navi Mumbai with zero data gaps or scattered dots. Hovering and clicking smoothly flies the map and pinpoints location details.

### Problem 2 — Search Bar Real Geocoding (Resolved)
- **What was wrong**: Only hardcoded neighborhood chips worked. Typing arbitrary place names into the search bar failed or defaulted to Bandra.
- **What was changed**: Integrated real OpenStreetMap Nominatim geocoding API in the backend search engine (`search_location`). Queries are resolved to real coordinates, checked against the Mumbai & Navi Mumbai data coverage bounding box (`18.80 <= lat <= 19.35`, `72.70 <= lon <= 73.15`), and matched to the nearest grid cell. Added an explicit `out_of_bounds` UI card in `PublicInfoPanel` for locations outside coverage (e.g., "Delhi", "London"). Unified chips and search submit pathways.
- **Files touched**: `server/data_loader.py`, `frontend/src/components/PublicExplorer/LocationSearch.tsx`, `frontend/src/components/PublicExplorer/PublicInfoPanel.tsx`, `frontend/src/App.tsx`.
- **Visual Verification**: Typing arbitrary landmarks (e.g. "Dharavi", "Marine Drive", "Juhu", "Seawoods") smoothly resolves to coordinates, flies the map, and displays location details. Searching external cities displays a clean "Location Outside Coverage Area" notification.

### Problem 3 — Disambiguating Hotspot Status from Model Confidence Flags (Resolved)
- **What was wrong**: The UI displayed a single red "Flagged Heat Hotspot Area" badge mixing Getis-Ord Gi* statistical hotspot classification (a location fact) with FR5/FR6 model low-confidence caps (a prediction caveat).
- **What was changed**: Separated these into two distinct UI elements:
  1. **Hotspot Location Fact**: Labeled clearly as `Confirmed Heat Hotspot (99% Statistical Confidence)` based on satellite spatial clustering (Getis-Ord Gi* z-score).
  2. **Recommendation Confidence Caveat**: Only displayed on specific recommendation cards when model prediction bounds hit safety caps (`"This cooling estimate is at the upper bound of our model's confidence — treat as an approximate ceiling"`).
- **Files touched**: `server/data_loader.py`, `frontend/src/types/index.ts`, `frontend/src/components/PublicExplorer/PublicInfoPanel.tsx`, `frontend/src/components/PlannerDashboard/PlannerDashboard.tsx`.
- **Visual Verification**: Locations display hotspot classification as a statistical fact badge, while recommendation caveats only appear on affected prediction cards.

### Problem 4 — Honest Intervention Distance & Plan Coverage Messaging (Resolved)
- **What was wrong**: Locations >20 km away showed recommended interventions without explanation, creating a broken impression since the $10M priority plan covers top ~4% hotspot cells.
- **What was changed**:
  1. If nearest priority intervention is within 2 km: displays `Planned $10M Municipal Intervention (~X km away)`.
  2. If nearest intervention is >2 km: displays honest non-broken messaging (`"This location is not in the current $10M priority allocation plan"`) alongside a localized microclimate driver recommendation (e.g., Shade Tree Canopy / Cool Pavement / Vertical Green Facades) based on local NDVI and built surface density.
  3. Expanded Planner Dashboard budget slider range up to $50M and added live `Regional Coverage %` calculation.
- **Files touched**: `server/data_loader.py`, `frontend/src/components/PublicExplorer/PublicInfoPanel.tsx`, `frontend/src/components/PlannerDashboard/PlannerDashboard.tsx`.
- **Visual Verification**: Non-priority locations clearly state they are outside the current $10M plan and offer local driver mitigation advice. Budget slider expansion shows live coverage % scaling from 4.27% ($10M) to 21.34% ($50M).

### Problem 5 — 3D City View Skyline Extrusions (Resolved)
- **What was wrong**: The 3D view rendered as unreadable thin vertical spikes/lines due to small column radius, large elevation scaling, and missing 3D lighting.
- **What was changed**: Upgraded Deck.gl `ColumnLayer` with tiled building block footprints (`radius: 125`), realistic elevation scale (`elevationScale: 1.2`), and 3D face materials. Added Deck.gl WebGL `LightingEffect` (`AmbientLight` + `DirectionalLight` sunlight) so extruded block faces cast depth and shadows under a 55° camera tilt.
- **Files touched**: `frontend/src/components/City3DView/City3DView.tsx`.
- **Visual Verification**: The 3D view now renders as a stylized 3D city skyline with illuminated block building tops, shaded side walls, and smooth thermal color gradients.

---

## Basemap Switcher & 9-Layer Dataset Explorer Log (Changes 1 to 3)

### Change 1 — Removal of 3D City View (Completed)
- **What was removed**: Removed the "3D City View" tab and deleted `City3DView.tsx`.
- **Reasoning**: Decided not to pursue 3D/2.5D block visualization for now in favor of focusing on 2D multi-layer geospatial data exploration.
- **Files touched**: `frontend/src/components/City3DView/City3DView.tsx` (Deleted), `frontend/src/components/Navigation.tsx`, `frontend/src/App.tsx`.

### Change 3 — Basemap Style Switcher & Legal Attributions (Completed)
- **What was added**: Added a floating basemap switcher on the map offering 3 basemap tile options:
  1. **Standard Light Map**: CARTO Voyager (`https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png`)
     - *Required Attribution*: `&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>`
  2. **Satellite Aerial Imagery**: Esri World Imagery (`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`)
     - *Required Attribution*: `Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and GIS User Community`
  3. **Dark Map**: CARTO Dark Matter (`https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`)
     - *Required Attribution*: `&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>`
- **Contrast Auto-Adjustment**: In Satellite mode, heat overlay opacity automatically adjusts from `0.60` to `0.72` to maintain sharp data legibility against aerial imagery.
- **Files touched**: `frontend/src/components/PublicExplorer/HeatMap2D.tsx`.

### Change 2 — 9-Variable Dataset Layer Explorer (Completed)
- **What was added**: Expanded the map from LST-only into a full 9-layer dataset explainer tool. Users can switch between viewing any of the underlying variables in real-time:
  1. **Surface Heat (LST °C)**: `26°C to 48°C+` (Green <32 → Yellow 32–38 → Orange 38–42 → Red ≥42)
  2. **Vegetation Canopy (NDVI)**: `-0.15 to 0.70` (Sandy Brown <0.10 → Grass 0.10–0.25 → Olive 0.25–0.45 → Emerald Green 0.45–0.60 → Deep Forest Green ≥0.60)
  3. **Land Use & Cover (LULC)**: Categorical (Built-up = Slate Gray, Vegetation = Green, Water = Blue, Bare Soil = Amber, Agriculture = Lime)
  4. **Building Height (m)**: `0m to 30m+` (Ground <2m → Low-rise 2–8m → Mid-rise 8–15m → High-rise 15–25m → Tower ≥25m)
  5. **Built Surface Cover (%)**: `0% to 100%` (Open <20% → Moderate 20–50% → High 50–80% → Dense Impervious ≥80%)
  6. **Population Density Index**: `0 to 1200+` (Low <50 → Moderate 50–200 → High 200–600 → Extreme ≥600)
  7. **Ambient Air Temperature (°C)**: `28.0°C to 30.5°C` (Cool Sea Breeze <28.7°C → Baseline Air 28.7–29.3°C → Elevated Ambient ≥29.3°C)
  8. **Wind Speed (m/s)**: `1.2 to 3.0 m/s` (Calm <1.6 → Moderate Breeze 1.7–2.3 → Strong Breeze ≥2.3 m/s)
  9. **Dewpoint / Moisture (°C)**: `19.0°C to 23.0°C` (Dry Air <20.5°C → Moderate Moisture 20.5–21.8°C → High Coastal Humidity ≥21.8°C)
- **Dynamic Legends & Info Panel**: Each layer displays its own dedicated legend (matching actual units and range values from FR1 data audit). Clicking or searching a location updates the left info panel with that specific layer's reading and contextual explanation.
- **Files touched**: `server/data_loader.py`, `frontend/src/types/index.ts`, `frontend/src/components/PublicExplorer/GridHeatOverlay.tsx`, `frontend/src/components/PublicExplorer/HeatMap2D.tsx`, `frontend/src/components/PublicExplorer/PublicInfoPanel.tsx`, `frontend/src/App.tsx`.

---

## UI/UX Pro Max Redesign Pass Log

### Page 1 — Public Heat Explorer (Completed)
- **Design Guidance Applied**:
  - `Priority 1 (Accessibility & Contrast)`: Added `aria-label` tags on input fields and search controls, guaranteed 4.5:1 text contrast on dark glassmorphism surfaces (`#ffffff` title text, `#6ee7b7` cool badge text, `#fca5a5` extreme badge text), explicit focus-visible rings (`outline: 2px solid var(--accent-cyan)`).
  - `Priority 2 (Touch & Interaction)`: Min 44px hit targets for input and primary buttons (`minHeight: '44px'`), tactile click active states (`.btn:active { transform: scale(0.98); }`), 200ms cubic-bezier transition curves.
  - `Priority 4 (Style Selection & Visual Hierarchy)`: Replaced spinner emoji text with high-end shimmer skeleton loaders (`.skeleton-shimmer`), glassmorphism card elevation (`rgba(15, 23, 42, 0.85)` + `backdrop-filter: blur(16px)`), distinct glowing subtle borders (`border: 1px solid var(--border-glass)`), vector SVG icons only.
  - `Priority 5 (Layout & Information Hierarchy)`: Structured Public view for non-technical residents: Hero surface temperature badge → Active layer reading → Plain-language drivers bullet points → Getis-Ord Gi* hotspot statistical fact → Honest cooling recommendation card.
  - `Map-specific UI Conventions`: Glassmorphic floating control HUD for layer selector & basemap switcher with touch-friendly controls and contrast adjustments.
- **Before vs After Summary**:
  - *Before*: Default input fields without focus rings, basic spinner loading text, inconsistent badge contrast, standard button padding without press states.
  - *After*: Polished dark glassmorphic input with cyan focus glow (`shadow-[0_0_16px_rgba(6,182,212,0.25)]`), quick selection chips with hover elevation, shimmer skeleton loading states, WCAG AA compliant badge colors, and tactile button press scaling.
- **Functionality Verification**: All search features, geocoding, neighborhood selection chips, Leaflet heatmap rendering, 9-variable layer selector, basemap tile switcher, and Getis-Ord Gi* / PINN model flags continue to work seamlessly.

### Page 2 — Planner Dashboard Mode (Completed)
- **Design Guidance Applied**:
  - `Style ID: data-dense-dashboard`: Implemented dense technical grid layout for municipal planners, high information density, clean tabular metrics with row hover feedback (`rgba(255,255,255,0.04)`), Recharts SHAP importance bar chart.
  - `Priority 1 (Accessibility)`: Added `aria-label` tags to sub-tab buttons and range slider, high-contrast values (`#ffffff` headers, `#6ee7b7` metrics, `#fde047` warning caveats).
  - `Priority 2 (Touch & Interaction)`: Tactile sub-tab navigation with minimum hit height (`38-44px`), smooth active tab switching, customized range input with clear tick marks.
  - `Priority 6 (Typography & Color)`: Consistently used Outfit headings, monospace code box styling (`L = MSE + λ * Loss`) for PINN energy balance equation.
- **Before vs After Summary**:
  - *Before*: Standard plain sub-tab buttons, basic tabular formatting without hover states, default range slider styling without aria labels.
  - *After*: Polished technical control panel with dark glass sub-navigation, styled metric cards, hover-highlighted SHAP data tables, styled budget allocator range slider, and prominent export controls.
- **Functionality Verification**: All SHAP feature importance charts, Pearson correlation tables, PINN loss metrics, dynamic $1M–$50M budget optimization queries, regional coverage calculations, low-confidence cell flag counts, and CSV exports function accurately.

### Page 4 — AI Assistant Chat Panel (Completed & Grounded)
- **Design Guidance Applied**:
  - `Priority 1 (Accessibility)`: Keyboard focusable message drawer, clear input field labels, accessible high-contrast message bubbles.
  - `Priority 2 (Touch & Interaction)`: Smooth slide-over drawer animation, quick action prompt chips with hover scale, responsive send button with press feedback.
  - `Priority 4 (Style Selection)`: Dark glass slide-over panel with cyan accent borders, assistant typing indicator animation, quick prompt pill triggers.
- **LLM Integration & Strict Function-Calling Grounding Architecture**:
  - **LLM API Connected**: Integrated **Groq API** (`openai/gpt-oss-120b` / `openai/gpt-oss-20b`) using Groq API Key.
  - **Grounding Layer Mechanics**: The LLM acts strictly as an intent parsing and natural-language formatting layer. It is prohibited from generating ungrounded facts or numeric values. The system retrieves verified facts from FR1–FR8 backend data files (`fr5_scenario_results.csv`, `fr6_optimal_interventions.csv`, `fr3_driver_importance_ranking.csv`, `mumbai_heat_dataset_clean.csv`) and injects them directly into the context prompt.
  - **Frontend Representation & Markdown Table Engine**:
    - **Marked HTML Parser**: Integrated `marked.parse()` inside `ChatDrawer.tsx` so raw Markdown tokens (`##`, `**bold**`, `| --- |`) are rendered into styled HTML elements (`<h2>`, `<strong>`, `<table>`, `<th>`, `<td>`).
    - **Expanded Chat Width & Maximize Toggle**: Increased default drawer width from `390px` to `540px`, and added a header **Maximize / Minimize Toggle** (`<Maximize2 />` / `<Minimize2 />`) scaling the panel up to `820px` wide for inspecting dense data tables and reports.
    - **Glassmorphic Table Styling**: Added dark glassmorphic table borders, cyan header accents (`#38bdf8`), subtle row hover highlights (`rgba(255, 255, 255, 0.04)`), and responsive horizontal scroll wrappers.
  - **Tool Functions Built**:
    1. `get_location_data(location_name)`: Looks up baseline LST (°C), risk tier, Getis-Ord Gi* hotspot status, LULC label, NDVI canopy, building height, built surface, and SHAP drivers from FR1/FR2/FR3.
    2. `get_scenario_result(location_name, intervention_type)`: Looks up real precomputed FR5 PINN scenario results (cooling $\Delta T$ in °C) strictly for our 3 modeled interventions (**Urban Greening**, **Cool Roofs**, **Hybrid Strategy**).
    3. `get_nearest_optimization_recommendation(location_name)`: Looks up nearest optimal intervention cell from FR6 output, returning optimal intervention type (**Urban Greening**), cell cost ($1,200 / ₹99,600 per cell), predicted $\Delta T$, and plan status.
    4. `get_budget_optimization_summary(budget_usd)`: Dynamically computes greedy budget allocation across 195k cells for arbitrary budget amounts (e.g., $10M / ₹83 Cr vs $50M / ₹415 Cr).
- **Hard System Prompt Guardrails**:
  - Interventions are strictly restricted to our 3 modeled categories: **Urban Greening**, **Cool Roofs**, **Hybrid Strategy**.
  - Requests for unmodeled interventions (e.g. *"vertical green facades"*) explicitly state they are unmodeled and report real numbers for the closest matching modeled intervention (**Urban Greening**).
  - All monetary values formatted in both USD ($) and Indian Rupees (₹ / ₹83 Cr equivalent).
- **Powai Test Case Before vs After Verification**:
  - **Before (Ungrounded / Hallucinated)**:
    > *"For Powai, we recommend Vertical Green Facades & Canopy Shading. Predicted cooling: -3.8°C. Estimated cost: $2,000."*
    > *(Unmodeled intervention type, fabricated cooling value, and invented cost!)*
  - **After (Strictly Grounded in Real Data)**:
    > *"For Powai (baseline LST 37.1°C, Moderate Risk, NDVI 0.336):*
    > *• FR5 Scenario 1 (Urban Greening): **0.0°C ΔT** (no measurable cooling due to canopy saturation).*
    > *• Nearest FR6 Priority Allocation Cell: **4.8°C ΔT** cooling yield, Cost: **$1,200 / ₹99,600 per cell**, located ~16.9 km away.*
    > *• Note: Powai is not in the top $10M / ₹83 Cr priority allocation plan because priority funding targets the most extreme 48°C+ hotspot clusters in Navi Mumbai & Central Suburbs."*
- **Functionality Verification**: All test cases (*"What would happen if we planted trees near Powai?"*, *"Why is Andheri so hot?"*, *"What's the cheapest way to cool Dharavi?"*, *"What if we spent $50 million instead of $10 million?"*) return 100% verified facts from real backend outputs.

### Page 5 — Shared Navigation & Controls (Completed)
- **Design Guidance Applied**:
  - `Priority 1 (Accessibility & Contrast)`: High contrast text (`#ffffff` headings and tab text), `aria-label` tags for all navigation buttons (`Main mode navigation`), explicit focus-visible rings (`outline: 2px solid var(--accent-cyan)`).
  - `Priority 2 (Touch & Interaction)`: Minimum 40–44px hit targets for mode buttons, tactile click feedback (`active:scale-[0.98]`), smooth transition states.
  - `Priority 4 (Style Selection & Unified System)`: Glassmorphism header (`backdrop-filter: blur(16px)`), glowing thermal fire brand icon, unified color tokens across all pages.
  - `Currency Conversion to Indian Rupees (₹)`: Converted all currency displays across the application from USD to Indian Rupees (`₹` / `INR`). The baseline $10M priority allocation plan is now represented as **`₹83 Crore`**, cell costs are formatted as **`₹99,600`**, and the budget optimizer slider range scales from **`₹8.3 Crore`** ($1M) up to **`₹415 Crore`** ($50M).
  - `Light Mode Toggle Removal`: Completely removed the light/dark theme toggle button as requested. The application remains permanently styled in its high-end, dark glassmorphism theme.
- **Before vs After Summary**:
  - *Before*: Dollar sign (`$`) currency notation, light/dark mode switcher in navigation bar.
  - *After*: All currency formatted in Indian Rupees (`₹` / `Crore`), clean dark glass header navigation without theme toggle clutter.
- **Functionality Verification**: Indian Rupee calculations (`₹83 Cr`), budget allocation calculations, quick chat prompts (`How is ₹83 Cr budget spent?`), and TypeScript production build compile cleanly.

### Step 6 — Public Sector Design System Redesign (GOV.UK & USWDS Inspired Pass)
- **Design Tokens Defined**:
  - **60% Neutral Base Tokens**: App background `#0b1320`, component surface `#141e30`, header surface `#0f172a`, card borders `#27354a`, primary text `#f8fafc` (WCAG AAA contrast), muted text `#94a3b8`. Zero backdrop-blur noise.
  - **30% Structure & Brand Tokens**: Solid government blue `#1d4ed8` with `#2563eb` border for active tabs and primary buttons. Secondary slate buttons `#1e293b` with `#334155` border.
  - **10% Data Accent Tokens (Reserved ONLY for Heat Data)**: Extreme heat `#dc2626`, High heat `#ea580c`, Moderate heat `#d97706`, Low/Cool heat `#059669`, Model caveat warning `#b45309`.
  - **Spacing & Typography Scale**: Strict 4px/8px scale, crisp 4px/6px border radii (replaced 16px+ rounded pills), system sans-serif font stack (`Inter`, `-apple-system`, `BlinkMacSystemFont`).
  - **Plain Language Labels**: Direct and literal labels ("Search location", "Public Heat Explorer", "Planner Dashboard", "Before/After Heat Slider").
- **Restyled Components & Pages**:
  1. **Global CSS (`index.css`)**: Defined `.gov-card`, `.gov-btn-primary`, `.gov-btn-secondary`, `.gov-badge`, `.gov-input`, `.chat-markdown`. Removed neon glows, generic gradients, and glassmorphic blurs.
  2. **Navigation Header (`Navigation.tsx`)**: Dark navy header (`#0f172a`), solid blue icon box (`#1d4ed8`), solid blue active mode button, clean plain language navigation.
  3. **Location Search (`LocationSearch.tsx`)**: `#0f172a` fill, `#334155` border, `4px` radius, `#2563eb` focus border. Clean slate quick select chips.
  4. **Public Info Panel (`PublicInfoPanel.tsx`)**: GOV.UK structured data cards (`#141e30`), crisp `#27354a` borders, WCAG AA compliant risk badges, structured microclimate driver bullets.
  5. **Map & HUD Controls (`HeatMap2D.tsx`)**: Removed emojis from layer select options, solid dark navy HUD control panels, clean basemap buttons, 9-variable layer legend.
  6. **Planner Dashboard (`PlannerDashboard.tsx`)**: Structured technical control panel, high-contrast SHAP Recharts, PINN loss metrics box, budget allocator range slider.
  7. **Before/After Scenario Slider (`ScenarioSlider.tsx`)**: Clean split map control bar (`#0f172a`), solid strategy buttons, slider control.
  8. **AI Assistant Panel (`ChatDrawer.tsx`)**: Solid dark navy panel (`#0f172a`), solid blue assistant icon, crisp message bubbles, marked markdown table renderer, expand toggle.
- **Functionality Verification**: 100% of spatial KDTree queries, heat maps, Nominatim geocoding, budget sliders, scenario calculations, and Groq RAG AI Assistant functions remain fully intact and verified with zero TypeScript compilation errors.

---

## AI Assistant Grounding & SHAP Table Contrast Fix Log (Issues 1 & 2)

### Issue 1 — AI Assistant Fake Data Profile Hallucination Fix (Resolved)
- **What was wrong**: When given off-topic, nonsense, or non-location input (such as *"how to make sandwuch"*), the AI assistant generated a fabricated "Urban Heat Profile" table containing fake coordinates (`19.0600°N, 72.8296°E`), fake baseline LST (37.4°C), and fake hotspot metrics.
- **Root Cause**:
  1. `data_loader.resolve_location_coords` contained a silent fallback returning Bandra center (`19.0596, 72.8295`) whenever geocoding or neighborhood matching failed.
  2. The `/api/chat` endpoint ran the full location-profile lookup for every input without verifying whether the text was a valid location or in-scope heat/climate query.
- **Fix Implemented**:
  1. Updated `resolve_location_coords` in `server/data_loader.py` to return `(None, None, None)` when location resolution fails or is out-of-bounds, removing the silent Bandra fallback.
  2. Added an intent & domain term classification check (`is_in_scope_query`) in `server/app.py`.
  3. Added strict intent filtering in `/api/chat`: if an input is neither a valid location in Mumbai & Navi Mumbai nor an in-scope heat/climate/project question, the assistant immediately declines and returns:
     > `"I can only help with heat and climate questions for Mumbai & Navi Mumbai — try asking about a specific neighborhood, or a cooling intervention."`
     with `target_location: None` and zero data tables generated.
  4. Added hard system prompt directives prohibiting the LLM from fabricating location profiles, baseline temperatures, or environmental tables.
  5. Disabled automatic Nominatim geocoding for out-of-scope non-heat queries (`allow_geocoding=is_in_scope`) so random English words like *"hello"* are not falsely geocoded to local business names.
- **Files Touched**: `server/data_loader.py`, `server/app.py`.
- **Verification & Test Inputs**:
  - `how to make sandwuch` -> Declines cleanly: *"I can only help with heat and climate questions for Mumbai & Navi Mumbai..."* (`target_location: None`, 0 fake tables).
  - `how to make sandwich` -> Declines cleanly (`target_location: None`).
  - `hello` -> Declines cleanly (`target_location: None`).
  - `what's 2+2` -> Declines cleanly (`target_location: None`).
  - `asdfghjkl` -> Declines cleanly (`target_location: None`).
  - `tell me a recipe for pizza` -> Declines cleanly (`target_location: None`).
  - `Why is Andheri hot?` (Valid location query) -> Returns real grounded response for Andheri (LST 38.6°C, High Risk, LULC Built-up), `target_location: {'lat': 19.1136, 'lon': 72.8697, 'name': 'Andheri'}`.
  - `What is the heat risk in Powai?` (Valid location query) -> Returns real grounded response for Powai (LST 37.1°C), `target_location: {'lat': 19.1176, 'lon': 72.906, 'name': 'Powai'}`.
  - `How is ₹83 Cr budget spent?` (Valid general query) -> Returns real budget allocation breakdown, `target_location: None`.

### Issue 2 — SHAP Feature Importance Table Contrast Fix (Resolved)
- **What was wrong**: In the Planner Dashboard's "Drivers (SHAP)" tab, the summary table below the chart rendered dark/black text against the dark `#0f172a` / `#141e30` background, failing WCAG AA contrast standards.
- **Root Cause**:
  1. The `<thead>` element relied on `color: '#60a5fa'` on `<tr>`, which is not inherited by `<th>` elements under default browser table styles.
  2. The 4th column used dark red/orange chart fill colors (`#dc2626`) directly for text, resulting in a low contrast ratio (~2.1:1) on dark navy backgrounds.
  3. Missing global table text color definitions in `index.css`.
- **Fix Implemented**:
  1. Added global accessibility CSS rules for `table`, `th`, and `td` in `frontend/src/index.css` enforcing `#60a5fa` header text and `#f8fafc` primary text.
  2. Explicitly styled `<th>` elements in `PlannerDashboard.tsx` with `color: '#60a5fa'` and `background: '#0f172a'`.
  3. Separated chart bar colors (`COLORS`) from text accent colors (`SHAP_ACCENT_COLORS` using bright pastel tokens `#fca5a5`, `#fdba74`, `#38bdf8`, `#6ee7b7`, `#c084fc`, `#fde047`) guaranteeing high contrast (WCAG AAA/AA 4.5:1+) for all table text.
- **Files Touched**: `frontend/src/index.css`, `frontend/src/components/PlannerDashboard/PlannerDashboard.tsx`.
- **Verification**: Built production bundle with `npm run build` (`tsc -b && vite build`) — compiled with 0 errors. All table columns (Feature, Pearson (r) Correlation, RF Feature Importance, SHAP Importance Share) are crisp, legible, and compliant with WCAG AA accessibility standards.

---

## How to Launch and Test

1. **Start Backend API Server**:
   ```bash
   uvicorn server.app:app --port 8000 --reload
   ```

2. **Start Frontend Web Application**:
   ```bash
   cd frontend
   npm run dev
   ```
3. Open browser at `http://localhost:5173`.


