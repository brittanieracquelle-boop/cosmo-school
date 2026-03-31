-- Helper functions
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

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE de_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users read own profile" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Admins read all profiles" ON profiles FOR SELECT USING (is_admin());
CREATE POLICY "Admins manage profiles" ON profiles FOR ALL USING (is_admin());

-- Students policies
CREATE POLICY "Admins full access to students" ON students FOR ALL USING (is_admin());
CREATE POLICY "Students read own record" ON students FOR SELECT USING (id = my_student_id());

-- Attendance log policies
CREATE POLICY "Admins full access to attendance" ON attendance_log FOR ALL USING (is_admin());
CREATE POLICY "Students read own attendance" ON attendance_log FOR SELECT USING (student_id = my_student_id());

-- Absences policies
CREATE POLICY "Admins full access to absences" ON absences FOR ALL USING (is_admin());
CREATE POLICY "Students read own absences" ON absences FOR SELECT USING (student_id = my_student_id());

-- School closures policies
CREATE POLICY "All authenticated read closures" ON school_closures FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage closures" ON school_closures FOR ALL USING (is_admin());

-- DE log policies
CREATE POLICY "Admins full access to de_log" ON de_log FOR ALL USING (is_admin());
CREATE POLICY "Students read own de_log" ON de_log FOR SELECT USING (student_id = my_student_id());

-- Grades policies
CREATE POLICY "Admins full access to grades" ON grades FOR ALL USING (is_admin());
CREATE POLICY "Students read own grades" ON grades FOR SELECT USING (student_id = my_student_id());
