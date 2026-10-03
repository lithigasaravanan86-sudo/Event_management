/**
 * College Event Management System (CEMS)
 * Authentication Controller (Student & Admin Login, Student Registration)
 */

function switchAuthTab(tabName) {
  // Update Tab buttons
  document.querySelectorAll(".auth-tab").forEach(tab => {
    tab.classList.toggle("active", tab.dataset.tab === tabName);
  });

  // Show/Hide Form Sections
  document.getElementById("studentLoginForm").style.display = tabName === "student-login" ? "block" : "none";
  document.getElementById("studentRegisterForm").style.display = tabName === "student-register" ? "block" : "none";
  document.getElementById("adminLoginForm").style.display = tabName === "admin-login" ? "block" : "none";

  const titleEl = document.getElementById("authTitle");
  const subtitleEl = document.getElementById("authSubtitle");

  if (tabName === "student-login") {
    titleEl.textContent = "Student Sign In";
    subtitleEl.textContent = "Access your event registrations and digital passes";
  } else if (tabName === "student-register") {
    titleEl.textContent = "Student Registration";
    subtitleEl.textContent = "Create an account with your college credentials";
  } else if (tabName === "admin-login") {
    titleEl.textContent = "Admin Portal Sign In";
    subtitleEl.textContent = "Authorized faculty coordinators & club heads";
  }
}

// Pre-fill Demo Credentials Helpers
function fillStudentDemo() {
  switchAuthTab("student-login");
  document.getElementById("stuLoginIdentifier").value = "CS2023001";
  document.getElementById("stuLoginPassword").value = "student123";
  showToast("Loaded demo student credentials (CS2023001)", "info");
}

function fillAdminDemo() {
  switchAuthTab("admin-login");
  document.getElementById("adminIdentifier").value = "admin";
  document.getElementById("adminPassword").value = "admin123";
  showToast("Loaded demo admin credentials (admin)", "info");
}

// Handle Student Login Form
async function handleStudentLogin(e) {
  e.preventDefault();
  const identifier = document.getElementById("stuLoginIdentifier").value.trim();
  const password = document.getElementById("stuLoginPassword").value;
  const submitBtn = e.target.querySelector("button[type='submit']");

  if (!identifier || !password) {
    showToast("Please enter Roll Number / Email and password", "warning");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Signing In...";

  try {
    const res = await fetch("/api/auth/student/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password })
    });
    const data = await res.json();

    if (data.success) {
      showToast(data.message || "Login successful!", "success");
      setTimeout(() => {
        window.location.href = "/student-dashboard";
      }, 800);
    } else {
      showToast(data.message || "Invalid credentials", "error");
      submitBtn.disabled = false;
      submitBtn.textContent = "Sign In as Student";
    }
  } catch (err) {
    console.error("Student login error:", err);
    showToast("Server connection error. Please try again.", "error");
    submitBtn.disabled = false;
    submitBtn.textContent = "Sign In as Student";
  }
}

// Handle Student Registration Form
async function handleStudentRegister(e) {
  e.preventDefault();
  const fullName = document.getElementById("regFullName").value.trim();
  const rollNumber = document.getElementById("regRollNumber").value.trim().toUpperCase();
  const email = document.getElementById("regEmail").value.trim();
  const department = document.getElementById("regDepartment").value;
  const year = document.getElementById("regYear").value;
  const phone = document.getElementById("regPhone").value.trim();
  const password = document.getElementById("regPassword").value;
  const confirmPassword = document.getElementById("regConfirmPassword").value;
  const submitBtn = e.target.querySelector("button[type='submit']");

  if (!fullName || !rollNumber || !email || !department || !year || !password) {
    showToast("Please fill in all required fields", "warning");
    return;
  }

  if (password.length < 6) {
    showToast("Password must be at least 6 characters", "warning");
    return;
  }

  if (password !== confirmPassword) {
    showToast("Passwords do not match", "warning");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Creating Account...";

  try {
    const res = await fetch("/api/auth/student/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: fullName,
        roll_number: rollNumber,
        email: email,
        department: department,
        year: year,
        phone: phone,
        password: password
      })
    });
    const data = await res.json();

    if (data.success) {
      showToast("Account created successfully! Redirecting to Dashboard...", "success");
      setTimeout(() => {
        window.location.href = "/student-dashboard";
      }, 900);
    } else {
      showToast(data.message || "Registration failed", "error");
      submitBtn.disabled = false;
      submitBtn.textContent = "Complete Registration";
    }
  } catch (err) {
    console.error("Registration error:", err);
    showToast("Server connection error. Please try again.", "error");
    submitBtn.disabled = false;
    submitBtn.textContent = "Complete Registration";
  }
}

// Handle Admin Login Form
async function handleAdminLogin(e) {
  e.preventDefault();
  const identifier = document.getElementById("adminIdentifier").value.trim();
  const password = document.getElementById("adminPassword").value;
  const submitBtn = e.target.querySelector("button[type='submit']");

  if (!identifier || !password) {
    showToast("Please enter Admin Username and password", "warning");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Verifying Credentials...";

  try {
    const res = await fetch("/api/auth/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password })
    });
    const data = await res.json();

    if (data.success) {
      showToast(data.message || "Welcome, Administrator!", "success");
      setTimeout(() => {
        window.location.href = "/admin-dashboard";
      }, 800);
    } else {
      showToast(data.message || "Invalid admin credentials", "error");
      submitBtn.disabled = false;
      submitBtn.textContent = "Sign In as Admin";
    }
  } catch (err) {
    console.error("Admin login error:", err);
    showToast("Server connection error. Please try again.", "error");
    submitBtn.disabled = false;
    submitBtn.textContent = "Sign In as Admin";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Check URL query for tab e.g. /login?tab=register or /login?tab=admin
  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get("tab");
  if (tabParam === "register") {
    switchAuthTab("student-register");
  } else if (tabParam === "admin") {
    switchAuthTab("admin-login");
  } else {
    switchAuthTab("student-login");
  }

  // Attach submit listeners
  const sLoginForm = document.getElementById("studentLoginForm");
  if (sLoginForm) sLoginForm.addEventListener("submit", handleStudentLogin);

  const sRegForm = document.getElementById("studentRegisterForm");
  if (sRegForm) sRegForm.addEventListener("submit", handleStudentRegister);

  const aLoginForm = document.getElementById("adminLoginForm");
  if (aLoginForm) aLoginForm.addEventListener("submit", handleAdminLogin);
});
