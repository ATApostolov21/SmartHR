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
# We use the COMPLEX data for validation here
DATA_PATH = 'data/Synthetic_Complex_Data.csv' 
MODEL_PATH = 'models/neural_network/models_versions/synthetic_model_v5.keras'
SCALER_PATH = 'models/neural_network/scaler_v5.joblib'
ENCODERS_PATH = 'models/neural_network/encoders_v5.joblib'
REPORT_DIR = 'models/neural_network/reports/report_v5_complex'

# 1. Load Model & Artifacts
print("Loading V5 Model...")
model = tf.keras.models.load_model(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)
label_encoders = joblib.load(ENCODERS_PATH)

# 2. Load Data Sample
df = pd.read_csv(DATA_PATH).sample(n=10000, random_state=42) # Faster eval
y_true = df['Resigned'].astype(int)

# 3. Preprocessing (Standard V5 Logic)
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

# Feature Selection - Align with Training via Scaler
# The scaler knows exactly which numeric features it trained on.
# However, the model input includes categorical too.
# Keras model doesn't store feature names easily, but we can verify dimension.

numeric_features_in_scaler = scaler.feature_names_in_
print(f"Scaler expects features: {list(numeric_features_in_scaler)}")

# We need to drop columns from df that are NOT in the model's expected input.
# Since we don't have the model's feature list saved, we have to infer.
# Any numeric feature NOT in scaler must be dropped.
# Any categorical feature... well, if the model shape is 19, we have to match 19.

# Identify numeric cols in df
current_numeric = df.select_dtypes(include=['int64', 'float64']).columns.tolist()

# Drop numeric cols not in scaler
cols_to_drop = [c for c in current_numeric if c not in numeric_features_in_scaler]
print(f"Dropping numeric features not in scaler: {cols_to_drop}")
df.drop(columns=cols_to_drop, inplace=True)

# Now, dealing with categorical. If training dropped them, we should too.
# But we don't know for sure.
# Let's verify shape.
X_test = df.drop('Resigned', axis=1)
print(f"Current shape: {X_test.shape}")

# Emergency truncation if still mismatch
if X_test.shape[1] > 19: # 19 was the error message specific count? No, wait. 
    # The previous error didn't specify model input dimension match error, 
    # it was SCALER error. 
    # So if we fix scaler, we might be good for model too (assuming model takes what scaler outputs + encoded cats).
    pass

feature_names = X_test.columns.tolist()

# Scaling
# Now this should work because we filtered X_test to match scaler expectations for numeric
# But wait, scaler.transform expects ONLY numeric columns if we fitted it on ONLY numeric columns.
# Training script: X_train[numeric_features] = scaler.fit_transform(X_train[numeric_features])
# So scaler only knows numeric.
numeric_features = X_test.select_dtypes(include=['int64', 'float64']).columns
X_test[numeric_features] = scaler.transform(X_test[numeric_features])
X_val_np = X_test.values

# 4. Permutation Importance
print("Calculating Permutation Importance...")
baseline_pred = model.predict(X_val_np, verbose=0)
baseline_auc = roc_auc_score(y_true, baseline_pred)
print(f"Baseline AUC: {baseline_auc:.4f}")

importances = {}
for i, col_name in enumerate(feature_names):
    original_col = X_val_np[:, i].copy()
    np.random.shuffle(X_val_np[:, i])
    shuffled_pred = model.predict(X_val_np, verbose=0)
    shuffled_auc = roc_auc_score(y_true, shuffled_pred)
    importance = baseline_auc - shuffled_auc
    importances[col_name] = importance
    X_val_np[:, i] = original_col # Restore

# 5. Plot
importance_df = pd.DataFrame(list(importances.items()), columns=['Feature', 'Importance'])
importance_df = importance_df.sort_values(by='Importance', ascending=False)

plt.figure(figsize=(10, 8))
sns.barplot(x='Importance', y='Feature', data=importance_df, palette='magma')
plt.title('V5 Complex Model Feature Importance')
plt.xlabel('Impact on AUC (Drop)')
plt.tight_layout()
plt.savefig(f"{REPORT_DIR}/complex_feature_importance.png")
print(f"Plot saved to {REPORT_DIR}/complex_feature_importance.png")
print("Top Features:")
print(importance_df.head(8))
