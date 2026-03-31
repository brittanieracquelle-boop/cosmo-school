import { useAuth } from '../../context/AuthContext';
import { useStudents } from '../../hooks/useStudents';
import { useAttendance } from '../../hooks/useAttendance';
import { useDELog } from '../../hooks/useDELog';
import { formatDate, dayName, formatTime } from '../../lib/helpers';

export default function StudentAttendance() {
  const { profile } = useAuth();
  const { students } = useStudents();
  const { logs } = useAttendance();
  const { deLogs } = useDELog();

  const student = students.find(s => s.id === profile?.student_id);
  if (!student) return <div className="empty-state"><p>Loading...</p></div>;

  const inPerson = logs.filter(a => a.student_id === student.id && a.clock_out).sort((a, b) => b.date.localeCompare(a.date));
  const de = deLogs.filter(d => d.student_id === student.id).sort((a, b) => b.date.localeCompare(a.date));
  const ipTotal = inPerson.reduce((sum, a) => sum + (Number(a.hours) || 0), 0).toFixed(1);
  const deTotal = de.reduce((sum, d) => sum + Number(d.hours), 0).toFixed(1);
  const grandTotal = (parseFloat(ipTotal) + parseFloat(deTotal)).toFixed(1);

  const combined = [
    ...inPerson.map(a => ({ date: a.date, clockIn: formatTime(a.clock_in), clockOut: formatTime(a.clock_out), hours: Number(a.hours), type: 'In-Person' })),
    ...de.map(d => ({ date: d.date, clockIn: '--', clockOut: '--', hours: Number(d.hours), type: 'Distance Ed' })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">My Attendance Log</div>
        <div className="badge badge-blush">{grandTotal} hrs total</div>
      </div>
      <div className="card-body" style={{ padding: 0 }}>
        <table>
          <thead><tr><th>Date</th><th>Day</th><th>Clock In</th><th>Clock Out</th><th>Hours</th><th>Type</th></tr></thead>
          <tbody>
            {combined.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>No attendance records</td></tr>
            ) : (
              combined.map((r, i) => (
                <tr key={i}>
                  <td>{formatDate(r.date)}</td>
                  <td>{dayName(r.date)}</td>
                  <td>{r.clockIn}</td>
                  <td>{r.clockOut}</td>
                  <td><strong>{r.hours ? r.hours.toFixed(2) : '--'}</strong></td>
                  <td>{r.type === 'In-Person' ? <span className="badge badge-muted">In-Person</span> : <span className="badge badge-purple">Distance Ed</span>}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
