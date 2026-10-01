# UrbanCool AI - Frontend Web Application

Modern, high-performance web interface built with **React 18**, **TypeScript**, **Vite**, and **Tailwind CSS**.

---

## 🎨 Features

- **Public Spatial Explorer**: Interactive Leaflet maps displaying thermal heat distribution across Mumbai & Navi Mumbai with layer toggles (LST, Hotspots, NDVI, Albedo, Building Height, Dew Point).
- **Location Search & Deep Cell Inspection**: Instant auto-complete search and spatial point queries.
- **Municipal Planner Dashboard**: Interactive analytical views:
  - Driver Analytics & SHAP Feature Share breakdown
  - PINN Physics-Informed ML Validation & Error Bounds
  - Interactive Budget Optimization Simulator ($1M–$50M allocation)
  - Full System Report & Data Export
- **Multi-LLM AI Assistant Modal**: Sidecar conversational assistant configured with domain prompts and context awareness.

---

## 🚀 Development Setup

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will run locally at `http://localhost:5173`.

---

## 📦 Build & Production

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
```
Output will be generated in `frontend/dist/`.
