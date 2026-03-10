
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from imblearn.over_sampling import SMOTE
import os

# Set paths
DATA_PATH = 'data/Synthetic_Complex_Data.csv'
OUTPUT_DIR = 'data/processed_v5'
SCALER_PATH = 'models/neural_network/models_versions/scaler_v5_restructured.joblib'
ENCODER_PATH = 'models/neural_network/models_versions/encoders_v5_restructured.joblib'

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
    
    # 2. Feature Engineering (Base)
    print("Applying base feature engineering...")
    if 'Projects_Handled' in df.columns and 'Work_Hours_Per_Week' in df.columns:
        df['Efficiency_Index'] = df['Projects_Handled'] / df['Work_Hours_Per_Week']

    if 'Overtime_Hours' in df.columns and 'Employee_Satisfaction_Score' in df.columns:
        max_sat = df['Employee_Satisfaction_Score'].max()
        df['Burnout_Score'] = df['Overtime_Hours'] * (1 - (df['Employee_Satisfaction_Score'] / max_sat))

    if 'Hire_Date' in df.columns:
        df['Hire_Date'] = pd.to_datetime(df['Hire_Date'])
        ref_date = df['Hire_Date'].max()
        df['Tenure_Months'] = ((ref_date - df['Hire_Date']) / np.timedelta64(1, 'D') / 30.44).astype(int)
        df.drop('Hire_Date', axis=1, inplace=True)

    if 'Monthly_Salary' in df.columns and 'Age' in df.columns:
        df['Salary_Age_Ratio'] = df['Monthly_Salary'] / df['Age']

    # 3. PDP-Based Restructuring (New Logic)
    print("Applying PDP-based restructuring...")
    
    # Satisfaction Binning: Low (< 3.0) vs High (>= 3.0)
    # We use a string category initially
    df['Satisfaction_Level'] = np.where(df['Employee_Satisfaction_Score'] < 3.0, 'Low', 'High')
    
    # Promotions Simplification: 0 vs 1+
    df['Promoted'] = np.where(df['Promotions'] > 0, 1, 0)
    
    # Burnout Binning: Safe (< 1.5) vs High Burnout (>= 1.5)
    # Note: Burnout_Score was calculated above
    df['Burnout_Category'] = np.where(df['Burnout_Score'] < 1.5, 'Safe', 'High_Burnout')

    # Drop original columns that were binned/simplified to force model to use new structures
    # Keeping Overtime_Hours and Years_At_Company continuous as requested
    cols_to_drop = ['Employee_Satisfaction_Score', 'Promotions'] #'Burnout_Score' is kept or dropped? 
    # User said "Burnout_Score Binning". Usually we drop the continuous one to avoid collinearity if we strict.
    # But usually keeping both *might* be okay for trees, but for NN it's redundant. 
    # Let's DROP 'Burnout_Score' (the continuous one) and use the category, or check request. 
    # Request: "Burnout_Score Binning (Categories) ... Separate into Safe/High" -> Implies using the Category.
    # I will drop the continuous versions of binned features to avoid mixed signals.
    cols_to_drop.append('Burnout_Score')
    
    # Also drop IDs and non-predictive columns
    if 'Employee_ID' in df.columns:
        cols_to_drop.append('Employee_ID')

    df.drop(columns=cols_to_drop, inplace=True)
    print(f"Dropped columns: {cols_to_drop}")

    # 4. Encoding
    print("Encoding categorical features...")
    categorical_cols = df.select_dtypes(include=['object']).columns.tolist()
    label_encoders = {}
    
    for col in categorical_cols:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col])
        label_encoders[col] = le
    
    joblib.dump(label_encoders, ENCODER_PATH)
    print(f"Saved encoders to {ENCODER_PATH}")

    # 5. Splitting
    X = df.drop('Resigned', axis=1)
    y = df['Resigned']

    # Handle NaNs if any (simple fill for stability)
    X.fillna(X.mean(), inplace=True)

    X_train, X_temp, y_train, y_temp = train_test_split(X, y, test_size=0.3, random_state=42, stratify=y)
    X_val, X_test, y_val, y_test = train_test_split(X_temp, y_temp, test_size=0.5, random_state=42, stratify=y_temp)

    # 6. Scaling
    print("Scaling features...")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled = scaler.transform(X_val)
    X_test_scaled = scaler.transform(X_test)

    joblib.dump(scaler, SCALER_PATH)
    print(f"Saved scaler to {SCALER_PATH}")

    # 7. Balancing (SMOTE)
    print("Applying SMOTE...")
    smote = SMOTE(random_state=42)
    X_train_resampled, y_train_resampled = smote.fit_resample(X_train_scaled, y_train)

    # 8. Saving
    print("Saving processed datasets...")
    # Convert arrays back to dfs for saving to keep consistent with previous scripts? 
    # Actually saving as csv usually loses column names if we just save numpy array.
    # Let's save with headers for clarity.
    feature_names = X.columns.tolist()
    
    pd.DataFrame(X_train_resampled, columns=feature_names).to_csv(f'{OUTPUT_DIR}/X_train.csv', index=False)
    pd.DataFrame(y_train_resampled, columns=['Resigned']).to_csv(f'{OUTPUT_DIR}/y_train.csv', index=False)
    
    pd.DataFrame(X_val_scaled, columns=feature_names).to_csv(f'{OUTPUT_DIR}/X_val.csv', index=False)
    pd.DataFrame(y_val, columns=['Resigned']).to_csv(f'{OUTPUT_DIR}/y_val.csv', index=False)
    
    pd.DataFrame(X_test_scaled, columns=feature_names).to_csv(f'{OUTPUT_DIR}/X_test.csv', index=False)
    pd.DataFrame(y_test, columns=['Resigned']).to_csv(f'{OUTPUT_DIR}/y_test.csv', index=False)
    
    print(f"Data restructuring complete. Files saved in {OUTPUT_DIR}")
    print(f"New Feature List: {feature_names}")

if __name__ == "__main__":
    load_and_preprocess_data()
