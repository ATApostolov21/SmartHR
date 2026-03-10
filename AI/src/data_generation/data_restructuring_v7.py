
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from imblearn.over_sampling import SMOTE
import os

# Set paths
DATA_PATH = 'data/Synthetic_Complex_Data.csv'
OUTPUT_DIR = 'data/processed_v7'
SCALER_PATH = 'models/neural_network/models_versions/scaler_v7.joblib'
ENCODER_PATH = 'models/neural_network/models_versions/encoders_v7.joblib'

# Ensure output directory exists
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs('models/neural_network/models_versions', exist_ok=True)

def load_and_preprocess_data():
    print("Loading data...")
    try:
        df = pd.read_csv(DATA_PATH)
    except FileNotFoundError:
        print(f"Error: {DATA_PATH} not found.")
        return

    # 1. Basic conversions
    if 'Resigned' in df.columns:
        df['Resigned'] = df['Resigned'].astype(int)
    
    # 2. Feature Engineering (From V6)
    print("Applying base feature engineering...")
    if 'Projects_Handled' in df.columns and 'Work_Hours_Per_Week' in df.columns:
        df['Efficiency_Index'] = df['Projects_Handled'] / df['Work_Hours_Per_Week']

    if 'Overtime_Hours' in df.columns and 'Employee_Satisfaction_Score' in df.columns:
        max_sat = df['Employee_Satisfaction_Score'].max()
        df['Burnout_Score'] = df['Overtime_Hours'] * (1 - (df['Employee_Satisfaction_Score'] / max_sat))

    if 'Monthly_Salary' in df.columns and 'Age' in df.columns:
        df['Salary_Age_Ratio'] = df['Monthly_Salary'] / df['Age']

    # 3. PDP-Based Restructuring (V6 Logic)
    print("Applying V6 logic...")
    df['Satisfaction_Level'] = np.where(df['Employee_Satisfaction_Score'] < 3.0, 'Low', 'High')
    df['Promoted'] = np.where(df['Promotions'] > 0, 1, 0)
    df['Burnout_Category'] = np.where(df['Burnout_Score'] < 1.5, 'Safe', 'High_Burnout')

    # 4. Feature Pruning (V7 Logic - Removing Duplicates and Low Impact)
    print("Applying V7 pruning (Removing redundancy & low impact)...")
    
    # DROP LIST based on analysis:
    cols_to_drop = [
        'Employee_Satisfaction_Score', # Original (replaced by Satisfaction_Level)
        'Promotions',                 # Original (replaced by Promoted)
        'Burnout_Score',              # Original (replaced by Burnout_Category)
        'Employee_ID',                # ID
        
        # Redundant (High Correlation found in V6 analysis)
        'Tenure_Months',              # Duplicate of Years_At_Company (Wait, we constructed it in prep but didn't save it to drop here. Original dataset has Years_At_Company. We just WON'T create Tenure_Months)
        # 'Tenure_Months' is NOT in original csv, it was created engineerings. So simply NOT creating it is enough.
        
        'Projects_Handled',           # Correlated strongly with Efficiency_Index (0.93). We keep Efficiency_Index.
        
        # Low Predictive Impact (from V6 feature importance)
        'Gender',                     # Near 0 importance
        'Education_Level',            # Near 0 importance
        'Training_Hours',             # Near 0 importance
        'Work_Hours_Per_Week',        # Near 0 importance
        'Sick_Days',                  # Near 0 importance
        'Remote_Work_Frequency',      # Near 0 importance
        'Team_Size',                  # Near 0 importance
        'Performance_Score',           # Low importance
        'Hire_Date',                   # Not needed if we have Years_At_Company
        'Department',                  # Low importance usually, unless specific ones matter. Let's drop for leaner model.
        'Job_Title'                    # High cardinality, usually noise if not grouped.
    ]
    
    # Check what exists before dropping
    existing_cols = set(df.columns)
    final_drop_list = [c for c in cols_to_drop if c in existing_cols]
    
    df.drop(columns=final_drop_list, inplace=True)
    print(f"Dropped columns: {final_drop_list}")

    # 5. Encoding
    print("Encoding categorical features...")
    categorical_cols = df.select_dtypes(include=['object']).columns.tolist()
    label_encoders = {}
    
    for col in categorical_cols:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col])
        label_encoders[col] = le
    
    joblib.dump(label_encoders, ENCODER_PATH)
    print(f"Saved encoders to {ENCODER_PATH}")

    # 6. Splitting
    X = df.drop('Resigned', axis=1)
    y = df['Resigned']

    # Handle NaNs if any
    X.fillna(X.mean(), inplace=True)

    X_train, X_temp, y_train, y_temp = train_test_split(X, y, test_size=0.3, random_state=42, stratify=y)
    X_val, X_test, y_val, y_test = train_test_split(X_temp, y_temp, test_size=0.5, random_state=42, stratify=y_temp)

    # 7. Scaling
    print("Scaling features...")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled = scaler.transform(X_val)
    X_test_scaled = scaler.transform(X_test)

    joblib.dump(scaler, SCALER_PATH)
    print(f"Saved scaler to {SCALER_PATH}")

    # 8. Balancing (SMOTE)
    print("Applying SMOTE...")
    smote = SMOTE(random_state=42)
    X_train_resampled, y_train_resampled = smote.fit_resample(X_train_scaled, y_train)

    # 9. Saving
    print("Saving processed datasets...")
    feature_names = X.columns.tolist()
    
    pd.DataFrame(X_train_resampled, columns=feature_names).to_csv(f'{OUTPUT_DIR}/X_train.csv', index=False)
    pd.DataFrame(y_train_resampled, columns=['Resigned']).to_csv(f'{OUTPUT_DIR}/y_train.csv', index=False)
    
    pd.DataFrame(X_val_scaled, columns=feature_names).to_csv(f'{OUTPUT_DIR}/X_val.csv', index=False)
    pd.DataFrame(y_val, columns=['Resigned']).to_csv(f'{OUTPUT_DIR}/y_val.csv', index=False)
    
    pd.DataFrame(X_test_scaled, columns=feature_names).to_csv(f'{OUTPUT_DIR}/X_test.csv', index=False)
    pd.DataFrame(y_test, columns=['Resigned']).to_csv(f'{OUTPUT_DIR}/y_test.csv', index=False)
    
    print(f"Data restructuring complete. Files saved in {OUTPUT_DIR}")
    print(f"New Feature List ({len(feature_names)} features): {feature_names}")

if __name__ == "__main__":
    load_and_preprocess_data()
