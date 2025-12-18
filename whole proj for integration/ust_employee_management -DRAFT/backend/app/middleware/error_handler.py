# Global Error Handler Middleware
# This module provides centralized error handling for the FastAPI application
# It catches various types of exceptions and returns consistent error responses

from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from pymongo.errors import PyMongoError
from app.middleware.logger import log_action

async def global_exception_handler(request: Request, exc: Exception):
    """
    Global exception handler for the FastAPI application.

    This function catches all unhandled exceptions and provides appropriate responses:
    - HTTPException: Returns the specified status code and detail
    - SQLAlchemyError: Database-related errors (returns 500)
    - PyMongoError: MongoDB-related errors (returns 500)
    - ValueError: Validation errors (returns 400)
    - Generic Exception: Unexpected errors (returns 500)

    Args:
        request: The incoming request object
        exc: The exception that was raised

    Returns:
        JSONResponse with appropriate error details
    """
    if isinstance(exc, HTTPException):
        # Handle HTTP exceptions with their specific status codes
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail}
        )
    elif isinstance(exc, SQLAlchemyError):
        # Handle database errors - log and return generic message
        log_action("DATABASE_ERROR", "SYSTEM", 0, 0)  # Log error
        return JSONResponse(
            status_code=500,
            content={"detail": "Database error occurred"}
        )
    elif isinstance(exc, PyMongoError):
        # Handle MongoDB errors - log and return generic message
        log_action("MONGODB_ERROR", "SYSTEM", 0, 0)
        return JSONResponse(
            status_code=500,
            content={"detail": "Database error occurred"}
        )
    elif isinstance(exc, ValueError):
        # Handle validation errors with specific messages
        return JSONResponse(
            status_code=400,
            content={"detail": str(exc)}
        )
    else:
        # Handle unexpected errors - log and return generic message
        log_action("UNEXPECTED_ERROR", "SYSTEM", 0, 0)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"}
        )