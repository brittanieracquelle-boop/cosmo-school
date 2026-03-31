-- =============================================
-- STEP 1: CREATE TABLES
-- =============================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'student')),
  student_id UUID,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

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

ALTER TABLE profiles ADD CONSTRAINT fk_profiles_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL;

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

CREATE TABLE school_closures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

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

-- =============================================
-- STEP 2: RLS POLICIES
-- =============================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION my_student_id()
RETURNS UUID AS $$
  SELECT student_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE de_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Admins read all profiles" ON profiles FOR SELECT USING (is_admin());
CREATE POLICY "Admins manage profiles" ON profiles FOR ALL USING (is_admin());

CREATE POLICY "Admins full access to students" ON students FOR ALL USING (is_admin());
CREATE POLICY "Students read own record" ON students FOR SELECT USING (id = my_student_id());

CREATE POLICY "Admins full access to attendance" ON attendance_log FOR ALL USING (is_admin());
CREATE POLICY "Students read own attendance" ON attendance_log FOR SELECT USING (student_id = my_student_id());

CREATE POLICY "Admins full access to absences" ON absences FOR ALL USING (is_admin());
CREATE POLICY "Students read own absences" ON absences FOR SELECT USING (student_id = my_student_id());

CREATE POLICY "All authenticated read closures" ON school_closures FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage closures" ON school_closures FOR ALL USING (is_admin());

CREATE POLICY "Admins full access to de_log" ON de_log FOR ALL USING (is_admin());
CREATE POLICY "Students read own de_log" ON de_log FOR SELECT USING (student_id = my_student_id());

CREATE POLICY "Admins full access to grades" ON grades FOR ALL USING (is_admin());
CREATE POLICY "Students read own grades" ON grades FOR SELECT USING (student_id = my_student_id());

-- =============================================
-- STEP 3: FUNCTIONS & TRIGGERS
-- =============================================

CREATE OR REPLACE FUNCTION kiosk_clock(pin_input CHAR(4))
RETURNS JSONB AS $$
DECLARE
  v_student RECORD;
  v_existing RECORD;
  v_time TIME;
  v_hours NUMERIC(6,2);
  v_today DATE;
BEGIN
  v_today := CURRENT_DATE;
  v_time := CURRENT_TIME;

  SELECT * INTO v_student FROM students WHERE pin = pin_input;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'PIN not recognized. Please try again.');
  END IF;

  SELECT * INTO v_existing FROM attendance_log
  WHERE student_id = v_student.id AND date = v_today AND clock_out IS NULL
  LIMIT 1;

  IF NOT FOUND THEN
    INSERT INTO attendance_log (student_id, date, clock_in) VALUES (v_student.id, v_today, v_time);
    RETURN jsonb_build_object(
      'success', true,
      'action', 'clock_in',
      'first_name', v_student.first_name,
      'time', to_char(v_time, 'HH24:MI')
    );
  ELSE
    v_hours := ROUND(EXTRACT(EPOCH FROM (v_time - v_existing.clock_in)) / 3600.0, 2);
    UPDATE attendance_log SET clock_out = v_time, hours = v_hours WHERE id = v_existing.id;
    RETURN jsonb_build_object(
      'success', true,
      'action', 'clock_out',
      'first_name', v_student.first_name,
      'time', to_char(v_time, 'HH24:MI'),
      'hours', v_hours
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION kiosk_status()
RETURNS JSONB AS $$
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'first_name', s.first_name,
      'last_initial', LEFT(s.last_name, 1),
      'clocked_in', EXISTS (
        SELECT 1 FROM attendance_log a
        WHERE a.student_id = s.id AND a.date = CURRENT_DATE AND a.clock_out IS NULL
      )
    ) ORDER BY s.last_name, s.first_name
  ), '[]'::jsonb)
  FROM students s;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_student_de_hours()
RETURNS TRIGGER AS $$
DECLARE
  v_student_id UUID;
BEGIN
  v_student_id := COALESCE(NEW.student_id, OLD.student_id);
  UPDATE students SET de_hours = COALESCE(
    (SELECT SUM(hours) FROM de_log WHERE student_id = v_student_id), 0
  ) WHERE id = v_student_id;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_de_hours_insert AFTER INSERT ON de_log FOR EACH ROW EXECUTE FUNCTION update_student_de_hours();
CREATE TRIGGER trg_de_hours_update AFTER UPDATE ON de_log FOR EACH ROW EXECUTE FUNCTION update_student_de_hours();
CREATE TRIGGER trg_de_hours_delete AFTER DELETE ON de_log FOR EACH ROW EXECUTE FUNCTION update_student_de_hours();

GRANT EXECUTE ON FUNCTION kiosk_clock(CHAR) TO anon;
GRANT EXECUTE ON FUNCTION kiosk_status() TO anon;

-- =============================================
-- STEP 4: SEED DATA
-- =============================================

INSERT INTO students (id, first_name, last_name, program, start_date, required_hours, theory_hours, clinical_hours, de_hours, pin) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'Jasmine', 'Carter', 'Full-Time', '2025-01-06', 1500, 210, 380, 110, '1001'),
  ('a0000001-0000-0000-0000-000000000002', 'Brianna', 'Mitchell', 'Full-Time', '2025-01-06', 1500, 180, 310, 80, '1002'),
  ('a0000001-0000-0000-0000-000000000003', 'Destiny', 'Williams', 'Part-Time', '2025-04-05', 1500, 120, 180, 40, '1003'),
  ('a0000001-0000-0000-0000-000000000004', 'Kayla', 'Johnson', 'Full-Time', '2025-01-06', 1500, 240, 460, 140, '1004'),
  ('a0000001-0000-0000-0000-000000000005', 'Tori', 'Davis', 'Part-Time', '2025-07-07', 1500, 60, 80, 20, '1005'),
  ('a0000001-0000-0000-0000-000000000006', 'Amara', 'Thompson', 'Full-Time', '2025-04-05', 1500, 150, 240, 50, '1006'),
  ('a0000001-0000-0000-0000-000000000007', 'Keisha', 'Brown', 'Part-Time', '2025-01-06', 1500, 200, 360, 90, '1007'),
  ('a0000001-0000-0000-0000-000000000008', 'Lydia', 'Harris', 'Full-Time', '2025-07-07', 1500, 40, 60, 10, '1008');

INSERT INTO attendance_log (student_id, date, clock_in, clock_out, hours) VALUES
  ('a0000001-0000-0000-0000-000000000001', '2025-11-17', '08:02', '16:45', 8.72),
  ('a0000001-0000-0000-0000-000000000002', '2025-11-17', '08:15', '16:30', 8.25),
  ('a0000001-0000-0000-0000-000000000004', '2025-11-17', '08:00', NULL, NULL),
  ('a0000001-0000-0000-0000-000000000001', '2025-11-14', '08:05', '16:45', 8.67),
  ('a0000001-0000-0000-0000-000000000002', '2025-11-14', '08:10', '16:50', 8.67),
  ('a0000001-0000-0000-0000-000000000003', '2025-11-15', '09:00', '14:00', 5.0),
  ('a0000001-0000-0000-0000-000000000005', '2025-11-15', '09:05', '14:00', 4.92),
  ('a0000001-0000-0000-0000-000000000004', '2025-11-14', '08:00', '16:45', 8.75),
  ('a0000001-0000-0000-0000-000000000006', '2025-11-17', '08:30', NULL, NULL),
  ('a0000001-0000-0000-0000-000000000007', '2025-11-15', '09:00', '13:45', 4.75),
  ('a0000001-0000-0000-0000-000000000001', '2025-11-13', '08:00', '16:45', 8.75),
  ('a0000001-0000-0000-0000-000000000002', '2025-11-13', '08:15', '16:30', 8.25),
  ('a0000001-0000-0000-0000-000000000004', '2025-11-13', '08:05', '16:50', 8.75);

INSERT INTO absences (student_id, date, type, reason, notes, doc_received, doc_details) VALUES
  ('a0000001-0000-0000-0000-000000000003', '2025-11-17', 'unexcused', 'No call / No show', 'Second occurrence this month', false, ''),
  ('a0000001-0000-0000-0000-000000000005', '2025-11-17', 'unexcused', 'No call / No show', '', false, ''),
  ('a0000001-0000-0000-0000-000000000007', '2025-11-17', 'excused', 'Medical appointment', 'Doctor note received', true, 'Dr. Patel, seen 11/16, cleared to return 11/17'),
  ('a0000001-0000-0000-0000-000000000008', '2025-11-17', 'excused', 'Family emergency', '', false, ''),
  ('a0000001-0000-0000-0000-000000000002', '2025-11-12', 'tardy', 'Traffic', 'Arrived 35 min late', false, ''),
  ('a0000001-0000-0000-0000-000000000001', '2025-11-10', 'excused', 'Illness', 'Called in morning of', true, 'Urgent care note, fever, returned next day');

INSERT INTO school_closures (start_date, end_date, label) VALUES
  ('2025-11-27', '2025-11-28', 'Thanksgiving Break'),
  ('2025-12-23', '2026-01-02', 'Winter Break');

INSERT INTO de_log (student_id, date, module, platform, hours, verified) VALUES
  ('a0000001-0000-0000-0000-000000000001', '2025-11-16', 'Pivot Point Module 105 - Hair Color Theory', 'Pivot Point LAB', 2.5, true),
  ('a0000001-0000-0000-0000-000000000002', '2025-11-16', 'Pivot Point Module 106 - Chemical Texture', 'Pivot Point LAB', 2.0, true),
  ('a0000001-0000-0000-0000-000000000004', '2025-11-15', 'Pivot Point Module 108 - Skin Theory', 'Pivot Point LAB', 3.0, true),
  ('a0000001-0000-0000-0000-000000000001', '2025-11-14', 'Pivot Point Module 103 - Hair Design', 'Pivot Point LAB', 1.5, true),
  ('a0000001-0000-0000-0000-000000000007', '2025-11-13', 'Pivot Point Module 110 - Nail Care', 'Pivot Point LAB', 2.0, false),
  ('a0000001-0000-0000-0000-000000000003', '2025-11-12', 'Pivot Point Module 101 - Cosmetology Basics', 'Pivot Point LAB', 2.5, true);

INSERT INTO grades (student_id, project, category, date, score, notes) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'Precision Haircut', 'Hair Services', '2025-11-10', 92, 'Excellent sectioning technique'),
  ('a0000001-0000-0000-0000-000000000001', 'Module 103 Exam', 'Theory Exam', '2025-11-05', 88, ''),
  ('a0000001-0000-0000-0000-000000000002', 'Precision Haircut', 'Hair Services', '2025-11-10', 78, 'Needs work on perimeter'),
  ('a0000001-0000-0000-0000-000000000004', 'Color Application', 'Chemical Services', '2025-11-12', 95, 'Outstanding'),
  ('a0000001-0000-0000-0000-000000000001', 'Pedicure Service', 'Nail Services', '2025-11-08', 85, ''),
  ('a0000001-0000-0000-0000-000000000003', 'Facial Massage', 'Skin Care', '2025-11-09', 72, 'Pressure needs consistency'),
  ('a0000001-0000-0000-0000-000000000006', 'Sanitation Checklist', 'Sanitation & Safety', '2025-11-11', 100, 'Perfect score'),
  ('a0000001-0000-0000-0000-000000000002', 'Client Intake Form', 'Client Relations', '2025-11-06', 90, '');
