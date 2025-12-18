from sqlalchemy import Column, Integer, String, Text, Enum, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database.base import Base
import enum

class TaskPriority(enum.Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"

class TaskStatus(enum.Enum):
    TO_DO = "TO_DO"
    IN_PROGRESS = "IN_PROGRESS"
    REVIEW = "REVIEW"
    DONE = "DONE"

class Task(Base):
    __tablename__ = "tasks"

    t_id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)

    created_by = Column(Integer, ForeignKey("employees.e_id"), nullable=False)

    assigned_to = Column(Integer, ForeignKey("employees.e_id"), nullable=True)
    assigned_by = Column(Integer, ForeignKey("employees.e_id"), nullable=True)
    assigned_at = Column(DateTime, nullable=True)

    updated_by = Column(Integer, ForeignKey("employees.e_id"), nullable=True)
    updated_at = Column(DateTime, nullable=True)

    priority = Column(Enum(TaskPriority), nullable=False)
    status = Column(Enum(TaskStatus), default=TaskStatus.TO_DO)

    reviewer = Column(Integer, ForeignKey("employees.e_id"), nullable=True)

    expected_closure = Column(DateTime, nullable=False)
    actual_closure = Column(DateTime, nullable=True)

    created_at = Column(DateTime, server_default=func.now())
