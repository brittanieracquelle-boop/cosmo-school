import { useState } from 'react';
import Modal from '../ui/Modal';
import { PROGRAM_TYPES } from '../../lib/constants';

export default function AddStudentModal({ isOpen, onClose, onCreate }) {
  const [form, setForm] = useState({
    first_name: '', last_name: '', program: 'Full-Time',
    start_date: new Date().toISOString().split('T')[0],
    required_hours: 1500, pin: '',
  });

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  async function handleSave() {
    if (!form.first_name || !form.last_name) return;
    if (form.pin && !/^\d{4}$/.test(form.pin)) return;
    await onCreate({
      ...form,
      theory_hours: 0,
      clinical_hours: 0,
      de_hours: 0,
      pin: form.pin || String(1000 + Math.floor(Math.random() * 9000)),
    });
    setForm({ first_name: '', last_name: '', program: 'Full-Time', start_date: new Date().toISOString().split('T')[0], required_hours: 1500, pin: '' });
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Student"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Add Student</button>
        </>
      }
    >
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">First Name</label>
          <input type="text" value={form.first_name} onChange={e => set('first_name', e.target.value)} placeholder="First" />
        </div>
        <div className="form-group">
          <label className="form-label">Last Name</label>
          <input type="text" value={form.last_name} onChange={e => set('last_name', e.target.value)} placeholder="Last" />
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
      <div className="form-group">
        <label className="form-label">Kiosk PIN <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: 12 }}>(4 digits)</span></label>
        <input type="text" value={form.pin} onChange={e => set('pin', e.target.value)} placeholder="e.g. 1009" maxLength={4} />
      </div>
    </Modal>
  );
}
