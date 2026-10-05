// js/appointments.js
const APPOINTMENT_STORE_KEY = "motofix_appointments";
const NOTIFICATION_STORE_KEY = "motofix_notifications";

// This is the shared appointment/job record used by Customer, Admin/Master Admin,
// Mechanic, and Customer transactions. Keep its id and customerEmail stable across
// edits; mechanic assignment is currently stored as a mechanic name.
const FALLBACK_MECHANICS = [
  { email: "mechanic1@motofix.com", name: "Ramon Santos" },
  { email: "mechanic2@motofix.com", name: "Jake Reyes" },
];

const DAILY_MAX_BOOKINGS = 5; // Pinakamataas na booking bawat araw

function addSharedNotification(title, message, audiences, appointmentId = null) {
  // Notifications route by audience plus the source appointment ID, not by message text.
  const current = JSON.parse(
    localStorage.getItem(NOTIFICATION_STORE_KEY) || "[]",
  );
  current.unshift({
    id: `N${Date.now()}`,
    title,
    message,
    audiences,
    ...(appointmentId ? { appointmentId } : {}),
    ...(appointmentId ? { destination: "appointments" } : {}),
    createdAt: new Date().toISOString(),
    readBy: [],
  });
  localStorage.setItem(
    NOTIFICATION_STORE_KEY,
    JSON.stringify(current.slice(0, 100)),
  );
  window.dispatchEvent(new Event("motofix:notifications-updated"));
}

function readStoredAppointments() {
  try {
    const raw = localStorage.getItem(APPOINTMENT_STORE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
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

function writeStoredAppointments(appointments) {
  // The update event lets other dashboard modules refresh their views of the same records.
  localStorage.setItem(APPOINTMENT_STORE_KEY, JSON.stringify(appointments));
  window.dispatchEvent(new Event("motofix:appointments-updated"));
}

function getMechanicAccounts() {
  const profiles = (() => {
    try {
      const parsed = JSON.parse(localStorage.getItem("motofix_profiles") || "{}");
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  })();
  const accounts = [
    ...readStoredArray("motofix_users"),
    ...readStoredArray("motofix_master_employees"),
  ];
  const mechanics = [];
  const seenNames = new Set();
  const seenEmails = new Set();

  accounts.forEach((account) => {
    if (String(account.role || "").toLowerCase() !== "mechanic") return;
    if (["inactive", "deactivated", "disabled"].includes(String(account.status || "Active").toLowerCase())) return;
    const email = String(account.email || "").trim().toLowerCase();
    const profile = profiles[email] || {};
    const name = String(
      profile.name ||
        account.name ||
        [account.first_name, account.middle_name, account.last_name].filter(Boolean).join(" "),
    ).trim();
    const normalizedName = name.toLowerCase();
    if (!name || seenNames.has(normalizedName) || (email && seenEmails.has(email))) return;
    seenNames.add(normalizedName);
    if (email) seenEmails.add(email);
    mechanics.push({ name, email });
  });

  FALLBACK_MECHANICS.forEach((mechanic) => {
    if (seenEmails.has(mechanic.email)) return;
    const accountExists = accounts.some(
      (account) => String(account.email || "").trim().toLowerCase() === mechanic.email,
    );
    if (!accountExists && !seenNames.has(mechanic.name.toLowerCase())) {
      mechanics.push(mechanic);
      seenNames.add(mechanic.name.toLowerCase());
    }
  });

  return mechanics;
}

function appointmentStatusClass(status) {
  return String(status || "Pending").toLowerCase().replace(/\s+/g, "-");
}

function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>'"]/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[character],
  );
}

function canonicalAppointmentStatus(value) {
  const status = String(value || "Pending").trim();
  const aliases = {
    "complete transaction": "Completed",
    completed: "Completed",
    "work finished (unpaid)": "Unpaid",
  };
  return aliases[status.toLowerCase()] || status;
}

function openCustomerAppointmentDetails(appointmentId) {
  const appointment = readStoredAppointments().find(
    (item) => String(item.id) === String(appointmentId),
  );
  if (!appointment) return;

  const services = Array.isArray(appointment.services)
    ? appointment.services
    : [appointment.services || "Service"];
  const parts = Array.isArray(appointment.parts) && appointment.parts.length
    ? appointment.parts
        .map((part) => `${part.name || "Part"} × ${Number(part.quantity) || 1}`)
        .join(", ")
    : "No parts requested";
  const totalValue = appointment.transaction?.total ?? appointment.total;
  const totalNumber = Number(String(totalValue ?? "").replace(/[^\d.-]/g, ""));
  const total = totalValue != null && String(totalValue).trim() && Number.isFinite(totalNumber)
    ? `₱${totalNumber.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "Not available";
  const existing = document.getElementById("sc-appointment-details-overlay");
  existing?.remove();

  const overlay = document.createElement("div");
  overlay.id = "sc-appointment-details-overlay";
  overlay.className = "sc-modal-overlay";
  overlay.innerHTML = `
    <section class="sc-modal-card" role="dialog" aria-modal="true" aria-labelledby="sc-appointment-details-title">
      <div class="sc-modal-header">
        <h2 id="sc-appointment-details-title">Appointment Details</h2>
        <button type="button" class="sc-modal-close" aria-label="Close appointment details">&times;</button>
      </div>
      <div class="sc-modal-body">
        <div class="sc-success-details">
          <div><span>Reference</span><strong>${escapeHtml(appointment.id)}</strong></div>
          <div><span>Status</span><strong>${escapeHtml(canonicalAppointmentStatus(appointment.status))}</strong></div>
          <div><span>Customer</span><strong>${escapeHtml(appointment.customer || "Customer")}</strong></div>
          <div><span>Motorcycle</span><strong>${escapeHtml(appointment.bike || "Unknown Motorcycle")}</strong></div>
          <div><span>Date</span><strong>${escapeHtml(appointment.date || "Not set")}</strong></div>
          <div><span>Time</span><strong>${escapeHtml(appointment.time || "Not set")}</strong></div>
          <div><span>Mechanic</span><strong>${escapeHtml(appointment.mechanic || "Unassigned")}</strong></div>
          <div><span>Estimated total</span><strong>${escapeHtml(total)}</strong></div>
        </div>
        <div class="sc-success-services">
          <div class="sc-success-section-title">Services requested</div>
          ${services.map((service) => `<div class="sc-success-service"><span>${escapeHtml(service)}</span></div>`).join("")}
        </div>
        <div class="sc-success-notes">
          <span>Parts requested</span>
          <p>${escapeHtml(parts)}</p>
        </div>
        <div class="sc-success-notes">
          <span>Notes</span>
          <p>${escapeHtml(appointment.notes || "No special requests provided.")}</p>
        </div>
      </div>
    </section>`;

  const closeOnEscape = (event) => {
    if (event.key === "Escape") close();
  };
  const close = () => {
    overlay.remove();
    document.removeEventListener("keydown", closeOnEscape);
  };
  overlay.querySelector(".sc-modal-close").addEventListener("click", close);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) close();
  });
  document.addEventListener("keydown", closeOnEscape);
  document.body.appendChild(overlay);
  overlay.querySelector(".sc-modal-close").focus();
}

function showBookingSuccess(appointment, serviceItems, total) {
  const existing = document.getElementById("sc-booking-success-overlay");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "sc-booking-success-overlay";
  overlay.className = "sc-modal-overlay sc-booking-success-overlay";
  overlay.innerHTML = `
    <div class="sc-modal-card sc-success-card" role="dialog" aria-modal="true" aria-labelledby="sc-success-title">
      <div class="sc-success-icon" aria-hidden="true">&#10003;</div>
      <div class="sc-success-heading">
        <p class="sc-success-eyebrow">Booking confirmed</p>
        <h2 id="sc-success-title">Your appointment is booked</h2>
        <p class="sc-success-message">Thank you, ${escapeHtml(appointment.customer)}. We have received your service request.</p>
      </div>
      <div class="sc-success-reference">
        <span>Booking reference</span>
        <strong>${escapeHtml(appointment.id)}</strong>
      </div>
      <div class="sc-success-details">
        <div><span>Customer</span><strong>${escapeHtml(appointment.customer)}</strong></div>
        <div><span>Motorcycle</span><strong>${escapeHtml(appointment.bike)}</strong></div>
        <div><span>Date</span><strong>${escapeHtml(appointment.date)}</strong></div>
        <div><span>Time</span><strong>${escapeHtml(appointment.time)}</strong></div>
        <div><span>Mechanic</span><strong>${escapeHtml(appointment.mechanic || "Unassigned")}</strong></div>
        <div><span>Status</span><strong class="sc-success-status">Pending</strong></div>
      </div>
      <div class="sc-success-services">
        <div class="sc-success-section-title">Services requested</div>
        ${serviceItems.map((item) => `<div class="sc-success-service"><span>${escapeHtml(item.name)}</span><strong>${item.price}</strong></div>`).join("")}
        <div class="sc-success-total"><span>Estimated service total</span><strong>${total}</strong></div>
      </div>
      <div class="sc-success-notes">
        <span>Notes</span>
        <p>${escapeHtml(appointment.notes || "No special requests provided.")}</p>
      </div>
      <button type="button" class="sc-submit-btn sc-success-done">Done</button>
    </div>`;

  const close = () => overlay.remove();
  overlay.querySelector(".sc-success-done").addEventListener("click", close);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) close();
  });
  document.body.appendChild(overlay);
}

function showBookingError(message) {
  let errorBox = document.getElementById("sc-booking-error");
  if (!errorBox) {
    errorBox = document.createElement("div");
    errorBox.id = "sc-booking-error";
    errorBox.className = "sc-booking-error";
    const submitButton = document.getElementById("sc-submit-appointment");
    submitButton?.parentElement?.insertBefore(errorBox, submitButton);
  }
  errorBox.textContent = message;
  errorBox.hidden = false;
}

function getCustomerProfile() {
  const email = (localStorage.getItem("userEmail") || "").trim().toLowerCase();
  const profiles = {
    "jose@email.com": { name: "Jose Bautista", phone: "+63 912 100 0002", initials: "JB" },
    "miguel@email.com": { name: "Miguel Torres", phone: "+63 912 100 0001", initials: "MT" },
    "ana@email.com": { name: "Ana Flores", phone: "+63 912 100 0003", initials: "AF" },
    "admin@motofix.com": { name: "Carlos Reyes", phone: "+63 912 000 0001", initials: "CR" },
    "mechanic1@motofix.com": { name: "Ramon Santos", phone: "+63 912 000 0002", initials: "RS" },
  };

  let registeredUser = null;
  let saved = null;
  try {
    const users = JSON.parse(localStorage.getItem("motofix_users") || "[]");
    registeredUser = Array.isArray(users)
      ? users.find((user) => user.email?.trim().toLowerCase() === email)
      : null;
    saved = JSON.parse(localStorage.getItem("motofix_profiles") || "{}")[email];
  } catch (error) {
    console.error("Unable to load customer profile:", error);
  }
  const base = profiles[email] || {
    name: registeredUser?.name || localStorage.getItem("userFullName") || "Customer",
    phone: registeredUser?.phone || "+63 912 100 0000",
    initials: registeredUser?.initials || "CU",
  };

  const name = saved?.name || base.name;
  return {
    name,
    phone: saved?.phone || base.phone,
    initials:
      name.split(" ").filter(Boolean).map((p) => p[0]).join("").slice(0, 2).toUpperCase() ||
      base.initials,
  };
}

function renderStoredAppointments() {
  const tbody = document.getElementById("sc-appointments-tbody");
  if (!tbody) return;

  const customerProfile = getCustomerProfile();
  const currentEmail = (localStorage.getItem("userEmail") || "").trim().toLowerCase();
  const storedAppointments = readStoredAppointments().filter(
    (appointment) =>
      (appointment.customerEmail || "").trim().toLowerCase() === currentEmail ||
      (!appointment.customerEmail &&
        customerProfile.name.trim().toLowerCase() !== "customer" &&
        appointment.customer === customerProfile.name),
  );
  tbody.innerHTML = storedAppointments.length
    ? storedAppointments
        .map((appointment) => {
            const mechanic = appointment.mechanic || "Unassigned";
             const status = canonicalAppointmentStatus(appointment.status);
          return `
              <tr class="sc-appointment-row" data-status="${escapeHtml(status)}" data-appointment-id="${escapeHtml(appointment.id)}" tabindex="0" role="button" aria-label="View details for appointment ${escapeHtml(appointment.id)}">
                <td class="sc-id-col">${escapeHtml(appointment.id)}</td>
                    <td>
                        <div class="sc-customer-info">
                    <div class="sc-avatar">${escapeHtml(appointment.initials || "CU")}</div>
                            <div>
                      <div class="sc-cust-name">${escapeHtml(appointment.customer || "Customer")}</div>
                      <div class="sc-cust-phone">${escapeHtml(appointment.phone || "N/A")}</div>
                            </div>
                        </div>
                    </td>
                <td>${escapeHtml(appointment.bike || "Unknown Motorcycle")}</td>
                    <td>
                  <div class="sc-service-tags">${(Array.isArray(appointment.services) ? appointment.services : [appointment.services || "Service"]).map(escapeHtml).join("<br>")}</div>
                    </td>
                    <td>
                  <div class="sc-datetime">${escapeHtml(appointment.date || "Not set")}<br><span>${escapeHtml(appointment.time || "--:--")}</span></div>
                    </td>
                <td>${mechanic === "Unassigned" ? '<span class="sc-unassigned">Unassigned</span>' : escapeHtml(mechanic)}</td>
                <td><span class="status-badge status-${appointmentStatusClass(status)}">${escapeHtml(status)}</span></td>
                </tr>
            `;
        })
        .join("")
    : "";

  tbody.querySelectorAll(".sc-appointment-row").forEach((row) => {
    const showDetails = () =>
      openCustomerAppointmentDetails(row.dataset.appointmentId);
    row.addEventListener("click", showDetails);
    row.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      showDetails();
    });
  });
}

function renderPendingParts() {
  const box = document.getElementById("sc-selected-parts");
  if (!box) return;

  let parts = [];
  try {
    parts = JSON.parse(localStorage.getItem("motofix_pending_parts") || "[]");
  } catch {
    parts = [];
  }

  if (!parts.length) {
    box.innerHTML = `<div style="padding:10px;color:#9a9a9a;">No parts selected. Pick parts in Parts &amp; Shop.</div>`;
    return;
  }

  const money = (n) =>
    `₱${Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
  const subtotal = parts
    .filter((p) => p.source === "buy")
    .reduce((sum, p) => sum + p.price * p.quantity, 0);

  box.innerHTML =
    parts
      .map(
        (p) => `
      <div class="sc-service-item">
        <div class="sc-service-info">
          <span>${escapeHtml(p.name)} × ${p.quantity}</span>
          <span class="sc-price">${p.source === "buy" ? money(p.price * p.quantity) : "Bringing own"}</span>
        </div>
      </div>`
      )
      .join("") +
    `<div class="sc-service-item">
       <div class="sc-service-info">
         <span><strong>Parts subtotal</strong></span>
         <span class="sc-price">${money(subtotal)}</span>
       </div>
     </div>`;
}

// Function para i-update ang Mechanic Select options batay sa Petsa at Oras
function updateMechanicAvailabilityOptions() {
  const mechanicSelect = document.getElementById("sc-mechanic-select");

  if (!mechanicSelect) return;

  const selectedMechanic = mechanicSelect.value;
  const appointments = readStoredAppointments();

  mechanicSelect.innerHTML = `<option value="Unassigned">Any Available Mechanic (Auto-assign)</option>`;

  getMechanicAccounts().forEach((mechanic) => {
    const isBusy = appointments.some((appointment) => {
      if (appointment.mechanic !== mechanic.name) return false;
      const status = canonicalAppointmentStatus(appointment.status);
      if (["Cancelled", "Completed", "Unpaid"].includes(status)) return false;
      return true;
    });

    const option = document.createElement("option");
    option.value = mechanic.name;
    if (isBusy) {
      option.textContent = `${mechanic.name} (Unavailable)`;
      option.disabled = true;
    } else {
      option.textContent = `${mechanic.name} (Available)`;
    }
    mechanicSelect.appendChild(option);
  });

  if (Array.from(mechanicSelect.options).some((option) => option.value === selectedMechanic)) {
    mechanicSelect.value = selectedMechanic;
  }
}

export function initAppointments() {
  renderStoredAppointments();
  renderPendingParts();
  window.addEventListener("motofix:open-customer-appointment", (event) => {
    // navigation.js sends this event with the stable shared appointment ID.
    const appointmentId = String(event.detail?.appointmentId || "");
    if (!appointmentId) return;
    const searchInput = document.getElementById("sc-search-input");
    if (searchInput) searchInput.value = "";
    const allFilter = document.querySelector('.sc-filter-btn[data-filter="All"]');
    document.querySelectorAll(".sc-filter-btn").forEach((filter) => filter.classList.remove("active"));
    allFilter?.classList.add("active");
    renderStoredAppointments();
    const row = [...document.querySelectorAll("#sc-appointments-tbody tr")].find(
      (appointmentRow) => appointmentRow.dataset.appointmentId === appointmentId,
    );
    if (!row) return;
    row.style.display = "";
    row.classList.add("sc-notification-highlight");
    row.scrollIntoView({ behavior: "smooth", block: "center" });
    openCustomerAppointmentDetails(appointmentId);
    window.setTimeout(() => row.classList.remove("sc-notification-highlight"), 2500);
  });

  document
    .getElementById("sc-open-modal-btn")
    ?.addEventListener("click", renderPendingParts);

  const dateInput = document.getElementById("sc-date-input");
  const timeInput = document.getElementById("sc-time-input");

  if (dateInput) {
    dateInput.addEventListener("click", () => {
      if (typeof dateInput.showPicker === "function") dateInput.showPicker();
    });

    const today = new Date();
    const localToday = new Date(
      today.getTime() - today.getTimezoneOffset() * 60000,
    )
      .toISOString()
      .split("T")[0];
    dateInput.min = localToday;

    // Kapag binago ang date, i-update ang status ng mechanics
    dateInput.addEventListener("change", updateMechanicAvailabilityOptions);
  }

  if (timeInput) {
    timeInput.addEventListener("change", updateMechanicAvailabilityOptions);
  }

  // Unang load ng mechanic options
  updateMechanicAvailabilityOptions();

  const filterBtns = document.querySelectorAll(".sc-filter-btn");
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const category = btn.getAttribute("data-filter");
      const rows = document.querySelectorAll("#sc-appointments-tbody tr");

      rows.forEach((row) => {
        const status = row.getAttribute("data-status");
        if (category === "All" || status?.toLowerCase() === category.toLowerCase()) {
          row.style.display = "";
        } else {
          row.style.display = "none";
        }
      });
    });
  });

  window.addEventListener("storage", (event) => {
    if (event.key === APPOINTMENT_STORE_KEY) {
      renderStoredAppointments();
      updateMechanicAvailabilityOptions();
    }
  });
  window.addEventListener("motofix:appointments-updated", () => {
    renderStoredAppointments();
    updateMechanicAvailabilityOptions();
  });

  const searchInput = document.getElementById("sc-search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const query = e.target.value.toLowerCase();
      const rows = document.querySelectorAll("#sc-appointments-tbody tr");
      rows.forEach((row) => {
        const text = row.textContent.toLowerCase();
        if (text.includes(query)) {
          row.style.display = "";
        } else {
          row.style.display = "none";
        }
      });
    });
  }

  const submitApptBtn = document.getElementById("sc-submit-appointment");
  const modalOverlay = document.getElementById("sc-modal-overlay");

  if (submitApptBtn) {
    submitApptBtn.addEventListener("click", () => {
      const moto = document.getElementById("sc-motorcycle-select").value;
      const mechanic = document.getElementById("sc-mechanic-select").value;
      const dateVal = document.getElementById("sc-date-input").value;
      const timeVal = document.getElementById("sc-time-input").value;
      const notes = document.getElementById("sc-notes-input")?.value || "";
      const checkedServiceInputs = Array.from(
        document.querySelectorAll('input[name="service"]:checked'),
      );
      const checkedServices = checkedServiceInputs.map((cb) => cb.value);

      const today = new Date();
      const localToday = new Date(
        today.getTime() - today.getTimezoneOffset() * 60000,
      )
        .toISOString()
        .split("T")[0];
      const errorBox = document.getElementById("sc-booking-error");
      if (errorBox) errorBox.hidden = true;

      if (!dateVal) {
        showBookingError("Please select your preferred appointment date.");
        document.getElementById("sc-date-input")?.focus();
        return;
      }
      if (dateVal < localToday) {
        showBookingError("Please select today or a future appointment date.");
        document.getElementById("sc-date-input")?.focus();
        return;
      }
      if (!timeVal) {
        showBookingError("Please select your preferred appointment time.");
        document.getElementById("sc-time-input")?.focus();
        return;
      }
      if (checkedServices.length === 0) {
        showBookingError("Please select at least one service to continue.");
        document.querySelector('input[name="service"]')?.focus();
        return;
      }

      const storedAppointments = readStoredAppointments();

      // --- CHECK 1: PAGSURI KUNG FULLY BOOKED NA ANG ARAW ---
      const sameDayBookings = storedAppointments.filter(
        (app) => app.date === dateVal && app.status !== "Cancelled"
      );
      if (sameDayBookings.length >= DAILY_MAX_BOOKINGS) {
        showBookingError(`Sorry, ${dateVal} is already fully booked. Please select another date.`);
        return;
      }

      // --- CHECK 2: PAGSURI KUNG MAY CONFLICT SA NAKATANGGANG MEKANIKO ---
      if (mechanic !== "Unassigned") {
        const assignedToActiveJob = storedAppointments.some(
          (appointment) =>
            appointment.mechanic === mechanic &&
            !["Cancelled", "Completed", "Unpaid"].includes(
              canonicalAppointmentStatus(appointment.status),
            ),
        );
        if (assignedToActiveJob) {
          showBookingError(`${mechanic} is assigned to an active job. Please choose another available mechanic.`);
          updateMechanicAvailabilityOptions();
          return;
        }

        const isMechanicBusy = storedAppointments.some(
          (app) =>
            app.date === dateVal &&
            app.time === timeVal &&
            app.mechanic === mechanic &&
            !["Cancelled", "Completed", "Unpaid"].includes(
              canonicalAppointmentStatus(app.status),
            )
        );
        if (isMechanicBusy) {
          showBookingError(`${mechanic} is already booked at ${timeVal} on ${dateVal}. Please select another time or mechanic.`);
          return;
        }
      }

      const nextId = (() => {
        const numbers = storedAppointments
          .map((appointment) =>
            Number(String(appointment.id).replace(/\D/g, "")),
          )
          .filter((value) => !Number.isNaN(value));
        const latest = Math.max(0, ...numbers);
        return `A${latest + 1}`;
      })();

      const profile = getCustomerProfile();
      const serviceItems = checkedServiceInputs.map((checkbox) => ({
        name: checkbox.value,
        price: `₱${Number(checkbox.dataset.price || 0).toLocaleString("en-PH", {
          minimumFractionDigits: 2,
        })}`,
      }));
      const total = `₱${checkedServiceInputs
        .reduce((sum, checkbox) => sum + Number(checkbox.dataset.price || 0), 0)
        .toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
      const newAppointment = {
        id: nextId,
        customerEmail: (localStorage.getItem("userEmail") || "")
          .trim()
          .toLowerCase(),
        customer: profile.name,
        phone: profile.phone,
        initials: profile.initials,
        bike: moto,
        services: checkedServices,
        date: dateVal,
        time: timeVal,
        mechanic: mechanic === "Unassigned" ? null : mechanic,
        status: "Pending",
        notes,
        parts: JSON.parse(
          localStorage.getItem("motofix_pending_parts") || "[]",
        ),
        total,
        transaction: {
          id: `INV-${nextId}`,
          total,
          date: dateVal,
        },
        createdAt: new Date().toISOString(),
      };

      const updatedAppointments = [newAppointment, ...storedAppointments];
      writeStoredAppointments(updatedAppointments);
      localStorage.removeItem("motofix_pending_parts");
      renderPendingParts();
      addSharedNotification(
        "Appointment booking received",
        `Your appointment ${newAppointment.id} for ${moto} was submitted for ${dateVal} at ${timeVal}.`,
        [
          "admin",
          "master_admin",
          `customer:${newAppointment.customerEmail}`,
          ...(newAppointment.mechanic
            ? [`mechanic:${newAppointment.mechanic}`]
            : []),
        ],
        newAppointment.id,
      );
      renderStoredAppointments();
      updateMechanicAvailabilityOptions();

      if (modalOverlay) modalOverlay.style.display = "none";
      document
        .querySelectorAll('input[name="service"]')
        .forEach((cb) => (cb.checked = false));
      const noteField = document.getElementById("sc-notes-input");
      if (noteField) noteField.value = "";
      showBookingSuccess(newAppointment, serviceItems, total);
    });
  }
}