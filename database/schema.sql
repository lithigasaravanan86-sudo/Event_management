-- ====================================================================
-- College Event Management System (CEMS)
-- Database: MySQL
-- Script: Schema Definition & Sample Demonstration Data
-- ====================================================================

-- 1. Create Database if not exists
CREATE DATABASE IF NOT EXISTS `cems_db`
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE `cems_db`;

-- ====================================================================
-- Drop Existing Tables (in reverse foreign key order for clean resets)
-- ====================================================================
DROP TABLE IF EXISTS `registrations`;
DROP TABLE IF EXISTS `events`;
DROP TABLE IF EXISTS `student`;
DROP TABLE IF EXISTS `admin`;

-- ====================================================================
-- Table 1: Admin
-- Stores administrator accounts for college event coordinators
-- ====================================================================
CREATE TABLE `admin` (
    `admin_id` INT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- Table 2: Student
-- Stores registered students who participate in college events
-- ====================================================================
CREATE TABLE `student` (
    `student_id` INT AUTO_INCREMENT PRIMARY KEY,
    `roll_number` VARCHAR(30) NOT NULL UNIQUE,
    `full_name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `department` VARCHAR(50) NOT NULL,
    `year` VARCHAR(20) NOT NULL,
    `phone` VARCHAR(20) DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- Table 3: Events
-- Stores all college events organized by faculties, clubs, or councils
-- ====================================================================
CREATE TABLE `events` (
    `event_id` INT AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(150) NOT NULL,
    `description` TEXT NOT NULL,
    `category` VARCHAR(50) NOT NULL, -- 'Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar'
    `event_date` DATE NOT NULL,
    `event_time` VARCHAR(30) NOT NULL, -- e.g., '10:00 AM - 01:00 PM'
    `venue` VARCHAR(100) NOT NULL,
    `organizer` VARCHAR(100) NOT NULL,
    `max_participants` INT NOT NULL DEFAULT 100,
    `registration_deadline` DATE NOT NULL,
    `banner_url` VARCHAR(255) DEFAULT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'Upcoming', -- 'Upcoming', 'Ongoing', 'Completed', 'Closed'
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- Table 4: Registrations
-- Junction table tracking student event registrations and digital passes
-- ====================================================================
CREATE TABLE `registrations` (
    `registration_id` INT AUTO_INCREMENT PRIMARY KEY,
    `event_id` INT NOT NULL,
    `student_id` INT NOT NULL,
    `registration_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `status` VARCHAR(20) NOT NULL DEFAULT 'Confirmed', -- 'Confirmed', 'Cancelled', 'Attended'
    `ticket_code` VARCHAR(50) NOT NULL UNIQUE,
    `remarks` VARCHAR(255) DEFAULT NULL,
    CONSTRAINT `fk_reg_event` FOREIGN KEY (`event_id`) 
        REFERENCES `events` (`event_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_reg_student` FOREIGN KEY (`student_id`) 
        REFERENCES `student` (`student_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `uq_student_event` UNIQUE (`event_id`, `student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- Indexes for High Performance Queries
-- ====================================================================
CREATE INDEX `idx_events_date` ON `events` (`event_date`);
CREATE INDEX `idx_events_category` ON `events` (`category`);
CREATE INDEX `idx_events_status` ON `events` (`status`);
CREATE INDEX `idx_reg_student` ON `registrations` (`student_id`);
CREATE INDEX `idx_reg_event` ON `registrations` (`event_id`);

-- ====================================================================
-- Sample Seed Data (For Demonstration & College Viva Presentation)
-- Passwords are hashed using Werkzeug / sha256. 
-- Plaintext for demo admin: 'admin123'
-- Plaintext for demo student: 'student123'
-- ====================================================================

-- 1. Insert Default Admin
-- Username: admin | Password: admin123
INSERT INTO `admin` (`username`, `password_hash`, `full_name`, `email`, `created_at`) 
VALUES (
    'admin',
    'scrypt:32768:8:1$vXjGZ2Ld8Kz9pQm4$382895529f7cf7b194d3ec33230c1be7b1e4c7ba64619d80313cb8fc402a7b6cf04a08fc78cf53a290d931e9c2c62c0eb227d8ce08e1e723ae736021ee599978',
    'Prof. Rajesh Sharma (Faculty Coordinator)',
    'admin@college.edu',
    NOW()
);

-- 2. Insert Sample Students
-- Passwords: 'student123'
INSERT INTO `student` (`roll_number`, `full_name`, `email`, `password_hash`, `department`, `year`, `phone`, `created_at`)
VALUES 
(
    'CS2023001',
    'Aarav Patel',
    'aarav.patel@student.college.edu',
    'scrypt:32768:8:1$vXjGZ2Ld8Kz9pQm4$382895529f7cf7b194d3ec33230c1be7b1e4c7ba64619d80313cb8fc402a7b6cf04a08fc78cf53a290d931e9c2c62c0eb227d8ce08e1e723ae736021ee599978',
    'Computer Science',
    '3rd Year',
    '+91 9876543210',
    NOW()
),
(
    'IT2023045',
    'Ananya Iyer',
    'ananya.iyer@student.college.edu',
    'scrypt:32768:8:1$vXjGZ2Ld8Kz9pQm4$382895529f7cf7b194d3ec33230c1be7b1e4c7ba64619d80313cb8fc402a7b6cf04a08fc78cf53a290d931e9c2c62c0eb227d8ce08e1e723ae736021ee599978',
    'Information Technology',
    '2nd Year',
    '+91 9876543211',
    NOW()
),
(
    'EC2022019',
    'Rohan Verma',
    'rohan.verma@student.college.edu',
    'scrypt:32768:8:1$vXjGZ2Ld8Kz9pQm4$382895529f7cf7b194d3ec33230c1be7b1e4c7ba64619d80313cb8fc402a7b6cf04a08fc78cf53a290d931e9c2c62c0eb227d8ce08e1e723ae736021ee599978',
    'Electronics & Communication',
    '4th Year',
    '+91 9876543212',
    NOW()
);

-- 3. Insert Diverse College Events
INSERT INTO `events` (`event_id`, `title`, `description`, `category`, `event_date`, `event_time`, `venue`, `organizer`, `max_participants`, `registration_deadline`, `banner_url`, `status`, `created_at`)
VALUES
(
    1,
    'HackNova 2026 - 24hr Annual Hackathon',
    'Ignite your coding prowess! Join 100+ teams in a 24-hour sprint tackling AI, Web3, FinTech, and Smart Healthcare challenges with prizes worth Rs. 50,000.',
    'Technical',
    '2026-10-25',
    '09:00 AM - 09:00 AM (Next Day)',
    'Main Computing Lab & Innovation Hub',
    'Department of Computer Science & ACM Club',
    120,
    '2026-10-23',
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
    'Upcoming',
    NOW()
),
(
    2,
    'Rhythm & Beats - Inter-College Music & Dance Fest',
    'The grandest cultural fiesta of the semester! Showcasing western dance, classical vocals, battle of the bands, and celebrity DJ night.',
    'Cultural',
    '2026-10-28',
    '05:00 PM - 10:00 PM',
    'Open Air Amphitheatre',
    'Cultural Committee & Student Council',
    350,
    '2026-10-26',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
    'Upcoming',
    NOW()
),
(
    3,
    'Hands-on Workshop: Generative AI & LLM Deployment',
    'An intensive, practical workshop covering prompt engineering, fine-tuning open source models, and deploying RAG pipelines on modern cloud infrastructure.',
    'Workshop',
    '2026-10-18',
    '10:00 AM - 04:00 PM',
    'Auditorium Hall B',
    'AI & Data Science Student Chapter',
    80,
    '2026-10-17',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    'Upcoming',
    NOW()
),
(
    4,
    'Inter-Department Football Championship',
    'Knockout tournament between 16 college departments for the coveted Chancellor Cup. Refreshments and certificates provided for all participants.',
    'Sports',
    '2026-10-30',
    '08:00 AM - 05:00 PM',
    'University Sports Complex Ground',
    'Physical Education Directorate',
    150,
    '2026-10-28',
    'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80',
    'Upcoming',
    NOW()
),
(
    5,
    'National Seminar on Green Energy & Sustainable Tech',
    'Keynote sessions by eminent researchers from IIT and industry leaders on solar microgrids, green hydrogen, and electric vehicle battery ecosystems.',
    'Seminar',
    '2026-11-05',
    '11:00 AM - 02:00 PM',
    'Seminar Hall 1',
    'Mechanical & Electrical Engineering Dept',
    90,
    '2026-11-03',
    'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=800&q=80',
    'Upcoming',
    NOW()
);

-- 4. Insert Sample Registrations
INSERT INTO `registrations` (`registration_id`, `event_id`, `student_id`, `registration_date`, `status`, `ticket_code`, `remarks`)
VALUES
(1, 1, 1, NOW(), 'Confirmed', 'CEMS-EV1-AARAV1', 'Confirmed seat in HackNova 2026'),
(2, 3, 1, NOW(), 'Confirmed', 'CEMS-EV3-AARAV2', 'Workshop confirmation'),
(3, 2, 2, NOW(), 'Confirmed', 'CEMS-EV2-ANANYA1', 'Cultural fest solo entry');

-- ====================================================================
-- End of SQL Script
-- ====================================================================
