import pandas as pd
import numpy as np

# Load original data
input_path = 'data/Extended_Employee_Performance_and_Productivity_Data.csv'
output_path = 'data/Synthetic_Logic_Data.csv'

df = pd.read_csv(input_path)

print("Original Data Loaded. Size:", df.shape)

# Initialize Risk
df['Churn_Risk'] = 0.0

# 1. Satisfaction < 2.5 -> +40%
df.loc[df['Employee_Satisfaction_Score'] < 2.5, 'Churn_Risk'] += 0.40

# 2. Overtime > 20 -> +30%
df.loc[df['Overtime_Hours'] > 20, 'Churn_Risk'] += 0.30

# 3. High Performance, Low Pay -> +30%
# Performance_Score >= 4 AND Monthly_Salary < 6000
mask_underpaid = (df['Performance_Score'] >= 4) & (df['Monthly_Salary'] < 6000)
df.loc[mask_underpaid, 'Churn_Risk'] += 0.30

# 4. Stagnation -> +20%
# Years_At_Company > 4 AND Promotions == 0
mask_stagnant = (df['Years_At_Company'] > 4) & (df['Promotions'] == 0)
df.loc[mask_stagnant, 'Churn_Risk'] += 0.20

# 5. Add Random Noise +/- 10%
np.random.seed(42) # For reproducibility
noise = np.random.uniform(-0.1, 0.1, size=len(df))
df['Churn_Risk'] += noise

# Clip Probability to [0, 1]
df['Churn_Risk'] = df['Churn_Risk'].clip(0, 1)

# Assign Target Variable
# Using a threshold. Since valid probability > 0 is needed.
# Let's say if Risk > 0.5 -> Resigned = True
# Or to match ~35%, let's check the distribution.
# But for now, let's use a probabilistic approach or threshold.
# Report implies "Injected Logic", usually deterministic + noise.
# Let's use a simple threshold of 0.5 for "Resigned".
df['Resigned_Logic'] = (df['Churn_Risk'] > 0.5).astype(bool)

# Replace original Resigned column
df['Resigned'] = df['Resigned_Logic']

# Drop intermediate columns
df.drop(columns=['Churn_Risk', 'Resigned_Logic'], inplace=True)

# Save
df.to_csv(output_path, index=False)

print(f"Synthetic Data Generated at {output_path}")
print("Class Distribution:")
print(df['Resigned'].value_counts(normalize=True))
