import { useState } from 'react';
import { useLiveClock } from '../../hooks/useLiveClock';
import { useStudents } from '../../hooks/useStudents';
import { useAttendance } from '../../hooks/useAttendance';
import EmptyState from '../../components/ui/EmptyState';
import EditTimeCardModal from '../../components/modals/EditTimeCardModal';
import { fullName, initials, formatTime } from '../../lib/helpers';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function TimeClock() {
  const now = useLiveClock();
  const { students } = useStudents();
  const { logs, clockIn, clockOut, update, remove } = useAttendance();
  const [selectedStudent, setSelectedStudent] = useState('');
  const [feedback, setFeedback] = useState('');
  const [editEntry, setEditEntry] = useState(null);
  const navigate = useNavigate();

  const today = new Date().toISOString().split('T')[0];
  const todayLogs = logs.filter(a => a.date === today);
  const inCount = todayLogs.filter(a => !a.clock_out).length;

  const hms = now.toLocaleTimeString('en-US', { hour12: false });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  async function handleClock(action) {
    if (!selectedStudent) { setFeedback('Please select a student first.'); return; }
    const s = students.find(st => st.id === selectedStudent);
    if (!s) return;

    if (action === 'in') {
      const existing = todayLogs.find(a => a.student_id === selectedStudent && !a.clock_out);
      if (existing) { setFeedback(`${fullName(s)} is already clocked in.`); return; }
      await clockIn(selectedStudent);
      const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      toast.success(`${fullName(s)} clocked in at ${timeStr}`);
      setFeedback(`${fullName(s)} clocked in at ${timeStr}`);
    } else {
      const existing = todayLogs.find(a => a.student_id === selectedStudent && !a.clock_out);
      if (!existing) { setFeedback(`${fullName(s)} is not currently clocked in.`); return; }
      await clockOut(existing.id, existing.clock_in);
      toast.success(`${fullName(s)} clocked out`);
      setFeedback(`${fullName(s)} clocked out`);
    }
    setSelectedStudent('');
  }

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div style={{ background: 'var(--charcoal)', borderRadius: 'var(--radius)', padding: 32, color: 'white', textAlign: 'center' }}>
          <div style={{ fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>Current Time</div>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 52, lineHeight: 1, color: 'var(--blush-light)', letterSpacing: -1 }}>{hms}</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 6 }}>{dateStr}</div>
          <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, color: 'var(--blush-light)', fontFamily: "'DM Serif Display', serif" }}>{inCount}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>In Today</div>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }}></div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, color: 'rgba(255,255,255,0.4)', fontFamily: "'DM Serif Display', serif" }}>{students.length - inCount}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Not In</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center', padding: 24, background: 'white', borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
          <div>
            <div className="form-label">Select Student</div>
            <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}>
              <option value="">-- Choose a student --</option>
              {students.map(s => <option key={s.id} value={s.id}>{fullName(s)} ({s.program})</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button className="btn btn-sage" style={{ flex: 1, justifyContent: 'center', padding: 12, fontSize: 15 }} onClick={() => handleClock('in')}>&#9201; Clock In</button>
            <button className="btn" style={{ flex: 1, justifyContent: 'center', padding: 12, fontSize: 15, background: 'var(--error-light)', color: 'var(--error)' }} onClick={() => handleClock('out')}>&#9209; Clock Out</button>
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', minHeight: 20 }}>{feedback}</div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 4 }}>
            <button className="btn btn-dark" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/kiosk')}>&#128421; Launch Kiosk Mode</button>
            <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 6 }}>Place on a dedicated tablet or screen at your front desk</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">Today's Attendance Log</div></div>
        <div className="card-body" style={{ padding: 0 }}>
          <table>
            <thead><tr><th>Student</th><th>Clock In</th><th>Clock Out</th><th>Hours</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {todayLogs.length === 0 ? (
                <EmptyState colSpan={6} message="No attendance recorded today" />
              ) : (
                todayLogs.map(a => {
                  const s = students.find(st => st.id === a.student_id);
                  if (!s) return null;
                  return (
                    <tr key={a.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{initials(s)}</div>
                          {fullName(s)}
                        </div>
                      </td>
                      <td>{formatTime(a.clock_in)}</td>
                      <td>{a.clock_out ? formatTime(a.clock_out) : '--'}</td>
                      <td>{a.clock_out ? `${Number(a.hours).toFixed(2)} hrs` : '--'}</td>
                      <td>{a.clock_out ? <span className="badge badge-muted">Clocked Out</span> : <span className="clocked-in-indicator"><span className="dot pulse"></span> In Session</span>}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => setEditEntry(a)}>Edit</button>
                          <button className="btn btn-sm" style={{ background: 'var(--error-light)', color: 'var(--error)' }} onClick={async () => { if (confirm('Delete this time card entry?')) { await remove(a.id); toast.success('Entry deleted'); } }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EditTimeCardModal
        isOpen={!!editEntry}
        onClose={() => setEditEntry(null)}
        onSave={async (id, updates) => { await update(id, updates); toast.success('Time card updated'); }}
        entry={editEntry}
      />
    </>
  );
}
