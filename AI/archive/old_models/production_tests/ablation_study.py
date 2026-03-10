
import pandas as pd
import numpy as np
import lightgbm as lgb
from sklearn.metrics import classification_report, accuracy_score, roc_auc_score, log_loss

# Config
DATA_DIR = 'dataset/processed_v7'

def load_data():
    print("Loading data...")
    X_train = pd.read_csv(f'{DATA_DIR}/X_train.csv')
    y_train = pd.read_csv(f'{DATA_DIR}/y_train.csv').values.ravel()
    X_val = pd.read_csv(f'{DATA_DIR}/X_val.csv')
    y_val = pd.read_csv(f'{DATA_DIR}/y_val.csv').values.ravel()
    X_test = pd.read_csv(f'{DATA_DIR}/X_test.csv')
    y_test = pd.read_csv(f'{DATA_DIR}/y_test.csv').values.ravel()
    
    # Validation Fix: Strip whitespace
    X_train.columns = X_train.columns.str.strip()
    X_val.columns = X_val.columns.str.strip()
    X_test.columns = X_test.columns.str.strip()
    
    # Concatenate Train + Val
    print(f"X_train shape: {X_train.shape}")
    print(f"X_val shape: {X_val.shape}")
    X_full_train = pd.concat([X_train, X_val], axis=0)
    y_full_train = np.concatenate([y_train, y_val], axis=0)
    
    print(f"X_full_train shape: {X_full_train.shape}")
    print(f"X_test shape: {X_test.shape}")
    print(f"X_full_train columns: {X_full_train.columns.tolist()}")
    
    return X_full_train, y_full_train, X_test, y_test

def train_eval(X_train, y_train, X_test, y_test, drop_cols=None, name="Model"):
    if drop_cols:
        X_train = X_train.drop(columns=drop_cols)
        X_test = X_test.drop(columns=drop_cols)
        
    print(f"\n--- Training {name} ---")
    print(f"Training Data Shape: {X_train.shape}")
    print(f"Test Data Shape: {X_test.shape}")
    print(f"Features: {X_train.columns.tolist()}")
    
    model = lgb.LGBMClassifier(
        n_estimators=100,
        learning_rate=0.05,
        num_leaves=31,
        random_state=42,
        class_weight='balanced',
        force_col_wise=True,
        verbosity=-1
    )
    
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]
    
    acc = accuracy_score(y_test, y_pred)
    try:
        auc = roc_auc_score(y_test, y_proba)
    except:
        auc = 0
    loss = log_loss(y_test, y_proba)
    
    print(f"Results for {name}:")
    print(f"Accuracy: {acc:.4f}")
    print(f"AUC: {auc:.4f}")
    print(f"Log Loss: {loss:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    return {
        'name': name,
        'accuracy': acc,
        'auc': auc,
        'log_loss': loss,
        'report': classification_report(y_test, y_pred, output_dict=True)
    }

if __name__ == "__main__":
    X_train, y_train, X_test, y_test = load_data()
    
    # 1. Baseline
    res_base = train_eval(X_train.copy(), y_train.copy(), X_test.copy(), y_test.copy(), 
                          drop_cols=[], name="Baseline (All Features)")
                          
    # 2. No Satisfaction
    res_no_sat = train_eval(X_train.copy(), y_train.copy(), X_test.copy(), y_test.copy(), 
                            drop_cols=['Satisfaction_Level'], name="No Satisfaction Score")

    # 3. No Satisfaction & No Burnout
    res_no_sat_burn = train_eval(X_train.copy(), y_train.copy(), X_test.copy(), y_test.copy(), 
                            drop_cols=['Satisfaction_Level', 'Burnout_Category'], name="No Satisfaction & No Burnout")

