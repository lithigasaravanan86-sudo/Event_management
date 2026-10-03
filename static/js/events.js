/**
 * College Event Management System (CEMS)
 * Events Catalogue & Details Logic
 */

let allEvents = [];
let currentCategory = "all";
let searchDebounceTimeout = null;
let selectedEventForModal = null;

// Fetch events from server
async function loadEvents(category = "all", searchQuery = "") {
  const container = document.getElementById("eventsContainer");
  if (!container) return;

  container.innerHTML = `
    <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
      <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">⏳ Loading events...</div>
      <p style="color: var(--text-muted);">Fetching the latest campus happenings</p>
    </div>
  `;

  try {
    let url = `/api/events?category=${encodeURIComponent(category)}`;
    if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.success) {
      allEvents = data.events;
      renderEventsGrid(allEvents);
    } else {
      container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--danger);">Failed to load events.</div>`;
    }
  } catch (err) {
    console.error("Error fetching events:", err);
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--danger);">Error connecting to event service.</div>`;
  }
}

// Render Event Cards
function renderEventsGrid(events) {
  const container = document.getElementById("eventsContainer");
  if (!container) return;

  if (events.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem; background: white; border-radius: var(--radius-lg); border: 1px dashed var(--border-color);">
        <div style="font-size: 3rem; margin-bottom: 1rem;">📅</div>
        <h3>No Events Found</h3>
        <p style="color: var(--text-muted); margin-top: 0.5rem;">Try choosing another category or clearing your search filter.</p>
        <button onclick="resetFilters()" class="btn btn-sm btn-outline-primary" style="margin-top: 1rem;">View All Events</button>
      </div>
    `;
    return;
  }

  container.innerHTML = events.map(event => {
    const badgeClass = getCategoryBadgeClass(event.category);
    const fillPercent = Math.min(100, Math.max(0, event.fill_percentage));
    let progressColorClass = "";
    if (fillPercent > 85) progressColorClass = "near-full";
    if (fillPercent >= 100) progressColorClass = "full";

    // Action button state
    let actionBtn = "";
    if (event.is_user_registered) {
      actionBtn = `
        <button class="btn btn-sm btn-success" onclick="openEventDetailsModal(${event.event_id})">
          ✓ Registered
        </button>
      `;
    } else if (event.is_full) {
      actionBtn = `
        <button class="btn btn-sm btn-secondary" disabled>
          Full
        </button>
      `;
    } else if (event.deadline_passed) {
      actionBtn = `
        <button class="btn btn-sm btn-secondary" disabled>
          Closed
        </button>
      `;
    } else {
      actionBtn = `
        <button class="btn btn-sm btn-primary" onclick="handleQuickRegister(${event.event_id}, event)">
          Register Now
        </button>
      `;
    }

    return `
      <div class="event-card">
        <div class="event-image-wrap">
          <img src="${event.banner_url}" alt="${event.title}" class="event-image" loading="lazy" />
          <span class="event-category-badge ${badgeClass}">${event.category}</span>
          <span class="event-status-badge">${event.status}</span>
        </div>
        <div class="event-card-body">
          <div class="event-meta-chips">
            <span class="event-meta-chip">📅 ${event.event_date_formatted}</span>
            <span class="event-meta-chip">⏰ ${event.event_time}</span>
          </div>
          <h3 class="event-card-title">${event.title}</h3>
          <p class="event-card-desc">${event.description}</p>
          <div style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 0.85rem;">
            📍 <strong>Venue:</strong> ${event.venue}
          </div>

          <div class="capacity-box">
            <div class="capacity-header">
              <span>Seats: ${event.confirmed_count} / ${event.max_participants}</span>
              <span>${event.seats_left} spots left</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill ${progressColorClass}" style="width: ${fillPercent}%"></div>
            </div>
          </div>

          <div class="event-card-footer">
            <button class="btn btn-sm btn-ghost" onclick="openEventDetailsModal(${event.event_id})">
              Details →
            </button>
            ${actionBtn}
          </div>
        </div>
      </div>
    `;
  }).join("");
}

// Open Event Details Modal
async function openEventDetailsModal(eventId) {
  try {
    const res = await fetch(`/api/events/${eventId}`);
    const data = await res.json();
    if (!data.success) {
      showToast("Could not retrieve event details", "error");
      return;
    }

    const event = data.event;
    selectedEventForModal = event;

    const modalBody = document.getElementById("eventModalBody");
    const modalFooter = document.getElementById("eventModalFooter");
    const badgeClass = getCategoryBadgeClass(event.category);

    modalBody.innerHTML = `
      <div style="margin-bottom: 1.25rem; border-radius: var(--radius-lg); overflow: hidden; max-height: 220px;">
        <img src="${event.banner_url}" alt="${event.title}" style="width: 100%; height: 100%; object-fit: cover;" />
      </div>
      <div style="display: flex; gap: 0.5rem; margin-bottom: 0.85rem;">
        <span class="event-category-badge ${badgeClass}" style="position: static;">${event.category}</span>
        <span class="badge-status ${event.status.toLowerCase()}">${event.status}</span>
      </div>
      <h2 style="font-size: 1.45rem; margin-bottom: 0.75rem;">${event.title}</h2>
      <p style="color: var(--text-secondary); line-height: 1.7; margin-bottom: 1.5rem;">${event.description}</p>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; background: var(--bg-alt); padding: 1.25rem; border-radius: var(--radius-md); font-size: 0.88rem; margin-bottom: 1.25rem;">
        <div><strong>📅 Date:</strong> ${event.event_date_formatted}</div>
        <div><strong>⏰ Time:</strong> ${event.event_time}</div>
        <div><strong>📍 Venue:</strong> ${event.venue}</div>
        <div><strong>🏛️ Organizer:</strong> ${event.organizer}</div>
        <div><strong>👥 Max Capacity:</strong> ${event.max_participants} Participants</div>
        <div><strong>⏳ Reg. Deadline:</strong> ${event.registration_deadline_formatted}</div>
      </div>

      <div style="background: white; border: 1px solid var(--border-color); padding: 1rem; border-radius: var(--radius-md);">
        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.5rem;">
          <span>Registration Status:</span>
          <span>${event.confirmed_count} Registered (${event.seats_left} Available)</span>
        </div>
        <div class="progress-track" style="height: 8px;">
          <div class="progress-fill" style="width: ${event.fill_percentage}%;"></div>
        </div>
      </div>

      ${event.is_user_registered ? `
        <div style="margin-top: 1.25rem; padding: 1rem; background: var(--success-bg); border-radius: var(--radius-md); border: 1px solid #a7f3d0; text-align: center;">
          <span style="color: #065f46; font-weight: 700;">✓ You are registered for this event!</span>
          <div style="font-size: 0.85rem; color: #047857; margin-top: 0.35rem;">Ticket Ref: <code>${event.user_ticket_code}</code></div>
        </div>
      ` : ""}
    `;

    // Footer actions
    if (event.is_user_registered) {
      modalFooter.innerHTML = `
        <button class="btn btn-secondary" onclick="closeModal('eventDetailsModal')">Close</button>
        <a href="/student-dashboard" class="btn btn-primary">Go to My Passes</a>
      `;
    } else if (event.is_full) {
      modalFooter.innerHTML = `
        <button class="btn btn-secondary" onclick="closeModal('eventDetailsModal')">Close</button>
        <button class="btn btn-secondary" disabled>Event Full</button>
      `;
    } else if (event.deadline_passed) {
      modalFooter.innerHTML = `
        <button class="btn btn-secondary" onclick="closeModal('eventDetailsModal')">Close</button>
        <button class="btn btn-secondary" disabled>Deadline Passed</button>
      `;
    } else {
      modalFooter.innerHTML = `
        <button class="btn btn-secondary" onclick="closeModal('eventDetailsModal')">Close</button>
        <button class="btn btn-primary" onclick="confirmRegister(${event.event_id})">
          Confirm Registration Now
        </button>
      `;
    }

    openModal("eventDetailsModal");
  } catch (err) {
    console.error("Error opening modal:", err);
  }
}

// Quick Register button click
async function handleQuickRegister(eventId, evt) {
  if (evt) evt.stopPropagation();
  confirmRegister(eventId);
}

// Execute registration API call
async function confirmRegister(eventId) {
  try {
    const authRes = await fetch("/api/auth/me");
    const authData = await authRes.json();

    if (!authData.authenticated) {
      showToast("Please sign in as a student to register", "warning");
      setTimeout(() => {
        window.location.href = `/login?redirect=events&eventId=${eventId}`;
      }, 1000);
      return;
    }

    if (authData.role !== "student") {
      showToast("Administrators cannot register for student events", "warning");
      return;
    }

    const regRes = await fetch(`/api/events/${eventId}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    const regData = await regRes.json();

    if (regData.success) {
      showToast(regData.message || "Registration Confirmed!", "success");
      closeModal("eventDetailsModal");
      // Reload events to update state
      loadEvents(currentCategory);
    } else {
      showToast(regData.message || "Registration failed", "error");
    }
  } catch (err) {
    console.error("Registration error:", err);
    showToast("Error processing registration", "error");
  }
}

// Reset Search & Category Filters
function resetFilters() {
  currentCategory = "all";
  document.querySelectorAll(".category-pill").forEach(p => {
    p.classList.toggle("active", p.dataset.category === "all");
  });
  const searchInput = document.getElementById("eventSearchInput");
  if (searchInput) searchInput.value = "";
  loadEvents("all", "");
}

// Setup Filters & Listeners
document.addEventListener("DOMContentLoaded", () => {
  // Category Pill Clicks
  const pills = document.querySelectorAll(".category-pill");
  pills.forEach(pill => {
    pill.addEventListener("click", () => {
      pills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      currentCategory = pill.dataset.category;
      const searchVal = document.getElementById("eventSearchInput")?.value || "";
      loadEvents(currentCategory, searchVal);
    });
  });

  // Search Input with Debounce
  const searchInput = document.getElementById("eventSearchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      clearTimeout(searchDebounceTimeout);
      const query = e.target.value.trim();
      searchDebounceTimeout = setTimeout(() => {
        loadEvents(currentCategory, query);
      }, 300);
    });
  }

  // Initial load
  loadEvents();
});
