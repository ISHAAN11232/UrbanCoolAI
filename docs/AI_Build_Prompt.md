# Build Prompt — Urban Heat Mitigation AI/ML System

Copy everything below into your AI coding assistant (Claude Code, Cursor, etc.) as the first message in a fresh session, in the same working directory as your `PRD_Urban_Heat_Mitigation.md` file and your `raw/` dataset folder.

---

## PROMPT START

You are acting as the lead ML engineer building the project described in `PRD_Urban_Heat_Mitigation.md` (read this file fully before doing anything else). The raw dataset is in the `raw/` folder containing these GeoTIFF files for Mumbai & Navi Mumbai:

`AirTemp.tif`, `BuildingHeight.tif`, `BuiltSurface.tif`, `Dewpoint.tif`, `LST_2024.tif`, `LULC.tif`, `NDVI_2024.tif`, `PopDensity.tif`, `WindSpeed.tif`

### Your task
Build the full pipeline exactly as described in the PRD, implementing modules FR1 through FR8 in order:

1. **FR1 – Data Preprocessing**: Load all rasters, check their CRS/resolution/extent, align/resample them to a common grid, mask invalid/nodata pixels, and stack them into a single analysis-ready multi-band array. Save intermediate outputs so later steps can reuse them without redoing this.
2. **FR2 – Hotspot Detection**: Generate a heat stress classification from the LST layer and run Getis-Ord Gi* (or an equivalent spatial autocorrelation method) to identify statistically significant hot/cold clusters. Output a hotspot map.
3. **FR3 – Driver Analysis**: Run correlation analysis (Pearson/Spearman) between LST and all driver layers, then train a Random Forest regressor and compute SHAP values to produce a ranked feature-importance table/chart.
4. **FR4 – Physics-Informed ML Model**: Build a model (neural network or hybrid ML) that predicts LST from the driver layers, using a custom loss combining prediction error with a physics-based residual term approximating surface energy balance. Train and save this model.
5. **FR5 – Scenario Simulation Engine**: Build a function that takes a baseline + a proposed intervention (e.g., "+NDVI in region X", "reduce built surface by Y%", "increase albedo in region Z"), modifies the relevant input layer(s), re-runs the FR4 model, and returns predicted ΔT.
6. **FR6 – Optimization Module**: Implement a Genetic Algorithm or Bayesian Optimization search that calls FR5 repeatedly to find the best combination/placement of interventions under stated constraints (budget, feasible land area).
7. **FR7 – Validation**: Evaluate FR4's predictions on held-out data, report RMSE/MAE and uncertainty bounds. If no ground truth exists for interventions specifically, validate against literature-reported cooling effects (e.g., known NDVI-vs-LST relationships) and clearly label this as a proxy validation.
8. **FR8 – Output/Reporting**: Produce a final ranked intervention list (location, intervention type, predicted °C reduction) and generate visual maps (baseline heat map, hotspot map, before/after scenario maps).

### Rules you must follow

- **Work module by module, in order (FR1 → FR8).** Do not skip ahead. After finishing each module, briefly summarize what you built, what worked, and what didn't before moving to the next.
- **Maintain a running progress file** named `PROGRESS.md` in the project root. After completing (or partially completing) each FR module, update this file with: module name, status (done / partial / blocked), what was implemented, what files/outputs it produced, and any open issues. Read this file at the start of every session/response so you never lose track of what's already been built — treat it as your memory across the whole project.
- **If something cannot be done as specified** (e.g., a dataset is missing a required attribute, a library isn't available, SOLWEIG integration is too complex to fully implement, spatial resolution is inconsistent across files, etc.):
  - Do NOT silently skip it or fake the output.
  - Clearly state what the blocker is and why.
  - Propose at least one practical alternative or simplification (e.g., "full SOLWEIG radiative transfer isn't feasible here, so I'll approximate the physics constraint using a simplified surface energy balance formula: ...").
  - Implement the alternative, and log both the original limitation and the workaround in `PROGRESS.md`.
  - Then tell me directly, in plain language, what was changed and why, at the end of your response.
- **Inspect data before assuming anything about it** — check actual CRS, resolution, extent, value ranges, and nodata values of each `.tif` file programmatically before writing processing code. Don't guess.
- **Keep code modular** — one script/module per FR step (e.g., `fr1_preprocessing.py`, `fr2_hotspot_detection.py`, etc.) so each can be run and debugged independently.
- **Explain in plain language** what each module does and why, alongside the code — I need to be able to explain this project to a non-technical guide/evaluator, not just run it.
- **Do not fabricate results.** If a model performs poorly or data is insufficient, report that honestly rather than presenting misleading numbers.
- **Ask me only if truly blocked** — e.g., if you need a decision only I can make (like a specific budget constraint for the optimization step, or which city ward boundaries to use). Otherwise, make a reasonable assumption, state it clearly, and proceed.

### At the end of each major module, give me:
1. A short plain-English summary of what was accomplished
2. Any blockers hit and how you resolved/worked around them
3. What's next

Begin now: first read the PRD and inspect the raw dataset, then start with FR1.

## PROMPT END

---

### Notes for you (not part of the prompt)
- If you're using **Claude Code**, this works well as the first message in a new session — it will read the PRD and dataset directly from disk.
- The `PROGRESS.md` file is the key mechanism that prevents the AI from "forgetting" mid-build — it acts as persistent memory across sessions, so if the AI's context resets or you start a new session later, just tell it to "read PROGRESS.md and continue," and it will pick up where it left off.
- If a step stalls or produces a vague/incomplete answer, you can reply with: *"Update PROGRESS.md with the current state, then continue with [FR module]."* to force it back on track.
