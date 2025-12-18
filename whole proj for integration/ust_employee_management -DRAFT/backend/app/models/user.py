from sqlalchemy import Column, Integer, String, Enum, DateTime, func
from app.database.base import Base
import enum
from datetime import datetime

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    MANAGER = "MANAGER"
    DEVELOPER = "DEVELOPER"

class UserStatus(enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"

class User(Base):
    __tablename__ = 'users'

    e_id = Column(Integer, primary_key=True)
    password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    # status column (enum) with explicit name
    status = Column(
        Enum(UserStatus, name="userstatus"),
        nullable=False,
        default=UserStatus.ACTIVE
    )

    # Password management fields
    password_changed_at = Column(DateTime)  # NULL means never changed (first login required)
    reset_token = Column(String(255), nullable=True)
    reset_token_expires = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)