from app.database.mongodb import fs
from fastapi import UploadFile
from bson import ObjectId

def save_profile_picture(e_id: int, file: UploadFile) -> str:
    content = file.file.read()

    file_id = fs.put(
        content,
        filename=file.filename,
        content_type=file.content_type,
        metadata={
            "employee_id": e_id,
            "type": "profile_picture"
        }
    )
    return str(file_id)


# def get_profile_picture(file_id: str):
#     return fs.get(ObjectId(file_id))
