
import pandas as pd
import numpy as np
import os
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.base import BaseEstimator, TransformerMixin

# Define paths
DATA_DIR = '../data/processed_v9'
OUTPUT_DIR = '../data/prepared'

# 1. Load Data
def load_and_merge_data(data_dir):
    try:
        X_train = pd.read_csv(os.path.join(data_dir, 'X_train.csv'))
        y_train = pd.read_csv(os.path.join(data_dir, 'y_train.csv'))
        X_val = pd.read_csv(os.path.join(data_dir, 'X_val.csv'))
        y_val = pd.read_csv(os.path.join(data_dir, 'y_val.csv'))
        X_test = pd.read_csv(os.path.join(data_dir, 'X_test.csv'))
        y_test = pd.read_csv(os.path.join(data_dir, 'y_test.csv'))
        
        df_train = pd.concat([X_train, y_train], axis=1)
        df_val = pd.concat([X_val, y_val], axis=1)
        df_test = pd.concat([X_test, y_test], axis=1)
        
        raw_df = pd.concat([df_train, df_val, df_test], axis=0).reset_index(drop=True)
        return raw_df
    except FileNotFoundError as e:
        print(f"Error loading: {e}")
        return None

print("Loading data...")
raw_df = load_and_merge_data(DATA_DIR)
if raw_df is None:
    exit(1)
print(f"Loaded {len(raw_df)} rows.")

# 2. Custom Transformers
class OutlierCapper(BaseEstimator, TransformerMixin):
    def __init__(self, factor=1.5):
        self.factor = factor
        self.caps_ = {}

    def fit(self, X, y=None):
        for col in X.columns:
            if pd.api.types.is_numeric_dtype(X[col]):
                q1 = X[col].quantile(0.25)
                q3 = X[col].quantile(0.75)
                iqr = q3 - q1
                upper_cap = q3 + (self.factor * iqr)
                lower_cap = q1 - (self.factor * iqr)
                self.caps_[col] = (lower_cap, upper_cap)
        return self

    def transform(self, X):
        X_copy = X.copy()
        for col, (lower, upper) in self.caps_.items():
            X_copy[col] = X_copy[col].clip(lower=lower, upper=upper)
        return X_copy

class FeatureEngineer(BaseEstimator, TransformerMixin):
    def fit(self, X, y=None):
        return self

    def transform(self, X):
        X = X.copy()
        X['Burnout_Index'] = (X['Overtime_Hours'] * X['Projects_Handled'])
        X['Salary_Per_Year'] = X['Monthly_Salary'] / (X['Years_At_Company'] + 1)
        X['Efficiency'] = X['Performance_Score'] / X['Work_Hours_Per_Week']
        return X

# 3. Split
print("Splitting data...")
drop_cols = ['Resigned', 'Employee_ID', 'Employee_Satisfaction_Score', 'Hire_Date']
X = raw_df.drop(columns=drop_cols, errors='ignore')
y = raw_df['Resigned']

X_train, X_temp, y_train, y_temp = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
X_val, X_test, y_val, y_test = train_test_split(X_temp, y_temp, test_size=0.5, stratify=y_temp, random_state=42)

# 4. Pipeline
numeric_features = ['Age', 'Years_At_Company', 'Monthly_Salary', 'Work_Hours_Per_Week', 
                    'Projects_Handled', 'Overtime_Hours', 'Sick_Days', 
                    'Remote_Work_Frequency', 'Team_Size', 'Training_Hours', 'Promotions']
categorical_features = ['Department', 'Gender', 'Job_Title', 'Education_Level']

numeric_transformer = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='median')),
    ('capper', OutlierCapper(factor=2.0)), 
    ('scaler', StandardScaler())
])

categorical_transformer = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
    ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
])

# Apply Feature Engineering manually first
fe = FeatureEngineer()
X_train_fe = fe.transform(X_train)
X_val_fe = fe.transform(X_val)
X_test_fe = fe.transform(X_test)

numeric_features_extended = numeric_features + ['Burnout_Index', 'Salary_Per_Year', 'Efficiency']

preprocessor = ColumnTransformer(
    transformers=[
        ('num', numeric_transformer, numeric_features_extended),
        ('cat', categorical_transformer, categorical_features)
    ])

# 5. Execute
print("Running pipeline...")
X_train_processed = preprocessor.fit_transform(X_train_fe)
X_val_processed = preprocessor.transform(X_val_fe)
X_test_processed = preprocessor.transform(X_test_fe)

print("Pipeline executed successfully.")
print(f"Processed Train Shape: {X_train_processed.shape}")

# 6. Save
os.makedirs(OUTPUT_DIR, exist_ok=True)
ohe_feature_names = preprocessor.named_transformers_['cat']['onehot'].get_feature_names_out(categorical_features)
all_feature_names = numeric_features_extended + list(ohe_feature_names)

pd.DataFrame(X_train_processed, columns=all_feature_names).to_csv(f'{OUTPUT_DIR}/X_train_prep.csv', index=False)
pd.DataFrame(X_val_processed, columns=all_feature_names).to_csv(f'{OUTPUT_DIR}/X_val_prep.csv', index=False)
pd.DataFrame(X_test_processed, columns=all_feature_names).to_csv(f'{OUTPUT_DIR}/X_test_prep.csv', index=False)
y_train.to_csv(f'{OUTPUT_DIR}/y_train_prep.csv', index=False)
y_val.to_csv(f'{OUTPUT_DIR}/y_val_prep.csv', index=False)
y_test.to_csv(f'{OUTPUT_DIR}/y_test_prep.csv', index=False)

print("Data saved.")
