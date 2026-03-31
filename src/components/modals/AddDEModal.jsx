import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { DE_PLATFORMS } from '../../lib/constants';
import { fullName } from '../../lib/helpers';

export default function AddDEModal({ isOpen, onClose, onCreate, students }) {
  const [form, setForm] = useState({
    student_id: '', date: new Date().toISOString().split('T')[0],
    hours: '', module: '', platform: 'Pivot Point LAB', verified: false,
  });

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  useEffect(() => {
    if (isOpen && students.length && !form.student_id) {
      set('student_id', students[0].id);
    }
  }, [isOpen, students]);

  async function handleSave() {
    if (!form.student_id || !form.hours || !form.module.trim()) return;
    await onCreate({
      ...form,
      hours: parseFloat(form.hours),
    });
    setForm({ student_id: students[0]?.id || '', date: new Date().toISOString().split('T')[0], hours: '', module: '', platform: 'Pivot Point LAB', verified: false });
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Log Distance Education Hours"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-purple" onClick={handleSave}>Log Hours</button>
        </>
      }
    >
      <div className="form-group">
        <label className="form-label">Student</label>
        <select value={form.student_id} onChange={e => set('student_id', e.target.value)}>
          {students.map(s => <option key={s.id} value={s.id}>{fullName(s)} ({s.program})</option>)}
        </select>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Date</label>
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Hours</label>
          <input type="number" value={form.hours} onChange={e => set('hours', e.target.value)} min="0.25" max="24" step="0.25" placeholder="e.g. 2.5" />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Module / Assignment</label>
        <input type="text" value={form.module} onChange={e => set('module', e.target.value)} placeholder="e.g. Pivot Point Module 105 - Hair Color Theory" />
      </div>
      <div className="form-group">
        <label className="form-label">Platform</label>
        <select value={form.platform} onChange={e => set('platform', e.target.value)}>
          {DE_PLATFORMS.map(p => <option key={p}>{p}</option>)}
        </select>
      </div>
      <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input type="checkbox" checked={form.verified} onChange={e => set('verified', e.target.checked)} style={{ width: 'auto', accentColor: 'var(--sage)' }} />
        <label style={{ fontSize: 14, cursor: 'pointer' }}>Instructor has verified completion</label>
      </div>
    </Modal>
  );
}
