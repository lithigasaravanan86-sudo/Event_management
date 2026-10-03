from datetime import datetime, date
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class Admin(db.Model):
    __tablename__ = 'admin'

    admin_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "admin_id": self.admin_id,
            "username": self.username,
            "full_name": self.full_name,
            "email": self.email,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else None,
            "role": "admin"
        }


class Student(db.Model):
    __tablename__ = 'student'

    student_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    roll_number = db.Column(db.String(30), unique=True, nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    department = db.Column(db.String(50), nullable=False)
    year = db.Column(db.String(20), nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    registrations = db.relationship('Registration', backref='student', lazy=True, cascade="all, delete-orphan")

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "student_id": self.student_id,
            "roll_number": self.roll_number,
            "full_name": self.full_name,
            "email": self.email,
            "department": self.department,
            "year": self.year,
            "phone": self.phone,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else None,
            "role": "student"
        }


class Event(db.Model):
    __tablename__ = 'events'

    event_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50), nullable=False)
    event_date = db.Column(db.Date, nullable=False)
    event_time = db.Column(db.String(50), nullable=False)
    venue = db.Column(db.String(100), nullable=False)
    organizer = db.Column(db.String(100), nullable=False)
    max_participants = db.Column(db.Integer, nullable=False, default=100)
    registration_deadline = db.Column(db.Date, nullable=False)
    banner_url = db.Column(db.String(255), nullable=True)
    status = db.Column(db.String(20), nullable=False, default='Upcoming')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    registrations = db.relationship('Registration', backref='event', lazy=True, cascade="all, delete-orphan")

    @property
    def confirmed_count(self):
        return sum(1 for reg in self.registrations if reg.status == 'Confirmed')

    @property
    def is_registration_open(self):
        today = date.today()
        if self.registration_deadline < today:
            return False
        if self.status in ['Completed', 'Closed']:
            return False
        if self.confirmed_count >= self.max_participants:
            return False
        return True

    def to_dict(self, student_id=None):
        confirmed = self.confirmed_count
        seats_left = max(0, self.max_participants - confirmed)
        percentage = round((confirmed / self.max_participants * 100), 1) if self.max_participants > 0 else 100

        # Check if requesting student is already registered
        is_user_registered = False
        user_registration_id = None
        user_ticket_code = None
        if student_id:
            for reg in self.registrations:
                if reg.student_id == student_id and reg.status == 'Confirmed':
                    is_user_registered = True
                    user_registration_id = reg.registration_id
                    user_ticket_code = reg.ticket_code
                    break

        today = date.today()
        deadline_passed = self.registration_deadline < today
        is_full = confirmed >= self.max_participants

        return {
            "event_id": self.event_id,
            "title": self.title,
            "description": self.description,
            "category": self.category,
            "event_date": self.event_date.strftime("%Y-%m-%d"),
            "event_date_formatted": self.event_date.strftime("%b %d, %Y"),
            "event_time": self.event_time,
            "venue": self.venue,
            "organizer": self.organizer,
            "max_participants": self.max_participants,
            "confirmed_count": confirmed,
            "seats_left": seats_left,
            "fill_percentage": percentage,
            "registration_deadline": self.registration_deadline.strftime("%Y-%m-%d"),
            "registration_deadline_formatted": self.registration_deadline.strftime("%b %d, %Y"),
            "banner_url": self.banner_url or "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80",
            "status": self.status,
            "is_open": self.is_registration_open,
            "deadline_passed": deadline_passed,
            "is_full": is_full,
            "is_user_registered": is_user_registered,
            "user_registration_id": user_registration_id,
            "user_ticket_code": user_ticket_code,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else None
        }


class Registration(db.Model):
    __tablename__ = 'registrations'

    registration_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    event_id = db.Column(db.Integer, db.ForeignKey('events.event_id', ondelete='CASCADE'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('student.student_id', ondelete='CASCADE'), nullable=False)
    registration_date = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    status = db.Column(db.String(20), default='Confirmed', nullable=False) # 'Confirmed', 'Cancelled', 'Attended'
    ticket_code = db.Column(db.String(50), unique=True, nullable=False)
    remarks = db.Column(db.String(255), nullable=True)

    __table_args__ = (
        db.UniqueConstraint('event_id', 'student_id', name='uq_event_student'),
    )

    def to_dict(self):
        return {
            "registration_id": self.registration_id,
            "event_id": self.event_id,
            "student_id": self.student_id,
            "registration_date": self.registration_date.strftime("%Y-%m-%d %H:%M:%S") if self.registration_date else None,
            "registration_date_formatted": self.registration_date.strftime("%b %d, %Y, %I:%M %p") if self.registration_date else None,
            "status": self.status,
            "ticket_code": self.ticket_code,
            "remarks": self.remarks,
            "event": self.event.to_dict() if self.event else None,
            "student": self.student.to_dict() if self.student else None
        }
