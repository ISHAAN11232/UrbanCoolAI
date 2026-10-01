"""
FR5 – Scenario Simulation Engine (Constrained & Validated)
Urban Heat Mitigation AI/ML System for Mumbai & Navi Mumbai

Tasks:
1. Load baseline preprocessed dataset, scaler object, and trained FR4 PI-ML model.
2. Implement simulate_intervention() with strict empirical input clipping bounds:
   - NDVI clipped to observed 99th percentile (0.681)
   - BuiltSurface_m2 clipped to observed range [0, 5696.0 m^2]
3. Calculate Delta T relative to PINN model's baseline prediction:
   Delta T = T_simulated_model - T_baseline_model
4. Apply sanity-check cooling cap (-6.0°C) and flag any extrapolated cells.
5. Export scenario results table, low confidence flags log, and multi-panel figures.
"""

import os
import pickle
import numpy as np
import pandas as pd
import torch
import matplotlib.pyplot as plt
import seaborn as sns
from fr4_physics_informed_ml import PhysicsInformedNN

# Empirical Audit Clipping Bounds (derived from 195,202 cell dataset)
NDVI_MAX_OBSERVED = 0.681      # 99th percentile of real NDVI
BUILT_SURFACE_MAX = 5696.0     # 99th percentile of real Built Surface (m^2)
DELTA_T_CAP_COOLING = -6.0     # Realistic literature-supported single-cell max cooling ceiling (°C)

def load_piml_model(model_path, input_dim, device):
    """Loads trained PhysicsInformedNN model weights."""
    model = PhysicsInformedNN(input_dim=input_dim).to(device)
    model.load_state_dict(torch.load(model_path, map_location=device))
    model.eval()
    return model

def simulate_intervention(df, scaler, model, feature_cols, device, scenario_type="greening"):
    """
    Applies constrained intervention transformations on driver layers and predicts new LST via PINN model.
    """
    df_sim = df.copy()
    for col in feature_cols:
        df_sim[col] = df_sim[col].astype(float)
        
    # Baseline Model Predictions
    scaled_base = scaler.transform(df[feature_cols])
    with torch.no_grad():
        x_base_tensor = torch.tensor(scaled_base, dtype=torch.float32, device=device)
        pred_base_lst = model(x_base_tensor).cpu().numpy().flatten()

    if scenario_type == "greening":
        # Target: Hotspots (LST >= 38.0 or NDVI < 0.25)
        mask = (df_sim['LST_Celsius'] >= 38.0) | (df_sim['NDVI'] < 0.25)
        # Increase NDVI by +0.25, strictly clipped to 99th percentile (0.681)
        df_sim.loc[mask, 'NDVI'] = np.clip(df_sim.loc[mask, 'NDVI'] + 0.25, a_min=None, a_max=NDVI_MAX_OBSERVED)
        # Reduce built surface by 20%, bounded at [0, BUILT_SURFACE_MAX]
        df_sim.loc[mask, 'BuiltSurface_m2'] = np.clip(df_sim.loc[mask, 'BuiltSurface_m2'] * 0.80, a_min=0.0, a_max=BUILT_SURFACE_MAX)
        
    elif scenario_type == "cool_roofs":
        # Target: Dense built-up areas
        mask = df_sim['BuiltSurface_m2'] > 1000.0
        # Cool roofs reduce thermal heat absorption by 35%, bounded at [0, BUILT_SURFACE_MAX]
        df_sim.loc[mask, 'BuiltSurface_m2'] = np.clip(df_sim.loc[mask, 'BuiltSurface_m2'] * 0.65, a_min=0.0, a_max=BUILT_SURFACE_MAX)
        
    elif scenario_type == "hybrid":
        # Hybrid: Greening + Cool Roofs
        mask_green = (df_sim['LST_Celsius'] >= 36.0)
        df_sim.loc[mask_green, 'NDVI'] = np.clip(df_sim.loc[mask_green, 'NDVI'] + 0.25, a_min=None, a_max=NDVI_MAX_OBSERVED)
        
        mask_roof = df_sim['BuiltSurface_m2'] > 500.0
        df_sim.loc[mask_roof, 'BuiltSurface_m2'] = np.clip(df_sim.loc[mask_roof, 'BuiltSurface_m2'] * 0.65, a_min=0.0, a_max=BUILT_SURFACE_MAX)
        
    # Scale modified feature matrix
    scaled_feats = scaler.transform(df_sim[feature_cols])
    
    with torch.no_grad():
        x_sim_tensor = torch.tensor(scaled_feats, dtype=torch.float32, device=device)
        pred_sim_lst = model(x_sim_tensor).cpu().numpy().flatten()
        
    # Delta T calculated relative to MODEL'S OWN BASELINE PREDICTION
    raw_delta_t = pred_sim_lst - pred_base_lst
    
    # Sanity-check cap and low confidence flagging
    low_confidence_flag = raw_delta_t < DELTA_T_CAP_COOLING
    capped_delta_t = np.clip(raw_delta_t, a_min=DELTA_T_CAP_COOLING, a_max=None)
    
    # Final Simulated LST = Ground Truth LST + Capped Delta T (preserves actual spatial baseline)
    final_sim_lst = df['LST_Celsius'].values + capped_delta_t
    
    return final_sim_lst, capped_delta_t, raw_delta_t, low_confidence_flag

def main():
    print("=== [FR5] Starting Constrained Scenario Simulation Engine ===")
    
    # Paths
    parquet_path = "data/fr1_preprocessed_dataset.parquet"
    scaler_path = "data/fr1_scaler.pkl"
    model_path = "data/fr4_piml_model.pt"
    out_dir = "outputs"
    os.makedirs(out_dir, exist_ok=True)
    
    # Load dataset & scaler
    df = pd.read_parquet(parquet_path)
    with open(scaler_path, "rb") as f:
        scaler = pickle.load(f)
        
    feature_cols = [
        'NDVI', 'LULC_class', 'BuiltSurface_m2', 'BuildingHeight_m',
        'PopDensity', 'AirTemp_C', 'WindSpeed_ms', 'Dewpoint_C'
    ]
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Loaded {len(df)} baseline records.")
    
    # Load PINN model
    model = load_piml_model(model_path, len(feature_cols), device)
    print(f"Loaded PINN model from {model_path}.")
    print(f"Applying Input Bounds: NDVI <= {NDVI_MAX_OBSERVED}, BuiltSurface <= {BUILT_SURFACE_MAX} m^2")
    print(f"Applying Cooling Sanity Ceiling: Delta T >= {DELTA_T_CAP_COOLING} °C")
    
    # 1. Run Simulations
    print("\nSimulating Scenario 1: Urban Greening (+NDVI)...")
    lst_s1, delta_s1, raw_s1, flag_s1 = simulate_intervention(df, scaler, model, feature_cols, device, "greening")
    
    print("Simulating Scenario 2: Cool Roofs / High Albedo...")
    lst_s2, delta_s2, raw_s2, flag_s2 = simulate_intervention(df, scaler, model, feature_cols, device, "cool_roofs")
    
    print("Simulating Scenario 3: Integrated Hybrid Strategy (Greening + Cool Roofs)...")
    lst_s3, delta_s3, raw_s3, flag_s3 = simulate_intervention(df, scaler, model, feature_cols, device, "hybrid")
    
    # Compile Results DataFrame
    df_results = df[['longitude', 'latitude', 'LST_Celsius']].copy()
    df_results['LST_Baseline'] = df['LST_Celsius']
    
    df_results['LST_Scenario1_Greening'] = lst_s1
    df_results['DeltaT_Scenario1'] = delta_s1
    df_results['Flag_LowConf_Scenario1'] = flag_s1
    
    df_results['LST_Scenario2_CoolRoofs'] = lst_s2
    df_results['DeltaT_Scenario2'] = delta_s2
    df_results['Flag_LowConf_Scenario2'] = flag_s2
    
    df_results['LST_Scenario3_Hybrid'] = lst_s3
    df_results['DeltaT_Scenario3'] = delta_s3
    df_results['Flag_LowConf_Scenario3'] = flag_s3
    
    # Export CSV
    csv_out = os.path.join(out_dir, "fr5_scenario_results.csv")
    df_results.to_csv(csv_out, index=False)
    print(f"Saved constrained scenario simulation results table to {csv_out}")
    
    # Printed Summary Report
    print("\n=== Constrained Scenario Performance Summary ===")
    print(f"  Scenario 1 (Urban Greening):  Avg DeltaT = {delta_s1.mean():.2f} °C, Max Cooling = {delta_s1.min():.2f} °C, Flagged Cells = {flag_s1.sum():,} ({flag_s1.mean()*100:.2f}%)")
    print(f"  Scenario 2 (Cool Roofs):      Avg DeltaT = {delta_s2.mean():.2f} °C, Max Cooling = {delta_s2.min():.2f} °C, Flagged Cells = {flag_s2.sum():,} ({flag_s2.mean()*100:.2f}%)")
    print(f"  Scenario 3 (Hybrid Cooling):  Avg DeltaT = {delta_s3.mean():.2f} °C, Max Cooling = {delta_s3.min():.2f} °C, Flagged Cells = {flag_s3.sum():,} ({flag_s3.mean()*100:.2f}%)")
    
    # 2. Multi-Panel Spatial Visualization
    print("\nGenerating updated spatial cooling comparison map...")
    sample_df = df_results.sample(n=min(25000, len(df_results)), random_state=42)
    fig, axes = plt.subplots(2, 2, figsize=(14, 12), dpi=150)
    
    # Panel 1: Baseline LST
    sc0 = axes[0, 0].scatter(sample_df['longitude'], sample_df['latitude'], c=sample_df['LST_Baseline'], 
                              cmap='YlOrRd', s=2.0, alpha=0.9, vmin=26, vmax=55)
    axes[0, 0].set_title("Baseline Land Surface Temp (LST °C)", fontsize=11, fontweight='bold')
    plt.colorbar(sc0, ax=axes[0, 0], label="LST (°C)")
    
    # Panel 2: Scenario 1 Cooling (Delta T)
    sc1 = axes[0, 1].scatter(sample_df['longitude'], sample_df['latitude'], c=sample_df['DeltaT_Scenario1'], 
                              cmap='coolwarm', s=2.0, alpha=0.9, vmin=-6, vmax=1)
    axes[0, 1].set_title("Scenario 1: Urban Greening Delta T (°C)", fontsize=11, fontweight='bold')
    plt.colorbar(sc1, ax=axes[0, 1], label="Delta T (°C)")
    
    # Panel 3: Scenario 2 Cooling (Delta T)
    sc2 = axes[1, 0].scatter(sample_df['longitude'], sample_df['latitude'], c=sample_df['DeltaT_Scenario2'], 
                              cmap='coolwarm', s=2.0, alpha=0.9, vmin=-6, vmax=1)
    axes[1, 0].set_title("Scenario 2: Cool Roofs Delta T (°C)", fontsize=11, fontweight='bold')
    plt.colorbar(sc2, ax=axes[1, 0], label="Delta T (°C)")
    
    # Panel 4: Scenario 3 Hybrid Cooling (Delta T)
    sc3 = axes[1, 1].scatter(sample_df['longitude'], sample_df['latitude'], c=sample_df['DeltaT_Scenario3'], 
                              cmap='coolwarm', s=2.0, alpha=0.9, vmin=-6, vmax=1)
    axes[1, 1].set_title("Scenario 3: Hybrid Strategy Delta T (°C)", fontsize=11, fontweight='bold')
    plt.colorbar(sc3, ax=axes[1, 1], label="Delta T (°C)")
    
    plt.tight_layout()
    fig_out = os.path.join(out_dir, "fr5_scenarios_comparison.png")
    plt.savefig(fig_out, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"Saved scenario comparison figure to {fig_out}")
    
    print("\n=== [FR5] Constrained Scenario Simulation Engine Completed Successfully ===")

if __name__ == "__main__":
    main()
