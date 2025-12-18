from fastapi import Header, HTTPException, status
from app.core.security import decode_access_token
from app.database.mysql import SessionLocal
from app.models.user import User

def jwt_required(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header must be Bearer token"
        )

    token = authorization.split(" ")[1]
    payload = decode_access_token(token)

    e_id = payload.get("e_id")
    role = payload.get("role")

    if not e_id or not role:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )

    db = SessionLocal()
    user = db.query(User).filter(User.e_id == e_id).first()
    db.close()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    return {
        "e_id": user.e_id,
        "role": user.role.value
    }
