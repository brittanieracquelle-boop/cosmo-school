import { useState } from 'react';
import { useStudents } from '../../hooks/useStudents';
import { useDELog } from '../../hooks/useDELog';
import AddDEModal from '../../components/modals/AddDEModal';
import { fullName, initials, formatDate } from '../../lib/helpers';
import toast from 'react-hot-toast';

export default function DistanceEd() {
  const { students, refetch: refetchStudents } = useStudents();
  const { deLogs, create } = useDELog();
  const [modalOpen, setModalOpen] = useState(false);

  async function handleCreate(data) {
    const { error } = await create(data);
    if (!error) {
      await refetchStudents();
      toast.success(`${Number(data.hours)} hrs logged`);
    }
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20 }}>Distance Education Hours</h2>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Log Pivot Point LAB and other approved online hours separately from in-person attendance.</p>
        </div>
        <button className="btn btn-purple" onClick={() => setModalOpen(true)}>+ Log DE Hours</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
        {students.map(s => (
          <div key={s.id} className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{initials(s)}</div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{fullName(s)}</div>
            </div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: 'var(--purple)' }}>{Number(s.de_hours)} hrs</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Distance Ed &bull; {Math.round(Number(s.de_hours) / s.required_hours * 100)}% of required</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">Distance Education Log</div></div>
        <div className="card-body" style={{ padding: 0 }}>
          <table>
            <thead><tr><th>Student</th><th>Date</th><th>Module / Assignment</th><th>Platform</th><th>Hours</th><th>Instructor Verified</th></tr></thead>
            <tbody>
              {deLogs.map(d => {
                const s = students.find(st => st.id === d.student_id);
                if (!s) return null;
                return (
                  <tr key={d.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="avatar" style={{ width: 26, height: 26, fontSize: 10 }}>{initials(s)}</div>
                        {fullName(s)}
                      </div>
                    </td>
                    <td>{formatDate(d.date)}</td>
                    <td style={{ fontSize: 13 }}>{d.module}</td>
                    <td><span className="badge badge-purple">{d.platform}</span></td>
                    <td><strong>{Number(d.hours)}</strong></td>
                    <td>{d.verified ? <span className="badge badge-green">&#10003; Verified</span> : <span className="badge badge-gold">Pending</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AddDEModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onCreate={handleCreate} students={students} />
    </>
  );
}