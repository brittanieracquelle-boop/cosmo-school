import { useState } from 'react';
import { useStudents } from '../../hooks/useStudents';
import { useAbsences } from '../../hooks/useAbsences';
import { useClosures } from '../../hooks/useClosures';
import AddAbsenceModal from '../../components/modals/AddAbsenceModal';
import AddClosureModal from '../../components/modals/AddClosureModal';
import Modal from '../../components/ui/Modal';
import StatCard from '../../components/ui/StatCard';
import EmptyState from '../../components/ui/EmptyState';
import { fullName, initials, formatDate, dayName } from '../../lib/helpers';
import toast from 'react-hot-toast';

export default function Absences() {
  const { students } = useStudents();
  const { absences, create: createAbsence, update: updateAbsence, recordDailyAbsences } = useAbsences();
  const { closures, create: createClosure, remove: removeClosure } = useClosures();
  const [filter, setFilter] = useState('');
  const [absenceModal, setAbsenceModal] = useState(false);
  const [closureModal, setClosureModal] = useState(false);
  const [excuseAbsence, setExcuseAbsence] = useState(null);
  const [docDetails, setDocDetails] = useState('');

  let filtered = [...absences];
  if (filter) filtered = filtered.filter(a => a.student_id === filter);

  function isClosureDate(dateStr) {
    return closures.some(c => dateStr >= c.start_date && dateStr <= c.end_date);
  }
  function getClosureLabel(dateStr) {
    const c = closures.find(c => dateStr >= c.start_date && dateStr <= c.end_date);
    return c ? c.label : '';
  }

  async function handleCreateAbsence(data) {
    const { error } = await createAbsence(data);
    if (!error) toast.success('Absence recorded');
  }
  async function handleCreateClosure(data) {
    const { error } = await createClosure(data);
    if (!error) toast.success('School closure added: ' + data.label);
  }
  async function handleDeleteClosure(id) {
    await removeClosure(id);
    toast.success('Closure removed.');
  }

  async function handleRecordAbsences() {
    const { data, error } = await recordDailyAbsences();
    if (!error && data) {
      toast.success(`${data.absences_recorded} absence(s) recorded for ${data.date}`);
    } else {
      toast.error('Failed to record absences');
    }
  }

  async function handleExcuse() {
    if (!excuseAbsence) return;
    await updateAbsence(excuseAbsence.id, {
      type: 'excused',
      doc_received: true,
      doc_details: docDetails,
    });
    toast.success('Absence excused');
    setExcuseAbsence(null);
    setDocDetails('');
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{ maxWidth: 240 }}>
          <option value="">All Students</option>
          {students.map(s => <option key={s.id} value={s.id}>{fullName(s)}</option>)}
        </select>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-sage" onClick={handleRecordAbsences}>Record Today's Absences</button>
          <button className="btn btn-primary" onClick={() => setAbsenceModal(true)}>+ Log Absence</button>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <StatCard color="var(--error)" label="Unexcused" value={absences.filter(a => a.type === 'unexcused').length} sub="This enrollment period" />
        <StatCard color="var(--gold)" label="Excused" value={absences.filter(a => a.type === 'excused').length} sub="With documentation" />
        <StatCard color="var(--purple)" label="Tardies" value={absences.filter(a => a.type === 'tardy').length} sub="Logged late arrivals" />
        <StatCard color="var(--sage)" label="School Closures" value={closures.length} sub="Breaks & holidays" />
      </div>

      <div className="closure-card">
        <div className="closure-card-header">
          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--charcoal)' }}>&#128197; School Closures & Breaks</div>
          <button className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: 13 }} onClick={() => setClosureModal(true)}>+ Add Closure</button>
        </div>
        <div style={{ padding: '14px 20px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {closures.length === 0 ? (
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>No closures logged yet.</div>
          ) : (
            closures.map(c => {
              const label = c.start_date === c.end_date ? formatDate(c.start_date) : `${formatDate(c.start_date)} \u2013 ${formatDate(c.end_date)}`;
              return (
                <div key={c.id} className="closure-chip">
                  <span className="closure-chip-date">{label}</span>
                  <span className="closure-chip-label">{c.label}</span>
                  <button className="closure-chip-del" onClick={() => handleDeleteClosure(c.id)} title="Remove">&#10005;</button>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header"><div className="card-title">Absence & Tardy Log</div></div>
        <div className="card-body" style={{ padding: 0 }}>
          <table>
            <thead><tr><th>Student</th><th>Date</th><th>Day</th><th>Type</th><th>Reason</th><th>Notes</th><th>Doc Note</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <EmptyState colSpan={8} message="No absence records found" />
              ) : (
                filtered.map(a => {
                  const s = students.find(st => st.id === a.student_id);
                  if (!s) return null;
                  const onClosure = isClosureDate(a.date);
                  const typeTag = onClosure
                    ? <span className="absence-tag absence-closure">School Closure</span>
                    : a.type === 'unexcused' ? <span className="absence-tag absence-unexcused">Unexcused</span>
                    : a.type === 'excused' ? <span className="absence-tag absence-excused">Excused</span>
                    : <span className="absence-tag absence-tardy">Tardy</span>;
                  return (
                    <tr key={a.id} className={onClosure ? 'closure-row' : ''}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="avatar" style={{ width: 26, height: 26, fontSize: 10 }}>{initials(s)}</div>
                          {fullName(s)}
                        </div>
                      </td>
                      <td>{formatDate(a.date)}</td>
                      <td>{dayName(a.date)}</td>
                      <td>
                        {typeTag}
                        {onClosure && <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 4 }}>({getClosureLabel(a.date)})</span>}
                      </td>
                      <td style={{ fontSize: 13 }}>{a.reason || '--'}</td>
                      <td style={{ fontSize: 12, color: 'var(--muted)' }}>{a.notes || '--'}</td>
                      <td>
                        {a.doc_received ? (
                          <span className="doc-note-badge" title={a.doc_details || ''}>
                            &#128203; On File{a.doc_details ? ` \u2014 ${a.doc_details}` : ''}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--muted)', fontSize: 12 }}>--</span>
                        )}
                      </td>
                      <td>
                        {a.type === 'unexcused' && (
                          <button className="btn btn-sm btn-sage" onClick={() => { setExcuseAbsence(a); setDocDetails(''); }}>
                            Excuse
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddAbsenceModal isOpen={absenceModal} onClose={() => setAbsenceModal(false)} onCreate={handleCreateAbsence} students={students} />
      <AddClosureModal isOpen={closureModal} onClose={() => setClosureModal(false)} onCreate={handleCreateClosure} />

      <Modal
        isOpen={!!excuseAbsence}
        onClose={() => setExcuseAbsence(null)}
        title="Excuse Absence"
        maxWidth="440px"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setExcuseAbsence(null)}>Cancel</button>
            <button className="btn btn-sage" onClick={handleExcuse}>Excuse Absence</button>
          </>
        }
      >
        {excuseAbsence && (
          <>
            <div style={{ marginBottom: 16, padding: 12, background: 'var(--cream)', borderRadius: 8, fontSize: 13 }}>
              <strong>{fullName(students.find(s => s.id === excuseAbsence.student_id))}</strong> &mdash; {formatDate(excuseAbsence.date)}
              <div style={{ color: 'var(--muted)', marginTop: 4 }}>Reason: {excuseAbsence.reason || 'None given'}</div>
            </div>
            <div className="form-group">
              <label className="form-label">Doctor's Note / Documentation Details</label>
              <input
                type="text"
                value={docDetails}
                onChange={e => setDocDetails(e.target.value)}
                placeholder="e.g. Dr. Smith, seen 11/17, cleared to return 11/19"
              />
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              This will change the absence from Unexcused to Excused and mark documentation as received.
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
