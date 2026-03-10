"""
HR Analytics — FastAPI Dependencies (RBAC)
Provides `get_current_user` and `require_role` for route protection.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import List

from api.database import get_db
from api.models import User
from api.models.user import UserRole
from api.auth import decode_access_token

# The token URL tells FastAPI where to redirect Swagger UI for authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """
    Validates the bearer token and returns the current User object.
    Raises 401 Unauthorized if invalid.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
        
    username: str = payload.get("sub")
    if username is None:
        raise credentials_exception
        
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
        
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
        
    return user


class RequireRole:
    """
    Dependency generator for Role-Based Access Control (RBAC).
    
    Usage:
        @app.get("/endpoint")
        def endpoint(user = Depends(RequireRole([UserRole.HR_MANAGER]))):
            ...
    """
    def __init__(self, allowed_roles: List[UserRole]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user)):
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions to access this resource",
            )
        return current_user
