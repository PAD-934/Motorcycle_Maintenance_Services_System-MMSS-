const APPOINTMENT_STORAGE_KEY = "motofix_appointments";
const MASTER_EMPLOYEE_STORAGE_KEY = "motofix_master_employees";
const MOTORCYCLE_STORAGE_KEY = "motofix_motorcycles";
const PERMISSION_REQUESTS_STORAGE_KEY = "motofix_permission_requests";
/*
 * Cross-dashboard data contract (currently LocalStorage-backed; see
 * ../BACKEND_DATA_CONTRACT.md for the complete backend schema and role flows):
 * - motofix_appointments is the shared job/invoice source: Customer creates
 *   bookings, Admin/Master Admin manage them, and Mechanic updates assigned jobs.
 * - customerEmail and mechanic identify the linked customer and assigned mechanic;
 *   motorcycle/parts/services and transaction amounts are currently embedded snapshots.
 * - motofix_parts is the shared inventory catalog; appointment parts consume stock.
 * - motofix_users is the shared login/account list; Master Control employee records
 *   are also stored in motofix_master_employees and mirrored here for authentication.
 * - motofix_notifications and motofix_permission_requests carry cross-role messages
 *   and approvals, linked by audience/readBy and permissionRequestId/source IDs.
 * Keep these joins and write paths in sync when replacing LocalStorage with a backend.
 */
const FALLBACK_MECHANICS = [
  { name: "Ramon Santos", email: "mechanic1@motofix.com" },
  { name: "Jake Reyes", email: "mechanic2@motofix.com" },
];
const FALLBACK_ADMIN_ACCOUNT = {
  name: "Admin",
  email: "admin@motofix.com",
  role: "Admin",
  phone: "+63 912 000 0001",
  status: "Active",
};

const DATA = {
  pageMeta: {
    dashboard: { title: "Dashboard", sub: "Welcome back" },
    appointments: { title: "Appointments", sub: "Manage service scheduling" },
    services: {
      title: "Services & Types",
      sub: "Browse all service offerings",
    },
    "registered-motorcycles": {
      title: "Registered Motorcycle",
      sub: "Customer motorcycle registry",
    },
    inventory: {
      title: "Inventory & Parts",
      sub: "Parts catalog and stock management",
    },
    billing: {
      title: "Billing & Reports",
      sub: "Invoices, tax records & revenue analytics",
    },
    jobs: { title: "Mechanic Jobs", sub: "Job transaction records" },
    users: { title: "User Management", sub: "Customers, mechanics & admins" },
    "master-mechanics": {
      title: "Employee Manager",
      sub: "General Admin · Employee accounts",
    },
  },

  revenue: [],
  serviceMix: [],
  appointments: [],

  services: [],
  inventory: [],
  invoices: [],
  jobs: [],
  users: [],
  masterEmployees: [],
};

function readStoredArray(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }

  const savedAccounts = JSON.parse(
    localStorage.getItem("motofix_account_directory") || "null",
  );
  if (Array.isArray(savedAccounts)) DATA.users = savedAccounts;
  const registeredUsers = JSON.parse(
    localStorage.getItem("motofix_users") || "[]",
  );
  const disabledEmails = JSON.parse(
    localStorage.getItem("motofix_disabled_accounts") || "[]",
  );
  registeredUsers.forEach((user) => {
    const email = String(user.email || "")
      .trim()
      .toLowerCase();
    if (
      email &&
      !disabledEmails.includes(email) &&
      !DATA.users.some((account) => account.email.toLowerCase() === email)
    ) {
      DATA.users.push({
        name:
          user.name ||
          `${user.first_name || ""} ${user.last_name || ""}`.trim(),
        role:
          (user.role || "Customer").toLowerCase() === "master_admin"
            ? "Master Admin"
            : (user.role || "Customer").replace(/\b\w/g, (letter) =>
                letter.toUpperCase(),
              ),
        email,
        phone: user.phone || "",
        since: user.created_at || new Date().toISOString().slice(0, 10),
        initials: avatarInitials(user.name || user.first_name || "User"),
      });
    }
  });
  localStorage.setItem("motofix_account_directory", JSON.stringify(DATA.users));
}

function writeStoredArray(key, records) {
  localStorage.setItem(key, JSON.stringify(records));
}

function readProfileMap() {
  try {
    const profiles = JSON.parse(localStorage.getItem("motofix_profiles") || "{}");
    return profiles && typeof profiles === "object" && !Array.isArray(profiles) ? profiles : {};
  } catch {
    return {};
  }
}

function normalizeAccountRole(role) {
  const normalized = String(role || "Customer").toLowerCase();
  if (normalized === "master_admin") return "Master Admin";
  if (normalized === "admin" || normalized === "store admin") return "Admin";
  if (normalized === "mechanic") return "Mechanic";
  return "Customer";
}

function storedAmount(value) {
  const amount = Number.parseFloat(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(amount) ? amount : 0;
}

function canonicalAppointmentStatus(value) {
  const status = String(value || "Pending").trim();
  const aliases = {
    "complete transaction": "Completed",
    completed: "Completed",
    "work finished (unpaid)": "Unpaid",
  };
  return aliases[status.toLowerCase()] || status;
}

function rebuildDerivedDashboardData() {
  DATA.invoices = DATA.appointments.map((appointment) => {
    const services = Array.isArray(appointment.services)
      ? appointment.services
      : [appointment.services || "Service"];
    const parts = Array.isArray(appointment.parts) ? appointment.parts : [];
    const transaction = appointment.transaction || {};
    const status = canonicalAppointmentStatus(appointment.status);
    const isCancelled = status === "Cancelled";
    const total = isCancelled
      ? 0
      : storedAmount(transaction.total ?? appointment.total);
    const vat = isCancelled ? 0 : storedAmount(transaction.vat);

    return {
      id: transaction.id || `INV-${appointment.id}`,
      customer: appointment.customer || "Customer",
      jobRef: `J-${appointment.id}`,
      items: services.length + parts.length,
      subtotal: isCancelled ? 0 : storedAmount(transaction.subtotal ?? total - vat),
      vat,
      total,
      status,
      date: appointment.date || "",
      appointmentId: appointment.id,
    };
  });

  DATA.jobs = DATA.appointments.map((appointment) => ({
    id: `J-${appointment.id}`,
    apptRef: appointment.id,
    customer: appointment.customer || "Customer",
    bike: appointment.bike || appointment.motorcycle || "Unknown Motorcycle",
    mechanic: appointment.mechanic || "",
    initials: appointment.mechanic ? avatarInitials(appointment.mechanic) : "—",
    completedJobEditAuthorizedBy: appointment.completedJobEditAuthorizedBy || "",
    parts: Array.isArray(appointment.parts) ? appointment.parts.length : 0,
    cost: storedAmount(appointment.transaction?.total ?? appointment.total),
    note: appointment.notes || `Service requested: ${(Array.isArray(appointment.services) ? appointment.services : [appointment.services || "Service"]).join(", ")}`,
    status: canonicalAppointmentStatus(appointment.status),
  }));

  const monthlyRevenue = new Map();
  DATA.invoices.forEach((invoice) => {
    if (invoice.status !== "Completed" || !invoice.date) return;
    const month = invoice.date.slice(0, 7);
    monthlyRevenue.set(month, (monthlyRevenue.get(month) || 0) + invoice.total);
  });
  DATA.revenue = [...monthlyRevenue]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([month, value]) => ({
      month: new Date(`${month}-01T00:00:00`).toLocaleDateString("en", { month: "short" }),
      value,
    }));

  const categoryCounts = new Map();
  DATA.appointments.forEach((appointment) => {
    if (canonicalAppointmentStatus(appointment.status) !== "Completed") return;
    const services = Array.isArray(appointment.services)
      ? appointment.services
      : [appointment.services || "Service"];
    services.forEach((serviceName) => {
      const category = getServiceCategory(serviceName);
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
    });
  });
  const totalServices = [...categoryCounts.values()].reduce((sum, count) => sum + count, 0);
  const chartColors = ["#ff6b1a", "#f5b942", "#22c55e", "#3b82f6", "#a78bfa", "#06b6d4"];
  DATA.serviceMix = [...categoryCounts].map(([label, count], index) => ({
    label,
    count,
    pct: totalServices ? (count / totalServices) * 100 : 0,
    color: chartColors[index % chartColors.length],
  }));
}

function getServiceCategory(serviceName) {
  return DATA.services.find((service) => service.name === serviceName)?.category?.trim() || "Needs category";
}

function initLocalStorageData() {
  DATA.inventory = readStoredArray("motofix_parts");
  DATA.services = readStoredArray("motofix_services");
  DATA.appointments = readStoredArray(APPOINTMENT_STORAGE_KEY);
  DATA.masterEmployees = readStoredArray(MASTER_EMPLOYEE_STORAGE_KEY);

  const registeredUsers = readStoredArray("motofix_users").map((user) => {
    const baseName = user.name || [user.first_name, user.middle_name, user.last_name]
      .filter(Boolean)
      .join(" ");
    const savedProfile = readProfileMap()[user.email?.toLowerCase()] || {};
    const name = savedProfile.name || baseName;
    return {
      ...user,
      name,
      role: normalizeAccountRole(user.role),
      phone: savedProfile.phone || user.phone || "",
      since: user.created_at || "",
      initials: user.initials || avatarInitials(name || "User"),
    };
  });
  const userEmails = new Set(registeredUsers.map((user) => user.email?.toLowerCase()));
  const employeeUsers = DATA.masterEmployees
    .filter((employee) => !userEmails.has(employee.email?.toLowerCase()))
    .map((employee) => ({
      ...employee,
      name: readProfileMap()[employee.email?.toLowerCase()]?.name || employee.name,
      role: normalizeAccountRole(employee.role),
      phone: readProfileMap()[employee.email?.toLowerCase()]?.phone || employee.phone || "",
      since: employee.createdAt || "",
      initials: employee.initials || avatarInitials(employee.name || "Employee"),
    }));
  const users = [...registeredUsers, ...employeeUsers];
  const hasFallbackAdmin = users.some(
    (user) => user.email?.toLowerCase() === FALLBACK_ADMIN_ACCOUNT.email,
  );
  const fallbackAdminDeleted = readStoredArray("motofix_deleted_accounts")
    .some((email) => String(email).toLowerCase() === FALLBACK_ADMIN_ACCOUNT.email);
  const fallbackAdminProfile =
    readProfileMap()[FALLBACK_ADMIN_ACCOUNT.email.toLowerCase()] || {};
  DATA.users = [
    ...users,
    ...(!hasFallbackAdmin && !fallbackAdminDeleted
      ? [{
          ...FALLBACK_ADMIN_ACCOUNT,
          name: fallbackAdminProfile.name || FALLBACK_ADMIN_ACCOUNT.name,
          phone: fallbackAdminProfile.phone || FALLBACK_ADMIN_ACCOUNT.phone,
          initials: avatarInitials(fallbackAdminProfile.name || FALLBACK_ADMIN_ACCOUNT.name),
          since: "Built-in account",
        }]
      : []),
  ];
  rebuildDerivedDashboardData();
}
initLocalStorageData();

function renderAdminDashboardStats() {
  const email = (localStorage.getItem("userEmail") || "").trim().toLowerCase();
  const account = DATA.users.find((user) => user.email?.toLowerCase() === email);
  const savedProfile = readProfileMap()[email] || {};
  const name = savedProfile.name || account?.name || localStorage.getItem("userFullName") || email || "Admin";
  const setText = (id, value) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  };
  const totalRevenue = DATA.revenue.reduce((sum, month) => sum + month.value, 0);
  const activeJobs = DATA.appointments.filter(
    (appointment) => !["Completed", "Cancelled"].includes(canonicalAppointmentStatus(appointment.status)),
  ).length;
  const lowStock = DATA.inventory.filter(
    (part) => Number(part.stock) <= Number(part.reorderLevel ?? 10),
  ).length;
  const customers = DATA.users.filter((user) => user.role === "Customer").length;
  const firstName = name.split(/\s+/)[0];
  const period = DATA.revenue.length
    ? `${DATA.revenue[0].month} – ${DATA.revenue.at(-1).month}`
    : "No stored revenue yet";

  setText("adminName", name);
  setText("adminEmail", email);
  setText("adminAvatar", avatarInitials(name));
  setText("adminFooterAvatar", avatarInitials(name));
  setText("adminFooterName", name);
  setText("adminFooterRole", account?.role || normalizeAccountRole(localStorage.getItem("userRole")));
  setText("pageSubtitle", `Welcome back, ${firstName}`);
  DATA.pageMeta.dashboard.sub = `Welcome back, ${firstName}`;
  setText("totalRevenueTitle", "Total Revenue");
  setText("totalRevenueValue", peso(totalRevenue));
  setText("activeJobsValue", activeJobs);
  setText("lowStockCount", lowStock);
  setText("customerCount", customers);
  setText("revenuePeriod", period);
}

/* ===================== HELPERS ===================== */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const peso = (n) =>
  "₱" +
  Number(n).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function statusBadge(status) {
  const map = {
    Pending: "badge-pending",
    Confirmed: "badge-confirmed",
    "In Progress": "badge-inprogress",
    Completed: "badge-completed",
    Unpaid: "badge-unpaid",
    Cancelled: "badge-cancelled",
    Paid: "badge-paid",
    Active: "badge-active",
    Healthy: "badge-healthy",
    Warning: "badge-warning",
    Critical: "badge-critical",
    "In Stock": "badge-active",
    "Low on Stock": "badge-warning",
    "Out of Stock": "badge-out-of-stock",
  };
  const label = status === "Unpaid" ? "Work Finished (unpaid)" : status;
  return `<span class="badge ${map[status] || ""}">${label.toUpperCase()}</span>`;
}

function getInventoryStockStatus(part) {
  const stock = Number(typeof part === "object" ? part.stock : part) || 0;
  const configuredThreshold =
    typeof part === "object" ? Number(part.reorderLevel ?? 10) : 10;
  const threshold = Number.isFinite(configuredThreshold)
    ? configuredThreshold
    : 10;
  if (stock <= 0) return { label: "Out of Stock", color: "var(--red)" };
  if (stock <= threshold)
    return { label: "Low on Stock", color: "var(--amber)" };
  return { label: "In Stock", color: "var(--green)" };
}

function renderLowStockAlert() {
  const card = $("#lowStockCard");
  const countElement = $("#lowStockCount");
  const summaryElement = $("#lowStockSummary");
  if (!card || !countElement || !summaryElement) return;

  const statuses = DATA.inventory.map(getInventoryStockStatus);
  const outOfStock = statuses.filter(
    (status) => status.label === "Out of Stock",
  ).length;
  const lowStock = statuses.filter(
    (status) => status.label === "Low on Stock",
  ).length;
  const needsAttention = outOfStock + lowStock;

  countElement.textContent = String(needsAttention);
  summaryElement.textContent = needsAttention
    ? `${outOfStock} out of stock · ${lowStock} low stock`
    : "All parts sufficiently stocked";

  card.classList.toggle("has-stock-alert", needsAttention > 0);
  card.classList.toggle("stock-alert-critical", outOfStock > 0);
}

function avatarInitials(name) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function escapeDashboardHtml(value) {
  return String(value ?? "").replace(/[&<>\"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function renderAdminNotifications() {
  const button = document.getElementById("adminBellBtn");
  if (!button) return;
  if (window.MotoFixNotifications) {
    window.MotoFixNotifications.init({
      buttonId: "adminBellBtn",
      panelId: "adminNotifPanel",
      role: localStorage.getItem("userRole") || "admin",
      onOpen: (notification) => openAdminNotification(notification.id),
      onReviewRequests: () => {
        goToPage("users");
        const requestPanel = document.getElementById("accountPermissionPanel");
        requestPanel?.scrollIntoView({ behavior: "smooth", block: "start" });
        requestPanel?.focus({ preventScroll: true });
      },
    });
    return;
  }
  const role = localStorage.getItem("userRole") || "admin";
  const reader = localStorage.getItem("userEmail") || role;
  let allNotifications = [];
  try {
    const storedNotifications = JSON.parse(
      localStorage.getItem("motofix_notifications") || "[]",
    );
    if (Array.isArray(storedNotifications))
      allNotifications = storedNotifications;
  } catch (error) {
    console.error("Unable to read notifications from storage.", error);
  }
  const notifications = allNotifications.filter((notification) =>
    notification.audiences?.includes(role),
  );
  let panel = document.getElementById("adminNotifPanel");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "adminNotifPanel";
    panel.className = "admin-notifications-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Notifications");
    panel.hidden = true;
    document.body.appendChild(panel);

    panel.addEventListener("click", (event) => {
      const action = event.target.closest("[data-notification-action]");
      if (!action) return;
      event.stopPropagation();

      const actionName = action.dataset.notificationAction;
      if (actionName === "open-notification") {
        openAdminNotification(action.dataset.notificationId);
      } else if (actionName === "close") {
        panel.hidden = true;
        button.setAttribute("aria-expanded", "false");
        button.focus();
      } else if (actionName === "filter") {
        panel.dataset.filter = action.dataset.filter;
        renderAdminNotifications();
      } else if (actionName === "mark-all-read") {
        (panel.notificationRecords || []).forEach((notification) => {
          if (!notification.audiences?.includes(role)) return;
          notification.readBy = Array.isArray(notification.readBy)
            ? notification.readBy
            : [];
          if (!notification.readBy.includes(reader))
            notification.readBy.push(reader);
        });
        localStorage.setItem(
          "motofix_notifications",
          JSON.stringify(panel.notificationRecords || []),
        );
        panel.dataset.headerMenu = "";
        renderAdminNotifications();
      } else if (actionName === "toggle-header-menu") {
        panel.dataset.headerMenu =
          panel.dataset.headerMenu === "open" ? "" : "open";
        renderAdminNotifications();
      } else if (actionName === "review-requests") {
        panel.hidden = true;
        panel.dataset.headerMenu = "";
        button.setAttribute("aria-expanded", "false");
        goToPage("users");
        const requestPanel = document.getElementById("accountPermissionPanel");
        requestPanel?.scrollIntoView({ behavior: "smooth", block: "start" });
        requestPanel?.focus({ preventScroll: true });
      } else if (actionName === "toggle-menu") {
        panel.dataset.openMenu =
          panel.dataset.openMenu === action.dataset.notificationId
            ? ""
            : action.dataset.notificationId;
        renderAdminNotifications();
      } else if (actionName === "toggle-read") {
        const notification = (panel.notificationRecords || []).find(
          (item) => item.id === action.dataset.notificationId,
        );
        if (!notification) return;
        notification.readBy = Array.isArray(notification.readBy)
          ? notification.readBy
          : [];
        if (notification.readBy.includes(reader)) {
          notification.readBy = notification.readBy.filter(
            (email) => email !== reader,
          );
        } else {
          notification.readBy.push(reader);
        }
        localStorage.setItem(
          "motofix_notifications",
          JSON.stringify(panel.notificationRecords || []),
        );
        panel.dataset.openMenu = "";
        renderAdminNotifications();
      }
    });

    document.addEventListener("click", (event) => {
      if (!panel.contains(event.target) && !button.contains(event.target)) {
        panel.hidden = true;
        button.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !panel.hidden) {
        panel.hidden = true;
        button.setAttribute("aria-expanded", "false");
        button.focus();
      }
    });
  }
  panel.notificationRecords = allNotifications;
  const isRead = (notification) =>
    Array.isArray(notification.readBy) && notification.readBy.includes(reader);
  const unreadCount = notifications.filter(
    (notification) => !isRead(notification),
  ).length;
  const activeFilter = panel.dataset.filter || "all";
  const visibleNotifications = notifications.filter(
    (notification) => activeFilter !== "unread" || !isRead(notification),
  );
  const pendingAccountRequests =
    role === "master_admin"
      ? getAccountRequests().filter((request) => request.status === "Pending")
          .length
      : 0;
  const headerMenuOpen = panel.dataset.headerMenu === "open";
  const iconForNotification = (notification) => {
    const content =
      `${notification.title} ${notification.message}`.toLowerCase();
    if (content.includes("appointment"))
      return { symbol: "📅", tone: "appointment" };
    if (content.includes("account") || content.includes("employee"))
      return { symbol: "👤", tone: "account" };
    if (content.includes("part") || content.includes("inventory"))
      return { symbol: "📦", tone: "inventory" };
    return { symbol: "🔔", tone: "general" };
  };
  const timeAgo = (createdAt) => {
    const timestamp = new Date(createdAt).getTime();
    if (!Number.isFinite(timestamp)) return "Recently";
    const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return days < 7 ? `${days}d ago` : new Date(timestamp).toLocaleDateString();
  };

  panel.innerHTML = `
    <header class="admin-notifications-header">
      <div class="admin-notifications-heading">
        <span class="admin-notifications-bell" aria-hidden="true">🔔</span>
        <div>
          <h2>Notifications</h2>
          <p>Updates for your MotoFix workspace</p>
        </div>
      </div>
      <div class="admin-notifications-tools">
        <div class="notification-header-menu-wrap">
          <button type="button" class="notification-icon-action" data-notification-action="toggle-header-menu" aria-label="More notification actions" title="More options" aria-expanded="${headerMenuOpen}">⋯</button>
          ${
            headerMenuOpen
              ? `<div class="notification-header-menu" role="menu">
            <button type="button" role="menuitem" data-notification-action="mark-all-read" ${unreadCount ? "" : "disabled"}>Mark all as read</button>
            ${pendingAccountRequests ? `<button type="button" role="menuitem" data-notification-action="review-requests">Review ${pendingAccountRequests} account request${pendingAccountRequests === 1 ? "" : "s"}</button>` : ""}
          </div>`
              : ""
          }
        </div>
        <button type="button" class="notification-icon-action" data-notification-action="close" aria-label="Close notifications" title="Close">×</button>
      </div>
    </header>
    <div class="admin-notifications-tabs" role="group" aria-label="Notification filter">
      <button type="button" aria-pressed="${activeFilter === "all"}" class="${activeFilter === "all" ? "active" : ""}" data-notification-action="filter" data-filter="all">All <span>${notifications.length}</span></button>
      <button type="button" aria-pressed="${activeFilter === "unread"}" class="${activeFilter === "unread" ? "active" : ""}" data-notification-action="filter" data-filter="unread">Unread <span>${unreadCount}</span></button>
    </div>
    <div class="admin-notifications-content">
      <div class="admin-notifications-section-title">
        <span>ACTIVITY</span><span class="notification-count">${visibleNotifications.length}</span>
      </div>
      ${
        visibleNotifications.length
          ? `<div class="admin-notification-list">${visibleNotifications
              .map((notification) => {
                const icon = iconForNotification(notification);
                const read = isRead(notification);
                const menuOpen = panel.dataset.openMenu === notification.id;
                return `<article class="admin-notification-item ${read ? "is-read" : "is-unread"}">
                <button type="button" class="admin-notification-open" data-notification-action="open-notification" data-notification-id="${escapeAccountText(notification.id)}" aria-label="Open ${escapeAccountText(notification.title || "notification")}">
                  <span class="notification-type-icon ${icon.tone}" aria-hidden="true">${icon.symbol}</span>
                  <span class="admin-notification-copy">
                    <span class="admin-notification-title-row"><strong>${escapeAccountText(notification.title || "Notification")}</strong>${read ? "" : '<span class="notification-unread-dot" aria-label="Unread"></span>'}</span>
                    <span class="admin-notification-message">${escapeAccountText(notification.message || "There is a new update.")}</span>
                    <time>${escapeAccountText(timeAgo(notification.createdAt))}</time>
                  </span>
                </button>
                <div class="admin-notification-more-wrap">
                  <button type="button" class="notification-more-button" data-notification-action="toggle-menu" data-notification-id="${escapeAccountText(notification.id)}" aria-label="More options for notification" aria-expanded="${menuOpen}">⋯</button>
                  ${menuOpen ? `<div class="notification-item-menu"><button type="button" data-notification-action="toggle-read" data-notification-id="${escapeAccountText(notification.id)}">${read ? "Mark as unread" : "Mark as read"}</button></div>` : ""}
                </div>
              </article>`;
              })
              .join("")}</div>`
          : `<div class="admin-notifications-empty"><span aria-hidden="true">✓</span><strong>${activeFilter === "unread" ? "You’re all caught up" : "No notifications yet"}</strong><p>${activeFilter === "unread" ? "New unread activity will appear here." : "Important account and appointment updates will appear here."}</p></div>`
      }
    </div>`;

  const dot = button.querySelector(".dot");
  if (dot) dot.style.display = unreadCount ? "block" : "none";
  button.onclick = (event) => {
    event.stopPropagation();
    panel.hidden = !panel.hidden;
    button.setAttribute("aria-expanded", String(!panel.hidden));
  };
  button.setAttribute("aria-haspopup", "dialog");
  button.setAttribute("aria-expanded", String(!panel.hidden));
}

function openAdminNotification(notificationId) {
  let notifications = [];
  try {
    const stored = JSON.parse(
      localStorage.getItem("motofix_notifications") || "[]",
    );
    if (Array.isArray(stored)) notifications = stored;
  } catch (error) {
    console.error("Unable to open notification target.", error);
  }

  const notification = notifications.find((item) => item.id === notificationId);
  if (!notification) return;

  const reader =
    localStorage.getItem("userEmail") ||
    localStorage.getItem("userRole") ||
    "admin";
  notification.readBy = Array.isArray(notification.readBy)
    ? notification.readBy
    : [];
  if (!notification.readBy.includes(reader)) notification.readBy.push(reader);
  localStorage.setItem("motofix_notifications", JSON.stringify(notifications));

  const panel = document.getElementById("adminNotifPanel");
  const button = document.getElementById("adminBellBtn");
  if (panel) panel.hidden = true;
  button?.setAttribute("aria-expanded", "false");
  renderAdminNotifications();

  const content =
    `${notification.title || ""} ${notification.message || ""}`.toLowerCase();
  if (content.includes("account change") || notification.requestId) {
    goToPage("users");
    renderUsers();
    const requestPanel = document.getElementById("accountPermissionPanel");
    requestPanel?.scrollIntoView({ behavior: "smooth", block: "start" });
    const requestRow = [
      ...document.querySelectorAll("[data-account-request-row]"),
    ].find((row) => row.dataset.accountRequestRow === notification.requestId);
    if (requestRow) {
      requestRow.classList.add("account-request-highlight");
      requestRow.scrollIntoView({ behavior: "smooth", block: "center" });
      requestRow.focus({ preventScroll: true });
      window.setTimeout(
        () => requestRow.classList.remove("account-request-highlight"),
        2600,
      );
    }
    return;
  }

  if (content.includes("appointment") || content.includes("parts request")) {
    syncAppointmentsFromStorage();
    const notificationMessage = (notification.message || "").toLowerCase();
    const appointment =
      DATA.appointments.find(
        (item) => String(item.id) === String(notification.appointmentId),
      ) ||
      DATA.appointments.find(
        (item) =>
          item.parts?.length &&
          notification.customerEmail &&
          item.customerEmail?.toLowerCase() ===
            notification.customerEmail.toLowerCase(),
      ) ||
      DATA.appointments.find(
        (item) =>
          notificationMessage.includes(item.customer.toLowerCase()) &&
          notificationMessage.includes(item.bike.toLowerCase()),
      );
    goToPage("appointments");
    if (appointment) openAppointmentModal(appointment.id);
    return;
  }

  if (content.includes("inventory") || content.includes("stock")) {
    goToPage("inventory");
    return;
  }

  goToPage("appointments");
}

/* ===================== NAVIGATION ===================== */
function goToPage(page) {
  $$(".nav-item").forEach((b) =>
    b.classList.toggle("active", b.dataset.page === page),
  );
  $$(".page").forEach((p) =>
    p.classList.toggle("active", p.id === "page-" + page),
  );
  const meta = DATA.pageMeta[page];
  if (meta) {
    $("#pageTitle").textContent = meta.title;
    $("#pageSubtitle").textContent = meta.sub;
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

$$(".nav-item").forEach((btn) =>
  btn.addEventListener("click", () => goToPage(btn.dataset.page)),
);
$$("[data-page].link-arrow, [data-page].low-stock-card").forEach((a) =>
  a.addEventListener("click", (e) => {
    e.preventDefault();
    goToPage(a.dataset.page);
  }),
);

/* ===================== NAVIGATION & SIDEBAR ===================== */
const sidebar = $("#sidebar");
const menuToggle = $("#menuToggle");
const sidebarBackdrop = $("#sidebarBackdrop");

function updateSidebarState() {
  const isMobile = window.innerWidth <= 860;
  const isOpen = isMobile
    ? sidebar.classList.contains("open")
    : !sidebar.classList.contains("collapsed");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute(
    "aria-label",
    isOpen ? "Close navigation" : "Open navigation",
  );
}

function toggleSidebar() {
  const isMobile = window.innerWidth <= 860;

  if (isMobile) {
    sidebar.classList.toggle("open");
  } else {
    sidebar.classList.toggle("collapsed");
  }

  if (sidebarBackdrop) {
    const isOpen = isMobile
      ? sidebar.classList.contains("open")
      : !sidebar.classList.contains("collapsed");
    sidebarBackdrop.classList.toggle("active", isOpen);
  }

  updateSidebarState();
}

if (menuToggle) {
  menuToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleSidebar();
  });
}

window.addEventListener("resize", () => {
  updateSidebarState();

  if (sidebarBackdrop) {
    const isMobile = window.innerWidth <= 860;
    const isOpen = isMobile
      ? sidebar.classList.contains("open")
      : !sidebar.classList.contains("collapsed");
    sidebarBackdrop.classList.toggle("active", isOpen);
  }
});

updateSidebarState();

const userMenu = $("#userMenu");
const userMenuToggle = $("#userMenuToggle");
userMenuToggle.addEventListener("click", () => {
  const isOpen = userMenu.classList.toggle("open");
  userMenuToggle.setAttribute("aria-expanded", String(isOpen));
});
document.addEventListener("click", (e) => {
  if (!userMenu.contains(e.target)) {
    userMenu.classList.remove("open");
    userMenuToggle.setAttribute("aria-expanded", "false");
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    userMenu.classList.remove("open");
    userMenuToggle.setAttribute("aria-expanded", "false");
  }
});
$("#signOutBtn").addEventListener("click", () => {
  window.location.href = "login.html";
});

/* ===================== MODAL ===================== */
function openModal(title, bodyHTML) {
  $("#modalBackdrop .modal")?.classList.remove("profile-editor-modal");
  $("#modalTitle").textContent = title;
  $("#modalBody").innerHTML = bodyHTML;
  $("#modalBackdrop").classList.add("open");
}
$("#modalClose").addEventListener("click", () =>
  $("#modalBackdrop").classList.remove("open"),
);
$("#modalBackdrop").addEventListener("click", (e) => {
  if (e.target.id === "modalBackdrop")
    $("#modalBackdrop").classList.remove("open");
});

function openAdminProfileEditor() {
  const email = (localStorage.getItem("userEmail") || "").trim().toLowerCase();
  if (!email) return;
  const canRequestDeletion = localStorage.getItem("userRole") === "admin";
  const savedProfile = readProfileMap()[email] || {};
  const account = DATA.users.find((user) => user.email?.toLowerCase() === email);
  const name = savedProfile.name || account?.name || localStorage.getItem("userFullName") || email;
  const phone = savedProfile.phone || account?.phone || "";

  openModal(
    "Edit Profile",
    `
      <form id="admin-profile-form">
        <div class="field"><label for="admin-profile-name">Full Name</label><input id="admin-profile-name" value="${escapeDashboardHtml(name)}" required></div>
        <div class="field"><label for="admin-profile-email">Email</label><output id="admin-profile-email" class="profile-email-display" aria-label="Login email address">${escapeDashboardHtml(email)}</output></div>
        <div class="field"><label for="admin-profile-phone">Phone</label><input id="admin-profile-phone" type="tel" value="${escapeDashboardHtml(phone)}"></div>
        <button class="btn-primary" type="submit" style="width:100%;margin-top:6px;">Save Profile</button>
        ${canRequestDeletion ? '<section class="account-danger-action"><div class="account-danger-description">Warning: this sends a private deletion request to the Master Admin for approval. Other store admins will not be notified.</div><button class="btn-view account-delete-request-btn" type="button" id="request-admin-account-deletion">Request Account Deletion</button></section>' : ""}
      </form>
    `,
  );
  $("#modalBackdrop .modal")?.classList.add("profile-editor-modal");

  $("#admin-profile-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const nextName = $("#admin-profile-name").value.trim();
    const nextPhone = $("#admin-profile-phone").value.trim();
    if (!nextName) return window.alert("Please enter your name.");
    if (nextPhone && !/^[0-9+\-\s()]{7,20}$/.test(nextPhone)) {
      return window.alert("Please enter a valid phone number.");
    }
    if (!window.confirm("Are you sure you want to save these profile changes?")) return;

    const profiles = readProfileMap();
    profiles[email] = { ...(profiles[email] || {}), name: nextName, phone: nextPhone };
    localStorage.setItem("motofix_profiles", JSON.stringify(profiles));
    localStorage.setItem("userFullName", nextName);

    const users = readStoredArray("motofix_users");
    const user = users.find((record) => record.email?.toLowerCase() === email);
    if (user) {
      user.name = nextName;
      user.first_name = nextName.split(/\s+/)[0];
      user.phone = nextPhone;
      user.initials = avatarInitials(nextName);
      user.updated_at = new Date().toISOString();
      writeStoredArray("motofix_users", users);
    }

    const employees = readStoredArray(MASTER_EMPLOYEE_STORAGE_KEY);
    const employee = employees.find((record) => record.email?.toLowerCase() === email);
    if (employee) {
      employee.name = nextName;
      employee.phone = nextPhone;
      writeStoredArray(MASTER_EMPLOYEE_STORAGE_KEY, employees);
    }

    initLocalStorageData();
    renderAdminDashboardStats();
    renderUsers();
    renderMasterEmployees();
    renderRegisteredMotorcycles();
    $("#modalBackdrop").classList.remove("open");
  });

  $("#request-admin-account-deletion")?.addEventListener("click", () => {
    const target = account || {
      email,
      name,
      role: localStorage.getItem("userRole") || "Admin",
    };
    if (confirmAccountDeletionRequest(target, true)) {
      $("#modalBackdrop")?.classList.remove("open");
    }
  });
}

$("#editAdminProfileBtn")?.addEventListener("click", () => {
  $("#userMenu")?.classList.remove("open");
  $("#userMenuToggle")?.setAttribute("aria-expanded", "false");
  openAdminProfileEditor();
});

// 1. Hooks up the "Add New Part" button to your existing modal
document.getElementById("openAddPartBtn")?.addEventListener("click", () => {
  openModal(
    "Add New Part",
    `
        <form id="addPartForm">
            <div style="margin-bottom: 12px;">
                <label style="display:block; margin-bottom:4px; font-weight:500;">Part Name</label>
                <input type="text" id="newPartName" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
            </div>
            <div style="margin-bottom: 12px;">
                <label style="display:block; margin-bottom:4px; font-weight:500;">SKU</label>
                <input type="text" id="newPartSku" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
            </div>
            <div style="margin-bottom: 12px;">
                <label style="display:block; margin-bottom:4px; font-weight:500;">Brand</label>
                <input type="text" id="newPartBrand" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
            </div>
            <div style="margin-bottom: 12px;">
                <label style="display:block; margin-bottom:4px; font-weight:500;">Category</label>
                <input type="text" id="newPartCategory" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
            </div>
            <div style="margin-bottom: 12px;">
                <label style="display:block; margin-bottom:4px; font-weight:500;">Initial Stock</label>
                <input type="number" id="newPartStock" min="0" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
            </div>
            <div style="margin-bottom: 12px;">
                <label style="display:block; margin-bottom:4px; font-weight:500;">Unit Price (₱)</label>
                <input type="number" id="newPartPrice" step="0.01" min="0" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
            </div>
            <button type="submit" class="btn-primary" style="width:100%; margin-top:10px;">Save Part</button>
        </form>
    `,
  );
});

// 2. Hooks up the "Add New Service" button to your existing modal
document.getElementById("openAddServiceBtn")?.addEventListener("click", () => {
  openModal(
    "Add New Service",
    `
        <form id="addServiceForm">
            <div style="margin-bottom: 12px;">
                <label style="display:block; margin-bottom:4px; font-weight:500;">Service Name</label>
                <input type="text" id="newServiceName" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
            </div>
            <div style="margin-bottom: 12px;">
                <label style="display:block; margin-bottom:4px; font-weight:500;">Category</label>
                <input type="text" id="newServiceCategory" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
            </div>
            <div style="margin-bottom: 12px;">
                <label style="display:block; margin-bottom:4px; font-weight:500;">Description</label>
                <textarea id="newServiceDesc" rows="3" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;"></textarea>
            </div>
            <div style="margin-bottom: 12px;">
                <label style="display:block; margin-bottom:4px; font-weight:500;">Price (₱)</label>
                <input type="number" id="newServicePrice" step="0.01" min="0" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
            </div>
            <div style="margin-bottom: 12px;">
                <label style="display:block; margin-bottom:4px; font-weight:500;">Duration Label (e.g. 1.0 hrs)</label>
                <input type="text" id="newServiceHours" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;" value="1.0 hrs">
            </div>
            <button type="submit" class="btn-primary" style="width:100%; margin-top:10px;">Save Service</button>
        </form>
    `,
  );
});

/* =========================================================
   UPDATE BLOCK 2: LOCAL STORAGE FORM SUBMISSION HANDLERS
   Captures form inputs, stores items into localStorage,
   updates runtime DATA array, and re-renders UI components.
========================================================= */
document.addEventListener("submit", (e) => {
  // Handle Part Form Submit
  if (e.target && e.target.id === "addPartForm") {
    e.preventDefault();

    const newPart = {
      name: document.getElementById("newPartName").value,
      sku: document.getElementById("newPartSku").value,
      brand: document.getElementById("newPartBrand").value,
      category: document.getElementById("newPartCategory").value,
      stock: parseInt(document.getElementById("newPartStock").value, 10),
      max: 60,
      price: parseFloat(document.getElementById("newPartPrice").value),
    };

    // Update local storage array
    let partsList = JSON.parse(localStorage.getItem("motofix_parts")) || [];
    try {
      partsList.push(newPart);
      partsList = window.updateInventoryLowStockAlerts(partsList);
      localStorage.setItem("motofix_parts", JSON.stringify(partsList));
    } catch (error) {
      console.error("Unable to save new inventory part:", error);
      window.alert(error.message || "Unable to save the new part.");
      return;
    }

    // Sync main DATA object and re-render inventory view
    DATA.inventory = partsList;
    renderInvFilters();
    renderInventoryTable();

    // Close modal
    document.getElementById("modalBackdrop").classList.remove("open");
  }

  // Handle Service Form Submit
  if (e.target && e.target.id === "addServiceForm") {
    e.preventDefault();

    const newServiceCode = "S" + (DATA.services.length + 1);
    const newService = {
      code: newServiceCode,
      name: document.getElementById("newServiceName").value,
      category: document.getElementById("newServiceCategory").value,
      price: parseFloat(document.getElementById("newServicePrice").value),
      hours: 1,
      hoursLabel: document.getElementById("newServiceHours").value,
      desc: document.getElementById("newServiceDesc").value,
    };

    // Update local storage array
    let servicesList =
      JSON.parse(localStorage.getItem("motofix_services")) || [];
    servicesList.push(newService);
    localStorage.setItem("motofix_services", JSON.stringify(servicesList));

    // Sync main DATA object and re-render services view
    DATA.services = servicesList;
    renderServiceFilters();
    renderServicesGrid();

    // Close modal
    document.getElementById("modalBackdrop").classList.remove("open");
  }
});

/* ===================== DASHBOARD: BAR CHART ===================== */
function renderBarChart(containerId, data) {
  const el = $("#" + containerId);
  if (!el) return;
  if (!data.length) {
    el.innerHTML = '<div class="empty-chart">No revenue data stored.</div>';
    return;
  }
  const max = Math.max(...data.map((d) => d.value));
  const step = Math.ceil(max / 4 / 25000) * 25000 || 25000;
  const top = step * 4;

  const yLabels = [4, 3, 2, 1, 0].map(
    (i) => `₱${Math.round((step * i) / 1000)}k`,
  );

  el.innerHTML = `
    <div class="bar-ylabels">${yLabels.map((l) => `<span>${l}</span>`).join("")}</div>
    ${data
      .map(
        (d) => `
      <div class="bar-col">
        <div class="bar" style="height:${((d.value / top) * 100).toFixed(1)}%" title="${peso(d.value)}"></div>
        <div class="bar-label">${d.month}</div>
      </div>
    `,
      )
      .join("")}
  `;
}

/* ===================== DASHBOARD: PIE CHART ===================== */
function renderPieChart(pieId, legendId, data) {
  const pieEl = $("#" + pieId);
  const legendEl = $("#" + legendId);
  if (!pieEl || !legendEl) return;
  if (!data.length) {
    pieEl.style.background = "transparent";
    legendEl.innerHTML = '<li class="empty-chart">No appointment data stored.</li>';
    return;
  }
  let acc = 0;
  const stops = data
    .map((d) => {
      const start = acc;
      acc += d.pct;
      return `${d.color} ${start}% ${acc}%`;
    })
    .join(", ");
  pieEl.style.background = `conic-gradient(${stops})`;

  legendEl.innerHTML = data
    .map(
      (d) => `
    <li>
      <span class="swatch" style="background:${d.color}"></span>
      <span class="lname">${d.label}</span>
      <span class="lval">${d.pct.toFixed(2)}%</span>
    </li>
  `,
    )
    .join("");
}

/* ===================== SHARED APPOINTMENT STORAGE ===================== */
function syncAppointmentsFromStorage() {
  const stored = JSON.parse(
    localStorage.getItem(APPOINTMENT_STORAGE_KEY) || "[]",
  );
  if (Array.isArray(stored) && stored.length > 0) {
    DATA.appointments = stored.map((item) => ({
      id: item.id || `A${DATA.appointments.length + 1}`,
      customer: item.customer || "Customer",
      phone: item.phone || "N/A",
      initials: item.initials || "CU",
      bike: item.bike || item.motorcycle || "Unknown Motorcycle",
      services: Array.isArray(item.services)
        ? item.services
        : [item.services || "Service"],
      date: item.date || "",
      time: item.time || "",
      customerEmail: item.customerEmail || "",
      mechanic: item.mechanic || null,
      status: item.status || "Pending",
      notes: item.notes || "",
      parts: Array.isArray(item.parts) ? item.parts : [],
      createdAt: item.createdAt || new Date().toISOString(),
    }));
  }
}

function persistAppointments() {
  // Admin and Master Admin write the same appointment records consumed by Customer and Mechanic.
  writeStoredArray(APPOINTMENT_STORAGE_KEY, DATA.appointments);
  rebuildDerivedDashboardData();
  renderInvoices();
  renderJobs();
  renderBarChart("revenueChart", DATA.revenue);
  renderBarChart("revenueChart2", DATA.revenue);
  renderPieChart("serviceMixPie", "serviceMixLegend", DATA.serviceMix);
  renderAdminDashboardStats();
  renderRevenueStatsAndBreakdown();
}

/* ===================== APPOINTMENTS TABLE & NATIVE MODAL ===================== */

const STATUS_FLOW = [
  "Pending",
  "Confirmed",
  "In Progress",
  "Completed",
  "Cancelled",
  "Unpaid",
];

const MECHANIC_JOB_STATUS_FLOW = [
  { value: "Pending", label: "Pending" },
  { value: "In Progress", label: "In Progress" },
  { value: "Unpaid", label: "Work Finished (unpaid)" },
  { value: "Complete transaction", label: "Complete" },
  { value: "Cancelled", label: "Cancelled" },
];

// Consistent Custom Status Badge Generator for Table Rows & Modals
function getCustomStatusBadge(status) {
  let bg = "rgba(255,255,255,0.1)";
  let color = "#ffffff";

  if (status === "Pending") {
    bg = "rgba(234, 179, 8, 0.15)";
    color = "#facc15";
  } else if (status === "Confirmed") {
    bg = "rgba(59, 130, 246, 0.15)";
    color = "#60a5fa";
  } else if (status === "In Progress") {
    bg = "rgba(249, 115, 22, 0.15)";
    color = "#fb923c";
  } // Distinct Orange
  else if (status === "Work Finished (unpaid)" || status === "Unpaid") {
    bg = "rgba(168, 85, 247, 0.15)";
    color = "#c084fc";
  } // Distinct Purple
  else if (status === "Complete transaction") {
    bg = "rgba(16, 185, 129, 0.15)";
    color = "#34d399";
  } else if (status === "Cancelled") {
    bg = "rgba(239, 68, 68, 0.15)";
    color = "#f87171";
  }

  return `
        <span style="
            background: ${bg}; 
            color: ${color}; 
            padding: 4px 10px; 
            border-radius: 20px; 
            font-size: 12.5px; 
            font-weight: 600; 
            font-family: 'Barlow Condensed', sans-serif; 
            letter-spacing: 0.5px; 
            text-transform: uppercase; 
            display: inline-block;
            text-align: center;">
            ${status}
        </span>
    `;
}

function apptRowHTML(a) {
  return `
    <tr style="cursor: pointer;" onclick="openAppointmentModal('${a.id}')">
      <td class="subtext">${a.id || ""}</td>
      <td>
        <div class="person">
          <div class="avatar">${a.initials || "MC"}</div>
          <div>
            <div class="person-name">${a.customer}</div>
            <div class="person-sub">${a.phone || "N/A"}</div>
          </div>
        </div>
      </td>
      <td>${a.bike}</td>
      <td>${Array.isArray(a.services) ? a.services.join(", ") : a.services}</td>
      <td>${a.date}<div class="dt-time">${a.time}</div></td>
      <td>${a.mechanic ? a.mechanic : '<span class="unassigned">Unassigned</span>'}</td>
      <td>${getCustomStatusBadge(a.status)}</td>
    </tr>
  `;
}

function renderDashboardAppointments() {
  const t = $("#dashAppointmentsTable");
  if (!t) return;
  t.innerHTML = `
    <thead><tr>
      <th>Customer</th><th>Motorcycle</th><th>Services</th><th>Date &amp; Time</th><th>Mechanic</th><th>Status</th>
    </tr></thead>
    <tbody>${DATA.appointments.map((a) => apptRowHTML(a)).join("")}</tbody>
  `;
}

function renderAppointmentsPage() {
  const activeFilter = $("#apptFilters .pill.active")?.dataset.filter || "All";
  const query = ($("#apptSearch").value || "").toLowerCase();

  let rows = DATA.appointments.filter((appointment) => {
    const status = canonicalAppointmentStatus(appointment.status);
    if (activeFilter === "All") return true;
    if (activeFilter === "Unassigned") {
      return status !== "Cancelled" && !appointment.mechanic;
    }
    return status === canonicalAppointmentStatus(activeFilter);
  });
  if (query)
    rows = rows.filter((a) =>
      (a.customer + a.bike).toLowerCase().includes(query),
    );

  const t = $("#apptTable");
  if (!t) return;
  t.innerHTML = `
    <thead><tr>
      <th>#</th><th>Customer</th><th>Motorcycle</th><th>Services</th><th>Date / Time</th><th>Mechanic</th><th>Status</th>
    </tr></thead>
    <tbody>${
      rows.map((a) => apptRowHTML(a)).join("") ||
      `<tr><td colspan="7" class="subtext" style="padding:26px 22px;">No appointments found.</td></tr>`
    }
    </tbody>
  `;
}

// Global variable to keep track of the selected appointment for actions/printing
let currentSelectedAppointmentId = null;

function isLockedCompletedAppointment(app) {
  const canEditCompletedJob =
    String(localStorage.getItem("userRole") || "").toLowerCase() === "master_admin" ||
    app.completedJobEditAuthorizedBy?.toLowerCase() ===
      (localStorage.getItem("userEmail") || "").trim().toLowerCase();
  return canonicalAppointmentStatus(app.status) === "Completed" && !canEditCompletedJob;
}

// Use your native dashboard openModal() function
function openAppointmentModal(appId) {
  currentSelectedAppointmentId = appId;
  const app = DATA.appointments.find((a) => a.id === appId);
  if (!app) return;

  const canAssignMechanic =
    !app.mechanic &&
    !["Cancelled", "Complete transaction"].includes(app.status);
  const availableMechanics =
    canAssignMechanic && app.date && app.time
      ? getAvailableMechanics(app.date, app.time, app.id).filter(
          (mechanic) => !mechanic.busy,
        )
      : [];
  const mechanicAssignment = canAssignMechanic
    ? `
      <div class="field" style="margin-bottom:16px;">
        <label for="assignMechanicSelect">Assign an available mechanic</label>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <select id="assignMechanicSelect" ${!app.date || !app.time || !availableMechanics.length ? "disabled" : ""}>
            <option value="">${!app.date || !app.time ? "Appointment date and time required" : availableMechanics.length ? "Select an available mechanic" : "No mechanics available for this time"}</option>
            ${availableMechanics.map((mechanic) => `<option value="${mechanic.name}">${mechanic.name}</option>`).join("")}
          </select>
          <button type="button" class="btn-primary" onclick="assignAppointmentMechanic('${app.id}')" ${!availableMechanics.length ? "disabled" : ""}>Assign mechanic</button>
        </div>
      </div>
    `
    : "";

  const modalBodyHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
            <div class="field" style="margin-bottom:0;"><label style="font-size:11px; color:var(--text-sub, #9ca3af);">Appointment ID</label><div style="font-weight:600;">${app.id}</div></div>
            <div class="field" style="margin-bottom:0;"><label style="font-size:11px; color:var(--text-sub, #9ca3af);">Status</label><div>${getCustomStatusBadge(app.status)}</div></div>
            
            <div class="field" style="margin-bottom:0;"><label style="font-size:11px; color:var(--text-sub, #9ca3af);">Customer Name</label><div style="font-weight:600;">${app.customer}</div></div>
            <div class="field" style="margin-bottom:0;"><label style="font-size:11px; color:var(--text-sub, #9ca3af);">Contact Number</label><div>${app.phone || "N/A"}</div></div>
            
            <div class="field" style="margin-bottom:0;"><label style="font-size:11px; color:var(--text-sub, #9ca3af);">Motorcycle Model</label><div>${app.bike}</div></div>
            <div class="field" style="margin-bottom:0;"><label style="font-size:11px; color:var(--text-sub, #9ca3af);">Assigned Mechanic</label><div>${app.mechanic || "Unassigned"}</div></div>
            
            <div class="field" style="margin-bottom:0; grid-column: span 2;"><label style="font-size:11px; color:var(--text-sub, #9ca3af);">Service Requested</label><div>${Array.isArray(app.services) ? app.services.join(", ") : app.services}</div></div>
            <div class="field" style="margin-bottom:0; grid-column: span 2;"><label style="font-size:11px; color:var(--text-sub, #9ca3af);">Scheduled Date & Time</label><div>${app.date} - ${app.time || ""}</div></div>
            
            <div class="field" style="margin-bottom:0; grid-column: span 2;"><label style="font-size:11px; color:var(--text-sub, #9ca3af);">Notes / Issues</label><div>${app.notes || "None specified."}</div></div>
            <div class="field" style="margin-bottom:0; grid-column: span 2;"><label style="font-size:11px; color:var(--text-sub, #9ca3af);">Parts Requested</label><div>${app.parts?.length ? app.parts.map((part) => `${part.name} x${part.quantity}`).join(", ") : "No parts requested."}</div></div>
        </div>

        ${mechanicAssignment}
        <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
            <div>
               <div style="font-size: 11px; color: var(--text-sub, #9ca3af); margin-bottom: 4px;">Update Status (Dropdown):</div>
               <div id="modalStatusActionContainer">${getStatusAdvancementDropdown(app)}</div>
            </div>
        </div>
    `;

  openModal(`Appointment Details: #${app.id}`, modalBodyHTML);
  $("#requestCompletedJobEditFromAppointment")?.addEventListener("click", () =>
    openCompletedJobEditRequestModal(app),
  );
  $("#cancelAppointmentFromDetails")?.addEventListener("click", () => {
    if (canonicalAppointmentStatus(app.status) === "Cancelled") return;
    const role = String(localStorage.getItem("userRole") || "").toLowerCase();
    if (role === "admin") {
      openCompletedJobCancellationRequestModal(app);
      return;
    }
    if (role === "master_admin") {
      if (window.confirm(`Cancel appointment ${app.id}? This action cannot be undone here.`)) {
        updateAppointmentStatus(app.id, "Cancelled");
      }
      return;
    }
    window.alert("Only an admin or the Master Admin can cancel this appointment.");
  });
}

function refreshAppointmentStatusViews(appId) {
  renderAppointmentsPage();
  renderDashboardAppointments();
  renderJobs();
  if (
    currentSelectedAppointmentId === appId &&
    $("#modalBackdrop")?.classList.contains("open")
  ) {
    openAppointmentModal(appId);
  }
}

function updateAppointmentStatus(appId, newStatus) {
  const app = DATA.appointments.find((a) => a.id === appId);
  if (app) {
    const currentStatus = canonicalAppointmentStatus(app.status);
    const requestedStatus = canonicalAppointmentStatus(newStatus);
    const isMasterAdmin =
      String(localStorage.getItem("userRole") || "").toLowerCase() === "master_admin";
    const currentEmail = (localStorage.getItem("userEmail") || "").trim().toLowerCase();
    const hasCompletedJobEditAuthority =
      isMasterAdmin || app.completedJobEditAuthorizedBy?.toLowerCase() === currentEmail;
    if (requestedStatus === currentStatus) {
      refreshAppointmentStatusViews(appId);
      return;
    }

    if (
      requestedStatus === "Completed" &&
      currentStatus !== "Completed" &&
      !window.confirm(
        "Confirm this job is fully completed? After confirmation, it will be locked and can only be edited again with Master Admin approval.",
      )
    ) {
      refreshAppointmentStatusViews(appId);
      return;
    }

    const isCompletedJob =
      ["Completed", "Unpaid"].includes(canonicalAppointmentStatus(app.status));
    const isStoreAdmin =
      String(localStorage.getItem("userRole") || "").toLowerCase() === "admin";
    if (newStatus === "Cancelled" && isCompletedJob && isStoreAdmin) {
      openCompletedJobCancellationRequestModal(app);
      return;
    }
    if (
      currentStatus === "Completed" &&
      requestedStatus !== "Cancelled" &&
      !hasCompletedJobEditAuthority
    ) {
      window.alert("This completed job is locked. Request Master Admin approval before editing it.");
      refreshAppointmentStatusViews(appId);
      return;
    }

    let inventoryUpdate = { ok: true, deducted: false };
    if (requestedStatus === "Completed" && currentStatus !== "Completed") {
      inventoryUpdate = window.consumeAppointmentInventory(app);
      if (!inventoryUpdate.ok) {
        window.alert(inventoryUpdate.message);
        refreshAppointmentStatusViews(appId);
        return;
      }
    }

    app.status = newStatus;
    app.completedJobEditAuthorizedBy = "";
    persistAppointments();
    if (inventoryUpdate.deducted) {
      DATA.inventory = readStoredArray("motofix_parts");
      renderInventoryTable();
    }
    const notifications = JSON.parse(
      localStorage.getItem("motofix_notifications") || "[]",
    );
    notifications.unshift({
      id: `N${Date.now()}`,
      title: "Appointment status updated",
      message: `${app.id} is now ${newStatus}.`,
      audiences: [
        "customer",
        "admin",
        "master_admin",
        ...(app.mechanic ? [`mechanic:${app.mechanic}`] : []),
      ],
      appointmentId: app.id,
      customerEmail:
        app.customerEmail ||
        DATA.users.find(
          (user) => user.role === "Customer" && user.name === app.customer,
        )?.email ||
        "",
      mechanicName: app.mechanic || "",
      createdAt: new Date().toISOString(),
      readBy: [],
    });
    localStorage.setItem(
      "motofix_notifications",
      JSON.stringify(notifications.slice(0, 100)),
    );
    window.dispatchEvent(new Event("motofix:notifications-changed"));

    if (typeof saveAppData === "function") saveAppData();

    renderAppointmentsPage();
    renderDashboardAppointments();
    openAppointmentModal(appId); // Refresh modal view

    if (typeof showNotification === "function") {
      showNotification(
        `Appointment #${appId} updated to: ${newStatus}`,
        "success",
      );
    }
  }
}

function assignAppointmentMechanic(appId) {
  const app = DATA.appointments.find((appointment) => appointment.id === appId);
  const select = $("#assignMechanicSelect");
  const mechanicName = select?.value;
  if (
    !app ||
    app.mechanic ||
    ["Cancelled", "Complete transaction"].includes(app.status) ||
    !mechanicName ||
    !app.date ||
    !app.time
  )
    return;

  const mechanic = getAvailableMechanics(app.date, app.time, app.id).find(
    (candidate) => candidate.name === mechanicName && !candidate.busy,
  );
  if (!mechanic) {
    showAccountFeedback("That mechanic is no longer available for this time.");
    openAppointmentModal(appId);
    return;
  }

  app.mechanic = mechanic.name;
  persistAppointments();
  const notifications = JSON.parse(
    localStorage.getItem("motofix_notifications") || "[]",
  );
  notifications.unshift({
    id: `N${Date.now()}`,
    title: "Mechanic assigned",
    message: `${mechanic.name} was assigned to appointment ${app.id}.`,
    audiences: [
      "admin",
      "master_admin",
      "customer",
      `mechanic:${mechanic.name}`,
    ],
    appointmentId: app.id,
    customerEmail:
      app.customerEmail ||
      DATA.users.find(
        (user) => user.role === "Customer" && user.name === app.customer,
      )?.email ||
      "",
    mechanicName: mechanic.name,
    mechanicEmail:
      DATA.users.find((user) => user.name === mechanic.name)?.email || "",
    createdAt: new Date().toISOString(),
    readBy: [],
  });
  localStorage.setItem(
    "motofix_notifications",
    JSON.stringify(notifications.slice(0, 100)),
  );
  window.dispatchEvent(new Event("motofix:notifications-changed"));
  renderAppointmentsPage();
  renderDashboardAppointments();
  renderJobs();
  openAppointmentModal(appId);
}

// Real-World Document & Receipt Generation Function
function generateAppointmentReceipt() {
  const app = DATA.appointments.find(
    (a) => a.id === currentSelectedAppointmentId,
  );
  if (!app) return;

  const isPaid =
    app.status === "Complete transaction" ||
    app.status === "Completed" ||
    app.status.toLowerCase().includes("complete");

  const printWindow = window.open("", "_blank");
  printWindow.document.write(`
        <html>
        <head>
            <title>MotoFix Service Receipt - #${app.id}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 30px; color: #333; }
                .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                .receipt-info { margin-bottom: 20px; }
                .receipt-info table { width: 100%; border-collapse: collapse; }
                .receipt-info td { padding: 6px 0; }
                .total-section { margin-top: 30px; border-top: 1px solid #ddd; padding-top: 15px; text-align: right; font-size: 1.2em; font-weight: bold; }
                .footer { margin-top: 50px; text-align: center; font-size: 0.9em; color: #777; }
                @media print { body { padding: 0; } }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>MotoFix Services & Parts Shop</h2>
                <p>Official Service Receipt / Job Order Document</p>
            </div>
            <div class="receipt-info">
                <table>
                    <tr><td><strong>Receipt / Ref ID:</strong> #${app.id}</td><td><strong>Date:</strong> ${app.date}</td></tr>
                    <tr><td><strong>Customer Name:</strong> ${app.customer}</td><td><strong>Contact:</strong> ${app.phone || "N/A"}</td></tr>
                    <tr><td><strong>Motorcycle Model:</strong> ${app.bike}</td><td><strong>Status:</strong> ${app.status}</td></tr>
                </table>
            </div>
            <hr/>
            <h3>Services Performed</h3>
            <p><strong>${Array.isArray(app.services) ? app.services.join(", ") : app.services}</strong></p>
            <p><em>Mechanic:</em> ${app.mechanic || "Unassigned"}</p>
            
            <div class="total-section">
                Payment Status: ${isPaid ? "PAID ON SITE" : app.status === "Cancelled" ? "CANCELLED" : "UNPAID / PENDING SETTLEMENT"}
            </div>
            <div class="footer">
                <p>Thank you for trusting MotoFix Services!</p>
                <p>This document serves as an official service reference.</p>
            </div>
            <script>
                window.onload = function() { window.print(); }
            </script>
        </body>
        </html>
    `);
  printWindow.document.close();
}

$$("#apptFilters .pill").forEach((p) =>
  p.addEventListener("click", () => {
    $$("#apptFilters .pill").forEach((x) => x.classList.remove("active"));
    p.classList.add("active");
    renderAppointmentsPage();
  }),
);

const apptSearchEl = $("#apptSearch");
if (apptSearchEl)
  apptSearchEl.addEventListener("input", renderAppointmentsPage);

const newApptBtnEl = $("#newApptBtn");
if (newApptBtnEl) {
  newApptBtnEl.addEventListener("click", () =>
    openModal(
      "New Appointment",
      `
      <div class="field"><label>Customer Name</label><input id="newApptCustomer" placeholder="Full customer name"></div>
      <div class="field"><label>Contact Number</label><input id="newApptPhone" placeholder="e.g. 09123456789"></div>
      <div class="field"><label>Motorcycle Model</label><input id="newApptBike" placeholder="e.g. 2022 Honda PCX 160"></div>
      <div class="field"><label>Service</label><select id="newApptService">${DATA.services.map((s) => `<option>${s.name}</option>`).join("")}</select></div>
      <div class="field"><label>Assigned Mechanic</label><select id="newApptMechanic"><option value="">Unassigned</option>${getActiveMechanics().map((mechanic) => `<option value="${mechanic.name}" ${isMechanicUnavailableForAssignment(mechanic.name) ? "disabled" : ""}>${mechanic.name}${isMechanicUnavailableForAssignment(mechanic.name) ? " (Busy)" : ""}</option>`).join("")}</select></div>
      <div class="field"><label>Date &amp; Time</label><input id="newApptDateTime" type="datetime-local"></div>
      <button class="btn-primary" style="width:100%;margin-top:6px;" onclick="saveNewAppointment()">Create Appointment</button>
      `,
    ),
  );
}

function saveNewAppointment() {
  const customer = $("#newApptCustomer")?.value.trim();
  const phone = $("#newApptPhone")?.value.trim() || "N/A";
  const bike = $("#newApptBike")?.value.trim();
  const service = $("#newApptService")?.value;
  const mechanic = $("#newApptMechanic")?.value || null;
  const dateTime = $("#newApptDateTime")?.value;
  if (!customer || !bike || !service || !dateTime) {
    window.alert("Complete the customer, motorcycle, service, and date fields.");
    return;
  }
  if (
    mechanic &&
    !getActiveMechanics().some((user) => user.name === mechanic)
  ) {
    window.alert("Choose a valid mechanic from the available list.");
    return;
  }
  if (mechanic && isMechanicUnavailableForAssignment(mechanic)) {
    window.alert(`${mechanic} is currently assigned to an active job and is unavailable.`);
    return;
  }

  const idNumber = DATA.appointments.reduce((maximum, appointment) => {
    const value = Number(String(appointment.id).replace(/\D/g, ""));
    return Number.isFinite(value) ? Math.max(maximum, value) : maximum;
  }, 0) + 1;
  const [date, time] = dateTime.split("T");
  const serviceRecord = DATA.services.find((item) => item.name === service);
  const total = Number(serviceRecord?.price) || 0;
  const id = `A${idNumber}`;
  DATA.appointments.unshift({
    id,
    customer,
    customerEmail: DATA.users.find((user) => user.name === customer)?.email || "",
    phone,
    initials: avatarInitials(customer),
    bike,
    services: [service],
    date,
    time,
    mechanic,
    status: "Pending",
    notes: "",
    parts: [],
    total: peso(total),
    transaction: { id: `INV-${id}`, total: peso(total), date },
    createdAt: new Date().toISOString(),
  });

  if (mechanic) {
    notifyMechanicOfAssignment(
      DATA.appointments[0],
      mechanic,
      "New job assigned",
      "is assigned to you",
    );
  }
  persistAppointments();
  renderAppointmentsPage();
  renderDashboardAppointments();
  document.getElementById("modalBackdrop")?.classList.remove("open");
}

/* =========================================================
   ADMIN APPOINTMENT MODAL - DYNAMIC MECHANIC SELECTOR
========================================================= */

// Call this function when opening the appointment modal or when date/time fields change
function updateAppointmentMechanicDropdown(
  dateInputId,
  timeInputId,
  selectElementId,
  currentApptId = null,
) {
  const dateVal = $(dateInputId)?.value;
  const timeVal = $(timeInputId)?.value;
  const selectEl = $(selectElementId);

  if (!selectEl) return;

  // If date or time isn't picked yet, show a placeholder
  if (!dateVal || !timeVal) {
    selectEl.innerHTML = `<option value="">-- Select date & time first --</option>`;
    selectEl.disabled = true;
    return;
  }

  selectEl.disabled = false;
  const availableList = getAvailableMechanics(currentApptId);

  // Build dropdown options, clearly flagging busy mechanics
  selectEl.innerHTML =
    `
    <option value="">-- Unassigned / Any Available --</option>
  ` +
    availableList
      .map(
        (m) => `
    <option value="${m.name}" ${m.busy ? 'disabled style="color: #6b7280; background: #111;"' : ""}>
      ${m.name} ${m.busy ? "❌ (Already Booked)" : "✅ (Available)"}
    </option>
  `,
      )
      .join("");
}

// Example Event Listeners to auto-refresh mechanic availability when date/time changes in the admin modal
document.addEventListener("DOMContentLoaded", () => {
  const apptDateInput = $("#apptDate"); // Adjust ID to match your HTML form
  const apptTimeInput = $("#apptTime"); // Adjust ID to match your HTML form

  if (apptDateInput && apptTimeInput) {
    apptDateInput.addEventListener("change", () => {
      updateAppointmentMechanicDropdown(
        "#apptDate",
        "#apptTime",
        "#apptMechanicSelect",
      );
    });
    apptTimeInput.addEventListener("change", () => {
      updateAppointmentMechanicDropdown(
        "#apptDate",
        "#apptTime",
        "#apptMechanicSelect",
      );
    });
  }
});

/* ===================== SERVICES PAGE ===================== */
function renderServiceFilters() {
  const container = $("#svcFilters");
  if (!container) return;
  const cats = ["All", ...new Set(DATA.services.map((s) => s.category))];
  container.innerHTML = cats
    .map(
      (c, i) =>
        `<button class="pill ${i === 0 ? "active" : ""}" data-filter="${c}">${c}</button>`,
    )
    .join("");
  $$("#svcFilters .pill").forEach((p) =>
    p.addEventListener("click", () => {
      $$("#svcFilters .pill").forEach((x) => x.classList.remove("active"));
      p.classList.add("active");
      renderServicesGrid();
    }),
  );
}

function renderServicesGrid() {
  const grid = $("#servicesGrid");
  if (!grid) return;
  const activeFilter = $("#svcFilters .pill.active")?.dataset.filter || "All";
  const query = ($("#svcSearch").value || "").toLowerCase();
  let list = DATA.services.filter(
    (s) => activeFilter === "All" || s.category === activeFilter,
  );
  if (query) list = list.filter((s) => s.name.toLowerCase().includes(query));

  grid.innerHTML =
    list
      .map(
        (s) => `
    <div class="svc-card svc-row" data-code="${s.code}" style="cursor:pointer; transition:border-color 0.2s;">
      <div class="svc-top">
        <div>
          <div class="svc-name">${s.name}</div>
          <div class="svc-tag" style="margin-top:8px;">${s.category}</div>
        </div>
        <div style="text-align:right;">
          <div class="svc-price">${peso(s.price)}</div>
          <div class="svc-price-note">base price</div>
        </div>
      </div>
      <div class="svc-desc">${s.desc}</div>
      <div class="svc-meta" style="display:flex; justify-content:space-between; align-items:center; margin-top:12px;">
        <span>⏱ ${s.hoursLabel}</span>
        <span class="subtext" style="font-size:11px;">Click to view options</span>
      </div>
    </div>
  `,
      )
      .join("") || `<p class="subtext">No services match your search.</p>`;

  rebuildDerivedDashboardData();
  renderPieChart("serviceMixPie", "serviceMixLegend", DATA.serviceMix);
  renderRevenueStatsAndBreakdown();

  // Attach click listener to open service details modal
  $$(".svc-row").forEach((card) => {
    card.addEventListener("click", () =>
      openServiceDetailsModal(card.dataset.code),
    );
  });
}

function openServiceDetailsModal(code) {
  const service = DATA.services.find((s) => s.code === code);
  if (!service) return;

  openModal(
    `Service Details: ${service.name}`,
    `
    <div style="margin-bottom: 16px; line-height: 1.6;">
      <p><strong>Category:</strong> ${service.category}</p>
      <p><strong>Description:</strong> ${service.desc}</p>
      <p><strong>Estimated Duration:</strong> ${service.hoursLabel}</p>
      <p><strong>Base Price:</strong> <span style="color:var(--orange); font-weight:700;">${peso(service.price)}</span></p>
    </div>
    <div style="display: flex; gap: 10px; margin-top: 20px;">
      <button type="button" class="btn-primary" id="modalEditSvcBtn" data-code="${service.code}" style="flex:1;">Edit Service</button>
      <button type="button" class="btn-view" id="modalDeleteSvcBtn" data-code="${service.code}" style="flex:1; color:var(--red); border-color:rgba(239,68,68,0.3);">Delete Service</button>
    </div>
  `,
  );

  document.getElementById("modalEditSvcBtn").addEventListener("click", () => {
    openEditServiceModal(code);
  });

  // === Add Service Modal with Dynamic Category Dropdown ===
  document
    .getElementById("openAddServiceBtn")
    ?.addEventListener("click", () => {
      const serviceCategories = [
        ...new Set(DATA.services.map((s) => s.category)),
      ];

      openModal(
        "Add New Service",
        `
          <form id="addServiceForm">
              <div style="margin-bottom: 12px;">
                  <label style="display:block; margin-bottom:4px; font-weight:500;">Service Name</label>
                  <input type="text" id="newServiceName" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
              </div>
              <div style="margin-bottom: 12px;">
                  <label style="display:block; margin-bottom:4px; font-weight:500;">Service Code</label>
                  <input type="text" id="newServiceCode" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
              </div>
              <div style="margin-bottom: 12px;">
                  <label style="display:block; margin-bottom:4px; font-weight:500;">Category</label>
                  <select id="newServiceCategorySelect" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px; margin-bottom: 6px;">
                      ${serviceCategories.map((c) => `<option value="${c}">${c}</option>`).join("")}
                      <option value="OTHER">+ Add New Category...</option>
                  </select>
                  <input type="text" id="newServiceCategoryCustom" placeholder="Type new category name..." style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px; display:none;">
              </div>
              <div style="margin-bottom: 12px;">
                  <label style="display:block; margin-bottom:4px; font-weight:500;">Description</label>
                  <textarea id="newServiceDesc" rows="3" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px; resize:vertical;"></textarea>
              </div>
              <div style="display: flex; gap: 10px; margin-bottom: 12px;">
                  <div style="flex: 1;">
                      <label style="display:block; margin-bottom:4px; font-weight:500;">Duration Label (e.g., 1-2 hrs)</label>
                      <input type="text" id="newServiceHours" value="1 hr" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
                  </div>
                  <div style="flex: 1;">
                      <label style="display:block; margin-bottom:4px; font-weight:500;">Base Price (₱)</label>
                      <input type="number" id="newServicePrice" step="0.01" min="0" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
                  </div>
              </div>
              <button type="submit" class="btn-primary" style="width:100%; margin-top:10px;">Save Service</button>
          </form>
      `,
      );

      const selectEl = document.getElementById("newServiceCategorySelect");
      const customInputEl = document.getElementById("newServiceCategoryCustom");

      selectEl.addEventListener("change", (e) => {
        if (e.target.value === "OTHER") {
          customInputEl.style.display = "block";
          customInputEl.required = true;
          customInputEl.focus();
        } else {
          customInputEl.style.display = "none";
          customInputEl.required = false;
        }
      });
    });

  document.getElementById("modalDeleteSvcBtn").addEventListener("click", () => {
    if (confirm(`Are you sure you want to delete service code: ${code}?`)) {
      DATA.services = DATA.services.filter((s) => s.code !== code);
      localStorage.setItem("motofix_services", JSON.stringify(DATA.services));
      document.getElementById("modalBackdrop").classList.remove("open");
      renderServiceFilters();
      renderServicesGrid();
    }
  });
}

/* =========================================================
   SERVICES SECTION SEARCH & FILTER FUNCTIONALITY
========================================================= */
const servicesSearchEl =
  $("#svcSearch") ||
  document.querySelector(
    "input[placeholder*='service' i], input[placeholder*='Search services' i]",
  );

if (servicesSearchEl) {
  servicesSearchEl.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();
    const serviceCards = document.querySelectorAll(
      "#page-services tr, .service-card, .stack-item",
    ); // Adjust selector based on your HTML layout

    // If you are rendering services dynamically via a DATA array:
    if (typeof DATA !== "undefined" && DATA.services) {
      const filteredServices = DATA.services.filter((s) =>
        (s.name + (s.description || "") + (s.mechanic || ""))
          .toLowerCase()
          .includes(query),
      );
      // Call your specific services render function here, e.g., renderServices(filteredServices);
    } else {
      // Fallback DOM filtering if static HTML rows are used
      serviceCards.forEach((card) => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(query) ? "" : "none";
      });
    }
    renderServicesGrid();
  });
}

/* =========================================================
/* ===================== INVENTORY PAGE ===================== */
function renderInvFilters() {
  const container = $("#invFilters");
  if (!container) return;
  const cats = ["All", ...new Set(DATA.inventory.map((i) => i.category))];
  container.innerHTML = cats
    .map(
      (c, i) =>
        `<button class="pill ${i === 0 ? "active" : ""}" data-filter="${c}">${c}</button>`,
    )
    .join("");
  $$("#invFilters .pill").forEach((p) =>
    p.addEventListener("click", () => {
      $$("#invFilters .pill").forEach((x) => x.classList.remove("active"));
      p.classList.add("active");
      renderInventoryTable();
    }),
  );
}

function renderInventoryTable() {
  renderLowStockAlert();
  const table = $("#invTable");
  if (!table) return;
  const activeFilter = $("#invFilters .pill.active")?.dataset.filter || "All";
  const query = ($("#invSearch").value || "").toLowerCase();
  let list = DATA.inventory.filter(
    (i) => activeFilter === "All" || i.category === activeFilter,
  );
  if (query)
    list = list.filter((i) => (i.name + i.sku).toLowerCase().includes(query));

  table.innerHTML = `
    <thead><tr>
      <th>Part Name</th><th>SKU</th><th>Brand</th><th>Category</th><th>Stock</th><th>Unit Price</th><th>Status</th>
    </tr></thead>
    <tbody>${
      list
        .map(
          (i) => `
      <tr class="inv-row" data-sku="${i.sku}" style="cursor:pointer; transition:background 0.2s;">
        <td>${i.name}</td>
        <td class="subtext" style="font-family:var(--font-mono);">${i.sku}</td>
        <td>${i.brand}</td>
        <td>${i.category}</td>
        <td>
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:70px;height:5px;background:#232323;border-radius:3px;overflow:hidden;">
              <div style="width:${Math.min(100, (i.stock / (i.max || 60)) * 100)}%;height:100%;background:${getInventoryStockStatus(i).color};"></div>
            </div>
            <span>${i.stock}</span>
          </div>
        </td>
        <td style="color:var(--orange);font-weight:700;font-family:var(--font-mono);">${peso(i.price)}</td>
        <td>${statusBadge(getInventoryStockStatus(i).label)}</td>
      </tr>
    `,
        )
        .join("") ||
      `<tr><td colspan="7" class="subtext" style="padding:26px 22px;">No parts found.</td></tr>`
    }</tbody>
  `;

  // Attach click listener to open row details modal
  $$(".inv-row").forEach((row) => {
    row.addEventListener("click", () => openPartDetailsModal(row.dataset.sku));
  });
  renderAdminDashboardStats();
}

function openPartDetailsModal(sku) {
  const part = DATA.inventory.find((i) => i.sku === sku);
  if (!part) return;

  openModal(
    `Part Details: ${part.name}`,
    `
    <div style="margin-bottom: 16px; line-height: 1.6;">
      <p><strong>SKU:</strong> <span style="font-family:var(--font-mono);">${part.sku}</span></p>
      <p><strong>Brand:</strong> ${part.brand}</p>
      <p><strong>Category:</strong> ${part.category}</p>
      <p><strong>Stock Level:</strong> ${part.stock} / ${part.max || 60}</p>
      <p><strong>Status:</strong> ${statusBadge(getInventoryStockStatus(part).label)}</p>
      <p><strong>Unit Price:</strong> <span style="color:var(--orange); font-weight:700;">${peso(part.price)}</span></p>
    </div>
    <div style="display: flex; gap: 10px; margin-top: 20px;">
      <button type="button" class="btn-primary" id="modalEditPartBtn" data-sku="${part.sku}" style="flex:1;">Edit Part</button>
      <button type="button" class="btn-view" id="modalDeletePartBtn" data-sku="${part.sku}" style="flex:1; color:var(--red); border-color:rgba(239,68,68,0.3);">Delete Part</button>
    </div>
  `,
  );

  document.getElementById("modalEditPartBtn").addEventListener("click", () => {
    openEditPartModal(sku);
  });

  document
    .getElementById("modalDeletePartBtn")
    .addEventListener("click", () => {
      if (
        confirm(`Are you sure you want to delete the part with SKU: ${sku}?`)
      ) {
        DATA.inventory = DATA.inventory.filter((i) => i.sku !== sku);
        localStorage.setItem("motofix_parts", JSON.stringify(DATA.inventory));
        document.getElementById("modalBackdrop").classList.remove("open");
        renderInvFilters();
        renderInventoryTable();
      }
    });
}

// ===  Add Part Modal with Dynamic Category Dropdown & Max Stock ===
document.getElementById("openAddPartBtn")?.addEventListener("click", () => {
  // Extract unique existing categories dynamically
  const categories = [...new Set(DATA.inventory.map((i) => i.category))];

  openModal(
    "Add New Part",
    `
        <form id="addPartForm">
            <div style="margin-bottom: 12px;">
                <label style="display:block; margin-bottom:4px; font-weight:500;">Part Name</label>
                <input type="text" id="newPartName" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
            </div>
            <div style="margin-bottom: 12px;">
                <label style="display:block; margin-bottom:4px; font-weight:500;">SKU</label>
                <input type="text" id="newPartSku" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
            </div>
            <div style="margin-bottom: 12px;">
                <label style="display:block; margin-bottom:4px; font-weight:500;">Brand</label>
                <input type="text" id="newPartBrand" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
            </div>
            <div style="margin-bottom: 12px;">
                <label style="display:block; margin-bottom:4px; font-weight:500;">Category</label>
                <select id="newPartCategorySelect" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px; margin-bottom: 6px;">
                    ${categories.map((c) => `<option value="${c}">${c}</option>`).join("")}
                    <option value="OTHER">+ Add New Category...</option>
                </select>
                <!-- Hidden input field that reveals if "OTHER" is chosen -->
                <input type="text" id="newPartCategoryCustom" placeholder="Type new category name..." style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px; display:none;">
            </div>
            <div style="display: flex; gap: 10px; margin-bottom: 12px;">
                <div style="flex: 1;">
                    <label style="display:block; margin-bottom:4px; font-weight:500;">Initial Stock</label>
                    <input type="number" id="newPartStock" min="0" value="0" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
                </div>
                <div style="flex: 1;">
                    <label style="display:block; margin-bottom:4px; font-weight:500;">Max Stock Limit</label>
                    <input type="number" id="newPartMaxStock" min="1" value="60" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
                </div>
            </div>
            <div style="margin-bottom: 12px;">
                <label style="display:block; margin-bottom:4px; font-weight:500;">Unit Price (₱)</label>
                <input type="number" id="newPartPrice" step="0.01" min="0" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
            </div>
            <button type="submit" class="btn-primary" style="width:100%; margin-top:10px;">Save Part</button>
        </form>
    `,
  );

  // Toggle custom category text input visibility when "OTHER" is selected
  const selectEl = document.getElementById("newPartCategorySelect");
  const customInputEl = document.getElementById("newPartCategoryCustom");

  selectEl.addEventListener("change", (e) => {
    if (e.target.value === "OTHER") {
      customInputEl.style.display = "block";
      customInputEl.required = true;
      customInputEl.focus();
    } else {
      customInputEl.style.display = "none";
      customInputEl.required = false;
    }
  });
});

/* =========================================================
   PARTS SECTION SEARCH & FILTER FUNCTIONALITY
========================================================= */
const partsSearchEl =
  $("#invSearch") ||
  document.querySelector(
    "input[placeholder*='parts' i], input[placeholder*='Search parts' i]",
  );

if (partsSearchEl) {
  partsSearchEl.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();
    const partsRows = document.querySelectorAll(
      "#page-parts tr, .part-row, .inventory-card",
    ); // Adjust selector based on your HTML layout

    // If you are rendering parts dynamically via a DATA array:
    if (typeof DATA !== "undefined" && DATA.parts) {
      const filteredParts = DATA.parts.filter((p) =>
        (p.name + (p.category || "") + (p.code || ""))
          .toLowerCase()
          .includes(query),
      );
      // Call your specific parts render function here, e.g., renderParts(filteredParts);
    } else {
      // Fallback DOM filtering if static HTML rows are used
      partsRows.forEach((row) => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? "" : "none";
      });
    }
    renderInventoryTable();
  });
}

/* ===================== BILLING PAGE ===================== */
function renderInvoices() {
  const countEl = $("#invoiceCount");
  const tableEl = $("#invoiceTable");
  if (!countEl || !tableEl) return;

  countEl.textContent = `${DATA.invoices.length} invoice${DATA.invoices.length === 1 ? "" : "s"} total`;

  tableEl.innerHTML = `
    <thead><tr>
      <th>Invoice #</th><th>Customer</th><th>Job Ref</th><th>Items</th><th>Subtotal</th><th>VAT</th><th>Total</th><th>Status</th><th>Date</th>
    </tr></thead>
    <tbody>${DATA.invoices
      .map(
        (inv) => `
      <tr data-view-invoice="${inv.id}" style="cursor: pointer; transition: background 0.15s ease;">
        <td style="color:var(--orange);font-weight:700;font-family:var(--font-mono);">${inv.id}</td>
        <td>${inv.customer}</td>
        <td class="subtext">${inv.jobRef}</td>
        <td>${inv.items}</td>
        <td>${peso(inv.subtotal)}</td>
        <td>${peso(inv.vat)}</td>
        <td style="color:var(--orange);font-weight:700;">${peso(inv.total)}</td>
        <td>${statusBadge(inv.status)}</td>
        <td class="subtext">${inv.date}</td>
      </tr>
    `,
      )
      .join("")}</tbody>
  `;

  // Make the entire row clickable and add hover styling dynamically
  $$("#invoiceTable tbody tr").forEach((row) => {
    row.addEventListener("mouseenter", () => {
      row.style.background = "rgba(255, 255, 255, 0.04)";
    });
    row.addEventListener("mouseleave", () => {
      row.style.background = "transparent";
    });
    row.addEventListener("click", () => {
      openInvoiceModal(row.dataset.viewInvoice);
    });
  });
}

// Comprehensive Invoice Receipt Modal with Print Document Capability
function openInvoiceModal(invId) {
  const inv = DATA.invoices.find((i) => i.id === invId);
  if (!inv) return;

  // Find linked job or customer details for completeness
  const linkedJob = DATA.jobs.find((j) => j.id === inv.jobRef);
  const linkedBike = linkedJob
    ? linkedJob.bike
    : "Registered Motorcycle Profile";
  const customerObj = DATA.users.find((u) => u.name === inv.customer);
  const customerPhone = customerObj ? customerObj.phone : "+63 912 000 0000";

  const modalBodyHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
        <div class="field" style="margin-bottom:0;"><label style="font-size:11px; color:var(--text-sub, #9ca3af);">Invoice ID</label><div style="font-weight:600; color:var(--orange);">${inv.id}</div></div>
        <div class="field" style="margin-bottom:0;"><label style="font-size:11px; color:var(--text-sub, #9ca3af);">Payment Status</label><div>${statusBadge(inv.status)}</div></div>
        
        <div class="field" style="margin-bottom:0;"><label style="font-size:11px; color:var(--text-sub, #9ca3af);">Customer Name</label><div style="font-weight:600;">${inv.customer}</div></div>
        <div class="field" style="margin-bottom:0;"><label style="font-size:11px; color:var(--text-sub, #9ca3af);">Contact Number</label><div>${customerPhone}</div></div>
        
        <div class="field" style="margin-bottom:0;"><label style="font-size:11px; color:var(--text-sub, #9ca3af);">Motorcycle / Job Ref</label><div>${linkedBike} (${inv.jobRef})</div></div>
        <div class="field" style="margin-bottom:0;"><label style="font-size:11px; color:var(--text-sub, #9ca3af);">Transaction Date</label><div>${inv.date}</div></div>
        
        <div class="field" style="margin-bottom:0; grid-column: span 2;">
          <label style="font-size:11px; color:var(--text-sub, #9ca3af); margin-bottom:6px; display:block;">Financial Summary</label>
          <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08);">
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>Subtotal (${inv.items} items/services):</span> <strong>${peso(inv.subtotal)}</strong></div>
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>VAT (12%):</span> <strong>${peso(inv.vat)}</strong></div>
            <div style="display:flex; justify-content:space-between; border-top:1px solid rgba(255,255,255,0.1); padding-top:6px; margin-top:6px; color:var(--orange); font-size:1.1em;"><span>Total Amount Due:</span> <strong>${peso(inv.total)}</strong></div>
          </div>
        </div>
    </div>

    <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px; display: flex; justify-content: flex-end; gap: 10px;">
        <button type="button" onclick="printCustomerReceipt('${inv.id}')" style="background: rgba(255, 255, 255, 0.08); color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; transition: background 0.2s;">
            <i class="fas fa-print"></i> Print Official Receipt
        </button>
    </div>
  `;

  openModal(`Customer Receipt & Invoice: ${inv.id}`, modalBodyHTML);
}

function printCustomerReceipt(invId) {
  const inv = DATA.invoices.find((i) => i.id === invId);
  if (!inv) return;

  const customerObj = DATA.users.find((u) => u.name === inv.customer);
  const customerPhone = customerObj ? customerObj.phone : "+63 912 000 0000";

  const printWindow = window.open("", "_blank");
  printWindow.document.write(`
      <html>
      <head>
          <title>MotoFix Official Receipt - ${inv.id}</title>
          <style>
              body { font-family: Arial, sans-serif; padding: 40px; color: #222; max-width: 700px; margin: 0 auto; }
              .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 25px; }
              .header h2 { margin: 0; font-size: 24px; color: #111; }
              .header p { margin: 4px 0 0; color: #555; font-size: 14px; }
              .info-grid { width: 100%; margin-bottom: 25px; border-collapse: collapse; }
              .info-grid td { padding: 6px 0; font-size: 14px; }
              .table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
              .table th, .table td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 13px; }
              .table th { background: #f4f4f4; }
              .totals { float: right; width: 280px; font-size: 14px; }
              .totals div { display: flex; justify-content: space-between; padding: 5px 0; }
              .totals .grand-total { border-top: 2px solid #333; font-weight: bold; font-size: 16px; margin-top: 5px; padding-top: 8px; }
              .footer { clear: both; margin-top: 60px; text-align: center; font-size: 12px; color: #666; border-top: 1px dashed #ccc; padding-top: 15px; }
              @media print { body { padding: 0; } }
          </style>
      </head>
      <body>
          <div class="header">
              <h2>MOTOFIX SERVICES & PARTS SHOP</h2>
              <p>Official Customer Transaction Receipt & VAT Invoice</p>
          </div>
          <table class="info-grid">
              <tr>
                  <td><strong>Invoice Reference:</strong> ${inv.id}</td>
                  <td><strong>Date Issued:</strong> ${inv.date}</td>
              </tr>
              <tr>
                  <td><strong>Customer Name:</strong> ${inv.customer}</td>
                  <td><strong>Contact Number:</strong> ${customerPhone}</td>
              </tr>
              <tr>
                  <td><strong>Job Reference:</strong> ${inv.jobRef}</td>
                  <td><strong>Payment Status:</strong> ${inv.status.toUpperCase()}</td>
              </tr>
          </table>

          <table class="table">
              <thead>
                  <tr>
                      <th>Description / Particulars</th>
                      <th>Qty</th>
                      <th>Subtotal</th>
                  </tr>
              </thead>
              <tbody>
                  <tr>
                      <td>Completed Workshop Service & Parts (Ref: ${inv.jobRef})</td>
                      <td>${inv.items}</td>
                      <td>₱${Number(inv.subtotal).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
                  </tr>
              </tbody>
          </table>

          <div class="totals">
              <div><span>Subtotal:</span> <span>₱${Number(inv.subtotal).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span></div>
              <div><span>VAT (12%):</span> <span>₱${Number(inv.vat).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span></div>
              <div class="grand-total"><span>Total Paid:</span> <span>₱${Number(inv.total).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span></div>
          </div>

          <div class="footer">
              <p>Thank you for choosing MotoFix Services! This serves as an official receipt.</p>
              <p>Tin: 000-123-456-00009 · MotoFix Workshop Management System</p>
          </div>
          <script>
              window.onload = function() { window.print(); }
          </script>
      </body>
      </html>
  `);
  printWindow.document.close();
}

// Download Revenue Report Function (Direct PDF download via jsPDF & Word .doc export)
function downloadRevenueReport(fileType) {
  const totalRev = DATA.revenue.reduce((acc, r) => acc + r.value, 0);
  const totalVAT = DATA.invoices
    .filter((invoice) => invoice.status === "Completed")
    .reduce((sum, invoice) => sum + invoice.vat, 0);
  const currentDate = new Date().toISOString().split("T")[0];

  if (fileType === "docx") {
    // Styled HTML Word document (.doc) export
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <title>MotoFix Revenue Report</title>
          <style>
              body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
              h1 { color: #111; font-size: 20px; border-bottom: 2px solid #333; padding-bottom: 8px; }
              h2 { font-size: 16px; margin-top: 20px; color: #444; }
              ul { line-height: 1.6; }
              table { width: 100%; border-collapse: collapse; margin-top: 15px; }
              th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; font-size: 14px; }
              th { background-color: #f4f4f4; }
          </style>
      </head>
      <body>
          <h1>MOTOFIX REVENUE & FINANCIAL REPORT</h1>
          <p><strong>Generated on:</strong> ${currentDate}</p>
          
          <h2>Summary Statistics</h2>
          <ul>
              <li><strong>Total Revenue (All Time):</strong> ₱${totalRev.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</li>
              <li><strong>Total VAT Collected (12%):</strong> ₱${totalVAT.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</li>
              <li><strong>Total Invoices Processed:</strong> ${DATA.invoices.length}</li>
          </ul>

          <h2>Monthly Breakdown</h2>
          <table>
              <thead>
                  <tr><th>Month</th><th>Revenue</th></tr>
              </thead>
              <tbody>
                  ${DATA.revenue.map((r) => `<tr><td>${r.month}</td><td>₱${r.value.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td></tr>`).join("")}
              </tbody>
          </table>
      </body>
      </html>
    `;

    const blob = new Blob(["\ufeff" + htmlContent], {
      type: "application/msword",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `MotoFix_Revenue_Report_${currentDate}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } else if (fileType === "pdf") {
    // Generate a real downloadable PDF using jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("MotoFix Revenue & Financial Report", 14, 20);

    // Metadata
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Generated on: ${currentDate}`, 14, 28);

    // Summary Section
    doc.setFont("helvetica", "bold");
    doc.text("Summary Statistics", 14, 38);
    doc.setFont("helvetica", "normal");
    doc.text(
      `- Total Revenue: P${totalRev.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
      14,
      46,
    );
    doc.text(
      `- Total VAT (12%): P${totalVAT.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
      14,
      54,
    );
    doc.text(`- Invoices Processed: ${DATA.invoices.length}`, 14, 62);

    // Monthly Breakdown Table Header
    doc.setFont("helvetica", "bold");
    doc.text("Monthly Breakdown", 14, 74);

    let yPos = 82;
    doc.setFillColor(240, 240, 240);
    doc.rect(14, yPos - 6, 180, 8, "F");
    doc.text("Month", 18, yPos);
    doc.text("Revenue", 120, yPos);

    // Table Rows
    doc.setFont("helvetica", "normal");
    yPos += 8;
    DATA.revenue.forEach((r) => {
      doc.text(r.month, 18, yPos);
      doc.text(
        `P${r.value.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
        120,
        yPos,
      );
      yPos += 8;
    });

    // Save the PDF file directly
    doc.save(`MotoFix_Revenue_Report_${currentDate}.pdf`);
  }
}

/* =========================================================
   BILLING TABS & REVENUE CHART RENDERER
========================================================= */
$$(".tab-row .tab").forEach((tabBtn) => {
  tabBtn.addEventListener("click", () => {
    // Remove active state from all tabs and panels
    $$(".tab-row .tab").forEach((t) => t.classList.remove("active"));
    $$(".tab-panel").forEach((p) => p.classList.remove("active"));

    // Add active state to clicked tab
    tabBtn.classList.add("active");

    // Activate corresponding panel
    const targetTab = tabBtn.dataset.tab;
    const targetPanel = $("#tab-" + targetTab);
    if (targetPanel) {
      targetPanel.classList.add("active");
    }

    // If Revenue tab is opened, render the chart, stats, and category breakdown
    if (targetTab === "revenue") {
      renderBarChart("revenueChart2", DATA.revenue);
      renderRevenueStatsAndBreakdown(); // <-- ADD THIS LINE
    } else if (targetTab === "invoices") {
      renderInvoices();
    }
  });
});

// <-- ADD THIS HELPER FUNCTION BELOW YOUR EVENT LISTENER -->
function renderRevenueStatsAndBreakdown() {
  const totalRev = DATA.revenue.reduce((acc, r) => acc + r.value, 0);
  const completedInvoices = DATA.invoices.filter((invoice) => invoice.status === "Completed");
  const totalVAT = completedInvoices.reduce((sum, invoice) => sum + invoice.vat, 0);
  const avgVal = completedInvoices.length > 0 ? totalRev / completedInvoices.length : 0;

  // Update Stat Card Values on the UI
  const totalEl = $("#rev-total-val");
  const vatEl = $("#rev-vat-val");
  const aovEl = $("#rev-aov-val");
  const aovDescEl = $("#rev-aov-desc");

  if (totalEl)
    totalEl.textContent = `₱${totalRev.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
  if (vatEl)
    vatEl.textContent = `₱${totalVAT.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
  if (aovEl)
    aovEl.textContent = `₱${avgVal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
  if (aovDescEl)
    aovDescEl.textContent = `Based on ${completedInvoices.length} completed invoice${completedInvoices.length === 1 ? "" : "s"}`;

  // Populate Service Category Breakdown Panel
  const breakdownContainer = $("#category-breakdown-container");
  if (breakdownContainer) {
    breakdownContainer.innerHTML = DATA.serviceMix.length
      ? DATA.serviceMix.map((category) => `
          <button type="button" class="revenue-category-row" data-service-category="${escapeDashboardHtml(category.label)}" aria-label="View completed jobs in ${escapeDashboardHtml(category.label)}">
            <span>${escapeDashboardHtml(category.label)}</span>
            <strong>${category.count} service${category.count === 1 ? "" : "s"} · ${category.pct.toFixed(1)}%</strong>
          </button>
        `).join("")
      : '<p class="muted">No appointment service data stored.</p>';

    if (!breakdownContainer.dataset.categoryClickHandler) {
      breakdownContainer.dataset.categoryClickHandler = "true";
      breakdownContainer.addEventListener("click", (event) => {
        const categoryButton = event.target.closest("[data-service-category]");
        if (!categoryButton) return;
        openCompletedJobsForServiceCategory(categoryButton.dataset.serviceCategory);
      });
    }
  }
}

function openCompletedJobsForServiceCategory(category) {
  const serviceNames = new Set(DATA.services
    .filter((service) => getServiceCategory(service.name) === category)
    .map((service) => service.name));
  const appointments = DATA.appointments.filter((appointment) => {
    if (canonicalAppointmentStatus(appointment.status) !== "Completed") return false;
    const services = Array.isArray(appointment.services)
      ? appointment.services
      : [appointment.services || "Service"];
    return services.some((serviceName) =>
      category === "Needs category"
        ? getServiceCategory(serviceName) === category
        : serviceNames.has(serviceName) && getServiceCategory(serviceName) === category,
    );
  });

  const jobs = appointments;
  const body = jobs.length
    ? `<div class="category-completed-jobs">
        ${jobs.map((appointment) => `
          <button type="button" class="category-completed-job" data-appointment-id="${escapeDashboardHtml(appointment.id)}">
            <span class="category-completed-job-heading">
              <strong>${escapeDashboardHtml(appointment.id)}</strong>
              <span>${escapeDashboardHtml(appointment.customer || "Customer")}</span>
            </span>
            <span>${escapeDashboardHtml(appointment.bike || appointment.motorcycle || "Unknown Motorcycle")}</span>
            <span>${escapeDashboardHtml((Array.isArray(appointment.services) ? appointment.services : [appointment.services || "Service"]).join(", "))}</span>
            <span>${escapeDashboardHtml(appointment.date || "Date not set")} · ${escapeDashboardHtml(appointment.mechanic || "Mechanic not recorded")}</span>
            <strong class="category-completed-job-total">${peso(storedAmount(appointment.transaction?.total ?? appointment.total))}</strong>
          </button>
        `).join("")}
      </div>`
    : '<p class="muted">There are no completed jobs in this service category yet.</p>';

  openModal(`Completed Jobs — ${category}`, body);
  $("#modalBody")?.querySelectorAll(".category-completed-job").forEach((button) => {
    button.addEventListener("click", () => {
      const job = DATA.jobs.find(
        (item) => item.apptRef === button.dataset.appointmentId,
      );
      if (job) openAdminJobDetails(job);
    });
  });
}

/* =========================================================
   MECHANIC JOBS & APPOINTMENT SYNC LOGIC
========================================================= */

// Active mechanic assignments block new work until the appointment is finished.
function isMechanicBusy(mechanicName, excludeApptId = null) {
  if (!mechanicName) return false;
  return DATA.appointments.some((a) => {
    if (excludeApptId && a.id === excludeApptId) return false;
    if (a.mechanic !== mechanicName) return false;
    if (["Cancelled", "Completed", "Unpaid"].includes(canonicalAppointmentStatus(a.status)))
      return false;
    return true;
  });
}

function isMechanicUnavailableForAssignment(mechanicName, excludeApptId = null) {
  if (!mechanicName) return false;
  return DATA.appointments.some((a) => {
    if (excludeApptId && a.id === excludeApptId) return false;
    if (a.mechanic !== mechanicName) return false;
    if (["Cancelled", "Completed", "Unpaid"].includes(canonicalAppointmentStatus(a.status)))
      return false;
    return true;
  });
}

function getAvailableMechanics(excludeApptId = null) {
  const allMechanics = getActiveMechanics();
  return allMechanics.map((m) => {
    const busy = isMechanicBusy(m.name, excludeApptId);
    return { name: m.name, initials: m.initials, busy };
  });
}

function getActiveMechanics() {
  const activeMechanics = DATA.users.filter(
    (user) =>
      user.role === "Mechanic" &&
      !["inactive", "deactivated", "disabled"].includes(
        String(user.status || "Active").toLowerCase(),
      ),
  );
  const storedEmails = new Set(
    DATA.users.map((user) => user.email?.toLowerCase()).filter(Boolean),
  );
  const activeNames = new Set(activeMechanics.map((user) => user.name.toLowerCase()));
  FALLBACK_MECHANICS.forEach((mechanic) => {
    if (storedEmails.has(mechanic.email) || activeNames.has(mechanic.name.toLowerCase())) return;
    activeMechanics.push({
      ...mechanic,
      role: "Mechanic",
      status: "Active",
      initials: avatarInitials(mechanic.name),
    });
  });
  return activeMechanics;
}

function getMechanicOptionsForJob(job) {
  const currentName = job?.mechanic || "";
  return getActiveMechanics().map((mechanic) => {
    const isCurrentSelection = mechanic.name === currentName;
    const unavailable = !isCurrentSelection && isMechanicUnavailableForAssignment(mechanic.name, job?.apptRef || null);
    return {
      name: mechanic.name,
      current: isCurrentSelection,
      unavailable,
    };
  });
}

function getMechanicAvailabilityBadge(mechanicName) {
  if (!mechanicName) {
    return '<span class="mechanic-availability is-unassigned">No mechanic assigned</span>';
  }
  const unavailable = isMechanicUnavailableForAssignment(mechanicName);
  return `<span class="mechanic-availability ${unavailable ? "is-unavailable" : "is-available"}">${unavailable ? "Unavailable" : "Available"}</span>`;
}

function assignMechanicToJob(jobId, mechanicName) {
  const job = DATA.jobs.find((item) => item.id === jobId);
  if (!job) return;

  const appointment = DATA.appointments.find((item) => item.id === job.apptRef);
  if (!appointment) return;
  const currentEmail = (localStorage.getItem("userEmail") || "").trim().toLowerCase();
  const hasCompletedJobEditAuthority =
    String(localStorage.getItem("userRole") || "").toLowerCase() === "master_admin" ||
    appointment.completedJobEditAuthorizedBy?.toLowerCase() === currentEmail;
  if (
    canonicalAppointmentStatus(appointment.status) === "Completed" &&
    !hasCompletedJobEditAuthority
  ) {
    window.alert("This completed job is locked. Request Master Admin approval before editing it.");
    renderJobs();
    return;
  }

  const normalized = (mechanicName || "").trim();
  if (normalized) {
    const mechanicExists = getActiveMechanics().some(
      (user) => user.name === normalized,
    );
    if (!mechanicExists) {
      window.alert("Choose a valid mechanic from the available list.");
      renderJobs();
      return;
    }
    if (isMechanicUnavailableForAssignment(normalized, job.apptRef)) {
      window.alert(`${normalized} is already assigned to another active job.`);
      renderJobs();
      return;
    }
  }
  const previousMechanic = appointment.mechanic || "";
  appointment.mechanic = normalized || "";
  appointment.completedJobEditAuthorizedBy = "";
  job.mechanic = normalized || "";
  job.initials = normalized ? avatarInitials(normalized) : "—";

  if (normalized && normalized !== previousMechanic) {
    notifyMechanicOfAssignment(
      appointment,
      normalized,
      "New job assigned",
      "is assigned to you",
    );
  }
  if (previousMechanic && previousMechanic !== normalized) {
    notifyMechanicOfAssignment(
      appointment,
      previousMechanic,
      "Job assignment updated",
      "is no longer assigned to you",
    );
  }

  persistAppointments();
  rebuildDerivedDashboardData();
  renderJobs();
  renderAppointmentsPage();
  renderDashboardAppointments();
}

/* ===================== MECHANIC JOBS PAGE RENDER ===================== */
function renderJobs() {
  const jobsList = $("#jobsList");
  if (!jobsList) return;

  const activeStatus =
    $("#jobsAdminFilters .pill.active")?.dataset.status || "All";
  const searchTerm = ($("#jobsAdminSearch")?.value || "").trim().toLowerCase();

  const filteredJobs = DATA.jobs.filter((job) => {
    const searchable = [job.id, job.customer, job.bike, job.mechanic, job.note]
      .join(" ")
      .toLowerCase();
    const jobStatus = canonicalAppointmentStatus(job.status);
    const matchesStatus = activeStatus === "All"
      || (activeStatus === "Unassigned"
        ? jobStatus !== "Cancelled" && !job.mechanic
        : jobStatus === canonicalAppointmentStatus(activeStatus));
    return matchesStatus && (!searchTerm || searchable.includes(searchTerm));
  });

  const summary = $("#jobsAdminSummary");
  if (summary)
    summary.textContent = `${filteredJobs.length} of ${DATA.jobs.length} mechanic jobs`;

  jobsList.innerHTML =
    filteredJobs
      .map((j) => {
        const isCompleted = canonicalAppointmentStatus(j.status) === "Completed";
        const isCancelled = canonicalAppointmentStatus(j.status) === "Cancelled";
        const isMasterAdmin =
          String(localStorage.getItem("userRole") || "").toLowerCase() === "master_admin";
        const currentEmail = (localStorage.getItem("userEmail") || "").trim().toLowerCase();
        const isLockedCompleted =
          isCompleted &&
          !isMasterAdmin &&
          j.completedJobEditAuthorizedBy?.toLowerCase() !== currentEmail;
        const mechanicAssignment = isLockedCompleted || isCancelled
          ? `<div style="font-size: 13px; font-weight: 600; color: #fff;">${escapeDashboardHtml(j.mechanic || "Mechanic not recorded")}</div>`
          : `
              <select class="job-mechanic-select" data-job-id="${j.id}" aria-label="Assign mechanic to ${j.id}" style="width: 100%; max-width: 220px; background: #111827; color: #fff; border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; padding: 6px 8px;">
                <option value="">Unassigned</option>
                ${getMechanicOptionsForJob(j)
                  .map(
                    (mechanic) => `
                      <option value="${mechanic.name}" ${mechanic.current ? "selected" : ""} ${!mechanic.current && mechanic.unavailable ? "disabled" : ""}>
                        ${mechanic.name}${!mechanic.current && mechanic.unavailable ? " (Busy)" : ""}
                      </option>
                    `,
                  )
                  .join("")}
              </select>
              ${getMechanicAvailabilityBadge(j.mechanic)}`;
        const jobAction = isCancelled
          ? ""
          : isLockedCompleted
          ? `<button type="button" class="btn-secondary request-completed-job-edit" data-appointment-id="${escapeDashboardHtml(j.apptRef)}">Request Edit</button>`
          : `<label class="job-status-control">Update job status
              <select class="job-status-select" data-appointment-id="${j.apptRef}" aria-label="Update job status for ${j.id}">
                ${MECHANIC_JOB_STATUS_FLOW.map((status) => `<option value="${status.value}" ${canonicalAppointmentStatus(j.status) === canonicalAppointmentStatus(status.value) ? "selected" : ""}>${status.label}</option>`).join("")}
              </select>
            </label>`;
        return `
      <div class="job-card" data-job-id="${j.id}" style="background: #1e1e2d; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 16px; margin-bottom: 12px; display: flex; flex-direction: column; gap: 10px; cursor: pointer;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-family: var(--font-mono); font-weight: 700; color: var(--orange);">${j.id}</span>
        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;"><span class="job-card-status">${statusBadge(j.status)}</span>${jobAction}</div>
      </div>
      <div style="font-size: 16px; font-weight: 600; color: #fff;">${j.customer} — <span style="font-weight: 400; color: var(--text-sub, #9ca3af);">${j.bike}</span></div>
      <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.03); padding: 8px 12px; border-radius: 6px; gap: 12px; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1;">
          <div class="avatar" style="width: 28px; height: 28px; font-size: 12px;">${j.initials}</div>
          <div style="display:flex; flex-direction:column; gap:4px; min-width:0; flex:1;">
            <span style="font-weight: 500; font-size: 13px;">${isLockedCompleted ? "Completed by" : "Assigned mechanic"}</span>
            ${mechanicAssignment}
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 14px; font-size: 13px;">
          <span class="subtext">📦 ${j.parts} parts allocated</span>
          <span style="font-weight: 700; color: var(--orange); font-family: var(--font-mono);">${peso(j.cost)}</span>
        </div>
      </div>
      <div style="font-size: 13px; color: var(--text-sub, #9ca3af); font-style: italic;">Notes: ${j.note}</div>
    </div>
  `;
      })
      .join("") ||
    `<div class="jobs-admin-empty">No mechanic jobs match the selected filters.</div>`;

  jobsList.querySelectorAll(".job-mechanic-select").forEach((select) => {
    select.addEventListener("change", (event) => {
      const jobId = event.target.dataset.jobId;
      if (!jobId) return;
      assignMechanicToJob(jobId, event.target.value);
    });
  });

  jobsList.querySelectorAll(".request-completed-job-edit").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const appointment = DATA.appointments.find(
        (item) => item.id === button.dataset.appointmentId,
      );
      if (appointment) openCompletedJobEditRequestModal(appointment);
    });
  });

  jobsList.querySelectorAll(".job-status-select").forEach((select) => {
    select.addEventListener("change", (event) => {
      const appointmentId = event.target.dataset.appointmentId;
      if (!appointmentId) return;
      updateAppointmentStatus(appointmentId, event.target.value);
    });
  });

  jobsList.querySelectorAll(".job-card").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest(".job-mechanic-select, .job-status-select, .request-completed-job-edit")) return;
      const job = DATA.jobs.find((item) => item.id === card.dataset.jobId);
      if (job) openAdminJobDetails(job);
    });
  });
}

function openAdminJobDetails(job) {
  const appointment = DATA.appointments.find((item) => item.id === job.apptRef);
  const bookedAt = appointment?.createdAt
    ? new Date(appointment.createdAt).toLocaleString("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Not available for this legacy job";
  const services =
    appointment?.services || job.note || "Service details unavailable";
  const parts = appointment?.parts?.length
    ? appointment.parts
        .map((part) => `${part.name} x${part.quantity || 1}`)
        .join(", ")
    : "No parts requested";
  const details = `
      <div class="admin-job-details-grid">
        <div><span>Customer</span><strong>${job.customer}</strong></div>
        <div><span>Contact</span><strong>${appointment?.phone || "N/A"}</strong></div>
        <div><span>Motorcycle</span><strong>${job.bike}</strong></div>
        <div><span>Assigned mechanic</span><strong>${job.mechanic || "Unassigned"}</strong></div>
        <div><span>Service requested</span><strong>${Array.isArray(services) ? services.join(", ") : services}</strong></div>
        <div><span>Status</span><strong>${statusBadge(job.status)}</strong></div>
        <div><span>Scheduled date</span><strong>${appointment?.date || "Not set"}</strong></div>
        <div><span>Scheduled time</span><strong>${appointment?.time || "Not set"}</strong></div>
        <div class="full"><span>Booked by customer</span><strong>${bookedAt}</strong></div>
        <div class="full"><span>Parts requested</span><strong>${parts}</strong></div>
        <div class="full"><span>Notes</span><strong>${appointment?.notes || job.note || "No notes provided"}</strong></div>
      </div>`;
  openModal(`Job Details: ${job.id}`, details);
}

$("#jobsAdminSearch")?.addEventListener("input", renderJobs);
$("#jobsAdminFilters")?.addEventListener("click", (event) => {
  const pill = event.target.closest(".pill");
  if (!pill) return;
  $$("#jobsAdminFilters .pill").forEach((item) =>
    item.classList.remove("active"),
  );
  pill.classList.add("active");
  renderJobs();
});

/* ===================== USER MANAGEMENT PAGE ===================== */
const ACCOUNT_REQUESTS_KEY = "motofix_account_requests";
const ACCOUNT_DIRECTORY_KEY = "motofix_account_directory";

function escapeAccountText(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );
}

function getAccountRequests() {
  try {
    const requests = JSON.parse(
      localStorage.getItem(ACCOUNT_REQUESTS_KEY) || "[]",
    );
    return Array.isArray(requests) ? requests : [];
  } catch {
    return [];
  }
}

function saveAccountDirectory() {
  localStorage.setItem(ACCOUNT_DIRECTORY_KEY, JSON.stringify(DATA.users));
}

function isMasterAdmin() {
  return localStorage.getItem("userRole") === "master_admin";
}

function renderAccountRequests() {
  const panel = $("#accountPermissionPanel");
  const container = $("#accountPermissionRequests");
  if (!panel || !container) return;

  panel.hidden = !isMasterAdmin();
  const shortcut = $("#reviewAccountRequestsBtn");
  if (shortcut) shortcut.hidden = !isMasterAdmin();
  if (panel.hidden) return;

  const requests = getAccountRequests();
  const pending = requests.filter((request) => request.status === "Pending");
  $("#pendingAccountRequestCount").textContent = `${pending.length} PENDING`;
  const shortcutCount = $("#accountRequestNavCount");
  if (shortcutCount) shortcutCount.textContent = String(pending.length);
  if (shortcut) {
    shortcut.setAttribute(
      "aria-label",
      `Review account requests, ${pending.length} pending`,
    );
    shortcut.classList.toggle("has-pending-requests", pending.length > 0);
  }
  container.innerHTML = pending.length
    ? `<div class="table-scroll"><table class="data-table"><thead><tr><th>Request</th><th>Account</th><th>Requested by</th><th>Submitted</th><th>Review</th></tr></thead><tbody>${pending
        .map((request) => {
          const changes = request.changes || {};
          const account =
            request.operation === "Remove"
              ? request.accountName || request.accountEmail
              : `${changes.name || "New account"} · ${changes.role || ""} · ${changes.email || ""}`;
          return `<tr data-account-request-row="${escapeAccountText(request.id)}" tabindex="-1">
          <td>${escapeAccountText(request.operation)}</td>
          <td>${escapeAccountText(account)}</td>
          <td>${escapeAccountText(request.requestedBy || "Sub-admin")}</td>
          <td>${escapeAccountText(new Date(request.createdAt).toLocaleString())}</td>
          <td><div class="account-request-actions"><button class="btn-mini" data-request-action="approve" data-request-id="${escapeAccountText(request.id)}">Approve</button><button class="btn-mini account-request-reject" data-request-action="reject" data-request-id="${escapeAccountText(request.id)}">Reject</button></div></td>
        </tr>`;
        })
        .join("")}</tbody></table></div>`
    : '<p class="subtext account-requests-empty">No pending account change requests.</p>';
}

function renderUsers() {
  const usersGrid = $("#usersGrid");
  if (!usersGrid) return;
  const activeFilter = $("#userFilters .pill.active")?.dataset.filter || "All";
  const canManage =
    isMasterAdmin() || localStorage.getItem("userRole") === "admin";
  const addButton = $("#addUserBtn");
  const permissionNote = $("#accountPermissionNote");
  if (addButton) addButton.hidden = !canManage;
  if (permissionNote) permissionNote.hidden = !canManage || isMasterAdmin();
  const list = DATA.users.filter(
    (user) => activeFilter === "All" || user.role === activeFilter,
  );

  usersGrid.innerHTML =
    list
      .map(
        (user) => `
    <article class="user-card">
      <div class="user-head">
        <div class="user-id">
          <div class="avatar">${escapeAccountText(user.initials || avatarInitials(user.name))}</div>
          <div><div class="user-name">${escapeAccountText(user.name)}</div><span class="role-badge role-${escapeAccountText(user.role.toLowerCase().replace(/\s+/g, "-"))}">${escapeAccountText(user.role)}</span></div>
        </div>
      </div>
      <div class="user-detail">✉ ${escapeAccountText(user.email)}</div>
      <div class="user-detail">📞 ${escapeAccountText(user.phone || "No phone")}</div>
      <div class="user-detail">🕒 Member since ${escapeAccountText(user.since || "Not available")}</div>
      ${canManage ? `<div class="account-card-actions"><button type="button" class="btn-mini" data-account-action="edit" data-account-email="${escapeAccountText(user.email)}">Edit</button><button type="button" class="btn-mini account-request-reject" data-account-action="remove" data-account-email="${escapeAccountText(user.email)}">Remove</button></div>` : ""}
    </article>
  `,
      )
      .join("") || '<p class="subtext">No users in this category.</p>';

  renderAccountRequests();
}

function openAccountEditor(accountEmail = "") {
  const account = DATA.users.find((user) => user.email === accountEmail);
  const isEdit = Boolean(account);
  const fields = `
    <form id="accountEditForm" class="account-edit-form">
      <div class="field"><label for="accountName">Full name</label><input id="accountName" name="name" value="${escapeAccountText(account?.name || "")}" autocomplete="name" required></div>
      <div class="field"><label for="accountRole">Role</label><select id="accountRole" name="role"><option ${account?.role === "Admin" ? "selected" : ""}>Admin</option><option ${account?.role === "Mechanic" ? "selected" : ""}>Mechanic</option><option ${account?.role === "Customer" ? "selected" : ""}>Customer</option></select></div>
      <div class="field"><label for="accountEmail">Email address</label><input id="accountEmail" name="email" type="email" value="${escapeAccountText(account?.email || "")}" autocomplete="email" required></div>
      <div class="field"><label for="accountPhone">Phone</label><input id="accountPhone" name="phone" type="tel" value="${escapeAccountText(account?.phone || "")}" autocomplete="tel"></div>
      <div class="field"><label for="accountPassword">${isEdit ? "New password (optional)" : "Temporary password"}</label><input id="accountPassword" name="password" type="password" minlength="6" ${isEdit ? "" : "required"} autocomplete="new-password"></div>
      <p class="account-form-error" id="accountFormError" role="alert"></p>
      <button class="btn-primary" type="submit">${isEdit ? "Submit account changes" : "Create account"}</button>
    </form>`;

  openModal(isEdit ? "Edit user account" : "Add user account", fields);
  $("#accountEditForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;

    const changes = Object.fromEntries(new FormData(form));
    changes.email = changes.email.trim().toLowerCase();
    changes.name = changes.name.trim();
    changes.phone = changes.phone.trim();
    const emailConflict = DATA.users.some(
      (user) =>
        user.email.toLowerCase() === changes.email &&
        user.email !== account?.email,
    );
    const pendingConflict = getAccountRequests().some(
      (request) =>
        request.status === "Pending" &&
        ((request.operation === "Add" &&
          request.changes?.email?.toLowerCase() === changes.email) ||
          (account && request.accountEmail === account.email)),
    );
    if (emailConflict || pendingConflict) {
      $("#accountFormError").textContent =
        "An account or pending request already uses this email.";
      return;
    }

    const request = {
      id: `AR-${Date.now()}`,
      operation: isEdit ? "Edit" : "Add",
      accountEmail: account?.email || null,
      accountName: account?.name || null,
      changes,
      requestedBy:
        localStorage.getItem("userFullName") ||
        localStorage.getItem("userEmail") ||
        "Administrator",
      requestedByRole: localStorage.getItem("userRole") || "admin",
      createdAt: new Date().toISOString(),
      status: "Pending",
    };
    submitAccountChangeRequest(request);
  });
}

function submitAccountChangeRequest(request) {
  if (!isMasterAdmin() && localStorage.getItem("userRole") !== "admin") return;
  if (isMasterAdmin()) {
    applyAccountChangeRequest(request);
    $("#modalBackdrop").classList.remove("open");
    renderUsers();
    showAccountFeedback(
      request.operation === "Add" ? "Account created." : "Account updated.",
    );
    return;
  }

  const requests = getAccountRequests();
  requests.unshift(request);
  localStorage.setItem(ACCOUNT_REQUESTS_KEY, JSON.stringify(requests));
  const notifications = JSON.parse(
    localStorage.getItem("motofix_notifications") || "[]",
  );
  notifications.unshift({
    id: `N-${request.id}`,
    title: "Account change approval requested",
    message: `${request.requestedBy} requested to ${request.operation.toLowerCase()} an account.`,
    requestId: request.id,
    audiences: ["master_admin"],
    createdAt: request.createdAt,
    readBy: [],
  });
  localStorage.setItem(
    "motofix_notifications",
    JSON.stringify(notifications.slice(0, 100)),
  );
  window.dispatchEvent(new Event("motofix:notifications-changed"));
  $("#modalBackdrop").classList.remove("open");
  renderUsers();
  showAccountFeedback("Request sent to Master Admin for approval.");
}

function applyAccountChangeRequest(request) {
  const authUsers = JSON.parse(localStorage.getItem("motofix_users") || "[]");
  const disabledEmails = JSON.parse(
    localStorage.getItem("motofix_disabled_accounts") || "[]",
  );

  if (request.operation === "Remove") {
    DATA.users = DATA.users.filter(
      (user) => user.email !== request.accountEmail,
    );
    localStorage.setItem(
      "motofix_disabled_accounts",
      JSON.stringify([
        ...new Set([...disabledEmails, request.accountEmail.toLowerCase()]),
      ]),
    );
    localStorage.setItem(
      "motofix_users",
      JSON.stringify(
        authUsers.filter(
          (user) =>
            user.email.toLowerCase() !== request.accountEmail.toLowerCase(),
        ),
      ),
    );
  } else {
    const changes = request.changes;
    const existing = DATA.users.find(
      (user) => user.email === request.accountEmail,
    );
    const account = {
      ...(existing || {}),
      id: existing?.id || `U-${Date.now()}`,
      name: changes.name,
      role: changes.role,
      email: changes.email,
      phone: changes.phone,
      since: existing?.since || new Date().toISOString().slice(0, 10),
      initials: avatarInitials(changes.name),
    };

    if (existing) {
      DATA.users = DATA.users.map((user) =>
        user.email === request.accountEmail ? account : user,
      );
    } else {
      DATA.users.push(account);
    }
    const previousEmail = request.accountEmail?.toLowerCase();
    const nextDisabledEmails = disabledEmails.filter(
      (email) => email !== changes.email,
    );
    if (previousEmail && previousEmail !== changes.email)
      nextDisabledEmails.push(previousEmail);
    localStorage.setItem(
      "motofix_disabled_accounts",
      JSON.stringify([...new Set(nextDisabledEmails)]),
    );
    const authUserIndex = authUsers.findIndex(
      (user) =>
        user.email.toLowerCase() === request.accountEmail?.toLowerCase() ||
        user.email.toLowerCase() === changes.email,
    );
    if (authUserIndex >= 0) {
      authUsers[authUserIndex] = {
        ...authUsers[authUserIndex],
        name: changes.name,
        email: changes.email,
        phone: changes.phone,
        role: changes.role.toLowerCase(),
        ...(changes.password ? { password: changes.password } : {}),
      };
    } else if (changes.password) {
      authUsers.push({
        id: account.id,
        name: changes.name,
        email: changes.email,
        phone: changes.phone,
        password: changes.password,
        role: changes.role.toLowerCase(),
      });
    }
    localStorage.setItem("motofix_users", JSON.stringify(authUsers));
  }

  saveAccountDirectory();
}

function showAccountFeedback(message) {
  const feedback = document.createElement("div");
  feedback.className = "account-feedback";
  feedback.setAttribute("role", "status");
  feedback.textContent = message;
  document.body.appendChild(feedback);
  window.setTimeout(() => feedback.remove(), 3600);
}

function reviewAccountRequest(requestId, decision) {
  if (!isMasterAdmin()) return;
  const requests = getAccountRequests();
  const request = requests.find(
    (item) => item.id === requestId && item.status === "Pending",
  );
  if (!request) return;

  if (decision === "approve") applyAccountChangeRequest(request);
  if (request.changes?.password) delete request.changes.password;
  request.status = decision === "approve" ? "Approved" : "Rejected";
  request.reviewedAt = new Date().toISOString();
  request.reviewedBy = localStorage.getItem("userEmail") || "Master Admin";
  localStorage.setItem(ACCOUNT_REQUESTS_KEY, JSON.stringify(requests));
  renderUsers();
  showAccountFeedback(`Account request ${request.status.toLowerCase()}.`);
}

$("#userFilters")?.addEventListener("click", (event) => {
  const pill = event.target.closest(".pill");
  if (!pill) return;
  $$("#userFilters .pill").forEach((item) => item.classList.remove("active"));
  pill.classList.add("active");
  renderUsers();
});

$("#usersGrid")?.addEventListener("click", (event) => {
  if (!isMasterAdmin() && localStorage.getItem("userRole") !== "admin") return;
  const actionButton = event.target.closest("[data-account-action]");
  if (!actionButton) return;
  const account = DATA.users.find(
    (user) => user.email === actionButton.dataset.accountEmail,
  );
  if (!account) return;

  if (actionButton.dataset.accountAction === "edit") {
    openAccountEditor(account.email);
    return;
  }

  const request = {
    id: `AR-${Date.now()}`,
    operation: "Remove",
    accountEmail: account.email,
    accountName: account.name,
    requestedBy:
      localStorage.getItem("userFullName") ||
      localStorage.getItem("userEmail") ||
      "Administrator",
    requestedByRole: localStorage.getItem("userRole") || "admin",
    createdAt: new Date().toISOString(),
    status: "Pending",
  };
  if (isMasterAdmin()) {
    if (
      !window.confirm(
        `Remove ${account.name}'s account? This will block future sign-ins.`,
      )
    )
      return;
    applyAccountChangeRequest(request);
    renderUsers();
    showAccountFeedback("Account removed.");
  } else {
    submitAccountChangeRequest(request);
  }
});

$("#accountPermissionRequests")?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-request-action]");
  if (button)
    reviewAccountRequest(
      button.dataset.requestId,
      button.dataset.requestAction,
    );
});

$("#reviewAccountRequestsBtn")?.addEventListener("click", () => {
  const panel = $("#accountPermissionPanel");
  if (!panel || panel.hidden) return;
  panel.scrollIntoView({ behavior: "smooth", block: "start" });
  panel.focus({ preventScroll: true });
});

const addUserBtnEl = $("#addUserBtn");
if (addUserBtnEl)
  addUserBtnEl.addEventListener("click", () => openAccountEditor());

/* ===================== MASTER EMPLOYEE MANAGER ===================== */
function renderMasterEmployees() {
  const grid = $("#masterEmployeesGrid");
  if (!grid) return;

  const activeFilter = $("#masterEmployeeFilters .pill.active")?.dataset.filter || "All";
  const employees = DATA.masterEmployees.filter(
    (employee) => activeFilter === "All" || employee.role === activeFilter,
  );

  grid.innerHTML = employees
    .map(
      (employee) => `
        <div class="user-card master-employee-card" data-employee-id="${escapeDashboardHtml(employee.id)}" tabindex="0" role="button" aria-label="View details for ${escapeDashboardHtml(employee.name)}">
          <div class="user-head">
            <div class="user-id">
              <div class="avatar">${escapeDashboardHtml(avatarInitials(employee.name))}</div>
              <div>
                <div class="user-name">${escapeDashboardHtml(employee.name)}</div>
                <span class="role-badge role-${escapeDashboardHtml(employee.role.toLowerCase())}">${escapeDashboardHtml(employee.role)}</span>
              </div>
            </div>
          </div>
          <div class="user-detail">✉ ${escapeDashboardHtml(employee.email)}</div>
          <div class="user-detail">Status: ${statusBadge(employee.status)}</div>
          <div style="display:flex;gap:8px;margin-top:12px;">
            <button type="button" class="btn-view edit-employee-inline" data-email="${escapeDashboardHtml(employee.email)}">Edit</button>
            <button type="button" class="btn-view delete-emp-inline" data-id="${escapeDashboardHtml(employee.id)}" style="color:var(--red);border-color:rgba(239,68,68,0.2);">Deactivate</button>
          </div>
        </div>
      `,
    )
    .join("") || `<p class="subtext">No employees in this category.</p>`;

  grid.querySelectorAll(".master-employee-card").forEach((card) => {
    const openDetails = () => {
      const employee = DATA.masterEmployees.find(
        (item) => String(item.id) === card.dataset.employeeId,
      );
      if (employee) openMasterEmployeeDetails(employee);
    };

    card.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      openDetails();
    });
    card.addEventListener("keydown", (event) => {
      if (event.target !== card || (event.key !== "Enter" && event.key !== " ")) return;
      event.preventDefault();
      openDetails();
    });
  });

  grid.querySelectorAll(".delete-emp-inline").forEach((button) => {
    button.addEventListener("click", () => {
      const id = Number(button.dataset.id);
      if (!confirm("Are you sure you want to deactivate this store employee account?")) return;
      const employee = DATA.masterEmployees.find((item) => item.id === id);
      const email = employee?.email?.toLowerCase();
      DATA.masterEmployees = DATA.masterEmployees.filter((employee) => employee.id !== id);
      writeStoredArray(MASTER_EMPLOYEE_STORAGE_KEY, DATA.masterEmployees);
      // Employee accounts are mirrored in motofix_users for authentication and shared user views.
      writeStoredArray(
        "motofix_users",
        readStoredArray("motofix_users").filter((user) => user.email?.toLowerCase() !== email),
      );
      initLocalStorageData();
      renderMasterEmployees();
      renderUsers();
      renderAdminDashboardStats();
    });
  });
  grid.querySelectorAll(".edit-employee-inline").forEach((button) => {
    button.addEventListener("click", () => {
      const employee = DATA.users.find((user) => user.email === button.dataset.email);
      if (employee) openAccountEditor(employee.email);
    });
  });
}

function openMasterEmployeeDetails(employee) {
  // The employee and shared user records are joined by normalized email in localStorage.
  const registeredUser = DATA.users.find(
    (user) => user.email?.toLowerCase() === employee.email?.toLowerCase(),
  );
  const memberSinceDate =
    registeredUser?.since && registeredUser.since !== "Built-in account"
      ? new Date(registeredUser.since)
      : null;
  const memberSince = memberSinceDate && !Number.isNaN(memberSinceDate.getTime())
    ? memberSinceDate.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : registeredUser?.since || "Not available";

  openModal(
    `Employee Details: ${escapeDashboardHtml(employee.name || "Employee")}`,
    `
      <div class="admin-job-details-grid">
        <div><span>Employee ID</span><strong>${escapeDashboardHtml(employee.id)}</strong></div>
        <div><span>Full name</span><strong>${escapeDashboardHtml(employee.name || "Not provided")}</strong></div>
        <div><span>Role</span><strong>${escapeDashboardHtml(employee.role || "Not provided")}</strong></div>
        <div><span>Email</span><strong>${escapeDashboardHtml(employee.email || "Not provided")}</strong></div>
        <div><span>Phone</span><strong>${escapeDashboardHtml(employee.phone || "Not provided")}</strong></div>
        <div><span>Status</span><strong>${escapeDashboardHtml(employee.status || "Not provided")}</strong></div>
        <div class="full"><span>Member since</span><strong>${escapeDashboardHtml(memberSince)}</strong></div>
      </div>
    `,
  );
}

$("#masterEmployeeFilters")?.addEventListener("click", (event) => {
  const filter = event.target.closest(".pill");
  if (!filter) return;
  $$("#masterEmployeeFilters .pill").forEach((pill) => pill.classList.remove("active"));
  filter.classList.add("active");
  renderMasterEmployees();
});

const openAddMechanicModalBtn = $("#openAddMechanicModalBtn");
if (openAddMechanicModalBtn) {
  openAddMechanicModalBtn.addEventListener("click", () => {
    openModal(
      "Add Store Employee Account",
      `
      <div class="field"><label>Full Name</label><input id="newEmpName" required></div>
      <div class="field"><label>Employee Role</label>
        <select id="newEmpRole">
          <option value="Mechanic">Mechanic</option>
          <option value="Admin">Store Admin</option>
        </select>
      </div>
      <div class="field"><label>Email Address</label><input id="newEmpEmail" type="email" required></div>
      <div class="field"><label>Password</label><input id="newEmpPassword" type="password" minlength="6" required></div>
      <button class="btn-primary" id="saveNewEmpBtn" style="width:100%;margin-top:6px;">Create Account</button>
      `,
    );

    const saveBtn = $("#saveNewEmpBtn");
    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        const nameInput = $("#newEmpName");
        const roleInput = $("#newEmpRole");
        const emailInput = $("#newEmpEmail");
        const passwordInput = $("#newEmpPassword");
        const email = emailInput?.value.trim().toLowerCase();
        const registeredUsers = readStoredArray("motofix_users");
        if (
          !nameInput?.value.trim() ||
          !email ||
          !passwordInput?.value ||
          [...registeredUsers, ...DATA.masterEmployees].some((account) => account.email?.toLowerCase() === email)
        ) {
          return window.alert("Enter a name, a unique email, and a password of at least 6 characters.");
        }

        if (nameInput && nameInput.value) {
          const newId =
            [...DATA.masterEmployees, ...registeredUsers].reduce(
              (maximum, account) => Math.max(maximum, Number(account.id) || 0),
              0,
            ) + 1;
          const newEmployee = {
            id: newId,
            name: nameInput.value,
            role: roleInput ? roleInput.value : "Mechanic",
            email,
            phone: "",
            status: "Active",
            password: passwordInput.value,
          };
          DATA.masterEmployees.push(newEmployee);
          writeStoredArray(MASTER_EMPLOYEE_STORAGE_KEY, DATA.masterEmployees);
          // Keep the account in the shared user collection so login and role-based dashboards can resolve it.
          registeredUsers.push({
            ...newEmployee,
            first_name: newEmployee.name.split(/\s+/)[0],
            role: newEmployee.role,
            created_at: new Date().toISOString(),
          });
          writeStoredArray("motofix_users", registeredUsers);
          initLocalStorageData();
          renderMasterEmployees();
          renderUsers();
          renderAdminDashboardStats();
          $("#modalBackdrop").classList.remove("open");
        }
      });
    }
  });
}

function renderRegisteredMotorcycles() {
  const table = $("#registeredMotorcyclesTable");
  if (!table) return;

  const query = ($("#registeredMotorcycleSearch")?.value || "").trim().toLowerCase();
  const motorcycles = readStoredArray(MOTORCYCLE_STORAGE_KEY).filter((bike) => {
    const owner = DATA.users.find(
      (user) => user.email?.toLowerCase() === bike.ownerEmail?.toLowerCase(),
    );
    const ownerText = `${owner?.name || bike.ownerName || ""} ${bike.ownerEmail || ""}`;
    const bikeText = `${bike.year || ""} ${bike.make || ""} ${bike.model || ""} ${bike.plate || ""} ${bike.color || ""}`;
    return `${ownerText} ${bikeText}`.toLowerCase().includes(query);
  });

  table.innerHTML = `
    <thead><tr>
      <th>Owner</th><th>Motorcycle</th><th>Plate</th><th>Color</th><th>Mileage</th><th>Registered</th>
    </tr></thead>
    <tbody>${motorcycles.length
      ? motorcycles.map((bike) => {
          const owner = DATA.users.find(
            (user) => user.email?.toLowerCase() === bike.ownerEmail?.toLowerCase(),
          );
          const ownerName = owner?.name || bike.ownerName || bike.ownerEmail || "Unknown owner";
          const model = `${bike.year || ""} ${bike.make || ""} ${bike.model || ""}`.trim();
          const registered = bike.createdAt
            ? new Date(bike.createdAt).toLocaleDateString("en-PH")
            : "—";
          return `<tr class="registered-motorcycle-row" data-motorcycle-id="${escapeDashboardHtml(bike.id)}" tabindex="0" role="button" aria-label="View details for ${escapeDashboardHtml(model || "Motorcycle")} owned by ${escapeDashboardHtml(ownerName)}" style="cursor:pointer;">
            <td><div class="person"><div class="avatar">${escapeDashboardHtml(avatarInitials(ownerName))}</div><div><div class="person-name">${escapeDashboardHtml(ownerName)}</div><div class="person-sub">${escapeDashboardHtml(bike.ownerEmail || "")}</div></div></div></td>
            <td>${escapeDashboardHtml(model || "Motorcycle")}</td>
            <td>${escapeDashboardHtml(bike.plate || "—")}</td>
            <td>${escapeDashboardHtml(bike.color || "—")}</td>
            <td>${Number(bike.mileage || 0).toLocaleString("en-PH")} km</td>
            <td>${escapeDashboardHtml(registered)}</td>
          </tr>`;
        }).join("")
      : `<tr><td colspan="6" class="subtext" style="padding:26px 22px;">${query ? "No motorcycles match your search." : "No registered motorcycles yet."}</td></tr>`
    }</tbody>
  `;

  table.querySelectorAll(".registered-motorcycle-row").forEach((row) => {
    const openDetails = () => openRegisteredMotorcycleDetails(row.dataset.motorcycleId);
    row.addEventListener("click", openDetails);
    row.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      openDetails();
    });
  });
}

function openRegisteredMotorcycleDetails(motorcycleId) {
  const bike = readStoredArray(MOTORCYCLE_STORAGE_KEY).find(
    (item) => String(item.id) === String(motorcycleId),
  );
  if (!bike) return;

  const owner = DATA.users.find(
    (user) => user.email?.toLowerCase() === bike.ownerEmail?.toLowerCase(),
  );
  const ownerName = owner?.name || bike.ownerName || bike.ownerEmail || "Unknown owner";
  const model = [bike.year, bike.make, bike.model].filter(Boolean).join(" ") || "Motorcycle";
  const registered = bike.createdAt
    ? new Date(bike.createdAt).toLocaleString("en-PH")
    : "Not available";

  openModal(
    "Registered Motorcycle Details",
    `
      <div class="admin-job-details-grid">
        <div><span>Owner</span><strong>${escapeDashboardHtml(ownerName)}</strong></div>
        <div><span>Owner email</span><strong>${escapeDashboardHtml(bike.ownerEmail || "Not available")}</strong></div>
        <div><span>Motorcycle</span><strong>${escapeDashboardHtml(model)}</strong></div>
        <div><span>Brand</span><strong>${escapeDashboardHtml(bike.make || "Not provided")}</strong></div>
        <div><span>Model</span><strong>${escapeDashboardHtml(bike.model || "Not provided")}</strong></div>
        <div><span>Year</span><strong>${escapeDashboardHtml(bike.year || "Not provided")}</strong></div>
        <div><span>Plate number</span><strong>${escapeDashboardHtml(bike.plate || "Not provided")}</strong></div>
        <div><span>Color</span><strong>${escapeDashboardHtml(bike.color || "Not provided")}</strong></div>
        <div><span>Mileage</span><strong>${Number(bike.mileage || 0).toLocaleString("en-PH")} km</strong></div>
        <div><span>Registered</span><strong>${escapeDashboardHtml(registered)}</strong></div>
      </div>
    `,
  );
}

const registerMotorcycleBtn = $("#openRegisterMotorcycleBtn");
registerMotorcycleBtn?.addEventListener("click", () => {
  openModal(
    "Register Motorcycle",
    `
      <form id="registerCustomerMotorcycleForm">
        <div class="field"><label for="registered-bike-owner">Customer Email</label><input id="registered-bike-owner" type="email" list="registered-customer-emails" required><datalist id="registered-customer-emails">${DATA.users.filter((user) => user.role === "Customer").map((user) => `<option value="${escapeDashboardHtml(user.email)}">${escapeDashboardHtml(user.name)}</option>`).join("")}</datalist></div>
        <div class="field"><label for="registered-bike-make">Make</label><input id="registered-bike-make" required></div>
        <div class="field"><label for="registered-bike-model">Model</label><input id="registered-bike-model" required></div>
        <div class="field"><label for="registered-bike-year">Year</label><input id="registered-bike-year" type="number" min="1950" max="${new Date().getFullYear() + 1}" required></div>
        <div class="field"><label for="registered-bike-color">Color</label><input id="registered-bike-color"></div>
        <div class="field"><label for="registered-bike-plate">Plate Number</label><input id="registered-bike-plate" required></div>
        <div class="field"><label for="registered-bike-mileage">Mileage (km)</label><input id="registered-bike-mileage" type="number" min="0" value="0"></div>
        <button class="btn-primary" type="submit" style="width:100%;margin-top:6px;">Register Bike</button>
      </form>
    `,
  );

  $("#registerCustomerMotorcycleForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const ownerEmail = $("#registered-bike-owner").value.trim().toLowerCase();
    const plate = $("#registered-bike-plate").value.trim().toUpperCase();
    const year = Number($("#registered-bike-year").value);
    const mileage = Number($("#registered-bike-mileage").value || 0);
    const motorcycles = readStoredArray(MOTORCYCLE_STORAGE_KEY);
    const owner = DATA.users.find((user) => user.email?.toLowerCase() === ownerEmail && user.role === "Customer");
    if (!owner) return window.alert("Choose a registered customer account.");
    if (year < 1950 || year > new Date().getFullYear() + 1 || mileage < 0) {
      return window.alert("Enter a valid motorcycle year and non-negative mileage.");
    }
    if (motorcycles.some((bike) => bike.ownerEmail?.toLowerCase() === ownerEmail && bike.plate?.toUpperCase() === plate)) {
      return window.alert("This customer already has a motorcycle with that plate number.");
    }

    motorcycles.push({
      id: `B${Date.now()}`,
      ownerEmail,
      ownerName: owner?.name || "",
      make: $("#registered-bike-make").value.trim(),
      model: $("#registered-bike-model").value.trim(),
      year,
      color: $("#registered-bike-color").value.trim(),
      plate,
      mileage,
      createdAt: new Date().toISOString(),
    });
    writeStoredArray(MOTORCYCLE_STORAGE_KEY, motorcycles);
    $("#modalBackdrop")?.classList.remove("open");
    renderRegisteredMotorcycles();
  });
});

$("#registeredMotorcycleSearch")?.addEventListener("input", renderRegisteredMotorcycles);

/* ===================== INVENTORY CRUD (EDIT & DELETE) ===================== */
function openEditPartModal(sku) {
  const part = DATA.inventory.find((i) => i.sku === sku);
  if (!part) return;

  openModal(
    "Edit Part",
    `
    <form id="editPartForm">
        <input type="hidden" id="editPartOriginalSku" value="${part.sku}">
        <div style="margin-bottom: 12px;">
            <label style="display:block; margin-bottom:4px; font-weight:500;">Part Name</label>
            <input type="text" id="editPartName" value="${part.name}" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
        </div>
        <div style="margin-bottom: 12px;">
            <label style="display:block; margin-bottom:4px; font-weight:500;">SKU</label>
            <input type="text" id="editPartSku" value="${part.sku}" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
        </div>
        <div style="margin-bottom: 12px;">
            <label style="display:block; margin-bottom:4px; font-weight:500;">Brand</label>
            <input type="text" id="editPartBrand" value="${part.brand}" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
        </div>
        <div style="margin-bottom: 12px;">
            <label style="display:block; margin-bottom:4px; font-weight:500;">Category</label>
            <input type="text" id="editPartCategory" value="${part.category}" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
        </div>
        <div style="margin-bottom: 12px;">
            <label style="display:block; margin-bottom:4px; font-weight:500;">Stock</label>
            <input type="number" id="editPartStock" min="0" value="${part.stock}" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
        </div>
        <div style="margin-bottom: 12px;">
            <label style="display:block; margin-bottom:4px; font-weight:500;">Unit Price (₱)</label>
            <input type="number" id="editPartPrice" step="0.01" min="0" value="${part.price}" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
        </div>
        <button type="submit" class="btn-primary" style="width:100%; margin-top:10px;">Update Part</button>
    </form>
  `,
  );
}

function deletePart(sku) {
  if (confirm(`Are you sure you want to delete the part with SKU: ${sku}?`)) {
    DATA.inventory = DATA.inventory.filter((i) => i.sku !== sku);
    localStorage.setItem("motofix_parts", JSON.stringify(DATA.inventory));
    renderInvFilters();
    renderInventoryTable();
  }
}

/* ===================== SERVICES CRUD (EDIT & DELETE) ===================== */
function openEditServiceModal(code) {
  const service = DATA.services.find((s) => s.code === code);
  if (!service) return;

  openModal(
    "Edit Service",
    `
    <form id="editServiceForm">
        <input type="hidden" id="editServiceCode" value="${service.code}">
        <div style="margin-bottom: 12px;">
            <label style="display:block; margin-bottom:4px; font-weight:500;">Service Name</label>
            <input type="text" id="editServiceName" value="${service.name}" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
        </div>
        <div style="margin-bottom: 12px;">
            <label style="display:block; margin-bottom:4px; font-weight:500;">Category</label>
            <input type="text" id="editServiceCategory" value="${service.category}" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
        </div>
        <div style="margin-bottom: 12px;">
            <label style="display:block; margin-bottom:4px; font-weight:500;">Description</label>
            <textarea id="editServiceDesc" rows="3" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">${service.desc}</textarea>
        </div>
        <div style="margin-bottom: 12px;">
            <label style="display:block; margin-bottom:4px; font-weight:500;">Price (₱)</label>
            <input type="number" id="editServicePrice" step="0.01" min="0" value="${service.price}" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
        </div>
        <div style="margin-bottom: 12px;">
            <label style="display:block; margin-bottom:4px; font-weight:500;">Duration Label</label>
            <input type="text" id="editServiceHours" value="${service.hoursLabel}" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
        </div>
        <button type="submit" class="btn-primary" style="width:100%; margin-top:10px;">Update Service</button>
    </form>
  `,
  );
}

function deleteService(code) {
  if (confirm(`Are you sure you want to delete service code: ${code}?`)) {
    DATA.services = DATA.services.filter((s) => s.code !== code);
    localStorage.setItem("motofix_services", JSON.stringify(DATA.services));
    renderServiceFilters();
    renderServicesGrid();
  }
}

// Global listener handling edit form submissions
document.addEventListener("submit", (e) => {
  if (e.target && e.target.id === "editPartForm") {
    e.preventDefault();
    const originalSku = document.getElementById("editPartOriginalSku").value;
    const existingPart = DATA.inventory.find((item) => item.sku === originalSku);

    const updatedPart = {
      ...(existingPart || {}),
      name: document.getElementById("editPartName").value,
      sku: document.getElementById("editPartSku").value,
      brand: document.getElementById("editPartBrand").value,
      category: document.getElementById("editPartCategory").value,
      stock: parseInt(document.getElementById("editPartStock").value, 10),
      max: 60,
      price: parseFloat(document.getElementById("editPartPrice").value),
    };

    const index = DATA.inventory.findIndex((i) => i.sku === originalSku);
    if (index !== -1) {
      DATA.inventory[index] = updatedPart;
      try {
        DATA.inventory = window.updateInventoryLowStockAlerts(DATA.inventory);
        localStorage.setItem("motofix_parts", JSON.stringify(DATA.inventory));
      } catch (error) {
        console.error("Unable to update inventory part:", error);
        window.alert(error.message || "Unable to update this part.");
        return;
      }
      renderInvFilters();
      renderInventoryTable();
    }
    document.getElementById("modalBackdrop").classList.remove("open");
  }

  if (e.target && e.target.id === "editServiceForm") {
    e.preventDefault();
    const code = document.getElementById("editServiceCode").value;

    const updatedService = {
      code: code,
      name: document.getElementById("editServiceName").value,
      category: document.getElementById("editServiceCategory").value,
      price: parseFloat(document.getElementById("editServicePrice").value),
      hours: 1,
      hoursLabel: document.getElementById("editServiceHours").value,
      desc: document.getElementById("editServiceDesc").value,
    };

    const index = DATA.services.findIndex((s) => s.code === code);
    if (index !== -1) {
      DATA.services[index] = updatedService;
      localStorage.setItem("motofix_services", JSON.stringify(DATA.services));
      renderServiceFilters();
      renderServicesGrid();
    }
    document.getElementById("modalBackdrop").classList.remove("open");
  }
});

/* ===================== INIT ===================== */
function init() {
  syncAppointmentsFromStorage();
  try {
    const inventoryWithAlerts = window.updateInventoryLowStockAlerts(DATA.inventory);
    if (JSON.stringify(inventoryWithAlerts) !== JSON.stringify(DATA.inventory)) {
      localStorage.setItem("motofix_parts", JSON.stringify(inventoryWithAlerts));
      DATA.inventory = inventoryWithAlerts;
    }
  } catch (error) {
    console.error("Unable to check inventory stock alerts during dashboard startup:", error);
    window.alert(error.message || "Unable to check low-stock inventory alerts.");
  }

  // Master Admin Sidebar Check
  const userRole = localStorage.getItem("userRole");
  const adminFooterRole = $("#adminFooterRole");
  if (adminFooterRole) {
    const isMasterAdmin = userRole === "master_admin";
    const roleLabel = isMasterAdmin
      ? "General Admin"
      : userRole === "admin"
        ? "Sub-Admin"
        : "Administrator";
    adminFooterRole.textContent = roleLabel;
    adminFooterRole.classList.toggle("footer-role-general", isMasterAdmin);
    adminFooterRole.classList.toggle(
      "footer-role-subadmin",
      userRole === "admin",
    );
  }
  if (userRole === "master_admin") {
    const masterNavItem = document.getElementById("masterPortalNavItem");
    const masterLabel = document.getElementById("masterAdminLabel");
    if (masterNavItem) masterNavItem.style.display = "flex";
    if (masterLabel) masterLabel.style.display = "block";
  }

  renderBarChart("revenueChart", DATA.revenue);
  renderBarChart("revenueChart2", DATA.revenue);
  renderPieChart("serviceMixPie", "serviceMixLegend", DATA.serviceMix);
  renderAdminDashboardStats();
  renderRevenueStatsAndBreakdown();
  renderDashboardAppointments();

  renderAppointmentsPage();

  renderServiceFilters();
  renderServicesGrid();
  renderRegisteredMotorcycles();

  renderInvFilters();
  renderInventoryTable();

  renderInvoices();

  renderJobs();

  renderUsers();

  renderMasterEmployees();
  renderAdminNotifications();
}

document.addEventListener("DOMContentLoaded", init);

window.addEventListener("motofix:inventory-updated", () => {
  DATA.inventory = readStoredArray("motofix_parts");
  renderInvFilters();
  renderInventoryTable();
  renderAdminNotifications();
});

window.addEventListener("storage", (event) => {
  if (event.key === "motofix_notifications") renderAdminNotifications();
  if (event.key === ACCOUNT_REQUESTS_KEY) renderUsers();
  if (event.key === ACCOUNT_DIRECTORY_KEY) {
    try {
      const storedAccounts = JSON.parse(event.newValue || "[]");
      if (Array.isArray(storedAccounts)) {
        DATA.users = storedAccounts;
        renderUsers();
      }
    } catch (error) {
      console.error("Unable to refresh accounts from storage.", error);
    }
  }
  if (event.key === "motofix_users") {
    try {
      const registeredUsers = JSON.parse(event.newValue || "[]");
      const disabledEmails = JSON.parse(
        localStorage.getItem("motofix_disabled_accounts") || "[]",
      );
      if (Array.isArray(registeredUsers)) {
        registeredUsers.forEach((user) => {
          const email = String(user.email || "")
            .trim()
            .toLowerCase();
          if (
            !email ||
            disabledEmails.includes(email) ||
            DATA.users.some((account) => account.email.toLowerCase() === email)
          )
            return;
          const name =
            user.name ||
            `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
            "New user";
          DATA.users.push({
            name,
            role: (user.role || "Customer").replace(/\b\w/g, (letter) =>
              letter.toUpperCase(),
            ),
            email,
            phone: user.phone || "",
            since: user.created_at || new Date().toISOString().slice(0, 10),
            initials: avatarInitials(name),
          });
        });
        saveAccountDirectory();
      }
      renderUsers();
    } catch (error) {
      console.error(
        "Unable to refresh registered accounts from storage.",
        error,
      );
    }
  }
  if (event.key === "motofix_parts") {
    try {
      const storedParts = JSON.parse(event.newValue || "[]");
      if (Array.isArray(storedParts)) {
        DATA.inventory = storedParts;
        renderInventoryTable();
      }
    } catch (error) {
      console.error("Unable to refresh inventory from storage.", error);
    }
  }
  if (event.key === APPOINTMENT_STORAGE_KEY) {
    syncAppointmentsFromStorage();
    renderDashboardAppointments();
    renderAppointmentsPage();
    renderInvoices();
    renderJobs();
    renderBarChart("revenueChart", DATA.revenue);
    renderBarChart("revenueChart2", DATA.revenue);
    renderPieChart("serviceMixPie", "serviceMixLegend", DATA.serviceMix);
    renderAdminDashboardStats();
    renderRevenueStatsAndBreakdown();
  }
  if (["motofix_parts", "motofix_services", "motofix_users", MASTER_EMPLOYEE_STORAGE_KEY].includes(event.key)) {
    initLocalStorageData();
    renderServiceFilters();
    renderServicesGrid();
    renderInvFilters();
    renderInventoryTable();
    renderUsers();
    renderMasterEmployees();
    renderRegisteredMotorcycles();
    renderDashboardAppointments();
    renderInvoices();
    renderJobs();
    renderBarChart("revenueChart", DATA.revenue);
    renderBarChart("revenueChart2", DATA.revenue);
    renderPieChart("serviceMixPie", "serviceMixLegend", DATA.serviceMix);
    renderAdminDashboardStats();
    renderRevenueStatsAndBreakdown();
  }
});

/* =========================================================
   EDIT SERVICE FORM SUBMISSION HANDLER (Completion Fix)
========================================================= */
document.addEventListener("submit", (e) => {
  if (e.target && e.target.id === "editServiceForm") {
    e.preventDefault();

    const serviceCode = document.getElementById("editServiceCode").value;
    const serviceIndex = DATA.services.findIndex((s) => s.code === serviceCode);

    if (serviceIndex !== -1) {
      DATA.services[serviceIndex] = {
        ...DATA.services[serviceIndex],
        name: document.getElementById("editServiceName").value,
        category: document.getElementById("editServiceCategory").value,
        desc: document.getElementById("editServiceDesc").value,
        price: parseFloat(document.getElementById("editServicePrice").value),
      };

      // Save updated services list to localStorage
      localStorage.setItem("motofix_services", JSON.stringify(DATA.services));

      // Close modal and refresh UI views
      document.getElementById("modalBackdrop").classList.remove("open");
      renderServiceFilters();
      renderServicesGrid();

      if (typeof showNotification === "function") {
        showNotification(
          `Service ${serviceCode} updated successfully!`,
          "success",
        );
      }
    }
  }
});
