import pandas as pd
import numpy as np
import tensorflow as tf
import joblib
import matplotlib.pyplot as plt
import os
from scipy.stats import skew

# --- Configuration ---
DATA_PATH = 'data/Synthetic_Complex_Data.csv' 
MODEL_PATH = 'models/neural_network/models_versions/synthetic_model_v5.keras'
SCALER_PATH = 'models/neural_network/scaler_v5.joblib'
ENCODERS_PATH = 'models/neural_network/encoders_v5.joblib'
REPORT_DIR = 'models/neural_network/reports/report_v5_complex'

# Create report directory
os.makedirs(REPORT_DIR, exist_ok=True)

# 1. Load Resources
print("Loading Model and Data...")
try:
    model = tf.keras.models.load_model(MODEL_PATH)
except Exception as e:
    print(f"Error loading model: {e}")
    exit(1)

scaler = joblib.load(SCALER_PATH)
label_encoders = joblib.load(ENCODERS_PATH)

df_full = pd.read_csv(DATA_PATH)
df = df_full.copy()

# --- Preprocessing (replicated from SHAP script) ---
print("Preprocessing data...")
if 'Projects_Handled' in df.columns and 'Work_Hours_Per_Week' in df.columns:
    df['Efficiency_Index'] = df['Projects_Handled'] / (df['Work_Hours_Per_Week'] + 1e-5)

if 'Overtime_Hours' in df.columns and 'Employee_Satisfaction_Score' in df.columns:
    max_sat = df['Employee_Satisfaction_Score'].max()
    df['Burnout_Score'] = df['Overtime_Hours'] * (1 - (df['Employee_Satisfaction_Score'] / (max_sat + 1e-5)))

if 'Hire_Date' in df.columns:
    df['Hire_Date'] = pd.to_datetime(df['Hire_Date'])
    ref_date = df['Hire_Date'].max()
    df['Tenure_Months'] = ((ref_date - df['Hire_Date']) / np.timedelta64(1, 'D') / 30.44).astype(int)
    df.drop('Hire_Date', axis=1, inplace=True)

if 'Monthly_Salary' in df.columns and 'Age' in df.columns:
    df['Salary_Age_Ratio'] = df['Monthly_Salary'] / (df['Age'] + 1e-5)

# Log transform
numeric_cols = df.select_dtypes(include=['int64', 'float64']).columns.tolist()
if 'Resigned' in numeric_cols: numeric_cols.remove('Resigned')
if 'Employee_ID' in numeric_cols: numeric_cols.remove('Employee_ID')

for c in numeric_cols:
    if skew(df[c].dropna()) > 0.75: 
        df[c] = np.log1p(df[c])

# Encoding
for col, le in label_encoders.items():
    if col in df.columns:
        df[col] = df[col].astype(str).map(lambda s: s if s in le.classes_ else str(le.classes_[0]))
        df[col] = le.transform(df[col])

# Drop non-features
df.drop(columns=[c for c in ['Employee_ID', 'Resigned'] if c in df.columns], inplace=True)

# Align with Scaler
if hasattr(scaler, 'feature_names_in_'):
    expected_features = list(scaler.feature_names_in_)
    for m in [f for f in expected_features if f not in df.columns]:
        df[m] = 0
    df_final = df[expected_features].copy()
else:
    df_final = df.copy()

# Note: We need the UNSCALED data to create the grid of values (x-axis), 
# but we need to SCALE it before passing to the model.
# So we will keep df_final as unscaled base.

# Function to calculate PDP
def plot_pdp(feature_name, save_name):
    print(f"Generating PDP for {feature_name}...")
    
    if feature_name not in df_final.columns:
        print(f"Feature {feature_name} not found.")
        return

    # Create grid
    min_val = df_final[feature_name].min()
    max_val = df_final[feature_name].max()
    
    # If categorical (few unique values), use unique values
    # If continuous, use linspace
    n_unique = df_final[feature_name].nunique()
    if n_unique < 20:
        grid = np.sort(df_final[feature_name].unique())
    else:
        grid = np.linspace(min_val, max_val, 50)
    
    pdp_means = []
    
    # We use a subset of data to calculate average marginal effect to speed up
    subset = df_final.sample(n=min(1000, len(df_final)), random_state=42).copy()
    
    for val in grid:
        temp_df = subset.copy()
        temp_df[feature_name] = val
        
        # Scale
        temp_scaled = scaler.transform(temp_df)
        
        # Predict
        preds = model.predict(temp_scaled, verbose=0).flatten()
        pdp_means.append(np.mean(preds))
        
    plt.figure(figsize=(8, 5))
    plt.plot(grid, pdp_means, marker='o', linestyle='-', color='b')
    plt.title(f'Partial Dependence Plot: {feature_name}')
    plt.xlabel(feature_name)
    plt.ylabel('Average Prediction (Churn Probability)')
    plt.grid(True, linestyle='--', alpha=0.7)
    
    # If log transformed, mention it? 
    # Actually df_final has log transformed values for skewed cols.
    # So the x-axis is in log scale if it was transformed.
    
    out_path = f"{REPORT_DIR}/{save_name}"
    plt.savefig(out_path)
    print(f"Saved {out_path}")
    plt.close()

# Generate PDPs for top features based on SHAP analysis
# 1. Employee_Satisfaction_Score (Top 1)
# 2. Overtime_Hours (Top 2)
# 3. Promotions (Top 3)
# Generate PDPs for additional features requested
# 4. Years_At_Company
# 5. Burnout_Score
top_features = ['Years_At_Company', 'Burnout_Score']
for feat in top_features:
    plot_pdp(feat, f"pdp_{feat}.png")
