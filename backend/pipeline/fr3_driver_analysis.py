"""
FR3 – Driver Analysis Module
Urban Heat Mitigation AI/ML System for Mumbai & Navi Mumbai

Tasks:
1. Pearson & Spearman correlation analysis between LST and all driver variables.
2. Random Forest Regression for nonlinear LST driver modeling.
3. SHAP (SHapley Additive exPlanations) computation for explainable AI.
4. Export ranked feature importance tables and publication-quality plots.
"""

import os
import pickle
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import shap

def main():
    print("=== [FR3] Starting Driver Analysis Module ===")
    
    # Paths & Setup
    parquet_path = "data/fr1_preprocessed_dataset.parquet"
    out_dir = "outputs"
    os.makedirs(out_dir, exist_ok=True)
    
    df = pd.read_parquet(parquet_path)
    print(f"Loaded {len(df)} records from {parquet_path}.")
    
    features = [
        'NDVI', 'BuiltSurface_m2', 'BuildingHeight_m', 'PopDensity',
        'AirTemp_C', 'WindSpeed_ms', 'Dewpoint_C', 'LULC_class'
    ]
    target = 'LST_Celsius'
    
    # 1. Correlation Analysis
    print("\nCalculating Pearson and Spearman correlations with LST...")
    pearson_corr = df[features + [target]].corr(method='pearson')[target].drop(target)
    spearman_corr = df[features + [target]].corr(method='spearman')[target].drop(target)
    
    corr_df = pd.DataFrame({
        'Feature': features,
        'Pearson_r': pearson_corr.values,
        'Spearman_rho': spearman_corr.values,
        'Abs_Pearson': np.abs(pearson_corr.values)
    }).sort_values(by='Abs_Pearson', ascending=False)
    
    corr_csv = os.path.join(out_dir, "fr3_driver_correlations.csv")
    corr_df.to_csv(corr_csv, index=False)
    print(f"Saved correlation analysis to {corr_csv}")
    print("\nTop Correlations with LST:")
    print(corr_df.to_string(index=False))
    
    # 2. Random Forest Regressor Training
    print("\nTraining Random Forest Regressor for driver attribution...")
    X = df[features]
    y = df[target]
    
    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)
    
    rf = RandomForestRegressor(
        n_estimators=50,
        max_depth=12,
        min_samples_split=5,
        n_jobs=-1,
        random_state=42
    )
    rf.fit(X_train, y_train)
    
    y_pred = rf.predict(X_val)
    r2 = r2_score(y_val, y_pred)
    rmse = np.sqrt(mean_squared_error(y_val, y_pred))
    
    print(f"Random Forest Validation R²:   {r2:.4f}")
    print(f"Random Forest Validation RMSE: {rmse:.4f} °C")
    
    # Save RF Model
    model_path = "data/fr3_rf_model.pkl"
    with open(model_path, "wb") as f:
        pickle.dump(rf, f)
    print(f"Saved Random Forest model to {model_path}")
    
    # Gini Feature Importances
    importances = pd.DataFrame({
        'Feature': features,
        'RF_Importance': rf.feature_importances_
    }).sort_values(by='RF_Importance', ascending=False)
    
    # 3. SHAP Analysis
    print("\nComputing SHAP values using TreeExplainer...")
    # Sample 1000 instances for fast, exact SHAP value computation
    sample_X = X_val.sample(n=min(1000, len(X_val)), random_state=42)
    explainer = shap.TreeExplainer(rf)
    shap_values = explainer.shap_values(sample_X, check_additivity=False)
    
    mean_abs_shap = np.abs(shap_values).mean(axis=0)
    shap_importance = pd.DataFrame({
        'Feature': features,
        'Mean_Abs_SHAP': mean_abs_shap
    }).sort_values(by='Mean_Abs_SHAP', ascending=False)
    
    # Merge all rankings
    ranking_df = corr_df.merge(importances, on='Feature').merge(shap_importance, on='Feature')
    ranking_df['SHAP_Share_%'] = (ranking_df['Mean_Abs_SHAP'] / ranking_df['Mean_Abs_SHAP'].sum()) * 100
    ranking_df = ranking_df.sort_values(by='Mean_Abs_SHAP', ascending=False)
    
    ranking_csv = os.path.join(out_dir, "fr3_driver_importance_ranking.csv")
    ranking_df.to_csv(ranking_csv, index=False)
    print(f"Saved complete driver ranking table to {ranking_csv}")
    print("\nRanked Driver Importance (SHAP Share %):")
    print(ranking_df[['Feature', 'Pearson_r', 'RF_Importance', 'Mean_Abs_SHAP', 'SHAP_Share_%']].to_string(index=False))
    
    # 4. Generate Visualizations
    print("\nGenerating driver importance and SHAP summary charts...")
    
    # Figure 1: Feature Importance & Correlation Bar Chart
    fig, axes = plt.subplots(1, 2, figsize=(15, 6), dpi=300)
    
    sns.barplot(data=ranking_df, x='SHAP_Share_%', y='Feature', palette='crest', ax=axes[0])
    axes[0].set_title("Driver SHAP Feature Importance Share (%)", fontsize=12, fontweight='bold')
    axes[0].set_xlabel("SHAP Importance Share (%)")
    axes[0].set_ylabel("Driver Variable")
    for p in axes[0].patches:
        width = p.get_width()
        axes[0].annotate(f"{width:.1f}%", (width + 0.5, p.get_y() + p.get_height()/2),
                         ha='left', va='center', fontsize=10)
                         
    sns.barplot(data=corr_df, x='Pearson_r', y='Feature', palette='vlag', ax=axes[1])
    axes[1].set_title("Linear Correlation with LST (Pearson r)", fontsize=12, fontweight='bold')
    axes[1].set_xlabel("Pearson Correlation Coefficient (r)")
    axes[1].axvline(0, color='gray', linestyle='--')
    
    plt.tight_layout()
    bar_fig_out = os.path.join(out_dir, "fr3_feature_importance.png")
    plt.savefig(bar_fig_out, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Saved feature importance chart to {bar_fig_out}")
    
    # Figure 2: Standard SHAP Summary Beeswarm Plot
    plt.figure(figsize=(10, 6), dpi=300)
    shap.summary_plot(shap_values, sample_X, show=False)
    plt.title("SHAP Beeswarm Plot — LST Impact per Driver Variable", fontsize=12, fontweight='bold')
    shap_fig_out = os.path.join(out_dir, "fr3_shap_summary.png")
    plt.savefig(shap_fig_out, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Saved SHAP summary plot to {shap_fig_out}")
    
    print("\n=== [FR3] Driver Analysis Module Completed Successfully ===")

if __name__ == "__main__":
    main()
