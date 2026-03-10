
import pandas as pd
import numpy as np
import lightgbm as lgb
from sklearn.metrics import classification_report, roc_auc_score, precision_recall_curve
import os

# Config
DATA_DIR = 'data/processed_v9'
REPORT_PATH = 'reports/experiments/v9_causal_report_scaled.md'

def load_data():
    print("Loading Scaled V9 Data from processed_v9...")
    X_train = pd.read_csv(f'{DATA_DIR}/X_train.csv')
    y_train = pd.read_csv(f'{DATA_DIR}/y_train.csv').values.ravel()
    X_test = pd.read_csv(f'{DATA_DIR}/X_test.csv')
    y_test = pd.read_csv(f'{DATA_DIR}/y_test.csv').values.ravel()
    
    # Preprocess encode cats
    cat_cols = ['Department', 'Gender', 'Job_Title', 'Education_Level']
    for col in cat_cols:
        X_train[col] = X_train[col].astype('category')
        X_test[col] = X_test[col].astype('category')
        
    # Drop IDs if present
    if 'Employee_ID' in X_train.columns:
        X_train = X_train.drop(columns=['Employee_ID', 'Hire_Date'])
        X_test = X_test.drop(columns=['Employee_ID', 'Hire_Date'])
        
    return X_train, y_train, X_test, y_test

def train_model(X_train, y_train, X_test, y_test, feature_set_name="Full"):
    print(f"\nTraining Model: {feature_set_name}...")
    
    model = lgb.LGBMClassifier(
        n_estimators=1000,
        learning_rate=0.03,
        num_leaves=40,
        class_weight='balanced',
        random_state=42,
        verbosity=-1
    )
    
    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        callbacks=[lgb.early_stopping(stopping_rounds=50)]
    )
    
    y_proba = model.predict_proba(X_test)[:, 1]
    auc = roc_auc_score(y_test, y_proba)
    
    # Best Threshold
    precisions, recalls, thresholds = precision_recall_curve(y_test, y_proba)
    f1_scores = 2 * (precisions * recalls) / (precisions + recalls)
    best_idx = np.argmax(f1_scores)
    best_thresh = thresholds[best_idx]
    
    y_pred = (y_proba >= best_thresh).astype(int)
    
    print(f"ROC AUC: {auc:.4f}")
    print(classification_report(y_test, y_pred))
    
    return model, auc, best_thresh, classification_report(y_test, y_pred, output_dict=True)

def generate_report(results):
    with open(REPORT_PATH, 'w') as f:
        f.write("# V9 Causal Model Report (Scaled 200k)\n\n")
        f.write("## Overview\n")
        f.write("Trained on 200,000 samples to verify scalability and production readiness.\n\n")
        
        f.write("| Model Variant | ROC AUC | Recall (Churn) | Precision (Churn) |\n")
        f.write("| :--- | :---: | :---: | :---: |\n")
        
        for name, res in results.items():
            metrics = res['report']['True']
            f.write(f"| **{name}** | {res['auc']:.4f} | {metrics['recall']:.2f} | {metrics['precision']:.2f} |\n")
            
        f.write("\n## Conclusion\n")
        drop = results['With Satisfaction']['auc'] - results['Without Satisfaction']['auc']
        f.write(f"AUC Drop when removing Satisfaction: **{drop:.4f}**\n")

if __name__ == "__main__":
    X_train, y_train, X_test, y_test = load_data()
    
    results = {}
    
    # 1. With Satisfaction
    model_sat, auc_sat, thresh_sat, report_sat = train_model(X_train, y_train, X_test, y_test, "With Satisfaction")
    results['With Satisfaction'] = {'auc': auc_sat, 'report': report_sat}
    
    # 2. Without Satisfaction
    X_train_no = X_train.drop(columns=['Employee_Satisfaction_Score'])
    X_test_no = X_test.drop(columns=['Employee_Satisfaction_Score'])
    
    model_no, auc_no, thresh_no, report_no = train_model(X_train_no, y_train, X_test_no, y_test, "Without Satisfaction")
    results['Without Satisfaction'] = {'auc': auc_no, 'report': report_no}
    
    # Save the robust model for production/validation
    print("Saving V9 (Without Satisfaction) model...")
    model_no.booster_.save_model('models/production/v9_causal.txt')
    
    generate_report(results)
    print(f"\nReport saved to {REPORT_PATH}")
