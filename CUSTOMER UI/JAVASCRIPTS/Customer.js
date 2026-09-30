// js/main.js

import { initAppointments } from "./appointments.js";
import { initModals } from "./modals.js";
import { initMotorcycles } from "./motorcycles.js";
import { initNavigation } from "./navigation.js";
import { initPartsShop } from "./parts.js";
import { initTransactions } from "./transaction.js";
import { initProfile } from "./profile.js";

// --- Dashboard widgets (My Motorcycles, Appointments, Pending Jobs, Total Spent) ---
function updateDashboardWidgets() {
  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  // My Motorcycles
  const bikes = document.querySelectorAll("#motorcycles-list .mc-bike-card");
  set("motorcycle-count", bikes.length);

  // Appointments (all rows) and Pending Jobs (not completed or cancelled)
  const appts = [...document.querySelectorAll("#sc-appointments-tbody tr")];
  const status = (tr) => (tr.dataset.status || "").toLowerCase();
  set("appointments-count", appts.length);
  set(
    "pending-jobs-count",
    appts.filter((tr) => !["completed", "cancelled"].includes(status(tr))).length
  );

  // Total Spent: sum of completed transactions from storage
  let transactions = [];
  try {
    transactions = JSON.parse(localStorage.getItem("userTransactions")) || [];
  } catch {
    transactions = [];
  }
  const total = transactions
    .filter((t) => String(t.status).toLowerCase() === "completed")
    .reduce((sum, t) => {
      const amount = parseFloat(String(t.total).replace(/[^0-9.]/g, ""));
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

function initDashboardWidgets() {
  updateDashboardWidgets();

  
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