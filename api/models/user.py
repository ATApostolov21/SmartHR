"""
HR Analytics — User Model
Handles authentication, roles, and the hr_manager → department_head hierarchy.
"""

import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from werkzeug.security import generate_password_hash, check_password_hash

from api.database import Base


class UserRole(str, enum.Enum):
    SYSTEM_ADMIN    = "system_admin"
    HR_MANAGER      = "hr_manager"
    DEPARTMENT_HEAD = "department_head"


class User(Base):
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True, index=True)
    username      = Column(String(64),  unique=True, nullable=False, index=True)
    email         = Column(String(120), unique=True, nullable=False, index=True)
    password_hash = Column(String(256), nullable=False)
    role          = Column(Enum(UserRole), nullable=False, default=UserRole.DEPARTMENT_HEAD)

    # Department link — only populated for department_head role
    # NULL for system_admin and hr_manager
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True, index=True)

    # Hierarchy: department_head reports to one hr_manager
    # Self-referencing FK: users.managed_by → users.id
    # NULL for system_admin and hr_manager
    managed_by = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)

    is_active  = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_login = Column(DateTime, nullable=True)

    # --- Relationships ---
    # Department heads supervised by this hr_manager
    subordinates = relationship(
        "User",
        backref="manager",
        foreign_keys=[managed_by],
        remote_side=[id],
    )

    # The department this user is assigned to (department_head only)
    department = relationship("Department", back_populates="users")

    # Analyses this user has initiated (hr_manager only)
    initiated_analyses = relationship("PredictionLog", back_populates="initiated_by_user")

    # Audit trail — every sensitive action performed by this user
    audit_entries = relationship("AuditLog", back_populates="user")

    # --- Security Methods ---
    def set_password(self, password: str) -> None:
        """Hash and store password. Never store plaintext."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        """Verify a plaintext password against the stored hash."""
        return check_password_hash(self.password_hash, password)

    def is_admin(self) -> bool:
        return self.role == UserRole.SYSTEM_ADMIN

    def is_hr_manager(self) -> bool:
        return self.role == UserRole.HR_MANAGER

    def is_department_head(self) -> bool:
        return self.role == UserRole.DEPARTMENT_HEAD

    def __repr__(self) -> str:
        return f"<User {self.username!r} role={self.role.value}>"
