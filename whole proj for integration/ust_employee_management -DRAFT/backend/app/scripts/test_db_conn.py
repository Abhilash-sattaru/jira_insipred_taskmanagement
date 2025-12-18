"""
Quick DB connectivity test script.
Run from repository root (backend folder):
  python .\app\scripts\test_db_conn.py

It will attempt to create a session and query up to 5 employees.
"""
from pprint import pprint
import traceback

from app.database.mysql import SessionLocal, engine
from app.models.employee import Employee


def main():
    print("Engine:", engine)
    s = None
    try:
        s = SessionLocal()
        print("Session created. Querying employees...")
        rows = s.query(Employee).limit(5).all()
        print(f"Found {len(rows)} employee(s)")
        out = []
        for r in rows:
            out.append({
                "e_id": getattr(r, "e_id", None),
                "name": getattr(r, "name", None),
                "email": getattr(r, "email", None),
                "designation": getattr(r, "designation", None),
            })
        pprint(out)
    except Exception:
        print("Error while connecting/querying DB:")
        traceback.print_exc()
    finally:
        if s:
            s.close()


if __name__ == "__main__":
    main()
