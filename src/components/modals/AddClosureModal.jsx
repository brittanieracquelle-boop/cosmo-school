import { useState } from 'react';
import Modal from '../ui/Modal';

export default function AddClosureModal({ isOpen, onClose, onCreate }) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ start_date: today, end_date: today, label: '' });
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  async function handleSave() {
    if (!form.start_date || !form.end_date || !form.label.trim()) return;
    if (form.end_date < form.start_date) return;
    await onCreate(form);
    setForm({ start_date: today, end_date: today, label: '' });
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add School Closure"
      maxWidth="440px"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Add Closure</button>
        </>
      }
    >
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Start Date</label>
          <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">End Date <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: 12 }}>(same for single day)</span></label>
          <input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Label</label>
        <input type="text" value={form.label} onChange={e => set('label', e.target.value)} placeholder="e.g. Spring Break, Thanksgiving, Holiday" />
      </div>
    </Modal>
  );
}
