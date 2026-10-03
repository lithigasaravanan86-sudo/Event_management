import datetime
from models import db, Admin, Student, Event, Registration

def seed_database(app):
    """
    Seeds initial default records (Admin, Students, Events) if the database is newly created.
    """
    with app.app_context():
        # Check if admin already exists
        if Admin.query.first():
            return

        print("[CEMS Database] Seeding initial demonstration data...")

        # 1. Default Admin
        admin = Admin(
            username="admin",
            full_name="Prof. Rajesh Sharma (Faculty Coordinator)",
            email="admin@college.edu"
        )
        admin.set_password("admin123")
        db.session.add(admin)

        # 2. Sample Students
        s1 = Student(
            roll_number="CS2023001",
            full_name="Aarav Patel",
            email="aarav.patel@student.college.edu",
            department="Computer Science",
            year="3rd Year",
            phone="+91 9876543210"
        )
        s1.set_password("student123")

        s2 = Student(
            roll_number="IT2023045",
            full_name="Ananya Iyer",
            email="ananya.iyer@student.college.edu",
            department="Information Technology",
            year="2nd Year",
            phone="+91 9876543211"
        )
        s2.set_password("student123")

        s3 = Student(
            roll_number="EC2022019",
            full_name="Rohan Verma",
            email="rohan.verma@student.college.edu",
            department="Electronics & Communication",
            year="4th Year",
            phone="+91 9876543212"
        )
        s3.set_password("student123")

        db.session.add_all([s1, s2, s3])
        db.session.flush()

        # 3. Diverse College Events
        e1 = Event(
            title="HackNova 2026 - 24hr Annual Hackathon",
            description="Ignite your coding prowess! Join 100+ teams in a 24-hour sprint tackling AI, Web3, FinTech, and Smart Healthcare challenges with prizes worth Rs. 50,000.",
            category="Technical",
            event_date=datetime.date(2026, 10, 25),
            event_time="09:00 AM - 09:00 AM (Next Day)",
            venue="Main Computing Lab & Innovation Hub",
            organizer="Department of Computer Science & ACM Club",
            max_participants=120,
            registration_deadline=datetime.date(2026, 10, 23),
            banner_url="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80",
            status="Upcoming"
        )

        e2 = Event(
            title="Rhythm & Beats - Inter-College Cultural Fest",
            description="The grandest cultural fiesta of the semester! Showcasing western dance, classical vocals, battle of the bands, and celebrity DJ night.",
            category="Cultural",
            event_date=datetime.date(2026, 10, 28),
            event_time="05:00 PM - 10:00 PM",
            venue="Open Air Amphitheatre",
            organizer="Cultural Committee & Student Council",
            max_participants=350,
            registration_deadline=datetime.date(2026, 10, 26),
            banner_url="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80",
            status="Upcoming"
        )

        e3 = Event(
            title="Hands-on Workshop: Generative AI & LLM Deployment",
            description="An intensive, practical workshop covering prompt engineering, fine-tuning open source models, and deploying RAG pipelines on modern cloud infrastructure.",
            category="Workshop",
            event_date=datetime.date(2026, 10, 18),
            event_time="10:00 AM - 04:00 PM",
            venue="Auditorium Hall B",
            organizer="AI & Data Science Student Chapter",
            max_participants=80,
            registration_deadline=datetime.date(2026, 10, 17),
            banner_url="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
            status="Upcoming"
        )

        e4 = Event(
            title="Inter-Department Football Championship",
            description="Knockout tournament between 16 college departments for the coveted Chancellor Cup. Refreshments and certificates provided for all participants.",
            category="Sports",
            event_date=datetime.date(2026, 10, 30),
            event_time="08:00 AM - 05:00 PM",
            venue="University Sports Complex Ground",
            organizer="Physical Education Directorate",
            max_participants=150,
            registration_deadline=datetime.date(2026, 10, 28),
            banner_url="https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80",
            status="Upcoming"
        )

        e5 = Event(
            title="National Seminar on Green Energy & Sustainable Tech",
            description="Keynote sessions by eminent researchers from IIT and industry leaders on solar microgrids, green hydrogen, and electric vehicle battery ecosystems.",
            category="Seminar",
            event_date=datetime.date(2026, 11, 5),
            event_time="11:00 AM - 02:00 PM",
            venue="Seminar Hall 1",
            organizer="Mechanical & Electrical Engineering Dept",
            max_participants=90,
            registration_deadline=datetime.date(2026, 11, 3),
            banner_url="https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=800&q=80",
            status="Upcoming"
        )

        db.session.add_all([e1, e2, e3, e4, e5])
        db.session.flush()

        # 4. Sample Registrations
        r1 = Registration(
            event_id=e1.event_id,
            student_id=s1.student_id,
            ticket_code="CEMS-HACK-001",
            remarks="Registered for Hackathon Track 1",
            status="Confirmed"
        )
        r2 = Registration(
            event_id=e3.event_id,
            student_id=s1.student_id,
            ticket_code="CEMS-GENAI-002",
            remarks="Workshop registration",
            status="Confirmed"
        )
        r3 = Registration(
            event_id=e2.event_id,
            student_id=s2.student_id,
            ticket_code="CEMS-FEST-003",
            remarks="Cultural fest pass",
            status="Confirmed"
        )

        db.session.add_all([r1, r2, r3])
        db.session.commit()
        print("[CEMS Database] Demonstration data seeded successfully!")
