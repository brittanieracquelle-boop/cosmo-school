import { useAuth } from '../../context/AuthContext';
import { useStudents } from '../../hooks/useStudents';
import { useGrades } from '../../hooks/useGrades';
import { formatDate, scoreToGrade, gradeClass } from '../../lib/helpers';

export default function StudentGrades() {
  const { profile } = useAuth();
  const { students } = useStudents();
  const { grades } = useGrades();

  const student = students.find(s => s.id === profile?.student_id);
  if (!student) return <div className="empty-state"><p>Loading...</p></div>;

  const myGrades = grades.filter(g => g.student_id === student.id).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="card">
      <div className="card-header"><div className="card-title">My Grades</div></div>
      <div className="card-body" style={{ padding: 0 }}>
        <table>
          <thead><tr><th>Project / Skill</th><th>Category</th><th>Date</th><th>Score</th><th>Grade</th><th>Notes</th></tr></thead>
          <tbody>
            {myGrades.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>No grades on record</td></tr>
            ) : (
              myGrades.map((g, i) => {
                const grade = scoreToGrade(g.score);
                return (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{g.project}</td>
                    <td><span className="badge badge-muted">{g.category}</span></td>
                    <td>{formatDate(g.date)}</td>
                    <td>{g.score}%</td>
                    <td><div className={`grade-chip ${gradeClass(grade)}`}>{grade}</div></td>
                    <td style={{ color: 'var(--muted)', fontSize: 13 }}>{g.notes || '--'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
