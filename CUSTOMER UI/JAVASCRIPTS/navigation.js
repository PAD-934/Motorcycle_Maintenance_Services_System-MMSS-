// js/navigation.js
// Notification audience and source-ID routing contract: ../../BACKEND_DATA_CONTRACT.md
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
  const dashboardAppointmentsBtn = document.getElementById("dashboard-view-appointments");
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>\"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);

  function renderCustomerNotifications() {
    const button = document.getElementById("customerBellBtn");
    if (!button) return;
    if (window.MotoFixNotifications) {
      window.MotoFixNotifications.init({
        buttonId: "customerBellBtn",
        panelId: "customerNotifPanel",
        role: "customer",
        email: localStorage.getItem("userEmail") || "",
        onOpen: () => switchToTransactionsPage(),
      });
      return;
    }
    const email = (localStorage.getItem("userEmail") || "").toLowerCase();
    const allNotifications = JSON.parse(
      localStorage.getItem("motofix_notifications") || "[]",
    );
    // Customer-specific audiences are keyed by the current email; shared "customer"
    // audiences are broadcasts. readBy uses the same role/email key per account.
    const notifications = allNotifications.filter((notification) =>
      notification.audiences?.includes("customer") ||
      notification.audiences?.includes(`customer:${email}`),
    );
    const userKey = `customer:${email}`;
    const unreadNotifications = notifications.filter(
      (notification) => !notification.readBy?.includes(userKey),
    );
    const dot = button.querySelector(".orange_circle");
    if (dot) {
      dot.hidden = unreadNotifications.length === 0;
      dot.textContent = unreadNotifications.length > 9 ? "9+" : String(unreadNotifications.length);
      dot.setAttribute("aria-label", `${unreadNotifications.length} unread notifications`);
    }
    let panel = document.getElementById("customerNotifPanel");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "customerNotifPanel";
      panel.className = "customer-notif-panel";
      button.parentElement.appendChild(panel);
    }
    panel.innerHTML = `<div class="customer-notif-head">Notifications</div>${
      notifications.length
        ? notifications
            .slice(0, 8)
            .map(
              (notification) => `<button type="button" class="customer-notification-link" data-notification-id="${escapeHtml(notification.id)}"><span class="customer-notification-title">${escapeHtml(notification.title)}</span><span class="customer-notification-message">${escapeHtml(notification.message)}</span></button>`,
            )
            .join("")
        : '<div class="customer-notif-empty">No notifications yet.</div>'
    }`;
  }

  function closeCustomerNotifications() {
    const panel = document.getElementById("customerNotifPanel");
    const button = document.getElementById("customerBellBtn");
    panel?.classList.remove("show");
    button?.setAttribute("aria-expanded", "false");
  }

  renderCustomerNotifications();
  const customerBellButton = document.getElementById("customerBellBtn");
  customerBellButton?.addEventListener("click", (event) => {
    event.stopPropagation();
    const panel = document.getElementById("customerNotifPanel");
    if (!panel) return;
    const opening = !panel.classList.contains("show");
    panel.classList.toggle("show");
    customerBellButton.setAttribute("aria-expanded", String(opening));
    if (opening) {
      const email = (localStorage.getItem("userEmail") || "").toLowerCase();
      const allNotifications = JSON.parse(
        localStorage.getItem("motofix_notifications") || "[]",
      );
      const visible = allNotifications.filter((notification) =>
        notification.audiences?.includes("customer") ||
        notification.audiences?.includes(`customer:${email}`),
      );
      const userKey = `customer:${email}`;
      visible.forEach((notification) => {
        const readBy = Array.isArray(notification.readBy) ? notification.readBy : [];
        if (!readBy.includes(userKey)) notification.readBy = [...readBy, userKey];
      });
      localStorage.setItem("motofix_notifications", JSON.stringify(allNotifications));
      renderCustomerNotifications();
      panel.classList.add("show");
    }
  });
  document.addEventListener(
    "click",
    (event) => {
      const panel = document.getElementById("customerNotifPanel");
      if (
        panel?.classList.contains("show") &&
        !panel.contains(event.target) &&
        !customerBellButton?.contains(event.target)
      ) {
        closeCustomerNotifications();
      }
    },
    true,
  );
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeCustomerNotifications();
  });
  window.addEventListener("storage", (event) => {
    if (event.key === "motofix_notifications") renderCustomerNotifications();
  });
  window.addEventListener("motofix:notifications-changed", renderCustomerNotifications);

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

  customerBellButton?.parentElement?.addEventListener("click", (event) => {
    const item = event.target.closest(".customer-notification-link[data-notification-id]");
    if (!item) return;
    const allNotifications = JSON.parse(
      localStorage.getItem("motofix_notifications") || "[]",
    );
    // destination and entity IDs are the notification-to-record contract used by all dashboards.
    const notification = allNotifications.find(
      (entry) => entry.id === item.dataset.notificationId,
    );
    if (!notification) return;

    event.preventDefault();
    const request = notification.permissionRequestId
      ? JSON.parse(localStorage.getItem("motofix_permission_requests") || "[]")
          .find((entry) => entry.id === notification.permissionRequestId)
      : null;
    const appointmentId = notification.appointmentId || request?.appointmentId;
    const title = String(notification.title || "").toLowerCase();
    const destination =
      notification.destination ||
      (request?.type?.startsWith("account_")
        ? "profile"
        : appointmentId
          ? "appointments"
          : /appointment|booking|job/.test(title)
            ? "appointments"
            : /invoice|transaction|payment|receipt/.test(title)
              ? "transactions"
              : /motorcycle|motorcycle registration/.test(title)
                ? "motorcycles"
                : /parts|stock/.test(title)
                  ? "parts"
                  : "dashboard");

    navLinks.forEach((link) => link.classList.remove("active"));
    const destinationIndex = {
      dashboard: 0,
      profile: 0,
      appointments: 1,
      motorcycles: 2,
      parts: 3,
      transactions: 4,
    }[destination] ?? 0;
    navLinks[destinationIndex]?.classList.add("active");
    if (destination === "appointments") {
      switchToAppointmentsPage();
      if (appointmentId) {
        window.dispatchEvent(
          new CustomEvent("motofix:open-customer-appointment", {
            detail: { appointmentId: String(appointmentId) },
          }),
        );
      } else if (request) {
        document.getElementById("edit-profile-btn")?.click();
      }
    } else if (destination === "parts") {
      switchToPartsPage();
    } else if (destination === "transactions") {
      switchToTransactionsPage();
      if (appointmentId) {
        window.dispatchEvent(
          new CustomEvent("motofix:open-customer-transaction", {
            detail: { appointmentId: String(appointmentId) },
          }),
        );
      }
    } else if (destination === "motorcycles") {
      switchToMotorcyclesPage();
    } else if (destination === "profile") {
      switchToDashboardPage();
      document.getElementById("edit-profile-btn")?.click();
    } else {
      switchToDashboardPage();
    }
    closeCustomerNotifications();
  });

  function switchToMotorcyclesPage() {
    if (dashView) dashView.style.display = "none";
    if (serviceView) serviceView.style.display = "none";
    if (motorcyclesView) motorcyclesView.style.display = "block";
    if (partsView) partsView.style.display = "none";
    if (transactionsView) transactionsView.style.display = "none";
    if (middleHeaderLabel)
      middleHeaderLabel.textContent = "My Motorcycles";
    if (middleHeaderSub)
      middleHeaderSub.textContent = "Manage your registered motorcycles";
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
  navLinks.forEach((link, index) => {
    link.addEventListener("click", () => {
      // Remove active from all, add to clicked
      navLinks.forEach((l) => l.classList.remove("active"));
      link.classList.add("active");

      // Handle page view switches based on index or text
      if (index === 0) {
        switchToDashboardPage(); // Customer Dashboard page
      } else if (index === 1) {
        switchToAppointmentsPage(); // My Appointments
      } else if (index === 2) {
        switchToMotorcyclesPage(); // My motorcycle page
      } else if (index === 3) {
        switchToPartsPage(); // Parts & Shop page
      } else if (index === 4) {
        switchToTransactionsPage(); // Parts & Shop page
      }
    });
  });

  if (dashBookBtn) {
    dashBookBtn.addEventListener("click", () => {
      navLinks.forEach((l) => l.classList.remove("active"));
      if (navLinks[1]) navLinks[1].classList.add("active"); // Index 2 is Service
      switchToServicePage();
    });
  }

  if (dashPartsBtn) {
    dashPartsBtn.addEventListener("click", () => {
      navLinks.forEach((l) => l.classList.remove("active"));
      if (navLinks[4]) navLinks[4].classList.add("active"); // Index 4 is Parts & Shop
      switchToPartsPage();
    });
  }

  if (dashTransactionsBtn) {
    dashTransactionsBtn.addEventListener("click", () => {
      navLinks.forEach((l) => l.classList.remove("active"));
      if (navLinks[5]) navLinks[5].classList.add("active"); // Index 5 is Transactions
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
