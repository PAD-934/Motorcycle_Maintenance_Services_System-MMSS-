// JAVASCRIPTS/profile.js
const PROFILE_KEY = "motofix_profiles";
const PERMISSION_REQUESTS_KEY = "motofix_permission_requests";
const NOTIFICATIONS_KEY = "motofix_notifications";

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

function readStoredArray(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function createDeletionRequestId(requests) {
  const timestamp = Date.now();
  let attempt = 0;
  let requestId;
  do {
    requestId = `PR-${timestamp}${attempt ? `-${attempt}` : ""}`;
    attempt += 1;
  } while (requests.some((request) => request.id === requestId));
  return requestId;
}

function requestAccountDeletion(profile) {
  const email = currentEmail();
  if (!email) {
    alert("Your account email could not be found. Please sign in again.");
    return false;
  }

  const requests = readStoredArray(PERMISSION_REQUESTS_KEY);
  if (requests.some(
    (request) =>
      request.type === "account_delete" &&
      request.status === "Pending" &&
      request.targetEmail?.toLowerCase() === email,
  )) {
    alert("Your account deletion request is already pending review.");
    return false;
  }

  const requestedAt = new Date().toISOString();
  const requestId = createDeletionRequestId(requests);
  requests.unshift({
    id: requestId,
    type: "account_delete",
    status: "Pending",
    targetEmail: email,
    targetName: profile.name,
    targetRole: "Customer",
    requestedBy: email,
    requestedByName: profile.name,
    requestedByRole: "customer",
    requestedAt,
    notes: [],
  });
  localStorage.setItem(PERMISSION_REQUESTS_KEY, JSON.stringify(requests));

  const notifications = readStoredArray(NOTIFICATIONS_KEY);
  notifications.unshift({
    id: `N${Date.now()}`,
    title: "Account deletion requested",
    message: `${profile.name} requested deletion of their customer account (${email}).`,
    audiences: ["admin"],
    permissionRequestId: requestId,
    createdAt: requestedAt,
    readBy: [],
  });
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications.slice(0, 100)));
  window.dispatchEvent(new Event("motofix:notifications-updated"));
  return true;
}

function confirmAccountDeletionRequest(profile) {
  if (!window.confirm("Are you sure you want to request deletion of your account? This sends a request to the administrator; your account will not be deleted unless approved.")) {
    return false;
  }
  if (!requestAccountDeletion(profile)) return false;
  alert("Your account deletion request was sent to the administrator for review.");
  return true;
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

function saveCustomerProfile({ name, email, phone }) {
  const oldEmail = currentEmail();
  const newEmail = email.trim().toLowerCase();
  if (!oldEmail) throw new Error("Your signed-in email could not be found. Please sign in again.");

  const readArray = (key) => {
    let value;
    try {
      value = JSON.parse(localStorage.getItem(key) || "[]");
    } catch (error) {
      throw new Error(`Could not read ${key}. Your profile was not changed.`);
    }
    if (!Array.isArray(value)) {
      throw new Error(`Stored ${key} data is invalid. Your profile was not changed.`);
    }
    return value;
  };
  const users = readArray("motofix_users");
  const employees = readArray("motofix_master_employees");
  const reservedEmails = [
    "master@motofix.com",
    "admin@motofix.com",
    "mechanic1@motofix.com",
    "mechanic2@motofix.com",
    "jose@email.com",
    "ana@email.com",
    "miguel@email.com",
  ];
  let existingAliases;
  try {
    existingAliases = JSON.parse(localStorage.getItem("motofix_login_aliases") || "{}");
  } catch {
    throw new Error("Login email data is invalid. Your profile was not changed.");
  }
  if (!existingAliases || typeof existingAliases !== "object" || Array.isArray(existingAliases)) {
    throw new Error("Login email data is invalid. Your profile was not changed.");
  }
  if (
    users.some((user) => user.email?.trim().toLowerCase() === newEmail && user.email?.trim().toLowerCase() !== oldEmail) ||
    employees.some((user) => user.email?.trim().toLowerCase() === newEmail) ||
    (newEmail !== oldEmail && (reservedEmails.includes(newEmail) || existingAliases[newEmail]))
  ) {
    throw new Error("That email address is already in use.");
  }

  let profiles;
  try {
    profiles = JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}");
  } catch {
    throw new Error("Your saved profile data is invalid. Your profile was not changed.");
  }
  if (!profiles || typeof profiles !== "object" || Array.isArray(profiles)) {
    throw new Error("Your saved profile data is invalid. Your profile was not changed.");
  }
  // Email is the current cross-store customer key; migrate every reference together
  // so appointments, motorcycles, notifications, permissions, and login remain linked.
  const appointments = readArray("motofix_appointments");
  const motorcycles = readArray("motofix_motorcycles");
  const notifications = readArray(NOTIFICATIONS_KEY);
  const permissionRequests = readArray(PERMISSION_REQUESTS_KEY);
  let aliases;
  let replacedEmails;
  try {
    aliases = JSON.parse(localStorage.getItem("motofix_login_aliases") || "{}");
    replacedEmails = JSON.parse(localStorage.getItem("motofix_replaced_emails") || "[]");
  } catch {
    throw new Error("Login email data is invalid. Your profile was not changed.");
  }
  if (!aliases || typeof aliases !== "object" || Array.isArray(aliases) || !Array.isArray(replacedEmails)) {
    throw new Error("Login email data is invalid. Your profile was not changed.");
  }

  const previousProfile = profiles[oldEmail] || {};
  delete profiles[oldEmail];
  profiles[newEmail] = { ...previousProfile, name, phone };
  const account = users.find((user) => user.email?.trim().toLowerCase() === oldEmail);
  if (account) {
    account.email = newEmail;
    account.name = name;
    account.phone = phone;
  } else {
    aliases[newEmail] = "customer";
  }
  delete aliases[oldEmail];
  if (oldEmail !== newEmail && !replacedEmails.includes(oldEmail)) {
    replacedEmails.push(oldEmail);
  }

  appointments.forEach((appointment) => {
    if (appointment.customerEmail?.trim().toLowerCase() === oldEmail) {
      appointment.customerEmail = newEmail;
    }
  });
  motorcycles.forEach((motorcycle) => {
    if (motorcycle.ownerEmail?.trim().toLowerCase() === oldEmail) {
      motorcycle.ownerEmail = newEmail;
    }
  });
  notifications.forEach((notification) => {
    if (Array.isArray(notification.audiences)) {
      notification.audiences = notification.audiences.map((audience) =>
        audience === `customer:${oldEmail}` ? `customer:${newEmail}` : audience,
      );
    }
    if (Array.isArray(notification.readBy)) {
      notification.readBy = notification.readBy.map((reader) =>
        reader === `customer:${oldEmail}` ? `customer:${newEmail}` : reader,
      );
    }
  });
  permissionRequests.forEach((request) => {
    if (request.requestedBy?.trim().toLowerCase() === oldEmail) request.requestedBy = newEmail;
    if (request.targetEmail?.trim().toLowerCase() === oldEmail) request.targetEmail = newEmail;
  });

  const updates = {
    [PROFILE_KEY]: profiles,
    motofix_users: users,
    motofix_appointments: appointments,
    motofix_motorcycles: motorcycles,
    [NOTIFICATIONS_KEY]: notifications,
    [PERMISSION_REQUESTS_KEY]: permissionRequests,
    motofix_login_aliases: aliases,
    motofix_replaced_emails: replacedEmails,
  };
  const previousCurrentUser = localStorage.getItem("motofix_current_user");
  const previousValues = Object.fromEntries(
    Object.keys(updates).map((key) => [key, localStorage.getItem(key)]),
  );
  const previousSessionEmail = localStorage.getItem("userEmail");
  const previousSessionName = localStorage.getItem("userFullName");
  const oldMigrationKey = `motofix_signup_motorcycle_migrated:${oldEmail}`;
  const newMigrationKey = `motofix_signup_motorcycle_migrated:${newEmail}`;
  const previousOldMigrationValue = localStorage.getItem(oldMigrationKey);
  const previousNewMigrationValue = localStorage.getItem(newMigrationKey);
  try {
    Object.entries(updates).forEach(([key, value]) => {
      localStorage.setItem(key, JSON.stringify(value));
    });
    localStorage.setItem("userEmail", newEmail);
    localStorage.setItem("userFullName", name);
    if (previousOldMigrationValue !== null) {
      localStorage.setItem(newMigrationKey, previousOldMigrationValue);
      localStorage.removeItem(oldMigrationKey);
    }
    const currentUser = JSON.parse(localStorage.getItem("motofix_current_user") || "null");
    if (currentUser && currentUser.email?.trim().toLowerCase() === oldEmail) {
      currentUser.email = newEmail;
      currentUser.name = name;
      localStorage.setItem("motofix_current_user", JSON.stringify(currentUser));
    }
  } catch (error) {
    Object.entries(previousValues).forEach(([key, value]) => {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    });
    if (previousSessionEmail === null) localStorage.removeItem("userEmail");
    else localStorage.setItem("userEmail", previousSessionEmail);
    if (previousSessionName === null) localStorage.removeItem("userFullName");
    else localStorage.setItem("userFullName", previousSessionName);
    if (previousCurrentUser === null) localStorage.removeItem("motofix_current_user");
    else localStorage.setItem("motofix_current_user", previousCurrentUser);
    if (previousOldMigrationValue === null) localStorage.removeItem(oldMigrationKey);
    else localStorage.setItem(oldMigrationKey, previousOldMigrationValue);
    if (previousNewMigrationValue === null) localStorage.removeItem(newMigrationKey);
    else localStorage.setItem(newMigrationKey, previousNewMigrationValue);
    throw new Error("Could not save your profile changes. Please try again.");
  }
  window.dispatchEvent(new Event("motofix:appointments-updated"));
  window.dispatchEvent(new Event("motofix:notifications-updated"));
}

export function renderProfile() {
  const p = getProfile();
  const setText = (selector, value) =>
    document.querySelectorAll(selector).forEach((el) => (el.textContent = value));
  setText(".popup_user_name", p.name);
  setText(".popup_user_email", p.email || "—");
  setText(".footer_username", p.name);
  setText(".header_user_initials, .footer_initials", p.initials);
  const welcome = document.querySelector(".middle_header_sub-label");
  if (welcome) welcome.textContent = `Welcome back, ${p.name.split(/\s+/)[0] || "Customer"}`;

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
          <input type="email" id="profile-email" class="sc-input-field" value="${escapeHtml(p.email)}" required autocomplete="email" />
        </div>
        <div class="sc-form-group">
          <label>PHONE</label>
          <input type="tel" id="profile-phone" class="sc-input-field" value="${escapeHtml(p.phone)}" placeholder="+63 912 345 6789" />
        </div>
        <div id="profile-error" class="sc-booking-error" hidden></div>
        <button type="button" class="sc-submit-btn" id="profile-save-btn">Save Profile</button>
        <section class="sc-account-danger-zone">
          <div class="sc-account-danger-description">Warning: this sends a request to the administrator to review removal of your account. It will not delete your account immediately.</div>
          <button type="button" class="sc-submit-btn sc-danger-btn" id="profile-delete-request-btn">Request Account Deletion</button>
        </section>
      </div>
    </div>`;

  const close = () => overlay.remove();
  overlay.querySelector("#profile-close-btn").addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  overlay.querySelector("#profile-save-btn").addEventListener("click", () => {
    const name = overlay.querySelector("#profile-name").value.trim();
    const email = overlay.querySelector("#profile-email").value.trim().toLowerCase();
    const phone = overlay.querySelector("#profile-phone").value.trim();
    const errorBox = overlay.querySelector("#profile-error");
    const showError = (msg) => {
      errorBox.textContent = msg;
      errorBox.hidden = false;
    };

    if (!name) return showError("Please enter your name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return showError("Please enter a valid email address.");
    }
    if (phone && !/^[0-9+\-\s()]{7,20}$/.test(phone)) {
      return showError("Please enter a valid phone number.");
    }

    if (!window.confirm("Are you sure you want to save these profile changes? If you changed your email, use the new email the next time you sign in.")) return;
    try {
      saveCustomerProfile({ name, email, phone });
      renderProfile();
      close();
      alert("Profile updated successfully.");
    } catch (error) {
      showError(error.message || "Could not save your profile changes.");
    }
  });

  overlay.querySelector("#profile-delete-request-btn").addEventListener("click", () => {
    if (confirmAccountDeletionRequest(p)) close();
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