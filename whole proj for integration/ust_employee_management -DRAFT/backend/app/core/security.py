# from jose import jwt, JWTError
# from fastapi import HTTPException, status
# from app.core.config import settings

# def create_access_token(payload: dict):
#     # Convert Enum → string if needed
#     if hasattr(payload.get("role"), "value"):
#         payload["role"] = payload["role"].value

#     return jwt.encode(
#         payload,
#         settings.JWT_SECRET_KEY,
#         algorithm=settings.JWT_ALGORITHM
#     )

# def decode_access_token(token: str):
#     try:
#         return jwt.decode(
#             token,
#             settings.JWT_SECRET_KEY,
#             algorithms=[settings.JWT_ALGORITHM]
#         )
#     except JWTError:
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Invalid or expired token"
#         )
# def verify_access_token(token: str):
#     payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
#     return payload


# # 🛡️ Used by auth_guard
# def decode_token(token: str):
#     return decode_access_token(token)


from jose import jwt, JWTError
from fastapi import HTTPException, status
from app.core.config import settings

# 🔐 Create JWT token
def create_access_token(payload: dict):
    if hasattr(payload.get("role"), "value"):
        payload["role"] = payload["role"].value

    return jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )


# 🔓 Decode JWT token
def decode_access_token(token: str):
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )


# 🛡️ Used by guards
def verify_access_token(token: str):
    return decode_access_token(token)


# ✅ BACKWARD COMPATIBILITY (THIS FIXES YOUR ERROR)
def decode_token(token: str):
    return decode_access_token(token)
