from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.employee import Employee 
from app.database.mysql import get_db
from app.schemas.task_schema import (
    TaskCreate,
    AssignTaskSchema,
    UpdateTaskStatusSchema,
    TaskUpdate,
    TaskResponse,
)
from app.services.task_service import (
    create_task,
    assign_task,
    update_task_status,
    get_tasks_for_user,
    delete_task_by_id,
    # get_tasks_by_status_service,
)
from app.core.role_guard import require_role
from app.core.constants import Role, TaskStatus
from app.middleware.logger import log_action
from app.models.task import Task
from typing import Optional
from app.core.constants import Priority, TaskStatus, Role

router = APIRouter(
    prefix="/tasks",
    tags=["Tasks"],
    responses={
        401: {"description": "Unauthorized - Invalid or missing token"},
        403: {"description": "Forbidden - Insufficient permissions"},
        404: {"description": "Not Found - Task does not exist"},
        422: {"description": "Validation Error - Invalid input data"},
        500: {"description": "Internal Server Error - Something went wrong"}
    }
)


@router.get(
    "/",
    response_model=list[TaskResponse],
    summary="List Tasks",
    description="""
    Retrieve a list of tasks based on the authenticated user's role.

    **Role-based Access:**
    - **Admins/Managers**: Get all tasks in the system
    - **Developers**: Get only tasks assigned to them

    **Response:** List of task objects with full details including status, priority, assignments, etc.
    """
)
def list_tasks(
    db: Session = Depends(get_db),
    user: dict = Depends(require_role([Role.ADMIN, Role.MANAGER, Role.DEVELOPER]))
):
    """
    List all tasks based on user role.
    - Admins/Managers: All tasks
    - Developers: Only their assigned tasks
    """
    log_action("LIST_TASKS", "TASK", 0, user["e_id"])  # entity_id 0 for list
    # return all tasks (admins/managers) or filtered tasks for developers
    if user["role"] == Role.DEVELOPER.value:
        return get_tasks_for_user(db, user["role"], user["e_id"])
    return db.query(Task).all()


@router.get("/status/{status}", response_model=list[TaskResponse])
def list_tasks_by_status(
    status: TaskStatus,
    db: Session = Depends(get_db),
    user: dict = Depends(require_role([Role.ADMIN, Role.MANAGER]))
):
    return db.query(Task).filter(Task.status == status).all()


@router.get(
    "/{task_id}",
    response_model=TaskResponse,
    summary="Get Task Details",
    description="""
    Retrieve detailed information about a specific task by its ID.

    **Permissions:** All authenticated users (Admin, Manager, Developer) can view task details.

    **Path Parameters:**
    - `task_id`: Unique identifier of the task

    **Response:** Complete task object with all fields including creation/update timestamps.
    """
)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(require_role([Role.ADMIN, Role.MANAGER, Role.DEVELOPER]))
):
    log_action("GET_TASK", "TASK", task_id, user["e_id"])
    task = db.query(Task).filter(Task.t_id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.post(
    "/",
    response_model=TaskResponse,
    summary="Create New Task",
    description="""
    Create a new task in the system with all required details.

    **Required Fields:**
    - `title`: Task title
    - `description`: Detailed task description
    - `priority`: Task priority (HIGH/MEDIUM/LOW)
    - `expected_closure`: Expected completion date
    - `assigned_to`: Employee ID to assign the task to
    - `reviewer`: Employee ID who will review the task

    **Optional Fields:**
    - `created_by`: Override the creator (defaults to authenticated user)

    **Permissions:** Only Admins and Managers can create tasks.

    **Response:** Created task object with generated ID and timestamps.
    """
)
def create_task_api(
    payload: TaskCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(require_role([Role.ADMIN, Role.MANAGER]))
):
    """
    Create a new task.
    Requires ADMIN or MANAGER role.
    """
    task = create_task(db, payload, user["e_id"])
    log_action("CREATE_TASK", "TASK", task.t_id, user["e_id"])
    return task


@router.put(
    "/{task_id}/assign",
    summary="Assign Task to Employee",
    description="""
    Assign an existing task to a specific employee and optionally set a reviewer.

    **Required Fields:**
    - `assigned_to`: Employee ID to assign the task to

    **Optional Fields:**
    - `reviewer`: Employee ID who will review the completed task

    **Permissions:** Only Admins and Managers can assign tasks.

    **Validation:** Both assigned_to and reviewer (if provided) must be valid employee IDs.

    **Response:** Updated task object with new assignment details and timestamps.
    """
)
def assign_task_api(
    task_id: int,
    payload: AssignTaskSchema,
    db: Session = Depends(get_db),
    user: dict = Depends(require_role([Role.ADMIN, Role.MANAGER]))
):
    log_action("ASSIGN_TASK", "TASK", task_id, user["e_id"])
    return assign_task(db, task_id, payload, user["e_id"])


# @router.put("/{task_id}/status")
# def update_task_status_api(
#     task_id: int,
#     payload: UpdateTaskStatusSchema,
#     db: Session = Depends(get_db),
#     user: dict = Depends(require_role([Role.ADMIN, Role.MANAGER, Role.DEVELOPER]))
# ):
#     return update_task_status(db, task_id, payload, user["e_id"], user["role"])


@router.patch(
    "/{task_id}",
    summary="Update Task (Partial)",
    description="""
    Partially update an existing task with provided fields.

    **Updatable Fields (all optional):**
    - `title`: Update task title
    - `description`: Update task description
    - `assigned_to`: Reassign to different employee
    - `reviewer`: Change reviewer
    - `priority`: Update priority level
    - `status`: Update task status
    - `expected_closure`: Update expected completion date

    **Permissions:** Managers and Developers can update tasks (Developers can only update their assigned tasks).

    **Validation:** Employee IDs must be valid if provided.

    **Response:** Updated task object with new values and updated timestamp.
    """
)
def patch_task(
    task_id: int,
    payload: TaskUpdate,
    db: Session = Depends(get_db),
    user: dict = Depends(require_role([Role.MANAGER, Role.DEVELOPER]))
):
    log_action("PATCH_TASK", "TASK", task_id, user["e_id"])
    task = db.query(Task).filter(Task.t_id == task_id).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    update_data = payload.dict(exclude_unset=True)

    # Ensure 'assigned_to' is a valid 'e_id' or set it to None if no assignee
    if update_data.get('assigned_to') is not None:
        assigned_employee = db.query(Employee).filter(Employee.e_id == update_data['assigned_to']).first()
        if not assigned_employee:
            raise HTTPException(status_code=400, detail="Assigned employee does not exist")

    # Ensure 'reviewer' is a valid 'e_id' or set it to None if no reviewer
    if update_data.get('reviewer') is not None:
        reviewer_employee = db.query(Employee).filter(Employee.e_id == update_data['reviewer']).first()
        if not reviewer_employee:
            raise HTTPException(status_code=400, detail="Reviewer does not exist")

    # Update task fields
    for key, value in update_data.items():
        setattr(task, key, value)

    db.commit()
    db.refresh(task)
    return task




@router.delete(
    "/{task_id}",
    summary="Delete Task",
    description="""
    Permanently delete a task from the system.

    **Path Parameters:**
    - `task_id`: Unique identifier of the task to delete

    **Permissions:** Only Admins and Managers can delete tasks.

    **Note:** This action cannot be undone. All associated data will be removed.

    **Response:** Confirmation message with deleted task ID.
    """
)
def delete_task_api(
    task_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(require_role([Role.ADMIN, Role.MANAGER]))
):
    log_action("DELETE_TASK", "TASK", task_id, user["e_id"])
    return delete_task_by_id(db, task_id)