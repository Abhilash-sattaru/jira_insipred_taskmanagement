from typing import Iterable, Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.security import decode_token

security = HTTPBearer()


def _normalize_allowed(allowed_roles: Iterable[Any]) -> list[str]:
    """Convert an iterable of role enums or strings into list[str].

    Accepts enum members (with .value) or plain strings.
    """
    normalized: list[str] = []
    for r in allowed_roles:
        try:
            normalized.append(r.value)  # Enum-like
        except Exception:
            normalized.append(str(r))
    return normalized


def require_role(allowed_roles: Iterable[Any]):
    """Dependency factory that ensures the JWT token contains one of allowed_roles.

    allowed_roles may be a list of strings or Enum members. Returns the token payload
    (dict) when successful, which contains at least `e_id` and `role`.
    """
    allowed = _normalize_allowed(allowed_roles)

    def role_checker(
        credentials: HTTPAuthorizationCredentials = Depends(security)
    ):
        token = credentials.credentials
        payload = decode_token(token)

        role = payload.get("role")
        if role is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Role missing in token"
            )

        if role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        return payload  # contains e_id, role

    return role_checker
