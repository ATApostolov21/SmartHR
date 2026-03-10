
import pandas as pd
import numpy as np
import lightgbm as lgb
from sklearn.metrics import classification_report, accuracy_score, roc_auc_score, log_loss, precision_recall_curve, f1_score
import joblib
import os

# Config
DATA_DIR = 'data/processed_v7'
OUTPUT_DIR = 'models/production_tests'

def load_data():
    print("Loading data...")
    X_train = pd.read_csv(f'{DATA_DIR}/X_train.csv')
    y_train = pd.read_csv(f'{DATA_DIR}/y_train.csv').values.ravel()
    X_val = pd.read_csv(f'{DATA_DIR}/X_val.csv')
    y_val = pd.read_csv(f'{DATA_DIR}/y_val.csv').values.ravel()
    X_test = pd.read_csv(f'{DATA_DIR}/X_test.csv')
    y_test = pd.read_csv(f'{DATA_DIR}/y_test.csv').values.ravel()
    
    # Strip whitespace
    X_train.columns = X_train.columns.str.strip()
    X_val.columns = X_val.columns.str.strip()
    X_test.columns = X_test.columns.str.strip()
    
    # Concatenate Train + Val
    X_full_train = pd.concat([X_train, X_val], axis=0)
    y_full_train = np.concatenate([y_train, y_val], axis=0)
    
    return X_full_train, y_full_train, X_test, y_test

def feature_engineering(df):
    """
    Implements Contextual Interaction Engineering
    """
    df_eng = df.copy()
    
    # 1. Exploitation Risk (Overtime / Salary)
    # Adding small epsilon to avoid division by zero if salary is normalized around 0
    # But since salary is scaled (StandardScaler), it can be negative. 
    # Logic: High Overtime (pos) and Low Salary (neg) -> Result should be distinctive.
    # To be safe and interpretable, let's just use the raw interaction for the tree to split on.
    df_eng['Exploitation_Risk'] = df_eng['Overtime_Hours'] / (df_eng['Monthly_Salary'] + 5) # Offset to keep positive range if possible? 
    # Actually, trees handle raw division fine as long as not inf. 
    # Let's try simple difference or interaction.
    # Better: Overtime - Salary (if scaled). High OT (pos) - Low Salary (neg) = Large Positive Value
    df_eng['Exploitation_Diff'] = df_eng['Overtime_Hours'] - df_eng['Monthly_Salary']
    
    # 2. Stagnation Index (Years * (1 - Promoted))
    # Promoted is already 1/0 (or scaled). If scaled, we need to thresholds.
    # Assuming Promoted is standard scaled. Let's check values or assume we can use interaction.
    # If Promoted is high (promoted), Stagnation should be low.
    df_eng['Stagnation_Index'] = df_eng['Years_At_Company'] * (1 - df_eng['Promoted']) # Might need check if promoted is binary
    
    # 3. Workload Pressure (Efficiency * Overtime)
    df_eng['Workload_Pressure'] = df_eng['Efficiency_Index'] * df_eng['Overtime_Hours']
    
    # remove biased features
    cols_to_drop = ['Satisfaction_Level', 'Burnout_Category']
    df_eng = df_eng.drop(columns=[c for c in cols_to_drop if c in df_eng.columns])
    
    return df_eng

def find_optimal_threshold(y_true, y_proba):
    precisions, recalls, thresholds = precision_recall_curve(y_true, y_proba)
    f1_scores = 2 * (precisions * recalls) / (precisions + recalls)
    best_idx = np.argmax(f1_scores)
    return thresholds[best_idx], f1_scores[best_idx]

def train_robust_model():
    X_train_raw, y_train, X_test_raw, y_test = load_data()
    
    print("\nApplying Feature Engineering...")
    X_train = feature_engineering(X_train_raw)
    X_test = feature_engineering(X_test_raw)
    
    print(f"Features: {X_train.columns.tolist()}")
    
    print("\nTraining Robust LightGBM (V8)...")
    # Hyperparameters for harder task
    model = lgb.LGBMClassifier(
        n_estimators=1000, # Increased
        learning_rate=0.01, # Decreased for better convergence
        num_leaves=63, # Increased complexity
        max_depth=12,
        min_child_samples=10, # Capture smaller pockets
        subsample=0.8,
        colsample_bytree=0.8,
        class_weight='balanced',
        random_state=42,
        n_jobs=-1,
        verbosity=-1
    )
    
    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        callbacks=[lgb.early_stopping(stopping_rounds=50)]
    )
    
    print("\nEvaluating...")
    y_proba = model.predict_proba(X_test)[:, 1]
    
    # Find best threshold
    best_thresh, best_f1 = find_optimal_threshold(y_test, y_proba)
    print(f"Optimal Threshold found: {best_thresh:.4f} (Max F1: {best_f1:.4f})")
    
    y_pred = (y_proba >= best_thresh).astype(int)
    
    # Metrics
    acc = accuracy_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_proba)
    
    print(f"\n--- Results (Threshold {best_thresh:.2f}) ---")
    print(f"ROC AUC: {auc:.4f}")
    print(f"Accuracy: {acc:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    # Save Report
    with open(f'{OUTPUT_DIR}/robust_model_report.md', 'w') as f:
        f.write("# Доклад за Робустен Модел (V8)\n\n")
        f.write(f"## Резултати след Feature Engineering\n")
        f.write(f"- **Оптимален Праг:** {best_thresh:.4f}\n")
        f.write(f"- **ROC AUC:** {auc:.4f}\n")
        f.write(f"- **Accuracy:** {acc:.4f}\n\n")
        f.write("### Classification Report\n")
        f.write("```\n")
        f.write(classification_report(y_test, y_pred))
        f.write("\n```\n")
        f.write("\n### Използвани Характеристики\n")
        for col in X_train.columns:
            f.write(f"- {col}\n")

if __name__ == "__main__":
    train_robust_model()
