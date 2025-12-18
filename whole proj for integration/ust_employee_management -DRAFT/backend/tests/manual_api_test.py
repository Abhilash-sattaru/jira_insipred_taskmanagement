# #!/usr/bin/env python3
# """
# Manual API Testing Script for UST Employee Management System
# Tests all endpoints manually with different inputs
# """

# import requests
# import json
# import time
# from datetime import datetime, timedelta
# import io

# # Base URL for the API
# BASE_URL = "http://localhost:8001"

# def test_health_check():
#     """Test health check endpoint"""
#     print("🩺 Testing Health Check...")
#     try:
#         response = requests.get(f"{BASE_URL}/health")
#         assert response.status_code == 200
#         assert response.json() == {"status": "healthy"}
#         print("✅ Health check passed")
#         return True
#     except Exception as e:
#         print(f"❌ Health check failed: {e}")
#         return False

# def test_login_scenarios():
#     """Test various login scenarios"""
#     print("\n🔐 Testing Authentication...")

#     # Test successful admin login
#     try:
#         response = requests.post(f"{BASE_URL}/api/login", json={"e_id": 1, "password": "resetpassword123"})
#         assert response.status_code == 200
#         data = response.json()
#         assert "access_token" in data
#         assert "is_first_login" in data
#         admin_token = data["access_token"]
#         print("✅ Admin login successful")
#     except Exception as e:
#         print(f"❌ Admin login failed: {e}")
#         return False

#     # Test successful manager login
#     try:
#         response = requests.post(f"{BASE_URL}/api/login", json={"e_id": 2, "password": "manager123"})
#         assert response.status_code == 200
#         manager_token = response.json()["access_token"]
#         print("✅ Manager login successful")
#     except Exception as e:
#         print(f"❌ Manager login failed: {e}")
#         return False

#     # Test successful developer login
#     try:
#         response = requests.post(f"{BASE_URL}/api/login", json={"e_id": 3, "password": "dev123"})
#         assert response.status_code == 200
#         dev_token = response.json()["access_token"]
#         print("✅ Developer login successful")
#     except Exception as e:
#         print(f"❌ Developer login failed: {e}")
#         return False

#     # Test invalid credentials
#     try:
#         response = requests.post(f"{BASE_URL}/api/login", json={"e_id": 1, "password": "wrongpassword"})
#         assert response.status_code == 401
#         print("✅ Invalid credentials rejected")
#     except Exception as e:
#         print(f"❌ Invalid credentials test failed: {e}")
#         return False

#     # Test nonexistent user
#     try:
#         response = requests.post(f"{BASE_URL}/api/login", json={"e_id": 999, "password": "password"})
#         assert response.status_code == 401
#         print("✅ Nonexistent user rejected")
#     except Exception as e:
#         print(f"❌ Nonexistent user test failed: {e}")
#         return False

#     return admin_token, manager_token, dev_token

# def test_user_management(admin_token):
#     """Test user management endpoints"""
#     print("\n👥 Testing User Management...")

#     headers = {"Authorization": f"Bearer {admin_token}"}

#     # Test get all users
#     try:
#         response = requests.get(f"{BASE_URL}/api/users", headers=headers)
#         assert response.status_code == 200
#         users = response.json()
#         assert isinstance(users, list)
#         print("✅ Get all users successful")
#     except Exception as e:
#         print(f"❌ Get all users failed: {e}")
#         return False

#     # Test get specific user
#     try:
#         response = requests.get(f"{BASE_URL}/api/users/1", headers=headers)
#         assert response.status_code == 200
#         user = response.json()
#         assert user["e_id"] == 1
#         print("✅ Get specific user successful")
#     except Exception as e:
#         print(f"❌ Get specific user failed: {e}")
#         return False

#     # Test get nonexistent user
#     try:
#         response = requests.get(f"{BASE_URL}/api/users/999", headers=headers)
#         assert response.status_code == 404
#         print("✅ Nonexistent user properly handled")
#     except Exception as e:
#         print(f"❌ Nonexistent user test failed: {e}")
#         return False

#     # Test create user
#     try:
#         new_user_data = {
#             "e_id": 10,
#             "password": "newuser123",
#             "role": "DEVELOPER"
#         }
#         response = requests.post(f"{BASE_URL}/api/users", json=new_user_data, headers=headers)
#         if response.status_code == 200:
#             user = response.json()
#             assert user["e_id"] == 10
#             print("✅ Create user successful")
#         else:
#             print(f"⚠️ Create user returned {response.status_code}: {response.text}")
#     except Exception as e:
#         print(f"❌ Create user failed: {e}")
#         return False

#     # Test update user
#     try:
#         update_data = {
#             "role": "MANAGER",
#             "status": "ACTIVE"
#         }
#         response = requests.put(f"{BASE_URL}/api/users/10", json=update_data, headers=headers)
#         if response.status_code == 200:
#             print("✅ Update user successful")
#         else:
#             print(f"⚠️ Update user returned {response.status_code}: {response.text}")
#     except Exception as e:
#         print(f"❌ Update user failed: {e}")
#         return False

#     # Test delete user
#     try:
#         response = requests.delete(f"{BASE_URL}/api/users/10", headers=headers)
#         if response.status_code == 200:
#             print("✅ Delete user successful")
#         else:
#             print(f"⚠️ Delete user returned {response.status_code}: {response.text}")
#     except Exception as e:
#         print(f"❌ Delete user failed: {e}")
#         return False

#     return True

# def test_employee_management(admin_token, manager_token):
#     """Test employee management endpoints"""
#     print("\n👷 Testing Employee Management...")

#     admin_headers = {"Authorization": f"Bearer {admin_token}"}
#     manager_headers = {"Authorization": f"Bearer {manager_token}"}

#     # Test get all employees (admin)
#     try:
#         response = requests.get(f"{BASE_URL}/api/employees", headers=admin_headers)
#         assert response.status_code == 200
#         employees = response.json()
#         assert isinstance(employees, list)
#         print("✅ Get all employees successful")
#     except Exception as e:
#         print(f"❌ Get all employees failed: {e}")
#         return False

#     # Test get my employees (manager)
#     try:
#         response = requests.get(f"{BASE_URL}/api/employees/me", headers=manager_headers)
#         assert response.status_code == 200
#         employees = response.json()
#         assert isinstance(employees, list)
#         print("✅ Get my employees successful")
#     except Exception as e:
#         print(f"❌ Get my employees failed: {e}")
#         return False

#     # Test create employee
#     try:
#         new_employee_data = {
#             "name": "Test Employee",
#             "email": "test.employee@ust.com",
#             "department": "IT",
#             "position": "Test Engineer",
#             "manager_id": 2
#         }
#         response = requests.post(f"{BASE_URL}/api/employees", json=new_employee_data, headers=admin_headers)
#         if response.status_code == 200:
#             employee = response.json()
#             assert employee["name"] == "Test Employee"
#             test_employee_id = employee["e_id"]
#             print("✅ Create employee successful")
#         else:
#             print(f"⚠️ Create employee returned {response.status_code}: {response.text}")
#             return False
#     except Exception as e:
#         print(f"❌ Create employee failed: {e}")
#         return False

#     # Test update employee
#     try:
#         update_data = {
#             "name": "Updated Test Employee",
#             "position": "Senior Test Engineer"
#         }
#         response = requests.put(f"{BASE_URL}/api/employees/{test_employee_id}", json=update_data, headers=admin_headers)
#         if response.status_code == 200:
#             print("✅ Update employee successful")
#         else:
#             print(f"⚠️ Update employee returned {response.status_code}: {response.text}")
#     except Exception as e:
#         print(f"❌ Update employee failed: {e}")
#         return False

#     # Test upload profile picture
#     try:
#         # Create test image
#         image_data = io.BytesIO(b"fake image data for testing")
#         image_data.name = "test.jpg"

#         files = {"file": ("test.jpg", image_data, "image/jpeg")}
#         response = requests.post(f"{BASE_URL}/api/employees/{test_employee_id}/profile-picture",
#                                files=files, headers=admin_headers)
#         if response.status_code == 200:
#             print("✅ Upload profile picture successful")
#         else:
#             print(f"⚠️ Upload profile picture returned {response.status_code}: {response.text}")
#     except Exception as e:
#         print(f"❌ Upload profile picture failed: {e}")

#     # Test delete employee
#     try:
#         response = requests.delete(f"{BASE_URL}/api/employees/{test_employee_id}", headers=admin_headers)
#         if response.status_code == 200:
#             print("✅ Delete employee successful")
#         else:
#             print(f"⚠️ Delete employee returned {response.status_code}: {response.text}")
#     except Exception as e:
#         print(f"❌ Delete employee failed: {e}")
#         return False

#     return True

# def test_task_management(admin_token, manager_token, dev_token):
#     """Test task management endpoints"""
#     print("\n📋 Testing Task Management...")

#     admin_headers = {"Authorization": f"Bearer {admin_token}"}
#     manager_headers = {"Authorization": f"Bearer {manager_token}"}
#     dev_headers = {"Authorization": f"Bearer {dev_token}"}

#     # Test list tasks (admin)
#     try:
#         response = requests.get(f"{BASE_URL}/api/tasks", headers=admin_headers)
#         assert response.status_code == 200
#         tasks = response.json()
#         assert isinstance(tasks, list)
#         print("✅ List tasks (admin) successful")
#     except Exception as e:
#         print(f"❌ List tasks (admin) failed: {e}")
#         return False

#     # Test list tasks (developer)
#     try:
#         response = requests.get(f"{BASE_URL}/api/tasks", headers=dev_headers)
#         assert response.status_code == 200
#         tasks = response.json()
#         assert isinstance(tasks, list)
#         print("✅ List tasks (developer) successful")
#     except Exception as e:
#         print(f"❌ List tasks (developer) failed: {e}")
#         return False

#     # Test create task
#     try:
#         task_data = {
#             "title": "Integration Test Task",
#             "description": "Task created during integration testing",
#             "priority": "HIGH",
#             "expected_closure": (datetime.now() + timedelta(days=7)).isoformat(),
#             "assigned_to": 3,
#             "reviewer": 2
#         }
#         response = requests.post(f"{BASE_URL}/api/tasks", json=task_data, headers=admin_headers)
#         if response.status_code == 200:
#             task = response.json()
#             test_task_id = task["t_id"]
#             print("✅ Create task successful")
#         else:
#             print(f"⚠️ Create task returned {response.status_code}: {response.text}")
#             return False
#     except Exception as e:
#         print(f"❌ Create task failed: {e}")
#         return False

#     # Test get task details
#     try:
#         response = requests.get(f"{BASE_URL}/api/tasks/{test_task_id}", headers=admin_headers)
#         if response.status_code == 200:
#             task = response.json()
#             assert task["t_id"] == test_task_id
#             print("✅ Get task details successful")
#         else:
#             print(f"⚠️ Get task details returned {response.status_code}: {response.text}")
#     except Exception as e:
#         print(f"❌ Get task details failed: {e}")

#     # Test assign task
#     try:
#         assign_data = {
#             "assigned_to": 4,
#             "reviewer": 2
#         }
#         response = requests.put(f"{BASE_URL}/api/tasks/{test_task_id}/assign", json=assign_data, headers=admin_headers)
#         if response.status_code == 200:
#             print("✅ Assign task successful")
#         else:
#             print(f"⚠️ Assign task returned {response.status_code}: {response.text}")
#     except Exception as e:
#         print(f"❌ Assign task failed: {e}")

#     # Test update task
#     try:
#         update_data = {
#             "title": "Updated Integration Test Task",
#             "priority": "MEDIUM"
#         }
#         response = requests.patch(f"{BASE_URL}/api/tasks/{test_task_id}", json=update_data, headers=manager_headers)
#         if response.status_code == 200:
#             print("✅ Update task successful")
#         else:
#             print(f"⚠️ Update task returned {response.status_code}: {response.text}")
#     except Exception as e:
#         print(f"❌ Update task failed: {e}")

#     # Test delete task
#     try:
#         response = requests.delete(f"{BASE_URL}/api/tasks/{test_task_id}", headers=admin_headers)
#         if response.status_code == 200:
#             print("✅ Delete task successful")
#         else:
#             print(f"⚠️ Delete task returned {response.status_code}: {response.text}")
#     except Exception as e:
#         print(f"❌ Delete task failed: {e}")

#     return True

# def test_remarks(dev_token):
#     """Test remarks endpoints"""
#     print("\n💬 Testing Remarks...")

#     headers = {"Authorization": f"Bearer {dev_token}"}

#     # Test add remark
#     try:
#         response = requests.post(f"{BASE_URL}/api/remarks", params={
#             "task_id": 1,
#             "comment": "This is a test remark from integration testing"
#         }, headers=headers)
#         if response.status_code == 200:
#             print("✅ Add remark successful")
#         else:
#             print(f"⚠️ Add remark returned {response.status_code}: {response.text}")
#     except Exception as e:
#         print(f"❌ Add remark failed: {e}")

#     # Test list remarks
#     try:
#         response = requests.get(f"{BASE_URL}/api/remarks/task/1", headers=headers)
#         if response.status_code == 200:
#             remarks = response.json()
#             assert isinstance(remarks, list)
#             print("✅ List remarks successful")
#         else:
#             print(f"⚠️ List remarks returned {response.status_code}: {response.text}")
#     except Exception as e:
#         print(f"❌ List remarks failed: {e}")

#     # Test add remark with file
#     try:
#         file_data = io.BytesIO(b"test file content for remark")
#         file_data.name = "remark_test.txt"

#         files = {"file": ("remark_test.txt", file_data, "text/plain")}
#         data = {"task_id": 1, "comment": "Remark with file attachment"}

#         response = requests.post(f"{BASE_URL}/api/remarks/with-file",
#                                files=files, data=data, headers=headers)
#         if response.status_code == 200:
#             print("✅ Add remark with file successful")
#         else:
#             print(f"⚠️ Add remark with file returned {response.status_code}: {response.text}")
#     except Exception as e:
#         print(f"❌ Add remark with file failed: {e}")

#     return True

# def test_password_management(admin_token):
#     """Test password management endpoints"""
#     print("\n🔑 Testing Password Management...")

#     headers = {"Authorization": f"Bearer {admin_token}"}

#     # Test change password
#     try:
#         change_data = {
#             "current_password": "resetpassword123",
#             "new_password": "changedpassword123"
#         }
#         response = requests.post(f"{BASE_URL}/api/change-password", json=change_data, headers=headers)
#         if response.status_code == 200:
#             print("✅ Change password successful")
#             # Update token for subsequent requests
#             login_response = requests.post(f"{BASE_URL}/api/login", json={"e_id": 1, "password": "changedpassword123"})
#             if login_response.status_code == 200:
#                 headers = {"Authorization": f"Bearer {login_response.json()['access_token']}"}
#         else:
#             print(f"⚠️ Change password returned {response.status_code}: {response.text}")
#     except Exception as e:
#         print(f"❌ Change password failed: {e}")

#     # Test forgot password
#     try:
#         response = requests.post(f"{BASE_URL}/api/forgot-password", json={"e_id": 1})
#         if response.status_code == 200:
#             data = response.json()
#             assert "reset_token" in data
#             reset_token = data["reset_token"]
#             print("✅ Forgot password successful")
#         else:
#             print(f"⚠️ Forgot password returned {response.status_code}: {response.text}")
#             return False
#     except Exception as e:
#         print(f"❌ Forgot password failed: {e}")
#         return False

#     # Test reset password
#     try:
#         reset_data = {
#             "reset_token": reset_token,
#             "new_password": "finalpassword123"
#         }
#         response = requests.post(f"{BASE_URL}/api/reset-password", json=reset_data)
#         if response.status_code == 200:
#             print("✅ Reset password successful")
#         else:
#             print(f"⚠️ Reset password returned {response.status_code}: {response.text}")
#     except Exception as e:
#         print(f"❌ Reset password failed: {e}")

#     return True

# def test_error_handling():
#     """Test error handling and edge cases"""
#     print("\n🚨 Testing Error Handling...")

#     # Test invalid token
#     try:
#         headers = {"Authorization": "Bearer invalid_token"}
#         response = requests.get(f"{BASE_URL}/api/users", headers=headers)
#         assert response.status_code == 401
#         print("✅ Invalid token properly rejected")
#     except Exception as e:
#         print(f"❌ Invalid token test failed: {e}")

#     # Test no token
#     try:
#         response = requests.get(f"{BASE_URL}/api/users")
#         assert response.status_code == 401
#         print("✅ No token properly rejected")
#     except Exception as e:
#         print(f"❌ No token test failed: {e}")

#     # Test insufficient permissions
#     try:
#         # Login as developer
#         login_response = requests.post(f"{BASE_URL}/api/login", json={"e_id": 3, "password": "dev123"})
#         dev_token = login_response.json()["access_token"]
#         headers = {"Authorization": f"Bearer {dev_token}"}

#         response = requests.get(f"{BASE_URL}/api/users", headers=headers)
#         assert response.status_code == 403
#         print("✅ Insufficient permissions properly rejected")
#     except Exception as e:
#         print(f"❌ Insufficient permissions test failed: {e}")

#     # Test invalid JSON
#     try:
#         headers = {"Authorization": "Bearer some_token", "Content-Type": "application/json"}
#         response = requests.post(f"{BASE_URL}/api/employees", data="invalid json", headers=headers)
#         assert response.status_code == 422
#         print("✅ Invalid JSON properly rejected")
#     except Exception as e:
#         print(f"❌ Invalid JSON test failed: {e}")

#     return True

# def main():
#     """Run all tests"""
#     print("🚀 Starting Comprehensive API Testing Suite")
#     print("=" * 60)

#     # Test health check first
#     if not test_health_check():
#         print("❌ Health check failed. Aborting tests.")
#         return

#     # Test authentication
#     auth_result = test_login_scenarios()
#     if not auth_result:
#         print("❌ Authentication tests failed. Aborting remaining tests.")
#         return

#     admin_token, manager_token, dev_token = auth_result

#     # Run all other tests
#     tests = [
#         (test_user_management, "User Management", [admin_token]),
#         (test_employee_management, "Employee Management", [admin_token, manager_token]),
#         (test_task_management, "Task Management", [admin_token, manager_token, dev_token]),
#         (test_remarks, "Remarks", [dev_token]),
#         (test_password_management, "Password Management", [admin_token]),
#         (test_error_handling, "Error Handling", []),
#     ]

#     passed = 0
#     total = len(tests)

#     for test_func, test_name, args in tests:
#         try:
#             if test_func(*args):
#                 passed += 1
#                 print(f"✅ {test_name} tests passed")
#             else:
#                 print(f"❌ {test_name} tests failed")
#         except Exception as e:
#             print(f"❌ {test_name} tests crashed: {e}")

#     print("\n" + "=" * 60)
#     print(f"📊 Test Results: {passed}/{total} test suites passed")

#     if passed == total:
#         print("🎉 All tests passed! The API is production-ready.")
#     else:
#         print(f"⚠️ {total - passed} test suites failed. Please review the issues above.")

# if __name__ == "__main__":
#     main()