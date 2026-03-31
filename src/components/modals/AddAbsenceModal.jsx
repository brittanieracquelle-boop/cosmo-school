import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { ABSENCE_TYPES } from '../../lib/constants';
import { fullName } from '../../lib/helpers';

export default function AddAbsenceModal({ isOpen, onClose, onCreate, students }) {
  const [form, setForm] = useState({
    student_id: '', date: new Date().toISOString().split('T')[0],
    type: 'unexcused', reason: '', notes: '', doc_received: false, doc_details: '',
  });

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  useEffect(() => {
    if (isOpen && students.length && !form.student_id) {
      set('student_id', students[0].id);
    }
  }, [isOpen, students]);

  async function handleSave() {
    if (!form.student_id || !form.date) return;
    await onCreate(form);
    setForm({ student_id: students[0]?.id || '', date: new Date().toISOString().split('T')[0], type: 'unexcused', reason: '', notes: '', doc_received: false, doc_details: '' });
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Log Absence or Tardy"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save Record</button>
        </>
      }
    >
      <div className="form-group">
        <label className="form-label">Student</label>
        <select value={form.student_id} onChange={e => set('student_id', e.target.value)}>
          {students.map(s => <option key={s.id} value={s.id}>{fullName(s)}</option>)}
        </select>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Date</label>
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Type</label>
          <select value={form.type} onChange={e => set('type', e.target.value)}>
            {ABSENCE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Reason</label>
        <input type="text" value={form.reason} onChange={e => set('reason', e.target.value)} placeholder="e.g. Illness, Family emergency, No call..." />
      </div>
      <div className="form-group">
        <label className="form-label">Notes</label>
        <input type="text" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Documentation received, follow-up needed, etc." />
      </div>
      {form.type === 'excused' && (
        <>
          <div style={{ height: 1, background: 'var(--border)', margin: '4px 0 16px' }}></div>
          <div className="form-group" style={{ marginBottom: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
              <input type="checkbox" checked={form.doc_received} onChange={e => set('doc_received', e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--sage)', cursor: 'pointer' }} />
              Doctor's / Documentation Note Received
            </label>
          </div>
          {form.doc_received && (
            <div className="form-group">
              <label className="form-label">Note Details <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(provider, date of visit, return date, etc.)</span></label>
              <input type="text" value={form.doc_details} onChange={e => set('doc_details', e.target.value)} placeholder="e.g. Dr. Smith, seen 11/17, cleared to return 11/19" />
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
