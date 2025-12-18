from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi import Depends
from app.services.remark_service import (
    add_remark,
    get_remarks_by_task,
    delete_remark_by_id,
    update_remark,
)
from app.core.role_guard import require_role
from app.core.constants import Role
from app.middleware.logger import log_action


router = APIRouter(
    prefix="/remarks",
    tags=["Remarks"],
    responses={
        401: {"description": "Unauthorized - Invalid or missing token"},
        403: {"description": "Forbidden - Insufficient permissions"},
        404: {"description": "Not Found - Task does not exist"},
        422: {"description": "Validation Error - Invalid input data"},
        500: {"description": "Internal Server Error - Something went wrong"}
    }
)


@router.post(
    "",
    summary="Add Remark to Task",
    description="""
    Add a text remark/comment to a specific task.

    **Required Fields:**
    - `task_id`: ID of the task to add remark to
    - `comment`: The remark text content

    **Permissions:** All authenticated users (Admin, Manager, Developer) can add remarks.

    **Storage:** Remarks are stored in MongoDB for better performance with large text content.

    **Response:** Success confirmation with remark details.
    """
)
def create_remark(
    task_id: int,
    comment: str,
    user: dict = Depends(require_role([Role.ADMIN, Role.MANAGER, Role.DEVELOPER]))
):
    log_action("CREATE_REMARK", "TASK", task_id, user["e_id"])
    return add_remark(task_id, comment, user["e_id"])


@router.get(
    "/task/{task_id}",
    summary="List Task Remarks",
    description="""
    Retrieve all remarks/comments associated with a specific task.

    **Path Parameters:**
    - `task_id`: ID of the task to get remarks for

    **Permissions:** All authenticated users can view task remarks.

    **Response:** Array of remark objects with comment text, author, and timestamps.
    """
)
def list_remarks(task_id: int, user: dict = Depends(require_role([Role.ADMIN, Role.MANAGER, Role.DEVELOPER]))):
    log_action("LIST_REMARKS", "TASK", task_id, user["e_id"])
    return get_remarks_by_task(task_id)


@router.post(
    "/with-file",
    summary="Add Remark with File Attachment",
    description="""
    Add a remark to a task with an optional file attachment.

    **Required Fields:**
    - `task_id`: ID of the task
    - `comment`: Remark text content

    **Optional Fields:**
    - `file`: File attachment (images, documents, etc.)

    **Permissions:** All authenticated users can add remarks with files.

    **File Storage:** Files are stored in MongoDB GridFS for efficient handling.

    **Response:** Success confirmation with remark and file details.
    """
)
def create_remark_with_file(
    task_id: int,
    comment: str,
    file: UploadFile | None = File(None),
    user: dict = Depends(require_role([Role.ADMIN, Role.MANAGER, Role.DEVELOPER]))
):
    log_action("CREATE_REMARK_WITH_FILE", "TASK", task_id, user["e_id"])
    return add_remark(
        task_id=task_id,
        comment=comment,
        e_id=user["e_id"],
        file=file
    )


@router.delete("/{remark_id}")
def delete_remark(remark_id: str, user: dict = Depends(require_role([Role.ADMIN, Role.MANAGER]))):
    try:
        return delete_remark_by_id(remark_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/{remark_id}")
def update_remark_api(
    remark_id: str,
    comment: str = Form(None),
    file: UploadFile = File(None),
    user: dict = Depends(require_role([Role.ADMIN, Role.MANAGER, Role.DEVELOPER]))
):
    return update_remark(
        remark_id=remark_id,
        comment=comment,
        file=file,
        e_id=user["e_id"],
        role=user["role"]
    )
