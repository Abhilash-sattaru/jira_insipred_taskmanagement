from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.user import UserRole, UserStatus

# -------------------------
# Login Request (accept JSON body)
# -------------------------
class LoginRequest(BaseModel):
    e_id: int
    password: str

# =========================
# USER CREATION
# =========================
class UserCreate(BaseModel):
    e_id: int
    role: UserRole
    password: Optional[str] = None  # Optional - defaults to "welcome123" if not provided

# =========================
# USER UPDATE (ADMIN)
# =========================
class UserUpdate(BaseModel):
    role: Optional[UserRole] = None
    status: Optional[UserStatus] = None

# =========================
# PASSWORD CHANGE
# =========================
class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class ResetPasswordRequest(BaseModel):
    e_id: int  # Use employee ID as identifier

class ResetPasswordConfirm(BaseModel):
    token: str
    new_password: str
    
class ResetPasswordConfirm(BaseModel):
    reset_token: str
    new_password: str

# =========================
# USER RESPONSE
# =========================
class UserResponse(BaseModel):
    e_id: int
    role: UserRole
    status: UserStatus
    password_changed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# =========================
# AUTH RESPONSE
# =========================
class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    is_first_login: bool
