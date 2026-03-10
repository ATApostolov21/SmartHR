"""
HR Analytics — Employee Model
Core HR data. monthly_salary and performance_score are sensitive (PII).
Access to these fields is controlled at the API layer via RBAC.
"""

from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean,
    DateTime, ForeignKey
)
from sqlalchemy.orm import relationship

from api.database import Base


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)

    # --- Personal Info ---
    first_name      = Column(String(64),  nullable=True)
    last_name       = Column(String(64),  nullable=True)
    gender          = Column(String(20),  nullable=False)
    age             = Column(Integer,     nullable=False)
    education_level = Column(String(50),  nullable=True)

    # --- Job Info ---
    job_title        = Column(String(100), nullable=False, index=True)
    years_at_company = Column(Integer,     default=0)

    # --- Sensitive Data (PII) ---
    # Access restricted by RBAC: only hr_manager role receives these via API
    # In production: replace Float with EncryptedType (sqlalchemy-utils)
    monthly_salary    = Column(Float, nullable=False)
    performance_score = Column(Float, default=3.0)

    # --- Work Metrics (ML Features) ---
    work_hours_per_week   = Column(Integer, nullable=True)
    projects_handled      = Column(Integer, nullable=True)
    overtime_hours        = Column(Integer, nullable=True)
    sick_days             = Column(Integer, nullable=True)
    remote_work_frequency = Column(Integer, nullable=True)
    team_size             = Column(Integer, nullable=True)
    training_hours        = Column(Integer, nullable=True)
    promotions            = Column(Integer, nullable=True)

    # --- Status ---
    is_active  = Column(Boolean,  default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # --- Foreign Keys ---
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False, index=True)
    analysis_id   = Column(Integer, ForeignKey("analysis_snapshots.id"), nullable=True, index=True)

    # --- Relationships ---
    department    = relationship("Department", back_populates="employees")
    analysis      = relationship("AnalysisSnapshot", back_populates="employees", foreign_keys=[analysis_id])
    predictions   = relationship("PredictionLog", back_populates="employee")
    audit_entries = relationship("AuditLog", back_populates="target_employee")

    # --- Serialization ---
    def to_dict(self, include_sensitive: bool = False) -> dict:
        """
        Serialize employee for API responses.
        By default, sensitive fields (salary, performance) are excluded.
        Pass include_sensitive=True only for hr_manager role.
        """
        data = {
            "id":               self.id,
            "job_title":        self.job_title,
            "department":       self.department.name if self.department else None,
            "age":              self.age,
            "gender":           self.gender,
            "education_level":  self.education_level,
            "years_at_company": self.years_at_company,
            "is_active":        self.is_active,
            # Latest risk score from most recent prediction
            "churn_probability": (
                self.predictions[-1].predicted_risk if self.predictions else None
            ),
        }
        if include_sensitive:
            data["monthly_salary"]    = self.monthly_salary
            data["performance_score"] = self.performance_score

        return data

    def __repr__(self) -> str:
        return f"<Employee id={self.id} title={self.job_title!r}>"
