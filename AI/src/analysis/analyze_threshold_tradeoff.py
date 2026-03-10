
import pandas as pd
import numpy as np
import tensorflow as tf
from sklearn.metrics import precision_recall_curve
import matplotlib.pyplot as plt
import os

MODEL_PATH = 'models/neural_network/models_versions/synthetic_model_v7.keras'
DATA_DIR = 'data/processed_v7'
REPORT_DIR = 'models/neural_network/reports/report_v7'

def analyze_thresholds():
    print("Loading V7 data...")
    X_val = pd.read_csv(f'{DATA_DIR}/X_val.csv')
    y_val = pd.read_csv(f'{DATA_DIR}/y_val.csv').values.ravel()
    
    print("Loading Model...")
    model = tf.keras.models.load_model(MODEL_PATH)
    y_pred_prob = model.predict(X_val, verbose=0).ravel()
    
    # Calculate Precision-Recall pairs for different probability thresholds
    precisions, recalls, thresholds = precision_recall_curve(y_val, y_pred_prob)
    
    # We want to find a threshold where Precision improves but Recall stays high (e.g., > 80% or > 85%)
    # Current state (approx): Threshold 0.5 -> Recall ~91%, Precision ~48%
    
    print("\n--- Threshold Analysis ---")
    print(f"{'Threshold':<10} | {'Recall':<10} | {'Precision':<10} | {'F1-Score':<10}")
    print("-" * 46)
    
    # Check specific interesting points
    for t in [0.5, 0.6, 0.7, 0.75, 0.8]:
        # Since thresholds array is smaller than p/r arrays by 1, we find closest index
        # Or just calculate manually for clarity
        y_pred_t = (y_pred_prob > t).astype(int)
        tp = np.sum((y_pred_t == 1) & (y_val == 1))
        fp = np.sum((y_pred_t == 1) & (y_val == 0))
        fn = np.sum((y_pred_t == 0) & (y_val == 1))
        
        prec = tp / (tp + fp) if (tp + fp) > 0 else 0
        rec = tp / (tp + fn) if (tp + fn) > 0 else 0
        f1 = 2 * (prec * rec) / (prec + rec) if (prec + rec) > 0 else 0
        
        print(f"{t:<10.2f} | {rec:<10.2%} | {prec:<10.2%} | {f1:<10.4f}")

    # Plot Precision-Recall Curve with Thresholds
    plt.figure(figsize=(10, 6))
    plt.plot(thresholds, precisions[:-1], "b--", label="Precision")
    plt.plot(thresholds, recalls[:-1], "g-", label="Recall")
    plt.xlabel("Threshold")
    plt.ylabel("Score")
    plt.title("Precision vs Recall per Threshold (Model V7)")
    plt.legend(loc="best")
    plt.grid(True)
    
    save_path = f"{REPORT_DIR}/precision_recall_tradeoff.png"
    plt.savefig(save_path)
    print(f"\nTrade-off plot saved to {save_path}")
    
    # Auto-recommendation
    # Find threshold where Precision >= 60% while Recall is maximized (or >= 85%)
    valid_indices = np.where((precisions[:-1] >= 0.60) & (recalls[:-1] >= 0.80))
    if len(valid_indices[0]) > 0:
        best_idx = valid_indices[0][np.argmax(recalls[:-1][valid_indices])]
        best_t = thresholds[best_idx]
        print(f"\nRecommendation: Try Threshold = {best_t:.2f}")
        print(f"Expected -> Recall: {recalls[best_idx]:.2%}, Precision: {precisions[best_idx]:.2%}")
    else:
        print("\nNote: Hard to reach 60% Precision with >80% Recall. Check the table for best compromise.")

if __name__ == "__main__":
    analyze_thresholds()
