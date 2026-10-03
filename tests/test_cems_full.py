"""
Comprehensive End-to-End Test Suite for College Event Management System (CEMS)
Validates all Student, Admin, Event, and Registration operations.
"""
import urllib.request
import urllib.parse
import json
import http.cookiejar

BASE_URL = "http://127.0.0.1:5000"

def make_session():
    cookie_jar = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cookie_jar))
    return opener

def post_json(opener, path, data):
    url = BASE_URL + path
    payload = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"}, method="POST")
    try:
        res = opener.open(req)
        return res.status, json.loads(res.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())

def put_json(opener, path, data):
    url = BASE_URL + path
    payload = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"}, method="PUT")
    try:
        res = opener.open(req)
        return res.status, json.loads(res.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())

def get_json(opener, path):
    url = BASE_URL + path
    req = urllib.request.Request(url, method="GET")
    try:
        res = opener.open(req)
        return res.status, json.loads(res.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())

def delete_req(opener, path):
    url = BASE_URL + path
    req = urllib.request.Request(url, method="DELETE")
    try:
        res = opener.open(req)
        return res.status, json.loads(res.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())

def run_tests():
    print("=" * 60)
    print(" Running Complete CEMS End-to-End Test Suite")
    print("=" * 60)

    # 1. Test Public Events Listing
    public_sess = make_session()
    status, data = get_json(public_sess, "/api/events")
    assert status == 200, f"Expected 200, got {status}"
    assert data["success"] is True
    print(f" [PASS] Public /api/events returned {data['count']} events.")

    # 2. Test Student Registration
    import time
    student_sess = make_session()
    test_roll = f"TEST{int(time.time()) % 100000}"
    reg_payload = {
        "roll_number": test_roll,
        "full_name": "Test Student User",
        "email": f"{test_roll.lower()}@college.edu",
        "department": "Computer Science",
        "year": "2nd Year",
        "phone": "+91 9998887776",
        "password": "password123"
    }
    status, reg_res = post_json(student_sess, "/api/auth/student/register", reg_payload)
    assert status == 201, f"Student register failed: {status}, {reg_res}"
    print(f" [PASS] Student registration successful: {reg_res['user']['full_name']} ({reg_res['user']['roll_number']})")

    # 3. Test Student Auth Status
    status, me_data = get_json(student_sess, "/api/auth/me")
    assert me_data["authenticated"] is True
    assert me_data["role"] == "student"
    print(f" [PASS] Student session recognized: role={me_data['role']}")

    # 4. Test Student Event Registration
    status, reg_ev_res = post_json(student_sess, "/api/events/1/register", {})
    assert status == 201, f"Event registration failed: {status}, {reg_ev_res}"
    ticket = reg_ev_res["registration"]["ticket_code"]
    reg_id = reg_ev_res["registration"]["registration_id"]
    print(f" [PASS] Student registered for Event #1. Ticket code: {ticket}")

    # 5. Prevent Duplicate Registration
    status, dup_res = post_json(student_sess, "/api/events/1/register", {})
    assert status == 409, f"Expected 409 Conflict for duplicate registration, got {status}"
    print(" [PASS] Duplicate registration properly prevented (HTTP 409).")

    # 6. View Student Registrations
    status, my_regs = get_json(student_sess, "/api/student/registrations")
    assert status == 200
    assert any(r["ticket_code"] == ticket for r in my_regs["registrations"])
    print(f" [PASS] Registration history returned {my_regs['count']} records.")

    # 7. Student Cancel Registration
    status, cancel_res = post_json(student_sess, f"/api/student/registrations/{reg_id}/cancel", {})
    assert status == 200
    assert cancel_res["success"] is True
    print(" [PASS] Student successfully cancelled registration (seat released).")

    # 8. Admin Login
    admin_sess = make_session()
    status, admin_login_res = post_json(admin_sess, "/api/auth/admin/login", {
        "identifier": "admin",
        "password": "admin123"
    })
    assert status == 200, f"Admin login failed: {status}, {admin_login_res}"
    print(f" [PASS] Admin logged in: {admin_login_res['user']['full_name']}")

    # 9. Admin Stats API
    status, stats_res = get_json(admin_sess, "/api/admin/stats")
    assert status == 200
    stats = stats_res["stats"]
    print(f" [PASS] Admin stats: Total Events={stats['total_events']}, Registrations={stats['total_registrations']}, Students={stats['total_students']}")

    # 10. Admin Create Event
    new_event_payload = {
        "title": "Automated Test Coding Contest",
        "description": "Annual algorithm coding sprint for competitive programmers.",
        "category": "Technical",
        "event_date": "2026-11-20",
        "event_time": "02:00 PM - 05:00 PM",
        "venue": "Lab 101",
        "organizer": "Coding Club",
        "max_participants": 50,
        "registration_deadline": "2026-11-18",
        "banner_url": "",
        "status": "Upcoming"
    }
    status, create_ev_res = post_json(admin_sess, "/api/admin/events", new_event_payload)
    assert status == 201, f"Failed to create event: {status}, {create_ev_res}"
    created_id = create_ev_res["event"]["event_id"]
    print(f" [PASS] Admin created new event with ID #{created_id}")

    # 11. Admin Edit Event
    status, update_res = put_json(admin_sess, f"/api/admin/events/{created_id}", {
        "title": "Automated Test Coding Contest (Updated)",
        "max_participants": 60
    })
    assert status == 200
    print(f" [PASS] Admin updated event #{created_id} title and capacity.")

    # 12. Admin Delete Event
    status, del_res = delete_req(admin_sess, f"/api/admin/events/{created_id}")
    assert status == 200
    print(f" [PASS] Admin deleted event #{created_id}")

    # 13. Admin CSV Export
    csv_req = urllib.request.Request(BASE_URL + "/api/admin/export-registrations")
    csv_res = admin_sess.open(csv_req)
    assert csv_res.status == 200
    assert "text/csv" in csv_res.headers.get("Content-Type")
    csv_body = csv_res.read().decode("utf-8")
    assert "Ticket Code" in csv_body
    print(" [PASS] Admin registrations CSV export verified.")

    print("=" * 60)
    print(" ALL 13 TEST CASES PASSED SUCCESSFULLY! ")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
