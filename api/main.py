from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func as sqlfunc
from fastapi.security import OAuth2PasswordRequestForm
import pandas as pd
import numpy as np
import io
import json
import os
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime

from api.services.model_service import model_service
from api.schemas.employee import EmployeeBase, EmployeeRisk, PredictionResponse, AnalysisResponse, TopFactor
from api.config import NUMERICAL_COLUMNS, FEATURE_COLUMNS
from api.database import init_db, get_db
from pydantic import BaseModel, EmailStr
from api.models import AnalysisSnapshot, User, Department, Employee, PredictionLog, AuditLog
from api.models.user import UserRole
from api.models.logs import SimulationType, AuditAction
from api.auth import create_access_token
from api.deps import get_current_user, RequireRole

class UserCreate(BaseModel):
    username: str
    password: str
    email: EmailStr
    role: UserRole
    department_id: Optional[int] = None

class UserStatusUpdate(BaseModel):
    is_active: bool

@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs("data", exist_ok=True)
    init_db()
    yield

app = FastAPI(title="HR Analytics API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def get_aggregate_shap_factors(shap_values, feature_names, top_n=4):
    mean_abs_shap = np.abs(shap_values).mean(axis=0)
    top_idx = np.argsort(mean_abs_shap)[-top_n:][::-1]
    return [
        {"name": feature_names[i], "impact": round(float(mean_abs_shap[i]), 3)}
        for i in top_idx
    ]

def compute_risk_histogram(predictions, bins=10):
    counts, edges = np.histogram(predictions, bins=bins, range=(0, 1))
    return [
        {"risk": round(float(edges[i]), 2), "count": int(counts[i])}
        for i in range(len(counts))
    ]

def compute_aggregate_stats(predictions, df_cols, shap_matrix, feature_names):
    """Compute the standard aggregate stats dict returned by upload & analysis endpoints."""
    top_factors = get_aggregate_shap_factors(shap_matrix, feature_names, top_n=4) if len(shap_matrix) > 0 else []
    risk_distribution = compute_risk_histogram(predictions, bins=10)
    
    raw_dept_counts = df_cols['Department'].value_counts().to_dict() if 'Department' in df_cols.columns else {}
    departments_count = {str(k): int(v) for k, v in raw_dept_counts.items()}
    
    raw_risk_dept = df_cols.groupby('Department')['churn_probability'].mean().to_dict() if 'Department' in df_cols.columns else {}
    risk_by_dept = {str(k): float(v) for k, v in raw_risk_dept.items()}
    
    # Advanced Strategic Metrics
    high_risk_mask = predictions >= 0.65
    
    high_performer_risk_count = 0
    high_performer_risk_by_dept = {}
    if 'Performance_Score' in df_cols.columns:
        hp_mask = (df_cols['Performance_Score'] >= 3.5) & high_risk_mask
        high_performer_risk_count = int(hp_mask.sum())
        if 'Department' in df_cols.columns:
            hp_dept_counts = df_cols[hp_mask].groupby('Department').size().to_dict()
            high_performer_risk_by_dept = {str(k): int(v) for k, v in hp_dept_counts.items()}
        
    projects_at_risk = 0
    projects_at_risk_by_dept = {}
    if 'Projects_Handled' in df_cols.columns:
        projects_at_risk = int(df_cols.loc[high_risk_mask, 'Projects_Handled'].sum())
        if 'Department' in df_cols.columns:
            proj_dept_counts = df_cols[high_risk_mask].groupby('Department')['Projects_Handled'].sum().to_dict()
            projects_at_risk_by_dept = {str(k): int(v) for k, v in proj_dept_counts.items()}
        
    risk_by_tenure = {}
    if 'Years_At_Company' in df_cols.columns:
        # Create bins: 0-1, 2-4, 5+
        bins = [-1, 1, 4, 100]
        labels = ['0-1 години (Свежи)', '2-4 години (Сърцевина)', '5+ години (Ветерани)']
        df_cols['Tenure_Group'] = pd.cut(df_cols['Years_At_Company'], bins=bins, labels=labels)
        raw_dict = df_cols.groupby('Tenure_Group', observed=False)['churn_probability'].mean().fillna(0).to_dict()
        risk_by_tenure = {str(k): float(v) for k, v in raw_dict.items()}

    avg_salary_by_dept = {}
    if 'Department' in df_cols.columns and 'Monthly_Salary' in df_cols.columns:
        raw_dict = df_cols.groupby('Department')['Monthly_Salary'].mean().fillna(0).to_dict()
        avg_salary_by_dept = {str(k): float(v) for k, v in raw_dict.items()}

    risk_by_satisfaction = {}
    if 'Employee_Satisfaction_Score' in df_cols.columns:
        satisfaction_series = df_cols['Employee_Satisfaction_Score'].round(1)
        raw_dict = df_cols.groupby(satisfaction_series)['churn_probability'].mean().fillna(0).to_dict()
        risk_by_satisfaction = {str(k): float(v) for k, v in raw_dict.items()}

    # SHAP Top Factors by Department
    factors_by_dept = {}
    if 'Department' in df_cols.columns and len(shap_matrix) > 0:
        for dept in departments_count.keys():
            dept_indices = df_cols[df_cols['Department'] == dept].index
            if len(dept_indices) > 0:
                dept_shap = shap_matrix[dept_indices]
                factors_by_dept[dept] = get_aggregate_shap_factors(dept_shap, feature_names, top_n=4)
    
    return {
        "total_employees": len(df_cols),
        "high_risk_count": int(high_risk_mask.sum()),
        "avg_risk": float(predictions.mean()),
        "avg_salary": float(df_cols['Monthly_Salary'].mean()) if 'Monthly_Salary' in df_cols.columns else 0.0,
        "avg_salary_by_department": avg_salary_by_dept,
        "top_risk_factors": top_factors,
        "factors_by_department": factors_by_dept,
        "risk_distribution": risk_distribution,
        "departments": departments_count,
        "risk_by_department": risk_by_dept,
        "high_performer_risk_count": high_performer_risk_count,
        "high_performer_risk_by_dept": high_performer_risk_by_dept,
        "projects_at_risk": projects_at_risk,
        "projects_at_risk_by_dept": projects_at_risk_by_dept,
        "risk_by_tenure": risk_by_tenure,
        "risk_by_satisfaction": risk_by_satisfaction,
    }

# ---------------------------------------------------------------------------
# Root
# ---------------------------------------------------------------------------

@app.get("/")
async def root():
    return {"message": "HR Analytics API is running"}

# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

@app.post("/api/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not user.check_password(form_data.password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    db.add(AuditLog(user_id=user.id, action=AuditAction.LOGIN))
    db.commit()
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer", "role": user.role.value}

# ---------------------------------------------------------------------------
# User Management (Admin Only)
# ---------------------------------------------------------------------------

@app.get("/api/users")
async def get_users(db: Session = Depends(get_db), current_user: User = Depends(RequireRole([UserRole.SYSTEM_ADMIN]))):
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "role": u.role.value,
            "is_active": u.is_active,
            "department_id": u.department_id,
            "created_at": u.created_at
        } for u in users
    ]

@app.post("/api/users")
async def create_user(user_in: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(RequireRole([UserRole.SYSTEM_ADMIN]))):
    if db.query(User).filter(User.username == user_in.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    if db.query(User).filter(User.email == user_in.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    db_user = User(
        username=user_in.username,
        email=user_in.email,
        role=user_in.role,
        department_id=user_in.department_id
    )
    db_user.set_password(user_in.password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return {"msg": "User created successfully", "id": db_user.id}

@app.delete("/api/users/{user_id}")
async def disable_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(RequireRole([UserRole.SYSTEM_ADMIN]))):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot disable your own account")
    user.is_active = False
    db.commit()
    return {"msg": "User disabled"}

@app.patch("/api/users/{user_id}/status")
async def update_user_status(user_id: int, status_update: UserStatusUpdate, db: Session = Depends(get_db), current_user: User = Depends(RequireRole([UserRole.SYSTEM_ADMIN]))):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id and not status_update.is_active:
        raise HTTPException(status_code=400, detail="Cannot disable your own account")
    user.is_active = status_update.is_active
    db.commit()
    return {"msg": f"User {'enabled' if user.is_active else 'disabled'} successfully"}

# ---------------------------------------------------------------------------
# Departments
# ---------------------------------------------------------------------------

@app.get("/api/departments")
async def get_departments(db: Session = Depends(get_db)):
    departments = db.query(Department).all()
    return [{"id": d.id, "name": d.name} for d in departments]

# ---------------------------------------------------------------------------
# Settings
# ---------------------------------------------------------------------------

ORG_SETTINGS_FILE = Path("AI/data/org_settings.json")

class OrgSettings(BaseModel):
    organization_name: str

@app.get("/api/organization")
async def get_organization():
    if not ORG_SETTINGS_FILE.exists():
        return {"organization_name": "Глобални Операции"}
    try:
        with open(ORG_SETTINGS_FILE, "r") as f:
            data = json.load(f)
            return {"organization_name": data.get("organization_name", "Глобални Операции")}
    except Exception:
        return {"organization_name": "Глобални Операции"}

@app.post("/api/organization")
async def update_organization(settings: OrgSettings, current_user: User = Depends(RequireRole([UserRole.SYSTEM_ADMIN]))):
    try:
        ORG_SETTINGS_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(ORG_SETTINGS_FILE, "w") as f:
            json.dump({"organization_name": settings.organization_name}, f)
        return {"msg": "Organization updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save settings: {str(e)}")

# ---------------------------------------------------------------------------
# Upload — creates a NEW AnalysisSnapshot (no deletion of old data)
# ---------------------------------------------------------------------------

@app.post("/api/upload/preview")
async def preview_data(
    file: UploadFile = File(...),
    current_user: User = Depends(RequireRole([UserRole.HR_MANAGER, UserRole.SYSTEM_ADMIN]))
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")
    try:
        content = await file.read()
        raw_df = pd.read_csv(io.BytesIO(content))
        # Get up to 5 rows for preview
        preview_rows = raw_df.head(5).to_dict(orient="records")
        # Get count and basic stats for columns to show them
        columns = raw_df.columns.tolist()
        total_rows = len(raw_df)
        return {
            "columns": columns,
            "preview_data": preview_rows,
            "total_rows": total_rows
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/upload")
async def upload_data(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole([UserRole.HR_MANAGER, UserRole.SYSTEM_ADMIN]))
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")
    try:
        content = await file.read()
        raw_df = pd.read_csv(io.BytesIO(content))
        df = model_service.clean_df(raw_df)
        predictions = model_service.predict(df)
        df['churn_probability'] = predictions
        shap_values = model_service.get_shap_values(df)

        # Auto-generate snapshot name: "Анализ — DD Mmm YYYY"
        dept_names_in_file = df['Department'].unique() if 'Department' in df.columns else []
        snapshot_name = f"Анализ — {datetime.utcnow().strftime('%d %b %Y %H:%M')}"

        # Create the snapshot (inactive until inserted; we activate it right after)
        snapshot = AnalysisSnapshot(
            name=snapshot_name,
            created_by=current_user.id,
            is_active=False,
        )
        db.add(snapshot)
        db.commit()
        db.refresh(snapshot)

        # Deactivate all other snapshots — the new one becomes active
        db.query(AnalysisSnapshot).filter(
            AnalysisSnapshot.id != snapshot.id
        ).update({"is_active": False})
        snapshot.is_active = True
        db.commit()

        # Upsert departments (shared across snapshots — dept names are stable)
        dept_map = {}
        for dname in dept_names_in_file:
            existing = db.query(Department).filter(Department.name == dname).first()
            if existing:
                dept_map[dname] = existing.id
            else:
                dept = Department(name=dname)
                db.add(dept)
                db.commit()
                db.refresh(dept)
                dept_map[dname] = dept.id

        # Insert employees + predictions scoped to this snapshot
        for i, row in df.iterrows():
            dept_name = row.get('Department', 'Unknown')
            dept_id = dept_map.get(dept_name)

            emp = Employee(
                analysis_id=snapshot.id,
                department_id=dept_id,
                first_name=f"Emp_{i}",
                last_name="",
                gender=row.get('Gender', 'Unknown'),
                age=int(row.get('Age', 30)),
                education_level=row.get('Education_Level', ''),
                job_title=row.get('Job_Title', ''),
                years_at_company=int(row.get('Years_At_Company', 0)),
                monthly_salary=float(row.get('Monthly_Salary', 0.0)),
                performance_score=float(row.get('Performance_Score', 3.0)),
                work_hours_per_week=row.get('Work_Hours_Per_Week'),
                projects_handled=row.get('Projects_Handled'),
                overtime_hours=row.get('Overtime_Hours'),
                sick_days=row.get('Sick_Days'),
                remote_work_frequency=row.get('Remote_Work_Frequency'),
                team_size=row.get('Team_Size'),
                training_hours=row.get('Training_Hours'),
                promotions=row.get('Promotions'),
            )
            db.add(emp)
            db.commit()
            db.refresh(emp)

            plog = PredictionLog(
                employee_id=emp.id,
                analysis_id=snapshot.id,
                initiated_by=current_user.id,
                predicted_risk=float(predictions[i]),
                simulation_type=SimulationType.ACTUAL,
                input_snapshot=row.to_dict(),
                shap_values=shap_values[i].tolist()
            )
            db.add(plog)

        db.commit()

        db.add(AuditLog(user_id=current_user.id, action=AuditAction.UPLOAD_DATA))
        db.commit()

        # Compute and cache aggregate stats
        agg = compute_aggregate_stats(predictions, df, shap_values, FEATURE_COLUMNS)
        agg["snapshot_id"] = snapshot.id
        agg["snapshot_name"] = snapshot.name
        agg["snapshot_created_at"] = snapshot.created_at.isoformat()

        snapshot.aggregate_stats = agg
        db.commit()

        return agg

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ---------------------------------------------------------------------------
# Analysis Snapshots — History endpoints
# ---------------------------------------------------------------------------

@app.get("/api/analyses")
async def list_analyses(
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole([UserRole.HR_MANAGER, UserRole.SYSTEM_ADMIN]))
):
    """List all analysis snapshots for history view."""
    snapshots = db.query(AnalysisSnapshot).order_by(AnalysisSnapshot.created_at.desc()).all()
    result = []
    for s in snapshots:
        stats = s.aggregate_stats or {}
        creator = db.query(User).filter(User.id == s.created_by).first()
        result.append({
            "id": s.id,
            "name": s.name,
            "created_at": s.created_at.isoformat(),
            "is_active": s.is_active,
            "created_by": creator.username if creator else "Unknown",
            "total_employees": stats.get("total_employees", 0),
            "high_risk_count": stats.get("high_risk_count", 0),
            "avg_risk": stats.get("avg_risk", 0.0),
        })
    return result

@app.get("/api/analyses/{analysis_id}/stats")
async def get_analysis_stats(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole([UserRole.HR_MANAGER, UserRole.SYSTEM_ADMIN]))
):
    """Return full aggregate stats for a specific snapshot."""
    snapshot = db.query(AnalysisSnapshot).filter(AnalysisSnapshot.id == analysis_id).first()
    if not snapshot:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return snapshot.aggregate_stats or {}

@app.patch("/api/analyses/{analysis_id}/activate")
async def activate_analysis(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole([UserRole.HR_MANAGER, UserRole.SYSTEM_ADMIN]))
):
    """Set an analysis snapshot as the active one (visible to Department Heads)."""
    snapshot = db.query(AnalysisSnapshot).filter(AnalysisSnapshot.id == analysis_id).first()
    if not snapshot:
        raise HTTPException(status_code=404, detail="Analysis not found")
    db.query(AnalysisSnapshot).update({"is_active": False})
    snapshot.is_active = True
    db.commit()
    return {"msg": f"Analysis '{snapshot.name}' is now active"}

@app.delete("/api/analyses/{analysis_id}")
async def delete_analysis(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole([UserRole.HR_MANAGER, UserRole.SYSTEM_ADMIN]))
):
    """Delete an analysis snapshot and its related data."""
    snapshot = db.query(AnalysisSnapshot).filter(AnalysisSnapshot.id == analysis_id).first()
    if not snapshot:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    was_active = snapshot.is_active
    
    # Due to cascading deletes or manual deletion, we might need to delete Employees and PredictionLogs
    db.query(PredictionLog).filter(PredictionLog.analysis_id == analysis_id).delete(synchronize_session=False)
    db.query(Employee).filter(Employee.analysis_id == analysis_id).delete(synchronize_session=False)
    db.delete(snapshot)
    db.commit()
    
    # If we deleted the active snapshot, make the most recent one active
    if was_active:
        latest = db.query(AnalysisSnapshot).order_by(AnalysisSnapshot.created_at.desc()).first()
        if latest:
            latest.is_active = True
            db.commit()
            
    return {"msg": "Analysis deleted successfully"}

@app.post("/api/reset")
async def reset_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole([UserRole.HR_MANAGER, UserRole.SYSTEM_ADMIN]))
):
    """Safe reset — deactivates all snapshots so the UI returns to the 'upload' state, but keeps data in history."""
    db.query(AnalysisSnapshot).update({"is_active": False})
    db.commit()
    return {"msg": "All analyses deactivated. Data preserved in history."}

# ---------------------------------------------------------------------------
# Employees
# ---------------------------------------------------------------------------

@app.get("/api/employees")
async def get_employees(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.is_admin():
        return []

    # Get the active snapshot
    active = db.query(AnalysisSnapshot).filter(AnalysisSnapshot.is_active == True).first()
    if not active:
        return []

    query = db.query(Employee).filter(Employee.analysis_id == active.id)
    if current_user.is_department_head():
        query = query.filter(Employee.department_id == current_user.department_id)

    employees = query.all()
    include_sensitive = current_user.is_hr_manager() or current_user.is_department_head()
    if include_sensitive:
        db.add(AuditLog(user_id=current_user.id, action=AuditAction.VIEW_SALARY))
        db.commit()

    return [emp.to_dict(include_sensitive=include_sensitive) for emp in employees]

# ---------------------------------------------------------------------------
# Analysis (individual employee)
# ---------------------------------------------------------------------------

@app.get("/api/analysis/{employee_id}")
async def get_analysis(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole([UserRole.HR_MANAGER, UserRole.DEPARTMENT_HEAD]))
):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    if current_user.is_department_head() and emp.department_id != current_user.department_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this department")

    db.add(AuditLog(user_id=current_user.id, action=AuditAction.VIEW_CHURN, target_employee_id=emp.id))
    db.commit()

    plog = db.query(PredictionLog).filter(PredictionLog.employee_id == emp.id).order_by(PredictionLog.created_at.desc()).first()
    if not plog:
        raise HTTPException(status_code=404, detail="Analysis not found")

    employee_row = pd.Series(plog.input_snapshot)
    shap_vals = np.array(plog.shap_values)
    top_factors = model_service.get_top_factors(employee_row, shap_vals)

    all_emps_snapshots = [p.input_snapshot for p in db.query(PredictionLog).filter(PredictionLog.simulation_type == SimulationType.ACTUAL).all()]
    if all_emps_snapshots:
        df_all = pd.DataFrame(all_emps_snapshots)
        avg_data = df_all[NUMERICAL_COLUMNS].mean().to_dict()
    else:
        avg_data = {}

    return {
        "employee": employee_row.to_dict(),
        "top_factors": top_factors,
        "avg_comparison": avg_data
    }

# ---------------------------------------------------------------------------
# What-If Prediction
# ---------------------------------------------------------------------------

@app.post("/api/predict")
async def predict_single(
    employee: EmployeeBase,
    current_user: User = Depends(RequireRole([UserRole.HR_MANAGER, UserRole.DEPARTMENT_HEAD])),
    db: Session = Depends(get_db)
):
    try:
        input_dict = employee.dict()
        input_df = pd.DataFrame([input_dict])
        prediction = model_service.predict(input_df)[0]
        db.add(AuditLog(user_id=current_user.id, action=AuditAction.RUN_SIMULATION))
        db.commit()
        return {"churn_probability": float(prediction)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---------------------------------------------------------------------------
# AI Strategic Insight
# ---------------------------------------------------------------------------

from api.services.llm_service import llm_service

class AIInsightRequest(BaseModel):
    employee_id: int
    changes: List[Dict]
    simulated_risk: float

from fastapi.responses import StreamingResponse

@app.post("/api/ai-insight")
async def get_ai_insight(
    req: AIInsightRequest,
    current_user: User = Depends(RequireRole([UserRole.HR_MANAGER, UserRole.DEPARTMENT_HEAD])),
    db: Session = Depends(get_db)
):
    try:
        emp = db.query(Employee).filter(Employee.id == req.employee_id).first()
        if not emp:
            raise HTTPException(status_code=404, detail="Employee not found")
            
        # Get actual current state
        plog = db.query(PredictionLog).filter(PredictionLog.employee_id == emp.id).order_by(PredictionLog.created_at.desc()).first()
        employee_data = plog.input_snapshot if plog else emp.to_dict()
        employee_data['churn_probability'] = plog.predicted_risk if plog else 0.5
        
        return StreamingResponse(
            llm_service.stream_strategic_insight(employee_data, req.changes, req.simulated_risk),
            media_type="text/plain"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---------------------------------------------------------------------------
# Department Stats (for Department Head)
# ---------------------------------------------------------------------------

@app.get("/api/department/stats")
async def get_department_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole([UserRole.DEPARTMENT_HEAD]))
):
    """Returns aggregated stats for the department_head's department in the ACTIVE analysis."""
    dept_id = current_user.department_id
    if not dept_id:
        raise HTTPException(status_code=400, detail="No department assigned to this user")

    active = db.query(AnalysisSnapshot).filter(AnalysisSnapshot.is_active == True).first()
    if not active:
        return {
            "department_name": "",
            "total_employees": 0,
            "high_risk_count": 0,
            "avg_risk": 0.0,
            "avg_salary": 0.0,
            "avg_satisfaction": None,
            "top_risk_factors": [],
            "risk_distribution": [],
            "no_data": True,
        }

    dept = db.query(Department).filter(Department.id == dept_id).first()
    employees = db.query(Employee).filter(
        Employee.analysis_id == active.id,
        Employee.department_id == dept_id
    ).all()

    if not employees:
        return {
            "department_name": dept.name if dept else "Unknown",
            "total_employees": 0,
            "high_risk_count": 0,
            "avg_risk": 0.0,
            "avg_salary": 0.0,
            "avg_satisfaction": None,
            "top_risk_factors": [],
            "risk_distribution": [],
            "no_data": True,
        }

    emp_ids = [e.id for e in employees]

    subq = (
        db.query(
            PredictionLog.employee_id,
            sqlfunc.max(PredictionLog.created_at).label("max_created")
        )
        .filter(PredictionLog.employee_id.in_(emp_ids), PredictionLog.analysis_id == active.id)
        .group_by(PredictionLog.employee_id)
        .subquery()
    )
    plogs = (
        db.query(PredictionLog)
        .join(subq, (PredictionLog.employee_id == subq.c.employee_id) &
                    (PredictionLog.created_at == subq.c.max_created))
        .all()
    )

    if not plogs:
        return {
            "department_name": dept.name if dept else "Unknown",
            "total_employees": len(employees),
            "high_risk_count": 0,
            "avg_risk": 0.0,
            "avg_salary": float(np.mean([e.monthly_salary for e in employees if e.monthly_salary])),
            "avg_satisfaction": None,
            "top_risk_factors": [],
            "risk_distribution": [],
            "no_data": True,
        }

    predictions = np.array([p.predicted_risk for p in plogs])
    shap_matrix = np.array([p.shap_values for p in plogs if p.shap_values])

    top_factors = []
    if len(shap_matrix) > 0:
        top_factors = get_aggregate_shap_factors(shap_matrix, FEATURE_COLUMNS, top_n=5)

    risk_distribution = compute_risk_histogram(predictions, bins=8)

    satisfaction_scores = []
    for p in plogs:
        snap = p.input_snapshot or {}
        score = snap.get("Employee_Satisfaction_Score")
        if score is not None:
            try:
                satisfaction_scores.append(float(score))
            except (ValueError, TypeError):
                pass
    avg_satisfaction = float(np.mean(satisfaction_scores)) if satisfaction_scores else None

    return {
        "department_name": dept.name if dept else "Unknown",
        "total_employees": len(employees),
        "high_risk_count": int((predictions >= 0.65).sum()),
        "avg_risk": float(predictions.mean()),
        "avg_salary": float(np.mean([e.monthly_salary for e in employees if e.monthly_salary])),
        "avg_satisfaction": avg_satisfaction,
        "top_risk_factors": top_factors,
        "risk_distribution": risk_distribution,
        "no_data": False,
    }
