// js/appointments.js
const APPOINTMENT_STORE_KEY = "motofix_appointments";
const NOTIFICATION_STORE_KEY = "motofix_notifications";

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
    "jose@email.com": {
      name: "Jose Bautista",
      phone: "+63 912 100 0002",
      initials: "JB",
    },
    "miguel@email.com": {
      name: "Miguel Torres",
      phone: "+63 912 100 0001",
      initials: "MT",
    },
    "ana@email.com": {
      name: "Ana Flores",
      phone: "+63 912 100 0003",
      initials: "AF",
    },
    "admin@motofix.com": {
      name: "Carlos Reyes",
      phone: "+63 912 000 0001",
      initials: "CR",
    },
    "mechanic1@motofix.com": {
      name: "Ramon Santos",
      phone: "+63 912 000 0002",
      initials: "RS",
    },
  };

  return (
    profiles[email] || {
      name: "Customer",
      phone: "+63 912 100 0000",
      initials: "CU",
    }
  );
}

function renderStoredAppointments() {
  const tbody = document.getElementById("sc-appointments-tbody");
  if (!tbody) return;

  const customerProfile = getCustomerProfile();
  const currentEmail = (localStorage.getItem("userEmail") || "")
    .trim()
    .toLowerCase();
  const storedAppointments = readStoredAppointments().filter(
    (appointment) =>
      appointment.customerEmail?.toLowerCase() === currentEmail ||
      (!appointment.customerEmail &&
        appointment.customer === customerProfile.name),
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

export function initAppointments() {
  renderStoredAppointments();

  const dateInput = document.getElementById("sc-date-input");
  if (dateInput) {
    const today = new Date();
    const localToday = new Date(
      today.getTime() - today.getTimezoneOffset() * 60000,
    )
      .toISOString()
      .split("T")[0];
    dateInput.min = localToday;
  }

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
        createdAt: new Date().toISOString(),
      };

      const updatedAppointments = [newAppointment, ...storedAppointments];
      writeStoredAppointments(updatedAppointments);
      localStorage.removeItem("motofix_pending_parts");
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
