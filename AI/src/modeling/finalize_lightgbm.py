
import pandas as pd
import numpy as np
import lightgbm as lgb
import joblib
import shutil
import os

# --- Config ---
DATA_DIR = 'data/processed_v7'
PROD_DIR = 'models/production'
ARTIFACTS_SOURCE = 'models/neural_network/models_versions'

os.makedirs(PROD_DIR, exist_ok=True)

def finalize_model():
    print("Loading V7 data...")
    X_train = pd.read_csv(f'{DATA_DIR}/X_train.csv')
    y_train = pd.read_csv(f'{DATA_DIR}/y_train.csv').values.ravel()
    X_val = pd.read_csv(f'{DATA_DIR}/X_val.csv')
    y_val = pd.read_csv(f'{DATA_DIR}/y_val.csv').values.ravel()
    
    # Concatenate for maximum training signal
    print("Concatenating Train + Validation sets...")
    X_full = pd.concat([X_train, X_val], axis=0)
    y_full = np.concatenate([y_train, y_val], axis=0)
    
    print(f"Final Training Size: {len(X_full)} samples")
    
    # Best Params from Tuned LightGBM (0.35 threshold logic relies on the probability distribution)
    # We use the params that gave us the best trade-off.
    print("Training Final LightGBM Model...")
    model = lgb.LGBMClassifier(
        n_estimators=100,
        learning_rate=0.05,
        num_leaves=31,
        random_state=42,
        class_weight='balanced',
        force_col_wise=True
    )
    
    model.fit(X_full, y_full)
    
    # Save Model
    model_path = f"{PROD_DIR}/lightgbm_v7.txt"
    model.booster_.save_model(model_path)
    print(f"Model saved to {model_path}")
    
    # Copy Artifacts
    print("Copying preprocessing artifacts...")
    try:
        shutil.copy(f"{ARTIFACTS_SOURCE}/scaler_v7.joblib", f"{PROD_DIR}/scaler.joblib")
        shutil.copy(f"{ARTIFACTS_SOURCE}/encoders_v7.joblib", f"{PROD_DIR}/encoders.joblib")
        print("Artifacts copied successfully.")
    except Exception as e:
        print(f"Error copying artifacts: {e}")

    print("\n--- Deployment Ready ---")
    print(f"1. Model: {model_path}")
    print(f"2. Scaler: {PROD_DIR}/scaler.joblib")
    print(f"3. Encoders: {PROD_DIR}/encoders.joblib")

if __name__ == "__main__":
    finalize_model()
