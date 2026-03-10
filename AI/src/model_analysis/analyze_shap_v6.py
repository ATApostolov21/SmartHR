
import shap
import pandas as pd
import numpy as np
import tensorflow as tf
import matplotlib.pyplot as plt
import os

# --- Configuration ---
DATA_PATH = 'data/processed_v5/X_test.csv'
MODEL_PATH = 'models/neural_network/models_versions/synthetic_model_v6.keras'
REPORT_DIR = 'models/neural_network/reports/report_v6'

# Ensure report directory exists
os.makedirs(REPORT_DIR, exist_ok=True)

# 1. Load Data
print(f"Loading data from {DATA_PATH}...")
try:
    X_test = pd.read_csv(DATA_PATH)
    print(f"Data loaded. Shape: {X_test.shape}")
except FileNotFoundError:
    print(f"Error: Data file not found at {DATA_PATH}")
    exit(1)

# 2. Load Model
print(f"Loading model from {MODEL_PATH}...")

import zipfile
import json
import shutil
import tempfile

def patch_and_load_model(model_path):
    # Create a temp directory
    with tempfile.TemporaryDirectory() as temp_dir:
        # Extract .keras (zip) to temp
        with zipfile.ZipFile(model_path, 'r') as zip_ref:
            zip_ref.extractall(temp_dir)
        
        config_path = os.path.join(temp_dir, 'config.json')
        if os.path.exists(config_path):
            print("Patching config.json...")
            with open(config_path, 'r') as f:
                config_data = json.load(f)
            
            # Recursive function to remove quantization_config
            def remove_key(obj, key):
                if isinstance(obj, dict):
                    if key in obj:
                        del obj[key]
                    for k, v in obj.items():
                        remove_key(v, key)
                elif isinstance(obj, list):
                    for item in obj:
                        remove_key(item, key)
            
            remove_key(config_data, 'quantization_config')
            
            with open(config_path, 'w') as f:
                json.dump(config_data, f)
        
        # Repackage
        fixed_model_path = os.path.join(REPORT_DIR, 'temp_fixed_model.keras')
        with zipfile.ZipFile(fixed_model_path, 'w', zipfile.ZIP_DEFLATED) as zip_ref:
            for root, dirs, files in os.walk(temp_dir):
                for file in files:
                    file_path = os.path.join(root, file)
                    arcname = os.path.relpath(file_path, temp_dir)
                    zip_ref.write(file_path, arcname)
                    
        print(f"Created patched model at {fixed_model_path}")
        
        try:
            import keras
            model = keras.models.load_model(fixed_model_path)
            print("Model loaded successfully (Patched).")
            return model
        except Exception as e:
            print(f"Error loading patched model: {e}")
            raise e

try:
    model = patch_and_load_model(MODEL_PATH)
except Exception as e:
    print("Falling back to standard load (which failed previously)...")
    try:
        import keras
        model = keras.models.load_model(MODEL_PATH)
    except Exception as e2:
        print(f"Final load failure: {e2}")
        exit(1)

# 3. Prepare for SHAP
# Use a subset of data for SHAP analysis to ensure reasonable runtime
# DeepExplainer is relatively fast, but 1000 is a good balance.
background_size = 100
analysis_size = 1000

if len(X_test) > background_size:
    background = X_test.sample(n=background_size, random_state=42)
else:
    background = X_test

if len(X_test) > analysis_size:
    X_analysis = X_test.sample(n=analysis_size, random_state=42)
else:
    X_analysis = X_test

print(f"Using {len(background)} samples for background and {len(X_analysis)} samples for analysis.")

# 4. Initialize DeepExplainer
print("Initializing SHAP DeepExplainer...")
# Note: DeepExplainer expects numpy arrays for TF/Keras models
explainer = shap.DeepExplainer(model, background.values)

# 5. Calculate SHAP Values
print("Calculating SHAP values...")
shap_values = explainer.shap_values(X_analysis.values)

# Handle output format (list of arrays for classification)
vals = shap_values
if isinstance(shap_values, list):
    # Usually index 0 for binary classification (prob of class 0) or output node
    # However, depending on model structure (units=1 vs units=2), this varies.
    # Assuming sigmoid output (1 unit) -> list of 1 array.
    print(f"Explainer returned list of {len(shap_values)} arrays.")
    vals = shap_values[0]

# check dimensions
if vals.ndim > 2:
    vals = np.squeeze(vals)

# 6. Generate Summary Plot
print("Generating SHAP Summary Plot...")
plt.figure(figsize=(12, 10)) # Large size to fit all features clearly

# max_display set to number of features + 1 to ensure all are shown
n_features = X_analysis.shape[1]

shap.summary_plot(
    vals, 
    X_analysis, 
    feature_names=X_analysis.columns,
    plot_type="beeswarm",
    max_display=n_features + 2, 
    show=False
)

plt.title(f"SHAP Summary (Model V6) - All {n_features} Features")
out_path = f"{REPORT_DIR}/shap_summary_v6_all_features.png"
plt.savefig(out_path, bbox_inches='tight')
print(f"Saved SHAP plot to {out_path}")

# Feature Importance Text
mean_shap = np.abs(vals).mean(axis=0)
feature_importance = pd.DataFrame({
    'Feature': X_analysis.columns,
    'Mean_SHAP': mean_shap
}).sort_values(by='Mean_SHAP', ascending=False)

print("\n--- Feature Importance Ranking ---")
print(feature_importance.to_string(index=False))

# Save importance to CSV
feature_importance.to_csv(f"{REPORT_DIR}/v6_feature_importance.csv", index=False)
print(f"Saved feature importance table to {REPORT_DIR}/v6_feature_importance.csv")
