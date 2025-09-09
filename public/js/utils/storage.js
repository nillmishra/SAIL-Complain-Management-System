const KEY = 'adminToken';
export function getToken() { return localStorage.getItem(KEY) || null; }
export function setToken(t) { if (t) localStorage.setItem(KEY, t); else localStorage.removeItem(KEY); }