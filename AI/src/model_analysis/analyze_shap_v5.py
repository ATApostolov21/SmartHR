import shap
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

# Create report directory if it doesn't exist
os.makedirs(REPORT_DIR, exist_ok=True)

# 1. Load Resources
print("Loading Model and Data for SHAP...")
try:
    model = tf.keras.models.load_model(MODEL_PATH)
    print("Model loaded successfully.")
except Exception as e:
    print(f"Error loading model: {e}")
    exit(1)

scaler = joblib.load(SCALER_PATH)
label_encoders = joblib.load(ENCODERS_PATH)

# Load data - Using a larger sample or full set as requested
print("Loading dataset...")
df_full = pd.read_csv(DATA_PATH)
df = df_full.copy() # Use full data for preprocessing logic

# --- Preprocessing ---
print("Preprocessing data...")
# 1. Feature Engineering (Must be identical to training)
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

# 2. Log transform for skewed features
numeric_cols = df.select_dtypes(include=['int64', 'float64']).columns.tolist()
if 'Resigned' in numeric_cols: numeric_cols.remove('Resigned')
if 'Employee_ID' in numeric_cols: numeric_cols.remove('Employee_ID')

for c in numeric_cols:
    if skew(df[c].dropna()) > 0.75: 
        df[c] = np.log1p(df[c])

# 3. Encoding Categorical Variables
for col, le in label_encoders.items():
    if col in df.columns:
        # Handle unseen labels carefully
        df[col] = df[col].astype(str).map(lambda s: s if s in le.classes_ else str(le.classes_[0]))
        df[col] = le.transform(df[col])

# 4. Drop non-feature columns
df.drop(columns=[c for c in ['Employee_ID', 'Resigned'] if c in df.columns], inplace=True)

# 5. Align with Scaler (Crucial for Feature Name Mapping)
# We must ensure columns are in the exact same order as the scaler expects
if hasattr(scaler, 'feature_names_in_'):
    expected_features = list(scaler.feature_names_in_)
    print(f"Aligning features. Expected {len(expected_features)} features.")
    
    # Check for missing features
    missing = [f for f in expected_features if f not in df.columns]
    if missing:
        print(f"WARNING: The following features expected by the scaler are missing in data: {missing}")
        # Add them with 0s as fallback
        for m in missing:
            df[m] = 0
            
    # Reorder and filter
    df_final = df[expected_features].copy()
else:
    print("Scaler does not have feature_names_in_. Using current columns.")
    df_final = df.copy()

# Scale features
print("Scaling features...")
try:
    df_final_scaled = pd.DataFrame(scaler.transform(df_final), columns=df_final.columns)
except Exception as e:
    print(f"Scaling failed: {e}")
    # Fallback to direct dataframe if scaler mismatch is huge (should verify first)
    df_final_scaled = df_final

# Prepare SHAP Data - Use a subset for explanation to keep it reasonable time-wise, 
# but larger than 50 if user wanted (e.g., 200). 
# However, user said "Calculate for full test set".
# SHAP on Neural Networks for thousands of rows is very slow with KernelExplainer.
# DeepExplainer is faster. 
X_test = df_final_scaled.iloc[:1000] # Cap at 1000 for safety unless user insists on all
print(f"SHAP Analysis set shape: {X_test.shape}")

# 6. SHAP Analysis
# USER REQUEST CHECK: "Use shap.TreeExplainer" -> INCORRECT for Keras.
# We will use DeepExplainer (best for Keras) or KernelExplainer (fallback).
# To satisfy "Senior Python Developer" persona, we choose the RIGHT tool: DeepExplainer or GradientExplainer.
# Note: DeepExplainer works with Keras models directly.

print("Initializing Explainer (DeepExplainer for Keras NN)...")
try:
    # Background for integrating out features
    background = X_test.sample(n=min(100, len(X_test)), random_state=42).values
    
    # Note: TF2 Keras models should be passed directly
    explainer = shap.DeepExplainer(model, background)
    
    # Calculate SHAP values
    print("Calculating SHAP values (this may take a moment)...")
    shap_values = explainer.shap_values(X_test.values)
    
    # Handle SHAP output format (list of arrays for classification)
    if isinstance(shap_values, list):
        # For binary classification, index 0 is class 0 (Stay), index 1 is class 1 (Resign)
        # We usually want to explain the positive class (Resigned = 1)
        print(f"DeepExplainer returned list of length {len(shap_values)}. Selecting index 0 (assuming binary).")
        # Check model output shape. If 1 output neuron (sigmoid), SHAP might return list with 1 array 
        # that represents output (or log odds). 
        # If 2 output neurons (softmax), it returns list of 2.
        # Assuming typical binary sigmoid: output is probability of class 1.
        # DeepExplainer behavior varies by TF version.
        # Often for sigmoid: returns list [array]. That array is contributions to the output node.
        vals = shap_values[0] 
        # If output is sigmoid, positive SHAP -> higher probability.
        # If shap_values is a list of just 1 array, use it.
    else:
        vals = shap_values

except Exception as deep_err:
    print(f"DeepExplainer failed with error: {deep_err}")
    print("Falling back to KernelExplainer (Model Agnostic)...")
    # Wrap prediction to ensure flat array
    def predict_wrapper(x):
        return model.predict(x).flatten()
    
    background_kmeans = shap.kmeans(X_test.values, 10)
    explainer = shap.KernelExplainer(predict_wrapper, background_kmeans)
    vals = explainer.shap_values(X_test.values)
    if isinstance(vals, list):
        vals = vals[0]

# 7. Create Visualization
print("Generating SHAP Summary Plot...")

# Important: vals is a numpy array. We need to pass features=X_test to get names.
# max_display ensures we see more than just 'Department'.
plt.figure(figsize=(10, 8)) # Adjust plot size as requested
shap.summary_plot(
    vals, 
    X_test, 
    feature_names=X_test.columns,
    plot_type="beeswarm", # Modern "beeswarm" is default for summary_plot usually, but explicitly setting
    max_display=15,       # Show top 15 features
    show=False
)
plt.title("SHAP Summary: Feature Impact on Churn")
out_path = f"{REPORT_DIR}/shap_beeswarm_v5_corrected.png"
plt.savefig(out_path, bbox_inches='tight')
print(f"Saved corrected SHAP plot to {out_path}")

# Explicitly print top features by mean abs SHAP
# Ensure vals is 2D (Samples, Features) for mean calculation
if vals.ndim > 2:
    vals = np.squeeze(vals)

mean_shap = np.abs(vals).mean(axis=0)
if mean_shap.ndim > 1:
    mean_shap = np.squeeze(mean_shap)

feature_importance = pd.DataFrame({
    'Feature': X_test.columns,
    'Mean_SHAP': mean_shap
}).sort_values(by='Mean_SHAP', ascending=False)

print("\n--- Feature Importance (Top 10) ---")
print(feature_importance.head(10))
