"""
HR Analytics Dashboard - Configuration
"""

# Dashboard settings
DASHBOARD_TITLE = "HR Analytics Dashboard"
DASHBOARD_ICON = ""
VERSION = "2.1.0"

# Model paths
MODEL_PATH = "AI/production/v9_causal.txt"
SCALER_PATH = "AI/production/scaler_v9.joblib"
ENCODERS_PATH = "AI/production/encoders_v9.joblib"
IMPUTATION_PATH = "AI/production/imputation_defaults_v9.joblib"

# Feature configuration (from preprocessor.py)
FEATURE_COLUMNS = [
    'Department', 'Gender', 'Age', 'Job_Title', 'Years_At_Company',
    'Education_Level', 'Performance_Score', 'Monthly_Salary',
    'Work_Hours_Per_Week', 'Projects_Handled', 'Overtime_Hours',
    'Sick_Days', 'Remote_Work_Frequency', 'Team_Size',
    'Training_Hours', 'Promotions'
]

CATEGORICAL_COLUMNS = ['Department', 'Gender', 'Job_Title', 'Education_Level']
NUMERICAL_COLUMNS = [
    'Age', 'Years_At_Company', 'Performance_Score', 'Monthly_Salary',
    'Work_Hours_Per_Week', 'Projects_Handled', 'Overtime_Hours',
    'Sick_Days', 'Remote_Work_Frequency', 'Team_Size',
    'Training_Hours', 'Promotions'
]

# Valid categorical values
VALID_DEPARTMENTS = ['Sales', 'IT', 'HR', 'Finance', 'Marketing', 'Customer Support', 'Engineering']
VALID_GENDERS = ['Male', 'Female']
VALID_JOB_TITLES = [
    # Customer Support
    'Support Agent', 'Support Specialist', 'Support Team Lead', 'Customer Success Manager', 'Support Manager',
    # Engineering
    'Junior Engineer', 'Software Engineer', 'Senior Engineer', 'Tech Lead', 'Engineering Manager',
    # Finance
    'Accountant', 'Financial Analyst', 'Senior Accountant', 'Finance Lead', 'Finance Manager',
    # HR
    'HR Assistant', 'Recruiter', 'HR Specialist', 'HR Business Partner', 'HR Manager',
    # IT
    'IT Support', 'System Administrator', 'DevOps Engineer', 'IT Lead', 'IT Manager',
    # Marketing
    'Marketing Coordinator', 'Content Specialist', 'Marketing Specialist', 'Marketing Lead', 'Marketing Manager',
    # Sales
    'Sales Representative', 'Account Executive', 'Senior Sales Rep', 'Sales Lead', 'Sales Manager'
]
VALID_EDUCATION = ['Bachelor', 'Master', 'PhD', 'High School']

# Risk thresholds
# Updated for v9_causal with monotonic work hours logic
# Distribution: ~35% High, ~20% Medium, ~45% Low
HIGH_RISK_THRESHOLD = 0.65
MEDIUM_RISK_THRESHOLD = 0.45

# UI Colors (professional palette)
COLORS = {
    'high_risk': '#ef4444',      # Red
    'medium_risk': '#f59e0b',    # Orange/Amber
    'low_risk': '#22c55e',       # Green
    'primary': '#3b82f6',        # Blue
    'secondary': '#6366f1',      # Indigo
    'background': '#09090b',     # Zinc-950
    'surface': '#18181b',        # Zinc-900
    'text': '#ffffff',           # White
}
