"""
HR Analytics — Analysis Snapshot Model

Each AnalysisSnapshot represents one full dataset upload by an HR manager.
Employees and PredictionLogs are scoped to a snapshot, allowing historical
comparison and preventing data loss on re-upload.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship

from api.database import Base


class AnalysisSnapshot(Base):
    """
    A named, timestamped dataset upload.
    All employees and prediction logs for this upload are linked via analysis_id.
    Only one snapshot can be 'active' at a time — that is what Department Heads see.
    """
    __tablename__ = "analysis_snapshots"

    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String(128), nullable=False)
    created_at  = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Who uploaded
    created_by  = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Only one snapshot is active — department heads see this one
    is_active   = Column(Boolean, default=False, nullable=False)

    # Key aggregate stats cached at upload time (total, high_risk, avg_risk, etc.)
    aggregate_stats = Column(JSON, nullable=True)

    # --- Relationships ---
    employees     = relationship("Employee", back_populates="analysis")
    creator       = relationship("User", foreign_keys=[created_by])

    def __repr__(self) -> str:
        return f"<AnalysisSnapshot id={self.id} name={self.name!r} active={self.is_active}>"
