import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta

def generate_dataset(num_records=1500, filename="test_dataset_history.csv"):
    np.random.seed(42)
    random.seed(42)
    
    departments = ["Finance", "Customer Support", "IT", "Sales", "Engineering", "Marketing", "HR"]
    genders = ["Male", "Female"]
    education_levels = ["High School", "Bachelor", "Master", "PhD"]
    
    # Generate Job Titles per department
    job_titles = {
        "Finance": ["Accountant", "Senior Accountant", "Financial Analyst", "Finance Manager", "Finance Lead"],
        "Customer Support": ["Support Specialist", "Support Agent", "Support Team Lead", "Customer Success Manager", "Support Manager"],
        "IT": ["IT Support", "System Administrator", "DevOps Engineer", "IT Lead", "IT Manager"],
        "Sales": ["Sales Representative", "Account Executive", "Senior Sales Rep", "Sales Lead", "Sales Manager"],
        "Engineering": ["Junior Engineer", "Software Engineer", "Senior Engineer", "Tech Lead", "Engineering Manager"],
        "Marketing": ["Content Specialist", "Marketing Coordinator", "Marketing Specialist", "Marketing Lead", "Marketing Manager"],
        "HR": ["HR Assistant", "HR Specialist", "Recruiter", "HR Business Partner", "HR Manager"]
    }
    
    data = []
    end_date = datetime(2026, 1, 1)
    
    for i in range(1, num_records + 1):
        dept = random.choice(departments)
        job_title = random.choice(job_titles[dept])
        
        # Determine seniority proxy based on job title to make salary/age more realistic
        is_senior = "Senior" in job_title or "Lead" in job_title or "Manager" in job_title or "Partner" in job_title
        
        age = random.randint(30, 60) if is_senior else random.randint(22, 40)
        years_at_company = random.randint(2, 10) if is_senior else random.randint(0, 4)
        hire_date = end_date - timedelta(days=years_at_company * 365 + random.randint(0, 365))
        
        base_salary = {
            "Finance": 4000, "Customer Support": 3500, "IT": 4500,
            "Sales": 3800, "Engineering": 5000, "Marketing": 4000, "HR": 3800
        }[dept]
        
        salary_multiplier = 1.5 if is_senior else 1.0
        monthly_salary = int((base_salary * salary_multiplier) + random.randint(-500, 1500))
        
        # Risk factors (some correlation for realism)
        overtime = random.randint(10, 40) if is_senior else random.randint(0, 20)
        satisfaction = round(random.uniform(1.5, 4.5), 2)
        performance = random.randint(1, 5)
        
        # High risk proxy (for "Resigned" label roughly)
        resigned = (satisfaction < 2.5) or (overtime > 30 and performance > 3) or (monthly_salary < 4000 and age > 35)
        
        row = {
            "Employee_ID": i,
            "Department": dept,
            "Gender": random.choice(genders),
            "Age": age,
            "Job_Title": job_title,
            "Hire_Date": hire_date.strftime("%Y-%m-%d %H:%M:%S.000000"),
            "Years_At_Company": years_at_company,
            "Education_Level": random.choice(education_levels),
            "Performance_Score": performance,
            "Monthly_Salary": monthly_salary,
            "Work_Hours_Per_Week": random.randint(30, 60),
            "Projects_Handled": random.randint(1, 50),
            "Overtime_Hours": overtime,
            "Sick_Days": random.randint(0, 15),
            "Remote_Work_Frequency": random.choice([0, 25, 50, 75, 100]),
            "Team_Size": random.randint(2, 20),
            "Training_Hours": random.randint(0, 100),
            "Promotions": random.randint(0, 3),
            "Employee_Satisfaction_Score": satisfaction,
            "Resigned": bool(resigned)
        }
        data.append(row)
        
    df = pd.DataFrame(data)
    df.to_csv(filename, index=False)
    print(f"Dataset {filename} with {num_records} generated successfully.")

if __name__ == "__main__":
    generate_dataset(1500, "test_dataset_Q1.csv")
    generate_dataset(1600, "test_dataset_Q2.csv")
