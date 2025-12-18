# from pydantic import BaseModel, EmailStr
# from typing import Optional
# from datetime import datetime

# class EmployeeCreate(BaseModel):
#     name: str
#     email: EmailStr
#     designation: str
#     mgr_id: Optional[int] = None

# class EmployeeUpdate(BaseModel):
#     name: Optional[str]
#     designation: Optional[str]
#     mgr_id: Optional[int]

# class EmployeeResponse(BaseModel):
#     e_id: int
#     name: str
#     email: str
#     designation: str
#     mgr_id: Optional[int]
#     created_at: datetime

#     class Config:
#         from_attributes = True
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime


class EmployeeCreate(BaseModel):
    name: str
    email: EmailStr
    designation: str
    mgr_id: Optional[int] = None

    @field_validator("email")
    @classmethod
    def validate_ust_email(cls, value: EmailStr):
        if not value.endswith("@ust.com"):
            raise ValueError("Email must end with @ust.com")
        return value


class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    designation: Optional[str] = None
    mgr_id: Optional[int] = None


class EmployeeResponse(BaseModel):
    e_id: int
    name: str
    email: str
    designation: str
    mgr_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True
