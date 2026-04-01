import { useState } from 'react';
import { useStudents } from '../../hooks/useStudents';
import { useAttendance } from '../../hooks/useAttendance';
import EditTimeCardModal from '../../components/modals/EditTimeCardModal';
import { fullName, initials, formatDate, dayName, formatTime } from '../../lib/helpers';
import toast from 'react-hot-toast';

export default function AttendanceLog() {
  const { students } = useStudents();
  const { logs, update, remove } = useAttendance();
  const [filter, setFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [editEntry, setEditEntry] = useState(null);

  let filtered = [...logs];
  if (filter) filtered = filtered.filter(a => a.student_id === filter);
  if (dateFrom) filtered = filtered.filter(a => a.date >= dateFrom);
  if (dateTo) filtered = filtered.filter(a => a.date <= dateTo);

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{ maxWidth: 240 }}>
          <option value="">All Students</option>
          {students.map(s => <option key={s.id} value={s.id}>{fullName(s)}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ maxWidth: 160 }} />
        <span style={{ color: 'var(--muted)' }}>to</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ maxWidth: 160 }} />
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">Attendance Records</div></div>
        <div className="card-body" style={{ padding: 0 }}>
          <table>
            <thead><tr><th>Student</th><th>Date</th><th>Day</th><th>Clock In</th><th>Clock Out</th><th>Hours</th><th>Program</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(a => {
                const s = students.find(st => st.id === a.student_id);
                if (!s) return null;
                return (
                  <tr key={a.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="avatar" style={{ width: 26, height: 26, fontSize: 10 }}>{initials(s)}</div>
                        {fullName(s)}
                      </div>
                    </td>
                    <td>{formatDate(a.date)}</td>
                    <td>{dayName(a.date)}</td>
                    <td>{formatTime(a.clock_in)}</td>
                    <td>{a.clock_out ? formatTime(a.clock_out) : '--'}</td>
                    <td>{a.hours ? Number(a.hours).toFixed(2) : '--'}</td>
                    <td><span className="badge badge-muted">{s.program}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setEditEntry(a)}>Edit</button>
                        <button className="btn btn-sm" style={{ background: 'var(--error-light)', color: 'var(--error)' }} onClick={async () => { if (confirm('Delete this time card entry?')) { await remove(a.id); toast.success('Entry deleted'); } }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
