import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout, BatchNormalization, Input
from tensorflow.keras.optimizers import Adam, SGD
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
from sklearn.utils import class_weight
from sklearn.model_selection import StratifiedShuffleSplit, train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from scipy.stats import skew
import joblib
import os

# --- Configuration ---
DATA_PATH = 'data/Synthetic_Logic_Data.csv'
MODEL_SAVE_PATH = 'models/neural_network/synthetic_model_v4.keras'
SCALER_PATH = 'models/neural_network/models_versions/v4/scaler_v4.joblib'
ENCODERS_PATH = 'models/neural_network/models_versions/v4/encoders_v4.joblib'
REPORT_DIR = 'models/neural_network/reports/report_v4_synthetic'
os.makedirs(REPORT_DIR, exist_ok=True)

# 1. Load Data
print(f"Loading data from: {DATA_PATH}")
if not os.path.exists(DATA_PATH):
    raise FileNotFoundError(f"Data file not found: {DATA_PATH}")

df = pd.read_csv(DATA_PATH)

# 2. Data Preprocessing (Replicating Notebook Logic)
if df['Resigned'].dtype == bool:
    df['Resigned'] = df['Resigned'].astype(int)

# Feature Engineering
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

# Skewness Handling
target_col = 'Resigned'
numerical_cols = df.select_dtypes(include=['int64', 'float64']).columns.tolist()
if target_col in numerical_cols: numerical_cols.remove(target_col)
if 'Employee_ID' in numerical_cols: numerical_cols.remove('Employee_ID')

skew_vals = df[numerical_cols].apply(lambda x: skew(x.dropna()))
high_skew_cols = skew_vals[abs(skew_vals) > 0.75].index

for col in high_skew_cols:
    if (df[col] >= 0).all():
        df[col] = np.log1p(df[col])
    else:
        df[col] = np.log1p(df[col] - df[col].min() + 1)

# Outlier Handling
def winsorize_column(series, limits=[0.01, 0.01]):
    return series.clip(lower=series.quantile(limits[0]), upper=series.quantile(1-limits[1]))

for col in numerical_cols:
    df[col] = winsorize_column(df[col])

# Drop irrelevant
df.drop_duplicates(inplace=True)
if 'Employee_ID' in df.columns:
    df.drop('Employee_ID', axis=1, inplace=True)

# Encoding
categorical_cols = df.select_dtypes(include=['object']).columns
label_encoders = {}
for col in categorical_cols:
    le = LabelEncoder()
    df[col] = le.fit_transform(df[col].astype(str))
    label_encoders[col] = le
    
# Save Encoders
joblib.dump(label_encoders, ENCODERS_PATH)
print(f"LabelEncoders saved to {ENCODERS_PATH}")

# Feature Selection (Correlation)
print("\n--- Feature Selection ---")
corr_matrix = df.corr()
target_corr = corr_matrix[target_col].abs().sort_values(ascending=False)
print("Top correlations:")
print(target_corr.head(10))

# V3 Logic: Drop very low correlation features
low_corr_features = target_corr[target_corr < 0.001].index.tolist()
print(f"Dropping features: {low_corr_features}")
df.drop(columns=low_corr_features, inplace=True)

# Split
X = df.drop(target_col, axis=1)
y = df[target_col]

split = StratifiedShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
for train_index, test_index in split.split(X, y):
    X_train, X_temp = X.iloc[train_index], X.iloc[test_index]
    y_train, y_temp = y.iloc[train_index], y.iloc[test_index]

# Scaling
numeric_features = X_train.select_dtypes(include=['int64', 'float64']).columns
scaler = StandardScaler()
X_train[numeric_features] = scaler.fit_transform(X_train[numeric_features])
X_temp[numeric_features] = scaler.transform(X_temp[numeric_features])

# Save Scaler
joblib.dump(scaler, SCALER_PATH)
print(f"Scaler saved to {SCALER_PATH}")

# Val/Test Split
X_val, X_test, y_val, y_test = train_test_split(
    X_temp, y_temp, test_size=0.5, random_state=42, stratify=y_temp
)

# Class Weights
weights = class_weight.compute_class_weight(
    class_weight='balanced',
    classes=np.unique(y_train),
    y=y_train
)
class_weights = dict(enumerate(weights))
print(f"Class Weights: {class_weights}")

# 3. Model Architecture (V3)
def build_model(input_dim):
    model = Sequential([
        Input(shape=(input_dim,)),
        Dense(128, activation='relu'),
        BatchNormalization(),
        Dropout(0.5),
        Dense(64, activation='relu'),
        BatchNormalization(),
        Dropout(0.3),
        Dense(1, activation='sigmoid')
    ])
    model.compile(
        optimizer=SGD(learning_rate=0.01, momentum=0.9),
        loss='binary_crossentropy',
        metrics=['accuracy', tf.keras.metrics.AUC(name='auc')]
    )
    return model

model = build_model(X_train.shape[1])
model.summary()

# 4. Training
callbacks = [
    ReduceLROnPlateau(monitor='val_auc', mode='max', factor=0.5, patience=5, min_lr=0.00001, verbose=1),
    EarlyStopping(monitor='val_auc', mode='max', patience=10, restore_best_weights=True)
]

print("\nStarting Training...")
history = model.fit(
    X_train, y_train,
    validation_data=(X_val, y_val),
    epochs=30, # Reduced epochs for speed, typically converges fast on synthetic
    batch_size=64,
    class_weight=class_weights,
    callbacks=callbacks,
    verbose=1
)

# 5. Evaluation & Saving
print("\n--- Evaluation ---")
val_loss, val_acc, val_auc = model.evaluate(X_val, y_val)
print(f"Validation AUC: {val_auc:.4f}")

model.save(MODEL_SAVE_PATH)
print(f"Model saved to {MODEL_SAVE_PATH}")

# Save Training History Plot
plt.figure(figsize=(12, 4))
plt.subplot(1, 2, 1)
plt.plot(history.history['auc'], label='Train AUC')
plt.plot(history.history['val_auc'], label='Val AUC')
plt.legend()
plt.title('AUC History')

plt.subplot(1, 2, 2)
plt.plot(history.history['loss'], label='Train Loss')
plt.plot(history.history['val_loss'], label='Val Loss')
plt.legend()
plt.title('Loss History')

plt.tight_layout()
plt.savefig(f"{REPORT_DIR}/training_history.png")
print(f"History plot saved to {REPORT_DIR}/training_history.png")

# --- Additional Visualizations ---

# Predictions
y_pred_prob = model.predict(X_val)
y_pred = (y_pred_prob > 0.5).astype(int)

# 1. Confusion Matrix
cm = confusion_matrix(y_val, y_pred)
plt.figure(figsize=(8, 6))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', cbar=False)
plt.xlabel('Predicted Label')
plt.ylabel('True Label')
plt.title('Confusion Matrix (Validation Set)')
plt.savefig(f"{REPORT_DIR}/confusion_matrix.png")
print(f"Confusion Matrix saved to {REPORT_DIR}/confusion_matrix.png")

# 2. ROC Curve
from sklearn.metrics import roc_curve
fpr, tpr, thresholds = roc_curve(y_val, y_pred_prob)
plt.figure(figsize=(8, 6))
plt.plot(fpr, tpr, label=f'AUC = {val_auc:.4f}')
plt.plot([0, 1], [0, 1], 'k--')
plt.xlabel('False Positive Rate')
plt.ylabel('True Positive Rate')
plt.title('ROC Curve')
plt.legend()
plt.savefig(f"{REPORT_DIR}/roc_curve.png")
print(f"ROC Curve saved to {REPORT_DIR}/roc_curve.png")
