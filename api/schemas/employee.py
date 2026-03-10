from pydantic import BaseModel
from typing import List, Dict, Optional

class EmployeeBase(BaseModel):
    Department: str
    Gender: str
    Age: int
    Job_Title: str
    Years_At_Company: int
    Education_Level: str
    Performance_Score: int
    Monthly_Salary: float
    Work_Hours_Per_Week: int
    Projects_Handled: int
    Overtime_Hours: int
    Sick_Days: int
    Remote_Work_Frequency: int
    Team_Size: int
    Training_Hours: int
    Promotions: int

class EmployeeRisk(EmployeeBase):
    churn_probability: float

class PredictionResponse(BaseModel):
    churn_probability: float

class TopFactor(BaseModel):
    feature: str
    impact: float
    value: str | float | int

class AnalysisResponse(BaseModel):
    employee: EmployeeRisk
    top_factors: List[TopFactor]
    avg_comparison: Dict[str, float]
