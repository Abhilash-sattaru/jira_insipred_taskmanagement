from datetime import datetime
from app.database.mongodb import remarks_collection

def seed_remarks():
    remarks_collection.delete_many({})  # clean slate

    remarks = [
        {
            "task_id": 1,
            "comment": "Initial task analysis completed",
            "user_e_id": 4,
            "file_id": None,
            "file_name": None,
            "created_at": datetime.utcnow()
        },
        {
            "task_id": 1,
            "comment": "Waiting for manager review",
            "user_e_id": 2,
            "file_id": None,
            "file_name": None,
            "created_at": datetime.utcnow()
        },
        {
            "task_id": 2,
            "comment": "API implementation done",
            "user_e_id": 5,
            "file_id": None,
            "file_name": None,
            "created_at": datetime.utcnow()
        },
        {
            "task_id": 3,
            "comment": "Bug found in validation logic",
            "user_e_id": 6,
            "file_id": None,
            "file_name": None,
            "created_at": datetime.utcnow()
        },
        {
            "task_id": 3,
            "comment": "Bug fixed and pushed",
            "user_e_id": 6,
            "file_id": None,
            "file_name": None,
            "created_at": datetime.utcnow()
        },
        {
            "task_id": 4,
            "comment": "Needs optimization",
            "user_e_id": 3,
            "file_id": None,
            "file_name": None,
            "created_at": datetime.utcnow()
        },
        {
            "task_id": 5,
            "comment": "Reviewed and approved",
            "user_e_id": 1,
            "file_id": None,
            "file_name": None,
            "created_at": datetime.utcnow()
        },
        {
            "task_id": 6,
            "comment": "UI integration pending",
            "user_e_id": 7,
            "file_id": None,
            "file_name": None,
            "created_at": datetime.utcnow()
        },
        {
            "task_id": 7,
            "comment": "Unit tests added",
            "user_e_id": 8,
            "file_id": None,
            "file_name": None,
            "created_at": datetime.utcnow()
        },
        {
            "task_id": 8,
            "comment": "Ready for deployment",
            "user_e_id": 2,
            "file_id": None,
            "file_name": None,
            "created_at": datetime.utcnow()
        }
    ]

    remarks_collection.insert_many(remarks)
    print("✅ MongoDB Remarks seeded (10 records)")

if __name__ == "__main__":
    seed_remarks()
