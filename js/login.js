/* =========================================================
   MOTOFIX LOGIN — client-side form handling
========================================================= */

const $ = (sel) => document.querySelector(sel);

const form = $("#loginForm");
const emailInput = $("#email");
const passwordInput = $("#password");
const emailError = $("#emailError");
const passwordError = $("#passwordError");
const signInBtn = $(".btn-signin");
const toast = $("#toast");

/* ---------- Toast helper ---------- */
let toastTimer;
function showToast(message, type = "success") {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3200);
}

/* ---------- Password visibility toggle ---------- */
$("#togglePw").addEventListener("click", () => {
  const isHidden = passwordInput.type === "password";
  passwordInput.type = isHidden ? "text" : "password";
  $("#togglePw").textContent = isHidden ? "🙈" : "👁";
});

/* ---------- Validation ---------- */
function clearErrors() {
  emailInput.classList.remove("invalid");
  passwordInput.classList.remove("invalid");
  emailError.textContent = "";
  passwordError.textContent = "";
}

function validate() {
  clearErrors();
  let valid = true;
  const emailVal = emailInput.value.trim();
  const passwordVal = passwordInput.value;

  if (!emailVal) {
    emailError.textContent = "Email is required.";
    emailInput.classList.add("invalid");
    valid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
    emailError.textContent = "Enter a valid email address.";
    emailInput.classList.add("invalid");
    valid = false;
  }

  if (!passwordVal) {
    passwordError.textContent = "Password is required.";
    passwordInput.classList.add("invalid");
    valid = false;
  } else if (passwordVal.length < 6) {
    passwordError.textContent = "Password must be at least 6 characters.";
    passwordInput.classList.add("invalid");
    valid = false;
  }

  return valid;
}

/* ==========================================================================
   TODO: CHANGE LATER FOR DYNAMIC FUNCTION
   When connecting to your database, replace this temporary mock function 
   with a real fetch() API call to your backend endpoint (e.g., /api/login).
   
   Example backend integration structure:
   --------------------------------------------------------------------------
   return fetch("/api/login", {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({ email, password })
   })
   .then(res => res.json())
   .then(data => ({ ok: data.success, role: data.role }))
   .catch(() => ({ ok: false, role: null }));
   --------------------------------------------------------------------------
========================================================================== */
function authenticate(email, password) {
  return new Promise((resolve) => {
    setTimeout(() => {

      // ANDITO YUNG MGA ACCOUNTS PARA MAKAPASOK SA MGA UI

      // Hardcoded accounts for design review (CHANGE LATER FOR DYNAMIC FUNCTION)
      const knownUsers = {
        "master@motofix.com": "master_admin", // New Master Admin role
        "admin@motofix.com": "admin",         // Regular Store Admin
        "mechanic1@motofix.com": "mechanic",    // Mechanic1 name Ramon Santos
        "mechanic2@motofix.com": "mechanic",    // Mechanic2 name Jake Reyes
        "jose@email.com": "customer",          // Customer name Jose Bautista
        "ana@email.com": "customer",            // Customer name Ana Flores
        "miguel@email.com": "customer"          // Customer name Miguel Torres
      };

      const normalizedEmail = String(email || "").trim().toLowerCase();
      const role = knownUsers[normalizedEmail] || null;
      // Simple mock password check for visual testing
      const passwordValid = typeof password === "string" && password.length >= 6;

      resolve({ ok: !!role && passwordValid, role });
    }, 600);
  });
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

async function handleLogin() {
  if (!validate()) return;

  signInBtn.disabled = true;
  signInBtn.textContent = "Signing in...";

  const email = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value;
  const result = await authenticate(email, password);

  signInBtn.disabled = false;
  signInBtn.textContent = "Sign In";

  if (result.ok) {
    // Save login state & role to localStorage for dashboard permission checks
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userEmail", email);
    localStorage.setItem("userRole", result.role);

    showToast(`Welcome back! Redirecting to ${capitalize(result.role)} dashboard…`, "success");

    // Dynamic routing based on database/verified role
    setTimeout(() => {
      if (result.role === "master_admin") {
        window.location.href = "dashboard.html"; // Hidden secure portal
        return;
      } else if (result.role === "customer") {
        window.location.href = "CUSTOMER UI/HTML/Dashboard_Customer.html";
      } else if (result.role === "admin") {
        window.location.href = "dashboard.html";
      } else if (result.role === "mechanic") {
        window.location.href = "CUSTOMER UI/HTML/mechanic.html";
      }
    }, 800);

  } else {
    showToast("Invalid email or password.", "error");
    passwordInput.classList.add("invalid");
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  handleLogin();
});

/* ---------- Forgot password ---------- */
$("#forgotLink").addEventListener("click", (e) => {
  e.preventDefault();
  const email = emailInput.value.trim();
  if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showToast(`Password reset link sent to ${email}`, "success");
  } else {
    showToast("Enter your email above first, then click Forgot Password.", "error");
    emailInput.focus();
  }
});

/* ---------- Sign up redirection ---------- */
$("#signupLink").addEventListener("click", (e) => {
  e.preventDefault();
  window.location.href = "signup.html";
});