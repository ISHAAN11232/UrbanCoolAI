"""
FR1 – Data Preprocessing Pipeline
Urban Heat Mitigation AI/ML System for Mumbai & Navi Mumbai

Tasks:
1. Load dataset (mumbai_heat_dataset_clean.csv).
2. Inspect spatial properties (extent, resolution, coordinate range, missing values).
3. Generate aligned GeoTIFF rasters for all 9 layers in data/raster_aligned/.
4. Normalize continuous features for ML models and save feature matrix.
5. Save preprocessed dataset and scaler object.
"""

import os
import pickle
import numpy as np
import pandas as pd
import rasterio
from rasterio.transform import from_bounds
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split

def main():
    print("=== [FR1] Starting Data Preprocessing Pipeline ===")
    
    # 1. Paths & Setup
    csv_path = "data/mumbai_heat_dataset_clean.csv"
    raster_dir = "data/raster_aligned"
    os.makedirs(raster_dir, exist_ok=True)
    os.makedirs("outputs", exist_ok=True)

    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Input file {csv_path} not found.")

    # 2. Load dataset
    print(f"Loading raw tabular data from {csv_path}...")
    df = pd.read_csv(csv_path)
    print(f"Dataset shape: {df.shape[0]} rows, {df.shape[1]} columns.")
    print("Columns:", df.columns.tolist())
    print("\nSummary Statistics:")
    print(df.describe().T[['min', 'mean', 'max', 'std']])

    # Check missing values
    null_counts = df.isnull().sum()
    print("\nNull Value Counts:")
    print(null_counts)
    if null_counts.sum() > 0:
        print("Filling null values with median...")
        df.fillna(df.median(numeric_only=True), inplace=True)

    # 3. Spatial Extent & Grid Resolution Analysis
    min_lon, max_lon = df['longitude'].min(), df['longitude'].max()
    min_lat, max_lat = df['latitude'].min(), df['latitude'].max()
    print(f"\nSpatial Extent (EPSG:4326):")
    print(f"  Longitude: [{min_lon:.6f}, {max_lon:.6f}]")
    print(f"  Latitude:  [{min_lat:.6f}, {max_lat:.6f}]")

    # Determine spatial grid dimensions
    unique_lons = np.sort(df['longitude'].unique())
    unique_lats = np.sort(df['latitude'].unique())
    n_cols = len(unique_lons)
    n_rows = len(unique_lats)
    print(f"Grid dimensions: {n_rows} rows x {n_cols} columns ({n_rows * n_cols} cells)")

    # Calculate step size
    d_lon = np.diff(unique_lons).min() if len(unique_lons) > 1 else 0.0009
    d_lat = np.diff(unique_lats).min() if len(unique_lats) > 1 else 0.0009
    print(f"Grid cell resolution: ~{d_lon:.6f} degrees x ~{d_lat:.6f} degrees")

    # 4. Reconstruct Aligned GeoTIFF Rasters
    transform = from_bounds(min_lon - d_lon/2, min_lat - d_lat/2, 
                            max_lon + d_lon/2, max_lat + d_lat/2, 
                            n_cols, n_rows)

    # Mapping of column names to output raster filenames
    raster_vars = {
        'LST_Celsius': 'Mumbai_NaviMumbai_LST_2024_aligned.tif',
        'NDVI': 'Mumbai_NaviMumbai_NDVI_2024_aligned.tif',
        'LULC_class': 'Mumbai_NaviMumbai_LULC_aligned.tif',
        'BuiltSurface_m2': 'BuiltSurface_aligned.tif',
        'BuildingHeight_m': 'Mumbai_NaviMumbai_BuildingHeight_aligned.tif',
        'PopDensity': 'Mumbai_NaviMumbai_PopDensity_aligned.tif',
        'AirTemp_C': 'Mumbai_NaviMumbai_AirTemp_aligned.tif',
        'WindSpeed_ms': 'Mumbai_NaviMumbai_WindSpeed_aligned.tif',
        'Dewpoint_C': 'Mumbai_NaviMumbai_Dewpoint_aligned.tif'
    }

    print("\nWriting aligned GeoTIFF rasters...")
    # Index lon and lat to grid coordinates
    lon_map = {val: i for i, val in enumerate(unique_lons)}
    lat_map = {val: (n_rows - 1 - i) for i, val in enumerate(unique_lats)}  # Flip lat for raster top-down orientation

    col_idx = df['longitude'].map(lon_map).values
    row_idx = df['latitude'].map(lat_map).values

    for col_name, filename in raster_vars.items():
        grid = np.full((n_rows, n_cols), fill_value=np.nan, dtype=np.float32)
        grid[row_idx, col_idx] = df[col_name].values

        out_path = os.path.join(raster_dir, filename)
        with rasterio.open(
            out_path,
            'w',
            driver='GTiff',
            height=n_rows,
            width=n_cols,
            count=1,
            dtype=np.float32,
            crs='EPSG:4326',
            transform=transform,
            nodata=np.nan
        ) as dst:
            dst.write(grid, 1)
        print(f"  Saved raster: {out_path} (shape: {n_rows}x{n_cols})")

    # 5. Feature Scaling & Preparation for ML
    feature_cols = [
        'NDVI', 'LULC_class', 'BuiltSurface_m2', 'BuildingHeight_m',
        'PopDensity', 'AirTemp_C', 'WindSpeed_ms', 'Dewpoint_C'
    ]
    target_col = 'LST_Celsius'

    print("\nScaling features with StandardScaler...")
    scaler = StandardScaler()
    scaled_features = scaler.fit_transform(df[feature_cols])

    for i, col in enumerate(feature_cols):
        df[f"{col}_scaled"] = scaled_features[:, i]

    # Save scaler object
    scaler_path = "data/fr1_scaler.pkl"
    with open(scaler_path, "wb") as f:
        pickle.dump(scaler, f)
    print(f"Saved feature scaler to {scaler_path}")

    # Save preprocessed dataset
    parquet_path = "data/fr1_preprocessed_dataset.parquet"
    df.to_parquet(parquet_path, index=False)
    print(f"Saved preprocessed dataset to {parquet_path} ({len(df)} records)")

    print("\n=== [FR1] Preprocessing Pipeline Completed Successfully ===")

if __name__ == "__main__":
    main()
