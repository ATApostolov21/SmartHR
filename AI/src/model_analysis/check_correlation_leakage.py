import pandas as pd
import numpy as np
import os

# Define path to dataset
file_path = '/Users/apostolov31/Desktop/2526-dzi-ai-ATApostolov21/data/Synthetic_Complex_Data.csv'

try:
    if not os.path.exists(file_path):
        print(f"Error: File not found at {file_path}")
        exit(1)

    df = pd.read_csv(file_path)
    
    target = 'Resigned'
    
    if target not in df.columns:
        print(f"Error: Target column '{target}' not found in dataset.")
        print(f"Available columns: {df.columns.tolist()}")
        exit(1)

    # Preprocessing for correlation check
    # 1. Drop usually non-predictive ID columns if they exist
    if 'Employee_ID' in df.columns:
        df = df.drop(columns=['Employee_ID'])
    
    # Check target dtype
    print(f"Original target dtype: {df[target].dtype}")

    # 2. Force target directly to numeric (0/1) if it's boolean or object
    if df[target].dtype == 'bool':
        df[target] = df[target].astype(int)
    elif df[target].dtype == 'object':
         # If it's 'Yes'/'No' or 'True'/'False' strings, factorize helps, or map
         # Trying basic factorize to be safe
         df[target] = pd.factorize(df[target])[0]

    # 3. Convert categorical columns to numeric codes for correlation analysis
    df_encoded = df.copy()
    for col in df_encoded.columns:
        if col == target:
            continue
        if df_encoded[col].dtype == 'object' or df_encoded[col].dtype == 'bool':
            # Try to convert to category codes
            try:
                # factorize returns (codes, uniques), we take codes
                df_encoded[col] = pd.factorize(df_encoded[col])[0]
            except Exception:
                pass 

    # 4. Select only numeric columns (including the ones we just encoded)
    numeric_df = df_encoded.select_dtypes(include=[np.number])
    
    if target not in numeric_df.columns:
        # If it still fails, print dtypes to debug
        print(f"Error: Target variable '{target}' not found in numeric columns after processing.")
        print("Current dtypes in numeric_df:")
        print(numeric_df.dtypes) 
        exit(1)

    # Calculate correlations
    correlations = numeric_df.corr()[target].sort_values(ascending=False)
    
    # Filter out the target itself
    correlations = correlations.drop(target)
    
    print(f"--- Correlation of all features with '{target}' ---")
    print(correlations)
    print("\n--- Leakage Check (Correlation > 0.9) ---")
    
    leakage_found = False
    for feature, corr_value in correlations.items():
        if abs(corr_value) > 0.9:
            print(f"ALERT: Possible Data Leakage! Feature '{feature}' has correlation {corr_value:.4f}")
            leakage_found = True
            
    if not leakage_found:
        print("No features found with correlation > 0.9. Data seems safe from obvious single-feature leakage.")

except Exception as e:
    print(f"An error occurred: {e}")
