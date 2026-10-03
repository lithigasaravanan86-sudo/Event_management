/**
 * College Event Management System (CEMS)
 * Student Dashboard & Registration History Controller
 */

let studentUser = null;
let studentRegistrations = [];

// Initialize Student Dashboard
async function initStudentDashboard() {
  try {
    const authRes = await fetch("/api/auth/me");
    const authData = await authRes.json();

    if (!authData.authenticated || authData.role !== "student") {
      showToast("Please sign in as a student to access your portal", "warning");
      setTimeout(() => {
        window.location.href = "/login";
      }, 700);
      return;
    }

    studentUser = authData.user;
    renderStudentProfile();
    await loadStudentRegistrations();
  } catch (err) {
    console.error("Dashboard initialization failed:", err);
  }
}

// Render Student Profile Headers
function renderStudentProfile() {
  const nameEl = document.getElementById("studentGreetingName");
  const metaEl = document.getElementById("studentProfileMeta");

  if (nameEl) nameEl.textContent = studentUser.full_name;
  if (metaEl) {
    metaEl.innerHTML = `
      <span>🎓 Roll No: <strong>${studentUser.roll_number}</strong></span> • 
      <span>🏛️ <strong>${studentUser.department}</strong> (${studentUser.year})</span> • 
      <span>✉️ ${studentUser.email}</span>
    `;
  }
}

// Load Registration History
async function loadStudentRegistrations() {
  const tableBody = document.getElementById("studentRegistrationsBody");
  if (!tableBody) return;

  try {
    const res = await fetch("/api/student/registrations");
    const data = await res.json();

    if (data.success) {
      studentRegistrations = data.registrations;
      updateStudentMetrics();
      renderRegistrationsTable(studentRegistrations);
    } else {
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--danger); padding: 2rem;">Failed to load registrations.</td></tr>`;
    }
  } catch (err) {
    console.error("Error loading student registrations:", err);
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--danger); padding: 2rem;">Server communication error.</td></tr>`;
  }
}

// Update KPI Metric Cards
function updateStudentMetrics() {
  const total = studentRegistrations.length;
  const confirmed = studentRegistrations.filter(r => r.status === "Confirmed").length;
  const cancelled = studentRegistrations.filter(r => r.status === "Cancelled").length;

  const totalEl = document.getElementById("statTotalRegs");
  const confirmedEl = document.getElementById("statConfirmedRegs");
  const cancelledEl = document.getElementById("statCancelledRegs");

  if (totalEl) totalEl.textContent = total;
  if (confirmedEl) confirmedEl.textContent = confirmed;
  if (cancelledEl) cancelledEl.textContent = cancelled;
}

// Render Table of Registrations
function renderRegistrationsTable(registrations) {
  const tableBody = document.getElementById("studentRegistrationsBody");
  if (!tableBody) return;

  if (registrations.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 3rem 1rem;">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🎟️</div>
          <h4 style="color: var(--text-primary);">You haven't registered for any events yet</h4>
          <p style="color: var(--text-muted); margin-top: 0.25rem;">Explore our vibrant upcoming campus events and secure your spot!</p>
          <a href="/events" class="btn btn-sm btn-primary" style="margin-top: 1rem;">Browse Events</a>
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = registrations.map(reg => {
    const ev = reg.event || {};
    const badgeClass = getCategoryBadgeClass(ev.category);
    const isConfirmed = reg.status === "Confirmed";

    return `
      <tr>
        <td>
          <div style="font-weight: 700; color: var(--text-primary);">${ev.title || "Unknown Event"}</div>
          <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.2rem;">
            Ticket Ref: <code style="color: var(--primary); font-weight: 700;">${reg.ticket_code}</code>
          </div>
        </td>
        <td>
          <span class="event-category-badge ${badgeClass}" style="position: static; font-size: 0.7rem; padding: 0.2rem 0.6rem;">
            ${ev.category || "General"}
          </span>
        </td>
        <td>
          <div>📅 ${ev.event_date_formatted || ev.event_date}</div>
          <div style="font-size: 0.78rem; color: var(--text-muted);">📍 ${ev.venue}</div>
        </td>
        <td>
          <div style="font-size: 0.85rem;">${reg.registration_date_formatted || reg.registration_date}</div>
        </td>
        <td>
          <span class="badge-status ${reg.status.toLowerCase()}">
            ● ${reg.status}
          </span>
        </td>
        <td style="text-align: right; white-space: nowrap;">
          <button class="btn btn-sm btn-outline-primary" onclick="viewDigitalPass(${reg.registration_id})" title="View Printable Pass">
            🎫 View Pass
          </button>
          ${isConfirmed ? `
            <button class="btn btn-sm btn-danger" onclick="promptCancelRegistration(${reg.registration_id}, '${ev.title ? ev.title.replace(/'/g, "\\'") : "Event"}')" title="Cancel Registration" style="margin-left: 0.35rem;">
              Cancel
            </button>
          ` : `
            <span style="font-size: 0.75rem; color: var(--text-muted); margin-left: 0.5rem;">Released</span>
          `}
        </td>
      </tr>
    `;
  }).join("");
}

// View Digital Event Pass
function viewDigitalPass(regId) {
  const reg = studentRegistrations.find(r => r.registration_id === regId);
  if (!reg || !reg.event) return;

  const ev = reg.event;
  const passContainer = document.getElementById("digitalPassContainer");

  passContainer.innerHTML = `
    <div class="ticket-wrapper">
      <div class="ticket-header">
        <span class="ticket-badge">${ev.category} Event Pass</span>
        <h2 class="ticket-event-name">${ev.title}</h2>
      </div>
      <div class="ticket-body">
        <div class="ticket-grid">
          <div>
            <div class="ticket-field-label">Student Name</div>
            <div class="ticket-field-value">${studentUser.full_name}</div>
          </div>
          <div>
            <div class="ticket-field-label">Roll Number</div>
            <div class="ticket-field-value">${studentUser.roll_number}</div>
          </div>
          <div>
            <div class="ticket-field-label">Department</div>
            <div class="ticket-field-value">${studentUser.department}</div>
          </div>
          <div>
            <div class="ticket-field-label">Date & Time</div>
            <div class="ticket-field-value">${ev.event_date_formatted}<br><span style="font-size: 0.8rem; font-weight: normal;">${ev.event_time}</span></div>
          </div>
          <div style="grid-column: 1/-1;">
            <div class="ticket-field-label">Venue</div>
            <div class="ticket-field-value">📍 ${ev.venue}</div>
          </div>
        </div>

        <div class="ticket-code-box">
          <div class="ticket-field-label" style="margin-bottom: 0.25rem;">E-Ticket Reference Code</div>
          <div class="ticket-code-str">${reg.ticket_code}</div>
          <div style="font-size: 0.7rem; color: #a5b4fc; margin-top: 0.4rem;">Present this pass at entry desk for attendance scanning</div>
        </div>
      </div>
    </div>
  `;

  openModal("ticketModal");
}

// Print Digital Pass Utility
function printTicketPass() {
  window.print();
}

// Prompt Cancel Registration
let pendingCancelId = null;
function promptCancelRegistration(regId, eventTitle) {
  pendingCancelId = regId;
  const modalText = document.getElementById("cancelConfirmText");
  if (modalText) {
    modalText.innerHTML = `Are you sure you want to cancel your registration for <strong>${eventTitle}</strong>? Your seat will be made available to other students.`;
  }
  openModal("cancelConfirmModal");
}

// Execute Cancel Registration
async function executeCancelRegistration() {
  if (!pendingCancelId) return;

  const confirmBtn = document.getElementById("confirmCancelBtn");
  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.textContent = "Cancelling...";
  }

  try {
    const res = await fetch(`/api/student/registrations/${pendingCancelId}/cancel`, {
      method: "POST"
    });
    const data = await res.json();

    if (data.success) {
      showToast(data.message || "Registration cancelled successfully", "success");
      closeModal("cancelConfirmModal");
      await loadStudentRegistrations();
    } else {
      showToast(data.message || "Failed to cancel registration", "error");
    }
  } catch (err) {
    console.error("Cancellation error:", err);
    showToast("Error processing cancellation", "error");
  } finally {
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.textContent = "Yes, Cancel Registration";
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initStudentDashboard();
});
