"""
FR4 – Physics-Informed ML Model (PI-ML)
Urban Heat Mitigation AI/ML System for Mumbai & Navi Mumbai

Tasks:
1. Load preprocessed tabular dataset (data/fr1_preprocessed_dataset.parquet).
2. Construct PyTorch Physics-Informed Neural Network (PINN).
3. Implement custom Loss Function combining Data Error (MSE) + Surface Energy Balance Physics Residual (Rn - H - LE - G).
4. Train model, record convergence metrics, and save weights to data/fr4_piml_model.pt.
5. Export training history curve to outputs/fr4_training_history.png.
"""

import os
import json
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
import matplotlib.pyplot as plt

# Set random seeds for reproducibility
torch.manual_seed(42)
np.random.seed(42)

class PhysicsInformedNN(nn.Module):
    def __init__(self, input_dim):
        super(PhysicsInformedNN, self).__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, 128),
            nn.SiLU(),
            nn.BatchNorm1d(128),
            nn.Linear(128, 64),
            nn.SiLU(),
            nn.BatchNorm1d(64),
            nn.Linear(64, 32),
            nn.SiLU(),
            nn.Linear(32, 16),
            nn.SiLU(),
            nn.Linear(16, 1)
        )

    def forward(self, x):
        return self.net(x)

def compute_physics_residual(ts_pred_c, ndvi, built_m2, bldg_m, air_temp_c, wind_ms, dew_c):
    """
    Computes Surface Energy Balance residual:
    Residual = R_n - (H + LE + G)
    
    All inputs in physical units:
    ts_pred_c: predicted Surface Temperature in Celsius
    ndvi: Normalized Difference Vegetation Index (-0.3 to 0.8)
    built_m2: Built Surface in m^2 (0 to 10000)
    bldg_m: Building Height in meters
    air_temp_c: Air Temperature in Celsius
    wind_ms: Wind speed in m/s
    dew_c: Dewpoint in Celsius
    """
    # Absolute temperatures in Kelvin
    T_s = ts_pred_c + 273.15
    T_a = air_temp_c + 273.15
    
    # Constants
    sigma = 5.67e-8  # Stefan-Boltzmann constant (W/m^2/K^4)
    S_down = 650.0   # Downwelling solar radiation (W/m^2) proxy for midday tropical sun
    
    # 1. Emissivity & Albedo
    built_frac = torch.clamp(built_m2 / 10000.0, 0.0, 1.0)
    emissivity = 0.95 + 0.04 * torch.clamp(ndvi, 0.0, 1.0)
    albedo = 0.15 + 0.10 * built_frac  # Concrete/asphalt higher albedo or solar absorption
    
    # 2. Net Radiation (R_n)
    R_n = (1.0 - albedo) * S_down + emissivity * sigma * (T_a ** 4) - emissivity * sigma * (T_s ** 4)
    
    # 3. Sensible Heat Flux (H)
    # Heat transfer coefficient increases with wind speed & urban roughness (building height)
    ch = 10.0 + 5.0 * wind_ms + 0.2 * bldg_m
    H = ch * (ts_pred_c - air_temp_c)
    
    # 4. Latent Heat Flux (LE - Evapotranspiration cooling)
    # High NDVI -> high latent heat flux (cooling effect)
    le_max = 250.0  # W/m^2 peak ET flux
    humidity_factor = torch.clamp(1.0 - (air_temp_c - dew_c) / 15.0, 0.1, 1.0)
    LE = le_max * torch.clamp(ndvi, 0.0, 1.0) * humidity_factor
    
    # 5. Ground Heat Flux (G)
    # Impervious surfaces store and conduct more heat into ground
    c_g = 0.15 + 0.25 * built_frac
    G = c_g * R_n
    
    # Surface Energy Balance Residual (should sum to zero at equilibrium)
    residual = R_n - (H + LE + G)
    return torch.mean(residual ** 2)

def main():
    print("=== [FR4] Starting Physics-Informed ML Model (PI-ML) Training ===")
    
    # Paths
    parquet_path = "data/fr1_preprocessed_dataset.parquet"
    out_dir = "outputs"
    model_dir = "data"
    os.makedirs(out_dir, exist_ok=True)
    os.makedirs(model_dir, exist_ok=True)
    
    df = pd.read_parquet(parquet_path)
    print(f"Loaded {len(df)} records from {parquet_path}.")
    
    feature_cols = [
        'NDVI', 'LULC_class', 'BuiltSurface_m2', 'BuildingHeight_m',
        'PopDensity', 'AirTemp_C', 'WindSpeed_ms', 'Dewpoint_C'
    ]
    scaled_cols = [f"{col}_scaled" for col in feature_cols]
    target_col = 'LST_Celsius'
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Training on compute device: {device}")

    # Prepare PyTorch Tensors directly
    X_scaled_tensor = torch.tensor(df[scaled_cols].values, dtype=torch.float32, device=device)
    X_raw_tensor = torch.tensor(df[feature_cols].values, dtype=torch.float32, device=device)
    y_raw_tensor = torch.tensor(df[target_col].values, dtype=torch.float32, device=device).unsqueeze(1)
    
    # Train / Val Split (80/20)
    n_samples = len(df)
    indices = torch.randperm(n_samples, device=device)
    split = int(0.8 * n_samples)
    train_idx, val_idx = indices[:split], indices[split:]
    
    X_train_scaled = X_scaled_tensor[train_idx]
    X_train_raw = X_raw_tensor[train_idx]
    y_train = y_raw_tensor[train_idx]
    
    X_val_scaled = X_scaled_tensor[val_idx]
    X_val_raw = X_raw_tensor[val_idx]
    y_val = y_raw_tensor[val_idx]
    
    model = PhysicsInformedNN(input_dim=len(scaled_cols)).to(device)
    optimizer = optim.AdamW(model.parameters(), lr=5e-3, weight_decay=1e-4)
    data_criterion = nn.MSELoss()
    
    epochs = 15
    batch_size = 4096
    n_train = len(train_idx)
    lambda_physics = 1e-4
    
    history = {'train_loss': [], 'val_loss': [], 'val_rmse': [], 'physics_loss': []}
    best_val_loss = float('inf')
    
    print("\nStarting Physics-Informed ML Training Loop...")
    for epoch in range(1, epochs + 1):
        model.train()
        perm = torch.randperm(n_train, device=device)
        running_data_loss = 0.0
        running_phys_loss = 0.0
        
        for i in range(0, n_train, batch_size):
            batch_indices = perm[i:i + batch_size]
            bx_scaled = X_train_scaled[batch_indices]
            bx_raw = X_train_raw[batch_indices]
            by_true = y_train[batch_indices]
            
            optimizer.zero_grad()
            y_pred = model(bx_scaled)
            
            loss_data = data_criterion(y_pred, by_true)
            
            ndvi = bx_raw[:, 0:1]
            built_m2 = bx_raw[:, 2:3]
            bldg_m = bx_raw[:, 3:4]
            air_temp_c = bx_raw[:, 5:6]
            wind_ms = bx_raw[:, 6:7]
            dew_c = bx_raw[:, 7:8]
            
            loss_phys = compute_physics_residual(
                y_pred, ndvi, built_m2, bldg_m, air_temp_c, wind_ms, dew_c
            )
            
            total_loss = loss_data + lambda_physics * loss_phys
            total_loss.backward()
            optimizer.step()
            
            bs = len(by_true)
            running_data_loss += loss_data.item() * bs
            running_phys_loss += loss_phys.item() * bs
            
        train_data_loss = running_data_loss / n_train
        train_phys_loss = running_phys_loss / n_train
        
        # Validation
        model.eval()
        with torch.no_grad():
            val_pred = model(X_val_scaled)
            val_mse = data_criterion(val_pred, y_val).item()
            val_rmse = np.sqrt(val_mse)
            
        history['train_loss'].append(train_data_loss)
        history['val_loss'].append(val_mse)
        history['val_rmse'].append(val_rmse)
        history['physics_loss'].append(train_phys_loss)
        
        if val_mse < best_val_loss:
            best_val_loss = val_mse
            torch.save(model.state_dict(), os.path.join(model_dir, "fr4_piml_model.pt"))
            
        if epoch % 3 == 0 or epoch == 1 or epoch == epochs:
            print(f"Epoch {epoch:02d}/{epochs:02d} | Train MSE: {train_data_loss:.4f} | Phys Residual: {train_phys_loss:.2f} | Val RMSE: {val_rmse:.4f} °C")
            
    print(f"\nModel Training Complete! Best Validation RMSE: {np.sqrt(best_val_loss):.4f} °C")
    print(f"Saved best model weights to {os.path.join(model_dir, 'fr4_piml_model.pt')}")
    
    # Save training metrics JSON
    metrics = {
        'best_val_mse': float(best_val_loss),
        'best_val_rmse': float(np.sqrt(best_val_loss)),
        'final_train_mse': float(history['train_loss'][-1]),
        'final_physics_residual': float(history['physics_loss'][-1]),
        'lambda_physics': lambda_physics,
        'epochs': epochs
    }
    metrics_path = os.path.join(out_dir, "fr4_piml_metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=4)
    print(f"Saved model metrics to {metrics_path}")
    
    # Plot Training Convergence
    fig, axes = plt.subplots(1, 2, figsize=(14, 5), dpi=300)
    
    axes[0].plot(range(1, epochs + 1), history['train_loss'], label='Train Data MSE', color='#1f77b4', lw=2)
    axes[0].plot(range(1, epochs + 1), history['val_loss'], label='Val Data MSE', color='#ff7f0e', lw=2, linestyle='--')
    axes[0].set_title("Data MSE Loss Convergence", fontsize=12, fontweight='bold')
    axes[0].set_xlabel("Epoch")
    axes[0].set_ylabel("Mean Squared Error")
    axes[0].legend()
    axes[0].grid(True, alpha=0.3)
    
    axes[1].plot(range(1, epochs + 1), history['physics_loss'], color='#2ca02c', lw=2)
    axes[1].set_title("Surface Energy Balance Physics Residual Loss", fontsize=12, fontweight='bold')
    axes[1].set_xlabel("Epoch")
    axes[1].set_ylabel("Physics Loss (W^2/m^4)")
    axes[1].grid(True, alpha=0.3)
    
    plt.tight_layout()
    plot_path = os.path.join(out_dir, "fr4_training_history.png")
    plt.savefig(plot_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Saved training history figure to {plot_path}")
    
    print("\n=== [FR4] Physics-Informed ML Model Module Completed Successfully ===")

if __name__ == "__main__":
    main()
