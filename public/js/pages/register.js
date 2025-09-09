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

      <label for="issueType">Select Issue Type:</label>
      <select id="issueType" name="issueType" required>
        <option value="" disabled selected>Select issue type</option>
        ${issueTypes.map(type => `<option value="${type}">${type}</option>`).join('')}
      </select>
      <div id="issueTypeError" class="error"></div>

      <label for="complaintText">Complaint Details:</label>
      <textarea id="complaintText" name="complaintText" required></textarea>
      <div id="complaintTextError" class="error"></div>

      <label for="location">Enter Location:</label>
      <input type="text" id="location" name="location" required />
      <div id="locationError" class="error"></div>

      <label for="contactNumber">Contact Number (10 digits):</label>
      <input type="tel" id="contactNumber" name="contactNumber" maxlength="10" required pattern="\\d{10}" />
      <div id="contactNumberError" class="error"></div>

      <button type="submit" class="submit-btn">Submit Complaint</button>
    </form>
    <div id="formMessage" style="margin-top:15px;"></div>
  `;

  addGoBackButton();

  const form = document.getElementById("complaintForm");
  const msg = id => document.getElementById(id);

  const clearErrors = () => {
    ["maxNumberError","departmentError","issueTypeError","complaintTextError","locationError","contactNumberError"].forEach(e => msg(e).textContent = "");
    msg("formMessage").textContent = "";
  };

  form.addEventListener('input', clearErrors);

  form.onsubmit = async (e) => {
    e.preventDefault();
    clearErrors();

    const maxNumber = msg("maxNumber").value.trim();
    const department = msg("department").value;
    const issueType = msg("issueType").value;
    const complaintText = msg("complaintText").value.trim();
    const location = msg("location").value.trim();
    const contactNumber = msg("contactNumber").value.trim();

    let valid = true;
    if (!/^[78]\d{4}$/.test(maxNumber)) { msg("maxNumberError").textContent = "Invalid Max Number! Must start with 7/8 and be exactly 5 digits."; valid = false; }
    if (!department) { msg("departmentError").textContent = "Please select a department."; valid = false; }
    if (!issueType) { msg("issueTypeError").textContent = "Please select an issue type."; valid = false; }
    if (!complaintText) { msg("complaintTextError").textContent = "Please enter complaint details."; valid = false; }
    if (!location) { msg("locationError").textContent = "Please enter location."; valid = false; }
    if (!/^\d{10}$/.test(contactNumber)) { msg("contactNumberError").textContent = "Contact number must be exactly 10 digits."; valid = false; }

    if (!valid) {
      msg("formMessage").style.color = "red";
      msg("formMessage").textContent = "Invalid registration! Please fill all details properly.";
      return;
    }

    const complaintId = generateComplaintID(maxNumber, department);
    try {
      await api.createComplaint({ id: complaintId, maxNumber, department, issueType, complaintText, location, contactNumber });

      // Reset form and show toast popup with copy button (no alert, no redirect)
      form.reset();
      showComplaintRegistered(complaintId);

      // Optional: focus first input again
      msg("maxNumber").focus();
    } catch (err) {
      console.error(err);
      if (String(err.message).toLowerCase().includes('exists')) {
        msg("formMessage").style.color = "red";
        msg("formMessage").textContent = "A complaint with this ID already exists. Please submit again in a minute or change department.";
      } else {
        msg("formMessage").style.color = "red";
        msg("formMessage").textContent = "Error registering complaint. Please try again.";
      }
    }
  };
}