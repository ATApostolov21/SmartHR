"""
HR Analytics — Department Model
Represents an organizational unit (e.g. Engineering, Sales).
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship

from api.database import Base


class Department(Base):
    __tablename__ = "departments"

    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(String(255), nullable=True)
    created_at  = Column(DateTime, default=datetime.utcnow, nullable=False)

    # --- Relationships ---
    # All employees in this department
    employees = relationship("Employee", back_populates="department")

    # All users (department_heads) assigned to this department
    users = relationship("User", back_populates="department")

    def __repr__(self) -> str:
        return f"<Department {self.name!r}>"
