import { api } from '../api.js';
import { addGoBackButton, showToast } from '../utils/dom.js';
import { downloadComplaintsPdf } from '../utils/pdf.js';
import { formatTimestamp } from '../utils/format.js';
import { getToken, setToken } from '../utils/storage.js';

export function loadAdminLogin() {
  const content = document.getElementById("content");
  content.innerHTML = `
    <h2>Admin Login</h2>
    <form id="adminLoginForm">
      <label for="username">Username:</label>
      <input type="text" id="username" name="username" required />
      <label for="password">Password:</label>
      <input type="password" id="password" name="password" required />
      <button type="submit" class="submit-btn">Login</button>
    </form>
    <div id="loginError" class="error" style="margin-top:15px;"></div>
  `;
  addGoBackButton();

  const form = document.getElementById("adminLoginForm");
  const loginError = document.getElementById("loginError");

  form.onsubmit = async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    loginError.textContent = "";
    try {
      const { token } = await api.login(username, password);
      setToken(token);
      loadAdminPanel();
    } catch (err) {
      loginError.textContent = err?.message || "Invalid username or password.";
    }
  };
}

export async function loadAdminPanel() {
  if (!getToken()) return loadAdminLogin();
  const content = document.getElementById("content");

  let complaints = [];
  try {
    complaints = await api.listComplaints();
  } catch (e) {
    alert('Session expired or unauthorized. Please log in again.');
    setToken(null);
    return loadAdminLogin();
  }

  const generateAdminBtnHtml = `
    <button id="generateAdminCredBtn" style="margin-bottom:15px;background:#28a745;color:white;padding:10px 20px;border:none;border-radius:4px;cursor:pointer;">Generate Admin Credentials</button>
    <button id="downloadPdfBtn" style="margin-bottom:15px;background:#0077cc;color:white;padding:10px 20px;border:none;border-radius:4px;cursor:pointer;margin-left:10px;">Download Data</button>
    <div id="generatedCreds" style="margin-bottom:20px;font-size:18px;"></div>
  `;

  const tableRow = (c) => `
    <tr data-id="${c.id}">
      <td data-label="Complaint ID">${c.id}</td>
      <td data-label="Max Number">${c.maxNumber}</td>
      <td data-label="Department">${c.department}</td>
      <td data-label="Issue Type">${c.issueType}</td>
      <td data-label="Complaint Details">${c.complaintText}</td>
      <td data-label="Contact No.">${c.contactNumber || ''}</td>
      <td data-label="Location">${c.location || ''}</td>
      <td data-label="Progress Details">
        <textarea rows="3" class="progressText" placeholder="Write progress details...">${c.progressText || ""}</textarea>
      </td>
      <td data-label="Status">
        <select class="statusSelect">
          <option value="Registered" ${c.status === "Registered" ? "selected" : ""}>Registered</option>
          <option value="In Progress" ${c.status === "In Progress" ? "selected" : ""}>In Progress</option>
          <option value="Resolved" ${c.status === "Resolved" ? "selected" : ""}>Resolved</option>
          <option value="Closed" ${c.status === "Closed" ? "selected" : ""}>Closed</option>
        </select>
      </td>
      <td data-label="Registered On">${formatTimestamp(c.createdAt) || ''}</td>
      <td data-label="Last Updated">${formatTimestamp(c.updatedAt) || ''}</td>
      <td data-label="Actions">
        <div class="action-buttons">
          <button class="update-btn">Update</button>
          <button class="delete-btn">Delete</button>
        </div>
      </td>
    </tr>
  `;

  content.innerHTML = `
    <h2>Admin Panel - Manage Complaints</h2>
    ${generateAdminBtnHtml}
    ${complaints.length ? `
    <div class="table-wrapper">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Complaint ID</th>
            <th>Max Number</th>
            <th>Department</th>
            <th>Issue Type</th>
            <th>Complaint Details</th>
            <th>Contact No.</th>
            <th>Location</th>
            <th>Progress Details</th>
            <th>Status</th>
            <th>Registered On</th>
            <th>Last Updated</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="complaintsTableBody">
          ${complaints.map(tableRow).join('')}
        </tbody>
      </table>
    </div>` : `<p>No complaints registered yet.</p>`}
    <button id="logoutBtn" style="margin-top:20px;">Logout</button>
  `;
  addGoBackButton();

  // Logout
  document.getElementById("logoutBtn").onclick = async () => {
    setToken(null);
    const { loadHomePage } = await import('./home.js');
    loadHomePage();
  };

  // Update
  document.querySelectorAll('.update-btn').forEach(btn => {
    btn.onclick = async function() {
      const row = this.closest('tr');
      const id = row.dataset.id;
      const status = row.querySelector('.statusSelect').value;
      const progressText = row.querySelector('.progressText').value;

      this.disabled = true;
      const originalText = this.textContent;
      this.textContent = 'Updating...';

      try {
        const updated = await api.updateComplaint(id, { status, progressText });

        // Update Last Updated cell without full reload
        const lastUpdatedCell = row.querySelector('td[data-label="Last Updated"]');
        if (lastUpdatedCell) lastUpdatedCell.textContent = formatTimestamp(updated.updatedAt);

        showToast(`
          <div class="body">
            <strong>Updated:</strong> ${updated.id}<br/>
            Status: <code>${updated.status}</code><br/>
            Progress saved.
          </div>
          <button class="close-btn" type="button" aria-label="Close">×</button>
        `, { duration: 3500 });

      } catch (err) {
        showToast(`
          <div class="body">
            <strong>Update failed:</strong> ${err?.message || 'Unknown error'}
          </div>
          <button class="close-btn" type="button" aria-label="Close">×</button>
        `, { duration: 4000 });
        console.error('Update failed:', err);
      } finally {
        this.disabled = false;
        this.textContent = originalText;
      }
    };
  });

  // Delete (toast, no confirm)
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.onclick = async function() {
      const row = this.closest('tr');
      const id = row.dataset.id;

      this.disabled = true;
      const originalText = this.textContent;
      this.textContent = 'Deleting...';

      try {
        await api.deleteComplaint(id);
        row.remove();

        showToast(`
          <div class="body">
            <strong>Deleted:</strong> ${id}
          </div>
          <button class="close-btn" type="button" aria-label="Close">×</button>
        `, { duration: 3500 });

        const tbody = document.getElementById('complaintsTableBody');
        if (tbody && tbody.children.length === 0) {
          const { loadAdminPanel } = await import('./admin.js');
          loadAdminPanel();
        }
      } catch (err) {
        showToast(`
          <div class="body">
            <strong>Delete failed:</strong> ${err?.message || 'Unknown error'}
          </div>
          <button class="close-btn" type="button" aria-label="Close">×</button>
        `, { duration: 4000 });

        this.disabled = false;
        this.textContent = originalText;
      }
    };
  });

  // Generate Admin
  document.getElementById("generateAdminCredBtn").onclick = async () => {
    try {
      const { username, password } = await api.generateAdmin();
      document.getElementById("generatedCreds").innerHTML = `
        <strong>Username:</strong> <span style="color:green">${username}</span><br>
        <strong>Password:</strong> <span style="color:green">${password}</span><br>
        <span style="color:blue;">(Save these credentials securely!)</span>
      `;
    } catch (err) {
      showToast(`
        <div class="body">
          <strong>Generate failed:</strong> ${err?.message || 'Unknown error'}
        </div>
        <button class="close-btn" type="button" aria-label="Close">×</button>
      `, { duration: 4000 });
    }
  };

  // Download PDF
  document.getElementById("downloadPdfBtn").onclick = async () => {
    try {
      const list = await api.listComplaints();
      downloadComplaintsPdf(list);
    } catch {
      showToast(`
        <div class="body">
          <strong>Download failed</strong>
        </div>
        <button class="close-btn" type="button" aria-label="Close">×</button>
      `, { duration: 3000 });
    }
  };
}