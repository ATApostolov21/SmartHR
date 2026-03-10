
import pandas as pd
import numpy as np
import lightgbm as lgb
from sklearn.metrics import recall_score, precision_score
import os

# --- Config ---
DATA_DIR = 'data/processed_v7'
REPORT_DIR = 'models/ensemble_comparison/optimization'
os.makedirs(REPORT_DIR, exist_ok=True)

def train_cascade():
    print("Loading Data...")
    X_train = pd.read_csv(f'{DATA_DIR}/X_train.csv')
    y_train = pd.read_csv(f'{DATA_DIR}/y_train.csv').values.ravel()
    X_val = pd.read_csv(f'{DATA_DIR}/X_val.csv')
    y_val = pd.read_csv(f'{DATA_DIR}/y_val.csv').values.ravel()

    # --- Stage 1: The "Net" (High Recall) ---
    print("\nTraining Stage 1 (The Net)...")
    # Using specific params to ensure high recall by default (e.g. slight class weight bias)
    clf1 = lgb.LGBMClassifier(
        n_estimators=100,
        learning_rate=0.05,
        num_leaves=31,
        random_state=42,
        class_weight='balanced' 
    )
    clf1.fit(X_train, y_train)
    
    # Get probabilities
    train_probs_1 = clf1.predict_proba(X_train)[:, 1]
    val_probs_1 = clf1.predict_proba(X_val)[:, 1]
    
    # Set a very loose threshold to catch EVERYONE
    # Find threshold on Train that gives 99% Recall
    # Actually, let's just use 0.1 or something low.
    # But let's be scientific.
    # We want Stage 1 to filter out the "Obvious Loyal" people.
    
    # Let's say we target 98% Recall at Stage 1.
    def get_threshold(y_true, y_prob, target_recall):
        thresholds = np.sort(y_prob)
        # Binary search or scan
        # We need sum(y_true[y_prob >= thresh]) / sum(y_true) >= target_recall
        # Simple scan
        total_pos = sum(y_true)
        for t in np.linspace(0, 1, 101):
            preds = (y_prob >= t).astype(int)
            rec = recall_score(y_true, preds, zero_division=0)
            if rec < target_recall:
                return max(0.0, t - 0.01) # Return previous safe threshold
        return 0.0

    t1 = get_threshold(y_train, train_probs_1, 0.99) # Aim for 99% recall in stage 1
    print(f"Stage 1 Threshold (99% Recall Target on Train): {t1:.3f}")
    
    # Filter Train Data for Stage 2
    mask_train = train_probs_1 >= t1
    X_train_s2 = X_train[mask_train]
    y_train_s2 = y_train[mask_train]
    
    print(f"Stage 2 Training Data: {len(X_train_s2)} samples (Original: {len(X_train)})")
    print(f"Stage 2 Balance: {np.mean(y_train_s2):.2%} Positive (Original: 50%)")
    
    # --- Stage 2: The "Judge" (High Precision) ---
    print("\nTraining Stage 2 (The Judge)...")
    # This model only sees the "hard" cases.
    clf2 = lgb.LGBMClassifier(
        n_estimators=100,
        learning_rate=0.03,
        num_leaves=20, # Simpler trees to avoid overfitting the noise
        random_state=42
        # No class_weight='balanced' maybe? Let it learn the real prob. 
        # But wait, X_train is balanced-ish originally. 
        # In the filtered set, it might be unbalanced.
    )
    clf2.fit(X_train_s2, y_train_s2)
    
    # Evaluate Cascade
    # Logic: If Model1 < t1 -> 0. Else -> Model2 prediction
    
    # Model 2 probs on FULL val set
    # (Technically we only need to run on subset, but for vectorization we run on all then mask)
    val_probs_2 = clf2.predict_proba(X_val)[:, 1]
    
    # Combined Prob strategy? Or strict cascade?
    # Strict cascade:
    # If p1 < t1: Score = 0 (or p1)
    # If p1 >= t1: Score = p2
    
    final_preds_proba = np.where(val_probs_1 < t1, val_probs_1, val_probs_2) # Using p1 for low risk, p2 for high risk
    
    # Now find optimal threshold on this new score for Recall 85%
    print("\nScanning thresholds for Cascade Model...")
    best_prec = 0
    best_rec = 0
    best_t = 0
    
    for t in np.linspace(0.1, 0.9, 81):
        preds = (final_preds_proba >= t).astype(int)
        rec = recall_score(y_val, preds, zero_division=0)
        
        if rec >= 0.85:
            prec = precision_score(y_val, preds, zero_division=0)
            if prec > best_prec:
                best_prec = prec
                best_rec = rec
                best_t = t
                
    print(f"\nCascade Results -> Recall: {best_rec:.2%}, Precision: {best_prec:.2%} at Threshold {best_t:.3f}")

if __name__ == "__main__":
    train_cascade()
