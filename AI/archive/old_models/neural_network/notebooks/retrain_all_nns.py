import pandas as pd
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout, BatchNormalization, Input
from tensorflow.keras.optimizers import Adam, SGD
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
from sklearn.utils import class_weight
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
import os

PROCESSED_DATA_DIR = '/Users/apostolov31/Desktop/2526-dzi-ai-ATApostolov21/AI/data/processed_v9'
MODELS_DIR = '/Users/apostolov31/Desktop/2526-dzi-ai-ATApostolov21/AI/archive/old_models/neural_network/models_versions'
os.makedirs(MODELS_DIR, exist_ok=True)

print("Loading processed_v9 data...")
X_train = pd.read_csv(f'{PROCESSED_DATA_DIR}/X_train.csv')
y_train = pd.read_csv(f'{PROCESSED_DATA_DIR}/y_train.csv').values.ravel().astype(np.float32)
X_val = pd.read_csv(f'{PROCESSED_DATA_DIR}/X_val.csv')
y_val = pd.read_csv(f'{PROCESSED_DATA_DIR}/y_val.csv').values.ravel().astype(np.float32)

numeric_features = ['Age', 'Years_At_Company', 'Monthly_Salary', 'Work_Hours_Per_Week', 
                    'Projects_Handled', 'Overtime_Hours', 'Sick_Days', 
                    'Remote_Work_Frequency', 'Team_Size', 'Training_Hours', 'Promotions']
categorical_features = ['Department', 'Gender', 'Job_Title', 'Education_Level']

numeric_transformer = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='median')),
    ('scaler', StandardScaler())
])

categorical_transformer = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
    ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
])

preprocessor = ColumnTransformer(
    transformers=[
        ('num', numeric_transformer, numeric_features),
        ('cat', categorical_transformer, categorical_features)
    ])

X_train_prep = preprocessor.fit_transform(X_train)
X_val_prep = preprocessor.transform(X_val)

input_dim = X_train_prep.shape[1]
print(f"Input dimension: {input_dim}")

def get_class_weights(y):
    weights = class_weight.compute_class_weight('balanced', classes=np.unique(y), y=y)
    return dict(enumerate(weights))

cw = get_class_weights(y_train)

# v1: Basic MLP
def build_v1():
    m = Sequential([
        Input(shape=(input_dim,)),
        Dense(64, activation='relu'),
        Dense(32, activation='relu'),
        Dense(1, activation='sigmoid')
    ])
    m.compile(optimizer=SGD(learning_rate=0.01), loss='binary_crossentropy', metrics=['accuracy', tf.keras.metrics.AUC(name='auc')])
    return m

# v2: Wider
def build_v2():
    m = Sequential([
        Input(shape=(input_dim,)),
        Dense(128, activation='relu'),
        Dense(64, activation='relu'),
        Dense(32, activation='relu'),
        Dense(1, activation='sigmoid')
    ])
    m.compile(optimizer=SGD(learning_rate=0.01), loss='binary_crossentropy', metrics=['accuracy', tf.keras.metrics.AUC(name='auc')])
    return m

# v3: Adam + Dropout
def build_v3():
    m = Sequential([
        Input(shape=(input_dim,)),
        Dense(128, activation='relu'),
        Dropout(0.2),
        Dense(64, activation='relu'),
        Dropout(0.2),
        Dense(32, activation='relu'),
        Dense(1, activation='sigmoid')
    ])
    m.compile(optimizer=Adam(learning_rate=0.001), loss='binary_crossentropy', metrics=['accuracy', tf.keras.metrics.AUC(name='auc')])
    return m

# v4: Batch Norms
def build_v4():
    m = Sequential([
        Input(shape=(input_dim,)),
        Dense(128, activation='relu'),
        BatchNormalization(),
        Dropout(0.3),
        Dense(64, activation='relu'),
        BatchNormalization(),
        Dropout(0.2),
        Dense(32, activation='relu'),
        Dense(1, activation='sigmoid')
    ])
    m.compile(optimizer=Adam(learning_rate=0.001), loss='binary_crossentropy', metrics=['accuracy', tf.keras.metrics.AUC(name='auc')])
    return m

# v5: Deeper + SGD momentum
def build_v5():
    m = Sequential([
        Input(shape=(input_dim,)),
        Dense(128, activation='relu'),
        BatchNormalization(),
        Dropout(0.3),
        Dense(64, activation='relu'),
        BatchNormalization(),
        Dropout(0.3),
        Dense(32, activation='relu'),
        BatchNormalization(),
        Dropout(0.2),
        Dense(1, activation='sigmoid')
    ])
    m.compile(optimizer=SGD(learning_rate=0.01, momentum=0.9), loss='binary_crossentropy', metrics=['accuracy', tf.keras.metrics.AUC(name='auc')])
    return m

# v6: Aggressive Dropout
def build_v6():
    m = Sequential([
        Input(shape=(input_dim,)),
        Dense(128, activation='relu'),
        BatchNormalization(),
        Dropout(0.4),
        Dense(64, activation='relu'),
        BatchNormalization(),
        Dropout(0.3),
        Dense(32, activation='relu'),
        BatchNormalization(),
        Dropout(0.2),
        Dense(1, activation='sigmoid')
    ])
    m.compile(optimizer=SGD(learning_rate=0.01, momentum=0.9), loss='binary_crossentropy', metrics=['accuracy', tf.keras.metrics.AUC(name='auc')])
    return m

# v7: Final tuned (v6 + Adam slow)
def build_v7():
    m = Sequential([
        Input(shape=(input_dim,)),
        Dense(128, activation='relu'),
        BatchNormalization(),
        Dropout(0.4),
        Dense(64, activation='relu'),
        BatchNormalization(),
        Dropout(0.3),
        Dense(32, activation='relu'),
        BatchNormalization(),
        Dropout(0.2),
        Dense(1, activation='sigmoid')
    ])
    m.compile(optimizer=Adam(learning_rate=0.0005), loss='binary_crossentropy', metrics=['accuracy', tf.keras.metrics.AUC(name='auc')])
    return m


models_to_train = {
    'neural_network_model_v1.keras': build_v1,
    'neural_network_model_v2.keras': build_v2,
    'neural_network_model_v3.keras': build_v3,
    'synthetic_model_v4.keras': build_v4,
    'synthetic_model_v5.keras': build_v5,
    'synthetic_model_v6.keras': build_v6,
    'synthetic_model_v7.keras': build_v7
}

custom_callbacks = [
    ReduceLROnPlateau(monitor='val_auc', mode='max', factor=0.5, patience=3, min_lr=0.00001, verbose=0),
    EarlyStopping(monitor='val_auc', mode='max', patience=8, restore_best_weights=True)
]

for filename, builder in models_to_train.items():
    print(f"\\n--- Training {filename} ---")
    model = builder()
    model.fit(
        X_train_prep, y_train,
        validation_data=(X_val_prep, y_val),
        epochs=30,
        batch_size=128,
        class_weight=cw,
        callbacks=custom_callbacks,
        verbose=0
    )
    val_loss, val_acc, val_auc = model.evaluate(X_val_prep, y_val, verbose=0)
    print(f"Finished. Validation AUC: {val_auc:.4f}, Accuracy: {val_acc:.4f}")
    
    save_path = os.path.join(MODELS_DIR, filename)
    model.save(save_path)
    print(f"Saved to {save_path}")

print("\\nAll models successfully retrained and saved on processed_v9!")
