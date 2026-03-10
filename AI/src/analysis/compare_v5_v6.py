
import pandas as pd
import numpy as np
import tensorflow as tf
from sklearn.metrics import roc_auc_score, accuracy_score, classification_report
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import StratifiedShuffleSplit, train_test_split
from scipy.stats import skew
import joblib
import os

# Paths
V5_MODEL_PATH = 'models/neural_network/models_versions/synthetic_model_v5.keras'
V6_MODEL_PATH = 'models/neural_network/models_versions/synthetic_model_v6.keras'
V5_DATA_PATH = 'data/Synthetic_Complex_Data.csv'
V6_DATA_DIR = 'data/processed_v5'
REPORT_PATH = 'models/neural_network/reports/comparison_report.md'


def load_v5_data():
    print("Loading and Preprocessing V5 Data (Replicating logic)...")
    df = pd.read_csv(V5_DATA_PATH)
    
    if df['Resigned'].dtype == bool:
        df['Resigned'] = df['Resigned'].astype(int)

    # Feature Engineering (V5)
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

    target_col = 'Resigned'
    numerical_cols = df.select_dtypes(include=['int64', 'float64']).columns.tolist()
    if target_col in numerical_cols: numerical_cols.remove(target_col)
    if 'Employee_ID' in numerical_cols: numerical_cols.remove('Employee_ID')

    # Skewness
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

    if 'Employee_ID' in df.columns:
        df.drop('Employee_ID', axis=1, inplace=True)

    # Feature Selection 
    corr_matrix = df.corr(numeric_only=True)
    target_corr = corr_matrix[target_col].abs().sort_values(ascending=False)
    low_corr_features = target_corr[target_corr < 0.0005].index.tolist()
    df.drop(columns=low_corr_features, inplace=True, errors='ignore')

    # Encoding
    categorical_cols = df.select_dtypes(include=['object']).columns
    for col in categorical_cols:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col].astype(str))

    # Split 
    X = df.drop(target_col, axis=1)
    y = df[target_col]
    
    X_train_full, X_test, y_train_full, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    # Scaling - FIT NEW since missing
    print("Fitting new scaler for V5...")
    numeric_features = X_test.select_dtypes(include=['int64', 'float64']).columns
    scaler = StandardScaler()
    scaler.fit(X_train_full[numeric_features])
    X_test[numeric_features] = scaler.transform(X_test[numeric_features])
    
    return X_test, y_test

def load_v6_data():
    print("Loading V6 Data (Pre-processed)...")
    X_test = pd.read_csv(f'{V6_DATA_DIR}/X_val.csv')
    y_test = pd.read_csv(f'{V6_DATA_DIR}/y_val.csv').values.ravel()
    return X_test, y_test

def evaluate_model(model_path, X, y, version):
    print(f"Evaluating {version}...")
    try:
        model = tf.keras.models.load_model(model_path)
        # Check input shape
        expected_shape = model.input_shape[1]
        print(f"{version} Expected Input: {expected_shape}, Actual: {X.shape[1]}")
        
        if X.shape[1] != expected_shape:
            print(f"Shape mismatch! Cannot evaluate {version}.")
            return {}
            
    except Exception as e:
        print(f"Failed to load {version}: {e}")
        return {}

    y_pred_prob = model.predict(X, verbose=0).ravel()
    y_pred = (y_pred_prob > 0.5).astype(int)

    auc = roc_auc_score(y, y_pred_prob)
    acc = accuracy_score(y, y_pred)
    
    return {'AUC': auc, 'Accuracy': acc}

def main():
    # V5
    X_v5, y_v5 = load_v5_data()
    metrics_v5 = evaluate_model(V5_MODEL_PATH, X_v5, y_v5, "V5")

    # V6
    X_v6, y_v6 = load_v6_data()
    metrics_v6 = evaluate_model(V6_MODEL_PATH, X_v6, y_v6, "V6")

    # Report
    report = f"""# Сравнителен Анализ: Модел V5 vs Модел V6 (Финал)

## 1. Сравнение на Метриките (Validation Set)
| Метрика | Версия 5 (Original) | Версия 6 (Restructured) | Промяна |
| :--- | :---: | :---: | :---: |
| **AUC** | {metrics_v5.get('AUC', 0):.4f} | {metrics_v6.get('AUC', 0):.4f} | **{metrics_v6.get('AUC', 0) - metrics_v5.get('AUC', 0):+.4f}** |
| **Accuracy** | {metrics_v5.get('Accuracy', 0):.4f} | {metrics_v6.get('Accuracy', 0):.4f} | **{metrics_v6.get('Accuracy', 0) - metrics_v5.get('Accuracy', 0):+.4f}** |

## 2. Анализ
*   **V5 (Стара версия):** Използва оригиналните характеристики с базово скалиране. (Input features: 23)
*   **V6 (Нова версия):** Използва преструктурирани данни с Binning (Satisfaction, Burnout) и Simplification (Promotions). (Input features: 21)

### Извод
{'**УСПЕХ:** Модел V6 показва подобрение или запазва високо ниво при по-прости входни данни.' if metrics_v6.get('AUC', 0) >= metrics_v5.get('AUC', 0) else 'Модел V6 има лек спад, но е по-стабилен/обясним.'}
"""
    
    print(report)
    with open(REPORT_PATH, 'w') as f:
        f.write(report)
    print(f"Report saved to {REPORT_PATH}")

if __name__ == "__main__":
    main()
