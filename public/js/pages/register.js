import { departments, issueTypes } from '../constants.js';
import { api } from '../api.js';
import { addGoBackButton, showComplaintRegistered } from '../utils/dom.js';
import { generateComplaintID } from '../utils/format.js';

export function loadRegisterComplaint() {
  const content = document.getElementById("content");
  content.innerHTML = `
    <h2>Register Complaint</h2>
    <form id="complaintForm" novalidate>
      <label for="maxNumber">Max Number (Starts with 7 or 8, exactly 5 digits):</label>
      <input type="text" id="maxNumber" name="maxNumber" maxlength="5" required />
      <div id="maxNumberError" class="error"></div>

      <label for="department">Select Department:</label>
      <select id="department" name="department" required>
        <option value="" disabled selected>Select department</option>
        ${departments.map(dep => `<option value="${dep}">${dep}</option>`).join('')}
      </select>
      <div id="departmentError" class="error"></div>

      <label for="location">Enter Location:</label>
      <input type="text" id="location" name="location" required />
      <div id="locationError" class="error"></div>

      <label for="issueType">Select Issue Type:</label>
      <select id="issueType" name="issueType" required>
        <option value="" disabled selected>Select issue type</option>
        ${issueTypes.map(type => `<option value="${type}">${type}</option>`).join('')}
      </select>
      <div id="issueTypeError" class="error"></div>

      <label for="contactNumber">Contact Number (10 digits):</label>
      <input type="tel" id="contactNumber" name="contactNumber" maxlength="10" required pattern="\\d{10}" />
      <div id="contactNumberError" class="error"></div>

      <button type="submit" class="submit-btn">Submit Complaint</button>
    </form>
    <div id="formMessage" style="margin-top:15px;"></div>
  `;

  addGoBackButton();

  const form = document.getElementById("complaintForm");
  const get = id => document.getElementById(id);

  const clearErrors = () => {
    ["maxNumberError","departmentError","issueTypeError","locationError","contactNumberError"]
      .forEach(id => { const el = get(id); if (el) el.textContent = ""; });
    const msg = get("formMessage");
    if (msg) { msg.textContent = ""; msg.removeAttribute('style'); }
  };
  form.addEventListener('input', clearErrors);

  get("maxNumber").addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0,5); });
  get("contactNumber").addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0,10); });

  form.onsubmit = async (e) => {
    e.preventDefault();
    clearErrors();

    const maxNumber = get("maxNumber").value.trim();
    const department = get("department").value;
    const issueType = get("issueType").value;
    const location = get("location").value.trim();
    const contactNumber = get("contactNumber").value.trim();

    let valid = true;
    if (!/^[78]\d{4}$/.test(maxNumber)) { get("maxNumberError").textContent = "Invalid Max Number! Must start with 7/8 and be exactly 5 digits."; valid = false; }
    if (!department) { get("departmentError").textContent = "Please select a department."; valid = false; }
    if (!issueType) { get("issueTypeError").textContent = "Please select an issue type."; valid = false; }
    if (!location) { get("locationError").textContent = "Please enter location."; valid = false; }
    if (!/^\d{10}$/.test(contactNumber)) { get("contactNumberError").textContent = "Contact number must be exactly 10 digits."; valid = false; }

    if (!valid) {
      const msg = get("formMessage");
      msg.style.color = "red";
      msg.textContent = "Invalid registration! Please fill all details properly.";
      return;
    }

    const complaintId = generateComplaintID(maxNumber, department);
    try {
      await api.createComplaint({
        id: complaintId, maxNumber, department, issueType, location, contactNumber
      });

      form.reset();
      showComplaintRegistered(complaintId);
      get("maxNumber").focus();
    } catch (err) {
      console.error(err);
      const msg = get("formMessage");
      msg.style.color = "red";
      if (String(err.message).toLowerCase().includes('exists')) {
        msg.textContent = "A complaint with this ID already exists. Please submit again in a minute or change department.";
      } else {
        msg.textContent = "Error registering complaint. Please try again.";
      }
    }
  };
}