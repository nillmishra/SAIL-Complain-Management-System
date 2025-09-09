import { getToken } from '../utils/storage.js';
import { loadRegisterComplaint } from './register.js';
import { loadCheckStatus } from './status.js';
import { loadAdminLogin, loadAdminPanel } from './admin.js';

export function loadHomePage() {
  const content = document.getElementById("content");
  content.innerHTML = `
    <h2>Max Complaint Portal</h2>
    <p style="text-align:center; font-size:18px;">Welcome to the complaint management system.</p>
    <div class="home-actions">
      <button id="homeRegisterBtn" class="btn-home">Register Complaint</button>
      <button id="homeCheckStatusBtn" class="btn-home">Complaint Status</button>
      <button id="homeAdminBtn" class="btn-home">Admin</button>
    </div>
  `;

  document.getElementById("homeRegisterBtn").onclick = loadRegisterComplaint;
  document.getElementById("homeCheckStatusBtn").onclick = loadCheckStatus;
  document.getElementById("homeAdminBtn").onclick = () => getToken() ? loadAdminPanel() : loadAdminLogin();
}