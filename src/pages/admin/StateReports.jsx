import { useState } from 'react';
import { useStudents } from '../../hooks/useStudents';
import { useAttendance } from '../../hooks/useAttendance';
import { useDELog } from '../../hooks/useDELog';
import { useAbsences } from '../../hooks/useAbsences';
import { useClosures } from '../../hooks/useClosures';
import { fullName, formatDate, inPersonHours, totalHours, dayName, formatTime, buildStudentTotals } from '../../lib/helpers';
import { exportReportExcel } from '../../utils/exportExcel';
import { exportReportPDF } from '../../utils/exportPDF';

export default function StateReports() {
  const { students } = useStudents();
  const { logs: attendanceLogs } = useAttendance();
  const { deLogs } = useDELog();
  const { absences } = useAbsences();
  const { closures } = useClosures();
  const [studentFilter, setStudentFilter] = useState('');
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);

  const reportStudents = studentFilter ? students.filter(s => s.id === studentFilter) : students;

  function handleExcel() {
    exportReportExcel({ students: reportStudents, attendanceLogs, deLogs, absences, closures, dateRange: { from: dateFrom, to: dateTo } });
  }
  function handlePDF() {
    exportReportPDF({ students: reportStudents, attendanceLogs, deLogs, absences, closures, dateRange: { from: dateFrom, to: dateTo } });
  }

  return (
    <>
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div className="form-label">Student</div>
              <select value={studentFilter} onChange={e => setStudentFilter(e.target.value)}>
                <option value="">All Students</option>
                {students.map(s => <option key={s.id} value={s.id}>{fullName(s)}</option>)}
              </select>
            </div>
            <div>
              <div className="form-label">From Date</div>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: 160 }} />
            </div>
            <div>
              <div className="form-label">To Date</div>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: 160 }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary" onClick={handleExcel}>&#11015; Excel</button>
              <button className="btn btn-dark" onClick={handlePDF}>&#11015; PDF</button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="report-header">
            <div className="report-school">Bennett School of Cosmetology</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>Decatur, Alabama</div>
            <div className="report-title">Student Hours Attendance Report</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
              Generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} &bull; Alabama Board of Cosmetology and Barbering
            </div>
          </div>

          {reportStudents.map(s => {
            const sLogs = attendanceLogs.filter(a => a.student_id === s.id && a.clock_out).sort((a, b) => a.date.localeCompare(b.date));
            const sDE = deLogs.filter(d => d.student_id === s.id).sort((a, b) => a.date.localeCompare(b.date));
            const sAbs = absences.filter(a => a.student_id === s.id).sort((a, b) => a.date.localeCompare(b.date));
            const ip = inPersonHours(s);
            const total = totalHours(s);
            const left = Math.max(0, s.required_hours - total);
            const ipLogged = sLogs.reduce((sum, a) => sum + (Number(a.hours) || 0), 0);
            const deLogged = sDE.reduce((sum, d) => sum + Number(d.hours), 0);
            const absCount = absences.filter(a => a.student_id === s.id && a.type === 'unexcused').length;

            return (
              <div key={s.id} style={{ marginBottom: 36, pageBreakInside: 'avoid' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, paddingBottom: 10, borderBottom: '2px solid var(--charcoal)' }}>
                  <div>
                    <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20 }}>{fullName(s)}</div>
                    <div style={{ fontSize: 13, color: 'var(--muted)' }}>Program: {s.program} &bull; Enrollment Date: {formatDate(s.start_date)}</div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 13, lineHeight: 1.8 }}>
                    <div><strong>In-Person Hours:</strong> {ip}</div>
                    <div><strong>Distance Ed Hours:</strong> {Number(s.de_hours)}</div>
                    <div><strong>Total Completed:</strong> {total}</div>
                    <div><strong>Hours Remaining:</strong> {left}</div>
                    <div><strong>Unexcused Absences:</strong> {absCount}</div>
                  </div>
                </div>

                <div style={{ fontWeight: 700, fontSize: 13, margin: '12px 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>In-Person Attendance</div>
                <table style={{ fontSize: 13, marginBottom: 20 }}>
                  <thead><tr><th>Date</th><th>Day of Week</th><th>Clock In</th><th>Clock Out</th><th>Hours</th></tr></thead>
                  <tbody>
                    {sLogs.length === 0 ? (
                      <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)', padding: 12 }}>No in-person records in range</td></tr>
                    ) : (
                      <>
                        {sLogs.map((a, i) => (
                          <tr key={i}>
                            <td>{formatDate(a.date)}</td>
                            <td>{dayName(a.date)}</td>
                            <td>{formatTime(a.clock_in)}</td>
                            <td>{formatTime(a.clock_out)}</td>
                            <td>{Number(a.hours).toFixed(2)}</td>
                          </tr>
                        ))}
                        <tr style={{ background: 'var(--cream)', fontWeight: 600 }}>
                          <td colSpan={4} style={{ textAlign: 'right' }}>In-Person Total:</td>
                          <td>{ipLogged.toFixed(2)}</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>

                <div style={{ fontWeight: 700, fontSize: 13, margin: '12px 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Distance Education Hours</div>
                <table style={{ fontSize: 13 }}>
                  <thead><tr><th>Date</th><th>Module / Assignment</th><th>Platform</th><th>Hours</th><th>Verified</th></tr></thead>
                  <tbody>
                    {sDE.length === 0 ? (
                      <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)', padding: 12 }}>No distance education records</td></tr>
                    ) : (
                      <>
                        {sDE.map((d, i) => (
                          <tr key={i}>
                            <td>{formatDate(d.date)}</td>
                            <td>{d.module}</td>
                            <td>{d.platform}</td>
                            <td>{Number(d.hours)}</td>
                            <td>{d.verified ? 'Yes' : 'Pending'}</td>
                          </tr>
                        ))}
                        <tr style={{ background: 'var(--cream)', fontWeight: 600 }}>
                          <td colSpan={3} style={{ textAlign: 'right' }}>Distance Ed Total:</td>
                          <td>{deLogged.toFixed(2)}</td>
                          <td></td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>

                {sAbs.length > 0 && (
                  <>
                    <div style={{ fontWeight: 700, fontSize: 13, margin: '16px 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Absence Record</div>
                    <table style={{ fontSize: 13 }}>
                      <thead><tr><th>Date</th><th>Day</th><th>Type</th><th>Reason</th></tr></thead>
                      <tbody>
                        {sAbs.map((a, i) => (
                          <tr key={i}>
                            <td>{formatDate(a.date)}</td>
                            <td>{dayName(a.date)}</td>
                            <td style={{ textTransform: 'capitalize' }}>{a.type}</td>
                            <td>{a.reason || '--'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
              </div>
            );
          })}

          <div style={{ marginTop: 32, paddingTop: 16, borderTop: '2px solid var(--charcoal)', fontSize: 11, color: 'var(--muted)', textAlign: 'center' }}>
            This report is generated for submission to the Alabama Board of Cosmetology and Barbering. Bennett School of Cosmetology, Decatur, AL.
          </div>
        </div>
      </div>
    </>
  );
}