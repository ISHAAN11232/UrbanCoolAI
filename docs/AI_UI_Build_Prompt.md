# Build Prompt — Urban Heat Mitigation UI
## Base: Public Heat-Risk Explorer + Planner Dashboard + Before/After Slider + 3D View + AI Chat

Copy everything below into your AI coding assistant, in the same project directory as your existing pipeline (`raw/`, `data/`, `outputs/`, `PROGRESS.md`, `FINAL_URBAN_HEAT_MITIGATION_REPORT.md`). This is a NEW build phase on top of the already-completed FR1–FR8 backend — do not redo that work, only consume its outputs.

---

## PROMPT START

You are now building the **user-facing application** for the already-completed Urban Heat Mitigation AI/ML system. Before doing anything else, read `PROGRESS.md` and `FINAL_URBAN_HEAT_MITIGATION_REPORT.md` in full to understand what backend modules (FR1–FR8) already exist and what data/outputs are available to you (hotspot maps, driver rankings, PINN model, scenario results, optimization plan, CSV tables). You must build the UI on top of these existing outputs — do not recompute or fake anything the backend already produced.

### Product concept

The application's **base experience** is a **public-facing Heat Risk Explorer**: any citizen can search or click their neighborhood and see their local heat risk, in plain, non-technical language. On top of this base, we are layering four additional feature sets. Think of this as one connected app, not five separate apps — the base view is what loads first, and the other features are accessible from it (tabs, toggles, or a mode switcher).

### Feature set to build (in this priority order)

**PHASE 1 — Base: Public Heat Risk Explorer**
- Interactive map of Mumbai/Navi Mumbai centered on load.
- Search bar or click-to-select: user picks a location/neighborhood.
- On selection, show a simple info panel: current heat risk (plain language: Low/Moderate/High/Extreme, not just raw °C), the baseline LST value, and 1–2 plain-language reasons why (e.g., "This area has very little vegetation and dense concrete cover" — translated from the SHAP driver data, not shown as raw feature importances).
- If the location is a flagged hotspot (from FR2), say so clearly, and show the nearest recommended intervention from FR6's plan if one exists nearby.
- Tone: written for a non-technical resident, not a data scientist. No jargon like "SHAP," "PINN," "Gi*" in this view — translate everything into plain language.

**PHASE 2 — Planner Dashboard mode**
- A separate "Planner / Technical View" mode (toggle or separate route) that exposes the full technical picture for municipal planners/your guide:
  - Map view with toggleable layers: baseline heat, hotspot clusters, driver overlay, optimization plan
  - Drivers page: SHAP feature importance chart + correlation chart (from FR3 outputs)
  - Model performance page: FR4/FR7 metrics (R², RMSE, MAE, validation charts)
  - Budget optimizer page: input a budget amount, show which cells get selected and total predicted cooling yield (built on FR6's logic/outputs)
  - Reports page: view/download the final report and ranked intervention CSV

**PHASE 3 — Before/After Slider**
- On the map (in either mode, but especially Planner mode), add a slider or toggle control: "Today" ↔ "After Interventions."
- Dragging/toggling it should visually morph the map's heat color overlay from the current baseline LST colors to the projected post-intervention LST colors (using FR5's scenario results), cell by cell or in a smooth blended transition.
- This should be visually dramatic — the "wow" interaction of the app. Prioritize smooth, satisfying visual transition over technical precision.

**PHASE 4 — 3D City View**
- Add a 3D view mode using the building height data (from your dataset) to render a simplified 3D representation of a selected area of the city — extruded building blocks colored/shaded by local heat intensity.
- Applying interventions (from Phase 3's toggle) should visibly change the 3D scene's color gradient (e.g., "greener/cooler" tones where trees are added).
- This does not need to be photorealistic — a clean, stylized 3D block model (like a simplified city builder game) is the goal, not architectural realism.
- If true 3D rendering proves too complex/time-consuming, propose a 2.5D (isometric) fallback and confirm with me before proceeding — do not silently downgrade without telling me.

**PHASE 5 — AI Chat Interface**
- A chat panel (side panel or floating widget) available in both Public and Planner modes.
- Users can ask natural-language questions like "why is Andheri so hot?" or "what would happen if we planted trees near Powai?"
- The chat should answer using the actual underlying data/model outputs (hotspot status, driver rankings, scenario simulation results) — not generic/hallucinated answers. If a question requires running a new scenario simulation (e.g., a hypothetical not already in FR5's precomputed results), either call the FR5 simulation logic live, or clearly state that it's providing an estimate based on similar existing scenarios if live simulation isn't feasible.
- When the chat answers a location-based question, it should also update/highlight that location on the map, connecting the chat and map views.

### Recommended tech stack (adjust if you have strong reasons otherwise, but tell me why)
- Frontend: React (with a mapping library — Mapbox GL JS, deck.gl, or Leaflet for the 2D map; three.js or deck.gl for the 3D view)
- Backend/API: Python (FastAPI or Flask) to serve model predictions and scenario simulations from your existing FR4/FR5/FR6 code
- Data serving: precompute and cache heavy outputs (hotspot maps, optimization plans) as static JSON/GeoJSON where possible so the frontend doesn't wait on live model inference for every interaction; reserve live inference for the chat's on-demand "what-if" queries and the scenario slider

### Critical process rules — follow these exactly

1. **Build in phases, strictly in order (Phase 1 → 5).** Do not start a phase until the previous one is functional and I've been told it's done. This keeps the build reviewable and prevents you from losing track.

2. **Maintain `UI_PROGRESS.md`** as a separate progress file from the backend's `PROGRESS.md` (don't overwrite that one — it documents FR1–FR8). After every phase (and after any meaningful sub-step within a phase), update `UI_PROGRESS.md` with:
   - Phase name and status (not started / in progress / done / blocked)
   - What was built, which files/components
   - Which backend outputs (FR1–FR8 files) it depends on
   - Any open issues or simplifications made
   - Read this file at the start of every session so you never lose context on what's already built.

3. **If something cannot be built as specified**, do not skip it silently or fake it with placeholder/mock data pretending to be real output:
   - State clearly what the blocker is (e.g., "true 3D building extrusion at this scale is too slow to render live in-browser")
   - Propose a specific, practical alternative (e.g., "switch to a 2.5D isometric grid, or limit true 3D to a small selected sub-area instead of the whole city")
   - Wait for my confirmation before implementing the alternative if it meaningfully changes what was asked — implement smaller/obvious substitutions yourself and just log them
   - Log both the original ask and the resolution in `UI_PROGRESS.md`
   - Tell me directly, in plain language, at the end of your response

4. **Reuse, don't recompute.** Every number/map/chart shown in the UI must trace back to an actual FR1–FR8 output file. If the UI needs something that doesn't exist yet in the backend outputs, tell me explicitly rather than inventing a plausible-looking number.

5. **Keep the Public view honestly simple and the Planner view honestly technical.** Don't leak technical jargon into the public view, and don't oversimplify/hide uncertainty in the planner view — e.g., "low confidence / flagged" cells from FR5/FR6 should still show as flagged in Planner mode, even if hidden or softened in Public mode.

6. **After each phase, report back to me with:**
   - A short plain-English summary of what was built
   - How to run/view it (exact commands)
   - Any blockers hit and how they were resolved or what's awaiting my input
   - What's next

### Start here

1. First, read `PROGRESS.md` and the final report, and list out exactly which backend output files you'll use for Phase 1 (base public view).
2. Propose the folder structure and tech stack setup before writing feature code.
3. Then begin Phase 1.

## PROMPT END

---

### Notes for you (not part of the prompt)
- This is a big build — expect it to take multiple sessions. `UI_PROGRESS.md` is what keeps continuity; if a session ends or resets, just say "read UI_PROGRESS.md and continue from where you left off."
- If you want to reprioritize (e.g., build the chat before the 3D view because it's more impressive for less effort), just tell the AI directly — the phase order is a default suggestion, not a hard rule, but keep phases sequential once you start one.
- Phase 4 (3D view) is genuinely the highest-risk/most-effort item here — don't be surprised if the AI proposes the 2.5D fallback. That's expected and still looks great in a demo.
