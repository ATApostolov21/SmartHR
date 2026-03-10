"""
V9 Artifact Generation Script

Генерира scaler_v9.joblib и encoders_v9.joblib от оригиналните v9 тренировъчни данни.
Гарантира съвместимост между preprocessor.py и v9_causal модела.

"""

import pandas as pd
import numpy as np
import joblib
import os
from sklearn.preprocessing import StandardScaler, LabelEncoder
from pathlib import Path

# Paths
DATA_DIR = 'AI/data/processed_v9'
OUTPUT_DIR = 'AI/production'
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Expected features (без Employee_Satisfaction_Score, както е в v9_causal)
FEATURE_COLUMNS = [
    'Department', 'Gender', 'Age', 'Job_Title', 'Years_At_Company',
    'Education_Level', 'Performance_Score', 'Monthly_Salary',
    'Work_Hours_Per_Week', 'Projects_Handled', 'Overtime_Hours',
    'Sick_Days', 'Remote_Work_Frequency', 'Team_Size',
    'Training_Hours', 'Promotions'
]

CATEGORICAL_COLUMNS = ['Department', 'Gender', 'Job_Title', 'Education_Level']
NUMERICAL_COLUMNS = [col for col in FEATURE_COLUMNS if col not in CATEGORICAL_COLUMNS]

def load_training_data():
    """Зарежда v9 тренировъчни данни"""
    print("Loading V9 training data...")
    X_train = pd.read_csv(f'{DATA_DIR}/X_train.csv')
    
    # Drop columns not used in v9_causal model
    columns_to_drop = ['Employee_ID', 'Hire_Date', 'Employee_Satisfaction_Score']
    for col in columns_to_drop:
        if col in X_train.columns:
            X_train = X_train.drop(columns=[col])
    
    # Ensure correct column order
    X_train = X_train[FEATURE_COLUMNS]
    
    print(f"✓ Loaded {len(X_train)} training samples")
    print(f"✓ Features: {list(X_train.columns)}")
    
    return X_train

def generate_label_encoders(X_train):
    """
    Генерира LabelEncoder за всяка категориална колона.
    
    Returns:
        dict: {column_name: fitted_LabelEncoder}
    """
    print("\nGenerating Label Encoders...")
    encoders = {}
    
    for col in CATEGORICAL_COLUMNS:
        le = LabelEncoder()
        le.fit(X_train[col].astype(str))  # Ensure string type
        encoders[col] = le
        
        print(f"  ✓ {col}: {len(le.classes_)} classes")
        print(f"    Classes: {list(le.classes_)}")
    
    return encoders

def generate_scaler(X_train, encoders):
    """
    Генерира StandardScaler за числови колони.
    Важно: Категориалните колони вече трябва да са кодирани преди scaling!
    
    Note: За v9_causal, LightGBM използва категориални типове директно,
    така че този scaler е backup за случаи, когато preprocessor работи
    с други модели или за нормализация на числови колони.
    
    Returns:
        StandardScaler: fitted scaler
    """
    print("\nGenerating StandardScaler...")
    
    # Create copy and encode categorical columns
    X_encoded = X_train.copy()
    for col in CATEGORICAL_COLUMNS:
        X_encoded[col] = encoders[col].transform(X_encoded[col].astype(str))
    
    # Fit scaler on all features (numerical + encoded categorical)
    scaler = StandardScaler()
    scaler.fit(X_encoded)
    
    print(f"  ✓ Fitted on {X_encoded.shape[1]} features")
    print(f"  ✓ Mean: {scaler.mean_[:3]}... (first 3)")
    print(f"  ✓ Scale: {scaler.scale_[:3]}... (first 3)")
    
    return scaler

def compute_imputation_values(X_train):
    """
    Изчислява default стойности за imputation от тренировъчните данни.
    
    Returns:
        dict: {column_name: default_value}
    """
    print("\nComputing Imputation Values...")
    imputation_values = {}
    
    # Numerical columns: use median
    for col in NUMERICAL_COLUMNS:
        median_val = X_train[col].median()
        imputation_values[col] = median_val
        print(f"  ✓ {col}: median = {median_val}")
    
    # Categorical columns: most frequent class
    for col in CATEGORICAL_COLUMNS:
        mode_val = X_train[col].mode()[0]
        imputation_values[col] = mode_val
        print(f"  ✓ {col}: mode = '{mode_val}'")
    
    return imputation_values

def save_artifacts(encoders, scaler, imputation_values):
    """Записва артефактите на диск"""
    print("\n" + "="*60)
    print("SAVING ARTIFACTS")
    print("="*60)
    
    # Save encoders
    encoders_path = os.path.join(OUTPUT_DIR, 'encoders_v9.joblib')
    joblib.dump(encoders, encoders_path)
    print(f"✓ Saved encoders to: {encoders_path}")
    print(f"  Size: {Path(encoders_path).stat().st_size / 1024:.2f} KB")
    
    # Save scaler
    scaler_path = os.path.join(OUTPUT_DIR, 'scaler_v9.joblib')
    joblib.dump(scaler, scaler_path)
    print(f"✓ Saved scaler to: {scaler_path}")
    print(f"  Size: {Path(scaler_path).stat().st_size / 1024:.2f} KB")
    
    # Save imputation values
    imputation_path = os.path.join(OUTPUT_DIR, 'imputation_defaults_v9.joblib')
    joblib.dump(imputation_values, imputation_path)
    print(f"✓ Saved imputation defaults to: {imputation_path}")
    print(f"  Size: {Path(imputation_path).stat().st_size / 1024:.2f} KB")
    
    print("\n" + "="*60)
    print("ARTIFACT GENERATION COMPLETE")
    print("="*60)
    print("\nNext Steps:")
    print("1. Verify artifacts with: python -c \"import joblib; print(joblib.load('AI/production/encoders_v9.joblib'))\"")
    print("2. Integrate with preprocessor.py")
    print("3. Test inference pipeline")

def main():
    print("="*60)
    print("V9 ARTIFACT GENERATION SCRIPT")
    print("="*60)
    print("Purpose: Generate scaler_v9.joblib and encoders_v9.joblib")
    print("         for seamless integration with v9_causal model")
    print("="*60 + "\n")
    
    # Load training data
    X_train = load_training_data()
    
    # Generate encoders
    encoders = generate_label_encoders(X_train)
    
    # Generate scaler
    scaler = generate_scaler(X_train, encoders)
    
    # Compute imputation values
    imputation_values = compute_imputation_values(X_train)
    
    # Save everything
    save_artifacts(encoders, scaler, imputation_values)

if __name__ == "__main__":
    main()
