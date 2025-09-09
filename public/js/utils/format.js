export function formatTimestamp(ts) {
  if (!ts) return '';
  try { return new Date(ts).toLocaleString(); } catch { return String(ts); }
}

export function generateComplaintID(maxNumber, department) {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const deptInitial = department.charAt(0).toUpperCase();
  return `${maxNumber}${dd}${mm}${deptInitial}`;
}