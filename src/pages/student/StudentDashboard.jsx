import { useAuth } from '../../context/AuthContext';
import { useStudents } from '../../hooks/useStudents';
import { useAttendance } from '../../hooks/useAttendance';
import { useGrades } from '../../hooks/useGrades';
import { useDELog } from '../../hooks/useDELog';
import { fullName, totalHours, formatDate, dayName, scoreToGrade, gradeClass } from '../../lib/helpers';

export default function StudentDashboard() {
  const { profile } = useAuth();
  const { students } = useStudents();
  const { logs } = useAttendance();
  const { grades } = useGrades();
  const { deLogs } = useDELog();

  const student = students.find(s => s.id === profile?.student_id);
  if (!student) return <div className="empty-state"><p>Loading student data...</p></div>;

  const total = totalHours(student);
  const left = Math.max(0, student.required_hours - total);
  const pct = Math.min(100, Math.round(total / student.required_hours * 100));

  const recentLogs = logs
    .filter(a => a.student_id === student.id && a.clock_out)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  const recentGrades = grades
    .filter(g => g.student_id === student.id)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  return (
    <>
      <div className="student-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Student Portal</div>
            <div className="student-name">{fullName(student)}</div>
            <div className="student-meta">{student.program} Program &bull; Enrolled {formatDate(student.start_date)}</div>
          </div>
        </div>
        <div className="hours-circle-wrap" style={{ position: 'relative', zIndex: 1 }}>
          <div className="hours-big">
            <div className="hours-big-num">{total}</div>
            <div className="hours-big-label">Total Hours</div>
          </div>
          <div className="hours-big">
            <div className="hours-big-num" style={{ color: 'rgba(255,255,255,0.5)' }}>{left}</div>
            <div className="hours-big-label">Hours Left</div>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
              <span>Overall Progress</span>
              <span>{pct}%</span>
            </div>
            <div className="progress-bar" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div className="progress-fill" style={{ background: 'var(--blush)', width: `${pct}%` }}></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 12 }}>
              <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Theory</div>
                <div style={{ fontSize: 17, fontFamily: "'DM Serif Display', serif", color: 'white' }}>{Number(student.theory_hours)}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Clinical</div>
                <div style={{ fontSize: 17, fontFamily: "'DM Serif Display', serif", color: 'white' }}>{Number(student.clinical_hours)}</div>
              </div>
              <div style={{ background: 'rgba(122,158,142,0.15)', borderRadius: 8, padding: '10px 12px', border: '1px solid rgba(122,158,142,0.2)' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Distance Ed</div>
                <div style={{ fontSize: 17, fontFamily: "'DM Serif Display', serif", color: '#A0D4C0' }}>{Number(student.de_hours)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-header"><div className="card-title">Recent Attendance</div></div>
          <div className="card-body" style={{ padding: '12px 20px' }}>
            {recentLogs.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">&#128197;</div><p>No attendance records yet</p></div>
            ) : (
              recentLogs.map((a, i) => {
                const barPct = Math.min(100, (Number(a.hours) / 9) * 100);
                return (
                  <div key={i} className="attendance-day-row">
                    <div className="att-date">
                      {formatDate(a.date)}
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{dayName(a.date)}</div>
                    </div>
                    <div className="att-bar">
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${barPct}%`, background: 'var(--sage)' }}></div>
                      </div>
                    </div>
                    <div className="att-hours">{Number(a.hours).toFixed(1)} hrs</div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title">Recent Grades</div></div>
          <div className="card-body" style={{ padding: 0 }}>
            <table>
              <thead><tr><th>Project</th><th>Score</th><th>Grade</th></tr></thead>
              <tbody>
                {recentGrades.length === 0 ? (
                  <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--muted)', padding: 16 }}>No grades yet</td></tr>
                ) : (
                  recentGrades.map((g, i) => {
                    const grade = scoreToGrade(g.score);
                    return (
                      <tr key={i}>
                        <td style={{ fontSize: 13 }}>{g.project}</td>
                        <td>{g.score}%</td>
                        <td><div className={`grade-chip ${gradeClass(grade)}`} style={{ width: 32, height: 32, fontSize: 13 }}>{grade}</div></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
