# 🎓 College Event Management System (CEMS)

A full-stack, responsive web application for managing college events, workshops, hackathons, sports tournaments, and student registrations. Built for college mini-projects, semester projects, and campus clubs.

---

## 🌟 Key Features

### 👨‍💼 Admin Module
- **Admin Authentication:** Secure login for faculty coordinators and club leaders.
- **Event Lifecycle Management (CRUD):** Add, edit, update status (Upcoming, Ongoing, Completed, Closed), and delete events.
- **Student Registration Directory:** View all registered students per event with roll numbers, department, year, email, phone, and ticket references.
- **Export to CSV:** One-click download of attendance and registration records.
- **Dynamic KPI Dashboard:** Real-time counters for Total Events, Total Registrations, Active Events, and Registered Students with category distribution charts.

### 🧑‍🎓 Student Module
- **Registration & Authentication:** Sign up with college roll number, department, year, and secure password hashing.
- **Explore Events Catalog:** Filter by category (*Technical, Cultural, Sports, Workshop, Seminar*) and search in real-time.
- **1-Click Event Registration:** Validates registration deadlines and maximum participant capacity before reserving a seat.
- **Digital Event Pass (E-Ticket):** Generates a unique digital ticket with reference code, student roll number, event details, and print/save functionality.
- **Self-Service Cancellation:** Free up seats by cancelling registrations anytime prior to the event.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML5, Modern Vanilla CSS3 (Custom Design System), JavaScript (ES6+ Fetch API) |
| **Backend** | Python Flask 3.0, Flask-SQLAlchemy, Werkzeug Security |
| **Database** | MySQL (with automatic local SQLite fallback for 100% zero-configuration presentations) |
| **Driver** | PyMySQL Connector |

---

## 📁 Complete Folder Structure

```
CEMS/
├── app.py                      # Main Flask application with REST APIs and page routes
├── config.py                   # Configuration and dual MySQL/SQLite engine manager
├── models.py                   # SQLAlchemy models (Admin, Student, Event, Registration)
├── requirements.txt            # Python dependencies
├── .env.example                # Sample environment configuration
├── database/
│   ├── schema.sql              # Pure MySQL schema script & initial seed data
│   ├── seed_data.py            # Python seeder for pre-populating mock records
│   └── init_mysql.py           # Automated script to initialize MySQL from CLI
├── static/
│   ├── css/
│   │   └── styles.css          # Modern glassmorphism UI styles & animations
│   └── js/
│       ├── app.js              # Global utilities, toasts, modal controllers, navbar sync
│       ├── auth.js             # Authentication, tab switcher, demo credentials filler
│       ├── events.js           # Live events catalog, category filtering, details modal
│       ├── student.js          # Student portal, registration history, digital pass modal
│       └── admin.js            # Admin panel, event CRUD, student registrations, CSV export
├── templates/
│   ├── index.html              # Home landing page with featured events & categories
│   ├── events.html             # Events catalog & search
│   ├── login.html              # Unified Sign In / Registration portal
│   ├── student-dashboard.html  # Student dashboard & tickets
│   └── admin-dashboard.html    # Faculty coordinator & event manager panel
└── tests/
    └── test_cems_full.py       # End-to-end automated test suite (13 test cases)
```

---

## 🗄️ Database Schema & Tables

### 1. `admin`
| Column | Type | Description |
|---|---|---|
| `admin_id` | INT AUTO_INCREMENT PRIMARY KEY | Unique admin identifier |
| `username` | VARCHAR(50) UNIQUE NOT NULL | Admin login username |
| `password_hash` | VARCHAR(255) NOT NULL | Securely hashed password |
| `full_name` | VARCHAR(100) NOT NULL | Faculty/Coordinator name |
| `email` | VARCHAR(100) UNIQUE NOT NULL | Contact email |
| `created_at` | DATETIME | Account timestamp |

### 2. `student`
| Column | Type | Description |
|---|---|---|
| `student_id` | INT AUTO_INCREMENT PRIMARY KEY | Unique student identifier |
| `roll_number` | VARCHAR(30) UNIQUE NOT NULL | College Roll Number |
| `full_name` | VARCHAR(100) NOT NULL | Student's full name |
| `email` | VARCHAR(100) UNIQUE NOT NULL | College student email |
| `password_hash` | VARCHAR(255) NOT NULL | Securely hashed password |
| `department` | VARCHAR(50) NOT NULL | Branch / Department |
| `year` | VARCHAR(20) NOT NULL | Academic year (e.g. 3rd Year) |
| `phone` | VARCHAR(20) | Contact phone number |
| `created_at` | DATETIME | Registration timestamp |

### 3. `events`
| Column | Type | Description |
|---|---|---|
| `event_id` | INT AUTO_INCREMENT PRIMARY KEY | Unique event ID |
| `title` | VARCHAR(150) NOT NULL | Event name / title |
| `description` | TEXT NOT NULL | Detailed description & guidelines |
| `category` | VARCHAR(50) NOT NULL | Technical, Cultural, Sports, Workshop, Seminar |
| `event_date` | DATE NOT NULL | Date of the event |
| `event_time` | VARCHAR(50) NOT NULL | Schedule (e.g. 10:00 AM - 04:00 PM) |
| `venue` | VARCHAR(100) NOT NULL | Campus venue / Hall |
| `organizer` | VARCHAR(100) NOT NULL | Organizing club or department |
| `max_participants` | INT NOT NULL | Maximum seat capacity |
| `registration_deadline` | DATE NOT NULL | Cutoff date for student registration |
| `banner_url` | VARCHAR(255) | Image banner |
| `status` | VARCHAR(20) | Upcoming, Ongoing, Completed, Closed |
| `created_at` | DATETIME | Creation timestamp |

### 4. `registrations`
| Column | Type | Description |
|---|---|---|
| `registration_id` | INT AUTO_INCREMENT PRIMARY KEY | Unique registration ID |
| `event_id` | INT (FK to `events`) | Event reference |
| `student_id` | INT (FK to `student`) | Student reference |
| `registration_date` | DATETIME | Registration timestamp |
| `status` | VARCHAR(20) | Confirmed, Cancelled, Attended |
| `ticket_code` | VARCHAR(50) UNIQUE | Unique e-Ticket code |
| `remarks` | VARCHAR(255) | Optional notes |

---

## 🚀 How to Run the Project

### 1. Prerequisites
- Python 3.9+ (Installed)
- MySQL (Optional: via XAMPP, WAMP, or standalone MySQL server)

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Setting Up MySQL (Recommended for College Viva)

#### Option A: Using XAMPP / phpMyAdmin
1. Start **Apache** and **MySQL** in XAMPP Control Panel.
2. Open your browser and navigate to `http://localhost/phpmyadmin`.
3. Click on the **Import** tab.
4. Choose the file `database/schema.sql` and click **Go**.
5. The `cems_db` database and all sample tables/events will be populated automatically!

#### Option B: Using Automated Python Script
When MySQL is running on port 3306:
```bash
python database/init_mysql.py
```

#### Option C: Out-of-the-Box Zero-Configuration Fallback
If MySQL is not installed or offline, CEMS **automatically detects this and switches seamlessly to a local database (`cems.db`)**. This guarantees that your presentation will never crash due to a database connection error!

---

### 4. Start the Application
```bash
python app.py
```
Open your browser and visit:
👉 **`http://127.0.0.1:5000`**

---

## 🔑 Pre-Configured Demo Credentials

Use the convenient **"Auto-fill"** buttons on the Login page (`/login`) or enter manually:

### 👨‍💼 Admin Portal Login
- **Username:** `admin`
- **Password:** `admin123`
- **Access URL:** `http://127.0.0.1:5000/login?tab=admin`

### 🧑‍🎓 Student Portal Login
- **Roll Number:** `CS2023001`
- **Password:** `student123`
- **Access URL:** `http://127.0.0.1:5000/login`

---

## 🧪 Automated Testing
Run the automated test suite to verify all 13 core capabilities (student registration, event booking, duplicate rejection, deadline checks, ticket generation, cancellations, admin CRUD, CSV exports):

```bash
python tests/test_cems_full.py
```
Output:
```
============================================================
 ALL 13 TEST CASES PASSED SUCCESSFULLY!
============================================================
```
