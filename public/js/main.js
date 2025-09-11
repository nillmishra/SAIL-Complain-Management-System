import { loadHomePage } from './pages/home.js';

document.addEventListener('DOMContentLoaded', () => {
  loadHomePage();
});

// Delegated click handler for header Admin button
document.addEventListener('click', async (e) => {
  const adminBtn = e.target.closest('#headerAdminBtn');
  if (!adminBtn) return;

  // Always open Admin Login as requested
  const { loadAdminLogin } = await import('./pages/admin.js');
  loadAdminLogin();
});