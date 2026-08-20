// js/navigation.js
export function initNavigation() {
    const navLinks = document.querySelectorAll(".Sidebar_main .nav-link, .nav-link"); // Catches all nav links safely
    const dashView = document.getElementById("dashboard-view");
    const serviceView = document.getElementById("service-page-view");
    const motorcyclesView = document.getElementById("motorcycles-page-view");
    const partsView = document.getElementById("parts-page-view");
    const transactionsView = document.getElementById("transactions-view");
    const middleHeaderLabel = document.querySelector(".middle_header_label");
    const middleHeaderSub = document.querySelector(".middle_header_sub-label");
    const dashBookBtn = document.getElementById("dash-book-service-btn");
    const dashPartsBtn = document.getElementById("dash-view-parts-btn");
    const dashTransactionsBtn = document.getElementById("dash-transactions-btn");

    // --- View Switching Logic ---
    function switchToServicePage() {
        navLinks.forEach(l => {
            if(l.textContent.includes("Book") || l.textContent.includes("Appointments")) {
                // Keep relevant nav highlighted if needed
            }
        });
        
        if(dashView) dashView.style.display = "none";
        if(serviceView) serviceView.style.display = "block";
        if(motorcyclesView) motorcyclesView.style.display = "none";
        if(partsView) partsView.style.display = "none";
        if(transactionsView) transactionsView.style.display = "none";
        if(middleHeaderLabel) middleHeaderLabel.textContent = "Book a Service";
        if(middleHeaderSub) middleHeaderSub.textContent = "Schedule your next visit";
    }

    function switchToDashboardPage() {
        if(serviceView) serviceView.style.display = "none";
        if(dashView) dashView.style.display = "flex";
        if(motorcyclesView) motorcyclesView.style.display = "none";
        if(partsView) partsView.style.display = "none";
        if(transactionsView) transactionsView.style.display = "none";
        if(middleHeaderLabel) middleHeaderLabel.textContent = "Dashboard";
        if(middleHeaderSub) middleHeaderSub.textContent = "Welcome back, User";
    }

    function switchToAppointmentsPage() {
        if(dashView) dashView.style.display = "none";
        if(serviceView) serviceView.style.display = "block";
        if(motorcyclesView) motorcyclesView.style.display = "none";
        if(partsView) partsView.style.display = "none";
        if(transactionsView) transactionsView.style.display = "none";
        if(middleHeaderLabel) middleHeaderLabel.textContent = "Appointments";
        if(middleHeaderSub) middleHeaderSub.textContent = "Manage service scheduling";
    }

    function switchToMotorcyclesPage() {
        if(dashView) dashView.style.display = "none";
        if(serviceView) serviceView.style.display = "none";
        if(motorcyclesView) motorcyclesView.style.display = "block";
        if(partsView) partsView.style.display = "none";
        if(transactionsView) transactionsView.style.display = "none";
        if(middleHeaderLabel) middleHeaderLabel.textContent = "Motorcycle Customization";
        if(middleHeaderSub) middleHeaderSub.textContent = "Bike profiles & custom builds";
    }

    function switchToPartsPage() {
        if(dashView) dashView.style.display = "none";
        if(serviceView) serviceView.style.display = "none";
        if(motorcyclesView) motorcyclesView.style.display = "none";
        if(partsView) partsView.style.display = "block";
        if(transactionsView) transactionsView.style.display = "none";
        if(middleHeaderLabel) middleHeaderLabel.textContent = "Parts & Shop";
        if(middleHeaderSub) middleHeaderSub.textContent = "Parts catalog and stock shop";
    }

    function switchToTransactionsPage() {
        if(dashView) dashView.style.display = "none";
        if(serviceView) serviceView.style.display = "none";
        if(motorcyclesView) motorcyclesView.style.display = "none";
        if(partsView) partsView.style.display = "none";
        if(transactionsView) transactionsView.style.display = "block";
        if(middleHeaderLabel) middleHeaderLabel.textContent = "Transactions & Invoices";
        if(middleHeaderSub) middleHeaderSub.textContent = "View your service history and receipts";
    }

    // Map Nav Links clicks & Active State toggling
    navLinks.forEach((link, index) => {
        link.addEventListener("click", () => {
            // Remove active from all, add to clicked
            navLinks.forEach(l => l.classList.remove("active"));
            link.classList.add("active");

            // Handle page view switches based on index or text
            if(index === 0) {
                switchToDashboardPage(); // Customer Dashboard page
            } else if(index === 1) {
                switchToServicePage(); // Booking/Service page
            } else if(index === 2) {
                switchToAppointmentsPage(); // My Appointments
            } else if(index === 3) {
                switchToMotorcyclesPage(); // My motorcycle page
            } else if(index === 4) {
                switchToPartsPage(); // Parts & Shop page
            } else if(index === 5) {
                switchToTransactionsPage(); // Parts & Shop page
            }
        });
    });

    if(dashBookBtn) {
        dashBookBtn.addEventListener("click", () => {
            navLinks.forEach(l => l.classList.remove("active"));
            if(navLinks[1]) navLinks[1].classList.add("active"); // Index 2 is Service
            switchToServicePage();
        });
    }

    if(dashPartsBtn) {
        dashPartsBtn.addEventListener("click", () => {
            navLinks.forEach(l => l.classList.remove("active"));
            if(navLinks[4]) navLinks[4].classList.add("active"); // Index 4 is Parts & Shop
            switchToPartsPage();
        });
    }

    if(dashTransactionsBtn) {
        dashTransactionsBtn.addEventListener("click", () => {
            navLinks.forEach(l => l.classList.remove("active"));
            if(navLinks[5]) navLinks[5].classList.add("active"); // Index 5 is Transactions
            switchToTransactionsPage();
        });
    }

    // --- Sidebar Collapse / Expand Logic ---
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const body = document.body;
    const toggleBtn = document.getElementById('toggle-btn');

    function closeSidebar() {
        if(sidebar) sidebar.classList.add('closed');
        if(overlay) overlay.classList.remove('active');
        if(body) body.classList.add('sidebar-closed');
    }

    function openSidebar() {
        if(sidebar) sidebar.classList.remove('closed');
        if(overlay) overlay.classList.add('active');
        if(body) body.classList.remove('sidebar-closed');
    }

    if(overlay) {
        overlay.addEventListener('click', closeSidebar);
    }

    if(toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            if (sidebar.classList.contains('closed')) {
                openSidebar();
            } else {
                closeSidebar();
            }
        });
    }

    // --- User Profile Popup Toggle Logic ---
    const userOptionsBtn = document.querySelector('.user_options-btn');
    const popupUserOptions = document.querySelector('.popup_user_options');

    if (userOptionsBtn && popupUserOptions) {
        userOptionsBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevents document click from closing it instantly
            popupUserOptions.classList.toggle('show');
        });

        document.addEventListener('click', (e) => {
            if (!popupUserOptions.contains(e.target) && !userOptionsBtn.contains(e.target)) {
                popupUserOptions.classList.remove('show');
            }
        });
    }

    // --- ADD THIS LOGOUT HANDLER ---
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.removeItem("isLoggedIn");
            localStorage.removeItem("userEmail");
            localStorage.removeItem("userRole");
            window.location.href = "../../login.html";
        });
    }
}