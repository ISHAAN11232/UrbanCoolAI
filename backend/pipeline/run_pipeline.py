"""
Master Runner Script for UrbanCool AI ML Pipeline (FR1 - FR8)
Executes all Functional Requirement modules sequentially.
"""

import sys
import os
import subprocess
from pathlib import Path

# Add project root to sys.path
PIPELINE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = PIPELINE_DIR.parent.parent
sys.path.append(str(PROJECT_ROOT))

MODULES = [
    ("FR1: Data Preprocessing", "fr1_preprocessing.py"),
    ("FR2: Hotspot Detection", "fr2_hotspot_detection.py"),
    ("FR3: Driver Analysis & SHAP", "fr3_driver_analysis.py"),
    ("FR4: Physics-Informed ML (PINN)", "fr4_physics_informed_ml.py"),
    ("FR5: Scenario Simulation Engine", "fr5_scenario_simulation.py"),
    ("FR6: Budget & Spatial Optimization", "fr6_optimization.py"),
    ("FR7: Model Validation & Error Bounds", "fr7_validation.py"),
    ("FR8: Final Output & Synthesis Reporting", "fr8_output_reporting.py"),
]

def run_all():
    print("=" * 70)
    print("🚀 UrbanCool AI Pipeline Execution Engine (FR1 - FR8)")
    print(f"Project Root: {PROJECT_ROOT}")
    print("=" * 70)

    for step, script in MODULES:
        script_path = PIPELINE_DIR / script
        print(f"\n▶ Executing {step} ({script})...")
        if not script_path.exists():
            print(f"❌ Error: Script {script} not found in {PIPELINE_DIR}")
            continue

        result = subprocess.run([sys.executable, str(script_path)], cwd=str(PROJECT_ROOT))
        if result.returncode != 0:
            print(f"⚠️ Warning: {step} returned non-zero exit code ({result.returncode}).")
        else:
            print(f"✅ {step} completed successfully.")

    print("\n" + "=" * 70)
    print("🎉 Pipeline Execution Complete!")
    print("=" * 70)

if __name__ == "__main__":
    run_all()
