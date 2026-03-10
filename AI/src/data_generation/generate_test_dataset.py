"""
Test Dataset Generator for HR Analytics Dashboard
With REALISTIC Department-Specific Job Titles

"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

# Set seed for reproducibility
np.random.seed(42)
random.seed(42)

# Configuration
N_ROWS = 3000

# =============================================================================
# DEPARTMENT-SPECIFIC JOB TITLES
# =============================================================================
DEPARTMENTS = ['Customer Support', 'Engineering', 'Finance', 'HR', 'IT', 'Marketing', 'Sales']

# Realistic job titles per department
DEPARTMENT_JOB_TITLES = {
    'Customer Support': ['Support Agent', 'Support Specialist', 'Support Team Lead', 'Customer Success Manager', 'Support Manager'],
    'Engineering': ['Junior Engineer', 'Software Engineer', 'Senior Engineer', 'Tech Lead', 'Engineering Manager'],
    'Finance': ['Accountant', 'Financial Analyst', 'Senior Accountant', 'Finance Lead', 'Finance Manager'],
    'HR': ['HR Assistant', 'Recruiter', 'HR Specialist', 'HR Business Partner', 'HR Manager'],
    'IT': ['IT Support', 'System Administrator', 'DevOps Engineer', 'IT Lead', 'IT Manager'],
    'Marketing': ['Marketing Coordinator', 'Content Specialist', 'Marketing Specialist', 'Marketing Lead', 'Marketing Manager'],
    'Sales': ['Sales Representative', 'Account Executive', 'Senior Sales Rep', 'Sales Lead', 'Sales Manager']
}

# Job title seniority levels (0=entry, 4=manager)
JOB_TITLE_LEVELS = {
    # Customer Support
    'Support Agent': 0, 'Support Specialist': 1, 'Support Team Lead': 3, 
    'Customer Success Manager': 4, 'Support Manager': 4,
    # Engineering
    'Junior Engineer': 0, 'Software Engineer': 1, 'Senior Engineer': 2, 
    'Tech Lead': 3, 'Engineering Manager': 4,
    # Finance
    'Accountant': 0, 'Financial Analyst': 1, 'Senior Accountant': 2, 
    'Finance Lead': 3, 'Finance Manager': 4,
    # HR
    'HR Assistant': 0, 'Recruiter': 1, 'HR Specialist': 2, 
    'HR Business Partner': 3, 'HR Manager': 4,
    # IT
    'IT Support': 0, 'System Administrator': 1, 'DevOps Engineer': 2, 
    'IT Lead': 3, 'IT Manager': 4,
    # Marketing
    'Marketing Coordinator': 0, 'Content Specialist': 1, 'Marketing Specialist': 2, 
    'Marketing Lead': 3, 'Marketing Manager': 4,
    # Sales
    'Sales Representative': 0, 'Account Executive': 1, 'Senior Sales Rep': 2, 
    'Sales Lead': 3, 'Sales Manager': 4
}

# Get all unique job titles
ALL_JOB_TITLES = sorted(set(title for titles in DEPARTMENT_JOB_TITLES.values() for title in titles))

GENDERS = ['Female', 'Male']
EDUCATION_LEVELS = ['Bachelor', 'High School', 'Master', 'PhD']

# Department weights
dept_weights = [0.15, 0.15, 0.12, 0.10, 0.18, 0.12, 0.18]
gender_weights = [0.48, 0.52]
education_weights = [0.45, 0.25, 0.22, 0.08]


def get_job_title_for_department(department: str, years: int, performance: int) -> str:
    """
    Get appropriate job title based on department, years of experience, and performance.
    More experienced and high-performing employees get senior titles.
    """
    titles = DEPARTMENT_JOB_TITLES[department]
    
    # Calculate expected level based on years and performance
    base_level = min(years // 2, 3)  # 0-1y=0, 2-3y=1, 4-5y=2, 6+y=3
    perf_bonus = 1 if performance >= 4 else 0
    expected_level = min(base_level + perf_bonus, 4)
    
    # Add some randomness
    actual_level = max(0, min(4, expected_level + np.random.randint(-1, 2)))
    
    return titles[actual_level]


def generate_hire_date(years_at_company: int) -> str:
    """Generate a hire date based on years at company."""
    today = datetime(2026, 1, 26)
    hire_date = today - timedelta(days=365 * years_at_company + random.randint(0, 365))
    return hire_date.strftime('%Y-%m-%d %H:%M:%S.%f')


def calculate_salary(job_title: str, education: str, years: int, performance: int) -> float:
    """Calculate monthly salary based on job title level, education, years and performance."""
    level = JOB_TITLE_LEVELS.get(job_title, 1)
    
    # Base salary by level
    base_salaries = {
        0: 3500,  # Entry level
        1: 4500,  # Junior/Specialist
        2: 5500,  # Senior
        3: 7000,  # Lead
        4: 8500   # Manager
    }
    
    education_multipliers = {
        'High School': 1.0,
        'Bachelor': 1.1,
        'Master': 1.2,
        'PhD': 1.35
    }
    
    salary = base_salaries.get(level, 5000)
    salary *= education_multipliers.get(education, 1.0)
    salary *= (1 + 0.03 * years)
    salary *= (0.85 + 0.05 * performance)
    salary *= np.random.uniform(0.9, 1.15)
    
    return round(salary / 50) * 50


def calculate_churn_probability(row: dict) -> float:
    """
    Calculate churn probability based on various factors.
    """
    prob = 0.20  # Base probability
    
    # =========================================================================
    # REFINED RISK FACTORS (Based on Edge Case Validation)
    # =========================================================================
    
    # 1. Salary & Overtime Interaction (The "Worth It" Factor)
    salary = row['Monthly_Salary']
    overtime = row['Overtime_Hours']
    work_hours = row['Work_Hours_Per_Week']
    
    # Base Salary Effect (Monotonic Decrease with diminishing returns)
    if salary < 3000:
        prob += 0.25
    else:
        # CAPPED reduction - money can't fix everything
        # Max reduction 25% (was 30% unconstrained)
        reduction = min(0.25, (salary - 3000) / 1000 * 0.02)
        prob -= reduction

    # Overtime Sensitivity based on Salary
    overtime_sensitivity = 1.0
    if salary > 9000:
        overtime_sensitivity = 0.5  # High tolerance but not immune (was 0.4)
    elif salary > 6000:
        overtime_sensitivity = 0.8  # Moderate tolerance (was 0.7)
    
    # Apply overtime risk with sensitivity
    if overtime > 5:
        increase = min(0.40, (overtime - 5) * 0.018) # Slightly more punishing
        prob += increase * overtime_sensitivity

    # apply work hours risk with sensitivity
    if work_hours > 40:
        extra = work_hours - 40
        prob += (0.015 * extra) * overtime_sensitivity # Slightly more punishing

    # 2. Training Hours (U-Shaped Curve)
    training = row['Training_Hours']
    if training < 20:
        prob += 0.12 # Stagnation (was 0.10)
    elif 20 <= training <= 60:
        prob -= 0.10 # Sweet spot
    elif training > 60:
        prob += (training - 60) * 0.003
        
    # 3. Remote Work (Monotonic Decrease)
    remote = row['Remote_Work_Frequency']
    if remote == 0:
        prob += 0.08
    else:
        prob -= min(0.08, remote * 0.001)

    # 4. Performance (U-shaped)
    performance = row['Performance_Score']
    if performance <= 2: prob += 0.15 
    elif performance == 5: prob -= 0.05

    # 5. Promotions (Stagnation is dangerous)
    promotions = row['Promotions']
    years = row['Years_At_Company']
    if promotions > 0:
        prob -= 0.05 * promotions
    elif years > 5:
        prob += 0.20 # Severe Stagnation (was 0.15 for >3)
    elif years > 3:
        prob += 0.10
        
    # 6. Satisfaction (Strong Independent Factor)
    # Even rich people quit if they are miserable
    satisfaction = row['Employee_Satisfaction_Score']
    if satisfaction < 2.0:
        prob += 0.45 # Massive penalty for misery (was 0.35)
    elif satisfaction < 3.0:
        prob += (3.0 - satisfaction) * 0.25
    else:
        prob -= (satisfaction - 3.0) * 0.08

    return max(0.02, min(0.98, prob))


def generate_dataset():
    """Generate the complete dataset with department-specific job titles."""
    print("Generating 3000-row test dataset with department-specific job titles...")
    
    data = []
    
    for i in range(N_ROWS):
        employee_id = i + 1
        
        # Basic demographics
        department = np.random.choice(DEPARTMENTS, p=dept_weights)
        gender = np.random.choice(GENDERS, p=gender_weights)
        age = int(np.clip(np.random.normal(38, 10), 22, 60))
        
        # Tenure and experience
        max_years = min(9, (age - 22))
        years_at_company = int(np.clip(np.random.exponential(3), 0, max_years))
        hire_date = generate_hire_date(years_at_company)
        
        # Performance (1-5)
        performance = int(np.clip(np.random.normal(3, 1.0), 1, 5))
        
        # Job title based on department and experience
        job_title = get_job_title_for_department(department, years_at_company, performance)
        
        # Education - higher for manager positions
        level = JOB_TITLE_LEVELS.get(job_title, 1)
        if level >= 3:
            ed_weights = [0.35, 0.10, 0.40, 0.15]
        elif level >= 2:
            ed_weights = [0.45, 0.15, 0.30, 0.10]
        else:
            ed_weights = education_weights
        education = np.random.choice(EDUCATION_LEVELS, p=ed_weights)
        
        # Salary
        salary = calculate_salary(job_title, education, years_at_company, performance)
        
        # Work characteristics
        work_hours = int(np.clip(np.random.normal(44, 9), 30, 60))
        projects = int(np.clip(np.random.exponential(17), 0, 50))
        overtime = int(np.clip(np.random.exponential(12), 0, 29))
        sick_days = int(np.clip(np.random.exponential(6), 0, 14))
        
        # Remote work
        remote_options = [0, 25, 50, 75, 100]
        if department in ['IT', 'Engineering', 'Finance']:
            remote_weights = [0.10, 0.15, 0.25, 0.30, 0.20]
        elif department in ['Customer Support', 'Sales']:
            remote_weights = [0.30, 0.25, 0.20, 0.15, 0.10]
        else:
            remote_weights = [0.20, 0.20, 0.20, 0.20, 0.20]
        remote_work = np.random.choice(remote_options, p=remote_weights)
        
        # Team size
        team_size = int(np.clip(np.random.normal(10, 5), 1, 19))
        
        # Training hours
        training_base = 30 if performance >= 4 else 45
        training_hours = int(np.clip(np.random.normal(training_base, 25), 0, 100))
        
        # Promotions
        promo_prob = min(0.7, 0.1 + 0.15 * performance + 0.05 * years_at_company)
        promotions = np.random.binomial(2, promo_prob)
        
        # Satisfaction score
        if np.random.random() < 0.15:
            satisfaction_base = 1.5 + np.random.random() * 1.0
        elif np.random.random() < 0.25:
            satisfaction_base = 2.5 + np.random.random() * 0.8
        else:
            satisfaction_base = 3.0
            satisfaction_base += 0.15 * (performance - 3)
            satisfaction_base -= 0.02 * (work_hours - 40)
            satisfaction_base -= 0.015 * overtime
            satisfaction_base += 0.005 * remote_work
            satisfaction_base += 0.1 * promotions
            satisfaction_base += np.random.normal(0, 0.6)
        
        satisfaction = float(np.clip(satisfaction_base, 1.0, 5.0))
        satisfaction = round(satisfaction, 2)
        
        row = {
            'Employee_ID': employee_id,
            'Department': department,
            'Gender': gender,
            'Age': age,
            'Job_Title': job_title,
            'Hire_Date': hire_date,
            'Years_At_Company': years_at_company,
            'Education_Level': education,
            'Performance_Score': performance,
            'Monthly_Salary': salary,
            'Work_Hours_Per_Week': work_hours,
            'Projects_Handled': projects,
            'Overtime_Hours': overtime,
            'Sick_Days': sick_days,
            'Remote_Work_Frequency': remote_work,
            'Team_Size': team_size,
            'Training_Hours': training_hours,
            'Promotions': promotions,
            'Employee_Satisfaction_Score': satisfaction
        }
        
        # Calculate resignation
        churn_prob = calculate_churn_probability(row)
        row['Resigned'] = np.random.random() < churn_prob
        
        data.append(row)
        
        if (i + 1) % 500 == 0:
            print(f"  Generated {i + 1} / {N_ROWS} records...")
    
    df = pd.DataFrame(data)
    
    # Print statistics
    print("\n" + "="*60)
    print("DATASET STATISTICS")
    print("="*60)
    print(f"Total records: {len(df)}")
    print(f"Resignation rate: {df['Resigned'].mean()*100:.1f}%")
    
    print(f"\nJob titles per department:")
    for dept in DEPARTMENTS:
        titles = df[df['Department'] == dept]['Job_Title'].unique()
        print(f"  {dept}: {', '.join(titles)}")
    
    print(f"\nJob Title distribution:")
    print(df['Job_Title'].value_counts())
    
    return df


if __name__ == "__main__":
    print("="*60)
    print("HR TEST DATASET GENERATOR")
    print("With Department-Specific Job Titles")
    print("="*60)
    print()
    
    # Generate dataset
    df = generate_dataset()
    
    # Save to CSV
    output_path = 'AI/data/test_dataset_3000.csv'
    df.to_csv(output_path, index=False)
    
    print(f"\n✓ Dataset saved to: {output_path}")
    print(f"  Shape: {df.shape}")
    
    # Also save the job titles list for encoder update
    print(f"\n✓ All job titles: {sorted(ALL_JOB_TITLES)}")
    
    print("\n" + "="*60)
    print("GENERATION COMPLETE")
    print("="*60)
