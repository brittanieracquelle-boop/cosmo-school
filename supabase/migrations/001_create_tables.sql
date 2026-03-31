-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Profiles (links auth.users to app roles)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'student')),
  student_id UUID, -- will add FK after students table
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Students
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  program TEXT NOT NULL CHECK (program IN ('Full-Time', 'Part-Time')),
  start_date DATE NOT NULL,
  required_hours INTEGER NOT NULL DEFAULT 1500,
  theory_hours NUMERIC(8,2) DEFAULT 0,
  clinical_hours NUMERIC(8,2) DEFAULT 0,
  de_hours NUMERIC(8,2) DEFAULT 0,
  pin CHAR(4) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add FK from profiles to students
ALTER TABLE profiles ADD CONSTRAINT fk_profiles_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL;

-- Attendance Log
CREATE TABLE attendance_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  clock_in TIME NOT NULL,
  clock_out TIME,
  hours NUMERIC(6,2),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_attendance_student_date ON attendance_log(student_id, date);

-- Absences
CREATE TABLE absences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('unexcused', 'excused', 'tardy')),
  reason TEXT,
  notes TEXT,
  doc_received BOOLEAN DEFAULT false,
  doc_details TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_absences_student ON absences(student_id);

-- School Closures
CREATE TABLE school_closures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Distance Education Log
CREATE TABLE de_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  module TEXT NOT NULL,
  platform TEXT NOT NULL,
  hours NUMERIC(6,2) NOT NULL,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_de_log_student ON de_log(student_id);

-- Grades
CREATE TABLE grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  project TEXT NOT NULL,
  category TEXT NOT NULL,
  date DATE NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_grades_student ON grades(student_id);
