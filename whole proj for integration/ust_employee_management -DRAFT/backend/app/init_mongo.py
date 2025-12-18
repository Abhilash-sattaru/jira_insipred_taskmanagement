from datetime import datetime
from app.database.mongodb import mongo_db

def init_mongo():
    # Insert a dummy remark
    mongo_db.remarks.insert_one({
        "task_id": 0,
        "comment": "MongoDB initialization",
        "commented_by": 0,
        "created_at": datetime.utcnow()
    })

    # Insert a dummy log
    mongo_db.logs.insert_one({
        "action": "INIT",
        "entity_type": "SYSTEM",
        "entity_id": 0,
        "performed_by": 0,
        "timestamp": datetime.utcnow()
    })

    print("✅ MongoDB database and collections created")

if __name__ == "__main__":
    init_mongo()
