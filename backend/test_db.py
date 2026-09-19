"""
Simple test script to verify PostgreSQL database connection for SIH26002.
Usage:
    python backend/test_db.py
"""
import sys
from pathlib import Path

# Add project root to sys.path so imports work smoothly from anywhere
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

try:
    from backend.database import check_db_connection, DATABASE_URL
except ModuleNotFoundError:
    from database import check_db_connection, DATABASE_URL

print("=" * 60)
print("SIH26002 - Database Connection Test")
print("=" * 60)

# Mask the password when printing for security
if "@" in DATABASE_URL and ":" in DATABASE_URL:
    try:
        prefix, rest = DATABASE_URL.split("://", 1)
        user_pass, host_db = rest.split("@", 1)
        user = user_pass.split(":")[0]
        masked_url = f"{prefix}://{user}:******@{host_db}"
    except Exception:
        masked_url = "postgresql://<user>:******@<host>/<db>"
else:
    masked_url = DATABASE_URL

print(f"Testing connection to: {masked_url}")
print("-" * 60)

result = check_db_connection()

if result["status"] == "connected":
    print("SUCCESS: Connected to PostgreSQL database successfully!")
    print(f"Details: {result['message']}")
    print("=" * 60)
    sys.exit(0)
else:
    print("FAILED: Could not establish a connection to PostgreSQL.")
    print(f"Details: {result['message']}")
    print("-" * 60)
    print("TROUBLESHOOTING CHECKLIST:")
    print("1. Is PostgreSQL installed and running on port 5432?")
    print("2. Did you create the database 'sih26002'?")
    print("3. Did you copy .env.example to .env and put your actual PostgreSQL password?")
    print("=" * 60)
    sys.exit(1)
