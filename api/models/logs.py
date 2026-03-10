"""
HR Analytics — Audit & Prediction Log Models

PredictionLog: tracks every ML churn analysis (who ran it, for whom, input data).
AuditLog:      tracks every access to sensitive data for GDPR compliance.
"""

import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, Enum
from sqlalchemy.orm import relationship

from api.database import Base


class SimulationType(str, enum.Enum):
    ACTUAL   = "actual"    # Real prediction from uploaded CSV data
    WHAT_IF  = "what_if"   # What-If simulator scenario (not saved to employee record)


class AuditAction(str, enum.Enum):
    LOGIN           = "LOGIN"
    VIEW_SALARY     = "VIEW_SALARY"
    VIEW_CHURN      = "VIEW_CHURN"
    RUN_SIMULATION  = "RUN_SIMULATION"
    EXPORT_REPORT   = "EXPORT_REPORT"
    UPLOAD_DATA     = "UPLOAD_DATA"
    VIEW_SHAP       = "VIEW_SHAP"


class PredictionLog(Base):
    """
    History of every ML prediction run.
    Links employee ↔ the hr_manager who initiated the analysis.
    """
    __tablename__ = "prediction_logs"

    id          = Column(Integer, primary_key=True, index=True)
    created_at  = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Who is being analysed
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)

    # Which analysis snapshot this belongs to
    analysis_id = Column(Integer, ForeignKey("analysis_snapshots.id"), nullable=True, index=True)

    # Who ran the analysis (hr_manager user_id)
    initiated_by = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)

    # ML Output
    predicted_risk  = Column(Float, nullable=False)
    simulation_type = Column(Enum(SimulationType), default=SimulationType.ACTUAL, nullable=False)

    # Snapshot of feature values used — ensures reproducibility and audit trail
    input_snapshot = Column(JSON, nullable=True)

    # SHAP explanation values at time of prediction
    shap_values = Column(JSON, nullable=True)

    # --- Relationships ---
    employee           = relationship("Employee", back_populates="predictions")
    initiated_by_user  = relationship("User",     back_populates="initiated_analyses")

    def __repr__(self) -> str:
        return (
            f"<PredictionLog id={self.id} "
            f"employee={self.employee_id} "
            f"risk={self.predicted_risk:.2f} "
            f"type={self.simulation_type.value}>"
        )


class AuditLog(Base):
    """
    GDPR compliance audit trail.
    Every access to salary, churn score, or sensitive export is recorded here.
    """
    __tablename__ = "audit_logs"

    id         = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Who performed the action
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # What action was performed
    action = Column(Enum(AuditAction), nullable=False)

    # Which employee's data was accessed (NULL for non-employee actions like LOGIN)
    target_employee_id = Column(Integer, ForeignKey("employees.id"), nullable=True, index=True)

    # Optional metadata (e.g. IP address, export filename)
    ip_address = Column(String(45), nullable=True)   # IPv4 or IPv6
    extra_data = Column(JSON, nullable=True)

    # --- Relationships ---
    user            = relationship("User",     back_populates="audit_entries")
    target_employee = relationship("Employee", back_populates="audit_entries")

    def __repr__(self) -> str:
        return (
            f"<AuditLog id={self.id} "
            f"user={self.user_id} "
            f"action={self.action.value}>"
        )
