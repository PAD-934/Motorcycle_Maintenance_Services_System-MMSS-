// js/appointments.js
// Shared appointment schema and role write paths: ../../BACKEND_DATA_CONTRACT.md
import {
  cancelCustomerAppointment,
  createCustomerAppointment,
  customerApiEnabled,
  fetchCustomerAppointments,
  fetchCustomerServices,
  readBookingDraft,
  readPendingParts,
  requestCustomerAppointmentCancellation,
  sortAppointmentsNewestFirst,
  writeBookingDraft,
  clearBookingDraft,
} from "./customer-api.js";
import { collectCancellationReason } from "./cancellation-request-dialog.js";

const APPOINTMENT_STORE_KEY = "motofix_appointments";
const NOTIFICATION_STORE_KEY = "motofix_notifications";
const SERVICE_STORE_KEY = "motofix_services";

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
    cancelled: "Canceled",
    canceled: "Canceled",
  };
  return aliases[status.toLowerCase()] || status;
}

function isCurrentCustomerAppointment(appointment) {
  const email = (localStorage.getItem("userEmail") || "").trim().toLowerCase();
  return Boolean(email) &&
    String(appointment.customerEmail || "").trim().toLowerCase() === email;
}

async function cancelAppointmentFromDetails(appointmentId) {
  const appointment = readStoredAppointments().find(
    (item) => String(item.id) === String(appointmentId),
  );
  const isConfirmed = canonicalAppointmentStatus(appointment?.status) === "Confirmed";
  const reason = isConfirmed
    ? await collectCancellationReason(appointment, escapeHtml)
    : null;
  if (isConfirmed && reason === null) return;
  if (!isConfirmed && !window.confirm("Cancel this pending appointment?")) return;
  try {
    if (isConfirmed) {
      await requestCustomerAppointmentCancellation(appointmentId, reason);
    } else {
      await cancelCustomerAppointment(appointmentId);
    }
    openCustomerAppointmentDetails(appointmentId);
  } catch (error) {
    window.alert(error.message || "Unable to cancel this appointment.");
  }
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
  const canceledByCustomer =
    canonicalAppointmentStatus(appointment.status) === "Canceled" &&
    appointment.canceledByRole === "customer";
  const cancellationRequestPending =
    String(appointment.cancellationRequest?.status || "").toLowerCase() === "pending";
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
          ${canceledByCustomer ? `<div><span>Cancellation</span><strong>Canceled by customer${appointment.canceledByEmail ? ` (${escapeHtml(appointment.canceledByEmail)})` : ""}</strong></div>` : ""}
          ${cancellationRequestPending ? `<div><span>Cancellation request</span><strong>Awaiting Admin review</strong></div>` : ""}
          ${cancellationRequestPending && appointment.cancellationRequest?.reason ? `<div><span>Requested cancellation reason</span><strong>${escapeHtml(appointment.cancellationRequest.reason)}</strong></div>` : ""}
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
        ${isCurrentCustomerAppointment(appointment) && !cancellationRequestPending && ["Pending", "Confirmed"].includes(canonicalAppointmentStatus(appointment.status))
          ? `<button type="button" class="sc-submit-btn sc-danger-btn" data-cancel-appointment="${escapeHtml(appointment.id)}">${canonicalAppointmentStatus(appointment.status) === "Confirmed" ? "Request Cancellation" : "Cancel Appointment"}</button>`
          : ""}
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
  overlay.querySelector("[data-cancel-appointment]")?.addEventListener("click", (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    cancelAppointmentFromDetails(button.dataset.cancelAppointment).finally(() => {
      if (button.isConnected) button.disabled = false;
    });
  });
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
  const storedAppointments = sortAppointmentsNewestFirst(readStoredAppointments().filter(
    (appointment) =>
      (appointment.customerEmail || "").trim().toLowerCase() === currentEmail ||
      (!appointment.customerEmail &&
        customerProfile.name.trim().toLowerCase() !== "customer" &&
        appointment.customer === customerProfile.name),
  ));
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

  const parts = readPendingParts();

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
      if (["Canceled", "Cancelled", "Completed", "Unpaid"].includes(status)) return false;
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
  const savedBookingDraft = readBookingDraft();
  let bookingDraft = savedBookingDraft || {
    id: `D${Date.now()}`,
    customerEmail: (localStorage.getItem("userEmail") || "").trim().toLowerCase(),
    parts: readPendingParts(),
  };

  function saveCurrentDraft() {
    const serviceInputs = [...document.querySelectorAll('input[name="service"]:checked')];
    bookingDraft = {
      ...bookingDraft,
      motorcycle: document.getElementById("sc-motorcycle-select")?.value || "",
      mechanic: document.getElementById("sc-mechanic-select")?.value || "Unassigned",
      date: document.getElementById("sc-date-input")?.value || "",
      time: document.getElementById("sc-time-input")?.value || "",
      notes: document.getElementById("sc-notes-input")?.value || "",
      services: serviceInputs.map((input) => input.value),
      parts: readPendingParts(),
      updatedAt: new Date().toISOString(),
    };
    writeBookingDraft(bookingDraft);
    return bookingDraft;
  }

  function restoreCurrentDraft() {
    const motorcycleSelect = document.getElementById("sc-motorcycle-select");
    const draft = readBookingDraft() || bookingDraft;
    if (motorcycleSelect && draft.motorcycle) {
      if (![...motorcycleSelect.options].some((option) => option.value === draft.motorcycle)) {
        motorcycleSelect.add(new Option(draft.motorcycle, draft.motorcycle));
      }
      motorcycleSelect.value = draft.motorcycle;
    }
    const mechanicSelect = document.getElementById("sc-mechanic-select");
    if (mechanicSelect && draft.mechanic) mechanicSelect.value = draft.mechanic;
    const dateInput = document.getElementById("sc-date-input");
    if (dateInput) {
      dateInput.value = draft.date || "";
      dateInput.dispatchEvent(new Event("change", { bubbles: true }));
    }
    const timeInput = document.getElementById("sc-time-input");
    if (timeInput) timeInput.value = draft.time || "";
    const notesInput = document.getElementById("sc-notes-input");
    if (notesInput) notesInput.value = draft.notes || "";
    const selectedServices = new Set(draft.services || []);
    document.querySelectorAll('input[name="service"]').forEach((input) => {
      input.checked = selectedServices.has(input.value);
    });
    renderPendingParts();
  }

  function renderServiceOptions(services) {
    const serviceContainer = document.getElementById("sc-services-options");
    if (!serviceContainer) return;
    const isUnavailable = (value) =>
      value === false ||
      value === 0 ||
      ["false", "0", "inactive", "unavailable", "disabled", "archived"].includes(
        String(value ?? "").trim().toLowerCase(),
      );
    const availableServices = services.filter((service) => {
      const status = String(service.status || "").trim().toLowerCase();
      const availability = String(service.availability || "").trim().toLowerCase();
      return !isUnavailable(service.active) &&
        !isUnavailable(service.available) &&
        !isUnavailable(service.isActive) &&
        !isUnavailable(service.isAvailable) &&
        !isUnavailable(status) &&
        !isUnavailable(availability);
    });
    if (!availableServices.length) {
      serviceContainer.innerHTML = "<span>No active services are currently available.</span>";
      return;
    }
    const selected = new Set(
      [...serviceContainer.querySelectorAll('input[name="service"]:checked')].map((input) => input.value),
    );
    const money = (amount) => `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    serviceContainer.innerHTML = availableServices.map((service) => {
      const name = String(service.name || "").trim();
      if (!name) return "";
      const priceValue = service.price ?? service.current_price ?? service.unitPrice ?? 0;
      const price = Number(String(priceValue).replace(/[^\d.-]/g, ""));
      const safePrice = Number.isFinite(price) ? price : 0;
      const duration = String(
        service.hoursLabel ||
        service.durationLabel ||
        service.duration ||
        (service.durationMinutes ? `${service.durationMinutes} minutes` : service.hours ? `${service.hours} hour${Number(service.hours) === 1 ? "" : "s"}` : ""),
      ).trim();
      const id = String(service.id ?? service.code ?? name);
      const checked = selected.has(name);
      return `<label class="sc-service-item">
        <div class="sc-service-info">
          <input type="checkbox" name="service" value="${escapeHtml(name)}" data-service-id="${escapeHtml(id)}" data-price="${safePrice}" data-duration="${escapeHtml(duration)}" ${checked ? "checked" : ""} />
          <span>${escapeHtml(name)}${duration ? ` <small>(${escapeHtml(duration)})</small>` : ""}</span>
          <span class="sc-price">${money(safePrice)}</span>
        </div>
      </label>`;
    }).join("");
    restoreCurrentDraft();
  }

  async function refreshServices() {
    const serviceContainer = document.getElementById("sc-services-options");
    try {
      const services = await fetchCustomerServices();
      renderServiceOptions(services);
    } catch (error) {
      console.error("Unable to load the active service catalog:", error);
      if (serviceContainer) {
        serviceContainer.innerHTML = `<span>Unable to load services. ${escapeHtml(error.message)}</span>`;
      }
    }
  }

  async function refreshAppointments() {
    const failureId = "sc-appointments-api-error";
    try {
      await fetchCustomerAppointments();
      document.getElementById(failureId)?.remove();
      renderStoredAppointments();
      updateMechanicAvailabilityOptions();
    } catch (error) {
      console.error("Unable to refresh customer appointments:", error);
      let message = document.getElementById(failureId);
      if (!message) {
        message = document.createElement("p");
        message.id = failureId;
        message.setAttribute("role", "alert");
        document.querySelector(".sc-table-container")?.before(message);
      }
      message.textContent = `Unable to refresh appointments: ${error.message}`;
    }
  }

  refreshServices();
  refreshAppointments();
  if (customerApiEnabled()) {
    window.setInterval(() => {
      if (document.hidden) return;
      refreshServices();
      refreshAppointments();
    }, 30000);
  }

  document.getElementById("sc-modal-overlay")?.addEventListener("input", saveCurrentDraft);
  document.getElementById("sc-modal-overlay")?.addEventListener("change", saveCurrentDraft);
  document.getElementById("sc-open-modal-btn")?.addEventListener("click", () => {
    bookingDraft = readBookingDraft() || bookingDraft;
    restoreCurrentDraft();
    saveCurrentDraft();
  });
  document.getElementById("sc-browse-parts-btn")?.addEventListener("click", () => {
    const draft = saveCurrentDraft();
    const returnButton = document.getElementById("parts-return-to-appointment");
    if (returnButton) returnButton.hidden = false;
    document.getElementById("sc-modal-overlay").style.display = "none";
    window.dispatchEvent(new CustomEvent("motofix:open-parts-for-appointment", {
      detail: { draftId: draft.id },
    }));
  });
  window.addEventListener("motofix:book-service", (event) => {
    const serviceName = String(event.detail?.serviceName || "").trim();
    if (!serviceName) return;

    const savedDraft = readBookingDraft() || bookingDraft;
    const selectedServices = new Set(savedDraft.services || []);
    selectedServices.add(serviceName);
    bookingDraft = {
      ...savedDraft,
      services: [...selectedServices],
      updatedAt: new Date().toISOString(),
    };
    writeBookingDraft(bookingDraft);
    restoreCurrentDraft();
    const modal = document.getElementById("sc-modal-overlay");
    if (modal) modal.style.display = "flex";
  });
  document.getElementById("parts-return-to-appointment")?.addEventListener("click", () => {
    restoreCurrentDraft();
    document.getElementById("sc-modal-overlay").style.display = "flex";
    window.dispatchEvent(new Event("motofix:return-to-booking-draft"));
  });
  if (savedBookingDraft) {
    const returnButton = document.getElementById("parts-return-to-appointment");
    if (returnButton) returnButton.hidden = false;
  }
  window.addEventListener("storage", (event) => {
    if (event.key === SERVICE_STORE_KEY) refreshServices();
  });
  window.addEventListener("motofix:services-updated", refreshServices);
  window.addEventListener("motofix:booking-parts-updated", () => {
    bookingDraft = readBookingDraft() || bookingDraft;
    renderPendingParts();
  });

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
    const today = new Date();
    const localToday = new Date(
      today.getTime() - today.getTimezoneOffset() * 60000,
    )
      .toISOString()
      .split("T")[0];
    dateInput.min = localToday;

    const datePicker = document.getElementById("sc-customer-date-picker");
    const datePickerTrigger = document.getElementById("sc-date-picker-trigger");
    const datePickerPopover = document.getElementById("sc-date-picker-popover");
    const datePickerDays = document.getElementById("sc-date-picker-days");
    const datePickerMonth = document.getElementById("sc-date-picker-month");
    let datePickerViewMonth = (dateInput.value || localToday).slice(0, 7);

    const renderDatePicker = () => {
      const [year, month] = datePickerViewMonth.split("-").map(Number);
      if (!year || !month) return;
      datePickerMonth.value = datePickerViewMonth;
      const firstDay = new Date(year, month - 1, 1);
      const selectedDate = dateInput.value;
      const minDate = dateInput.min;
      datePickerDays.innerHTML = [
        ...Array(firstDay.getDay()).fill('<span class="sc-date-picker-empty" aria-hidden="true"></span>'),
        ...Array.from({ length: new Date(year, month, 0).getDate() }, (_, index) => {
          const day = index + 1;
          const value = `${datePickerViewMonth}-${String(day).padStart(2, "0")}`;
          const isSelected = value === selectedDate;
          const isUnavailable = value < minDate;
          return `<button type="button" class="sc-date-picker-day${isSelected ? " is-selected" : ""}" data-date-value="${value}" aria-label="${value}" aria-pressed="${isSelected}" ${isUnavailable ? "disabled" : ""}>${day}</button>`;
        }),
      ].join("");
      const selectedLabel = selectedDate
        ? new Date(`${selectedDate}T00:00:00`).toLocaleDateString()
        : "Select appointment date";
      document.getElementById("sc-date-picker-value").textContent = selectedLabel;
    };

    const closeDatePicker = () => {
      datePickerPopover.hidden = true;
      datePickerTrigger.setAttribute("aria-expanded", "false");
    };

    datePickerTrigger.addEventListener("click", () => {
      datePickerViewMonth = (dateInput.value || datePickerViewMonth || localToday).slice(0, 7);
      renderDatePicker();
      datePickerPopover.hidden = false;
      datePickerTrigger.setAttribute("aria-expanded", "true");
    });
    document.getElementById("sc-date-picker-prev").addEventListener("click", () => {
      const [year, month] = datePickerViewMonth.split("-").map(Number);
      const previousMonth = new Date(year, month - 2, 1);
      datePickerViewMonth = `${previousMonth.getFullYear()}-${String(previousMonth.getMonth() + 1).padStart(2, "0")}`;
      renderDatePicker();
    });
    document.getElementById("sc-date-picker-next").addEventListener("click", () => {
      const [year, month] = datePickerViewMonth.split("-").map(Number);
      const nextMonth = new Date(year, month, 1);
      datePickerViewMonth = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}`;
      renderDatePicker();
    });
    datePickerMonth.addEventListener("change", () => {
      if (!/^\d{4}-\d{2}$/.test(datePickerMonth.value)) return;
      datePickerViewMonth = datePickerMonth.value;
      renderDatePicker();
    });
    datePickerDays.addEventListener("click", (event) => {
      const dayButton = event.target.closest("[data-date-value]");
      if (!dayButton || dayButton.disabled) return;
      dateInput.value = dayButton.dataset.dateValue;
      dateInput.dispatchEvent(new Event("change", { bubbles: true }));
      renderDatePicker();
      closeDatePicker();
    });
    document.addEventListener("click", (event) => {
      if (!datePickerPopover.hidden && !datePicker.contains(event.target)) closeDatePicker();
    });
    dateInput.addEventListener("change", () => {
      renderDatePicker();
      updateMechanicAvailabilityOptions();
    });
    datePicker.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeDatePicker();
        datePickerTrigger.focus();
      }
    });
    renderDatePicker();
  }

  if (timeInput) {
    timeInput.addEventListener("change", updateMechanicAvailabilityOptions);
  }

  // Unang load ng mechanic options
  updateMechanicAvailabilityOptions();

  const filterBtns = document.querySelectorAll(".sc-filter-btn");
  const serviceCatalog = document.querySelector(".appointments-services-catalog");
  const setAppointmentCategory = (category) => {
    if (serviceCatalog) serviceCatalog.hidden = category !== "All";
  };
  setAppointmentCategory(
    document.querySelector(".sc-filter-btn.active")?.getAttribute("data-filter") || "All",
  );
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const category = btn.getAttribute("data-filter");
      setAppointmentCategory(category);
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
    submitApptBtn.addEventListener("click", async () => {
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
        document.getElementById("sc-date-picker-trigger")?.focus();
        return;
      }
      if (dateVal < localToday) {
        showBookingError("Please select today or a future appointment date.");
        document.getElementById("sc-date-picker-trigger")?.focus();
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
        (app) => app.date === dateVal && !["Canceled", "Cancelled"].includes(app.status)
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
            !["Canceled", "Cancelled", "Completed", "Unpaid"].includes(
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
            !["Canceled", "Cancelled", "Completed", "Unpaid"].includes(
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
        draftId: bookingDraft.id,
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
        parts: readPendingParts(),
        serviceItems: checkedServiceInputs.map((checkbox) => ({
          id: checkbox.dataset.serviceId || null,
          name: checkbox.value,
          price: Number(checkbox.dataset.price || 0),
          duration: checkbox.dataset.duration || "",
        })),
        total,
        transaction: {
          id: `INV-${nextId}`,
          total,
          date: dateVal,
        },
        createdAt: new Date().toISOString(),
      };

      submitApptBtn.disabled = true;
      let savedAppointment;
      try {
        savedAppointment = await createCustomerAppointment(newAppointment);
      } catch (error) {
        showBookingError(error.message || "Unable to submit your appointment. Please try again.");
        submitApptBtn.disabled = false;
        return;
      }
      submitApptBtn.disabled = false;
      clearBookingDraft();
      bookingDraft = {
        id: `D${Date.now()}`,
        customerEmail: (localStorage.getItem("userEmail") || "").trim().toLowerCase(),
        parts: [],
      };
      renderPendingParts();
      if (!customerApiEnabled()) addSharedNotification(
        "Appointment booking received",
        `Your appointment ${savedAppointment.id} for ${moto} was submitted for ${dateVal} at ${timeVal}.`,
        [
          "admin",
          "master_admin",
          `customer:${newAppointment.customerEmail}`,
          ...(newAppointment.mechanic
            ? [`mechanic:${newAppointment.mechanic}`]
            : []),
        ],
        savedAppointment.id,
      );
      renderStoredAppointments();
      updateMechanicAvailabilityOptions();

      if (modalOverlay) modalOverlay.style.display = "none";
      const partsReturnButton = document.getElementById("parts-return-to-appointment");
      if (partsReturnButton) partsReturnButton.hidden = true;
      document
        .querySelectorAll('input[name="service"]')
        .forEach((cb) => (cb.checked = false));
      const noteField = document.getElementById("sc-notes-input");
      if (noteField) noteField.value = "";
      showBookingSuccess(savedAppointment, serviceItems, total);
    });
  }
}