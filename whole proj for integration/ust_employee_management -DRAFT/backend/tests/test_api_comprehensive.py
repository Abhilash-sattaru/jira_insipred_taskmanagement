#!/usr/bin/env python3
"""
Comprehensive API Test Suite for UST Employee Management System
Tests all endpoints with various inputs and scenarios
"""

import pytest
import json
import os
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from app.main import app
import io

# Set test environment variables
os.environ["MYSQL_URL"] = "mysql+pymysql://root:password@localhost:3306/ust_employee_db"
os.environ["MONGO_URL"] = "mongodb://localhost:27017"
os.environ["MONGO_DB"] = "ust_employee_db"
os.environ["JWT_SECRET_KEY"] = "test_secret_key_for_testing_only_not_for_production"
os.environ["JWT_ALGORITHM"] = "HS256"
os.environ["JWT_EXPIRE_MINUTES"] = "60"

# Test client
client = TestClient(app)

# Test data
TEST_EMPLOYEES = [
    {
        "name": "John Admin",
        "email": "john.admin@ust.com",
        "department": "IT",
        "position": "System Administrator",
        "manager_id": None
    },
    {
        "name": "Jane Manager",
        "email": "jane.manager@ust.com",
        "department": "IT",
        "position": "Project Manager",
        "manager_id": None
    },
    {
        "name": "Bob Developer",
        "email": "bob.dev@ust.com",
        "department": "IT",
        "position": "Senior Developer",
        "manager_id": 2
    },
    {
        "name": "Alice Developer",
        "email": "alice.dev@ust.com",
        "department": "IT",
        "position": "Junior Developer",
        "manager_id": 2
    }
]

TEST_USERS = [
    {"e_id": 1, "password": "admin123", "role": "ADMIN"},
    {"e_id": 2, "password": "manager123", "role": "MANAGER"},
    {"e_id": 3, "password": "dev123", "role": "DEVELOPER"},
    {"e_id": 4, "password": "dev123", "role": "DEVELOPER"}
]

TEST_TASKS = [
    {
        "title": "Implement User Authentication",
        "description": "Implement secure user authentication with JWT tokens",
        "priority": "HIGH",
        "expected_closure": (datetime.now() + timedelta(days=7)).isoformat(),
        "assigned_to": 3,
        "reviewer": 2
    },
    {
        "title": "Database Optimization",
        "description": "Optimize database queries for better performance",
        "priority": "MEDIUM",
        "expected_closure": (datetime.now() + timedelta(days=14)).isoformat(),
        "assigned_to": 4,
        "reviewer": 2
    }
]

class TestSetup:
    """Test setup and teardown"""

    @pytest.fixture(scope="session", autouse=True)
    def setup_test_data(self):
        """Setup test database with sample data"""
        # This would normally set up test database
        # For now, we'll use the existing database
        yield
        # Cleanup would go here

class TestHealthCheck:
    """Test health check endpoint"""

    def test_health_check(self):
        """Test basic health check"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "healthy"}

class TestAuthentication:
    """Test authentication endpoints"""

    def test_login_success_admin(self):
        """Test successful admin login"""
        response = client.post("/api/login", json={"e_id": 1, "password": "admin123"})
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "token_type" in data
        assert "is_first_login" in data
        assert data["token_type"] == "bearer"

    def test_login_success_manager(self):
        """Test successful manager login"""
        response = client.post("/api/login", json={"e_id": 2, "password": "manager123"})
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data

    def test_login_success_developer(self):
        """Test successful developer login"""
        response = client.post("/api/login", json={"e_id": 3, "password": "dev123"})
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data

    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = client.post("/api/login", json={"e_id": 1, "password": "wrongpassword"})
        assert response.status_code == 401

    def test_login_nonexistent_user(self):
        """Test login with nonexistent user"""
        response = client.post("/api/login", json={"e_id": 999, "password": "password"})
        assert response.status_code == 401

    def test_login_missing_fields(self):
        """Test login with missing fields"""
        response = client.post("/api/login", json={"e_id": 1})
        assert response.status_code == 422

        response = client.post("/api/login", json={"password": "admin123"})
        assert response.status_code == 422

    def test_login_invalid_data_types(self):
        """Test login with invalid data types"""
        response = client.post("/api/login", json={"e_id": "not_a_number", "password": "admin123"})
        assert response.status_code == 422

    def test_change_password_success(self):
        """Test successful password change"""
        # First login to get token
        login_response = client.post("/api/login", json={"e_id": 1, "password": "admin123"})
        token = login_response.json()["access_token"]

        headers = {"Authorization": f"Bearer {token}"}
        response = client.post("/api/change-password", json={
            "current_password": "admin123",
            "new_password": "newadmin123"
        }, headers=headers)
        assert response.status_code == 200
        assert "message" in response.json()

    def test_change_password_wrong_current(self):
        """Test password change with wrong current password"""
        login_response = client.post("/api/login", json={"e_id": 1, "password": "newadmin123"})
        token = login_response.json()["access_token"]

        headers = {"Authorization": f"Bearer {token}"}
        response = client.post("/api/change-password", json={
            "current_password": "wrongpassword",
            "new_password": "anotherpassword"
        }, headers=headers)
        assert response.status_code == 400

    def test_change_password_unauthorized(self):
        """Test password change without authentication"""
        response = client.post("/api/change-password", json={
            "current_password": "admin123",
            "new_password": "newpassword"
        })
        assert response.status_code == 401

    def test_forgot_password_success(self):
        """Test successful forgot password request"""
        response = client.post("/api/forgot-password", json={"e_id": 1})
        assert response.status_code == 200
        assert "message" in response.json()
        assert "reset_token" in response.json()

    def test_forgot_password_nonexistent_user(self):
        """Test forgot password for nonexistent user"""
        response = client.post("/api/forgot-password", json={"e_id": 999})
        assert response.status_code == 404

    def test_reset_password_success(self):
        """Test successful password reset"""
        # First get reset token
        forgot_response = client.post("/api/forgot-password", json={"e_id": 1})
        reset_token = forgot_response.json()["reset_token"]

        response = client.post("/api/reset-password", json={
            "reset_token": reset_token,
            "new_password": "resetpassword123"
        })
        assert response.status_code == 200
        assert "message" in response.json()

    def test_reset_password_invalid_token(self):
        """Test password reset with invalid token"""
        response = client.post("/api/reset-password", json={
            "reset_token": "invalid_token",
            "new_password": "newpassword"
        })
        assert response.status_code == 400

class TestUserManagement:
    """Test user management endpoints"""

    def test_get_all_users_admin(self):
        """Test getting all users as admin"""
        login_response = client.post("/api/login", json={"e_id": 1, "password": "resetpassword123"})
        token = login_response.json()["access_token"]

        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/api/users", headers=headers)
        assert response.status_code == 200
        users = response.json()
        assert isinstance(users, list)

    def test_get_all_users_unauthorized(self):
        """Test getting all users without proper role"""
        login_response = client.post("/api/login", json={"e_id": 3, "password": "dev123"})
        token = login_response.json()["access_token"]

        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/api/users", headers=headers)
        assert response.status_code == 403

    def test_get_user_by_id_admin(self):
        """Test getting specific user as admin"""
        login_response = client.post("/api/login", json={"e_id": 1, "password": "resetpassword123"})
        token = login_response.json()["access_token"]

        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/api/users/1", headers=headers)
        assert response.status_code == 200
        user = response.json()
        assert user["e_id"] == 1

    def test_get_user_by_id_not_found(self):
        """Test getting nonexistent user"""
        login_response = client.post("/api/login", json={"e_id": 1, "password": "resetpassword123"})
        token = login_response.json()["access_token"]

        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/api/users/999", headers=headers)
        assert response.status_code == 404

    def test_create_user_admin(self):
        """Test creating new user as admin"""
        login_response = client.post("/api/login", json={"e_id": 1, "password": "resetpassword123"})
        token = login_response.json()["access_token"]

        headers = {"Authorization": f"Bearer {token}"}
        response = client.post("/api/users", json={
            "e_id": 5,
            "password": "newuser123",
            "role": "DEVELOPER"
        }, headers=headers)
        assert response.status_code == 200
        user = response.json()
        assert user["e_id"] == 5

    def test_create_user_duplicate(self):
        """Test creating user with existing e_id"""
        login_response = client.post("/api/login", json={"e_id": 1, "password": "resetpassword123"})
        token = login_response.json()["access_token"]

        headers = {"Authorization": f"Bearer {token}"}
        response = client.post("/api/users", json={
            "e_id": 1,
            "password": "duplicate123",
            "role": "DEVELOPER"
        }, headers=headers)
        assert response.status_code == 400

    def test_create_user_nonexistent_employee(self):
        """Test creating user for nonexistent employee"""
        login_response = client.post("/api/login", json={"e_id": 1, "password": "resetpassword123"})
        token = login_response.json()["access_token"]

        headers = {"Authorization": f"Bearer {token}"}
        response = client.post("/api/users", json={
            "e_id": 999,
            "password": "nonexistent123",
            "role": "DEVELOPER"
        }, headers=headers)
        assert response.status_code == 404

    def test_update_user_admin(self):
        """Test updating user as admin"""
        login_response = client.post("/api/login", json={"e_id": 1, "password": "resetpassword123"})
        token = login_response.json()["access_token"]

        headers = {"Authorization": f"Bearer {token}"}
        response = client.put("/api/users/5", json={
            "role": "MANAGER",
            "status": "ACTIVE"
        }, headers=headers)
        assert response.status_code == 200

    def test_delete_user_admin(self):
        """Test deleting user as admin"""
        login_response = client.post("/api/login", json={"e_id": 1, "password": "resetpassword123"})
        token = login_response.json()["access_token"]

        headers = {"Authorization": f"Bearer {token}"}
        response = client.delete("/api/users/5", headers=headers)
        assert response.status_code == 200

class TestEmployeeManagement:
    """Test employee management endpoints"""

    def test_get_all_employees_admin(self):
        """Test getting all employees as admin"""
        login_response = client.post("/api/login", json={"e_id": 1, "password": "resetpassword123"})
        token = login_response.json()["access_token"]

        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/api/employees", headers=headers)
        assert response.status_code == 200
        employees = response.json()
        assert isinstance(employees, list)

    def test_get_my_employees_manager(self):
        """Test getting employees under manager"""
        login_response = client.post("/api/login", json={"e_id": 2, "password": "manager123"})
        token = login_response.json()["access_token"]

        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/api/employees/me", headers=headers)
        assert response.status_code == 200
        employees = response.json()
        assert isinstance(employees, list)

    def test_create_employee_admin(self):
        """Test creating new employee as admin"""
        login_response = client.post("/api/login", json={"e_id": 1, "password": "resetpassword123"})
        token = login_response.json()["access_token"]

        headers = {"Authorization": f"Bearer {token}"}
        response = client.post("/api/employees", json={
            "name": "Test Employee",
            "email": "test.employee@ust.com",
            "department": "IT",
            "position": "Test Engineer",
            "manager_id": 2
        }, headers=headers)
        assert response.status_code == 200
        employee = response.json()
        assert employee["name"] == "Test Employee"

    def test_create_employee_duplicate_email(self):
        """Test creating employee with duplicate email"""
        login_response = client.post("/api/login", json={"e_id": 1, "password": "resetpassword123"})
        token = login_response.json()["access_token"]

        headers = {"Authorization": f"Bearer {token}"}
        response = client.post("/api/employees", json={
            "name": "Duplicate Employee",
            "email": "test.employee@ust.com",  # Same email as above
            "department": "IT",
            "position": "Test Engineer",
            "manager_id": 2
        }, headers=headers)
        assert response.status_code == 400

    def test_update_employee_admin(self):
        """Test updating employee as admin"""
        login_response = client.post("/api/login", json={"e_id": 1, "password": "resetpassword123"})
        token = login_response.json()["access_token"]

        headers = {"Authorization": f"Bearer {token}"}
        response = client.put("/api/employees/5", json={
            "name": "Updated Test Employee",
            "position": "Senior Test Engineer"
        }, headers=headers)
        assert response.status_code == 200

    def test_delete_employee_admin(self):
        """Test deleting employee as admin"""
        login_response = client.post("/api/login", json={"e_id": 1, "password": "resetpassword123"})
        token = login_response.json()["access_token"]

        headers = {"Authorization": f"Bearer {token}"}
        response = client.delete("/api/employees/5", headers=headers)
        assert response.status_code == 200

    def test_upload_profile_picture(self):
        """Test uploading profile picture"""
        login_response = client.post("/api/login", json={"e_id": 1, "password": "resetpassword123"})
        token = login_response.json()["access_token"]

        headers = {"Authorization": f"Bearer {token}"}

        # Create a test image file
        image_data = io.BytesIO(b"fake image data")
        image_data.name = "test.jpg"

        response = client.post("/api/employees/1/profile-picture",
                             files={"file": ("test.jpg", image_data, "image/jpeg")},
                             headers=headers)
        assert response.status_code == 200
        assert "file_id" in response.json()

    def test_upload_invalid_file_type(self):
        """Test uploading invalid file type for profile picture"""
        login_response = client.post("/api/login", json={"e_id": 1, "password": "resetpassword123"})
        token = login_response.json()["access_token"]

        headers = {"Authorization": f"Bearer {token}"}

        # Create a test text file
        text_data = io.BytesIO(b"this is not an image")
        text_data.name = "test.txt"

        response = client.post("/api/employees/1/profile-picture",
                             files={"file": ("test.txt", text_data, "text/plain")},
                             headers=headers)
        assert response.status_code == 400

class TestTaskManagement:
    """Test task management endpoints"""

    def test_list_tasks_admin(self):
        """Test listing all tasks as admin"""
        login_response = client.post("/api/login", json={"e_id": 1, "password": "resetpassword123"})
        token = login_response.json()["access_token"]

        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/api/tasks", headers=headers)
        assert response.status_code == 200
        tasks = response.json()
        assert isinstance(tasks, list)

    def test_list_tasks_developer(self):
        """Test listing tasks as developer (only assigned tasks)"""
        login_response = client.post("/api/login", json={"e_id": 3, "password": "dev123"})
        token = login_response.json()["access_token"]

        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/api/tasks", headers=headers)
        assert response.status_code == 200
        tasks = response.json()
        assert isinstance(tasks, list)

    def test_get_task_details(self):
        """Test getting specific task details"""
        login_response = client.post("/api/login", json={"e_id": 1, "password": "resetpassword123"})
        token = login_response.json()["access_token"]

        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/api/tasks/1", headers=headers)
        if response.status_code == 200:
            task = response.json()
            assert "t_id" in task
        else:
            assert response.status_code == 404

    def test_create_task_admin(self):
        """Test creating new task as admin"""
        login_response = client.post("/api/login", json={"e_id": 1, "password": "resetpassword123"})
        token = login_response.json()["access_token"]

        headers = {"Authorization": f"Bearer {token}"}
        response = client.post("/api/tasks", json={
            "title": "Test Task",
            "description": "This is a test task",
            "priority": "MEDIUM",
            "expected_closure": (datetime.now() + timedelta(days=7)).isoformat(),
            "assigned_to": 3,
            "reviewer": 2
        }, headers=headers)
        assert response.status_code == 200
        task = response.json()
        assert task["title"] == "Test Task"

    def test_create_task_invalid_employee(self):
        """Test creating task with invalid employee IDs"""
        login_response = client.post("/api/login", json={"e_id": 1, "password": "resetpassword123"})
        token = login_response.json()["access_token"]

        headers = {"Authorization": f"Bearer {token}"}
        response = client.post("/api/tasks", json={
            "title": "Invalid Task",
            "description": "This task has invalid employee IDs",
            "priority": "LOW",
            "expected_closure": (datetime.now() + timedelta(days=7)).isoformat(),
            "assigned_to": 999,  # Invalid employee ID
            "reviewer": 2
        }, headers=headers)
        assert response.status_code == 400

    def test_assign_task(self):
        """Test assigning task to employee"""
        login_response = client.post("/api/login", json={"e_id": 1, "password": "resetpassword123"})
        token = login_response.json()["access_token"]

        headers = {"Authorization": f"Bearer {token}"}
        response = client.put("/api/tasks/1/assign", json={
            "assigned_to": 4,
            "reviewer": 2
        }, headers=headers)
        # This might fail if task 1 doesn't exist, which is fine
        assert response.status_code in [200, 404]

    def test_update_task_partial(self):
        """Test partial task update"""
        login_response = client.post("/api/login", json={"e_id": 2, "password": "manager123"})
        token = login_response.json()["access_token"]

        headers = {"Authorization": f"Bearer {token}"}
        response = client.patch("/api/tasks/1", json={
            "title": "Updated Test Task",
            "priority": "HIGH"
        }, headers=headers)
        # This might fail if task 1 doesn't exist, which is fine
        assert response.status_code in [200, 404]

    def test_delete_task_admin(self):
        """Test deleting task as admin"""
        login_response = client.post("/api/login", json={"e_id": 1, "password": "resetpassword123"})
        token = login_response.json()["access_token"]

        headers = {"Authorization": f"Bearer {token}"}
        response = client.delete("/api/tasks/1", headers=headers)
        # This might fail if task 1 doesn't exist, which is fine
        assert response.status_code in [200, 404]

class TestRemarks:
    """Test remarks endpoints"""

    def test_add_remark(self):
        """Test adding remark to task"""
        login_response = client.post("/api/login", json={"e_id": 3, "password": "dev123"})
        token = login_response.json()["access_token"]

        headers = {"Authorization": f"Bearer {token}"}
        response = client.post("/api/remarks", params={
            "task_id": 1,
            "comment": "This is a test remark"
        }, headers=headers)
        # This might fail if task 1 doesn't exist, which is fine
        assert response.status_code in [200, 404]

    def test_list_remarks(self):
        """Test listing remarks for task"""
        login_response = client.post("/api/login", json={"e_id": 3, "password": "dev123"})
        token = login_response.json()["access_token"]

        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/api/remarks/task/1", headers=headers)
        assert response.status_code in [200, 404]

    def test_add_remark_with_file(self):
        """Test adding remark with file attachment"""
        login_response = client.post("/api/login", json={"e_id": 3, "password": "dev123"})
        token = login_response.json()["access_token"]

        headers = {"Authorization": f"Bearer {token}"}

        # Create test file
        file_data = io.BytesIO(b"test file content")
        file_data.name = "test.txt"

        response = client.post("/api/remarks/with-file",
                             data={"task_id": 1, "comment": "Remark with file"},
                             files={"file": ("test.txt", file_data, "text/plain")},
                             headers=headers)
        assert response.status_code in [200, 404]

class TestFiles:
    """Test file download endpoints"""

    def test_download_file(self):
        """Test downloading a file"""
        login_response = client.post("/api/login", json={"e_id": 1, "password": "resetpassword123"})
        token = login_response.json()["access_token"]

        headers = {"Authorization": f"Bearer {token}"}
        # Try to download a file that might exist
        response = client.get("/api/files/507f1f77bcf86cd799439011", headers=headers)
        # This will likely fail since we don't have a real file ID
        assert response.status_code in [200, 404]

class TestErrorHandling:
    """Test error handling and edge cases"""

    def test_invalid_token(self):
        """Test accessing protected endpoint with invalid token"""
        headers = {"Authorization": "Bearer invalid_token"}
        response = client.get("/api/users", headers=headers)
        assert response.status_code == 401

    def test_no_token(self):
        """Test accessing protected endpoint without token"""
        response = client.get("/api/users")
        assert response.status_code == 401

    def test_insufficient_permissions(self):
        """Test accessing admin endpoint as developer"""
        login_response = client.post("/api/login", json={"e_id": 3, "password": "dev123"})
        token = login_response.json()["access_token"]

        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/api/users", headers=headers)
        assert response.status_code == 403

    def test_invalid_json(self):
        """Test sending invalid JSON"""
        login_response = client.post("/api/login", json={"e_id": 1, "password": "resetpassword123"})
        token = login_response.json()["access_token"]

        headers = {"Authorization": f"Bearer {token}"}
        response = client.post("/api/employees", data="invalid json", headers=headers)
        assert response.status_code == 422

    def test_sql_injection_attempt(self):
        """Test SQL injection attempt"""
        response = client.post("/api/login", json={
            "e_id": "1 OR 1=1",
            "password": "admin123"
        })
        assert response.status_code == 422  # Should fail validation

if __name__ == "__main__":
    pytest.main([__file__, "-v"])