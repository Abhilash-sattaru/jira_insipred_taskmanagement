# # ...existing code...
# import os
# from importlib import import_module

# # Try to reuse existing engine exported by your project (recommended)
# try:
#     # adjust this path if your project exports engine elsewhere
#     from backend.database.mysql import engine
# except Exception:
#     # fallback: create engine from DATABASE_URL env var
#     from sqlalchemy import create_engine
#     DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./dev.db")
#     engine = create_engine(DATABASE_URL, echo=True, future=True)

# # Ensure models package is imported so classes register with Base.metadata
# import backend.app.models as models  # this triggers imports in models.__init__.py
# Base = models.Base

# def create_all():
#     Base.metadata.create_all(engine)
#     print("✅ All tables created")

# if __name__ == "__main__":
#     create_all()