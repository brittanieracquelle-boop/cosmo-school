import * as XLSX from 'xlsx';
import { fullName, inPersonHours, totalHours, formatDate, dayName, isoWeekKey, isoWeekRange, monthKey, monthLabel, buildStudentTotals } from '../lib/helpers';

export function exportReportExcel({ students, attendanceLogs, deLogs, absences, closures, dateRange }) {
  const wb = XLSX.utils.book_new();
  const { from, to } = dateRange;
  const rangeLabel = from && to ? `${from} to ${to}` : 'All Dates';

  // Summary sheet
  const sumRows = [
    ['Bennett School of Cosmetology'],
    ['Student Hours Summary Report'],
    ['Date Range: ' + rangeLabel],
    [],
    ['Student', 'Program', 'Start Date', 'In-Person Hrs', 'Distance Ed Hrs', 'Total Hrs', 'Hrs Remaining', 'Progress']
  ];
  students.forEach(s => {
    const ip = inPersonHours(s), total = totalHours(s), left = Math.max(0, s.required_hours - total);
    sumRows.push([fullName(s), s.program, s.start_date, ip, Number(s.de_hours), total, left, Math.min(100, Math.round(total / s.required_hours * 100)) + '%']);
  });
  const sumSheet = XLSX.utils.aoa_to_sheet(sumRows);
  sumSheet['!cols'] = [28, 14, 14, 16, 18, 12, 16, 10].map(w => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, sumSheet, 'Summary');

  // Per-student detail sheets
  students.forEach(s => {
    const { daily, weekly, monthly } = buildStudentTotals(s, attendanceLogs, deLogs, from, to);
    const ipTotal = daily.reduce((t, r) => t + r.ipHrs, 0);
    const deTotal = daily.reduce((t, r) => t + r.deHrs, 0);
    const grandTotal = ipTotal + deTotal;

    const rows = [];
    rows.push([fullName(s) + ' - Hours Detail']);
    rows.push(['Program:', s.program, '', 'Start Date:', s.start_date]);
    rows.push(['In-Person Total:', ipTotal.toFixed(2), '', 'Distance Ed Total:', deTotal.toFixed(2)]);
    rows.push(['Grand Total:', grandTotal.toFixed(2), '', 'Hours Remaining:', Math.max(0, s.required_hours - totalHours(s))]);
    rows.push(['Date Range:', rangeLabel]);
    rows.push([]);

    rows.push(['MONTHLY SUMMARY']);
    rows.push(['Month', 'In-Person Hrs', 'Distance Ed Hrs', 'Combined Total']);
    monthly.forEach(m => rows.push([m.label, +m.ipHrs.toFixed(2), +m.deHrs.toFixed(2), +m.total.toFixed(2)]));
    rows.push(['TOTAL', +ipTotal.toFixed(2), +deTotal.toFixed(2), +grandTotal.toFixed(2)]);
    rows.push([]);

    rows.push(['WEEKLY SUMMARY']);
    rows.push(['Week', 'Date Range', 'In-Person Hrs', 'Distance Ed Hrs', 'Combined Total']);
    weekly.forEach(w => rows.push([w.key, w.range, +w.ipHrs.toFixed(2), +w.deHrs.toFixed(2), +w.total.toFixed(2)]));
    rows.push(['TOTAL', '', +ipTotal.toFixed(2), +deTotal.toFixed(2), +grandTotal.toFixed(2)]);
    rows.push([]);

    rows.push(['DAILY DETAIL']);
    rows.push(['Date', 'Day', 'Clock In', 'Clock Out', 'In-Person Hrs', 'Distance Ed Hrs', 'Daily Total', 'Week', 'Month']);
    daily.forEach(r => {
      rows.push([r.date, r.day, r.clockIn, r.clockOut, +r.ipHrs.toFixed(2), +r.deHrs.toFixed(2), +r.total.toFixed(2), isoWeekKey(r.date), monthLabel(monthKey(r.date))]);
    });
    rows.push(['TOTAL', '', '', '', +ipTotal.toFixed(2), +deTotal.toFixed(2), +grandTotal.toFixed(2), '', '']);

    const sheetName = (s.last_name + ',' + s.first_name[0]).slice(0, 31);
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    sheet['!cols'] = [14, 12, 10, 10, 14, 16, 14, 12, 18].map(w => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, sheet, sheetName);
  });

  // In-Person raw log sheet
  const attRows = [['Student', 'Program', 'Date', 'Day', 'Clock In', 'Clock Out', 'Hours', 'Week', 'Month']];
  students.forEach(s => {
    let logs = attendanceLogs.filter(a => a.student_id === s.id && a.clock_out);
    if (from) logs = logs.filter(a => a.date >= from);
    if (to) logs = logs.filter(a => a.date <= to);
    logs.sort((a, b) => a.date.localeCompare(b.date));
    logs.forEach(a => attRows.push([fullName(s), s.program, a.date, dayName(a.date), a.clock_in, a.clock_out, Number(a.hours), isoWeekKey(a.date), monthLabel(monthKey(a.date))]));
  });
  const attSheet = XLSX.utils.aoa_to_sheet(attRows);
  attSheet['!cols'] = [22, 14, 14, 12, 10, 10, 8, 12, 18].map(w => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, attSheet, 'In-Person Attendance');

  // Distance Ed raw sheet
  const deRows = [['Student', 'Program', 'Date', 'Module / Assignment', 'Platform', 'Hours', 'Verified', 'Week', 'Month']];
  students.forEach(s => {
    let entries = deLogs.filter(d => d.student_id === s.id);
    if (from) entries = entries.filter(d => d.date >= from);
    if (to) entries = entries.filter(d => d.date <= to);
    entries.sort((a, b) => a.date.localeCompare(b.date));
    entries.forEach(d => deRows.push([fullName(s), s.program, d.date, d.module, d.platform, Number(d.hours), d.verified ? 'Yes' : 'No', isoWeekKey(d.date), monthLabel(monthKey(d.date))]));
  });
  const deSheet = XLSX.utils.aoa_to_sheet(deRows);
  deSheet['!cols'] = [22, 14, 14, 40, 18, 8, 10, 12, 18].map(w => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, deSheet, 'Distance Education');

  // Absences sheet
  const isClosureDate = (dateStr) => closures.some(c => dateStr >= c.start_date && dateStr <= c.end_date);
  const getClosureLabel = (dateStr) => { const c = closures.find(c => dateStr >= c.start_date && dateStr <= c.end_date); return c ? c.label : ''; };
  const absRows = [['Student', 'Program', 'Date', 'Day', 'Type', 'Reason', 'Notes', 'Doc Note On File', 'Doc Note Details', 'School Closure']];
  students.forEach(s => {
    let abs = absences.filter(a => a.student_id === s.id);
    if (from) abs = abs.filter(a => a.date >= from);
    if (to) abs = abs.filter(a => a.date <= to);
    abs.sort((a, b) => a.date.localeCompare(b.date));
    abs.forEach(a => absRows.push([fullName(s), s.program, a.date, dayName(a.date), a.type, a.reason, a.notes, a.doc_received ? 'Yes' : 'No', a.doc_details || '', isClosureDate(a.date) ? getClosureLabel(a.date) : '']));
  });
  const absSheet = XLSX.utils.aoa_to_sheet(absRows);
  absSheet['!cols'] = [22, 14, 14, 12, 14, 28, 28, 16, 36, 20].map(w => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, absSheet, 'Absences & Tardies');

  // School Closures sheet
  const clRows = [['Start Date', 'End Date', 'Label']];
  [...closures].sort((a, b) => a.start_date.localeCompare(b.start_date)).forEach(c => clRows.push([c.start_date, c.end_date, c.label]));
  const clSheet = XLSX.utils.aoa_to_sheet(clRows);
  clSheet['!cols'] = [14, 14, 30].map(w => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, clSheet, 'School Closures');

  const label = students.length === 1 ? students[0].last_name : 'All-Students';
  const dl = from ? '_' + from : '';
  XLSX.writeFile(wb, 'BSC_Hours_' + label + dl + '.xlsx');
}
