import { formatTimestamp } from './format.js';

export function downloadComplaintsPdf(list) {
  if (!Array.isArray(list) || !list.length) {
    alert('No complaints to download.');
    return;
  }
  const { jsPDF } = window.jspdf || {};
  if (!jsPDF || typeof (new jsPDF()).autoTable !== 'function') {
    alert('AutoTable plugin is missing.');
    return;
  }
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFontSize(14);
  doc.text("SAIL Complaint Management System - Complaints Report", 14, 16);

  const headers = [
    "Complaint ID","Max Number","Department","Issue Type",
    "Complaint Details","Location","Contact Number","Status","Progress","Last Updated"
  ];
  const rows = list.map(c => [
    c.id, c.maxNumber, c.department, c.issueType, c.complaintText,
    c.location, c.contactNumber, c.status, c.progressText || "", formatTimestamp(c.updatedAt)
  ]);

  doc.autoTable({
    head: [headers],
    body: rows,
    startY: 22,
    styles: { fontSize: 9, cellWidth: 'wrap' },
    headStyles: { fillColor: [0, 119, 204] },
    margin: { left: 8, right: 8 },
    theme: 'grid',
    columnStyles: {
      0: { cellWidth: 28 }, 1: { cellWidth: 22 }, 2: { cellWidth: 32 },
      3: { cellWidth: 32 }, 4: { cellWidth: 50 }, 5: { cellWidth: 32 },
      6: { cellWidth: 32 }, 7: { cellWidth: 28 }, 8: { cellWidth: 50 },
      9: { cellWidth: 38 }
    }
  });

  doc.save('complaints_report.pdf');
}