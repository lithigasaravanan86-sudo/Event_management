/**
 * College Event Management System (CEMS)
 * Global Utilities, Toast Notifications, and Navbar Manager
 */

// Toast Notifications System
function showToast(message, type = "info") {
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  const iconMap = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ℹ"
  };

  toast.innerHTML = `
    <span style="font-weight: bold; font-size: 1.1rem;">${iconMap[type] || "•"}</span>
    <span style="flex: 1;">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(50px)";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Global Modal Helpers
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("show");
    document.body.style.overflow = "hidden";
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("show");
    document.body.style.overflow = "";
  }
}

// Attach outside click listener for all modals
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal-backdrop")) {
    e.target.classList.remove("show");
    document.body.style.overflow = "";
  }
});

// Setup Mobile Menu Toggle
function setupMobileMenu() {
  const toggleBtn = document.querySelector(".mobile-toggle");
  const navMenu = document.querySelector(".nav-menu");
  if (toggleBtn && navMenu) {
    toggleBtn.addEventListener("click", () => {
      navMenu.classList.toggle("show");
    });
  }
}

// User Navigation & Authentication State Sync
async function syncNavAuthState() {
  try {
    const res = await fetch("/api/auth/me");
    const data = await res.json();
    const navActions = document.getElementById("navAuthActions");

    if (!navActions) return;

    if (data.authenticated && data.user) {
      const role = data.role;
      const dashboardUrl = role === "admin" ? "/admin-dashboard" : "/student-dashboard";
      const displayName = data.user.full_name || (role === "admin" ? data.user.username : data.user.roll_number);

      navActions.innerHTML = `
        <a href="${dashboardUrl}" class="user-badge" title="Go to Dashboard">
          <span>👤 ${displayName}</span>
          <span class="user-badge-role">${role}</span>
        </a>
        <button onclick="handleLogout()" class="btn btn-sm btn-secondary" title="Sign Out">
          Log Out
        </button>
      `;
    } else {
      navActions.innerHTML = `
        <a href="/login" class="btn btn-sm btn-primary">
          Sign In / Portal
        </a>
      `;
    }
  } catch (err) {
    console.error("Auth sync error:", err);
  }
}

// Global Logout Handler
async function handleLogout() {
  try {
    const res = await fetch("/api/auth/logout", { method: "POST" });
    const data = await res.json();
    if (data.success) {
      showToast("Logged out successfully", "info");
      setTimeout(() => {
        window.location.href = "/";
      }, 700);
    }
  } catch (err) {
    console.error("Logout failed:", err);
    window.location.href = "/login";
  }
}

// Format Date Utility
function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  const d = new Date(dateStr);
  return isNaN(d) ? dateStr : d.toLocaleDateString('en-US', options);
}

// Category Badge Color Class Helper
function getCategoryBadgeClass(category) {
  const cat = (category || "").toLowerCase();
  if (cat.includes("tech")) return "badge-technical";
  if (cat.includes("cult")) return "badge-cultural";
  if (cat.includes("sport")) return "badge-sports";
  if (cat.includes("work")) return "badge-workshop";
  if (cat.includes("sem")) return "badge-seminar";
  return "badge-technical";
}

document.addEventListener("DOMContentLoaded", () => {
  setupMobileMenu();
  syncNavAuthState();
});
