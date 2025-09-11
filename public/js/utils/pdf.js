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

  // Complaint Details removed
  const headers = [
    "Complaint ID","Max Number","Department","Issue Type",
    "Location","Contact Number","Status","Progress","Registered On","Last Updated"
  ];
  const rows = list.map(c => [
    c.id,
    c.maxNumber,
    c.department,
    c.issueType,
    c.location,
    c.contactNumber,
    c.status,
    c.progressText || "",
    formatTimestamp(c.createdAt),
    formatTimestamp(c.updatedAt)
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
      0: { cellWidth: 28 }, // Complaint ID
      1: { cellWidth: 22 }, // Max Number
      2: { cellWidth: 32 }, // Department
      3: { cellWidth: 32 }, // Issue Type
      4: { cellWidth: 36 }, // Location
      5: { cellWidth: 30 }, // Contact
      6: { cellWidth: 26 }, // Status
      7: { cellWidth: 48 }, // Progress
      8: { cellWidth: 34 }, // Registered On
      9: { cellWidth: 38 }  // Last Updated
    }
  });

  doc.save('complaints_report.pdf');
}