/**
 * College Event Management System (CEMS)
 * Admin Panel & Management Controller
 */

let adminUser = null;
let adminEvents = [];
let adminRegistrations = [];
let editingEventId = null;
let deletingEventId = null;

// Initialize Admin Dashboard
async function initAdminDashboard() {
  try {
    const authRes = await fetch("/api/auth/me");
    const authData = await authRes.json();

    if (!authData.authenticated || authData.role !== "admin") {
      showToast("Access restricted. Please sign in with Admin credentials.", "warning");
      setTimeout(() => {
        window.location.href = "/login?tab=admin";
      }, 700);
      return;
    }

    adminUser = authData.user;
    const nameEl = document.getElementById("adminGreetingName");
    if (nameEl) nameEl.textContent = adminUser.full_name || adminUser.username;

    // Load initial data
    await loadAdminStats();
    await loadAdminEvents();
    await loadAdminRegistrations();
  } catch (err) {
    console.error("Admin dashboard initialization failed:", err);
  }
}

// Switch Admin Tabs
function switchAdminTab(tabKey) {
  document.querySelectorAll(".dash-tab").forEach(tab => {
    tab.classList.toggle("active", tab.dataset.tab === tabKey);
  });

  document.getElementById("tabManageEvents").style.display = tabKey === "events" ? "block" : "none";
  document.getElementById("tabRegistrations").style.display = tabKey === "registrations" ? "block" : "none";
  document.getElementById("tabAnalytics").style.display = tabKey === "analytics" ? "block" : "none";
}

// Load KPI Stats
async function loadAdminStats() {
  try {
    const res = await fetch("/api/admin/stats");
    const data = await res.json();

    if (data.success) {
      const stats = data.stats;
      document.getElementById("statTotalEvents").textContent = stats.total_events;
      document.getElementById("statTotalRegistrations").textContent = stats.total_registrations;
      document.getElementById("statActiveEvents").textContent = stats.active_events;
      document.getElementById("statTotalStudents").textContent = stats.total_students;

      renderCategoryAnalytics(stats.category_breakdown, stats.total_registrations);
    }
  } catch (err) {
    console.error("Failed to load admin stats:", err);
  }
}

// Render Analytics Tab
function renderCategoryAnalytics(categories, totalRegs) {
  const container = document.getElementById("categoryAnalyticsContainer");
  if (!container || !categories) return;

  const total = totalRegs || 1;
  const entries = Object.entries(categories);

  container.innerHTML = entries.map(([category, count]) => {
    const pct = Math.round((count / total) * 100);
    const badgeClass = getCategoryBadgeClass(category);
    return `
      <div style="margin-bottom: 1.25rem;">
        <div style="display: flex; justify-content: space-between; font-weight: 600; font-size: 0.9rem; margin-bottom: 0.35rem;">
          <span style="display: flex; align-items: center; gap: 0.5rem;">
            <span class="event-category-badge ${badgeClass}" style="position: static; font-size: 0.7rem; padding: 0.2rem 0.5rem;">${category}</span>
          </span>
          <span>${count} Registrations (${pct}%)</span>
        </div>
        <div class="progress-track" style="height: 10px;">
          <div class="progress-fill" style="width: ${pct}%;"></div>
        </div>
      </div>
    `;
  }).join("");
}

// Load Events for Table
async function loadAdminEvents() {
  const tableBody = document.getElementById("adminEventsTableBody");
  if (!tableBody) return;

  try {
    const res = await fetch("/api/events");
    const data = await res.json();

    if (data.success) {
      adminEvents = data.events;
      renderAdminEventsTable(adminEvents);
      populateEventFilterDropdown(adminEvents);
    } else {
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--danger);">Failed to load events</td></tr>`;
    }
  } catch (err) {
    console.error("Error loading admin events:", err);
  }
}

// Render Admin Events Table
function renderAdminEventsTable(events) {
  const tableBody = document.getElementById("adminEventsTableBody");
  if (!tableBody) return;

  if (events.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2rem;">No events found. Click "+ Add New Event" above to create one.</td></tr>`;
    return;
  }

  tableBody.innerHTML = events.map(ev => {
    const badgeClass = getCategoryBadgeClass(ev.category);
    return `
      <tr>
        <td><strong>#${ev.event_id}</strong></td>
        <td>
          <div style="font-weight: 700; color: var(--text-primary);">${ev.title}</div>
          <div style="font-size: 0.78rem; color: var(--text-muted);">Organized by: ${ev.organizer}</div>
        </td>
        <td>
          <span class="event-category-badge ${badgeClass}" style="position: static; font-size: 0.72rem; padding: 0.2rem 0.6rem;">
            ${ev.category}
          </span>
        </td>
        <td>
          <div>📅 ${ev.event_date_formatted}</div>
          <div style="font-size: 0.78rem; color: var(--text-muted);">📍 ${ev.venue}</div>
        </td>
        <td>
          <span style="font-weight: 700;">${ev.confirmed_count}</span> / ${ev.max_participants}
          <div style="font-size: 0.75rem; color: var(--text-muted);">${ev.seats_left} seats left</div>
        </td>
        <td>
          <span class="badge-status ${ev.status.toLowerCase()}">${ev.status}</span>
        </td>
        <td style="text-align: right; white-space: nowrap;">
          <button class="btn btn-sm btn-outline-primary" onclick="openEditEventModal(${ev.event_id})" title="Edit Event Details">
            ✏️ Edit
          </button>
          <button class="btn btn-sm btn-danger" onclick="promptDeleteEvent(${ev.event_id}, '${ev.title.replace(/'/g, "\\'")}')" title="Delete Event" style="margin-left: 0.35rem;">
            🗑️ Delete
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

// Load Registered Students for Admin
async function loadAdminRegistrations(eventId = "") {
  const tableBody = document.getElementById("adminRegistrationsTableBody");
  if (!tableBody) return;

  try {
    let url = "/api/admin/registrations";
    if (eventId) url += `?event_id=${encodeURIComponent(eventId)}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.success) {
      adminRegistrations = data.registrations;
      renderAdminRegistrationsTable(adminRegistrations);
    } else {
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--danger);">Failed to load registrations</td></tr>`;
    }
  } catch (err) {
    console.error("Error loading admin registrations:", err);
  }
}

// Render Admin Registrations Table
function renderAdminRegistrationsTable(registrations) {
  const tableBody = document.getElementById("adminRegistrationsTableBody");
  if (!tableBody) return;

  if (registrations.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2rem;">No student registrations found for this selection.</td></tr>`;
    return;
  }

  tableBody.innerHTML = registrations.map(reg => {
    const ev = reg.event || {};
    const st = reg.student || {};

    return `
      <tr>
        <td>
          <code style="font-weight: 700; color: var(--primary);">${reg.ticket_code}</code>
        </td>
        <td>
          <div style="font-weight: 700;">${st.full_name || "N/A"}</div>
          <div style="font-size: 0.78rem; color: var(--text-muted);">${st.email || "N/A"}</div>
        </td>
        <td>
          <span style="font-weight: 600; color: var(--text-primary);">${st.roll_number || "N/A"}</span>
        </td>
        <td>
          <div>${st.department || "N/A"}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${st.year || ""}</div>
        </td>
        <td>
          <div style="font-weight: 600;">${ev.title || "N/A"}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${ev.category || ""} • ${ev.event_date_formatted || ""}</div>
        </td>
        <td>
          <span class="badge-status ${reg.status.toLowerCase()}">${reg.status}</span>
        </td>
        <td style="font-size: 0.82rem; color: var(--text-muted);">
          ${reg.registration_date_formatted || reg.registration_date}
        </td>
      </tr>
    `;
  }).join("");
}

// Populate Event Filter Dropdown
function populateEventFilterDropdown(events) {
  const dropdown = document.getElementById("adminEventFilterSelect");
  if (!dropdown) return;

  dropdown.innerHTML = `<option value="">-- All Events (${events.length}) --</option>` +
    events.map(ev => `<option value="${ev.event_id}">${ev.title} (#${ev.event_id})</option>`).join("");
}

// Add/Edit Event Modal Handlers
function openAddEventModal() {
  editingEventId = null;
  document.getElementById("eventModalHeaderTitle").textContent = "Add New College Event";
  document.getElementById("eventForm").reset();

  // Set default dates
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("evDate").value = today;
  document.getElementById("evDeadline").value = today;
  document.getElementById("evStatus").value = "Upcoming";

  openModal("eventFormModal");
}

function openEditEventModal(eventId) {
  const ev = adminEvents.find(e => e.event_id === eventId);
  if (!ev) return;

  editingEventId = eventId;
  document.getElementById("eventModalHeaderTitle").textContent = `Edit Event #${eventId}`;

  document.getElementById("evTitle").value = ev.title;
  document.getElementById("evCategory").value = ev.category;
  document.getElementById("evDescription").value = ev.description;
  document.getElementById("evDate").value = ev.event_date;
  document.getElementById("evTime").value = ev.event_time;
  document.getElementById("evVenue").value = ev.venue;
  document.getElementById("evOrganizer").value = ev.organizer;
  document.getElementById("evMaxParticipants").value = ev.max_participants;
  document.getElementById("evDeadline").value = ev.registration_deadline;
  document.getElementById("evBannerUrl").value = ev.banner_url || "";
  document.getElementById("evStatus").value = ev.status;

  openModal("eventFormModal");
}

// Save Event (Create or Update)
async function handleSaveEvent(e) {
  e.preventDefault();
  const title = document.getElementById("evTitle").value.trim();
  const category = document.getElementById("evCategory").value;
  const description = document.getElementById("evDescription").value.trim();
  const event_date = document.getElementById("evDate").value;
  const event_time = document.getElementById("evTime").value.trim();
  const venue = document.getElementById("evVenue").value.trim();
  const organizer = document.getElementById("evOrganizer").value.trim();
  const max_participants = parseInt(document.getElementById("evMaxParticipants").value, 10);
  const registration_deadline = document.getElementById("evDeadline").value;
  const banner_url = document.getElementById("evBannerUrl").value.trim();
  const status = document.getElementById("evStatus").value;

  if (new Date(registration_deadline) > new Date(event_date)) {
    showToast("Registration deadline cannot be after the event date!", "warning");
    return;
  }

  const payload = {
    title,
    category,
    description,
    event_date,
    event_time,
    venue,
    organizer,
    max_participants,
    registration_deadline,
    banner_url,
    status
  };

  const submitBtn = e.target.querySelector("button[type='submit']");
  submitBtn.disabled = true;
  submitBtn.textContent = "Saving...";

  try {
    const isEdit = !!editingEventId;
    const url = isEdit ? `/api/admin/events/${editingEventId}` : "/api/admin/events";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.success) {
      showToast(data.message || "Event saved successfully!", "success");
      closeModal("eventFormModal");
      await loadAdminEvents();
      await loadAdminStats();
    } else {
      showToast(data.message || "Failed to save event", "error");
    }
  } catch (err) {
    console.error("Save event error:", err);
    showToast("Error communicating with server", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Save Event";
  }
}

// Delete Event Handlers
function promptDeleteEvent(eventId, title) {
  deletingEventId = eventId;
  document.getElementById("deleteEventTitle").textContent = title;
  openModal("deleteEventModal");
}

async function executeDeleteEvent() {
  if (!deletingEventId) return;

  const btn = document.getElementById("confirmDeleteEventBtn");
  btn.disabled = true;
  btn.textContent = "Deleting...";

  try {
    const res = await fetch(`/api/admin/events/${deletingEventId}`, {
      method: "DELETE"
    });
    const data = await res.json();

    if (data.success) {
      showToast(data.message || "Event deleted", "success");
      closeModal("deleteEventModal");
      await loadAdminEvents();
      await loadAdminStats();
      await loadAdminRegistrations();
    } else {
      showToast(data.message || "Failed to delete event", "error");
    }
  } catch (err) {
    console.error("Delete event error:", err);
    showToast("Server error deleting event", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Yes, Delete Event";
  }
}

// Trigger CSV Export
function exportRegistrationsCSV() {
  const filterSelect = document.getElementById("adminEventFilterSelect");
  const eventId = filterSelect ? filterSelect.value : "";
  let url = "/api/admin/export-registrations";
  if (eventId) url += `?event_id=${encodeURIComponent(eventId)}`;

  showToast("Downloading registrations CSV report...", "info");
  window.location.href = url;
}

// Filter Registrations by Event
function onFilterEventChanged() {
  const filterSelect = document.getElementById("adminEventFilterSelect");
  const eventId = filterSelect ? filterSelect.value : "";
  loadAdminRegistrations(eventId);
}

// Live Search in Admin Events
function filterAdminEventsLive(query) {
  const q = query.toLowerCase();
  const filtered = adminEvents.filter(ev =>
    ev.title.toLowerCase().includes(q) ||
    ev.venue.toLowerCase().includes(q) ||
    ev.organizer.toLowerCase().includes(q) ||
    ev.category.toLowerCase().includes(q)
  );
  renderAdminEventsTable(filtered);
}

// Live Search in Admin Registrations
function filterAdminRegistrationsLive(query) {
  const q = query.toLowerCase();
  const filtered = adminRegistrations.filter(reg => {
    const st = reg.student || {};
    const ev = reg.event || {};
    return (
      (st.full_name && st.full_name.toLowerCase().includes(q)) ||
      (st.roll_number && st.roll_number.toLowerCase().includes(q)) ||
      (st.email && st.email.toLowerCase().includes(q)) ||
      (reg.ticket_code && reg.ticket_code.toLowerCase().includes(q)) ||
      (ev.title && ev.title.toLowerCase().includes(q))
    );
  });
  renderAdminRegistrationsTable(filtered);
}

document.addEventListener("DOMContentLoaded", () => {
  initAdminDashboard();

  const eventForm = document.getElementById("eventForm");
  if (eventForm) eventForm.addEventListener("submit", handleSaveEvent);

  const eventSearch = document.getElementById("adminEventSearch");
  if (eventSearch) {
    eventSearch.addEventListener("input", (e) => filterAdminEventsLive(e.target.value));
  }

  const regSearch = document.getElementById("adminRegSearch");
  if (regSearch) {
    regSearch.addEventListener("input", (e) => filterAdminRegistrationsLive(e.target.value));
  }
});
