from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from bson import ObjectId
from app.database.mongodb import fs
from app.core.role_guard import require_role
from app.core.constants import Role
from app.middleware.logger import log_action

router = APIRouter(
    prefix="/api/files",
    tags=["Files"],
    responses={
        401: {"description": "Unauthorized - Invalid or missing token"},
        403: {"description": "Forbidden - Insufficient permissions"},
        404: {"description": "Not Found - File does not exist"},
        422: {"description": "Validation Error - Invalid input data"},
        500: {"description": "Internal Server Error - Something went wrong"}
    }
)


@router.get(
    "/{file_id}",
    summary="Download File",
    description="""
    Download a file by its unique identifier.

    **Path Parameters:**
    - `file_id`: MongoDB ObjectId of the file to download

    **Permissions:** All authenticated users can download files.

    **Response:** File content as streaming response with appropriate headers.

    **Headers:** Content-Disposition set for browser download with original filename.
    """
)
def download_file(file_id: str, user: dict = Depends(require_role([Role.ADMIN, Role.MANAGER, Role.DEVELOPER]))):
    log_action("DOWNLOAD_FILE", "FILE", 0, user["e_id"])  # entity_id as file_id string, but use 0
    try:
        grid_file = fs.get(ObjectId(file_id))
    except Exception:
        raise HTTPException(status_code=404, detail="File not found")

    return StreamingResponse(
        grid_file,
        media_type="application/octet-stream",
        headers={
            "Content-Disposition": f"attachment; filename={grid_file.filename}"
        }
    )
