import os
import csv
import io
import uuid
import datetime
from flask import Flask, request, jsonify, render_template, session, make_response
from flask_cors import CORS
from config import Config
from models import db, Admin, Student, Event, Registration
from database.seed_data import seed_database

app = Flask(__name__, static_folder="static", template_folder="templates")
app.config.from_object(Config)

# Configure Database URI (MySQL or intelligent SQLite fallback)
db_uri, db_engine_name = Config.get_database_uri()
app.config["SQLALCHEMY_DATABASE_URI"] = db_uri
app.config["DB_ENGINE_NAME"] = db_engine_name

CORS(app)
db.init_app(app)

# Initialize database tables and demo seed
with app.app_context():
    try:
        db.create_all()
        seed_database(app)
    except Exception as e:
        print(f"[CEMS Startup Error] Could not initialize database: {e}")

# ====================================================================
# Helper Decorators & Functions
# ====================================================================
def get_current_user():
    """Returns (user_object, 'admin' | 'student' | None)"""
    if "admin_id" in session:
        admin = db.session.get(Admin, session["admin_id"])
        if admin:
            return admin, "admin"
    elif "student_id" in session:
        student = db.session.get(Student, session["student_id"])
        if student:
            return student, "student"
    return None, None

def admin_required(f):
    def wrapper(*args, **kwargs):
        user, role = get_current_user()
        if role != "admin":
            return jsonify({"success": False, "message": "Admin authorization required"}), 403
        return f(*args, **kwargs)
    wrapper.__name__ = f.__name__
    return wrapper

def student_required(f):
    def wrapper(*args, **kwargs):
        user, role = get_current_user()
        if role != "student":
            return jsonify({"success": False, "message": "Student login required"}), 401
        return f(*args, **kwargs)
    wrapper.__name__ = f.__name__
    return wrapper

# ====================================================================
# Page Routes (Frontend Templates)
# ====================================================================
@app.route("/")
def home_page():
    return render_template("index.html")

@app.route("/events")
def events_page():
    return render_template("events.html")

@app.route("/login")
def login_page():
    return render_template("login.html")

@app.route("/student-dashboard")
def student_dashboard_page():
    return render_template("student-dashboard.html")

@app.route("/admin-dashboard")
def admin_dashboard_page():
    return render_template("admin-dashboard.html")

# ====================================================================
# Authentication APIs
# ====================================================================
@app.route("/api/auth/me", methods=["GET"])
def get_auth_status():
    user, role = get_current_user()
    if not user:
        return jsonify({
            "authenticated": False,
            "user": None,
            "db_engine": app.config.get("DB_ENGINE_NAME", "Unknown")
        })
    return jsonify({
        "authenticated": True,
        "role": role,
        "user": user.to_dict(),
        "db_engine": app.config.get("DB_ENGINE_NAME", "Unknown")
    })

@app.route("/api/auth/student/register", methods=["POST"])
def student_register():
    data = request.get_json() or {}
    roll_number = data.get("roll_number", "").strip().upper()
    full_name = data.get("full_name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    department = data.get("department", "").strip()
    year = data.get("year", "").strip()
    phone = data.get("phone", "").strip()

    if not all([roll_number, full_name, email, password, department, year]):
        return jsonify({"success": False, "message": "All required fields must be filled"}), 400

    if len(password) < 6:
        return jsonify({"success": False, "message": "Password must be at least 6 characters"}), 400

    if Student.query.filter_by(roll_number=roll_number).first():
        return jsonify({"success": False, "message": "Roll number already registered"}), 409

    if Student.query.filter_by(email=email).first():
        return jsonify({"success": False, "message": "Email address already registered"}), 409

    try:
        new_student = Student(
            roll_number=roll_number,
            full_name=full_name,
            email=email,
            department=department,
            year=year,
            phone=phone
        )
        new_student.set_password(password)
        db.session.add(new_student)
        db.session.commit()

        # Automatically log in after registration
        session.clear()
        session["student_id"] = new_student.student_id

        return jsonify({
            "success": True,
            "message": "Student registration successful!",
            "user": new_student.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Registration failed: {str(e)}"}), 500

@app.route("/api/auth/student/login", methods=["POST"])
def student_login():
    data = request.get_json() or {}
    identifier = data.get("identifier", "").strip() # roll_number or email
    password = data.get("password", "")

    if not identifier or not password:
        return jsonify({"success": False, "message": "Please enter Roll Number / Email and password"}), 400

    # Find by roll number or email
    student = Student.query.filter(
        (Student.roll_number == identifier.upper()) | (Student.email == identifier.lower())
    ).first()

    if not student or not student.check_password(password):
        return jsonify({"success": False, "message": "Invalid Roll Number/Email or password"}), 401

    session.clear()
    session["student_id"] = student.student_id

    return jsonify({
        "success": True,
        "message": f"Welcome back, {student.full_name}!",
        "user": student.to_dict()
    })

@app.route("/api/auth/admin/login", methods=["POST"])
def admin_login():
    data = request.get_json() or {}
    identifier = data.get("identifier", "").strip() # username or email
    password = data.get("password", "")

    if not identifier or not password:
        return jsonify({"success": False, "message": "Please enter username/email and password"}), 400

    admin = Admin.query.filter(
        (Admin.username == identifier) | (Admin.email == identifier.lower())
    ).first()

    if not admin or not admin.check_password(password):
        return jsonify({"success": False, "message": "Invalid admin credentials"}), 401

    session.clear()
    session["admin_id"] = admin.admin_id

    return jsonify({
        "success": True,
        "message": f"Welcome back, Admin {admin.full_name}!",
        "user": admin.to_dict()
    })

@app.route("/api/auth/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"success": True, "message": "Logged out successfully"})

# ====================================================================
# Events APIs (Public & Admin)
# ====================================================================
@app.route("/api/events", methods=["GET"])
def list_events():
    category = request.args.get("category", "").strip()
    search = request.args.get("search", "").strip()
    status = request.args.get("status", "").strip()
    upcoming_only = request.args.get("upcoming_only", "false").lower() == "true"

    query = Event.query

    if category and category.lower() != "all":
        query = query.filter(Event.category.ilike(category))

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Event.title.ilike(search_filter)) |
            (Event.description.ilike(search_filter)) |
            (Event.venue.ilike(search_filter)) |
            (Event.organizer.ilike(search_filter))
        )

    if status:
        query = query.filter(Event.status == status)

    if upcoming_only:
        today = datetime.date.today()
        query = query.filter(Event.event_date >= today)

    # Order by event date ascending
    events = query.order_by(Event.event_date.asc()).all()

    student_id = session.get("student_id")
    events_data = [event.to_dict(student_id=student_id) for event in events]

    return jsonify({
        "success": True,
        "count": len(events_data),
        "events": events_data
    })

@app.route("/api/events/<int:event_id>", methods=["GET"])
def get_event(event_id):
    event = db.session.get(Event, event_id)
    if not event:
        return jsonify({"success": False, "message": "Event not found"}), 404

    student_id = session.get("student_id")
    return jsonify({
        "success": True,
        "event": event.to_dict(student_id=student_id)
    })

@app.route("/api/admin/events", methods=["POST"])
@admin_required
def create_event():
    data = request.get_json() or {}

    title = data.get("title", "").strip()
    description = data.get("description", "").strip()
    category = data.get("category", "").strip()
    event_date_str = data.get("event_date", "").strip()
    event_time = data.get("event_time", "").strip()
    venue = data.get("venue", "").strip()
    organizer = data.get("organizer", "").strip()
    max_participants = int(data.get("max_participants", 100))
    deadline_str = data.get("registration_deadline", "").strip()
    banner_url = data.get("banner_url", "").strip()
    status = data.get("status", "Upcoming").strip()

    if not all([title, description, category, event_date_str, event_time, venue, organizer, deadline_str]):
        return jsonify({"success": False, "message": "Please fill in all required event details"}), 400

    try:
        event_date = datetime.datetime.strptime(event_date_str, "%Y-%m-%d").date()
        deadline = datetime.datetime.strptime(deadline_str, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"success": False, "message": "Dates must be in YYYY-MM-DD format"}), 400

    if deadline > event_date:
        return jsonify({"success": False, "message": "Registration deadline cannot be after the event date"}), 400

    if max_participants <= 0:
        return jsonify({"success": False, "message": "Max participants must be greater than 0"}), 400

    try:
        new_event = Event(
            title=title,
            description=description,
            category=category,
            event_date=event_date,
            event_time=event_time,
            venue=venue,
            organizer=organizer,
            max_participants=max_participants,
            registration_deadline=deadline,
            banner_url=banner_url or None,
            status=status
        )
        db.session.add(new_event)
        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Event created successfully!",
            "event": new_event.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Failed to create event: {str(e)}"}), 500

@app.route("/api/admin/events/<int:event_id>", methods=["PUT"])
@admin_required
def update_event(event_id):
    event = db.session.get(Event, event_id)
    if not event:
        return jsonify({"success": False, "message": "Event not found"}), 404

    data = request.get_json() or {}

    try:
        if "title" in data:
            event.title = data["title"].strip()
        if "description" in data:
            event.description = data["description"].strip()
        if "category" in data:
            event.category = data["category"].strip()
        if "event_date" in data:
            event.event_date = datetime.datetime.strptime(data["event_date"], "%Y-%m-%d").date()
        if "event_time" in data:
            event.event_time = data["event_time"].strip()
        if "venue" in data:
            event.venue = data["venue"].strip()
        if "organizer" in data:
            event.organizer = data["organizer"].strip()
        if "max_participants" in data:
            event.max_participants = int(data["max_participants"])
        if "registration_deadline" in data:
            event.registration_deadline = datetime.datetime.strptime(data["registration_deadline"], "%Y-%m-%d").date()
        if "banner_url" in data:
            event.banner_url = data["banner_url"].strip() or None
        if "status" in data:
            event.status = data["status"].strip()

        if event.registration_deadline > event.event_date:
            return jsonify({"success": False, "message": "Registration deadline cannot be after the event date"}), 400

        db.session.commit()
        return jsonify({
            "success": True,
            "message": "Event updated successfully!",
            "event": event.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Failed to update event: {str(e)}"}), 500

@app.route("/api/admin/events/<int:event_id>", methods=["DELETE"])
@admin_required
def delete_event(event_id):
    event = db.session.get(Event, event_id)
    if not event:
        return jsonify({"success": False, "message": "Event not found"}), 404

    try:
        db.session.delete(event)
        db.session.commit()
        return jsonify({"success": True, "message": f"Event '{event.title}' deleted successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Failed to delete event: {str(e)}"}), 500

# ====================================================================
# Registration APIs (Student & Admin)
# ====================================================================
@app.route("/api/events/<int:event_id>/register", methods=["POST"])
@student_required
def register_for_event(event_id):
    student_id = session.get("student_id")
    event = db.session.get(Event, event_id)

    if not event:
        return jsonify({"success": False, "message": "Event not found"}), 404

    # Check if event is active and registration deadline
    today = datetime.date.today()
    if event.registration_deadline < today:
        return jsonify({"success": False, "message": "Registration for this event has ended"}), 400

    if event.status in ["Completed", "Closed"]:
        return jsonify({"success": False, "message": f"This event is marked as {event.status}"}), 400

    # Check existing registration
    existing_reg = Registration.query.filter_by(event_id=event_id, student_id=student_id).first()
    if existing_reg:
        if existing_reg.status == "Confirmed":
            return jsonify({
                "success": False,
                "message": "You are already registered for this event!",
                "ticket_code": existing_reg.ticket_code
            }), 409
        elif existing_reg.status == "Cancelled":
            # Re-activate registration
            if event.confirmed_count >= event.max_participants:
                return jsonify({"success": False, "message": "Sorry, event capacity has been reached"}), 400
            existing_reg.status = "Confirmed"
            existing_reg.registration_date = datetime.datetime.utcnow()
            db.session.commit()
            return jsonify({
                "success": True,
                "message": "Your registration has been successfully re-activated!",
                "registration": existing_reg.to_dict()
            })

    # Check capacity
    if event.confirmed_count >= event.max_participants:
        return jsonify({"success": False, "message": "Event is full! Maximum participants reached."}), 400

    # Generate unique ticket code
    ticket_code = f"CEMS-{event.event_id}-{uuid.uuid4().hex[:6].upper()}"

    try:
        new_reg = Registration(
            event_id=event.event_id,
            student_id=student_id,
            ticket_code=ticket_code,
            status="Confirmed",
            remarks="Registered via Student Portal"
        )
        db.session.add(new_reg)
        db.session.commit()

        return jsonify({
            "success": True,
            "message": f"Successfully registered for {event.title}!",
            "registration": new_reg.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Registration failed: {str(e)}"}), 500

@app.route("/api/student/registrations", methods=["GET"])
@student_required
def get_student_registrations():
    student_id = session.get("student_id")
    registrations = Registration.query.filter_by(student_id=student_id).order_by(Registration.registration_date.desc()).all()
    return jsonify({
        "success": True,
        "count": len(registrations),
        "registrations": [reg.to_dict() for reg in registrations]
    })

@app.route("/api/student/registrations/<int:reg_id>/cancel", methods=["POST"])
@student_required
def cancel_registration(reg_id):
    student_id = session.get("student_id")
    reg = Registration.query.filter_by(registration_id=reg_id, student_id=student_id).first()

    if not reg:
        return jsonify({"success": False, "message": "Registration record not found"}), 404

    if reg.status == "Cancelled":
        return jsonify({"success": False, "message": "Registration is already cancelled"}), 400

    try:
        reg.status = "Cancelled"
        db.session.commit()
        return jsonify({
            "success": True,
            "message": "Registration cancelled successfully. Your seat has been released."
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Failed to cancel registration: {str(e)}"}), 500

# ====================================================================
# Admin Management & Dashboard APIs
# ====================================================================
@app.route("/api/admin/registrations", methods=["GET"])
@admin_required
def get_admin_registrations():
    event_id = request.args.get("event_id")
    query = Registration.query

    if event_id:
        query = query.filter_by(event_id=int(event_id))

    registrations = query.order_by(Registration.registration_date.desc()).all()

    return jsonify({
        "success": True,
        "count": len(registrations),
        "registrations": [reg.to_dict() for reg in registrations]
    })

@app.route("/api/admin/stats", methods=["GET"])
@admin_required
def get_admin_stats():
    total_events = Event.query.count()
    total_students = Student.query.count()
    total_registrations = Registration.query.filter_by(status="Confirmed").count()

    today = datetime.date.today()
    active_events = Event.query.filter(Event.event_date >= today, Event.status != 'Closed').count()
    past_events = Event.query.filter(Event.event_date < today).count()

    # Category breakdown
    categories = ["Technical", "Cultural", "Sports", "Workshop", "Seminar"]
    category_counts = {}
    for cat in categories:
        count = db.session.query(Registration).join(Event).filter(
            Event.category == cat, Registration.status == "Confirmed"
        ).count()
        category_counts[cat] = count

    # Recent registrations (last 5)
    recent_regs = Registration.query.order_by(Registration.registration_date.desc()).limit(5).all()

    return jsonify({
        "success": True,
        "stats": {
            "total_events": total_events,
            "total_students": total_students,
            "total_registrations": total_registrations,
            "active_events": active_events,
            "past_events": past_events,
            "category_breakdown": category_counts,
            "recent_registrations": [r.to_dict() for r in recent_regs]
        }
    })

@app.route("/api/admin/export-registrations", methods=["GET"])
@admin_required
def export_registrations():
    """Generates a downloadable CSV containing all event registration details."""
    event_id = request.args.get("event_id")
    query = Registration.query

    if event_id:
        query = query.filter_by(event_id=int(event_id))

    registrations = query.order_by(Registration.registration_date.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)

    # Header Row
    writer.writerow([
        "Registration ID",
        "Ticket Code",
        "Event Title",
        "Event Category",
        "Event Date",
        "Student Roll No",
        "Student Name",
        "Student Email",
        "Department",
        "Year",
        "Phone",
        "Status",
        "Registration Timestamp"
    ])

    for reg in registrations:
        ev = reg.event
        st = reg.student
        writer.writerow([
            reg.registration_id,
            reg.ticket_code,
            ev.title if ev else "N/A",
            ev.category if ev else "N/A",
            ev.event_date.strftime("%Y-%m-%d") if ev else "N/A",
            st.roll_number if st else "N/A",
            st.full_name if st else "N/A",
            st.email if st else "N/A",
            st.department if st else "N/A",
            st.year if st else "N/A",
            st.phone if st else "N/A",
            reg.status,
            reg.registration_date.strftime("%Y-%m-%d %H:%M:%S") if reg.registration_date else "N/A"
        ])

    csv_data = output.getvalue()
    response = make_response(csv_data)
    response.headers["Content-Disposition"] = "attachment; filename=cems_registrations_report.csv"
    response.headers["Content-type"] = "text/csv"
    return response

# ====================================================================
# Run Application
# ====================================================================
if __name__ == "__main__":
    print("=" * 60)
    print(" [CEMS] College Event Management System Starting...")
    print(f" [CEMS] Active Database Engine: {app.config.get('DB_ENGINE_NAME')}")
    print(" [CEMS] Application URL: http://127.0.0.1:5000")
    print("=" * 60)
    app.run(debug=True, host="0.0.0.0", port=5000)
