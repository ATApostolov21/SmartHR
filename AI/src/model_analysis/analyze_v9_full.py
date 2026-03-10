
import pandas as pd
import numpy as np
import lightgbm as lgb
import shap
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import classification_report, roc_auc_score, roc_curve, precision_recall_curve, confusion_matrix, accuracy_score
import os

# Config
DATA_DIR = 'data/processed_v9'
OUTPUT_DIR = 'models/ensemble_comparison/report_v9_causal'
os.makedirs(OUTPUT_DIR, exist_ok=True)

def load_data():
    print("Loading Data...")
    X_train = pd.read_csv(f'{DATA_DIR}/X_train.csv')
    y_train = pd.read_csv(f'{DATA_DIR}/y_train.csv').values.ravel()
    X_test = pd.read_csv(f'{DATA_DIR}/X_test.csv')
    y_test = pd.read_csv(f'{DATA_DIR}/y_test.csv').values.ravel()
    
    # Preprocess encode cats
    cat_cols = ['Department', 'Gender', 'Job_Title', 'Education_Level']
    for col in cat_cols:
        X_train[col] = X_train[col].astype('category')
        X_test[col] = X_test[col].astype('category')
        
    if 'Employee_ID' in X_train.columns:
        X_train = X_train.drop(columns=['Employee_ID', 'Hire_Date'])
        X_test = X_test.drop(columns=['Employee_ID', 'Hire_Date'])
        
    return X_train, y_train, X_test, y_test

def train_and_explain(X_train, y_train, X_test, y_test, name="Model"):
    print(f"\n--- Analyzing {name} ---")
    
    # Train
    model = lgb.LGBMClassifier(
        n_estimators=600,
        learning_rate=0.03,
        num_leaves=40,
        class_weight='balanced',
        random_state=42,
        verbosity=-1
    )
    
    model.fit(X_train, y_train)
    
    # Predict
    y_proba = model.predict_proba(X_test)[:, 1]
    y_pred = (y_proba >= 0.5).astype(int)
    
    # Metrics
    auc = roc_auc_score(y_test, y_proba)
    acc = accuracy_score(y_test, y_pred)
    
    print(f"AUC: {auc:.4f}")
    
    # 1. Confusion Matrix
    cm = confusion_matrix(y_test, y_pred)
    plt.figure(figsize=(6, 5))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', cbar=False)
    plt.title(f'Confusion Matrix ({name})')
    plt.ylabel('Actual')
    plt.xlabel('Predicted')
    plt.savefig(f'{OUTPUT_DIR}/confusion_matrix_{name.replace(" ", "_")}.png')
    plt.close()
    
    # 1.5 Feature Importance (Standard)
    if name == "Without Satisfaction":
        plt.figure(figsize=(10, 6))
        lgb.plot_importance(model, max_num_features=15, importance_type='gain', figsize=(10, 8))
        plt.title(f'Feature Importance (Gain) - {name}')
        plt.tight_layout()
        plt.savefig(f'{OUTPUT_DIR}/feature_importance_{name.replace(" ", "_")}.png')
        plt.close()

    # 2. SHAP (Tree Explainer)
    if name == "Without Satisfaction":
        print("Generating SHAP plots...")
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(X_test)
        
        # Handle different SHAP return types for binary classification
        if isinstance(shap_values, list):
            # Binary classification usually returns [class0_shap, class1_shap]
            vals = shap_values[1]
        else:
            # Newer versions or specific configs might return just one array
            vals = shap_values
            
        # Summary Plot
        plt.figure()
        shap.summary_plot(vals, X_test, show=False)
        plt.title(f'SHAP Summary ({name})')
        plt.tight_layout()
        plt.savefig(f'{OUTPUT_DIR}/shap_summary_{name.replace(" ", "_")}.png')
        plt.close()
        
    return y_test, y_proba, auc

def plot_comparisons(results):
    print("\nGenerating Comparison Plots...")
    
    # ROC Curve Comparison
    plt.figure(figsize=(8, 6))
    for name, res in results.items():
        fpr, tpr, _ = roc_curve(res['y_true'], res['y_proba'])
        plt.plot(fpr, tpr, label=f'{name} (AUC = {res["auc"]:.3f})')
        
    plt.plot([0, 1], [0, 1], 'k--')
    plt.xlabel('False Positive Rate')
    plt.ylabel('True Positive Rate')
    plt.title('ROC Curve Comparison')
    plt.legend()
    plt.savefig(f'{OUTPUT_DIR}/comparison_roc_curve.png')
    plt.close()
    
    # Precision-Recall Comparison
    plt.figure(figsize=(8, 6))
    for name, res in results.items():
        prec, recall, _ = precision_recall_curve(res['y_true'], res['y_proba'])
        plt.plot(recall, prec, label=name)
        
    plt.xlabel('Recall')
    plt.ylabel('Precision')
    plt.title('Precision-Recall Curve Comparison')
    plt.legend()
    plt.savefig(f'{OUTPUT_DIR}/comparison_pr_curve.png')
    plt.close()

if __name__ == "__main__":
    X_train, y_train, X_test, y_test = load_data()
    
    results = {}
    
    # 1. With Satisfaction
    y_true_sat, y_proba_sat, auc_sat = train_and_explain(
        X_train, y_train, X_test, y_test, "With Satisfaction"
    )
    results['With Satisfaction'] = {'y_true': y_true_sat, 'y_proba': y_proba_sat, 'auc': auc_sat}
    
    # 2. Without Satisfaction
    X_train_no = X_train.drop(columns=['Employee_Satisfaction_Score'])
    X_test_no = X_test.drop(columns=['Employee_Satisfaction_Score'])
    
    y_true_no, y_proba_no, auc_no = train_and_explain(
        X_train_no, y_train, X_test_no, y_test, "Without Satisfaction"
    )
    results['Without Satisfaction'] = {'y_true': y_true_no, 'y_proba': y_proba_no, 'auc': auc_no}
    
    plot_comparisons(results)
    
    print(f"\nAnalysis complete. Plots saved to {OUTPUT_DIR}")
