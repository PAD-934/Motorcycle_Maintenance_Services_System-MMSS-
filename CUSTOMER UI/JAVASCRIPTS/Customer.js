// JAVASCRIPTS/Customer.js
// Customer dashboard projections over shared backend entities: ../../BACKEND_DATA_CONTRACT.md

import { initAppointments } from "./appointments.js";
import { initModals } from "./modals.js";
import { initMotorcycles } from "./motorcycles.js";
import { initNavigation } from "./navigation.js";
import { initPartsShop } from "./parts.js";
import { initTransactions } from "./transaction.js";
import { initProfile } from "./profile.js";

const APPOINTMENT_STORE_KEY = "motofix_appointments";

// Customer dashboard totals and appointment lists are projections of shared appointment
// records; motorcycles.js reads the separate registry linked by ownerEmail.
function readCustomerAppointments() {
  try {
    const appointments = JSON.parse(localStorage.getItem(APPOINTMENT_STORE_KEY) || "[]");
    const email = (localStorage.getItem("userEmail") || "").trim().toLowerCase();
    const users = JSON.parse(localStorage.getItem("motofix_users") || "[]");
    const registeredUser = Array.isArray(users)
      ? users.find((user) => user.email?.trim().toLowerCase() === email)
      : null;
    const defaultNames = {
      "jose@email.com": "Jose Bautista",
      "miguel@email.com": "Miguel Torres",
      "ana@email.com": "Ana Flores",
    };
    let savedName = "";
    try {
      savedName = JSON.parse(localStorage.getItem("motofix_profiles") || "{}")[email]?.name || "";
    } catch (error) {
      console.error("Unable to load customer profile name:", error);
    }
    const customerName =
      savedName ||
      registeredUser?.name ||
      localStorage.getItem("userFullName") ||
      defaultNames[email] ||
      "Customer";
    const canMatchLegacyName = customerName.trim().toLowerCase() !== "customer";
    return Array.isArray(appointments)
      ? appointments.filter((appointment) =>
          (appointment.customerEmail || "").trim().toLowerCase() === email ||
          (!appointment.customerEmail &&
            canMatchLegacyName &&
            appointment.customer === customerName),
        )
      : [];
  } catch {
    return [];
  }
}

function canonicalStatus(value) {
  const status = String(value || "Pending").trim();
  const aliases = {
    "complete transaction": "Completed",
    completed: "Completed",
    "work finished (unpaid)": "Unpaid",
  };
  return aliases[status.toLowerCase()] || status;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>\"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
}

// --- Dashboard widgets (My Motorcycles, Appointments, Pending Jobs, Total Spent) ---
function updateDashboardWidgets() {
  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  // My Motorcycles
  const bikes = document.querySelectorAll("#motorcycles-list .mc-bike-card");
  set("motorcycle-count", bikes.length);

  const appointments = readCustomerAppointments();
  const status = (appointment) => canonicalStatus(appointment.status).toLowerCase();
  set("appointments-count", appointments.length);
  set(
    "pending-jobs-count",
    appointments.filter((appointment) =>
      !["completed", "cancelled", "work finished", "unpaid"].includes(status(appointment)),
    ).length
  );

  const total = appointments
    .filter((appointment) => status(appointment) === "completed")
    .reduce((sum, appointment) => {
      const amount = parseFloat(String(appointment.transaction?.total || appointment.total || "").replace(/[^0-9.]/g, ""));
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

  set(
    "total-spent",
    "₱" +
      total.toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
  );
}

function renderDashboardAppointments() {
  const list = document.getElementById("dashboard-appointments-list");
  if (!list) return;
  const appointments = readCustomerAppointments().slice(0, 3);
  list.innerHTML = appointments.length
    ? appointments.map((appointment) => {
        const status = canonicalStatus(appointment.status);
        const services = Array.isArray(appointment.services)
          ? appointment.services.join(", ")
          : appointment.services || "Service";
        const mechanic = appointment.mechanic || "Awaiting mechanic";
        return `<div class="appointments_list_subparent">
          <div>
            <div class="appointments_list_label">${escapeHtml(services)}</div>
            <div class="appointments_list_sublabel">${escapeHtml(appointment.bike || "Motorcycle")} · Mechanic: ${escapeHtml(mechanic)}</div>
          </div>
          <div class="appointments_list_status_and_date">
            <span class="status-badge status-${status.toLowerCase().replace(/\s+/g, "-")}">${escapeHtml(status)}</span>
            <span class="appointments_list_date">${escapeHtml(`${appointment.date || ""} ${appointment.time || ""}`.trim())}</span>
          </div>
        </div>`;
      }).join("")
    : '<div class="appointments_list_empty">No appointments yet.</div>';
}

function initDashboardWidgets() {
  updateDashboardWidgets();
  renderDashboardAppointments();

  
  ["motorcycles-list", "sc-appointments-tbody", "transactions-table-body"].forEach(
    (id) => {
      const el = document.getElementById(id);
      if (el) {
        new MutationObserver(updateDashboardWidgets).observe(el, {
          childList: true,
        });
      }
    }
  );
  const refreshAppointments = () => {
    updateDashboardWidgets();
    renderDashboardAppointments();
  };
  window.addEventListener("storage", (event) => {
    if (event.key === APPOINTMENT_STORE_KEY) refreshAppointments();
  });
  window.addEventListener("motofix:appointments-updated", refreshAppointments);
}

document.addEventListener("DOMContentLoaded", () => {
  // --- Session Guard ---
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  const userRole = localStorage.getItem("userRole");
  if (!isLoggedIn || userRole !== "customer") {
    window.location.href = "../../login.html";
    return;
  }

  initNavigation();
  initModals();
  initAppointments();
  initMotorcycles();
  initPartsShop();
  initTransactions();
  initDashboardWidgets(); 
  initProfile();
});