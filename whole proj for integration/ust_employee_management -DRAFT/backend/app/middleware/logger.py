# Logging Middleware
# This module handles all application logging to MongoDB
# It provides a centralized way to log user actions and system events

from datetime import datetime, timezone
from app.database.mongodb import logs_collection
from pymongo.errors import PyMongoError

def log_action(
    action: str,
    entity_type: str,
    entity_id: int,
    performed_by: int
):
    """
    Log a user or system action to the MongoDB logs collection.

    This function records all important actions performed in the system
    for audit trails, debugging, and monitoring purposes.

    Args:
        action (str): The type of action performed (e.g., "CREATE_TASK", "UPDATE_USER")
        entity_type (str): The type of entity affected (e.g., "TASK", "USER", "EMPLOYEE")
        entity_id (int): The ID of the affected entity (0 for system actions)
        performed_by (int): The employee ID of the user who performed the action (0 for system)

    The log entry includes:
    - Timestamp in UTC
    - Action details
    - Entity information
    - User who performed the action

    Errors in logging are printed to console but don't interrupt the main flow.
    """
    try:
        # Validate inputs to ensure data integrity
        if not isinstance(action, str):
            raise ValueError("Action must be a string")
        if not isinstance(entity_type, str):
            raise ValueError("Entity type must be a string")
        if not isinstance(entity_id, int):
            raise ValueError("Entity ID must be an integer")
        if not isinstance(performed_by, int):
            raise ValueError("Performed by must be an integer")

        # Create log entry with timestamp
        log_entry = {
            "action": action,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "performed_by": performed_by,
            "timestamp": datetime.now(timezone.utc)
        }

        # Insert into MongoDB logs collection
        logs_collection.insert_one(log_entry)

    except ValueError as e:
        # Handle validation errors (wrong data types)
        print(f"Error in log_action: {e}")
        # Could also log to a file or send to error monitoring system

    except PyMongoError as e:
        # Handle MongoDB connection or insertion errors
        print(f"MongoDB error in log_action: {e}")
        # Log the error or send alert as needed

    except Exception as e:
        # Catch any unexpected errors
        print(f"Unexpected error in log_action: {e}")
        # Log the error as needed
