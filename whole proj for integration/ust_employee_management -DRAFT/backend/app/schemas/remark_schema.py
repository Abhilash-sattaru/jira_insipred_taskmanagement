from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class RemarkCreate(BaseModel):
    task_id: int
    comment: str

class RemarkResponse(BaseModel):
    task_id: int
    comment: str
    commented_by: int
    created_at: datetime
    
class RemarkUpdateSchema(BaseModel):
    comment: Optional[str] = None