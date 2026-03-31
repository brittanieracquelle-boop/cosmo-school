-- Seed students (matching original data from cosmo_school_app_6.html lines 906-915)
INSERT INTO students (id, first_name, last_name, program, start_date, required_hours, theory_hours, clinical_hours, de_hours, pin) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'Jasmine', 'Carter', 'Full-Time', '2025-01-06', 1500, 210, 380, 110, '1001'),
  ('a0000001-0000-0000-0000-000000000002', 'Brianna', 'Mitchell', 'Full-Time', '2025-01-06', 1500, 180, 310, 80, '1002'),
  ('a0000001-0000-0000-0000-000000000003', 'Destiny', 'Williams', 'Part-Time', '2025-04-05', 1500, 120, 180, 40, '1003'),
  ('a0000001-0000-0000-0000-000000000004', 'Kayla', 'Johnson', 'Full-Time', '2025-01-06', 1500, 240, 460, 140, '1004'),
  ('a0000001-0000-0000-0000-000000000005', 'Tori', 'Davis', 'Part-Time', '2025-07-07', 1500, 60, 80, 20, '1005'),
  ('a0000001-0000-0000-0000-000000000006', 'Amara', 'Thompson', 'Full-Time', '2025-04-05', 1500, 150, 240, 50, '1006'),
  ('a0000001-0000-0000-0000-000000000007', 'Keisha', 'Brown', 'Part-Time', '2025-01-06', 1500, 200, 360, 90, '1007'),
  ('a0000001-0000-0000-0000-000000000008', 'Lydia', 'Harris', 'Full-Time', '2025-07-07', 1500, 40, 60, 10, '1008');

-- Seed attendance log (matching lines 917-931)
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

-- Seed absences (matching lines 933-940)
INSERT INTO absences (student_id, date, type, reason, notes, doc_received, doc_details) VALUES
  ('a0000001-0000-0000-0000-000000000003', '2025-11-17', 'unexcused', 'No call / No show', 'Second occurrence this month', false, ''),
  ('a0000001-0000-0000-0000-000000000005', '2025-11-17', 'unexcused', 'No call / No show', '', false, ''),
  ('a0000001-0000-0000-0000-000000000007', '2025-11-17', 'excused', 'Medical appointment', 'Doctor note received', true, 'Dr. Patel, seen 11/16, cleared to return 11/17'),
  ('a0000001-0000-0000-0000-000000000008', '2025-11-17', 'excused', 'Family emergency', '', false, ''),
  ('a0000001-0000-0000-0000-000000000002', '2025-11-12', 'tardy', 'Traffic', 'Arrived 35 min late', false, ''),
  ('a0000001-0000-0000-0000-000000000001', '2025-11-10', 'excused', 'Illness', 'Called in morning of', true, 'Urgent care note, fever, returned next day');

-- Seed school closures (matching lines 942-945)
INSERT INTO school_closures (start_date, end_date, label) VALUES
  ('2025-11-27', '2025-11-28', 'Thanksgiving Break'),
  ('2025-12-23', '2026-01-02', 'Winter Break');

-- Seed DE log (matching lines 948-955)
INSERT INTO de_log (student_id, date, module, platform, hours, verified) VALUES
  ('a0000001-0000-0000-0000-000000000001', '2025-11-16', 'Pivot Point Module 105 - Hair Color Theory', 'Pivot Point LAB', 2.5, true),
  ('a0000001-0000-0000-0000-000000000002', '2025-11-16', 'Pivot Point Module 106 - Chemical Texture', 'Pivot Point LAB', 2.0, true),
  ('a0000001-0000-0000-0000-000000000004', '2025-11-15', 'Pivot Point Module 108 - Skin Theory', 'Pivot Point LAB', 3.0, true),
  ('a0000001-0000-0000-0000-000000000001', '2025-11-14', 'Pivot Point Module 103 - Hair Design', 'Pivot Point LAB', 1.5, true),
  ('a0000001-0000-0000-0000-000000000007', '2025-11-13', 'Pivot Point Module 110 - Nail Care', 'Pivot Point LAB', 2.0, false),
  ('a0000001-0000-0000-0000-000000000003', '2025-11-12', 'Pivot Point Module 101 - Cosmetology Basics', 'Pivot Point LAB', 2.5, true);

-- Seed grades (matching lines 957-966)
INSERT INTO grades (student_id, project, category, date, score, notes) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'Precision Haircut', 'Hair Services', '2025-11-10', 92, 'Excellent sectioning technique'),
  ('a0000001-0000-0000-0000-000000000001', 'Module 103 Exam', 'Theory Exam', '2025-11-05', 88, ''),
  ('a0000001-0000-0000-0000-000000000002', 'Precision Haircut', 'Hair Services', '2025-11-10', 78, 'Needs work on perimeter'),
  ('a0000001-0000-0000-0000-000000000004', 'Color Application', 'Chemical Services', '2025-11-12', 95, 'Outstanding'),
  ('a0000001-0000-0000-0000-000000000001', 'Pedicure Service', 'Nail Services', '2025-11-08', 85, ''),
  ('a0000001-0000-0000-0000-000000000003', 'Facial Massage', 'Skin Care', '2025-11-09', 72, 'Pressure needs consistency'),
  ('a0000001-0000-0000-0000-000000000006', 'Sanitation Checklist', 'Sanitation & Safety', '2025-11-11', 100, 'Perfect score'),
  ('a0000001-0000-0000-0000-000000000002', 'Client Intake Form', 'Client Relations', '2025-11-06', 90, '');
