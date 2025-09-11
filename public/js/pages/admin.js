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

  let allComplaints = [];
  try {
    allComplaints = await api.listComplaints();
  } catch (e) {
    alert('Session expired or unauthorized. Please log in again.');
    setToken(null);
    return loadAdminLogin();
  }

  let visibleComplaints = allComplaints;

  const tableHeadHtml = `
    <thead>
      <tr>
        <th>Complaint ID</th>
        <th>Max Number</th>
        <th>Department</th>
        <th>Issue Type</th>
        <th>Contact No.</th>
        <th>Location</th>
        <th>Progress Details</th>
        <th>Status</th>
        <th>Registered On</th>
        <th>Last Updated</th>
        <th>Actions</th>
      </tr>
    </thead>
  `;

  function tableRow(c) {
    return `
      <tr data-id="${c.id}">
        <td data-label="Complaint ID">${c.id}</td>
        <td data-label="Max Number">${c.maxNumber}</td>
        <td data-label="Department">${c.department}</td>
        <td data-label="Issue Type">${c.issueType}</td>
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
  }

  content.innerHTML = `
    <h2>Admin Panel - Manage Complaints</h2>

    <div class="admin-actions">
      <div class="searchbar">
        <input id="searchMaxNumber" class="search-input" type="text" placeholder="Search by Max Number (e.g., 71234)" inputmode="numeric" />
        <button id="searchClearBtn" type="button" class="btn-secondary">Clear</button>
      </div>
      <div class="actions-right">
        <button id="downloadPdfBtn" class="btn-secondary">Download Data</button>
      </div>
    </div>

    ${allComplaints.length ? `
    <div class="table-wrapper">
      <table class="admin-table">
        ${tableHeadHtml}
        <tbody id="complaintsTableBody"></tbody>
      </table>
    </div>` : `<p>No complaints registered yet.</p>`}

    <button id="logoutBtn" style="margin-top:20px;">Logout</button>
  `;

  addGoBackButton();

  function renderRows(list) {
    const tbody = document.getElementById('complaintsTableBody');
    if (!tbody) return;
    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="11" style="text-align:center;color:#666;">No complaints found.</td></tr>`;
    } else {
      tbody.innerHTML = list.map(tableRow).join('');
    }
    attachRowHandlers();
  }

  function attachRowHandlers() {
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

          const lastUpdatedCell = row.querySelector('td[data-label="Last Updated"]');
          if (lastUpdatedCell) lastUpdatedCell.textContent = formatTimestamp(updated.updatedAt);

          showToast(`
            <div class="body"><strong>Updated:</strong> ${updated.id}<br/>Status: <code>${updated.status}</code></div>
            <button class="close-btn" type="button" aria-label="Close">×</button>
          `, { duration: 3000 });
        } catch (err) {
          showToast(`
            <div class="body"><strong>Update failed:</strong> ${err?.message || 'Unknown error'}</div>
            <button class="close-btn" type="button" aria-label="Close">×</button>
          `, { duration: 3500 });
        } finally {
          this.disabled = false;
          this.textContent = originalText;
        }
      };
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.onclick = async function() {
        const row = this.closest('tr');
        const id = row.dataset.id;

        this.disabled = true;
        const originalText = this.textContent;
        this.textContent = 'Deleting...';

        try {
          await api.deleteComplaint(id);
          visibleComplaints = visibleComplaints.filter(c => c.id !== id);
          allComplaints = allComplaints.filter(c => c.id !== id);
          renderRows(visibleComplaints);

          showToast(`
            <div class="body"><strong>Deleted:</strong> ${id}</div>
            <button class="close-btn" type="button" aria-label="Close">×</button>
          `, { duration: 3000 });
        } catch (err) {
          showToast(`
            <div class="body"><strong>Delete failed:</strong> ${err?.message || 'Unknown error'}</div>
            <button class="close-btn" type="button" aria-label="Close">×</button>
          `, { duration: 3500 });

          this.disabled = false;
          this.textContent = originalText;
        }
      };
    });
  }

  renderRows(visibleComplaints);

  document.getElementById("logoutBtn").onclick = async () => {
    setToken(null);
    const { loadHomePage } = await import('./home.js');
    loadHomePage();
  };

  const searchInput = document.getElementById('searchMaxNumber');
  const clearBtn = document.getElementById('searchClearBtn');

  const applyFilter = () => {
    const q = (searchInput.value || '').trim();
    if (!q) {
      visibleComplaints = allComplaints;
    } else {
      const qDigits = q.replace(/\D/g, '');
      visibleComplaints = allComplaints.filter(c => String(c.maxNumber).includes(qDigits));
    }
    renderRows(visibleComplaints);
  };

  searchInput.addEventListener('input', applyFilter);
  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    applyFilter();
    searchInput.focus();
  });

  document.getElementById("downloadPdfBtn").onclick = async () => {
    try {
      if (!visibleComplaints.length) {
        showToast(`<div class="body">No complaints to download.</div><button class="close-btn" type="button">×</button>`, { duration: 2500 });
        return;
      }
      downloadComplaintsPdf(visibleComplaints);
    } catch {
      showToast(`<div class="body"><strong>Download failed</strong></div><button class="close-btn" type="button">×</button>`, { duration: 3000 });
    }
  };
}