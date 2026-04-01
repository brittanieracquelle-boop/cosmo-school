-- Function to auto-record unexcused absences for students who didn't clock in
CREATE OR REPLACE FUNCTION record_daily_absences(target_date DATE DEFAULT CURRENT_DATE)
RETURNS JSONB AS $$
DECLARE
  v_count INTEGER := 0;
  v_student RECORD;
BEGIN
  -- Find students who have no attendance record for the target date
  -- and no absence already recorded for that date
  FOR v_student IN
    SELECT s.id, s.first_name, s.last_name
    FROM students s
    WHERE NOT EXISTS (
      SELECT 1 FROM attendance_log a WHERE a.student_id = s.id AND a.date = target_date
    )
    AND NOT EXISTS (
      SELECT 1 FROM absences ab WHERE ab.student_id = s.id AND ab.date = target_date
    )
  LOOP
    INSERT INTO absences (student_id, date, type, reason, notes, doc_received, doc_details)
    VALUES (v_student.id, target_date, 'unexcused', 'No clock-in recorded', 'Auto-recorded', false, '');
    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'absences_recorded', v_count,
    'date', target_date
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION record_daily_absences(DATE) TO authenticated;
