from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User, UserStatus
from app.models.employee import Employee
from app.schemas.user_schema import UserUpdate, ChangePasswordRequest, ResetPasswordRequest, ResetPasswordConfirm
from datetime import datetime, timezone, timedelta
from app.core.config import settings
import secrets
import logging
from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from app.database.mysql import get_db
from app.models.user import User
# from app.services.user_service import verify_reset_token
from passlib.context import CryptContext
import logging

# Use centralized password helpers (hash/verify) from utils so behavior is consistent
from app.utils.password import hash_password, verify_password

logger = logging.getLogger(__name__)


def create_user(db: Session, data):
    # employee must exist
    emp = db.query(Employee).filter(Employee.e_id == data.e_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    # user must not already exist
    existing = db.query(User).filter(User.e_id == data.e_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")

    # Hash the password
    hashed_password = hash_password(data.password)

    user = User(
        e_id=data.e_id,
        password=hashed_password,
        role=data.role,
        status=UserStatus.ACTIVE
    )

    db.add(user)
    db.commit()
    db.refresh(user)
    logger.info(f"User created for employee ID: {data.e_id}")
    return user

def get_all_users(db: Session):
    return db.query(User).all()

def get_user_by_id(db: Session, e_id: int):
    user = db.query(User).filter(User.e_id == e_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

def get_user(db: Session, e_id: int):
    user = db.query(User).filter(User.e_id == e_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def update_user(db: Session, e_id: int, payload: UserUpdate):
    user = db.query(User).filter(User.e_id == e_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.role is not None:
        user.role = payload.role.value   # ✅ ENUM → STRING

    if payload.status is not None:
        user.status = payload.status.value  # ✅ ENUM → STRING

    user.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(user)
    return user

def delete_user(db: Session, e_id: int):
    user = get_user(db, e_id)
    db.delete(user)
    db.commit()




# note: hash_password and verify_password are imported from app.utils.password

def authenticate_user(db: Session, e_id: int, password: str):
    user = get_user_by_id(db, e_id)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return user

def change_password(db: Session, e_id: int, request: ChangePasswordRequest):
    """Change user's password."""
    user = get_user_by_id(db, e_id)

    # Verify current password
    if not verify_password(request.current_password, user.password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    # Hash new password
    hashed_new_password = hash_password(request.new_password)

    # Update password and set password_changed_at
    user.password = hashed_new_password
    user.password_changed_at = datetime.now(timezone.utc)
    user.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(user)
    logger.info(f"Password changed for user ID: {e_id}")
    return {"message": "Password changed successfully"}

def request_password_reset(db: Session, request: ResetPasswordRequest):
    user = get_user_by_id(db, request.e_id)

    reset_token = secrets.token_urlsafe(32)
    user.reset_token = reset_token
    user.reset_token_expires = datetime.now(timezone.utc) + timedelta(hours=1)
    user.updated_at = datetime.now(timezone.utc)

    db.commit()

    return {
        "message": "Password reset token generated",
        "reset_token": reset_token
    }



# Password reset function



def confirm_password_reset(db: Session, request: ResetPasswordConfirm):
    user = db.query(User).filter(
        User.reset_token == request.reset_token,
        User.reset_token_expires > datetime.now(timezone.utc)
    ).first()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    user.password = hash_password(request.new_password)
    user.password_changed_at = datetime.now(timezone.utc)
    user.reset_token = None
    user.reset_token_expires = None
    user.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(user)

    return {"message": "Password reset successfully"}


def check_first_login(db: Session, e_id: int) -> bool:
    """Check if user has changed their password (not first login)."""
    user = get_user_by_id(db, e_id)
    # Return True when this IS the first login (i.e. password_changed_at is NULL)
    return user.password_changed_at is None

def rehash_password(db, e_id, new_password):
    hashed_password = hash_password(new_password)
    # Update the password in the database
    user = db.query(User).filter(User.e_id == e_id).first()
    if user:
        user.password = hashed_password
        db.commit()