import pandas as pd
import numpy as np

# Load original data structure
input_path = 'data/Extended_Employee_Performance_and_Productivity_Data.csv'
output_path = 'data/Synthetic_Complex_Data.csv'

df = pd.read_csv(input_path)
print(f"Original Data Loaded: {df.shape}")

# Pre-processing for Logic Generation
# Ensure Numerical types for logic application
# (In a real pipeline this happens later, but we need it now to generate target)
# We assume the input CSV has raw values.

# Initialize Base Risk
df['Churn_Risk'] = 0.10 # Base churn probability

# --- 1. WEAKENED Primary Drivers (To force model to look elsewhere) ---

# Satisfaction (Reduced from +40% to +20%)
# Logic: Low satisfaction is bad, but not the *only* reason.
df.loc[df['Employee_Satisfaction_Score'] < 3.0, 'Churn_Risk'] += 0.20

# Burnout / Overtime (Reduced from +30% to +15%)
df.loc[df['Overtime_Hours'] > 15, 'Churn_Risk'] += 0.15

# --- 2. NEW Secondary Drivers (The "Context") ---

# Age Effect (Younger employees move more)
# Adds nuance: High satisfaction might not save a young job-hopper.
df.loc[df['Age'] < 30, 'Churn_Risk'] += 0.10

# Salary Context
# Low salary relative to peers (Logic simplified for generation)
df.loc[df['Monthly_Salary'] < 4000, 'Churn_Risk'] += 0.10

# Tenure Stagnation (The "4-Year Itch")
df.loc[(df['Years_At_Company'] > 4) & (df['Promotions'] == 0), 'Churn_Risk'] += 0.15

# --- 3. CATEGORICAL Drivers (Departments & Work Mode) ---

# Department Risk (e.g., Sales is high turnover)
# We need to see if Department column exists and has values.
if 'Department' in df.columns:
    # Adding risk to specific departments to make this feature important
    df.loc[df['Department'].isin(['Sales', 'Marketing']), 'Churn_Risk'] += 0.10
    df.loc[df['Department'] == 'HR', 'Churn_Risk'] -= 0.05 # Safer dept

# Remote Work Isolation
if 'Remote_Work_Frequency' in df.columns:
    df.loc[df['Remote_Work_Frequency'] == 'Always', 'Churn_Risk'] += 0.05

# --- 4. Interactions (The "Hidden" Logic) ---

# High Performance but Low Pay -> Flight Risk
mask_flight_risk = (df['Performance_Score'] >= 4) & (df['Monthly_Salary'] < 5000)
df.loc[mask_flight_risk, 'Churn_Risk'] += 0.15

# --- 5. Random Noise (Increased) ---
# Less deterministic to prevent 100% accuracy on just top features
np.random.seed(123)
noise = np.random.uniform(-0.15, 0.15, size=len(df))
df['Churn_Risk'] += noise

# Clip Probability
df['Churn_Risk'] = df['Churn_Risk'].clip(0, 1)

# Assign Target Variable
df['Resigned_Logic'] = (df['Churn_Risk'] > 0.5).astype(bool)
df['Resigned'] = df['Resigned_Logic']

# Cleanup
df.drop(columns=['Churn_Risk', 'Resigned_Logic'], inplace=True)

# Save
df.to_csv(output_path, index=False)
print(f"Complex Data Generated at {output_path}")
print("Class Distribution:")
print(df['Resigned'].value_counts(normalize=True))
