import pandas as pd
import numpy as np
import tensorflow as tf
from sklearn.metrics import classification_report, roc_auc_score, confusion_matrix
import joblib
import os
from scipy.stats import skew

# --- Configuration ---
TEST_DATA_PATH = 'data/Unseen_Synthetic_Data.csv'
MODEL_PATH = 'models/neural_network/synthetic_model_v4.keras'
SCALER_PATH = 'models/neural_network/models_versions/v4/scaler_v4.joblib'
ENCODERS_PATH = 'models/neural_network/models_versions/v4/encoders_v4.joblib'

print("Title: Deployment Readiness Test on Unseen Data")

# 1. Load Artifacts
print("Loading model and artifacts...")
model = tf.keras.models.load_model(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)
label_encoders = joblib.load(ENCODERS_PATH)

# 2. Load Unseen Data
print(f"Loading unseen data from: {TEST_DATA_PATH}")
df = pd.read_csv(TEST_DATA_PATH)
y_true = df['Resigned'].astype(int)

# 3. Preprocessing (Must match Training Logic exactly)
# Basic features
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

# Skewness
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

# Outliers
def winsorize_column(series, limits=[0.01, 0.01]):
    return series.clip(lower=series.quantile(limits[0]), upper=series.quantile(1-limits[1]))

for col in numerical_cols:
    df[col] = winsorize_column(df[col])

# Drop irrelevant
if 'Employee_ID' in df.columns:
    df.drop('Employee_ID', axis=1, inplace=True)

# Encoding (Use Loaded Encoders)
for col, le in label_encoders.items():
    if col in df.columns:
        # Handle unknown labels gracefully (though unlikely in synthetic)
        df[col] = df[col].astype(str).map(lambda s: s if s in le.classes_ else 'Unknown')
        # Simple workaround: Assign mode or specific value if unknown. 
        # For this test, we assume test data matches classes.
        df[col] = le.transform(df[col])

# Feature Selection (Drop same columns as training)
# Hardcoded based on training script output log. Ideally this list is also saved.
# From log: Dropping features: ['Work_Hours_Per_Week', 'Education_Level', 'Efficiency_Index', 'Department', 'Remote_Work_Frequency']
cols_to_drop = ['Work_Hours_Per_Week', 'Education_Level', 'Efficiency_Index', 'Department', 'Remote_Work_Frequency']
existing_cols_to_drop = [c for c in cols_to_drop if c in df.columns]
df.drop(columns=existing_cols_to_drop, inplace=True)

# Prepare X
X_test = df.drop('Resigned', axis=1)

# Scaling (Use Loaded Scaler)
# Ensure columns match scaler expectations
numeric_features = X_test.select_dtypes(include=['int64', 'float64']).columns
X_test[numeric_features] = scaler.transform(X_test[numeric_features])

# 4. Predict
print("Running predictions...")
y_pred_prob = model.predict(X_test)
y_pred = (y_pred_prob > 0.5).astype(int)

# 5. Metrics
auc = roc_auc_score(y_true, y_pred_prob)
report = classification_report(y_true, y_pred)
cm = confusion_matrix(y_true, y_pred)

print("\n--- RESULTS ---")
print(f"AUC Score: {auc:.4f}")
print("\nConfusion Matrix:")
print(cm)
print("\nClassification Report:")
print(report)

if auc > 0.95:
    print("\nCONCLUSION: Model V4 is READY for deployment on this data profile.")
else:
    print("\nCONCLUSION: Model V4 shows degradation on unseen data.")
