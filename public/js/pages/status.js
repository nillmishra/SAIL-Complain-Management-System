import { api } from '../api.js';
import { addGoBackButton } from '../utils/dom.js';
import { formatTimestamp } from '../utils/format.js';

export function loadCheckStatus() {
  const content = document.getElementById("content");
  content.innerHTML = `
    <h2>Check Complaint Status</h2>
    <form id="statusForm">
      <label for="complaintId">Enter Complaint ID:</label>
      <input type="text" id="complaintId" name="complaintId" required />
      <button type="submit" class="submit-btn">Check Status</button>
    </form>
    <div id="statusResult" style="margin-top:20px;"></div>
  `;

  addGoBackButton();

  const form = document.getElementById("statusForm");
  const statusResult = document.getElementById("statusResult");

  form.onsubmit = async (e) => {
    e.preventDefault();
    const complaintId = document.getElementById("complaintId").value.trim();
    try {
      const c = await api.getComplaintById(complaintId);
      statusResult.style.color = "black";
      statusResult.innerHTML = `
        <p><strong>Complaint ID:</strong> ${c.id}</p>
        <p><strong>Max Number:</strong> ${c.maxNumber}</p>
        <p><strong>Department:</strong> ${c.department}</p>
        <p><strong>Issue Type:</strong> ${c.issueType}</p>
        <p><strong>Complaint Details:</strong> ${c.complaintText}</p>
        <p><strong>Location:</strong> ${c.location}</p>
        <p><strong>Contact Number:</strong> ${c.contactNumber}</p>
        <p><strong>Status:</strong> ${c.status}</p>
        <p><strong>Progress:</strong> ${c.progressText || ""}</p>
        <p><strong>Last Updated:</strong> ${formatTimestamp(c.updatedAt)}</p>
      `;
    } catch (err) {
      statusResult.style.color = "red";
      statusResult.textContent = "Complaint not found. Please check your Complaint ID.";
    }
  };
}