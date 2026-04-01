import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { PROGRAM_TYPES } from '../../lib/constants';

export default function EditStudentModal({ isOpen, onClose, onSave, student }) {
  const [form, setForm] = useState({
    first_name: '', last_name: '', program: 'Full-Time',
    start_date: '', required_hours: 1500,
    theory_hours: 0, clinical_hours: 0, pin: '',
  });

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  useEffect(() => {
    if (student) {
      setForm({
        first_name: student.first_name,
        last_name: student.last_name,
        program: student.program,
        start_date: student.start_date,
        required_hours: student.required_hours,
        theory_hours: Number(student.theory_hours),
        clinical_hours: Number(student.clinical_hours),
        pin: student.pin,
      });
    }
  }, [student]);

  async function handleSave() {
    if (!form.first_name || !form.last_name) return;
    if (form.pin && !/^\d{4}$/.test(form.pin)) return;
    await onSave(student.id, form);
    onClose();
  }

  if (!student) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Student"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
        </>
      }
    >
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">First Name</label>
          <input type="text" value={form.first_name} onChange={e => set('first_name', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Last Name</label>
          <input type="text" value={form.last_name} onChange={e => set('last_name', e.target.value)} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Program</label>
          <select value={form.program} onChange={e => set('program', e.target.value)}>
            {PROGRAM_TYPES.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Start Date</label>
          <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Required Hours</label>
        <input type="number" value={form.required_hours} onChange={e => set('required_hours', parseInt(e.target.value) || 1500)} />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Theory Hours</label>
          <input type="number" value={form.theory_hours} onChange={e => set('theory_hours', parseFloat(e.target.value) || 0)} />
        </div>
        <div className="form-group">
          <label className="form-label">Clinical Hours</label>
          <input type="number" value={form.clinical_hours} onChange={e => set('clinical_hours', parseFloat(e.target.value) || 0)} />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Kiosk PIN <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: 12 }}>(4 digits)</span></label>
        <input type="text" value={form.pin} onChange={e => set('pin', e.target.value)} maxLength={4} />
      </div>
    </Modal>
  );
}
