# from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
# from sqlalchemy.sql import func
# from app.database.base import Base

# class Employee(Base):
#     __tablename__ = "employees"
    


#     e_id = Column(Integer, primary_key=True, index=True)
#     name = Column(String(100), nullable=False)
#     email = Column(String(150), nullable=False, unique=True)
#     designation = Column(String(100), nullable=False)
#     mgr_id = Column(Integer, ForeignKey("employees.e_id"), nullable=True)

#     created_at = Column(DateTime, server_default=func.now())
#     updated_at = Column(DateTime, onupdate=func.now())


from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.base import Base


class Employee(Base):
    __tablename__ = "employees"

    e_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)

    # Email stored as string (validation happens in Pydantic)
    email = Column(String(150), nullable=False, unique=True)

    designation = Column(String(100), nullable=False)

    # ✅ Optional manager (self-referencing FK)
    mgr_id = Column(Integer, ForeignKey("employees.e_id"), nullable=True)

    # (Optional but good practice)
    manager = relationship("Employee", remote_side=[e_id])

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
