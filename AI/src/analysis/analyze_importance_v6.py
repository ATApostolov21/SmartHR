
import pandas as pd
import numpy as np
import tensorflow as tf
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.inspection import permutation_importance
from scikeras.wrappers import KerasClassifier
import joblib
import os

# Paths
MODEL_PATH = 'models/neural_network/models_versions/synthetic_model_v6.keras'
DATA_DIR = 'data/processed_v5'
REPORT_DIR = 'models/neural_network/reports/report_v6'
os.makedirs(REPORT_DIR, exist_ok=True)

def analyze_importance():
    print("Loading V6 Data...")
    X_val = pd.read_csv(f'{DATA_DIR}/X_val.csv')
    y_val = pd.read_csv(f'{DATA_DIR}/y_val.csv').values.ravel()
    
    print("Loading Model...")
    model = tf.keras.models.load_model(MODEL_PATH)
    
    # Wrap for sklearn compatibility if needed, or implement custom loop
    # Custom loop is often easier for generic Keras without wrapping issues
    
    baseline_score = model.evaluate(X_val, y_val, verbose=0)[1] # AUC is metric index 1? No, usually loss, acc, auc.
    # Let's check metrics names
    print(f"Metrics names: {model.metrics_names}") 
    # Usually ['loss', 'accuracy', 'auc']
    
    # We will use AUC for importance
    def score_func(X, y):
        pred = model.predict(X, verbose=0).ravel()
        from sklearn.metrics import roc_auc_score
        return roc_auc_score(y, pred)
        
    baseline_auc = score_func(X_val, y_val)
    print(f"Baseline AUC: {baseline_auc:.4f}")
    
    importances = {}
    print("Calculating Permutation Importance (this may take a moment)...")
    
    for col in X_val.columns:
        original_values = X_val[col].copy()
        
        # Shuffle
        X_val[col] = np.random.permutation(X_val[col].values)
        
        # Score
        shuffled_auc = score_func(X_val, y_val)
        
        # Drop in performance
        importance = baseline_auc - shuffled_auc
        importances[col] = importance
        
        # Restore
        X_val[col] = original_values
        print(f"Feature: {col}, Importance (Drop in AUC): {importance:.5f}")

    # Plot
    importance_df = pd.DataFrame(list(importances.items()), columns=['Feature', 'Importance'])
    importance_df = importance_df.sort_values(by='Importance', ascending=False)
    
    plt.figure(figsize=(10, 8))
    sns.barplot(x='Importance', y='Feature', data=importance_df, palette='viridis')
    plt.title('Feature Importance V6 (Permutation AUC Drop)')
    plt.xlabel('Drop in AUC when shuffled')
    plt.tight_layout()
    plt.savefig(f"{REPORT_DIR}/feature_importance_v6.png")
    print(f"Saved plot to {REPORT_DIR}/feature_importance_v6.png")
    
    # Text Report
    top_features = importance_df.head(5)['Feature'].tolist()
    print("\nTop 5 Features:")
    print(top_features)
    
    # Specific check for new features
    new_features = ['Satisfaction_Level', 'Burnout_Category', 'Promoted']
    print("\nNew Features Rank:")
    for feat in new_features:
        if feat in importance_df['Feature'].values:
            rank = importance_df[importance_df['Feature'] == feat].index[0]
            # Since we sorted, we need to find position in comparison to shape
            # Actually importance_df is sorted, so we can get row number
            row_idx = importance_df.reset_index(drop=True).index[importance_df.reset_index(drop=True)['Feature'] == feat].tolist()[0]
            val = importance_df[importance_df['Feature'] == feat]['Importance'].values[0]
            print(f"- {feat}: Rank #{row_idx + 1}, Importance: {val:.5f}")

if __name__ == "__main__":
    analyze_importance()
