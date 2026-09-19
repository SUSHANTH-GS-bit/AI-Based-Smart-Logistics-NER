"""
One-time migration: add client_record_id column to vehicle_locations and incidents tables.
Run from the SIH26002 project root:
    python -m backend.migrate_add_client_record_id
"""
import sys
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

try:
    from backend.database import engine
except ModuleNotFoundError:
    from database import engine

from sqlalchemy import text

MIGRATIONS = [
    "ALTER TABLE vehicle_locations ADD COLUMN IF NOT EXISTS client_record_id VARCHAR(100) UNIQUE",
    "ALTER TABLE incidents ADD COLUMN IF NOT EXISTS client_record_id VARCHAR(100) UNIQUE",
    "CREATE INDEX IF NOT EXISTS ix_vehicle_locations_client_record_id ON vehicle_locations (client_record_id)",
    "CREATE INDEX IF NOT EXISTS ix_incidents_client_record_id ON incidents (client_record_id)",
]

def run():
    with engine.connect() as conn:
        for sql in MIGRATIONS:
            try:
                conn.execute(text(sql))
                print(f"OK  : {sql[:60]}...")
            except Exception as e:
                print(f"SKIP: {sql[:60]}... ({e})")
        conn.commit()
    print("\nMigration complete.")

if __name__ == "__main__":
    run()
