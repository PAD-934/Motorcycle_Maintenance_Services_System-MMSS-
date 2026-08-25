// js/main.js
import { initAppointments } from "./appointments.js";
import { initModals } from "./modals.js";
import { initMotorcycles } from "./motorcycles.js";
import { initNavigation } from "./navigation.js";
import { initPartsShop } from "./parts.js";
import { initTransactions } from "./transaction.js";

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
});
