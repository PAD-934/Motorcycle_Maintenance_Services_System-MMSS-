// js/navigation.js
export function initNavigation() {
  const navLinks = document.querySelectorAll(
    ".Sidebar_main .nav-link, .nav-link",
  ); // Catches all nav links safely
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

  function renderCustomerNotifications() {
    const button = document.getElementById("customerBellBtn");
    if (!button) return;

    const email = (localStorage.getItem("userEmail") || "").trim().toLowerCase();
    let notifications = [];
    try {
      notifications = JSON.parse(localStorage.getItem("motofix_notifications") || "[]");
    } catch {
      notifications = [];
    }

    notifications = notifications.filter(
      (notification) =>
        notification.audiences?.includes("customer") &&
        (!notification.customerEmail || notification.customerEmail === email)
    );

    const unreadCount = notifications.filter(
      (notification) => !(notification.readBy || []).includes(email)
    ).length;

    let panel = document.getElementById("customerNotifPanel");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "customerNotifPanel";
      panel.className = "popup_user_options customer-notification-panel";
      button.parentElement.appendChild(panel);

      button.addEventListener("click", (event) => {
        event.stopPropagation();
        panel.classList.toggle("show");
      });

      panel.addEventListener("click", (event) => {
        const item = event.target.closest(".customer-notification-item");
        if (!item) return;

        const id = item.dataset.notificationId;
        let all = [];
        try {
          all = JSON.parse(localStorage.getItem("motofix_notifications") || "[]");
        } catch {
          all = [];
        }

        const target = all.find((n) => n.id === id);
        if (target) {
          target.readBy = Array.isArray(target.readBy) ? target.readBy : [];
          if (!target.readBy.includes(email)) target.readBy.push(email);
          localStorage.setItem("motofix_notifications", JSON.stringify(all));
        }

        panel.classList.remove("show");

        if (target?.type === "transaction_receipt" && target.transactionId) {
          const openReceipt = () => {
            const transactions = window.getCustomerTransactions?.() || [];
            const transaction = transactions.find((t) => t.id === target.transactionId);
            if (transaction && window.openCustomerReceipt) {
              window.openCustomerReceipt(transaction);
            }
          };

          // transaction.js is initialized after navigation.js.
          // Retry briefly if the notification is clicked before its API is ready.
          if (window.openCustomerReceipt) openReceipt();
          else setTimeout(openReceipt, 50);

          switchToTransactionsPage();
          navLinks.forEach((l) => l.classList.remove("active"));
          if (navLinks[4]) navLinks[4].classList.add("active");
        }

        renderCustomerNotifications();
      });
    }

    const dot = button.querySelector(".orange_circle");
    if (dot) dot.style.display = unreadCount ? "block" : "none";

    panel.innerHTML = `<div class="popup_user_info notification-panel-header">
      <strong>Notifications</strong>
      ${unreadCount ? `<span class="notification-unread-count">${unreadCount}</span>` : ""}
    </div>${
      notifications.length
        ? notifications.slice(0, 8).map((notification) => {
            const unread = !(notification.readBy || []).includes(email);
            return `
              <button type="button"
                class="popup_user_info customer-notification-item ${unread ? "unread" : ""}"
                data-notification-id="${String(notification.id).replace(/"/g, "&quot;")}"
              >
                <span class="customer-notification-icon">${unread ? "●" : "✓"}</span>
                <span>
                  <span class="popup_user_name">${escapeNotificationText(notification.title)}</span>
                  <span class="popup_user_email">${escapeNotificationText(notification.message)}</span>
                </span>
              </button>`;
          }).join("")
        : '<div class="popup_user_info"><div class="popup_user_email">No notifications yet.</div></div>'
    }`;
  }

  function escapeNotificationText(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[c]
    );
  }

  renderCustomerNotifications();
  window.addEventListener("storage", (event) => {
    if (event.key === "motofix_notifications") renderCustomerNotifications();
  });
  window.addEventListener("motofix-notifications-updated", renderCustomerNotifications);

  // --- View Switching Logic ---
  function switchToServicePage() {
    navLinks.forEach((l) => {
      if (
        l.textContent.includes("Book") ||
        l.textContent.includes("Appointments")
      ) {
        // Keep relevant nav highlighted if needed
      }
    });

    if (dashView) dashView.style.display = "none";
    if (serviceView) serviceView.style.display = "block";
    if (motorcyclesView) motorcyclesView.style.display = "none";
    if (partsView) partsView.style.display = "none";
    if (transactionsView) transactionsView.style.display = "none";
    if (middleHeaderLabel) middleHeaderLabel.textContent = "Book a Service";
    if (middleHeaderSub)
      middleHeaderSub.textContent = "Schedule your next visit";
  }

  function switchToDashboardPage() {
    if (serviceView) serviceView.style.display = "none";
    if (dashView) dashView.style.display = "flex";
    if (motorcyclesView) motorcyclesView.style.display = "none";
    if (partsView) partsView.style.display = "none";
    if (transactionsView) transactionsView.style.display = "none";
    if (middleHeaderLabel) middleHeaderLabel.textContent = "Dashboard";
    if (middleHeaderSub) {
      const profile =
        customerProfiles[
          (localStorage.getItem("userEmail") || "").trim().toLowerCase()
        ];
      middleHeaderSub.textContent = `Welcome back, ${profile ? profile.name.split(" ")[0] : "Customer"}`;
    }
  }

  const customerProfiles = {
    "jose@email.com": { name: "Jose Bautista", initials: "JB" },
    "ana@email.com": { name: "Ana Flores", initials: "AF" },
    "miguel@email.com": { name: "Miguel Torres", initials: "MT" },
  };

  function renderCustomerProfile() {
    const email = (localStorage.getItem("userEmail") || "")
      .trim()
      .toLowerCase();
    const profile = customerProfiles[email] || {
      name: "Customer",
      initials: "CU",
    };
    const firstName = profile.name.split(" ")[0];
    const nameEl = document.querySelector(".footer_username");
    const initialsEl = document.querySelector(".footer_initials");
    const headerInitialsEl = document.querySelector(".header_user_initials");

    if (nameEl) nameEl.textContent = profile.name;
    if (initialsEl) initialsEl.textContent = profile.initials;
    if (headerInitialsEl) headerInitialsEl.textContent = profile.initials;
    if (middleHeaderSub)
      middleHeaderSub.textContent = `Welcome back, ${firstName}`;
  }

  renderCustomerProfile();
  function switchToAppointmentsPage() {
    if (dashView) dashView.style.display = "none";
    if (serviceView) serviceView.style.display = "block";
    if (motorcyclesView) motorcyclesView.style.display = "none";
    if (partsView) partsView.style.display = "none";
    if (transactionsView) transactionsView.style.display = "none";
    if (middleHeaderLabel) middleHeaderLabel.textContent = "Appointments";
    if (middleHeaderSub)
      middleHeaderSub.textContent = "Manage service scheduling";
  }

  function switchToMotorcyclesPage() {
    if (dashView) dashView.style.display = "none";
    if (serviceView) serviceView.style.display = "none";
    if (motorcyclesView) motorcyclesView.style.display = "block";
    if (partsView) partsView.style.display = "none";
    if (transactionsView) transactionsView.style.display = "none";
    if (middleHeaderLabel)
      middleHeaderLabel.textContent = "Motorcycle Customization";
    if (middleHeaderSub)
      middleHeaderSub.textContent = "Bike profiles & custom builds";
  }

  function switchToPartsPage() {
    if (dashView) dashView.style.display = "none";
    if (serviceView) serviceView.style.display = "none";
    if (motorcyclesView) motorcyclesView.style.display = "none";
    if (partsView) partsView.style.display = "block";
    if (transactionsView) transactionsView.style.display = "none";
    if (middleHeaderLabel) middleHeaderLabel.textContent = "Parts & Shop";
    if (middleHeaderSub)
      middleHeaderSub.textContent = "Parts catalog and stock shop";
  }

  function switchToTransactionsPage() {
    if (dashView) dashView.style.display = "none";
    if (serviceView) serviceView.style.display = "none";
    if (motorcyclesView) motorcyclesView.style.display = "none";
    if (partsView) partsView.style.display = "none";
    if (transactionsView) transactionsView.style.display = "block";
    if (middleHeaderLabel)
      middleHeaderLabel.textContent = "Transactions & Invoices";
    if (middleHeaderSub)
      middleHeaderSub.textContent = "View your service history and receipts";
  }

  // Map Nav Links clicks & Active State toggling
  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      navLinks.forEach((l) => l.classList.remove("active"));
      link.classList.add("active");

      // Use the visible navigation label instead of array indexes.
      // This keeps buttons clickable even if the menu order changes.
      const label = link.textContent.replace(/\\s+/g, " ").trim().toLowerCase();

      if (label.includes("dashboard")) {
        switchToDashboardPage();
      } else if (label.includes("book a service") || label.includes("appointments")) {
        switchToAppointmentsPage();
      } else if (label.includes("motorcycle")) {
        switchToMotorcyclesPage();
      } else if (label.includes("parts")) {
        switchToPartsPage();
      } else if (label.includes("transaction")) {
        switchToTransactionsPage();
      }
    });
  });

  if (dashBookBtn) {
    dashBookBtn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      navLinks.forEach((l) => l.classList.remove("active"));
      const appointmentLink = [...navLinks].find((l) =>
        l.textContent.toLowerCase().includes("appointments")
      );
      if (appointmentLink) appointmentLink.classList.add("active");
      switchToAppointmentsPage();
    });
  }

  if (dashPartsBtn) {
    dashPartsBtn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      navLinks.forEach((l) => l.classList.remove("active"));
      const partsLink = [...navLinks].find((l) =>
        l.textContent.toLowerCase().includes("parts")
      );
      if (partsLink) partsLink.classList.add("active");
      switchToPartsPage();
    });
  }

  if (dashTransactionsBtn) {
    dashTransactionsBtn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      navLinks.forEach((l) => l.classList.remove("active"));
      const transactionsLink = [...navLinks].find((l) =>
        l.textContent.toLowerCase().includes("transactions")
      );
      if (transactionsLink) transactionsLink.classList.add("active");
      switchToTransactionsPage();
    });
  }

  // --- Sidebar Collapse / Expand Logic ---
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");
  const body = document.body;
  const toggleBtn = document.getElementById("toggle-btn");

  function closeSidebar() {
    if (sidebar) sidebar.classList.add("closed");
    if (overlay) overlay.classList.remove("active");
    if (body) body.classList.add("sidebar-closed");
  }

  function openSidebar() {
    if (sidebar) sidebar.classList.remove("closed");
    if (overlay) overlay.classList.add("active");
    if (body) body.classList.remove("sidebar-closed");
  }

  if (overlay) {
    overlay.addEventListener("click", closeSidebar);
  }

  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener("click", () => {
      if (sidebar.classList.contains("closed")) {
        openSidebar();
      } else {
        closeSidebar();
      }
    });
  }

  closeSidebar();
  // --- User Profile Popup Toggle Logic ---
  const userOptionsBtn = document.querySelector(".user_options-btn");
  const popupUserOptions = document.querySelector(".popup_user_options");

  if (userOptionsBtn && popupUserOptions) {
    userOptionsBtn.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevents document click from closing it instantly
      popupUserOptions.classList.toggle("show");
    });

    document.addEventListener("click", (e) => {
      if (
        !popupUserOptions.contains(e.target) &&
        !userOptionsBtn.contains(e.target)
      ) {
        popupUserOptions.classList.remove("show");
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