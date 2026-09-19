import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

# 1. Load environment variables from .env file
# Explicitly checks both project root (SIH26002/.env) and backend/ (backend/.env)
root_env = Path(__file__).resolve().parent.parent / ".env"
backend_env = Path(__file__).resolve().parent / ".env"

if root_env.exists():
    load_dotenv(dotenv_path=root_env, override=True)
if backend_env.exists():
    load_dotenv(dotenv_path=backend_env, override=True)

# Also fallback to default search
load_dotenv(override=True)

# 2. Read DATABASE_URL from environment
# Default template provided if .env has not been created yet
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/sih26002"
)

# 3. Create SQLAlchemy Engine
# The engine manages database connection pooling and executes SQL
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # Checks if connection is alive before using it
)

# 4. Create SessionLocal factory
# Each request will get its own database session from this factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# 5. Base class for all database models (Tables)
Base = declarative_base()


# 6. Dependency for FastAPI endpoints
def get_db():
    """
    FastAPI dependency that provides a database session to an endpoint
    and ensures the session is closed when the request finishes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# 7. Helper function to test database connectivity
def check_db_connection():
    """
    Executes a simple 'SELECT 1' test query to verify PostgreSQL connectivity.
    Returns a dict with status and details.
    """
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {
            "status": "connected",
            "message": "PostgreSQL database connection is healthy"
        }
    except Exception as e:
        return {
            "status": "disconnected",
            "message": f"Could not connect to PostgreSQL: {str(e)}"
        }


# 8. Function to safely initialize database tables
def init_db():
    """
    Creates all database tables defined in models.py if they don't already exist.
    """
    try:
        from backend import models
    except ModuleNotFoundError:
        import models
    Base.metadata.create_all(bind=engine)
