
import pandas as pd
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout, BatchNormalization, Input
from tensorflow.keras.optimizers import SGD
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
from sklearn.metrics import confusion_matrix, roc_auc_score, roc_curve
from sklearn.utils import class_weight
import matplotlib.pyplot as plt
import seaborn as sns
import os

# --- Configuration ---
PROCESSED_DATA_DIR = 'data/processed_v7'
MODEL_SAVE_PATH = 'models/neural_network/models_versions/synthetic_model_v7.keras'
REPORT_DIR = 'models/neural_network/reports/report_v7'
os.makedirs(REPORT_DIR, exist_ok=True)
os.makedirs('models/neural_network/models_versions', exist_ok=True)

def train_model_v7():
    print("Loading V7 data (Pruned Feature Set)...")
    X_train = pd.read_csv(f'{PROCESSED_DATA_DIR}/X_train.csv')
    y_train = pd.read_csv(f'{PROCESSED_DATA_DIR}/y_train.csv').values.ravel()
    
    X_val = pd.read_csv(f'{PROCESSED_DATA_DIR}/X_val.csv')
    y_val = pd.read_csv(f'{PROCESSED_DATA_DIR}/y_val.csv').values.ravel()
    
    print(f"Train class distribution: {np.bincount(y_train)}")
    
    # Compute class weights
    weights = class_weight.compute_class_weight(
        class_weight='balanced',
        classes=np.unique(y_train),
        y=y_train
    )
    class_weights = dict(enumerate(weights))
    print(f"Class weights: {class_weights}")

    # Build Model
    input_dim = X_train.shape[1]
    print(f"Input dimension: {input_dim} (Should be ~9)")

    # Slightly simplified architecture for fewer features
    model = Sequential([
        Input(shape=(input_dim,)),
        Dense(64, activation='relu'), # Reduced from 128
        BatchNormalization(),
        Dropout(0.3),
        Dense(32, activation='relu'), # Reduced from 64
        BatchNormalization(),
        Dropout(0.2),
        Dense(16, activation='relu'), # Reduced from 32
        BatchNormalization(),
        Dropout(0.1),
        Dense(1, activation='sigmoid')
    ])

    model.compile(
        optimizer=SGD(learning_rate=0.01, momentum=0.9),
        loss='binary_crossentropy',
        metrics=['accuracy', tf.keras.metrics.AUC(name='auc')]
    )

    # Callbacks
    callbacks = [
        ReduceLROnPlateau(monitor='val_auc', mode='max', factor=0.5, patience=5, min_lr=0.00001, verbose=1),
        EarlyStopping(monitor='val_auc', mode='max', patience=15, restore_best_weights=True) # Slightly more patience
    ]

    print("\nStarting Training (V7)...")
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=60, # Increased epochs slightly since smaller model might converge differently
        batch_size=64,
        class_weight=class_weights,
        callbacks=callbacks,
        verbose=1
    )

    # Save Model
    model.save(MODEL_SAVE_PATH)
    print(f"Model saved to {MODEL_SAVE_PATH}")

    # --- Evaluation & Reporting ---
    print("\n--- Evaluation ---")
    val_loss, val_acc, val_auc = model.evaluate(X_val, y_val)
    print(f"Validation AUC: {val_auc:.4f}")
    print(f"Validation Accuracy: {val_acc:.4f}")

    # Plots
    # History
    plt.figure(figsize=(12, 4))
    plt.subplot(1, 2, 1)
    plt.plot(history.history['auc'], label='Train AUC')
    plt.plot(history.history['val_auc'], label='Val AUC')
    plt.legend()
    plt.title('AUC History (V7)')
    
    plt.subplot(1, 2, 2)
    plt.plot(history.history['loss'], label='Train Loss')
    plt.plot(history.history['val_loss'], label='Val Loss')
    plt.legend()
    plt.title('Loss History (V7)')
    plt.tight_layout()
    plt.savefig(f"{REPORT_DIR}/training_history_v7.png")
    
    # Confusion Matrix
    y_pred_prob = model.predict(X_val)
    y_pred = (y_pred_prob > 0.5).astype(int)
    cm = confusion_matrix(y_val, y_pred)
    
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Greens', cbar=False) # Changed color to Greens for V7 distinction
    plt.xlabel('Predicted')
    plt.ylabel('Actual')
    plt.title('Confusion Matrix (V7 - Lean)')
    plt.savefig(f"{REPORT_DIR}/confusion_matrix_v7.png")
    
    # ROC Curve
    fpr, tpr, thresholds = roc_curve(y_val, y_pred_prob)
    plt.figure(figsize=(8, 6))
    plt.plot(fpr, tpr, label=f'AUC = {val_auc:.4f}', color='green')
    plt.plot([0, 1], [0, 1], 'k--')
    plt.xlabel('False Positive Rate')
    plt.ylabel('True Positive Rate')
    plt.title('ROC Curve (V7 - Lean)')
    plt.legend()
    plt.savefig(f"{REPORT_DIR}/roc_curve_v7.png")

    print(f"Analysis plots saved to {REPORT_DIR}")

if __name__ == "__main__":
    train_model_v7()
