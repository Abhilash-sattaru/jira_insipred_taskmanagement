from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Body, Query
from sqlalchemy.orm import Session
from app.database.mysql import get_db
from app.core.security import create_access_token
from app.services.user_service import authenticate_user, change_password, request_password_reset, confirm_password_reset, check_first_login
from app.schemas.user_schema import ChangePasswordRequest, ResetPasswordRequest, ResetPasswordConfirm, AuthResponse, LoginRequest
from app.middleware.auth_guard import get_current_user
from app.models.user import User
import logging

router = APIRouter(
    tags=["Auth"],
    responses={
        401: {"description": "Unauthorized - Invalid credentials"},
        422: {"description": "Validation Error - Invalid input data"},
        500: {"description": "Internal Server Error - Something went wrong"}
    }
)
from app.services.user_service import (
    authenticate_user,
    change_password,
    request_password_reset,
    confirm_password_reset,
    check_first_login
)

logger = logging.getLogger(__name__)

@router.post(
    "/login",
    summary="User Authentication",
    description="""
    Authenticate a user and receive a JWT access token.

    **Required Fields:**
    - `e_id`: Employee ID (used as username)
    - `password`: User password

    **Authentication Process:**
    1. Verify employee exists and password is correct
    2. Check if it's first login (password never changed)
    3. Generate JWT token with user info

    **Response:** Access token and first login status.

    **Security:** Token expires after configured time (default: 60 minutes).
    **First Login:** If password_changed_at is null, user must change password.
    """,
    response_model=AuthResponse
)
def login(
    payload: Optional[LoginRequest] = Body(None),
    e_id: Optional[int] = Query(None),
    password: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Accepts login either as JSON body (preferred) or as query params for compatibility with existing frontend.

    Priority: JSON body (payload) -> query params.
    """
    # if JSON body provided, use it
    if payload is not None:
        e_id = int(payload.e_id)
        password = str(payload.password)

    if e_id is None or password is None:
        # Missing credentials
        raise HTTPException(status_code=422, detail="Missing credentials")

    try:
        user = authenticate_user(db, e_id, password)
        is_first_login = check_first_login(db, e_id)

        token = create_access_token({
            "e_id": user.e_id,
            "role": user.role
        })

        logger.info(f"User {e_id} logged in successfully")
        return AuthResponse(
            access_token=token,
            token_type="bearer",
            is_first_login=is_first_login
        )
    except HTTPException as e:
        logger.warning(f"Failed login attempt for user {e_id}: {e.detail}")
        raise e

@router.post(
    "/change-password",
    summary="Change User Password",
    description="""
    Change the current user's password.

    **Required Fields:**
    - `current_password`: Current password for verification
    - `new_password`: New password (must meet security requirements)

    **Process:**
    1. Verify current password
    2. Validate new password strength
    3. Hash and update password
    4. Set password_changed_at timestamp

    **Security:** Requires authentication. Password must be different from current.
    """
)
def change_user_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        result = change_password(db, current_user.e_id, request)
        logger.info(f"Password changed for user {current_user.e_id}")
        return result
    except HTTPException as e:
        logger.warning(f"Password change failed for user {current_user.e_id}: {e.detail}")
        raise e

@router.post(
    "/forgot-password",
    summary="Request Password Reset",
    description="""
    Request a password reset token for a user account.

    **Required Fields:**
    - `e_id`: Employee ID of the account

    **Process:**
    1. Verify user exists
    2. Generate secure reset token
    3. Set token expiration (1 hour)
    4. Store token in database

    **Security:** Token is URL-safe and expires after 1 hour.
    **Note:** In production, this would send an email with the reset link.
    """
)
def forgot_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    try:
        result = request_password_reset(db, request)
        logger.info(f"Password reset requested for user {request.e_id}")
        return result
    except HTTPException as e:
        logger.warning(f"Password reset request failed for user {request.e_id}: {e.detail}")
        raise e

@router.post(
    "/reset-password",
    summary="Reset Password with Token",
    description="""
    Reset user password using a valid reset token.

    **Required Fields:**
    - `reset_token`: Token received from forgot-password request
    - `new_password`: New password (must meet security requirements)

    **Process:**
    1. Verify token exists and is not expired
    2. Validate new password strength
    3. Hash and update password
    4. Clear reset token and set password_changed_at

    **Security:** Token must be valid and not expired. One-time use only.
    """
)
def reset_password(request: ResetPasswordConfirm, db: Session = Depends(get_db)):
    try:
        result = confirm_password_reset(db, request)
        logger.info("Password reset completed successfully")
        return result
    except HTTPException as e:
        logger.warning(f"Password reset failed: {e.detail}")
        raise e
