import { useState } from 'react';
import { useStudents } from '../../hooks/useStudents';
import { useGrades } from '../../hooks/useGrades';
import AddGradeModal from '../../components/modals/AddGradeModal';
import { fullName, initials, formatDate, scoreToGrade, gradeClass } from '../../lib/helpers';
import toast from 'react-hot-toast';

export default function Grades() {
  const { students } = useStudents();
  const { grades, create } = useGrades();
  const [filter, setFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  let filtered = [...grades];
  if (filter) filtered = filtered.filter(g => g.student_id === filter);

  async function handleCreate(data) {
    const { error } = await create(data);
    if (!error) toast.success('Grade saved successfully');
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{ maxWidth: 220 }}>
          <option value="">All Students</option>
          {students.map(s => <option key={s.id} value={s.id}>{fullName(s)}</option>)}
        </select>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>+ Add Grade</button>
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">Grade Records</div></div>
        <div className="card-body" style={{ padding: 0 }}>
          <table>
            <thead><tr><th>Student</th><th>Project / Skill</th><th>Category</th><th>Date</th><th>Score</th><th>Grade</th><th>Notes</th></tr></thead>
            <tbody>
              {filtered.map(g => {
                const s = students.find(st => st.id === g.student_id);
                if (!s) return null;
                const grade = scoreToGrade(g.score);
                return (
                  <tr key={g.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="avatar" style={{ width: 26, height: 26, fontSize: 10 }}>{initials(s)}</div>
                        {fullName(s)}
                      </div>
                    </td>
                    <td style={{ fontWeight: 500 }}>{g.project}</td>
                    <td><span className="badge badge-muted">{g.category}</span></td>
                    <td>{formatDate(g.date)}</td>
                    <td>{g.score}%</td>
                    <td><div className={`grade-chip ${gradeClass(grade)}`}>{grade}</div></td>
                    <td style={{ color: 'var(--muted)', fontSize: 13 }}>{g.notes || '--'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AddGradeModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onCreate={handleCreate} students={students} />
    </>
  );
}