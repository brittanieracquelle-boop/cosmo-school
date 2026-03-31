import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { fullName, formatDate, inPersonHours, totalHours, buildStudentTotals } from '../lib/helpers';

export function exportReportPDF({ students, attendanceLogs, deLogs, absences, closures, dateRange }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
  const { from, to } = dateRange;
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 40;
  const contentW = pageW - margin * 2;
  const rangeLabel = from && to ? `${from} to ${to}` : 'All Dates';
  const genDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const BLUSH = [212, 137, 106], CHARCOAL = [28, 28, 30], MUTED = [138, 138, 142], SAGE = [122, 158, 142], PURPLE = [142, 122, 181], GOLD = [201, 168, 76], CREAM = [245, 242, 238], LTGRAY = [250, 248, 244];

  function drawPageHeader(title) {
    doc.setFillColor(...CHARCOAL);
    doc.rect(0, 0, pageW, 50, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Bennett School of Cosmetology', margin, 20);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 185);
    doc.text('Decatur, Alabama  |  Alabama Board of Cosmetology and Barbering', margin, 33);
    doc.setTextColor(200, 200, 205);
    doc.text(title + '  |  Range: ' + rangeLabel + '  |  Generated: ' + genDate, margin, 45);
    doc.setTextColor(...CHARCOAL);
  }

  function sectionLabel(text, y) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(text.toUpperCase(), margin, y);
    doc.setDrawColor(...MUTED);
    doc.line(margin + doc.getTextWidth(text.toUpperCase()) + 6, y - 1, pageW - margin, y - 1);
    doc.setTextColor(...CHARCOAL);
    return y + 12;
  }

  students.forEach((s, idx) => {
    if (idx > 0) doc.addPage();
    drawPageHeader('Student Hours Report');
    let y = 62;

    // Student name bar
    doc.setFillColor(...BLUSH);
    doc.rect(margin, y, contentW, 24, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(fullName(s), margin + 8, y + 16);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(s.program + '  |  Started: ' + formatDate(s.start_date), pageW - margin - 8, y + 16, { align: 'right' });
    y += 32;

    const { daily, weekly, monthly } = buildStudentTotals(s, attendanceLogs, deLogs, from, to);
    const ipTotal = daily.reduce((t, r) => t + r.ipHrs, 0);
    const deTotal = daily.reduce((t, r) => t + r.deHrs, 0);
    const grandTotal = ipTotal + deTotal;
    const allTimeTotal = totalHours(s);
    const left = Math.max(0, s.required_hours - allTimeTotal);
    const pct = Math.min(100, Math.round(allTimeTotal / s.required_hours * 100));

    const stats = [
      ['In-Person', ipTotal.toFixed(1), SAGE],
      ['Distance Ed', deTotal.toFixed(1), PURPLE],
      ['Period Total', grandTotal.toFixed(1), BLUSH],
      ['All-Time Total', String(allTimeTotal), GOLD],
      ['Remaining', String(left), CHARCOAL],
      ['Progress', pct + '%', CHARCOAL]
    ];
    const bw = contentW / stats.length;
    stats.forEach(([lbl, val, col], i) => {
      const bx = margin + i * bw;
      doc.setFillColor(...CREAM);
      doc.roundedRect(bx + 2, y, bw - 4, 38, 3, 3, 'F');
      doc.setTextColor(...col);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(val, bx + bw / 2, y + 22, { align: 'center' });
      doc.setTextColor(...MUTED);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.text(lbl, bx + bw / 2, y + 33, { align: 'center' });
    });
    y += 50;

    // Monthly totals
    y = sectionLabel('Monthly Totals', y);
    doc.autoTable({
      startY: y, margin: { left: margin, right: margin },
      head: [['Month', 'In-Person Hrs', 'Distance Ed Hrs', 'Combined Total']],
      body: monthly.length === 0 ? [['No records in selected range', '', '', '']] : monthly.map(m => [m.label, m.ipHrs.toFixed(2), m.deHrs.toFixed(2), m.total.toFixed(2)]),
      foot: monthly.length > 0 ? [['TOTAL', ipTotal.toFixed(2), deTotal.toFixed(2), grandTotal.toFixed(2)]] : [],
      styles: { fontSize: 8.5, cellPadding: 4, textColor: CHARCOAL },
      headStyles: { fillColor: CHARCOAL, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      footStyles: { fillColor: CREAM, fontStyle: 'bold', textColor: CHARCOAL },
      alternateRowStyles: { fillColor: LTGRAY },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right', fontStyle: 'bold' } },
    });
    y = doc.lastAutoTable.finalY + 14;

    // Weekly totals
    y = sectionLabel('Weekly Totals', y);
    doc.autoTable({
      startY: y, margin: { left: margin, right: margin },
      head: [['Week', 'Date Range', 'In-Person Hrs', 'Distance Ed Hrs', 'Combined Total']],
      body: weekly.length === 0 ? [['No records', '', '', '', '']] : weekly.map(w => [w.key, w.range, w.ipHrs.toFixed(2), w.deHrs.toFixed(2), w.total.toFixed(2)]),
      foot: weekly.length > 0 ? [['TOTAL', '', ipTotal.toFixed(2), deTotal.toFixed(2), grandTotal.toFixed(2)]] : [],
      styles: { fontSize: 8.5, cellPadding: 4, textColor: CHARCOAL },
      headStyles: { fillColor: [90, 80, 110], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      footStyles: { fillColor: CREAM, fontStyle: 'bold', textColor: CHARCOAL },
      alternateRowStyles: { fillColor: LTGRAY },
      columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right', fontStyle: 'bold' } },
    });
    y = doc.lastAutoTable.finalY + 14;

    // Daily detail
    y = sectionLabel('Daily Detail', y);
    const dailyBody = daily.length === 0
      ? [['No records in selected range', '', '', '', '', '', '']]
      : daily.map(r => [formatDate(r.date), r.day, r.clockIn, r.clockOut, r.ipHrs > 0 ? r.ipHrs.toFixed(2) : '--', r.deHrs > 0 ? r.deHrs.toFixed(2) : '--', r.total.toFixed(2)]);
    doc.autoTable({
      startY: y, margin: { left: margin, right: margin },
      head: [['Date', 'Day', 'In', 'Out', 'In-Person', 'Dist. Ed', 'Daily Total']],
      body: dailyBody,
      foot: daily.length > 0 ? [['', '', '', '', 'TOTAL IP: ' + ipTotal.toFixed(2), 'TOTAL DE: ' + deTotal.toFixed(2), 'TOTAL: ' + grandTotal.toFixed(2)]] : [],
      styles: { fontSize: 8, cellPadding: 4, textColor: CHARCOAL },
      headStyles: { fillColor: SAGE, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      footStyles: { fillColor: CREAM, fontStyle: 'bold', textColor: CHARCOAL, fontSize: 7.5 },
      alternateRowStyles: { fillColor: LTGRAY },
      columnStyles: { 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right', fontStyle: 'bold' } },
    });
  });

  // Multi-student summary page
  if (students.length > 1) {
    doc.addPage();
    drawPageHeader('School-Wide Summary');
    let y = 62;
    y = sectionLabel('All Students - Hours Summary', y);
    const sumBody = students.map(s => {
      const { daily } = buildStudentTotals(s, attendanceLogs, deLogs, from, to);
      const ip = daily.reduce((t, r) => t + r.ipHrs, 0);
      const de = daily.reduce((t, r) => t + r.deHrs, 0);
      return [fullName(s), s.program, ip.toFixed(2), de.toFixed(2), (ip + de).toFixed(2), String(totalHours(s)), String(Math.max(0, s.required_hours - totalHours(s)))];
    });
    const totIP = students.reduce((t, s) => { const { daily } = buildStudentTotals(s, attendanceLogs, deLogs, from, to); return t + daily.reduce((tt, r) => tt + r.ipHrs, 0); }, 0);
    const totDE = students.reduce((t, s) => { const { daily } = buildStudentTotals(s, attendanceLogs, deLogs, from, to); return t + daily.reduce((tt, r) => tt + r.deHrs, 0); }, 0);
    doc.autoTable({
      startY: y, margin: { left: margin, right: margin },
      head: [['Student', 'Program', 'In-Person Hrs', 'Distance Ed Hrs', 'Period Total', 'All-Time Total', 'Hrs Remaining']],
      body: sumBody,
      foot: [['ALL STUDENTS', '', totIP.toFixed(2), totDE.toFixed(2), (totIP + totDE).toFixed(2), '', '']],
      styles: { fontSize: 8.5, cellPadding: 5, textColor: CHARCOAL },
      headStyles: { fillColor: CHARCOAL, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      footStyles: { fillColor: CREAM, fontStyle: 'bold', textColor: CHARCOAL },
      alternateRowStyles: { fillColor: LTGRAY },
      columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right', fontStyle: 'bold' }, 5: { halign: 'right' }, 6: { halign: 'right' } },
    });
  }

  const label = students.length === 1 ? students[0].last_name : 'All-Students';
  const dl = from ? '_' + from : '';
  doc.save('BSC_Hours_' + label + dl + '.pdf');
}
