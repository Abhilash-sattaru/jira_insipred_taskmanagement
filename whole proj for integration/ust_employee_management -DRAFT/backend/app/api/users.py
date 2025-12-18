from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.schemas.user_schema import (
    UserCreate,
    UserUpdate,
    UserResponse
)
from app.services.user_service import (
    create_user,
    get_all_users,
    update_user,
    delete_user,
    get_user_by_id as svc_get_user_by_id
)
from app.database.mysql import get_db
from app.core.role_guard import require_role
from app.core.constants import Role
from app.middleware.logger import log_action
from app.utils.response import success_response


router = APIRouter(
    prefix="/users",
    tags=["Users"],
    responses={
        401: {"description": "Unauthorized - Invalid or missing token"},
        403: {"description": "Forbidden - Insufficient permissions"},
        404: {"description": "Not Found - User does not exist"},
        422: {"description": "Validation Error - Invalid input data"},
        500: {"description": "Internal Server Error - Something went wrong"}
    }
)


@router.get(
    "/",
    response_model=list[UserResponse],
    summary="List All Users",
    description="""
    Retrieve a complete list of all user accounts in the system.

    **Permissions:** Only Admins can view all users.

    **Response:** Array of user objects with role and status information.
    """
)
def get_users_api(
    db: Session = Depends(get_db),
    user: dict = Depends(require_role([Role.ADMIN]))
):
    log_action("GET_ALL_USERS", "USER", 0, user["e_id"])
    return get_all_users(db)


@router.get(
    "/{e_id}",
    response_model=UserResponse,
    summary="Get User Details",
    description="""
    Get detailed information about a specific user account.

    **Path Parameters:**
    - `e_id`: Employee ID associated with the user account

    **Permissions:** Only Admins can view user details.

    **Response:** User object with role, status, and associated employee information.
    """
)
def get_user_api(
    e_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(require_role([Role.ADMIN]))
):
    log_action("GET_USER", "USER", e_id, user["e_id"])
    user_obj = svc_get_user_by_id(db, e_id)
    if not user_obj:
        raise HTTPException(status_code=404, detail="User not found")
    return user_obj


@router.post(
    "/",
    response_model=UserResponse,
    summary="Create User Account",
    description="""
    Create a new user account for an existing employee.

    **Required Fields:**
    - `e_id`: Employee ID (must exist in employees table)
    - `role`: User role (ADMIN/MANAGER/DEVELOPER)
    - `password`: Secure password for authentication

    **Permissions:** Only Admins can create user accounts.

    **Validation:** Employee must exist and not already have a user account.

    **Security:** Password will be hashed before storage.

    **Response:** Created user object (password not returned).
    """
)
def create_user_api(
    payload: UserCreate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_role([Role.ADMIN]))
):
    user_obj = create_user(db, payload)
    log_action("CREATE_USER", "USER", user_obj.e_id, user["e_id"])
    return user_obj


@router.put(
    "/{e_id}",
    response_model=UserResponse,
    summary="Update User Account",
    description="""
    Update an existing user account's information.

    **Path Parameters:**
    - `e_id`: Employee ID of the user to update

    **Updatable Fields (all optional):**
    - `role`: Change user role
    - `status`: Update account status (ACTIVE/INACTIVE)
    - `password`: Change password (will be hashed)

    **Permissions:** Only Admins can update user accounts.

    **Response:** Updated user object.
    """
)
def update_user_api(
    e_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_role([Role.ADMIN]))
):
    user_obj = update_user(db, e_id, payload)
    log_action("UPDATE_USER", "USER", e_id, user["e_id"])
    return user_obj


@router.delete(
    "/{e_id}",
    summary="Delete User Account",
    description="""
    Permanently delete a user account from the system.

    **Path Parameters:**
    - `e_id`: Employee ID of the user to delete

    **Permissions:** Only Admins can delete user accounts.

    **Note:** This removes login access but keeps the employee record.

    **Response:** Success confirmation.
    """
)
def delete_user_api(
    e_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_role([Role.ADMIN]))
):
    delete_user(db, e_id)
    log_action("DELETE_USER", "USER", e_id, user["e_id"])
    return success_response("User deleted")
