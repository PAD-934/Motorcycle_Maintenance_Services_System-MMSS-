/* =========================================================
   MOTOFIX LOGIN — client-side form handling
========================================================= */
// Account/session fields and backend replacement notes: ../BACKEND_DATA_CONTRACT.md

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
/* ==========================================================================
   DATABASE ABSTRACTION LAYER (Login Authentication)
   - Checks LocalStorage (`motofix_users`) for dynamically registered users.
   - Falls back to hardcoded accounts for system testing.
   - PREPPED FOR PHP/MYSQL: When moving to PHPMyAdmin, replace this 
     logic with a fetch() POST request to a backend script (e.g., login.php).
========================================================================== */
function authenticate(email, password) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const normalizedEmail = String(email || "").trim().toLowerCase();
      const knownUsers = {
        "master@motofix.com": "master_admin",
        "admin@motofix.com": "admin",
        "mechanic1@motofix.com": "mechanic",
        "mechanic2@motofix.com": "mechanic",
        "jose@email.com": "customer",
        "ana@email.com": "customer",
        "miguel@email.com": "customer",
      };
      let role = null;
      let deletedAccounts = [];
      try {
        const storedDeletedAccounts = JSON.parse(
          localStorage.getItem("motofix_deleted_accounts") || "[]",
        );
        deletedAccounts = Array.isArray(storedDeletedAccounts)
          ? storedDeletedAccounts.map((accountEmail) => String(accountEmail).toLowerCase())
          : [];
      } catch {
        deletedAccounts = [];
      }
      if (deletedAccounts.includes(normalizedEmail)) {
        resolve({ ok: false, role: null });
        return;
      }
      let replacedEmails = [];
      try {
        const storedReplacedEmails = JSON.parse(
          localStorage.getItem("motofix_replaced_emails") || "[]",
        );
        replacedEmails = Array.isArray(storedReplacedEmails)
          ? storedReplacedEmails.map((accountEmail) => String(accountEmail).trim().toLowerCase())
          : [];
        const aliases = JSON.parse(
          localStorage.getItem("motofix_login_aliases") || "{}",
        );
        if (aliases && typeof aliases === "object" && !Array.isArray(aliases)) {
          Object.entries(aliases).forEach(([alias, aliasRole]) => {
            if (aliasRole) knownUsers[alias.trim().toLowerCase()] = String(aliasRole).toLowerCase();
          });
        }
      } catch (error) {
        console.error("Unable to load customer login email changes:", error);
      }

      // Resolve credentials from the shared account collection; aliases preserve login
      // after a Customer changes email, while role metadata routes to the right dashboard.
      // 1. CHECK LOCALSTORAGE DATABASE MOCK FIRST (Catches new signups!)
      const registeredUsers = JSON.parse(localStorage.getItem("motofix_users")) || [];
      const foundUser = Array.isArray(registeredUsers)
        ? registeredUsers.find(
            (user) => user.email?.trim().toLowerCase() === normalizedEmail,
          )
        : null;

      // A current registered account wins over a stale replaced-email marker (for example,
      // when that address is registered again); otherwise the old address stays blocked.
      if (!foundUser && replacedEmails.includes(normalizedEmail)) {
        resolve({ ok: false, role: null });
        return;
      }

      if (foundUser) {
        // If found in localStorage, verify password matches what they signed up with
        if (foundUser.password === password) {
          // Keep built-in account identities on their intended system roles.
          role =
            knownUsers[normalizedEmail] ||
            (foundUser.role ? foundUser.role.toLowerCase() : "customer");
          if (knownUsers[normalizedEmail] && foundUser.role !== role) {
            foundUser.role = role;
            localStorage.setItem("motofix_users", JSON.stringify(registeredUsers));

            const employees = JSON.parse(
              localStorage.getItem("motofix_master_employees") || "[]",
            );
            if (Array.isArray(employees)) {
              let employeesUpdated = false;
              employees.forEach((employee) => {
                if (employee.email?.trim().toLowerCase() === normalizedEmail) {
                  employee.role = role;
                  employeesUpdated = true;
                }
              });
              if (employeesUpdated) {
                localStorage.setItem(
                  "motofix_master_employees",
                  JSON.stringify(employees),
                );
              }
            }
          }
          
          // Save extra user profile info to session storage for the UI to use
          localStorage.setItem("userFullName", foundUser.name || `${foundUser.first_name} ${foundUser.last_name}`);
          
          resolve({ ok: true, role });
          return;
        } else {
          // Password incorrect for this local account
          resolve({ ok: false, role: null });
          return;
        }
      }

      // 2. FALLBACK TO HARDCODED ACCOUNTS (If not found in localStorage)
      role = knownUsers[normalizedEmail] || null;
      const passwordValid = typeof password === "string" && password.length >= 6;

      /* 
        PHPMyAdmin Migration Note for Defense:
        When switching to your backend, you will replace the code above with:
        
        return fetch('api/login.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: normalizedEmail, password })
        })
        .then(res => res.json())
        .then(data => ({ ok: data.success, role: data.role }))
        .catch(() => ({ ok: false, role: null }));
      */

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