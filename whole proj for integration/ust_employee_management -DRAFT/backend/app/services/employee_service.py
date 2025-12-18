from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.employee import Employee

def create_employee(db: Session, data):
    payload = data.dict()
    if payload.get("mgr_id") == 0:
        payload["mgr_id"] = None

    employee = Employee(**payload)
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return employee


def get_all_employees(db: Session):
    return db.query(Employee).all()

def get_employees_by_manager(db: Session, mgr_id: int):
    return db.query(Employee).filter(Employee.mgr_id == mgr_id).all()

def get_employee(db: Session, e_id: int):
    emp = db.query(Employee).filter(Employee.e_id == e_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return emp

def update_employee(db: Session, e_id: int, data):
    emp = get_employee(db, e_id)
    for key, value in data.dict(exclude_unset=True).items():
        setattr(emp, key, value)
    db.commit()
    db.refresh(emp)
    return emp

def delete_employee(db: Session, e_id: int):
    emp = get_employee(db, e_id)
    db.delete(emp)
    db.commit()
