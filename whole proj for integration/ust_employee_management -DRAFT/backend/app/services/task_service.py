from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime
from app.models.task import Task, TaskStatus
from app.models.employee import Employee
from app.models.user import User, UserStatus
from app.services.remark_service import add_remark
from sqlalchemy import and_
from app.database.mongodb import remarks_collection
from app.core.constants import Role, TaskStatus, Priority

def create_task(db: Session, data, created_by: int):

    task = Task(
        title=data.title,
        description=data.description,
        priority=data.priority,
        expected_closure=data.expected_closure,
        created_by=data.created_by or created_by,
        status=TaskStatus.TO_DO,
        assigned_to=data.assigned_to,
        reviewer=data.reviewer
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

def assign_task(db: Session, task_id: int, data, manager_id: int):
    task = db.query(Task).filter(Task.t_id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    employee = db.query(Employee).filter(Employee.e_id == data.assigned_to).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    if data.reviewer:
        reviewer = db.query(Employee).filter(Employee.e_id == data.reviewer).first()
        if not reviewer:
            raise HTTPException(status_code=404, detail="Reviewer not found")

    task.assigned_to = data.assigned_to
    task.assigned_by = manager_id
    task.assigned_at = datetime.utcnow()
    task.reviewer = data.reviewer

    db.commit()
    db.refresh(task)
    return task


def update_task_status(db: Session, task_id: int, data, user_id: int, role: str):
    task = db.query(Task).filter(Task.t_id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")


    current_status = task.status.value if hasattr(task.status, "value") else task.status
    new_status = data.status.value if hasattr(data.status, "value") else data.status

    # -------------------------
    # DEVELOPER RULES
    # -------------------------
    if role == "DEVELOPER":
        if task.assigned_to != user_id:
            raise HTTPException(status_code=403, detail="Not your task")

        allowed_transitions = {
            "TO_DO": "IN_PROGRESS",
            "IN_PROGRESS": "REVIEW"
        }

        if current_status not in allowed_transitions:
            raise HTTPException(status_code=400, detail="Invalid status transition")

        if allowed_transitions[current_status] != new_status:
            raise HTTPException(status_code=400, detail="Invalid status transition")

    # -------------------------
    # REVIEWER (MANAGER) RULES
    # -------------------------
    elif role == "MANAGER":
        if task.reviewer != user_id:
            raise HTTPException(status_code=403, detail="Not reviewer")

        if current_status == "REVIEW" and new_status == "DONE":
            task.actual_closure = datetime.utcnow()

        elif current_status == "REVIEW" and new_status == "IN_PROGRESS":
            if not data.remark:
                raise HTTPException(status_code=400, detail="Remark required")

            remarks_collection.insert_one({
                "task_id": task.t_id,
                "comment": data.remark,
                "commented_by": user_id,
                "created_at": datetime.utcnow()
            })
        else:
            raise HTTPException(status_code=400, detail="Invalid status transition")

    else:
        raise HTTPException(status_code=403, detail="Unauthorized role")

    # -------------------------
    # COMMON UPDATE
    # -------------------------
    task.status = new_status
    task.updated_by = user_id
    task.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(task)
    return task

# def get_tasks_by_status_service(status: TaskStatus, db: Session):
#     """
#     Fetch all tasks by status
#     """
#     return db.query(Task).filter(Task.status == status).all()

def get_tasks_for_user(db: Session, role: str, user_id: int):
    if role == "ADMIN":
        return db.query(Task).all()
    if role == "MANAGER":
        return db.query(Task).filter(
            (Task.created_by == user_id) | (Task.reviewer == user_id)
        ).all()
    return db.query(Task).filter(Task.assigned_to == user_id).all()


def delete_task_by_id(db: Session, task_id: int):
    task = db.query(Task).filter(Task.t_id == task_id).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()

    return {
        "message": "Task deleted successfully",
        "task_id": task_id
    }