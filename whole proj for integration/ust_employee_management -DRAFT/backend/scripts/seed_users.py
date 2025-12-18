from app.database.mysql import SessionLocal
from passlib.hash import pbkdf2_sha256
import app.models  # noqa

from app.models.user import User
from app.core.constants import Role, UserStatus

def hash_password(password: str) -> str:
    # use pbkdf2_sha256 (pure-python) for seeding to avoid bcrypt binary/backend issues
    return pbkdf2_sha256.hash(password)

db = SessionLocal()

def seed_users():
    users = [
        User(e_id=1, password=hash_password("admin123"), role=Role.ADMIN, status=UserStatus.ACTIVE),
        User(e_id=2, password=hash_password("manager123"), role=Role.MANAGER, status=UserStatus.ACTIVE),
        User(e_id=3, password=hash_password("manager123"), role=Role.MANAGER, status=UserStatus.ACTIVE),
        User(e_id=4, password=hash_password("dev123"), role=Role.DEVELOPER, status=UserStatus.ACTIVE),
    ]

    db.add_all(users)
    db.commit()
    db.close()
    print("✅ Users seeded successfully")

if __name__ == "__main__":
    seed_users()
