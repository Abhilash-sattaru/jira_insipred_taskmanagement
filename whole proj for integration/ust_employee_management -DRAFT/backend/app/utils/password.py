from passlib.context import CryptContext

# Support both bcrypt (preferred) and pbkdf2_sha256 (used for seeding fallback)
# This lets verify() accept hashes produced by either scheme. In production
# prefer only bcrypt (or argon2) and re-hash legacy pbkdf2 hashes on login.
pwd_context = CryptContext(schemes=["bcrypt", "pbkdf2_sha256"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    try:
        return pwd_context.verify(plain, hashed)
    except Exception:
        # If verification fails due to unknown hash format, return False
        return False
