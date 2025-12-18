from pymongo import MongoClient
from gridfs import GridFS
from app.core.config import settings

# Mongo client
client = MongoClient(settings.MONGO_URL)

# Database (YOUR DB NAME)
mongo_db = client[settings.MONGO_DB]

# Collections
remarks_collection = mongo_db["remarks"]
logs_collection = mongo_db["logs"]

# GridFS for file upload / download
fs = GridFS(mongo_db)

