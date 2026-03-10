import pandas as pd
import numpy as np

# Load original data source
input_path = 'data/Extended_Employee_Performance_and_Productivity_Data.csv'
output_path = 'data/Unseen_Synthetic_Data.csv'

df = pd.read_csv(input_path)

# Sample a smaller subset to simulate a new batch (e.g., 20k records)
# Using a different seed for sampling and noise
df = df.sample(n=20000, random_state=999).reset_index(drop=True)

print(f"Generating Unseen Data. Size: {df.shape}")

# Initialize Risk
df['Churn_Risk'] = 0.0

# Apply SAME Logic as Training Data (Ground Truth)
# 1. Satisfaction < 2.5 -> +40%
df.loc[df['Employee_Satisfaction_Score'] < 2.5, 'Churn_Risk'] += 0.40

# 2. Overtime > 20 -> +30%
df.loc[df['Overtime_Hours'] > 20, 'Churn_Risk'] += 0.30

# 3. High Performance, Low Pay -> +30%
mask_underpaid = (df['Performance_Score'] >= 4) & (df['Monthly_Salary'] < 6000)
df.loc[mask_underpaid, 'Churn_Risk'] += 0.30

# 4. Stagnation -> +20%
mask_stagnant = (df['Years_At_Company'] > 4) & (df['Promotions'] == 0)
df.loc[mask_stagnant, 'Churn_Risk'] += 0.20

# 5. Add Random Noise +/- 10% (Different Seed)
np.random.seed(999) 
noise = np.random.uniform(-0.1, 0.1, size=len(df))
df['Churn_Risk'] += noise

# Clip Probability
df['Churn_Risk'] = df['Churn_Risk'].clip(0, 1)

# Assign Target
df['Resigned_Logic'] = (df['Churn_Risk'] > 0.5).astype(bool)
df['Resigned'] = df['Resigned_Logic']
df.drop(columns=['Churn_Risk', 'Resigned_Logic'], inplace=True)

# Save
df.to_csv(output_path, index=False)
print(f"Unseen Test Data Generated at {output_path}")
print(df['Resigned'].value_counts(normalize=True))
