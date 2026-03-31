import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { GRADE_CATEGORIES } from '../../lib/constants';
import { scoreToGrade, fullName } from '../../lib/helpers';

export default function AddGradeModal({ isOpen, onClose, onCreate, students }) {
  const [form, setForm] = useState({
    student_id: '', project: '', category: 'Hair Services',
    date: new Date().toISOString().split('T')[0], score: '', notes: '',
  });

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  useEffect(() => {
    if (isOpen && students.length && !form.student_id) {
      set('student_id', students[0].id);
    }
  }, [isOpen, students]);

  async function handleSave() {
    if (!form.student_id || !form.project || !form.score) return;
    await onCreate({
      ...form,
      score: parseInt(form.score),
    });
    setForm({ student_id: students[0]?.id || '', project: '', category: 'Hair Services', date: new Date().toISOString().split('T')[0], score: '', notes: '' });
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Grade Entry"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save Grade</button>
        </>
      }
    >
      <div className="form-group">
        <label className="form-label">Student</label>
        <select value={form.student_id} onChange={e => set('student_id', e.target.value)}>
          {students.map(s => <option key={s.id} value={s.id}>{fullName(s)} ({s.program})</option>)}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Project / Skill Name</label>
        <input type="text" value={form.project} onChange={e => set('project', e.target.value)} placeholder="e.g. Precision Haircut, Color Application..." />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Category</label>
          <select value={form.category} onChange={e => set('category', e.target.value)}>
            {GRADE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Date</label>
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Score (0-100)</label>
          <input type="number" value={form.score} onChange={e => set('score', e.target.value)} min="0" max="100" placeholder="87" />
        </div>
        <div className="form-group">
          <label className="form-label">Grade (auto)</label>
          <input type="text" readOnly value={form.score ? scoreToGrade(parseInt(form.score)) : ''} style={{ background: '#F5F5F5', color: 'var(--muted)' }} />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Instructor Notes</label>
        <input type="text" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional..." />
      </div>
    </Modal>
  );
}
