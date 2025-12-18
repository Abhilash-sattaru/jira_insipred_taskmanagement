# UST Employee Management Backend

This is a FastAPI backend for employee management with MySQL and MongoDB.

## Setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Ensure MySQL and MongoDB are running on localhost with the configurations in `.env`.

3. Run the server:
   ```bash
   uvicorn app.main:app --reload
   ```

4. Access the API docs at http://localhost:8000/docs

## Database Setup

- MySQL: Create database `ust_employee_db`
- MongoDB: Database `ust_employee_logs` will be created automatically

Run seeding scripts if needed:
- `python scripts/seed_users.py`
- `python scripts/seed_employees.py`
- etc.
