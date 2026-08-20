/* =========================================================
   MOTOFIX LOGIN — client-side form handling
   Swap the fake `authenticate()` call for a real API request
   (fetch to your backend) whenever you're ready to connect it.
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

/* ---------- Quick demo login buttons ---------- */
document.querySelectorAll(".demo-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    emailInput.value = btn.dataset.email;
    passwordInput.value = btn.dataset.password;
    clearErrors();
    showToast(
      `Filled demo credentials for ${capitalize(btn.dataset.role)}`,
      "success",
    );
    // Auto-submit the demo login:
    handleLogin(btn.dataset.role);
  });
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

/* ---------- Fake authenticate (replace with real API call) ---------- */
function authenticate(email, password) {
  // TODO: replace with a real request, e.g.
  // return fetch("/api/login", { method:"POST", body: JSON.stringify({email,password}) })
  //   .then(res => res.json());
  return new Promise((resolve) => {
    setTimeout(() => {
      const knownUsers = {
        "admin@motofix.com": "admin",
        "mechanic1@motofix.com": "mechanic",
        "mechanic2@motofix.com": "mechanic",
        "jose@email.com": "customer",
        "miguel@email.com": "customer",
        "ana@email.com": "customer",
      };
      const role = knownUsers[email.toLowerCase()] || null;
      resolve({ ok: !!role, role });
    }, 700);
  });
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

async function handleLogin(forcedRole) {
  if (!validate()) return;

  signInBtn.disabled = true;
  signInBtn.textContent = "Signing in...";

  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const result = await authenticate(email, password);

  signInBtn.disabled = false;
  signInBtn.textContent = "Sign In";

  const role = forcedRole || result.role;


  // Nabago to eto ung pinalagay sakin para maka connect ung customer UI sa login mo
  // Ung connection ng dashboard ng admin papunta sa login/signup napalitan napunta sakin
  // ikaw na bahala mag ayos eto lang namang if(result.ok) ung napalitan e. YOUR TURN


  if (result.ok || forcedRole) {
    // Save login state to localStorage
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userEmail", email);
    localStorage.setItem("userRole", role);

    if (role === "admin" || role === "customer" || role === "mechanic") {
      window.location.href = "CUSTOMER UI/HTML/Dashboard_Customer.html";
      return;
    }

    showToast(
      `Welcome back! Redirecting to ${capitalize(role)} dashboard…`,
      "success",
    );
    // TODO: redirect to the right dashboard once your pages exist, e.g.
    // setTimeout(() => { window.location.href = `${role}-dashboard.html`; }, 900);
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
    showToast(
      "Enter your email above first, then click Forgot Password.",
      "error",
    );
    emailInput.focus();
  }
  // TODO: replace with real navigation, e.g.
  // window.location.href = "forgot-password.html";
});

/* ---------- Sign up ---------- */
$("#signupLink").addEventListener("click", (e) => {
  e.preventDefault();
  // TODO: replace with real navigation, e.g.
  // window.location.href = "signup.html";
  showToast("Redirecting to Sign Up…", "success");
});
