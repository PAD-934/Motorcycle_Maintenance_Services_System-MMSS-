// JAVASCRIPTS/profile.js
const PROFILE_KEY = "motofix_profiles";

const currentEmail = () =>
  (localStorage.getItem("userEmail") || "").trim().toLowerCase();

function readProfiles() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}

const initialsOf = (name) =>
  name.split(" ").filter(Boolean).map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "CU";

function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>'"]/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[c]
  );
}

export function getProfile() {
  const email = currentEmail();
  const saved = readProfiles()[email] || {};
  const fromEmail = email
    ? email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "Customer";
  const name = saved.name || localStorage.getItem("userName") || fromEmail;
  const phone = saved.phone || localStorage.getItem("userPhone") || "";
  return { email, name, phone, initials: initialsOf(name) };
}

function saveProfile({ name, phone }) {
  const all = readProfiles();
  all[currentEmail()] = { name, phone };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(all));
}

export function renderProfile() {
  const p = getProfile();
  const setText = (selector, value) =>
    document.querySelectorAll(selector).forEach((el) => (el.textContent = value));
  setText(".popup_user_name", p.name);
  setText(".popup_user_email", p.email || "—");
  setText(".footer_username", p.name);
  setText(".header_user_initials, .footer_initials", p.initials);

  // NEW: green avatar
  document.querySelectorAll(".header_user_initials, .footer_initials").forEach((el) => {
    el.style.color = "#22c55e";
    const circle = el.parentElement;
    circle.style.background = "rgba(34, 197, 94, 0.15)";
    circle.style.borderColor = "rgba(34, 197, 94, 0.4)";
  });
}


function openProfileModal() {
  document.getElementById("profile-modal-overlay")?.remove();
  const p = getProfile();

  const overlay = document.createElement("div");
  overlay.id = "profile-modal-overlay";
  overlay.className = "sc-modal-overlay";
  overlay.innerHTML = `
    <div class="sc-modal-card" style="max-width: 420px">
      <div class="sc-modal-header">
        <h2>Edit Profile</h2>
        <button type="button" class="sc-modal-close" id="profile-close-btn" aria-label="Close">✕</button>
      </div>
      <div class="sc-modal-body">
        <div class="sc-form-group">
          <label>FULL NAME</label>
          <input type="text" id="profile-name" class="sc-input-field" value="${escapeHtml(p.name)}" />
        </div>
        <div class="sc-form-group">
          <label>EMAIL (LOGIN)</label>
          <input type="text" class="sc-input-field" value="${escapeHtml(p.email)}" disabled />
        </div>
        <div class="sc-form-group">
          <label>PHONE</label>
          <input type="tel" id="profile-phone" class="sc-input-field" value="${escapeHtml(p.phone)}" placeholder="+63 912 345 6789" />
        </div>
        <div id="profile-error" class="sc-booking-error" hidden></div>
        <button type="button" class="sc-submit-btn" id="profile-save-btn">Save Profile</button>
      </div>
    </div>`;

  const close = () => overlay.remove();
  overlay.querySelector("#profile-close-btn").addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  overlay.querySelector("#profile-save-btn").addEventListener("click", () => {
    const name = overlay.querySelector("#profile-name").value.trim();
    const phone = overlay.querySelector("#profile-phone").value.trim();
    const errorBox = overlay.querySelector("#profile-error");
    const showError = (msg) => {
      errorBox.textContent = msg;
      errorBox.hidden = false;
    };

    if (!name) return showError("Please enter your name.");
    if (phone && !/^[0-9+\-\s()]{7,20}$/.test(phone)) {
      return showError("Please enter a valid phone number.");
    }

    saveProfile({ name, phone });
    renderProfile();
    close();
  });

  document.body.appendChild(overlay);
}

  const EYE_ON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>`;

const EYE_OFF = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-6.5 0-10-7-10-7a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A9.1 9.1 0 0 1 12 5c6.5 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;

function passwordField(id, label) {
  return `
    <div class="sc-form-group">
      <label>${label}</label>
      <div style="position:relative">
        <input type="password" id="${id}" class="sc-input-field" style="padding-right:44px;width:100%;box-sizing:border-box" />
        <button type="button" class="pw-toggle" data-target="${id}" aria-label="Show password"
          style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#a3a3a3;padding:4px;display:flex">${EYE_ON}</button>
      </div>
    </div>`;

}
function openPasswordModal() {
  document.getElementById("password-modal-overlay")?.remove();

  const overlay = document.createElement("div");
  overlay.id = "password-modal-overlay";
  overlay.className = "sc-modal-overlay";
  overlay.innerHTML = `
    <div class="sc-modal-card" style="max-width: 420px">
      <div class="sc-modal-header">
        <h2>Change Password</h2>
        <button type="button" class="sc-modal-close" id="pw-close-btn" aria-label="Close">✕</button>
      </div>
      <div class="sc-modal-body">
       ${passwordField("pw-current", "CURRENT PASSWORD")}
        ${passwordField("pw-new", "NEW PASSWORD")}
        ${passwordField("pw-confirm", "CONFIRM NEW PASSWORD")}
        <div id="pw-error" class="sc-booking-error" hidden></div>
        <button type="button" class="sc-submit-btn" id="pw-save-btn">Update Password</button>
      </div>
    </div>`;

  const close = () => overlay.remove();
  overlay.querySelector("#pw-close-btn").addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
   overlay.querySelectorAll(".pw-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = overlay.querySelector("#" + btn.dataset.target);
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.innerHTML = show ? EYE_OFF : EYE_ON;
      btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
    });
  });

  overlay.querySelector("#pw-save-btn").addEventListener("click", async () => {
    const current = overlay.querySelector("#pw-current").value;
    const next = overlay.querySelector("#pw-new").value;
    const confirm = overlay.querySelector("#pw-confirm").value;
    const errorBox = overlay.querySelector("#pw-error");
    const showError = (msg) => {
      errorBox.textContent = msg;
      errorBox.hidden = false;
    };

    if (!current) return showError("Please enter your current password.");
    if (next.length < 8) return showError("New password must be at least 8 characters.");
    if (next === current) return showError("New password must be different from the current one.");
    if (next !== confirm) return showError("Passwords do not match.");

    try {
      await changePassword(current, next);
      close();
      alert("Password updated successfully.");
    } catch (err) {
      showError(err.message || "Could not update password.");
    }
  });

  document.body.appendChild(overlay);
}
// CHANGE PASSWORD
async function changePassword(currentPassword, newPassword) {
  const email = currentEmail();
  if (!email) throw new Error("No user is logged in.");

  let users;
  try {
    users = JSON.parse(localStorage.getItem("motofix_users")) || [];
  } catch {
    users = [];
  }
  if (!Array.isArray(users)) users = [];

  const user = users.find(
    (u) => String(u.email || "").toLowerCase() === email
  );

  if (user) {
    // Account created through signup: verify the real current password
    if (user.password !== currentPassword) {
      throw new Error("Current password is incorrect.");
    }
    user.password = newPassword;
  } else {
    // Hardcoded demo account (e.g. jose@email.com): it has no saved password,
    // so create a record for it. Login will find it from now on.
    if (currentPassword.length < 6) {
      throw new Error("Current password is incorrect.");
    }
    users.push({
      name: getProfile().name,
      email,
      password: newPassword,
      role: localStorage.getItem("userRole") || "customer",
    });
  }

  localStorage.setItem("motofix_users", JSON.stringify(users));
}
export function initProfile() {
  renderProfile();

  // Add an "Edit Profile" button above Sign Out (no HTML edit needed)
  const signout = document.getElementById("logout-btn");
  if (signout && !document.getElementById("edit-profile-btn")) {
    const btn = document.createElement("button");
    btn.id = "edit-profile-btn";
    btn.type = "button";
    btn.className = signout.className;
    btn.style.color = "#f5f5f5";
    btn.textContent = "Edit Profile";
    signout.parentElement.insertBefore(btn, signout);
  }
  if (signout && !document.getElementById("change-password-btn")) {
    const btn = document.createElement("button");
    btn.id = "change-password-btn";
    btn.type = "button";
    btn.className = signout.className;
    btn.style.color = "#f5f5f5";
    btn.textContent = "Change Password";
    signout.parentElement.insertBefore(btn, signout);
  }
  document.getElementById("edit-profile-btn")?.addEventListener("click", openProfileModal);
  document.getElementById("change-password-btn")?.addEventListener("click", openPasswordModal); 

}