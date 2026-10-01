"""
FR2 – Hotspot Detection Module
Urban Heat Mitigation AI/ML System for Mumbai & Navi Mumbai

Tasks:
1. Heat stress classification from LST layer.
2. Getis-Ord Gi* spatial autocorrelation statistic calculation over the 2D grid.
3. Identify statistically significant hot spots, cold spots, and non-significant cells.
4. Export GeoTIFF hotspot raster, CSV table, and visual publication-quality figure.
"""

import os
import numpy as np
import pandas as pd
import scipy.ndimage as ndimage
import scipy.stats as stats
import rasterio
import matplotlib.pyplot as plt
import seaborn as sns

def compute_getis_ord_gi_star(grid, kernel_size=5):
    """
    Computes local Getis-Ord Gi* statistic over a 2D spatial grid using fast convolution.
    
    Gi* = ( sum(w_ij * x_j) - X_bar * sum(w_ij) ) / ( S * sqrt( (n * sum(w_ij^2) - (sum(w_ij))^2) / (n - 1) ) )
    """
    nan_mask = np.isnan(grid)
    x = np.nan_to_num(grid, nan=0.0)
    valid_mask = (~nan_mask).astype(float)
    
    n = np.sum(valid_mask)
    if n == 0:
        return np.full_like(grid, np.nan), np.full_like(grid, np.nan)
        
    x_bar = np.sum(x) / n
    s = np.sqrt(np.sum(x**2) / n - x_bar**2)
    
    # Kernel definition (square window of size kernel_size x kernel_size)
    kernel = np.ones((kernel_size, kernel_size), dtype=float)
    
    # Spatial convolutions
    sum_w_x = ndimage.convolve(x, kernel, mode='constant', cval=0.0)
    sum_w = ndimage.convolve(valid_mask, kernel, mode='constant', cval=0.0)
    sum_w2 = ndimage.convolve(valid_mask, kernel**2, mode='constant', cval=0.0)
    
    # Numerator & Denominator
    numerator = sum_w_x - x_bar * sum_w
    denom_inner = (n * sum_w2 - (sum_w)**2) / (n - 1)
    denom_inner = np.maximum(denom_inner, 0.0)  # Avoid numerical precision negative values
    denominator = s * np.sqrt(denom_inner)
    
    # Avoid zero division
    with np.errstate(divide='ignore', invalid='ignore'):
        gi_star = np.where(denominator > 1e-12, numerator / denominator, 0.0)
        gi_star[nan_mask] = np.nan
        
    # p-values (two-tailed standard normal)
    p_values = 2 * (1 - stats.norm.cdf(np.abs(gi_star)))
    p_values[nan_mask] = np.nan
    
    return gi_star, p_values

def classify_gi_star(z):
    """Classifies Gi* Z-scores into confidence tiers."""
    if np.isnan(z):
        return "No Data"
    elif z >= 2.58:
        return "Hotspot (99% confidence)"
    elif z >= 1.96:
        return "Hotspot (95% confidence)"
    elif z >= 1.645:
        return "Hotspot (90% confidence)"
    elif z <= -2.58:
        return "Coldspot (99% confidence)"
    elif z <= -1.96:
        return "Coldspot (95% confidence)"
    elif z <= -1.645:
        return "Coldspot (90% confidence)"
    else:
        return "Not Significant"

def main():
    print("=== [FR2] Starting Hotspot Detection Module ===")
    
    # Paths
    parquet_path = "data/fr1_preprocessed_dataset.parquet"
    lst_raster_path = "data/raster_aligned/Mumbai_NaviMumbai_LST_2024_aligned.tif"
    out_dir = "outputs"
    os.makedirs(out_dir, exist_ok=True)
    
    # Load dataset
    df = pd.read_parquet(parquet_path)
    print(f"Loaded {len(df)} records from {parquet_path}.")
    
    # Read LST raster
    with rasterio.open(lst_raster_path) as src:
        lst_grid = src.read(1)
        transform = src.transform
        crs = src.crs
        nodata = src.nodata

    print(f"LST Grid Dimensions: {lst_grid.shape[0]} x {lst_grid.shape[1]}")
    
    # 1. Heat Stress Classification
    # Tiers: Extreme (>42C), High (38-42C), Moderate (34-38C), Normal (<34C)
    conditions = [
        df['LST_Celsius'] >= 42.0,
        (df['LST_Celsius'] >= 38.0) & (df['LST_Celsius'] < 42.0),
        (df['LST_Celsius'] >= 34.0) & (df['LST_Celsius'] < 38.0),
        df['LST_Celsius'] < 34.0
    ]
    tier_labels = ['Extreme Heat (>=42C)', 'High Heat (38-42C)', 'Moderate Heat (34-38C)', 'Normal (<34C)']
    df['heat_tier'] = np.select(conditions, tier_labels, default='Normal (<34C)')
    
    print("\nHeat Stress Tier Distribution:")
    print(df['heat_tier'].value_counts())
    
    # 2. Getis-Ord Gi* Spatial Autocorrelation
    print("\nComputing Getis-Ord Gi* spatial autocorrelation...")
    gi_star_grid, p_val_grid = compute_getis_ord_gi_star(lst_grid, kernel_size=5)
    
    # Map back to DataFrame
    unique_lons = np.sort(df['longitude'].unique())
    unique_lats = np.sort(df['latitude'].unique())
    n_rows, n_cols = lst_grid.shape
    
    lon_map = {val: i for i, val in enumerate(unique_lons)}
    lat_map = {val: (n_rows - 1 - i) for i, val in enumerate(unique_lats)}
    
    col_idx = df['longitude'].map(lon_map).values
    row_idx = df['latitude'].map(lat_map).values
    
    df['gi_star_z'] = gi_star_grid[row_idx, col_idx]
    df['gi_star_p'] = p_val_grid[row_idx, col_idx]
    df['gi_class'] = [classify_gi_star(z) for z in df['gi_star_z']]
    
    print("\nGetis-Ord Gi* Spatial Cluster Summary:")
    print(df['gi_class'].value_counts())
    
    # Save Hotspot CSV
    csv_out = os.path.join(out_dir, "fr2_hotspots.csv")
    df[['longitude', 'latitude', 'LST_Celsius', 'heat_tier', 'gi_star_z', 'gi_star_p', 'gi_class']].to_csv(csv_out, index=False)
    print(f"Saved hotspot table to {csv_out}")
    
    # Export Hotspot GeoTIFF
    # Numeric codes for classes: 3=Hot 99%, 2=Hot 95%, 1=Hot 90%, 0=Not Sig, -1=Cold 90%, -2=Cold 95%, -3=Cold 99%
    code_map = {
        "Hotspot (99% confidence)": 3,
        "Hotspot (95% confidence)": 2,
        "Hotspot (90% confidence)": 1,
        "Not Significant": 0,
        "Coldspot (90% confidence)": -1,
        "Coldspot (95% confidence)": -2,
        "Coldspot (99% confidence)": -3,
        "No Data": -99
    }
    gi_code_grid = np.full_like(lst_grid, fill_value=-99, dtype=np.int16)
    valid_mask = ~np.isnan(gi_star_grid)
    
    for r in range(n_rows):
        for c in range(n_cols):
            if valid_mask[r, c]:
                z = gi_star_grid[r, c]
                lbl = classify_gi_star(z)
                gi_code_grid[r, c] = code_map[lbl]
                
    tif_out = os.path.join(out_dir, "fr2_hotspot_map.tif")
    with rasterio.open(
        tif_out, 'w', driver='GTiff', height=n_rows, width=n_cols, count=1,
        dtype=np.int16, crs=crs, transform=transform, nodata=-99
    ) as dst:
        dst.write(gi_code_grid, 1)
    print(f"Saved hotspot GeoTIFF raster to {tif_out}")
    
    # 3. Visualizations (Publication Quality Figure)
    print("\nGenerating publication-quality hotspot map figure...")
    fig, axes = plt.subplots(1, 2, figsize=(16, 7), dpi=300)
    
    # Subplot 1: Baseline LST Map
    sc1 = axes[0].scatter(df['longitude'], df['latitude'], c=df['LST_Celsius'], 
                           cmap='YlOrRd', s=1.5, alpha=0.9)
    axes[0].set_title("Mumbai & Navi Mumbai — Land Surface Temp (LST °C)", fontsize=13, fontweight='bold')
    axes[0].set_xlabel("Longitude")
    axes[0].set_ylabel("Latitude")
    cbar1 = plt.colorbar(sc1, ax=axes[0], fraction=0.046, pad=0.04)
    cbar1.set_label("LST (°C)")
    
    # Subplot 2: Getis-Ord Gi* Hotspot Map
    palette = {
        "Hotspot (99% confidence)": "#8b0000",
        "Hotspot (95% confidence)": "#d73027",
        "Hotspot (90% confidence)": "#fdae61",
        "Not Significant": "#e0e0e0",
        "Coldspot (90% confidence)": "#abd9e9",
        "Coldspot (95% confidence)": "#4575b4",
        "Coldspot (99% confidence)": "#313695"
    }
    
    sns.scatterplot(
        data=df, x='longitude', y='latitude', hue='gi_class',
        palette=palette, s=2.5, alpha=0.95, ax=axes[1], linewidth=0
    )
    axes[1].set_title("Getis-Ord Gi* Spatial Hotspot Clusters", fontsize=13, fontweight='bold')
    axes[1].set_xlabel("Longitude")
    axes[1].set_ylabel("Latitude")
    axes[1].legend(title="Spatial Category", loc='upper left', bbox_to_anchor=(1, 1), markerscale=4)
    
    plt.tight_layout()
    fig_out = os.path.join(out_dir, "fr2_hotspot_visualization.png")
    plt.savefig(fig_out, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Saved hotspot visualization to {fig_out}")
    
    print("\n=== [FR2] Hotspot Detection Module Completed Successfully ===")

if __name__ == "__main__":
    main()
