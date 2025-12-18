from datetime import datetime, timedelta

from app.database.mysql import SessionLocal
from app.models.task import Task
from app.models.employee import Employee   # 🔥 IMPORTANT
from app.core.constants import TaskStatus, Priority

db = SessionLocal()

def seed_tasks():
    tasks = []

    now = datetime.now()

    for i in range(1, 11):
        task = Task(
            title=f"Task {i}",
            description=f"Complete module {i}",
            created_by=2,          # Manager
            assigned_by=2,
            assigned_to=3 + (i % 5),
            reviewer=2,
            priority=Priority.HIGH if i % 2 == 0 else Priority.MEDIUM,
            status=TaskStatus.TO_DO,
            expected_closure=now + timedelta(days=7),
        )
        tasks.append(task)

    db.add_all(tasks)
    db.commit()
    print("✅ Tasks seeded (10 records)")

if __name__ == "__main__":
    seed_tasks()
