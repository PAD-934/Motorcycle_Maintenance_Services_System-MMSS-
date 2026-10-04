// js/appointments.js
const APPOINTMENT_STORE_KEY = "motofix_appointments";
const NOTIFICATION_STORE_KEY = "motofix_notifications";

// Nililista ang mga mekaniko sa shop
const MECHANICS_LIST = [
  { id: "Ramon Santos", name: "Ramon Santos" },
  { id: "Juan Dela Cruz", name: "Juan Dela Cruz" },
  { id: "Jake Reyes", name: "Jake Reyes" }
];

const DAILY_MAX_BOOKINGS = 5; // Pinakamataas na booking bawat araw

function addSharedNotification(title, message, audiences) {
  const current = JSON.parse(
    localStorage.getItem(NOTIFICATION_STORE_KEY) || "[]",
  );
  current.unshift({
    id: `N${Date.now()}`,
    title,
    message,
    audiences,
    createdAt: new Date().toISOString(),
    readBy: [],
  });
  localStorage.setItem(
    NOTIFICATION_STORE_KEY,
    JSON.stringify(current.slice(0, 100)),
  );
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

function writeStoredAppointments(appointments) {
  localStorage.setItem(APPOINTMENT_STORE_KEY, JSON.stringify(appointments));
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
  const email = (localStorage.getItem("userEmail") || "").toLowerCase();
  const profiles = {
    "jose@email.com": { name: "Jose Bautista", phone: "+63 912 100 0002", initials: "JB" },
    "miguel@email.com": { name: "Miguel Torres", phone: "+63 912 100 0001", initials: "MT" },
    "ana@email.com": { name: "Ana Flores", phone: "+63 912 100 0003", initials: "AF" },
    "admin@motofix.com": { name: "Carlos Reyes", phone: "+63 912 000 0001", initials: "CR" },
    "mechanic1@motofix.com": { name: "Ramon Santos", phone: "+63 912 000 0002", initials: "RS" },
  };

  const base = profiles[email] || {
    name: "Customer",
    phone: "+63 912 100 0000",
    initials: "CU",
  };

  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem("motofix_profiles") || "{}")[email];
  } catch {}
  if (!saved) return base;

  const name = saved.name || base.name;
  return {
    name,
    phone: saved.phone || base.phone,
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
      appointment.customerEmail?.toLowerCase() === currentEmail ||
      (!appointment.customerEmail && appointment.customer === customerProfile.name),
  );
  tbody.innerHTML = storedAppointments.length
    ? storedAppointments
        .map((appointment) => {
          const mechanic = appointment.mechanic || "Unassigned";
          return `
                <tr data-status="${appointment.status || "Pending"}">
                    <td class="sc-id-col">${appointment.id}</td>
                    <td>
                        <div class="sc-customer-info">
                            <div class="sc-avatar">${appointment.initials || "CU"}</div>
                            <div>
                                <div class="sc-cust-name">${appointment.customer || "Customer"}</div>
                                <div class="sc-cust-phone">${appointment.phone || "N/A"}</div>
                            </div>
                        </div>
                    </td>
                    <td>${appointment.bike || "Unknown Motorcycle"}</td>
                    <td>
                        <div class="sc-service-tags">${(Array.isArray(appointment.services) ? appointment.services : [appointment.services || "Service"]).join("<br>")}</div>
                    </td>
                    <td>
                        <div class="sc-datetime">${appointment.date || "Not set"}<br><span>${appointment.time || "--:--"}</span></div>
                    </td>
                    <td>${mechanic === "Unassigned" ? '<span class="sc-unassigned">Unassigned</span>' : mechanic}</td>
                    <td><span class="sc-status-badge sc-${(appointment.status || "Pending").toLowerCase().replace(/\s+/g, "-")}">${(appointment.status || "Pending").toUpperCase()}</span></td>
                    <td></td>
                </tr>
            `;
        })
        .join("")
    : "";
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
  const dateInput = document.getElementById("sc-date-input");
  const dateVal = dateInput?.dataset.dateValue || "";
  const timeVal = document.getElementById("sc-time-input")?.value;

  if (!mechanicSelect) return;

  const appointments = readStoredAppointments();

  mechanicSelect.innerHTML = `<option value="Unassigned">Any Available Mechanic (Auto-assign)</option>`;

  MECHANICS_LIST.forEach((m) => {
    // I-check kung may conflict ang mekaniko sa petsa at oras na napili
    const isBusy = dateVal && timeVal && appointments.some(
      (app) =>
        app.date === dateVal &&
        app.time === timeVal &&
        app.mechanic === m.name &&
        app.status !== "Cancelled"
    );

    const option = document.createElement("option");
    option.value = m.name;
    if (isBusy) {
      option.textContent = `${m.name} (Unavailable at this time)`;
      option.disabled = true;
    } else {
      option.textContent = `${m.name} (Available)`;
    }
    mechanicSelect.appendChild(option);
  });
}


function getLocalDateString(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().split("T")[0];
}

function getUnavailableDates() {
  const blocked = new Set();
  readStoredAppointments().forEach((appointment) => {
    const status = String(appointment.status || "Pending").trim().toLowerCase();
    if (appointment.date && status !== "cancelled") blocked.add(appointment.date);
  });
  return blocked;
}

function formatDateForDisplay(dateValue) {
  if (!dateValue) return "";
  const [year, month, day] = dateValue.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function setupDatePicker() {
  const input = document.getElementById("sc-date-input");
  const calendar = document.getElementById("sc-date-calendar");
  const note = document.getElementById("sc-date-availability-note");
  if (!input || !calendar) return;

  let viewDate = new Date();
  viewDate.setHours(0, 0, 0, 0);
  let selectedDate = "";

  const renderCalendar = () => {
    const unavailable = getUnavailableDates();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthLabel = viewDate.toLocaleDateString("en-PH", { month: "long", year: "numeric" });

    calendar.innerHTML = `
      <div class="sc-calendar-header">
        <button type="button" class="sc-calendar-nav" data-calendar-nav="-1" aria-label="Previous month">‹</button>
        <strong>${monthLabel}</strong>
        <button type="button" class="sc-calendar-nav" data-calendar-nav="1" aria-label="Next month">›</button>
      </div>
      <div class="sc-calendar-weekdays">
        ${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => `<span>${d}</span>`).join("")}
      </div>
      <div class="sc-calendar-grid"></div>
      <div class="sc-calendar-legend">
        <span><i class="sc-calendar-dot available"></i> Available</span>
        <span><i class="sc-calendar-dot unavailable"></i> Unavailable</span>
      </div>`;

    const grid = calendar.querySelector(".sc-calendar-grid");
    for (let i = 0; i < firstDay; i++) {
      grid.insertAdjacentHTML("beforeend", `<span class="sc-calendar-empty"></span>`);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const value = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const isPast = dateObj < today;
      const isUnavailable = unavailable.has(value);
      const disabled = isPast || isUnavailable;
      const classes = [
        "sc-calendar-day",
        dateObj.getTime() === today.getTime() ? "today" : "",
        value === selectedDate ? "selected" : "",
        isUnavailable ? "unavailable" : "",
      ].filter(Boolean).join(" ");

      grid.insertAdjacentHTML(
        "beforeend",
        `<button type="button" class="${classes}" data-date="${value}" ${disabled ? "disabled" : ""}>
          <span>${day}</span>
          ${isUnavailable ? '<small>Booked</small>' : ""}
        </button>`
      );
    }

    calendar.querySelectorAll("[data-calendar-nav]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        viewDate.setMonth(viewDate.getMonth() + Number(button.dataset.calendarNav));
        renderCalendar();
      });
    });

    calendar.querySelectorAll(".sc-calendar-day:not([disabled])").forEach((button) => {
      button.addEventListener("click", () => {
        selectedDate = button.dataset.date;
        input.value = formatDateForDisplay(selectedDate);
        input.dataset.dateValue = selectedDate;
        input.setCustomValidity("");
        calendar.hidden = true;
        input.setAttribute("aria-expanded", "false");
        renderCalendar();
        updateMechanicAvailabilityOptions();
      });
    });

    if (note) {
      const count = [...unavailable].filter((d) => d >= getLocalDateString(today)).length;
      note.textContent = count
        ? `${count} booked date${count === 1 ? "" : "s"} disabled. Completed and active bookings cannot be booked again.`
        : "No booked dates yet. Available dates can be selected normally.";
    }
  };

  const open = () => {
    // Re-read appointments every time the picker opens so the calendar is current.
    const current = input.dataset.dateValue || "";
    if (current) selectedDate = current;
    renderCalendar();
    calendar.hidden = false;
    input.setAttribute("aria-expanded", "true");
  };

  input.addEventListener("click", open);
  input.addEventListener("focus", open);

  document.addEventListener("click", (event) => {
    if (!calendar.hidden && !calendar.contains(event.target) && event.target !== input) {
      calendar.hidden = true;
      input.setAttribute("aria-expanded", "false");
    }
  });

  // Public refresh hook used immediately after successful booking.
  window.refreshAppointmentDateAvailability = () => {
    renderCalendar();
  };

  renderCalendar();
}

export function initAppointments() {
  renderStoredAppointments();
  renderPendingParts();

  document
    .getElementById("sc-open-modal-btn")
    ?.addEventListener("click", renderPendingParts);

  const dateInput = document.getElementById("sc-date-input");
  const timeInput = document.getElementById("sc-time-input");

  if (dateInput) {
    setupDatePicker();
    // Compatibility: if a date is ever supplied programmatically, validate it.
    dateInput.addEventListener("change", () => {
      const value = dateInput.dataset.dateValue || "";
      const unavailable = getUnavailableDates();
      if (value && unavailable.has(value)) {
        dateInput.value = "";
        dateInput.dataset.dateValue = "";
        dateInput.setCustomValidity("This date is no longer available. Please select another date.");
        showBookingError("This date is no longer available. Please select another date.");
      } else {
        dateInput.setCustomValidity("");
      }
      updateMechanicAvailabilityOptions();
    });
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
        if (category === "All" || status === category) {
          row.style.display = "";
        } else {
          row.style.display = "none";
        }
      });
    });
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
      const dateInputEl = document.getElementById("sc-date-input");
      const dateVal = dateInputEl?.dataset.dateValue || "";
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
      const unavailableDates = getUnavailableDates();
      if (unavailableDates.has(dateVal)) {
        showBookingError("This date is no longer available. Please select another date.");
        dateInputEl?.focus();
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

      // --- CHECK 1: A DATE CAN ONLY HAVE ONE ACTIVE/COMPLETED BOOKING ---
      // Re-read storage immediately before writing so a date that became unavailable
      // while this page was open cannot be booked a second time.
      const dateAlreadyUnavailable = storedAppointments.some(
        (app) =>
          app.date === dateVal &&
          String(app.status || "Pending").trim().toLowerCase() !== "cancelled"
      );
      if (dateAlreadyUnavailable) {
        showBookingError("This date is no longer available. Please select another date.");
        dateInputEl?.focus();
        window.refreshAppointmentDateAvailability?.();
        return;
      }

      // --- CHECK 2: PAGSURI KUNG MAY CONFLICT SA NAKATANGGANG MEKANIKO ---
      if (mechanic !== "Unassigned") {
        const isMechanicBusy = storedAppointments.some(
          (app) =>
            app.date === dateVal &&
            app.time === timeVal &&
            app.mechanic === mechanic &&
            app.status !== "Cancelled"
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
      const serviceSubtotal = checkedServiceInputs.reduce(
        (sum, checkbox) => sum + Number(checkbox.dataset.price || 0),
        0,
      );
      const appointmentParts = JSON.parse(
        localStorage.getItem("motofix_pending_parts") || "[]",
      );
      const additionalPartsPrice = appointmentParts
        .filter((part) => part.source === "buy")
        .reduce((sum, part) => sum + Number(part.price || 0) * Number(part.quantity || 1), 0);
      const additionalLaborPayment = appointmentParts
        .filter((part) => part.source === "bring" || part.source === "client")
        .reduce((sum, part) => sum + Number(part.price || 0) * Number(part.quantity || 1), 0);
      const grandTotal = serviceSubtotal + additionalPartsPrice + additionalLaborPayment;
      const total = `₱${grandTotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
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
        parts: appointmentParts,
        additionalPartsPrice,
        additionalLaborPayment,
        total: grandTotal,
        createdAt: new Date().toISOString(),
      };

      const updatedAppointments = [newAppointment, ...storedAppointments];
      writeStoredAppointments(updatedAppointments);
      localStorage.removeItem("motofix_pending_parts");
      renderPendingParts();
      addSharedNotification(
        "New customer appointment",
        `${profile.name} requested ${checkedServices.join(", ")} for ${moto}.`,
        [
          "admin",
          "master_admin",
          ...(newAppointment.mechanic
            ? [`mechanic:${newAppointment.mechanic}`]
            : []),
        ],
      );
      renderStoredAppointments();
      updateMechanicAvailabilityOptions();
      window.refreshAppointmentDateAvailability?.();

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