import json
import sys
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:8000"

def log_test(name, success, info=""):
    status_str = "SUCCESS" if success else "FAILED"
    print(f"[{status_str}] {name} {info}")

def make_request(path, method="GET", data=None, headers=None):
    url = f"{BASE_URL}{path}"
    req_headers = {"Content-Type": "application/json"}
    if headers:
        req_headers.update(headers)
    
    req_data = None
    if data is not None:
        req_data = json.dumps(data).encode("utf-8")
        
    req = urllib.request.Request(url, data=req_data, headers=req_headers, method=method)
    try:
        with urllib.request.urlopen(req) as res:
            res_data = res.read().decode("utf-8")
            status = res.status
            return status, json.loads(res_data) if res_data else {}
    except urllib.error.HTTPError as e:
        err_data = e.read().decode("utf-8")
        try:
            parsed_err = json.loads(err_data)
            detail = parsed_err.get("detail", err_data)
        except Exception:
            detail = err_data
        return e.code, {"detail": detail}
    except Exception as e:
        return 0, {"detail": str(e)}

def run_tests():
    print("--- INTELLCAMP Backend API Verification Suite (No Dependencies) ---")
    
    # 1. Signup / Register Admin
    admin_data = {
        "email": "admin_test@intellcamp.edu",
        "name": "Super Admin Test",
        "password": "secureadminpass",
        "role": "admin"
    }
    
    status, body = make_request("/api/auth/signup", method="POST", data=admin_data)
    if status == 200:
        log_test("Admin Signup", True)
    elif status == 400 and "already registered" in str(body.get("detail", "")):
        log_test("Admin Signup", True, "(Admin already registered, skipping signup)")
    else:
        log_test("Admin Signup", False, f"Status: {status}, Msg: {body}")
        if status == 0:
            print("[INFO] Make sure the FastAPI server is running on http://127.0.0.1:8000")
            return

    # 2. Login Admin to obtain Token
    login_data = {
        "email": "admin_test@intellcamp.edu",
        "password": "secureadminpass"
    }
    token = None
    status, body = make_request("/api/auth/login", method="POST", data=login_data)
    if status == 200:
        token = body.get("access_token")
        log_test("Admin Login", True)
    else:
        log_test("Admin Login", False, f"Status: {status}, Msg: {body}")
        return

    headers = {"Authorization": f"Bearer {token}"}

    # 3. Create Department (Admin Feature)
    dept_data = {
        "name": "Computer Science & Engineering",
        "code": "CS"
    }
    status, body = make_request("/api/admin/departments", method="POST", data=dept_data, headers=headers)
    if status == 200:
        log_test("Create Department", True)
    elif status == 400 and "already exists" in str(body.get("detail", "")):
        log_test("Create Department", True, "(Department already exists, verified)")
    else:
        log_test("Create Department", False, f"Status: {status}, Msg: {body}")

    # 4. Create Teacher Account (Admin Feature)
    teacher_data = {
        "email": "teacher_test@intellcamp.edu",
        "name": "Professor Vance",
        "password": "secureteacherpass",
        "role": "teacher"
    }
    teacher_id = None
    status, body = make_request("/api/admin/users", method="POST", data=teacher_data, headers=headers)
    if status == 200:
        teacher_id = body.get("id")
        log_test("Create Teacher User", True, f"Teacher ID: {teacher_id}")
    elif status == 400 and "already registered" in str(body.get("detail", "")):
        status_users, users_body = make_request("/api/admin/users", headers=headers)
        if status_users == 200:
            for u in users_body:
                if u["email"] == "teacher_test@intellcamp.edu":
                    teacher_id = u["id"]
        log_test("Create Teacher User", True, f"(Already registered. Fetched ID: {teacher_id})")
    else:
        log_test("Create Teacher User", False, f"Status: {status}, Msg: {body}")

    # 5. Create Classroom
    classroom_data = {
        "name": "Advanced Distributed Systems",
        "code": "CS-402"
    }
    classroom_id = None
    status, body = make_request("/api/classrooms", method="POST", data=classroom_data, headers=headers)
    if status == 200:
        classroom_id = body.get("id")
        log_test("Create Classroom", True, f"Room ID: {classroom_id}")
    elif status == 400 and "already exists" in str(body.get("detail", "")):
        status_rooms, rooms_body = make_request("/api/classrooms")
        if status_rooms == 200:
            for r in rooms_body:
                if r["code"] == "CS-402":
                    classroom_id = r["id"]
        log_test("Create Classroom", True, f"(Already exists. Fetched ID: {classroom_id})")
    else:
        log_test("Create Classroom", False, f"Status: {status}, Msg: {body}")

    # 6. Assign Teacher to Classroom (Admin Feature)
    if classroom_id and teacher_id:
        status, body = make_request(f"/api/admin/classrooms/{classroom_id}/assign", method="PUT", data={"teacher_id": teacher_id}, headers=headers)
        if status == 200:
            log_test("Assign Teacher to Subject", True)
        else:
            log_test("Assign Teacher to Subject", False, f"Status: {status}, Msg: {body}")
    else:
        log_test("Assign Teacher to Subject", False, "Skipped due to missing Classroom/Teacher ID")

    # 7. Create Timetable Schedule (Admin Feature)
    if classroom_id:
        schedule_data = {
            "classroom_id": classroom_id,
            "day_of_week": "Monday",
            "start_time": "14:00",
            "end_time": "15:30",
            "subject_name": "Advanced Distributed Systems"
        }
        status, body = make_request("/api/admin/timetables", method="POST", data=schedule_data, headers=headers)
        if status == 200:
            log_test("Schedule Timetable Block", True)
        else:
            log_test("Schedule Timetable Block", False, f"Status: {status}, Msg: {body}")
    else:
        log_test("Schedule Timetable Block", False, "Skipped due to missing Classroom ID")

    # 8. Create Student Account
    student_data = {
        "email": "student_test@intellcamp.edu",
        "name": "Jane Doe Student",
        "password": "securestudentpass",
        "role": "student"
    }
    status, body = make_request("/api/auth/signup", method="POST", data=student_data)
    if status == 200:
        log_test("Student Signup", True)
    elif status == 400 and "already registered" in str(body.get("detail", "")):
        log_test("Student Signup", True, "(Already registered, skipping)")
    else:
        log_test("Student Signup", False, f"Status: {status}, Msg: {body}")

    # 9. Fetch Timetable Schedules
    status, body = make_request("/api/admin/timetables")
    if status == 200:
        found = any(s["classroom_code"] == "CS-402" for s in body)
        log_test("Retrieve Master Timetable", found, f"Total schedules: {len(body)}")
    else:
        log_test("Retrieve Master Timetable", False, f"Status: {status}")

    # 10. Fetch System Telemetry & Metrics (Admin Feature)
    status, body = make_request("/api/admin/system/metrics", headers=headers)
    if status == 200:
        log_test("Verify System Health Metrics", True, f"DB Health: {body.get('database_health')}, CPU: {body.get('cpu_usage')}%")
    else:
        log_test("Verify System Health Metrics", False, f"Status: {status}")

    print("--- INTELLCAMP Verification Completed ---")

if __name__ == "__main__":
    run_tests()
