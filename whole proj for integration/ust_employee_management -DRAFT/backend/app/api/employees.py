from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.schemas.employee_schema import (
    EmployeeCreate,
    EmployeeUpdate,
    EmployeeResponse
)
from app.services.employee_service import (
    create_employee,
    get_all_employees,
    get_employees_by_manager,
    update_employee,
    delete_employee,
)
from app.utils.response import success_response
from app.database.mysql import get_db
from app.middleware.logger import log_action
from app.core.role_guard import require_role
from app.core.constants import Role

from fastapi import UploadFile, File
from fastapi.responses import StreamingResponse

from app.services.employee_file_service import (
    save_profile_picture,
    # get_profile_picture
)


router = APIRouter(
    prefix="/employees",
    tags=["Employees"],
    responses={
        401: {"description": "Unauthorized - Invalid or missing token"},
        403: {"description": "Forbidden - Insufficient permissions"},
        404: {"description": "Not Found - Employee does not exist"},
        422: {"description": "Validation Error - Invalid input data"},
        500: {"description": "Internal Server Error - Something went wrong"}
    }
)

@router.post(
    "/{e_id}/profile-picture",
    summary="Upload Employee Profile Picture",
    description="""
    Upload and store a profile picture for a specific employee.

    **Path Parameters:**
    - `e_id`: Employee ID

    **File Requirements:**
    - Must be an image file (JPEG, PNG, etc.)
    - Maximum file size depends on server configuration

    **Permissions:** Only Admins and Managers can upload profile pictures.

    **Response:** Success message with file ID for future reference.
    """
)
def upload_profile_picture(
    e_id: int,
    file: UploadFile = File(...),
    user: dict = Depends(require_role([Role.ADMIN, Role.MANAGER]))
):
    log_action("UPLOAD_PROFILE_PICTURE", "EMPLOYEE", e_id, user["e_id"])
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files allowed")

    file_id = save_profile_picture(e_id, file)

    return {
        "message": "Profile picture uploaded successfully",
        "file_id": file_id
    }
    
# @router.get("/profile-picture/{file_id}")
# def fetch_profile_picture(file_id: str):
#     grid_file = get_profile_picture(file_id)

#     return StreamingResponse(
#         grid_file,
#         media_type=grid_file.content_type
#     )


# CREATE – ADMIN
@router.post(
    "/",
    response_model=EmployeeResponse,
    summary="Create New Employee",
    description="""
    Add a new employee to the system with complete profile information.

    **Required Fields:**
    - `name`: Employee full name
    - `email`: Unique email address
    - `department`: Department name
    - `position`: Job position/title
    - `manager_id`: ID of employee's manager (can be null for top-level)

    **Permissions:** Only Admins can create employees.

    **Validation:** Email must be unique across the system.

    **Response:** Created employee object with generated ID.
    """
)
def create(
    payload: EmployeeCreate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_role([Role.ADMIN]))
):
    emp = create_employee(db, payload)
    log_action("CREATE_EMPLOYEE", "EMPLOYEE", emp.e_id, 0)
    return emp


@router.get(
    "/",
    response_model=list[EmployeeResponse],
    summary="List All Employees",
    description="""
    Retrieve a complete list of all employees in the system.

    **Permissions:** Only Admins can view all employees.

    **Response:** Array of employee objects with full profile information.
    """
)
def get_all(
    db: Session = Depends(get_db),
    user: dict = Depends(require_role([Role.ADMIN]))
):
    log_action("GET_ALL_EMPLOYEES", "EMPLOYEE", 0, user["e_id"])
    return get_all_employees(db)


@router.get(
    "/me",
    response_model=list[EmployeeResponse],
    summary="List My Team Members",
    description="""
    Get a list of employees who report to the authenticated manager.

    **Permissions:** Only Managers can access this endpoint.

    **Logic:** Returns employees where the authenticated user is listed as their manager.

    **Response:** Array of employee objects under the manager's supervision.
    """
)
def get_my_employees(
    db: Session = Depends(get_db),
    user: dict = Depends(require_role([Role.MANAGER]))
):
    log_action("GET_MY_EMPLOYEES", "EMPLOYEE", 0, user["e_id"])
    # user contains e_id from token
    return get_employees_by_manager(db, user["e_id"])


# UPDATE – ADMIN
@router.put(
    "/{e_id}",
    response_model=EmployeeResponse,
    summary="Update Employee",
    description="""
    Update an existing employee's information.

    **Path Parameters:**
    - `e_id`: Employee ID to update

    **Updatable Fields (all optional):**
    - `name`: Update employee name
    - `email`: Update email (must be unique)
    - `department`: Update department
    - `position`: Update job position
    - `manager_id`: Update manager assignment

    **Permissions:** Only Admins can update employees.

    **Validation:** Email uniqueness is enforced if changed.

    **Response:** Updated employee object.
    """
)
def update(
    e_id: int,
    payload: EmployeeUpdate,
    db: Session = Depends(get_db),
    user: dict = Depends(require_role([Role.ADMIN]))
):
    emp = update_employee(db, e_id, payload)
    log_action("UPDATE_EMPLOYEE", "EMPLOYEE", e_id, user["e_id"])
    return emp


# DELETE – ADMIN
@router.delete(
    "/{e_id}",
    summary="Delete Employee",
    description="""
    Permanently remove an employee from the system.

    **Path Parameters:**
    - `e_id`: Employee ID to delete

    **Permissions:** Only Admins can delete employees.

    **Warning:** This action cannot be undone. Consider the impact on tasks and relationships.

    **Response:** Success confirmation message.
    """
)
def delete(
    e_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(require_role([Role.ADMIN]))
):
    delete_employee(db, e_id)
    log_action("DELETE_EMPLOYEE", "EMPLOYEE", e_id, user["e_id"])
    return success_response("Employee deleted")
