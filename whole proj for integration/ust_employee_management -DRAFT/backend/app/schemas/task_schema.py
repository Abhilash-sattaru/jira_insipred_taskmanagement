from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.core.constants import TaskStatus, Priority


# =========================
# CREATE TASK
# =========================
class TaskCreate(BaseModel):
    title: str
    description: str
    priority: Priority
    expected_closure: datetime
    assigned_to: int
    reviewer: int
    created_by: Optional[int] = None


# =========================
# ASSIGN TASK (ADMIN / MANAGER)
# =========================
class AssignTaskSchema(BaseModel):
    assigned_to: int
    reviewer: Optional[int] = None


# =========================
# UPDATE TASK STATUS
# =========================
class UpdateTaskStatusSchema(BaseModel):
    status: TaskStatus
    remark: Optional[str] = None


# =========================
# PATCH / PUT TASK (PARTIAL / FULL)
# =========================
# app/schemas/task_schema.py

from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.core.constants import TaskStatus, Priority

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assigned_to: Optional[int] = None  # Optional field
    reviewer: Optional[int] = None     # Optional field
    priority: Optional[Priority] = None
    status: Optional[TaskStatus] = None
    expected_closure: Optional[datetime] = None



# =========================
# TASK RESPONSE (GET APIs)
# =========================
class TaskResponse(BaseModel):
    t_id: int
    title: str
    description: str
    priority: Priority
    status: TaskStatus
    assigned_to: Optional[int]
    reviewer: Optional[int]
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
