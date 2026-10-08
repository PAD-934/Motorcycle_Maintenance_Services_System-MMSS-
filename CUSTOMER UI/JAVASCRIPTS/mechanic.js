(function () {
  // Mechanic account/assignment/status flows: ../../BACKEND_DATA_CONTRACT.md
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  const userRole = localStorage.getItem("userRole");
  if (!isLoggedIn || userRole !== "mechanic") {
    window.location.href = "../../login.html";
    return;
  }

  /* ---------------- Data ---------------- */
  function readStoredArray(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  function readProfileMap() {
    try {
      const profiles = JSON.parse(localStorage.getItem("motofix_profiles") || "{}");
      return profiles && typeof profiles === "object" && !Array.isArray(profiles) ? profiles : {};
    } catch {
      return {};
    }
  }

  const currentEmail = (localStorage.getItem("userEmail") || "").toLowerCase();
  const savedProfile = readProfileMap()[currentEmail] || {};
  const storedAccounts = [
    ...readStoredArray("motofix_users"),
    ...readStoredArray("motofix_master_employees"),
  ];
  const storedAccount = storedAccounts.find(
    (account) => account.email?.toLowerCase() === currentEmail,
  );
  const fallbackNames = {
    "mechanic1@motofix.com": "Ramon Santos",
    "mechanic2@motofix.com": "Jake Reyes",
  };
  const currentName = savedProfile.name || storedAccount?.name || localStorage.getItem("userFullName") || fallbackNames[currentEmail] || currentEmail;
  let currentPhone = savedProfile.phone || storedAccount?.phone || "";
  const CURRENT_USER = {
    name: currentName,
    email: currentEmail,
    role: "Mechanic",
    initials: currentName.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase(),
  };
  const now = new Date();
  const TODAY = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

  const STATUS_ORDER = ["pending", "confirmed", "in_progress", "completed"];
  const STATUS_LABEL = {
    pending: "Pending",
    confirmed: "Confirmed",
    in_progress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  let jobs = [];

  function normalizeMechanicStatus(status) {
    const value = (status || "Pending").toString();
    const map = {
      Pending: "pending",
      Confirmed: "confirmed",
      "In Progress": "in_progress",
      "Work Finished (unpaid)": "completed",
      "Work Finished": "completed",
      Unpaid: "completed",
      "Complete transaction": "completed",
      Completed: "completed",
      Cancelled: "cancelled",
      cancelled: "cancelled",
    };
    return map[value] || value.toLowerCase().replace(/\s+/g, "_");
  }

  function openMechanicProfileEditor() {
    const overlay = document.createElement("div");
    overlay.className = "job-details-backdrop mechanic-profile-backdrop";
    overlay.innerHTML = `
      <section class="mechanic-profile-dialog" role="dialog" aria-modal="true" aria-labelledby="mechanic-profile-title">
        <div class="mechanic-profile-header">
          <h2 id="mechanic-profile-title">Edit Profile</h2>
          <button type="button" class="mechanic-profile-close" aria-label="Close profile editor">×</button>
        </div>
        <form id="mechanic-profile-form" class="mechanic-profile-form">
          <div class="mechanic-profile-field">
            <label for="mechanic-profile-name">Full Name</label>
            <input id="mechanic-profile-name" value="${escapeHtml(CURRENT_USER.name)}" required>
          </div>
          <div class="mechanic-profile-field">
            <label for="mechanic-profile-email">Email (Login)</label>
            <output id="mechanic-profile-email" class="profile-email-display" aria-label="Login email address">${escapeHtml(CURRENT_USER.email)}</output>
          </div>
          <div class="mechanic-profile-field">
            <label for="mechanic-profile-phone">Phone</label>
            <input id="mechanic-profile-phone" type="tel" value="${escapeHtml(currentPhone)}" placeholder="+63 912 345 6789">
          </div>
          <button class="mechanic-profile-save" type="submit">Save Profile</button>
        </form>
      </section>`;
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.querySelector(".mechanic-profile-close").addEventListener("click", close);
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) close();
    });
    overlay.querySelector("#mechanic-profile-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const nextName = overlay.querySelector("#mechanic-profile-name").value.trim();
      const nextPhone = overlay.querySelector("#mechanic-profile-phone").value.trim();
      if (!nextName) return window.alert("Please enter your name.");
      if (nextPhone && !/^[0-9+\-\s()]{7,20}$/.test(nextPhone)) {
        return window.alert("Please enter a valid phone number.");
      }

      const previousName = CURRENT_USER.name;
      const profiles = readProfileMap();
      profiles[currentEmail] = { ...(profiles[currentEmail] || {}), name: nextName, phone: nextPhone };
      localStorage.setItem("motofix_profiles", JSON.stringify(profiles));
      localStorage.setItem("userFullName", nextName);

      for (const key of ["motofix_users", "motofix_master_employees"]) {
        const accounts = readStoredArray(key);
        const account = accounts.find((item) => item.email?.toLowerCase() === currentEmail);
        if (!account) continue;
        account.name = nextName;
        account.phone = nextPhone;
        account.initials = nextName.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase();
        account.updated_at = new Date().toISOString();
        localStorage.setItem(key, JSON.stringify(accounts));
      }

      const appointments = readStoredArray("motofix_appointments");
      let assignmentsChanged = false;
      appointments.forEach((appointment) => {
        // Current appointment assignments use the mechanic's display name as the join value.
        if (appointment.mechanic === previousName) {
          appointment.mechanic = nextName;
          assignmentsChanged = true;
        }
      });
      if (assignmentsChanged) {
        localStorage.setItem("motofix_appointments", JSON.stringify(appointments));
        window.dispatchEvent(new Event("motofix:appointments-updated"));
      }

      CURRENT_USER.name = nextName;
      CURRENT_USER.initials = nextName.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase();
      currentPhone = nextPhone;
      document.getElementById("sideName").textContent = nextName;
      document.getElementById("userDisplayName").textContent = nextName;
      document.getElementById("sideAvatar").textContent = CURRENT_USER.initials;
      document.getElementById("topAvatar").textContent = CURRENT_USER.initials;
      document.getElementById("userMenu").classList.remove("open");
      document.getElementById("userTrigger").setAttribute("aria-expanded", "false");
      close();
      renderAll();
    });
  }

  function openMechanicPasswordEditor() {
    const overlay = document.createElement("div");
    overlay.className = "job-details-backdrop mechanic-profile-backdrop";
    overlay.innerHTML = `
      <section class="mechanic-profile-dialog mechanic-password-dialog" role="dialog" aria-modal="true" aria-labelledby="mechanic-password-title">
        <div class="mechanic-profile-header">
          <h2 id="mechanic-password-title">Change Password</h2>
          <button type="button" class="mechanic-profile-close" aria-label="Close password editor">×</button>
        </div>
        <form id="mechanic-password-form" class="mechanic-profile-form">
          <div class="mechanic-profile-field">
            <label for="mechanic-current-password">Current Password</label>
            <input id="mechanic-current-password" type="password" autocomplete="current-password" required>
          </div>
          <div class="mechanic-profile-field">
            <label for="mechanic-new-password">New Password</label>
            <input id="mechanic-new-password" type="password" autocomplete="new-password" minlength="8" required>
          </div>
          <div class="mechanic-profile-field">
            <label for="mechanic-confirm-password">Confirm New Password</label>
            <input id="mechanic-confirm-password" type="password" autocomplete="new-password" minlength="8" required>
          </div>
          <p class="mechanic-password-message" id="mechanic-password-message" role="status" aria-live="polite"></p>
          <div class="mechanic-password-actions">
            <button class="mechanic-password-cancel" type="button">Cancel</button>
            <button class="mechanic-profile-save" type="submit">Update Password</button>
          </div>
        </form>
      </section>`;
    document.body.appendChild(overlay);

    const form = overlay.querySelector("#mechanic-password-form");
    const currentPasswordInput = overlay.querySelector("#mechanic-current-password");
    const newPasswordInput = overlay.querySelector("#mechanic-new-password");
    const confirmPasswordInput = overlay.querySelector("#mechanic-confirm-password");
    const message = overlay.querySelector("#mechanic-password-message");
    const closeButton = overlay.querySelector(".mechanic-profile-close");
    const close = () => {
      overlay.remove();
      document.getElementById("changeMechanicPasswordBtn")?.focus();
    };
    const setMessage = (text, isError = false) => {
      message.textContent = text;
      message.classList.toggle("is-error", isError);
      message.classList.toggle("is-success", Boolean(text) && !isError);
    };

    closeButton.addEventListener("click", close);
    overlay.querySelector(".mechanic-password-cancel").addEventListener("click", close);
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) close();
    });
    overlay.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        close();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = [...overlay.querySelectorAll("button, input")]
        .filter((element) => !element.disabled);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    form.addEventListener("input", () => setMessage(""));
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const currentPassword = currentPasswordInput.value;
      const newPassword = newPasswordInput.value;
      const confirmPassword = confirmPasswordInput.value;
      if (newPassword.length < 8) {
        setMessage("Your new password must be at least 8 characters long.", true);
        newPasswordInput.focus();
        return;
      }
      if (newPassword === currentPassword) {
        setMessage("Choose a new password that is different from your current password.", true);
        newPasswordInput.focus();
        return;
      }
      if (newPassword !== confirmPassword) {
        setMessage("The new password and confirmation do not match.", true);
        confirmPasswordInput.focus();
        return;
      }

      const usersRaw = localStorage.getItem("motofix_users");
      const employeesRaw = localStorage.getItem("motofix_master_employees");
      let users;
      let employees;
      try {
        users = usersRaw ? JSON.parse(usersRaw) : [];
        employees = employeesRaw ? JSON.parse(employeesRaw) : [];
      } catch {
        setMessage("Account data could not be read. Please contact an administrator.", true);
        return;
      }
      if (!Array.isArray(users) || !Array.isArray(employees)) {
        setMessage("Account data is not in the expected format. Please contact an administrator.", true);
        return;
      }

      const matchingUsers = users.filter(
        (account) => account && String(account.email || "").toLowerCase() === currentEmail,
      );
      const matchingEmployees = employees.filter(
        (account) => account && String(account.email || "").toLowerCase() === currentEmail,
      );
      const authAccount = matchingUsers[0];
      const credentialAccount = authAccount || matchingEmployees.find(
        (account) => typeof account.password === "string",
      );
      if (!credentialAccount) {
        setMessage("This account has no saved password to verify. Ask an administrator to update the account record first.", true);
        currentPasswordInput.focus();
        return;
      }
      if (credentialAccount.password !== currentPassword) {
        setMessage("The current password is incorrect.", true);
        currentPasswordInput.focus();
        return;
      }

      const accountSnapshot = JSON.stringify(users);
      const employeeSnapshot = JSON.stringify(employees);
      try {
        if (matchingUsers.length) {
          matchingUsers.forEach((account) => {
            account.password = newPassword;
            account.updated_at = new Date().toISOString();
          });
        } else {
          users.push({
            email: currentEmail,
            name: matchingEmployees[0]?.name || CURRENT_USER.name,
            role: "mechanic",
            password: newPassword,
            updated_at: new Date().toISOString(),
          });
        }
        matchingEmployees.forEach((account) => {
          account.password = newPassword;
          account.updated_at = new Date().toISOString();
        });

        localStorage.setItem("motofix_users", JSON.stringify(users));
        if (matchingEmployees.length) {
          localStorage.setItem("motofix_master_employees", JSON.stringify(employees));
        }
        form.reset();
        setMessage("Your password has been updated.", false);
      } catch (error) {
        try {
          localStorage.setItem("motofix_users", accountSnapshot);
          if (employeesRaw !== null) {
            localStorage.setItem("motofix_master_employees", employeeSnapshot);
          }
        } catch (rollbackError) {
          console.error("Unable to restore account data after a failed password update:", rollbackError);
        }
        console.error("Unable to save the mechanic password update:", error);
        setMessage("The password could not be saved. Please try again.", true);
      }
    });

    currentPasswordInput.focus();
  }

  // Mechanic Jobs is a role-filtered view of shared appointments; status writes
  // update the source record so Admin reports and Customer tracking stay consistent.
  function syncJobsFromSharedAppointments() {
    try {
      const stored = JSON.parse(
        localStorage.getItem("motofix_appointments") || "[]",
      );
      if (!Array.isArray(stored)) {
        jobs = [];
        return;
      }

      jobs = stored
        .filter((appointment) => appointment.mechanic === CURRENT_USER.name)
        .map((appointment) => ({
          id: appointment.id || "",
          customer: appointment.customer || "Customer",
          phone: appointment.phone || "N/A",
          initials:
            appointment.initials ||
            (appointment.customer || "C")
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase(),
          motorcycle:
            appointment.bike || appointment.motorcycle || "Unknown Motorcycle",
          plate: appointment.plate || null,
          services: Array.isArray(appointment.services)
            ? appointment.services
            : [appointment.services || "Service"],
          date: appointment.date || "",
          time: appointment.time || "",
          status: normalizeMechanicStatus(appointment.status),
          mechanic: appointment.mechanic || "Unassigned",
          notes: appointment.notes || null,
          serviceCost:
            parseStoredAmount(appointment.serviceCost) ??
            parseStoredAmount(appointment.transaction?.total) ??
            parseStoredAmount(appointment.total) ??
            parseStoredAmount(appointment.labor),
          record: appointment.record || null,
          createdAt: appointment.createdAt || null,
          parts: Array.isArray(appointment.parts) ? appointment.parts : [],
        }));
    } catch (error) {
      console.error(
        "Unable to sync mechanic jobs from shared appointments:",
        error,
      );
      jobs = [];
    }
  }

  // jobId is the shared appointment ID; notifications point back to that same record.
  function persistMechanicStatus(jobId, status) {
    const appointments = JSON.parse(
      localStorage.getItem("motofix_appointments") || "[]",
    );
    const appointment = appointments.find((item) => item.id === jobId);
    if (!appointment) return;

    const labels = {
      pending: "Pending",
      confirmed: "Confirmed",
      in_progress: "In Progress",
      completed: "Completed",
      cancelled: "Cancelled",
    };
    let inventoryDeducted = false;
    if (labels[status] === "Completed") {
      const inventoryUpdate = window.consumeAppointmentInventory(appointment);
      if (!inventoryUpdate.ok) {
        window.alert(inventoryUpdate.message);
        return false;
      }
      inventoryDeducted = inventoryUpdate.deducted;
    }
    appointment.status = labels[status] || status;
    localStorage.setItem("motofix_appointments", JSON.stringify(appointments));
    if (inventoryDeducted) {
      parts = readInventory();
      renderAll();
    }
    window.dispatchEvent(new Event("motofix:appointments-updated"));

    const notifications = JSON.parse(
      localStorage.getItem("motofix_notifications") || "[]",
    );
    notifications.unshift({
      id: `N${Date.now()}`,
      title: "Appointment status updated",
      message: `${appointment.id} is now ${appointment.status}.`,
      audiences: ["customer", "admin", "master_admin"],
      appointmentId: appointment.id,
      customerEmail: (appointment.customerEmail || "").toLowerCase(),
      mechanicName: CURRENT_USER.name,
      mechanicEmail: CURRENT_USER.email,
      createdAt: new Date().toISOString(),
      readBy: [],
    });
    localStorage.setItem(
      "motofix_notifications",
      JSON.stringify(notifications.slice(0, 100)),
    );
    window.dispatchEvent(new Event("motofix:notifications-changed"));
  }

  function renderMechanicNotifications() {
    if (!window.MotoFixNotifications) {
      console.error("The shared notification panel could not be initialized.");
      return;
    }

    window.MotoFixNotifications.init({
      buttonId: "bellBtn",
      panelId: "notifPanel",
      role: "mechanic",
      email: CURRENT_USER.email,
      name: CURRENT_USER.name,
      onOpen: (notification) => {
        syncJobsFromSharedAppointments();
        const appointmentId = String(notification.appointmentId || "");
        const job = jobs.find(
          (item) =>
            String(item.apptRef || item.id) === appointmentId ||
            String(item.id) === appointmentId,
        );
        if (job) openJobDetails(job);
        else renderJobs();
      },
    });
  }

  window.addEventListener("storage", (event) => {
    if (event.key === "motofix_notifications") renderMechanicNotifications();
    if (
      event.key === "motofix_appointments" ||
      event.key === INVENTORY_KEY
    ) {
      renderAll();
    }
  });
  window.addEventListener("focus", () => renderAll());
  window.addEventListener("motofix:inventory-updated", () => {
    parts = readInventory();
    renderInventory();
  });

  const INVENTORY_KEY = "motofix_parts";
  function readInventory() {
    return readStoredArray(INVENTORY_KEY).map((part) => ({
      ...part,
      cat: part.category || part.cat || "Uncategorized",
      stock: Number(part.stock) || 0,
      price: Number(part.price) || 0,
    }));
  }
  let parts = readInventory();

  let apptStatusFilter = "all";
  let apptSearchTerm = "";
  let jobsSearchTerm = "";
  let jobsStatusFilter = "all";
  let jobsScheduleFilter = "all";
  let invCatFilter = "All";
  let invSearchTerm = "";

  /* ---------------- Helpers ---------------- */
  const fmtDate = (iso) => {
    const d = new Date(iso + "T00:00:00");
    return d
      .toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
      .replace(/\//g, "-")
      .split("-")
      .reverse()
      .join("-") === iso
      ? iso
      : iso;
  };
  const parseStoredAmount = (value) => {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : null;
    }
    const normalized = String(value ?? "").replace(/[^0-9.-]/g, "");
    if (!normalized) return null;
    const amount = Number(normalized);
    return Number.isFinite(amount) ? amount : null;
  };
  const peso = (n) =>
    "₱" +
    (parseStoredAmount(n) ?? 0).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const escapeHtml = (s) =>
    (s || "").replace(
      /[&<>"']/g,
      (m) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[m],
    );

  function badge(status) {
    return `<span class="badge ${status}">${STATUS_LABEL[status]}</span>`;
  }

  function nextStatus(s) {
    const i = STATUS_ORDER.indexOf(s);
    if (i === -1 || i === STATUS_ORDER.length - 1) return null;
    return STATUS_ORDER[i + 1];
  }

  /* ---------------- Renderers ---------------- */
  function statCard(label, value, iconSvg, colorClass, isCurrency) {
    return `
      <div class="stat-card">
        <div class="stat-top">
          <div class="stat-label">${label}</div>
          <div class="stat-icon ${colorClass}">${iconSvg}</div>
        </div>
        <div class="stat-value">${isCurrency ? `<span class="cur">₱</span>${Number(value).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : value}</div>
      </div>`;
  }

  const ICONS = {
    calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="16" rx="2"></rect><path d="M3 9.5h18M8 3v3M16 3v3"></path></svg>`,
    progress: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>`,
    check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M8.5 12.5l2.5 2.5 5-5.5"></path></svg>`,
    cash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="12" cy="12" r="3"></circle></svg>`,
    clipboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="17" rx="2"></rect><path d="M9 3h6v3H9zM8 11h8M8 15h5"></path></svg>`,
  };

  function renderDashboard() {
    const todaysJobs = jobs.filter((j) => j.date === TODAY);
    const inProgress = jobs.filter((j) => j.status === "in_progress");
    const completed = jobs.filter((j) => j.status === "completed");
    const monthServiceCost = jobs
      .filter((j) => j.status === "completed")
      .reduce((s, j) => s + (j.serviceCost || 0), 0);

    document.getElementById("dashStats").innerHTML = [
      statCard("Today's Jobs", todaysJobs.length, ICONS.calendar, "orange"),
      statCard("In Progress", inProgress.length, ICONS.progress, "blue"),
      statCard("Completed", completed.length, ICONS.check, "green"),
      statCard("This Month Service Cost", monthServiceCost, ICONS.cash, "amber", true),
    ].join("");

    const box = document.getElementById("todaySchedule");
    if (todaysJobs.length === 0) {
      box.innerHTML = emptyState(
        "No jobs scheduled today",
        "Enjoy the downtime — check Appointments for what's coming up.",
      );
      return;
    }
    box.innerHTML = todaysJobs
      .map(
        (j) => `
      <div class="sched-item">
        <div class="sched-time">${j.time}</div>
        <div class="sched-main">
          <div class="c-name">${escapeHtml(j.customer)}</div>
          <div class="c-bike">${escapeHtml(j.motorcycle)}${j.plate ? " · " + escapeHtml(j.plate) : ""}</div>
          <div class="c-service">${j.services.map(escapeHtml).join(", ")}</div>
          ${
            j.notes
              ? `<div class="c-warn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"></path></svg>
            ${escapeHtml(j.notes)}
          </div>`
              : ""
          }
        </div>
        ${badge(j.status)}
      </div>
    `,
      )
      .join("");
  }

  function emptyState(title, sub) {
    return `<div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M9 10h.01M15 10h.01M8 15c1 1.2 2.4 2 4 2s3-.8 4-2"></path></svg>
      <div class="e-title">${title}</div>
      <div class="e-sub">${sub}</div>
    </div>`;
  }

  function renderJobs() {
    const mine = jobs.filter((j) => j.mechanic === CURRENT_USER.name);
    const assigned = mine.filter((j) => j.status !== "completed");
    const inProgress = mine.filter((j) => j.status === "in_progress").length;
    const completedToday = mine.filter(
      (j) => j.status === "completed" && j.date === TODAY,
    ).length;
    const completedServiceCost = mine
      .filter((j) => j.status === "completed")
      .reduce((s, j) => s + (j.serviceCost || 0), 0);

    document.getElementById("jobsStats").innerHTML = [
      statCard("Assigned Jobs", assigned.length, ICONS.clipboard, "blue"),
      statCard("In Progress", inProgress, ICONS.progress, "orange"),
      statCard("Completed Today", completedToday, ICONS.check, "green"),
      statCard("Completed Service Cost", completedServiceCost, ICONS.cash, "amber", true),
    ].join("");

    const today = new Date().toISOString().slice(0, 10);
    const query = jobsSearchTerm.trim().toLowerCase();
    const visibleJobs = assigned.filter((job) => {
      const searchable = [
        job.customer,
        job.motorcycle,
        ...(job.services || []),
        job.id,
      ]
        .join(" ")
        .toLowerCase();
      const matchesSearch = !query || searchable.includes(query);
      const matchesStatus =
        jobsStatusFilter === "all" || job.status === jobsStatusFilter;
      const matchesSchedule =
        jobsScheduleFilter === "all" ||
        (jobsScheduleFilter === "today" && job.date === today) ||
        (jobsScheduleFilter === "upcoming" && job.date >= today) ||
        (jobsScheduleFilter === "past" && job.date < today);
      return matchesSearch && matchesStatus && matchesSchedule;
    });

    document.getElementById("jobsCount").textContent = visibleJobs.length;
    document.getElementById("jobsFilterSummary").textContent =
      `${visibleJobs.length} of ${assigned.length} assigned jobs`;
    document.getElementById("jobsTableBody").innerHTML = visibleJobs.length
      ? visibleJobs
          .map(
            (j) => `
      <tr class="job-details-trigger" data-job-details="${escapeHtml(j.id)}" tabindex="0" aria-label="View details for ${escapeHtml(j.customer)}">
        <td>
          <div class="cust-cell">
            <div class="init">${j.initials}</div>
            <div><div class="c-name">${escapeHtml(j.customer)}</div><div class="c-phone">${j.phone}</div></div>
          </div>
        </td>
        <td>${escapeHtml(j.motorcycle)}</td>
        <td>${j.services.map((s) => `<span class="svc-line">${escapeHtml(s)}</span>`).join("")}</td>
        <td><div class="dt-cell"><div class="d">${j.date}</div><div class="t">${j.time}</div></div></td>
        <td>${badge(j.status)}</td>
        <td class="${j.notes ? "note-warn" : "note-dim"}">${j.notes ? escapeHtml(j.notes) : "—"}</td>
      </tr>
    `,
          )
          .join("")
      : `<tr><td colspan="6" class="jobs-empty-row">No jobs match the selected filters.</td></tr>`;

    const records = mine.filter((j) => j.status === "completed");
    const recBox = document.getElementById("jobRecords");
    if (records.length === 0) {
      recBox.innerHTML = emptyState(
        "No job records yet",
        "Jobs marked completed by the admin will show up here.",
      );
    } else {
      recBox.innerHTML = records
        .map(
          (j) => `
        <div class="record-card job-details-trigger" data-job-details="${escapeHtml(j.id)}" tabindex="0" role="button" aria-label="View details for completed job ${escapeHtml(j.id)}">
          <div class="record-top">
            <div>
              <div class="record-id">${j.id}</div>
              <div class="record-name">${escapeHtml(j.customer)}</div>
            </div>
            <div style="text-align:right">
              ${badge(j.status)}
              ${j.serviceCost !== null ? `<div class="record-labor">${peso(j.serviceCost)} Service Cost</div>` : ""}
            </div>
          </div>
          <div class="record-note">${escapeHtml(j.record || `Completed services: ${j.services.join(", ")}`)}</div>
        </div>
      `,
        )
        .join("");
    }
  }

  function openJobDetails(job) {
    const existing = document.getElementById("jobDetailsModal");
    if (existing) existing.remove();
    const bookedAt = job.createdAt
      ? new Date(job.createdAt).toLocaleString("en-PH", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "Not available for this legacy booking";
    const parts = job.parts?.length
      ? job.parts
          .map((part) => `${escapeHtml(part.name)} x${part.quantity || 1}`)
          .join(", ")
      : "No parts requested";
    const modal = document.createElement("div");
    modal.id = "jobDetailsModal";
    modal.className = "job-details-backdrop";
    modal.innerHTML = `
      <section class="job-details-modal" role="dialog" aria-modal="true" aria-labelledby="jobDetailsTitle">
        <div class="job-details-head"><div><div class="job-details-kicker">Appointment ${escapeHtml(job.id)}</div><h2 id="jobDetailsTitle">${escapeHtml(job.customer)}</h2></div><button class="job-details-close" type="button" aria-label="Close details">&times;</button></div>
        <div class="job-details-grid">
          <div><span>Customer</span><strong>${escapeHtml(job.customer)}</strong><small>${escapeHtml(job.phone)}</small></div>
          <div><span>Assigned mechanic</span><strong>${escapeHtml(job.mechanic)}</strong></div>
          <div><span>Motorcycle</span><strong>${escapeHtml(job.motorcycle)}</strong></div>
          <div><span>Appointment status</span><strong>${badge(job.status)}</strong></div>
          <div><span>Scheduled date</span><strong>${escapeHtml(job.date || "Not set")}</strong></div>
          <div><span>Scheduled time</span><strong>${escapeHtml(job.time || "Not set")}</strong></div>
          <div class="full"><span>Booked by customer</span><strong>${escapeHtml(bookedAt)}</strong></div>
          <div class="full"><span>Service requested</span><strong>${job.services.map((service) => escapeHtml(service)).join(", ")}</strong></div>
          <div class="full"><span>Parts requested</span><strong>${parts}</strong></div>
          <div class="full"><span>Job record</span><strong>${escapeHtml(job.record || (job.status === "completed" ? `Completed services: ${job.services.join(", ")}` : "No completion record yet"))}</strong></div>
          <div><span>Service cost</span><strong>${job.serviceCost !== null ? escapeHtml(peso(job.serviceCost)) : "Not recorded"}</strong></div>
          <div class="full"><span>Notes</span><strong>${escapeHtml(job.notes || "No notes provided")}</strong></div>
        </div>
      </section>`;
    document.body.appendChild(modal);
    const close = () => modal.remove();
    modal.querySelector(".job-details-close").addEventListener("click", close);
    modal.addEventListener("click", (event) => {
      if (event.target === modal) close();
    });
  }

  function renderAppointments() {
    let list = jobs.slice();
    if (apptStatusFilter !== "all")
      list = list.filter((j) => j.status === apptStatusFilter);
    if (apptSearchTerm.trim()) {
      const q = apptSearchTerm.toLowerCase();
      list = list.filter(
        (j) =>
          j.customer.toLowerCase().includes(q) ||
          j.motorcycle.toLowerCase().includes(q) ||
          j.services.join(" ").toLowerCase().includes(q) ||
          j.id.toLowerCase().includes(q),
      );
    }

    const body = document.getElementById("apptTableBody");
    const emptyBox = document.getElementById("apptEmpty");

    if (list.length === 0) {
      body.innerHTML = "";
      emptyBox.innerHTML = emptyState(
        "No appointments found",
        "Try a different search term or filter.",
      );
      return;
    }
    emptyBox.innerHTML = "";

    body.innerHTML = list
      .map((j) => {
        return `
      <tr class="job-details-trigger" data-job-details="${escapeHtml(j.id)}" tabindex="0" aria-label="View details for ${escapeHtml(j.customer)}">
        <td class="sku-tag">${escapeHtml(j.id)}</td>
          <td>
            <div class="cust-cell">
              <div class="init">${j.initials}</div>
              <div><div class="c-name">${escapeHtml(j.customer)}</div><div class="c-phone">${j.phone}</div></div>
            </div>
          </td>
          <td>${escapeHtml(j.motorcycle)}</td>
          <td>${j.services.map((s) => `<span class="svc-line">${escapeHtml(s)}</span>`).join("")}</td>
          <td><div class="dt-cell"><div class="d">${j.date}</div><div class="t">${j.time}</div></div></td>
          <td>${escapeHtml(j.mechanic)}</td>
          <td>${badge(j.status)}</td>
        </tr>`;
      })
      .join("");
  }

  function renderInventory() {
    parts = readInventory();
    let list = parts.slice();
    if (invCatFilter !== "All")
      list = list.filter((p) => p.cat === invCatFilter);
    if (invSearchTerm.trim()) {
      const q = invSearchTerm.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q),
      );
    }

    const body = document.getElementById("invTableBody");
    const emptyBox = document.getElementById("invEmpty");

    if (list.length === 0) {
      body.innerHTML = "";
      emptyBox.innerHTML = emptyState(
        "No parts found",
        "Try a different search term or category.",
      );
      return;
    }
    emptyBox.innerHTML = "";

    const maxStock = Math.max(1, ...list.map((part) => Number(part.max || part.stock || 1)));
    body.innerHTML = list
      .map((p) => {
        const pct = Math.min(100, Math.round((p.stock / maxStock) * 100));
        const low = p.stock <= Number(p.reorderLevel ?? 10);
        return `
        <tr>
          <td style="font-weight:600">${escapeHtml(p.name)}</td>
          <td class="sku-tag">${p.sku}</td>
          <td>${escapeHtml(p.brand)}</td>
          <td>${escapeHtml(p.cat)}</td>
          <td>
            <div class="stock-cell">
              <div class="stock-bar ${low ? "low" : ""}"><span style="width:${pct}%"></span></div>
              <div class="stock-num">${p.stock}</div>
            </div>
          </td>
          <td class="price-tag">₱${p.price.toFixed(2)}</td>
          <td><span class="status-dot-badge">Active</span></td>
        </tr>`;
      })
      .join("");
  }

  /* ---------------- View switching ---------------- */
  const views = {
    dashboard: "view-dashboard",
    jobs: "view-jobs",
    appointments: "view-appointments",
    inventory: "view-inventory",
  };
  const titles = {
    dashboard: [
      "Dashboard",
      `Welcome back, ${CURRENT_USER.name.split(" ")[0]}`,
    ],
    jobs: ["My Jobs", "Your assigned work queue"],
    appointments: ["Appointments", "Manage service scheduling"],
    inventory: ["Inventory & Parts", "Parts catalog and stock management"],
  };

    function renderAll() {
    syncJobsFromSharedAppointments();
    renderDashboard();
    renderJobs();
    renderAppointments();
    renderInventory();
  }

  function goTo() {
    document
      .querySelectorAll(".view")
      .forEach((v) => v.classList.add("active"));
    document.getElementById("pageTitle").textContent = "Dashboard";
    document.getElementById("pageSubtitle").textContent =
      `Welcome back, ${CURRENT_USER.name.split(" ")[0]}`;
    document.getElementById("app").classList.remove("mobile-open");
    syncSidebarScrim();
    renderAll();
  }

   const navEl = document.getElementById("nav");
  if (navEl) navEl.style.display = "none";

  /* ---------------- Sidebar toggle ---------------- */
  const app = document.getElementById("app");
  if (window.innerWidth > 860) app.classList.add("collapsed");
  const syncSidebarScrim = () => {
    const isOpen = window.innerWidth <= 860
      ? app.classList.contains("mobile-open")
      : !app.classList.contains("collapsed");
    app.classList.toggle("sidebar-dimmed", isOpen);
  };
  syncSidebarScrim();

  document.getElementById("menuToggle").addEventListener("click", () => {
    if (window.innerWidth <= 860) {
      app.classList.toggle("mobile-open");
    } else {
      app.classList.toggle("collapsed");
    }
    syncSidebarScrim();
  });
  document.getElementById("scrim").addEventListener("click", () => {
    if (window.innerWidth <= 860) {
      app.classList.remove("mobile-open");
    } else {
      app.classList.add("collapsed");
    }
    syncSidebarScrim();
  });
  window.addEventListener("resize", syncSidebarScrim);

  /* ---------------- User dropdown ---------------- */
  const userTrigger = document.getElementById("userTrigger");
  const userMenu = document.getElementById("userMenu");
  const closeUserMenu = () => {
    userMenu.classList.remove("open");
    userTrigger.setAttribute("aria-expanded", "false");
  };
  userTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpening = !userMenu.classList.contains("open");
    userMenu.classList.toggle("open", isOpening);
    userTrigger.setAttribute("aria-expanded", String(isOpening));
    const notificationPanel = document.getElementById("notifPanel");
    if (isOpening && notificationPanel) {
      notificationPanel.hidden = true;
      document.getElementById("bellBtn")?.setAttribute("aria-expanded", "false");
    }
  });
  document.getElementById("editMechanicProfileBtn")?.addEventListener("click", (event) => {
    event.stopPropagation();
    closeUserMenu();
    openMechanicProfileEditor();
  });
  document.getElementById("changeMechanicPasswordBtn")?.addEventListener("click", (event) => {
    event.stopPropagation();
    closeUserMenu();
    openMechanicPasswordEditor();
  });
  document.getElementById("signOutBtn").addEventListener("click", () => {
    closeUserMenu();
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");
    window.location.href = "../../login.html";
  });

  /* ---------------- Notifications ---------------- */
  renderMechanicNotifications();
  document.getElementById("bellBtn").addEventListener("click", () => {
    closeUserMenu();
  });

  document.addEventListener("click", (event) => {
    if (!userMenu.contains(event.target)) closeUserMenu();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeUserMenu();
  });

  /* ---------------- Appointments filters ---------------- */
  document.getElementById("apptFilters").addEventListener("click", (e) => {
    const pill = e.target.closest(".pill");
    if (!pill) return;
    document
      .querySelectorAll("#apptFilters .pill")
      .forEach((p) => p.classList.remove("active"));
    pill.classList.add("active");
    apptStatusFilter = pill.dataset.status || "all";
    renderAppointments();
  });
  document.getElementById("apptSearch").addEventListener("input", (e) => {
    apptSearchTerm = e.target.value;
    renderAppointments();
  });

  document.getElementById("jobsSearch").addEventListener("input", (e) => {
    jobsSearchTerm = e.target.value;
    renderJobs();
  });
  document
    .getElementById("jobsStatusFilter")
    .addEventListener("change", (e) => {
      jobsStatusFilter = e.target.value;
      renderJobs();
    });
  document
    .getElementById("jobsScheduleFilter")
    .addEventListener("change", (e) => {
      jobsScheduleFilter = e.target.value;
      renderJobs();
    });

  /* ---------------- Inventory filters ---------------- */
  document.getElementById("invFilters").addEventListener("click", (e) => {
    const pill = e.target.closest(".pill");
    if (!pill) return;
    document
      .querySelectorAll("#invFilters .pill")
      .forEach((p) => p.classList.remove("active"));
    pill.classList.add("active");
    invCatFilter = pill.dataset.cat;
    renderInventory();
  });
  document.getElementById("invSearch").addEventListener("input", (e) => {
    invSearchTerm = e.target.value;
    renderInventory();
  });

  /* ---------------- Init ---------------- */
  syncJobsFromSharedAppointments();
  document.getElementById("sideAvatar").textContent = CURRENT_USER.initials;
  document.getElementById("sideName").textContent = CURRENT_USER.name;
  document.getElementById("topAvatar").textContent = CURRENT_USER.initials;
  document.getElementById("userDisplayName").textContent = CURRENT_USER.name;
  document.getElementById("userDisplayEmail").textContent = CURRENT_USER.email;
  goTo("dashboard");
})();
