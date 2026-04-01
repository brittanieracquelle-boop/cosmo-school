import { useState } from 'react';
import { useStudents } from '../../hooks/useStudents';
import AddStudentModal from '../../components/modals/AddStudentModal';
import EditStudentModal from '../../components/modals/EditStudentModal';
import { fullName, initials, inPersonHours, totalHours, formatDate } from '../../lib/helpers';
import toast from 'react-hot-toast';

export default function StudentRoster() {
  const { students, create, update, remove } = useStudents();
  const [modalOpen, setModalOpen] = useState(false);
  const [editStudent, setEditStudent] = useState(null);

  async function handleCreate(data) {
    const { error } = await create(data);
    if (!error) toast.success('Student added successfully.');
  }

  async function handleDelete(s) {
    if (confirm(`Delete ${fullName(s)}? This will also delete all their attendance, grades, and absence records.`)) {
      const { error } = await remove(s.id);
      if (!error) toast.success(`${fullName(s)} deleted.`);
    }
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>+ Add Student</button>
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">Student Roster</div></div>
        <div className="card-body" style={{ padding: 0 }}>
          <table>
            <thead><tr><th>Name</th><th>Program</th><th>Start Date</th><th>In-Person</th><th>Distance Ed</th><th>Total</th><th>Remaining</th><th>Progress</th><th>PIN</th><th>Actions</th></tr></thead>
            <tbody>
              {students.map(s => {
                const ip = inPersonHours(s);
                const total = totalHours(s);
                const left = Math.max(0, s.required_hours - total);
                const pct = Math.min(100, Math.round(total / s.required_hours * 100));
                const color = pct > 75 ? 'var(--sage)' : pct > 40 ? 'var(--gold)' : 'var(--blush)';
                return (
                  <tr key={s.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar">{initials(s)}</div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{fullName(s)}</div>
                          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{formatDate(s.start_date)}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge badge-muted">{s.program}</span></td>
                    <td>{formatDate(s.start_date)}</td>
                    <td>{ip}</td>
                    <td><span style={{ color: 'var(--purple)', fontWeight: 500 }}>{Number(s.de_hours)}</span></td>
                    <td><strong>{total}</strong></td>
                    <td>{left}</td>
                    <td style={{ minWidth: 80 }}>
                      <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%`, background: color }}></div></div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>{pct}%</div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: 13, background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 10px', letterSpacing: 2 }}>
                        {s.pin || '----'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setEditStudent(s)}>Edit</button>
                        <button className="btn btn-sm" style={{ background: 'var(--error-light)', color: 'var(--error)' }} onClick={() => handleDelete(s)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AddStudentModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onCreate={handleCreate} />
      <EditStudentModal
        isOpen={!!editStudent}
        onClose={() => setEditStudent(null)}
        onSave={async (id, updates) => { await update(id, updates); toast.success('Student updated.'); }}
        student={editStudent}
      />
    </>
  );
}
