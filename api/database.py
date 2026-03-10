"""
HR Analytics - Database Engine & Session Factory
SQLAlchemy setup — swap SQLite for PostgreSQL by changing DATABASE_URL only.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Database location — stored in /data/ folder (gitignored)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'AI', 'data', 'hr_analytics.db')}"

engine = create_engine(
    DATABASE_URL,
    # SQLite-specific: allow usage across threads (needed for FastAPI)
    connect_args={"check_same_thread": False},
    echo=False,  # Set to True for SQL query logging during development
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """
    FastAPI dependency — yields a DB session per request, always closes it.
    Usage: db: Session = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def seed_admin():
    """Create a default system admin account if no users exist."""
    from api.models.user import User, UserRole
    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            admin = User(
                username="admin",
                email="admin@dzi.bg",
                role=UserRole.SYSTEM_ADMIN,
                is_active=True
            )
            admin.set_password("admin123")
            db.add(admin)
            db.commit()
            print("✓ Default admin account created (admin/admin123)")
    except Exception as e:
        print(f"Error seeding admin: {e}")
        db.rollback()
    finally:
        db.close()


def init_db():
    """
    Create all tables defined in models if they don't exist yet.
    Called once at application startup.
    """
    # Import all models so Base knows about them before create_all()
    from api.models import user, department, employee, logs, analysis  # noqa: F401
    Base.metadata.create_all(bind=engine)
    print("✓ Database tables initialized")
    seed_admin()
