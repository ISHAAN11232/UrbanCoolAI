"""
FR6 – Optimization Module (Constrained)
Urban Heat Mitigation AI/ML System for Mumbai & Navi Mumbai

Tasks:
1. Ingest constrained FR5 scenario simulation outputs and FR2 hotspot spatial classifications.
2. Define cost model, land feasibility masks, and budget constraints.
3. Implement spatial optimization algorithm to maximize total city-wide cooling yield under budget limits ($10M).
4. Export optimal intervention action plan CSV, top 10/top 50 tables, and spatial allocation map figure.
"""

import os
import json
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

def main():
    print("=== [FR6] Starting Constrained Optimization Module ===")
    
    # Paths
    scenario_csv = "outputs/fr5_scenario_results.csv"
    hotspot_csv = "outputs/fr2_hotspots.csv"
    out_dir = "outputs"
    os.makedirs(out_dir, exist_ok=True)
    
    # Load data
    df_scen = pd.read_csv(scenario_csv)
    df_hot = pd.read_csv(hotspot_csv)
    
    df = df_scen.merge(df_hot[['longitude', 'latitude', 'gi_class']], on=['longitude', 'latitude'], how='left')
    print(f"Loaded {len(df)} grid cells for spatial optimization.")
    
    # Cost Definitions (USD / cell ~90m x 90m plot)
    COST_GREENING = 1200.0
    COST_COOL_ROOF = 800.0
    COST_HYBRID = 1800.0
    
    # Feasibility Mask: Exclude open water and select hotspot / high LST candidate cells
    is_hotspot = df['gi_class'].str.contains('Hotspot', na=False) | (df['LST_Baseline'] >= 38.0)
    is_water = df['LST_Baseline'] < 28.0  # Proxy for open water
    
    feasible_mask = is_hotspot & (~is_water)
    candidate_df = df[feasible_mask].copy()
    print(f"Eligible candidate hotspot cells for intervention: {len(candidate_df)} cells.")
    
    # Calculate degree C cooling (positive values)
    candidate_df['Cooling_Greening'] = np.abs(candidate_df['DeltaT_Scenario1'])
    candidate_df['Cooling_CoolRoofs'] = np.abs(candidate_df['DeltaT_Scenario2'])
    candidate_df['Cooling_Hybrid'] = np.abs(candidate_df['DeltaT_Scenario3'])
    
    # Efficiency metrics (Cooling / Cost * 1000)
    eff_green = candidate_df['Cooling_Greening'] / COST_GREENING
    eff_roof = candidate_df['Cooling_CoolRoofs'] / COST_COOL_ROOF
    eff_hybrid = candidate_df['Cooling_Hybrid'] / COST_HYBRID
    
    # Assign optimal intervention per cell based on max efficiency
    best_type = []
    best_cost = []
    best_cooling = []
    best_flag = []
    
    for i in range(len(candidate_df)):
        eg = eff_green.iloc[i]
        er = eff_roof.iloc[i]
        eh = eff_hybrid.iloc[i]
        
        max_eff = max(eg, er, eh)
        if max_eff == eh:
            best_type.append("Hybrid Strategy")
            best_cost.append(COST_HYBRID)
            best_cooling.append(-candidate_df['Cooling_Hybrid'].iloc[i])
            best_flag.append(candidate_df['Flag_LowConf_Scenario3'].iloc[i])
        elif max_eff == eg:
            best_type.append("Urban Greening")
            best_cost.append(COST_GREENING)
            best_cooling.append(-candidate_df['Cooling_Greening'].iloc[i])
            best_flag.append(candidate_df['Flag_LowConf_Scenario1'].iloc[i])
        else:
            best_type.append("Cool Roofs")
            best_cost.append(COST_COOL_ROOF)
            best_cooling.append(-candidate_df['Cooling_CoolRoofs'].iloc[i])
            best_flag.append(candidate_df['Flag_LowConf_Scenario2'].iloc[i])
            
    candidate_df['Optimal_Intervention'] = best_type
    candidate_df['Estimated_Cost_USD'] = best_cost
    candidate_df['Predicted_Cooling_C'] = best_cooling
    candidate_df['Low_Confidence_Flag'] = best_flag
    candidate_df['Efficiency_C_per_1000USD'] = (np.abs(candidate_df['Predicted_Cooling_C']) / candidate_df['Estimated_Cost_USD']) * 1000.0
    
    # Sort candidate interventions by efficiency
    candidate_df = candidate_df.sort_values(by='Efficiency_C_per_1000USD', ascending=False)
    
    # Optimization under Budget Constraint ($10 Million Municipal Budget)
    BUDGET_LIMIT = 10000000.0  # $10M
    
    candidate_df['Cumulative_Cost'] = candidate_df['Estimated_Cost_USD'].cumsum()
    selected_interventions = candidate_df[candidate_df['Cumulative_Cost'] <= BUDGET_LIMIT].copy()
    
    selected_count = len(selected_interventions)
    total_spent = selected_interventions['Estimated_Cost_USD'].sum()
    total_cooling_degree_cells = np.abs(selected_interventions['Predicted_Cooling_C']).sum()
    avg_cell_cooling = np.abs(selected_interventions['Predicted_Cooling_C']).mean()
    flagged_in_selected = selected_interventions['Low_Confidence_Flag'].sum()
    
    print("\n=== Constrained Optimization Results under $10M Municipal Budget ===")
    print(f"Total Budget Allocated:        ${total_spent:,.2f} / ${BUDGET_LIMIT:,.2f}")
    print(f"Intervention Cells Selected:   {selected_count:,} grid cells")
    print(f"Total Cumulative Cooling:      {total_cooling_degree_cells:,.2f} °C-cells")
    print(f"Average Surface Temp Reduction:{avg_cell_cooling:.2f} °C per cell")
    print(f"Flagged Low Confidence Cells:  {flagged_in_selected:,} / {selected_count:,} ({flagged_in_selected/selected_count*100:.2f}%)")
    
    print("\nIntervention Type Breakdown:")
    breakdown = selected_interventions['Optimal_Intervention'].value_counts()
    print(breakdown)
    
    # Save Optimal Interventions CSV
    csv_out = os.path.join(out_dir, "fr6_optimal_interventions.csv")
    selected_interventions[[
        'longitude', 'latitude', 'LST_Baseline', 'gi_class',
        'Optimal_Intervention', 'Estimated_Cost_USD', 'Predicted_Cooling_C', 'Low_Confidence_Flag', 'Efficiency_C_per_1000USD'
    ]].to_csv(csv_out, index=False)
    print(f"Saved ranked optimal interventions to {csv_out}")
    
    # Save Top 50 Ranked Interventions CSV
    top50 = selected_interventions.head(50).copy()
    top50['Rank'] = range(1, len(top50) + 1)
    top50_cols = ['Rank', 'longitude', 'latitude', 'LST_Baseline', 'gi_class', 'Optimal_Intervention', 'Estimated_Cost_USD', 'Predicted_Cooling_C', 'Low_Confidence_Flag', 'Efficiency_C_per_1000USD']
    top50 = top50[top50_cols]
    top50_out = os.path.join(out_dir, "top_50_ranked_interventions.csv")
    top50.to_csv(top50_out, index=False)
    print(f"Saved Top 50 Ranked Interventions to {top50_out}")
    
    # Save JSON summary
    summary_data = {
        'budget_limit_usd': BUDGET_LIMIT,
        'total_spent_usd': float(total_spent),
        'cells_selected': int(selected_count),
        'avg_cooling_deg_c': float(avg_cell_cooling),
        'flagged_low_conf_cells': int(flagged_in_selected),
        'intervention_counts': {k: int(v) for k, v in breakdown.items()}
    }
    json_out = os.path.join(out_dir, "fr6_optimization_summary.json")
    with open(json_out, "w") as f:
        json.dump(summary_data, f, indent=4)
    print(f"Saved optimization summary to {json_out}")
    
    # 4. Spatial Map Visualization
    print("\nGenerating spatial allocation map of optimal interventions...")
    sample_bg = df.sample(n=min(20000, len(df)), random_state=42)
    
    plt.figure(figsize=(10, 8), dpi=150)
    plt.scatter(sample_bg['longitude'], sample_bg['latitude'], color='#e0e0e0', s=1.0, alpha=0.5, label='Baseline / Non-selected')
    
    palette = {
        "Hybrid Strategy": "#7570b3",
        "Urban Greening": "#1b9e77",
        "Cool Roofs": "#d95f02"
    }
    
    sample_selected = selected_interventions.sample(n=min(15000, len(selected_interventions)), random_state=42)
    sns.scatterplot(
        data=sample_selected, x='longitude', y='latitude', hue='Optimal_Intervention',
        palette=palette, s=3.0, alpha=0.9, linewidth=0
    )
    
    plt.title(f"Optimized Cooling Infrastructure Allocation ($10M Budget, {selected_count:,} Cells)", fontsize=11, fontweight='bold')
    plt.xlabel("Longitude")
    plt.ylabel("Latitude")
    plt.legend(title="Intervention Type", loc='upper left')
    
    plt.tight_layout()
    map_out = os.path.join(out_dir, "fr6_optimization_map.png")
    plt.savefig(map_out, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"Saved optimization allocation map to {map_out}")
    
    print("\n=== [FR6] Constrained Optimization Module Completed Successfully ===")

if __name__ == "__main__":
    main()
