
import pandas as pd
import numpy as np
import xgboost as xgb
import lightgbm as lgb
from catboost import CatBoostClassifier
from sklearn.metrics import roc_auc_score, accuracy_score
from sklearn.utils import class_weight
import matplotlib.pyplot as plt
import seaborn as sns
import os

DATA_DIR = 'data/processed_v7'
REPORT_DIR = 'models/ensemble_comparison'
os.makedirs(REPORT_DIR, exist_ok=True)

def train_and_evaluate_ensembles():
    print("Loading V7 data...")
    X_train = pd.read_csv(f'{DATA_DIR}/X_train.csv')
    y_train = pd.read_csv(f'{DATA_DIR}/y_train.csv').values.ravel()
    X_val = pd.read_csv(f'{DATA_DIR}/X_val.csv')
    y_val = pd.read_csv(f'{DATA_DIR}/y_val.csv').values.ravel()

    results = []

    # 1. XGBoost
    print("\nTraining XGBoost...")
    xgb_model = xgb.XGBClassifier(
        n_estimators=100,
        learning_rate=0.05,
        max_depth=6,
        subsample=0.8,
        colsample_bytree=0.8,
        scale_pos_weight=1, # Data is SMOTEd, so maybe 1 is fine, or adjust if needed
        eval_metric='auc',
        early_stopping_rounds=10,
        random_state=42
    )
    xgb_model.fit(X_train, y_train, eval_set=[(X_val, y_val)], verbose=False)
    
    y_pred_prob = xgb_model.predict_proba(X_val)[:, 1]
    y_pred = xgb_model.predict(X_val)
    auc = roc_auc_score(y_val, y_pred_prob)
    acc = accuracy_score(y_val, y_pred)
    results.append({'Model': 'XGBoost', 'AUC': auc, 'Accuracy': acc})
    print(f"XGBoost -> AUC: {auc:.4f}, Acc: {acc:.4f}")

    # 2. LightGBM
    print("\nTraining LightGBM...")
    lgb_model = lgb.LGBMClassifier(
        n_estimators=100,
        learning_rate=0.05,
        num_leaves=31,
        random_state=42,
        force_col_wise=True
    )
    lgb_model.fit(X_train, y_train, eval_set=[(X_val, y_val)], eval_metric='auc', callbacks=[lgb.early_stopping(10), lgb.log_evaluation(0)])
    
    y_pred_prob = lgb_model.predict_proba(X_val)[:, 1]
    y_pred = lgb_model.predict(X_val)
    auc = roc_auc_score(y_val, y_pred_prob)
    acc = accuracy_score(y_val, y_pred)
    results.append({'Model': 'LightGBM', 'AUC': auc, 'Accuracy': acc})
    print(f"LightGBM -> AUC: {auc:.4f}, Acc: {acc:.4f}")

    # 3. CatBoost
    print("\nTraining CatBoost...")
    cat_model = CatBoostClassifier(
        iterations=100,
        learning_rate=0.05,
        depth=6,
        verbose=0,
        random_state=42,
        eval_metric='AUC'
    )
    cat_model.fit(X_train, y_train, eval_set=(X_val, y_val), early_stopping_rounds=10)
    
    y_pred_prob = cat_model.predict_proba(X_val)[:, 1]
    y_pred = cat_model.predict(X_val)
    auc = roc_auc_score(y_val, y_pred_prob)
    acc = accuracy_score(y_val, y_pred)
    results.append({'Model': 'CatBoost', 'AUC': auc, 'Accuracy': acc})
    print(f"CatBoost -> AUC: {auc:.4f}, Acc: {acc:.4f}")

    # Comparison Plot
    res_df = pd.DataFrame(results)
    print("\n--- Summary ---")
    print(res_df)
    
    res_df.to_csv(f"{REPORT_DIR}/ensemble_metrics.csv", index=False)
    
    # Plot AUC
    plt.figure(figsize=(8, 5))
    sns.barplot(x='AUC', y='Model', data=res_df, palette='magma')
    plt.title('AUC Comparison: Neural Network vs Boosted Trees')
    plt.xlabel('AUC Score')
    plt.tight_layout()
    plt.savefig(f"{REPORT_DIR}/model_comparison_auc.png")

if __name__ == "__main__":
    train_and_evaluate_ensembles()
