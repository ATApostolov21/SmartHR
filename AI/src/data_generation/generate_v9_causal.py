
import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta
import os
from sklearn.model_selection import train_test_split

def generate_v9_data(num_samples=200000):
    print(f"Generating {num_samples} samples...")
    np.random.seed(42)
    random.seed(42)

    data = []
    
    departments = ['Sales', 'IT', 'HR', 'Finance', 'Marketing', 'Customer Support', 'Engineering']
    job_titles = ['Junior', 'Senior', 'Manager', 'Lead', 'Analyst', 'Specialist']
    education_levels = ['Bachelor', 'Master', 'PhD', 'High School']

    # Base market salaries for simplification
    market_base = {
        'Junior': 4000, 
        'Senior': 7000, 
        'Manager': 9000, 
        'Lead': 8500, 
        'Analyst': 5000, 
        'Specialist': 6000
    }

    start_date = datetime(2015, 1, 1)

    # Vectorized approach for speed simulation (since Python loop is slow for 200k)
    # We will stick to loop for clarity of logic, but assume it's fast enough for 200k.
    # 200k might take 10-20 seconds.
    
    for i in range(num_samples):
        # --- 1. Observable / Demographic Features (Independent) ---
        dept = random.choice(departments)
        title = random.choice(job_titles)
        education = random.choice(education_levels)
        gender = random.choice(['Male', 'Female'])
        age = random.randint(22, 60)
        
        # Tenure
        days_employed = random.randint(100, 365 * 10)
        hire_date = start_date + timedelta(days=random.randint(0, 2000))
        years_at_company = days_employed // 365
        
        # Workload (Correlated with role)
        if title in ['Manager', 'Lead', 'Senior']:
            work_hours = int(np.random.normal(45, 5))
            projects = random.randint(5, 20)
        else:
            work_hours = int(np.random.normal(40, 3))
            projects = random.randint(2, 10)
        
        overtime = max(0, work_hours - 40) + random.randint(0, 10) 
        
        # Performance & Pay
        performance = random.choices([1, 2, 3, 4, 5], weights=[0.05, 0.1, 0.4, 0.3, 0.15])[0]
        promotions = 0
        if years_at_company > 2:
            promotions = random.choices([0, 1, 2], weights=[0.7, 0.2, 0.1])[0]
            
        # Salary Calculation
        base_pay = market_base[title]
        market_deviance = np.random.normal(0, 1000) 
        salary = base_pay + (years_at_company * 200) + (promotions * 1000) + market_deviance
        salary = max(3000, round(salary, -1))

        # --- 2. Latent Risk Factors ---
        
        # A. Burnout Risk
        burnout_score = (overtime / 15.0) * 0.7 + (projects / 20.0) * 0.3
        burnout_risk = 1 / (1 + np.exp(-(burnout_score - 0.7) * 8)) 
        
        # B. Financial Risk
        expected_salary = market_base[title] * (1 + (performance - 2) * 0.15)
        salary_ratio = salary / expected_salary
        financial_risk = 1 / (1 + np.exp((salary_ratio - 0.90) * 12))
        
        # C. Stagnation Risk
        stagnation_risk = 0.0
        if years_at_company >= 4 and promotions == 0:
            stagnation_risk = 0.9
        elif years_at_company >= 3 and promotions == 0:
            stagnation_risk = 0.6
        elif years_at_company >= 5:
            stagnation_risk = 0.3

        # --- 3. Determine Outcomes ---
        
        # Target: Resigned
        total_churn_prob = (burnout_risk * 0.5) + (financial_risk * 0.3) + (stagnation_risk * 0.2)
        total_churn_prob = np.clip(total_churn_prob, 0.01, 0.95)
        resigned = random.random() < total_churn_prob
        
        # Feature: Satisfaction Score (Symptom)
        raw_sat = 4.8 - (burnout_risk * 3.0) - (financial_risk * 2.0) - (stagnation_risk * 1.5)
        raw_sat += np.random.normal(0, 0.5)
        satisfaction = max(1.0, min(5.0, round(raw_sat, 2)))
        
        # Other features
        remote_freq = random.choice([0, 20, 50, 80, 100])
        team_size = random.randint(3, 20)
        training_hours = random.randint(0, 80)
        sick_days = random.randint(0, 15)

        data.append({
            'Employee_ID': i + 1,
            'Department': dept,
            'Gender': gender,
            'Age': age,
            'Job_Title': title,
            'Hire_Date': hire_date,
            'Years_At_Company': years_at_company,
            'Education_Level': education,
            'Performance_Score': performance,
            'Monthly_Salary': salary,
            'Work_Hours_Per_Week': work_hours,
            'Projects_Handled': projects,
            'Overtime_Hours': overtime,
            'Sick_Days': sick_days,
            'Remote_Work_Frequency': remote_freq,
            'Team_Size': team_size,
            'Training_Hours': training_hours,
            'Promotions': promotions,
            'Employee_Satisfaction_Score': satisfaction,
            'Resigned': resigned
        })

    df = pd.DataFrame(data)
    print(f"Data Generated. Splitting...")

    # Folder Setup
    output_dir = 'data/processed_v9'
    os.makedirs(output_dir, exist_ok=True)
    
    # Preprocessing for Split
    # Drop non-features for X (but keep them for now, split first then drop?)
    # Usually we save raw features in X.
    
    X = df.drop(columns=['Resigned'])
    y = df[['Resigned']] # Keep as DataFrame for consistency
    
    # Train / Model / Test Split (Train 70%, Val 15%, Test 15%)
    X_train, X_temp, y_train, y_temp = train_test_split(X, y, test_size=0.3, random_state=42)
    X_val, X_test, y_val, y_test = train_test_split(X_temp, y_temp, test_size=0.5, random_state=42)
    
    # Save
    X_train.to_csv(f'{output_dir}/X_train.csv', index=False)
    y_train.to_csv(f'{output_dir}/y_train.csv', index=False)
    X_val.to_csv(f'{output_dir}/X_val.csv', index=False)
    y_val.to_csv(f'{output_dir}/y_val.csv', index=False)
    X_test.to_csv(f'{output_dir}/X_test.csv', index=False)
    y_test.to_csv(f'{output_dir}/y_test.csv', index=False)
    
    print(f"✅ Saved scaled dataset to {output_dir}")
    print(f"Train: {len(X_train)}, Val: {len(X_val)}, Test: {len(X_test)}")
    print(f"Overall Churn Rate: {df['Resigned'].mean():.2%}")

if __name__ == "__main__":
    generate_v9_data()
