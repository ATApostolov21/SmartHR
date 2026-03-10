import pandas as pd
import numpy as np
import tensorflow as tf
from sklearn.metrics import roc_auc_score
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
import os
from scipy.stats import skew

# --- Configuration ---
TEST_DATA_PATH = 'data/Unseen_Synthetic_Data.csv'
MODEL_PATH = 'models/neural_network/synthetic_model_v4.keras'
SCALER_PATH = 'models/neural_network/models_versions/v4/scaler_v4.joblib'
ENCODERS_PATH = 'models/neural_network/models_versions/v4/encoders_v4.joblib'
REPORT_DIR = 'models/neural_network/reports/report_v4_synthetic'

print("Title: Feature Importance Analysis (Permutation Importance)")

# 1. Load Artifacts
model = tf.keras.models.load_model(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)
label_encoders = joblib.load(ENCODERS_PATH)

# 2. Load Data
df = pd.read_csv(TEST_DATA_PATH)
y_true = df['Resigned'].astype(int)

# 3. Preprocessing (Exact Match)
if 'Projects_Handled' in df.columns and 'Work_Hours_Per_Week' in df.columns:
    df['Efficiency_Index'] = df['Projects_Handled'] / df['Work_Hours_Per_Week']

if 'Overtime_Hours' in df.columns and 'Employee_Satisfaction_Score' in df.columns:
    max_sat = df['Employee_Satisfaction_Score'].max()
    df['Burnout_Score'] = df['Overtime_Hours'] * (1 - (df['Employee_Satisfaction_Score'] / max_sat))

if 'Hire_Date' in df.columns:
    df['Hire_Date'] = pd.to_datetime(df['Hire_Date'])
    ref_date = df['Hire_Date'].max()
    df['Tenure_Months'] = ((ref_date - df['Hire_Date']) / np.timedelta64(1, 'D') / 30.44).astype(int)
    df.drop('Hire_Date', axis=1, inplace=True)

if 'Monthly_Salary' in df.columns and 'Age' in df.columns:
    df['Salary_Age_Ratio'] = df['Monthly_Salary'] / df['Age']

numerical_cols = df.select_dtypes(include=['int64', 'float64']).columns.tolist()
if 'Resigned' in numerical_cols: numerical_cols.remove('Resigned')
if 'Employee_ID' in numerical_cols: numerical_cols.remove('Employee_ID')

skew_vals = df[numerical_cols].apply(lambda x: skew(x.dropna()))
high_skew_cols = skew_vals[abs(skew_vals) > 0.75].index

for col in high_skew_cols:
    if (df[col] >= 0).all():
        df[col] = np.log1p(df[col])
    else:
        df[col] = np.log1p(df[col] - df[col].min() + 1)

def winsorize_column(series, limits=[0.01, 0.01]):
    return series.clip(lower=series.quantile(limits[0]), upper=series.quantile(1-limits[1]))

for col in numerical_cols:
    df[col] = winsorize_column(df[col])

if 'Employee_ID' in df.columns:
    df.drop('Employee_ID', axis=1, inplace=True)

for col, le in label_encoders.items():
    if col in df.columns:
        df[col] = df[col].astype(str).map(lambda s: s if s in le.classes_ else 'Unknown')
        df[col] = le.transform(df[col])

cols_to_drop = ['Work_Hours_Per_Week', 'Education_Level', 'Efficiency_Index', 'Department', 'Remote_Work_Frequency']
existing_cols_to_drop = [c for c in cols_to_drop if c in df.columns]
df.drop(columns=existing_cols_to_drop, inplace=True)

X_test = df.drop('Resigned', axis=1)
feature_names = X_test.columns.tolist()

# Scaling
numeric_features = X_test.select_dtypes(include=['int64', 'float64']).columns
X_test[numeric_features] = scaler.transform(X_test[numeric_features])

# Convert to numpy for shuffling
X_val_np = X_test.values

# 4. Baseline Performance
print("Calculating Baseline AUC...")
baseline_pred = model.predict(X_val_np, verbose=0)
baseline_auc = roc_auc_score(y_true, baseline_pred)
print(f"Baseline AUC: {baseline_auc:.4f}")

# 5. Permutation Importance
importances = {}
print("\nCalculating Permutation Importance (Scrambling features)...")

for i, col_name in enumerate(feature_names):
    # Save original column
    original_col = X_val_np[:, i].copy()
    
    # Shuffle column
    np.random.shuffle(X_val_np[:, i])
    
    # Predict
    shuffled_pred = model.predict(X_val_np, verbose=0)
    shuffled_auc = roc_auc_score(y_true, shuffled_pred)
    
    # Calculate Drop
    importance = baseline_auc - shuffled_auc
    importances[col_name] = importance
    
    # Restore column
    X_val_np[:, i] = original_col
    
    print(f"Feature: {col_name:<25} | AUC Drop: {importance:.4f}")

# 6. Visualize
importance_df = pd.DataFrame(list(importances.items()), columns=['Feature', 'Importance'])
importance_df = importance_df.sort_values(by='Importance', ascending=False)

plt.figure(figsize=(10, 8))
sns.barplot(x='Importance', y='Feature', data=importance_df, palette='viridis')
plt.title('V4 Model Feature Importance (Permutation Method)\nHigher = More Important')
plt.xlabel('Drop in AUC Score')
plt.tight_layout()
plt.savefig(f"{REPORT_DIR}/feature_importance.png")
print(f"\nFeature Importance plot saved to {REPORT_DIR}/feature_importance.png")

# 7. Validation Logic Check
print("\n--- Logic Validation ---")
print("Top 3 Model Drivers:")
print(importance_df.head(3))

print("\nGround Truth Logic (Injected):")
print("1. Satisfaction (Employee_Satisfaction_Score)")
print("2. Overtime (Overtime_Hours)")
print("3. Salary/Performance (Monthly_Salary, Performance_Score)")

top_features = importance_df['Feature'].head(5).tolist()
if 'Burnout_Score' in top_features or 'Employee_Satisfaction_Score' in top_features:
    print("\nSUCCESS: Model correctly identified Satisfaction/Burnout as key drivers.")
else:
    print("\nWARNING: Model missed the primary drivers.")
