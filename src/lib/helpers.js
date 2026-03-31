import { format, parseISO } from 'date-fns';

export const fullName = (s) => s ? `${s.first_name} ${s.last_name}` : '';
export const initials = (s) => s ? s.first_name[0] + s.last_name[0] : '';
export const inPersonHours = (s) => Number(s.theory_hours) + Number(s.clinical_hours);
export const totalHours = (s) => Number(s.theory_hours) + Number(s.clinical_hours) + Number(s.de_hours);

export const scoreToGrade = (sc) => sc >= 93 ? 'A' : sc >= 83 ? 'B' : sc >= 73 ? 'C' : sc >= 63 ? 'D' : 'F';
export const gradeClass = (g) => g === 'A' ? 'grade-a' : g === 'B' ? 'grade-b' : g === 'C' ? 'grade-c' : 'grade-f';

export const dayName = (d) => {
  const date = typeof d === 'string' ? parseISO(d) : d;
  return format(date, 'EEEE');
};

export const formatDate = (d) => {
  const date = typeof d === 'string' ? parseISO(d) : d;
  return format(date, 'MMM d, yyyy');
};

export const formatTime = (t) => {
  if (!t) return '--';
  // Handle both "HH:MM" and "HH:MM:SS" formats
  return t.substring(0, 5);
};

export const todayISO = () => format(new Date(), 'yyyy-MM-dd');

// ISO week key (Mon-Sun) for a date string
export function isoWeekKey(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay() || 7;
  d.setDate(d.getDate() + 4 - day);
  const jan4 = new Date(d.getFullYear(), 0, 4);
  const week = Math.ceil(((d - jan4) / 86400000 + jan4.getDay() + 1) / 7);
  return d.getFullYear() + '-W' + String(week).padStart(2, '0');
}

export function isoWeekRange(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay() || 7;
  const mon = new Date(d); mon.setDate(d.getDate() - day + 1);
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  const fmt = (dt) => (dt.getMonth() + 1) + '/' + dt.getDate();
  return fmt(mon) + ' - ' + fmt(sun);
}

export function monthKey(dateStr) { return dateStr.slice(0, 7); }

export function monthLabel(key) {
  const [y, m] = key.split('-');
  return new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function buildStudentTotals(student, attendanceLogs, deLogs, from, to) {
  let logs = attendanceLogs.filter(a => a.student_id === student.id && a.clock_out);
  let des = deLogs.filter(d => d.student_id === student.id);
  if (from) { logs = logs.filter(a => a.date >= from); des = des.filter(d => d.date >= from); }
  if (to) { logs = logs.filter(a => a.date <= to); des = des.filter(d => d.date <= to); }
  logs.sort((a, b) => a.date.localeCompare(b.date));
  des.sort((a, b) => a.date.localeCompare(b.date));

  const allDates = [...new Set([...logs.map(a => a.date), ...des.map(d => d.date)])].sort();

  const daily = allDates.map(date => {
    const ipHrs = logs.filter(a => a.date === date).reduce((s, a) => s + (Number(a.hours) || 0), 0);
    const deHrs = des.filter(d => d.date === date).reduce((s, d) => s + Number(d.hours), 0);
    const ipEntry = logs.find(a => a.date === date);
    return { date, day: dayName(date), clockIn: ipEntry ? formatTime(ipEntry.clock_in) : '--', clockOut: ipEntry ? formatTime(ipEntry.clock_out) : '--', ipHrs, deHrs, total: ipHrs + deHrs };
  });

  const weekMap = {};
  daily.forEach(r => {
    const wk = isoWeekKey(r.date);
    if (!weekMap[wk]) weekMap[wk] = { key: wk, range: isoWeekRange(r.date), ipHrs: 0, deHrs: 0, total: 0 };
    weekMap[wk].ipHrs += r.ipHrs; weekMap[wk].deHrs += r.deHrs; weekMap[wk].total += r.total;
  });
  const weekly = Object.values(weekMap).sort((a, b) => a.key.localeCompare(b.key));

  const mMap = {};
  daily.forEach(r => {
    const mk = monthKey(r.date);
    if (!mMap[mk]) mMap[mk] = { key: mk, label: monthLabel(mk), ipHrs: 0, deHrs: 0, total: 0 };
    mMap[mk].ipHrs += r.ipHrs; mMap[mk].deHrs += r.deHrs; mMap[mk].total += r.total;
  });
  const monthly = Object.values(mMap).sort((a, b) => a.key.localeCompare(b.key));

  return { daily, weekly, monthly };
}
