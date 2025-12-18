from datetime import datetime
from app.database.mongodb import task_logs_collection

def seed_task_logs():
    task_logs_collection.delete_many({})  # clean slate

    logs = [
        {
            "task_id": 1,
            "action": "TASK_CREATED",
            "performed_by": 2,
            "role": "MANAGER",
            "timestamp": datetime.utcnow()
        },
        {
            "task_id": 1,
            "action": "STATUS_CHANGED_TO_IN_PROGRESS",
            "performed_by": 4,
            "role": "DEVELOPER",
            "timestamp": datetime.utcnow()
        },
        {
            "task_id": 2,
            "action": "TASK_ASSIGNED",
            "performed_by": 3,
            "role": "MANAGER",
            "timestamp": datetime.utcnow()
        },
        {
            "task_id": 3,
            "action": "STATUS_CHANGED_TO_REVIEW",
            "performed_by": 6,
            "role": "DEVELOPER",
            "timestamp": datetime.utcnow()
        },
        {
            "task_id": 3,
            "action": "REVIEW_REJECTED",
            "performed_by": 2,
            "role": "MANAGER",
            "timestamp": datetime.utcnow()
        },
        {
            "task_id": 4,
            "action": "REVIEW_APPROVED",
            "performed_by": 1,
            "role": "ADMIN",
            "timestamp": datetime.utcnow()
        },
        {
            "task_id": 5,
            "action": "TASK_COMPLETED",
            "performed_by": 5,
            "role": "DEVELOPER",
            "timestamp": datetime.utcnow()
        },
        {
            "task_id": 6,
            "action": "TASK_CREATED",
            "performed_by": 2,
            "role": "MANAGER",
            "timestamp": datetime.utcnow()
        },
        {
            "task_id": 7,
            "action": "TASK_ASSIGNED",
            "performed_by": 3,
            "role": "MANAGER",
            "timestamp": datetime.utcnow()
        },
        {
            "task_id": 8,
            "action": "TASK_COMPLETED",
            "performed_by": 7,
            "role": "DEVELOPER",
            "timestamp": datetime.utcnow()
        }
    ]

    task_logs_collection.insert_many(logs)
    print("✅ MongoDB Task Logs seeded (10 records)")

if __name__ == "__main__":
    seed_task_logs()
