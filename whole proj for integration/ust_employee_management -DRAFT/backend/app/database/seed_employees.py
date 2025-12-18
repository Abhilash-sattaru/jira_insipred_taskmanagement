from app.database.mysql import SessionLocal
from app.models.employee import Employee

db = SessionLocal()

def seed_employees():
    employees = [
        Employee(name="Ramesh Kumar", email="ramesh@ust.com", designation="Admin", mgr_id=None),

        Employee(name="Suresh Rao", email="suresh@ust.com", designation="Manager", mgr_id=None),
        Employee(name="Anita Sharma", email="anita@ust.com", designation="Manager", mgr_id=None),

        Employee(name="Rahul Verma", email="rahul@ust.com", designation="Developer", mgr_id=2),
        Employee(name="Priya Singh", email="priya@ust.com", designation="Developer", mgr_id=2),
        Employee(name="Amit Patel", email="amit@ust.com", designation="Developer", mgr_id=2),

        Employee(name="Kiran Reddy", email="kiran@ust.com", designation="Developer", mgr_id=3),
        Employee(name="Sneha Iyer", email="sneha@ust.com", designation="Developer", mgr_id=3),
        Employee(name="Vikram Joshi", email="vikram@ust.com", designation="Developer", mgr_id=3),
        Employee(name="Neha Gupta", email="neha@ust.com", designation="Developer", mgr_id=3),
    ]

    db.add_all(employees)
    db.commit()
    print("✅ Indian Employees seeded (10 records)")

if __name__ == "__main__":
        seed_employees()
