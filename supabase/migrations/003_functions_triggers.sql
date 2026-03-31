-- Kiosk clock in/out function (SECURITY DEFINER - works with anon key)
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

  -- Find student by PIN
  SELECT * INTO v_student FROM students WHERE pin = pin_input;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'PIN not recognized. Please try again.');
  END IF;

  -- Check if already clocked in today
  SELECT * INTO v_existing FROM attendance_log
  WHERE student_id = v_student.id AND date = v_today AND clock_out IS NULL
  LIMIT 1;

  IF NOT FOUND THEN
    -- Clock in
    INSERT INTO attendance_log (student_id, date, clock_in) VALUES (v_student.id, v_today, v_time);
    RETURN jsonb_build_object(
      'success', true,
      'action', 'clock_in',
      'first_name', v_student.first_name,
      'time', to_char(v_time, 'HH24:MI')
    );
  ELSE
    -- Clock out
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

-- Kiosk status function
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

-- Trigger to update students.de_hours when de_log changes
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

-- Grant anon access to kiosk functions
GRANT EXECUTE ON FUNCTION kiosk_clock(CHAR) TO anon;
GRANT EXECUTE ON FUNCTION kiosk_status() TO anon;
