// js/main.js
import { initNavigation } from './navigation.js';
import { initModals } from './modals.js';
import { initAppointments } from './appointments.js';
import { initMotorcycles } from './motorcycles.js';
import { initPartsShop } from './parts.js';
import { initTransactions } from './transaction.js';

document.addEventListener("DOMContentLoaded", () => {
    // --- Session Guard ---
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (!isLoggedIn) {
        window.location.href = "../login.html";
        return;
    }

    initNavigation();
    initModals();
    initAppointments();
    initMotorcycles();
    initPartsShop();
    initTransactions();
});