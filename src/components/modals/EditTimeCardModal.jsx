import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';

export default function EditTimeCardModal({ isOpen, onClose, onSave, entry }) {
  const [clockIn, setClockIn] = useState('');
  const [clockOut, setClockOut] = useState('');

  useEffect(() => {
    if (entry) {
      setClockIn(entry.clock_in?.substring(0, 5) || '');
      setClockOut(entry.clock_out?.substring(0, 5) || '');
    }
  }, [entry]);

  async function handleSave() {
    if (!clockIn) return;
    const updates = { clock_in: clockIn };
    if (clockOut) {
      updates.clock_out = clockOut;
    }
    await onSave(entry.id, updates);
    onClose();
  }

  if (!entry) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Time Card"
      maxWidth="400px"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
        </>
      }
    >
      <div className="form-group">
        <label className="form-label">Date</label>
        <input type="text" value={entry.date || ''} readOnly style={{ background: '#F5F5F5', color: 'var(--muted)' }} />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Clock In</label>
          <input type="time" value={clockIn} onChange={e => setClockIn(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Clock Out</label>
          <input type="time" value={clockOut} onChange={e => setClockOut(e.target.value)} />
        </div>
      </div>
      {clockIn && clockOut && (
        <div style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', marginTop: 4 }}>
          Calculated hours: {(() => {
            const [ih, im] = clockIn.split(':').map(Number);
            const [oh, om] = clockOut.split(':').map(Number);
            return ((oh * 60 + om - ih * 60 - im) / 60).toFixed(2);
          })()} hrs
        </div>
      )}
    </Modal>
  );
}
