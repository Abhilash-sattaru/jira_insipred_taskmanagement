from fastapi import FastAPI
from fastapi.security import HTTPBearer
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.tasks import router as tasks_router
from app.api.employees import router as employees_router
from app.api.remarks import router as remarks_router
from app.api import files
from app.middleware.error_handler import global_exception_handler


app = FastAPI(
    title="UST Employee Management",
    swagger_ui_parameters={"persistAuthorization": True}
)

security = HTTPBearer()

# Allow CORS from common frontend dev origins (vite/dev)
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    # Vite / other dev servers sometimes run on :8080
    "http://localhost:8080",
    "http://127.0.0.1:8080",
]

# For local development make CORS permissive to avoid CORS-related failures
# during redirects or proxying. In production you should restrict origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler for unhandled errors
app.add_exception_handler(Exception, global_exception_handler)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()}
    )


# Register all API routers with their respective prefixes and tags
app.include_router(auth_router, prefix="/api", tags=["Auth"])
app.include_router(users_router, prefix="/api", tags=["Users"])
app.include_router(employees_router, prefix="/api", tags=["Employees"])
app.include_router(tasks_router, prefix="/api", tags=["Tasks"])
app.include_router(remarks_router, prefix="/api", tags=["Remarks"])
app.include_router(files.router)


@app.get("/health")
def health_check():
    return {"status": "healthy"}
















# from app.database.mysql import engine
# from app.database.base import Base

# # Import all models so SQLAlchemy registers them
# from app.models.employee import Employee
# from app.models.user import User
# from app.models.task import Task

# def create_tables():
#     Base.metadata.create_all(bind=engine)

# if __name__ == "__main__":
#     create_tables()
#     print("✅ All tables created successfully")













# USE ust_employee_db;

# -- Disable FK temporarily
# SET FOREIGN_KEY_CHECKS = 0;

# TRUNCATE TABLE remarks_sql;   -- if exists
# TRUNCATE TABLE tasks;
# TRUNCATE TABLE users;
# TRUNCATE TABLE employees;

# SET FOREIGN_KEY_CHECKS = 1;
