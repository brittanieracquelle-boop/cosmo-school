import { useStudents } from '../../hooks/useStudents';
import { useAttendance } from '../../hooks/useAttendance';
import { useAbsences } from '../../hooks/useAbsences';
import StatCard from '../../components/ui/StatCard';
import EmptyState from '../../components/ui/EmptyState';
import { fullName, initials, totalHours } from '../../lib/helpers';

export default function Dashboard() {
  const { students } = useStudents();
  const { logs } = useAttendance();
  const { absences } = useAbsences();

  const today = new Date().toISOString().split('T')[0];
  const todayLogs = logs.filter(a => a.date === today && !a.clock_out);
  const avgHours = students.length ? Math.round(students.reduce((s, st) => s + totalHours(st), 0) / students.length) : 0;
  const totalDE = students.reduce((s, st) => s + Number(st.de_hours), 0);

  return (
    <>
      <div className="stats-grid">
        <StatCard color="var(--sage)" label="Clocked In Today" value={todayLogs.length} sub={`of ${students.length} enrolled students`} />
        <StatCard color="var(--error)" label="Absences This Month" value={absences.length} sub="Unexcused + excused" />
        <StatCard color="var(--gold)" label="Avg Hours Completed" value={avgHours} sub="of 1,500 required" />
        <StatCard color="var(--purple)" label="Distance Ed Hours" value={totalDE} sub="Total logged across all" />
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Currently Clocked In</div>
            <span className="clocked-in-indicator"><span className="dot pulse"></span> Live</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table>
              <thead><tr><th>Student</th><th>Program</th><th>Time In</th><th>Status</th></tr></thead>
              <tbody>
                {todayLogs.length === 0 ? (
                  <EmptyState colSpan={4} message="No students currently clocked in" />
                ) : (
                  todayLogs.map(a => {
                    const s = students.find(st => st.id === a.student_id);
                    if (!s) return null;
                    return (
                      <tr key={a.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="avatar" style={{ width: 30, height: 30, fontSize: 12 }}>{initials(s)}</div>
                            {fullName(s)}
                          </div>
                        </td>
                        <td><span className="badge badge-muted">{s.program}</span></td>
                        <td>{a.clock_in?.substring(0, 5)}</td>
                        <td><span className="clocked-in-indicator"><span className="dot pulse"></span> Active</span></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title">Student Progress</div></div>
          <div className="card-body" style={{ padding: 0 }}>
            <table>
              <thead><tr><th>Student</th><th>Total Hrs</th><th>Progress</th></tr></thead>
              <tbody>
                {students.slice(0, 6).map(s => {
                  const done = totalHours(s);
                  const pct = Math.min(100, Math.round(done / s.required_hours * 100));
                  const color = pct > 75 ? 'var(--sage)' : pct > 40 ? 'var(--gold)' : 'var(--blush)';
                  return (
                    <tr key={s.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{initials(s)}</div>
                          {fullName(s)}
                        </div>
                      </td>
                      <td style={{ fontSize: 13 }}>{done}/{s.required_hours}</td>
                      <td style={{ minWidth: 120 }}>
                        <div className="progress-bar" style={{ marginBottom: 4 }}>
                          <div className="progress-fill" style={{ width: `${pct}%`, background: color }}></div>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{pct}%</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
