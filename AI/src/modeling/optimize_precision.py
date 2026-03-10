
import pandas as pd
import numpy as np
import lightgbm as lgb
import xgboost as xgb
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score, accuracy_score, recall_score, precision_score, classification_report
from sklearn.preprocessing import StandardScaler
import matplotlib.pyplot as plt
import seaborn as sns
import os

# --- Config ---
DATA_DIR = 'data/processed_v7'
REPORT_DIR = 'models/ensemble_comparison/optimization'
os.makedirs(REPORT_DIR, exist_ok=True)

def train_and_optimize():
    print("Loading Data...")
    X_train = pd.read_csv(f'{DATA_DIR}/X_train.csv')
    y_train = pd.read_csv(f'{DATA_DIR}/y_train.csv').values.ravel()
    X_val = pd.read_csv(f'{DATA_DIR}/X_val.csv')
    y_val = pd.read_csv(f'{DATA_DIR}/y_val.csv').values.ravel()

    # 1. Train LightGBM (The Current Champion)
    print("\nTraining LightGBM...")
    lgb_model = lgb.LGBMClassifier(
        n_estimators=200,
        learning_rate=0.03,
        num_leaves=31,
        random_state=42,
        class_weight='balanced' # Try balanced to boost base recall, allowing higher threshold later
    )
    lgb_model.fit(X_train, y_train)
    p_lgb = lgb_model.predict_proba(X_val)[:, 1]

    # 2. Train XGBoost (The Alternative)
    print("Training XGBoost...")
    xgb_model = xgb.XGBClassifier(
        n_estimators=200,
        learning_rate=0.03,
        max_depth=6,
        random_state=42,
        scale_pos_weight=sum(y_train==0)/sum(y_train==1) # Balanced approach
    )
    xgb_model.fit(X_train, y_train)
    p_xgb = xgb_model.predict_proba(X_val)[:, 1]

    # 3. Random Forest (For Diversity - good at high precision sometimes)
    from sklearn.ensemble import RandomForestClassifier
    print("Training Random Forest...")
    rf_model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42, class_weight='balanced')
    rf_model.fit(X_train, y_train)
    p_rf = rf_model.predict_proba(X_val)[:, 1]

    # --- Optimization Strategies ---
    
    # Strategy A: Weighted Blending Search
    print("\nSearching for optimal blend (LGBM + XGB + RF)...")
    best_precision = 0
    best_config = None
    
    # Grid search weights (simplified)
    # w1 for LGBM, w2 for XGB, w3 for RF. sum = 1
    # We will iterate and for each blend, find the threshold that gives Recall >= 85%
    # Then check Precision.
    
    results = []

    weights_to_try = [
        (1.0, 0.0, 0.0), # Pure LGBM
        (0.0, 1.0, 0.0), # Pure XGB
        (0.5, 0.5, 0.0), # LGBM + XGB
        (0.4, 0.4, 0.2), # Mix
        (0.6, 0.2, 0.2), # LGBM heavy
        (0.33, 0.33, 0.33) # Equal
    ]

    target_recall = 0.85

    print(f"{'Blend (L/X/R)':<20} | {'Threshold':<10} | {'Recall':<10} | {'Precision':<10} | {'F1':<10}")
    print("-" * 75)

    for w_lgb, w_xgb, w_rf in weights_to_try:
        # Create blended probability
        p_blend = (w_lgb * p_lgb) + (w_xgb * p_xgb) + (w_rf * p_rf)
        
        # Find threshold ensuring Recall >= target_recall
        # Sort probs
        sorted_indices = np.argsort(p_blend)
        sorted_probs = p_blend[sorted_indices]
        sorted_y = y_val[sorted_indices]
        
        # We can just brute force thresholds from 0.01 to 0.99
        best_thresh_for_blend = 0
        prec_at_target_recall = 0
        rec_at_target_recall = 0
        
        for thresh in np.linspace(0.1, 0.9, 81):
            y_pred = (p_blend >= thresh).astype(int)
            rec = recall_score(y_val, y_pred, zero_division=0)
            if rec >= target_recall:
                prec = precision_score(y_val, y_pred, zero_division=0)
                if prec > prec_at_target_recall:
                    prec_at_target_recall = prec
                    rec_at_target_recall = rec
                    best_thresh_for_blend = thresh
        
        # Calculate F1
        f1 = 2 * (prec_at_target_recall * rec_at_target_recall) / (prec_at_target_recall + rec_at_target_recall + 1e-9)
        
        blend_name = f"{w_lgb}/{w_xgb}/{w_rf}"
        print(f"{blend_name:<20} | {best_thresh_for_blend:.3f}      | {rec_at_target_recall:.2%}     | {prec_at_target_recall:.2%}     | {f1:.4f}")
        
        results.append({
            'Blend': blend_name,
            'Threshold': best_thresh_for_blend,
            'Recall': rec_at_target_recall,
            'Precision': prec_at_target_recall,
            'F1': f1
        })

    # Convert to DF
    res_df = pd.DataFrame(results)
    res_df = res_df.sort_values(by='Precision', ascending=False)
    
    print("\n--- Optimization Results (Sorted by Precision) ---")
    print(res_df)
    res_df.to_csv(f"{REPORT_DIR}/optimization_results.csv", index=False)
    
    # Plot
    plt.figure(figsize=(10, 6))
    sns.barplot(x='Precision', y='Blend', data=res_df, hue='Recall', palette='viridis')
    plt.title(f'Precision Optimization (Constrained Recall >= {target_recall*100}%)')
    plt.axvline(0.53, color='r', linestyle='--', label='Current Best (~53%)')
    plt.legend()
    plt.tight_layout()
    plt.savefig(f"{REPORT_DIR}/precision_optimization_plot.png")
    print(f"Plot saved to {REPORT_DIR}/precision_optimization_plot.png")

if __name__ == "__main__":
    train_and_optimize()
