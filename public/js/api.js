import { API_BASE } from './config.js';
import { getToken } from './utils/storage.js';

function parseJSONSafe(s) { try { return JSON.parse(s); } catch { return null; } }

export async function fetchJSON(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;

  try {
    const res = await fetch(API_BASE + path, { mode: 'cors', ...options, headers });
    const text = await res.text().catch(() => '');
    const data = text ? parseJSONSafe(text) : null;

    if (!res.ok) {
      const msg = (data && data.message) ? data.message : (text || `HTTP ${res.status}`);
      const err = new Error(msg);
      err.status = res.status;
      throw err;
    }
    return data;
  } catch (err) {
    // Network/CORS/preflight issues show up here
    console.error('fetchJSON error:', err);
    throw new Error(`Network error: ${err.message || 'Failed to fetch'}`);
  }
}

export const api = {
  login: (username, password) => fetchJSON('/admin/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  generateAdmin: () => fetchJSON('/admin/generate', { method: 'POST' }),
  createComplaint: (payload) => fetchJSON('/complaints', { method: 'POST', body: JSON.stringify(payload) }),
  getComplaintById: (id) => fetchJSON('/complaints/' + encodeURIComponent(id)),
  listComplaints: () => fetchJSON('/complaints'),
  updateComplaint: (id, data) => fetchJSON('/complaints/' + encodeURIComponent(id), { method: 'PATCH', body: JSON.stringify(data) }),
  deleteComplaint: (id) => fetchJSON('/complaints/' + encodeURIComponent(id), { method: 'DELETE' })
};