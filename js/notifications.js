(function () {
  const STORAGE_KEY = "motofix_notifications";
  const instances = new Map();

  function readNotifications() {
    try {
      const notifications = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]",
      );
      return Array.isArray(notifications) ? notifications : [];
    } catch (error) {
      console.error("Unable to read MotoFix notifications.", error);
      return [];
    }
  }

  function readAppointments() {
    try {
      const appointments = JSON.parse(
        localStorage.getItem("motofix_appointments") || "[]",
      );
      return Array.isArray(appointments) ? appointments : [];
    } catch {
      return [];
    }
  }

  function escapeText(value) {
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

  function audienceFor(instance, notification) {
    const audiences = Array.isArray(notification.audiences)
      ? notification.audiences
      : [];
    if (instance.role === "master_admin") return audiences.length > 0;
    if (instance.role === "admin") {
      return (
        audiences.includes("admin") ||
        audiences.includes(`admin:${instance.email}`)
      );
    }

    if (instance.role === "mechanic") {
      return (
        audiences.includes("mechanic") ||
        audiences.includes(`mechanic:${instance.name}`) ||
        (notification.mechanicEmail || "").toLowerCase() === instance.email
      );
    }

    if (instance.role === "customer") {
      if (!audiences.includes("customer") || !instance.email) return false;
      let customerEmail = (notification.customerEmail || "").toLowerCase();
      if (!customerEmail && notification.appointmentId) {
        const appointment = readAppointments().find(
          (item) => String(item.id) === String(notification.appointmentId),
        );
        customerEmail = (appointment?.customerEmail || "").toLowerCase();
      }
      return customerEmail === instance.email;
    }

    return false;
  }

  function iconFor(notification) {
    const text =
      `${notification.title || ""} ${notification.message || ""}`.toLowerCase();
    if (text.includes("appointment") || text.includes("assigned")) {
      return { icon: "▦", type: "appointment" };
    }
    if (text.includes("account") || text.includes("employee")) {
      return { icon: "♙", type: "account" };
    }
    if (
      text.includes("part") ||
      text.includes("inventory") ||
      text.includes("stock")
    ) {
      return { icon: "▣", type: "inventory" };
    }
    return { icon: "•", type: "general" };
  }

  function formatTime(value) {
    const timestamp = new Date(value).getTime();
    if (!Number.isFinite(timestamp)) return "Recently";
    const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return days < 7 ? `${days}d ago` : new Date(timestamp).toLocaleDateString();
  }

  function dateGroup(value) {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return "Earlier";
    const today = new Date();
    const dayNumber = (item) =>
      Date.UTC(item.getFullYear(), item.getMonth(), item.getDate()) / 86400000;
    const daysAgo = dayNumber(today) - dayNumber(date);
    if (daysAgo <= 0) return "Today";
    if (daysAgo === 1) return "Yesterday";
    return "Earlier";
  }

  function getInstanceNotifications(instance) {
    return readNotifications().filter((notification) =>
      audienceFor(instance, notification),
    );
  }

  function hasBeenReadBy(instance, notification) {
    if (!Array.isArray(notification.readBy)) return false;
    const identity = instance.email || instance.role;
    return (
      notification.readBy.includes(identity) ||
      Boolean(
        instance.email &&
          notification.readBy.includes(`${instance.role}:${instance.email}`),
      )
    );
  }

  function render(instance) {
    const button = document.getElementById(instance.buttonId);
    if (!button) return;

    let panel = document.getElementById(instance.panelId);
    if (!panel) {
      panel = document.createElement("section");
      panel.id = instance.panelId;
      panel.className = "motofix-notifications-panel";
      panel.setAttribute("role", "dialog");
      panel.setAttribute("aria-label", "Notifications");
      panel.hidden = true;
      document.body.appendChild(panel);

      panel.addEventListener("click", (event) => {
        const action = event.target.closest("[data-notification-action]");
        if (!action) return;
        event.stopPropagation();
        const current = instances.get(instance.panelId);
        if (!current) return;

        const notifications = readNotifications();
        const visible = notifications.filter((notification) =>
          audienceFor(current, notification),
        );
        const identity = current.email || current.role;
        const actionType = action.dataset.notificationAction;

        if (actionType === "close") {
          panel.hidden = true;
          button.setAttribute("aria-expanded", "false");
          button.focus();
        } else if (actionType === "filter") {
          panel.dataset.filter = action.dataset.filter;
          render(current);
        } else if (actionType === "toggle-header-menu") {
          panel.dataset.headerMenu =
            panel.dataset.headerMenu === "open" ? "" : "open";
          render(current);
        } else if (actionType === "mark-all-read") {
          visible.forEach((notification) => {
            notification.readBy = Array.isArray(notification.readBy)
              ? notification.readBy
              : [];
            if (!notification.readBy.includes(identity))
              notification.readBy.push(identity);
          });
          localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
          panel.dataset.headerMenu = "";
          refreshAll();
        } else if (actionType === "toggle-menu") {
          panel.dataset.openMenu =
            panel.dataset.openMenu === action.dataset.notificationId
              ? ""
              : action.dataset.notificationId;
          render(current);
        } else if (actionType === "toggle-read") {
          const notification = notifications.find(
            (item) => item.id === action.dataset.notificationId,
          );
          if (!notification || !audienceFor(current, notification)) return;
          notification.readBy = Array.isArray(notification.readBy)
            ? notification.readBy
            : [];
          notification.readBy = hasBeenReadBy(current, notification)
            ? notification.readBy.filter(
                (reader) =>
                  reader !== identity &&
                  reader !== `${current.role}:${current.email}`,
              )
            : [...notification.readBy, identity];
          localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
          panel.dataset.openMenu = "";
          refreshAll();
        } else if (actionType === "open-notification") {
          const notification = notifications.find(
            (item) => item.id === action.dataset.notificationId,
          );
          if (!notification || !audienceFor(current, notification)) return;
          notification.readBy = Array.isArray(notification.readBy)
            ? notification.readBy
            : [];
          if (!notification.readBy.includes(identity))
            notification.readBy.push(identity);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
          panel.hidden = true;
          button.setAttribute("aria-expanded", "false");
          refreshAll();
          current.onOpen?.(notification);
        } else if (actionType === "review-requests") {
          panel.hidden = true;
          button.setAttribute("aria-expanded", "false");
          current.onReviewRequests?.();
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
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        panel.hidden = !panel.hidden;
        button.setAttribute("aria-expanded", String(!panel.hidden));
      });
    }

    const notifications = getInstanceNotifications(instance);
    const identity = instance.email || instance.role;
    const isRead = (notification) => hasBeenReadBy(instance, notification);
    const unreadCount = notifications.filter(
      (notification) => !isRead(notification),
    ).length;
    const filter = panel.dataset.filter || "all";
    const visible = notifications.filter(
      (notification) => filter !== "unread" || !isRead(notification),
    );
    const notificationGroups = ["Today", "Yesterday", "Earlier"]
      .map((label) => ({
        label,
        notifications: visible.filter(
          (notification) => dateGroup(notification.createdAt) === label,
        ),
      }))
      .filter((group) => group.notifications.length > 0);
    const pendingRequests =
      instance.role === "master_admin"
        ? JSON.parse(
            localStorage.getItem("motofix_account_requests") || "[]",
          ).filter((request) => request.status === "Pending").length
        : 0;
    const headerMenuOpen = panel.dataset.headerMenu === "open";
    const subtitle =
      {
        master_admin: "Complete system activity and approvals",
        admin: "Shop activity and customer requests",
        mechanic: "Appointments assigned to you",
        customer: "Updates about your service requests",
      }[instance.role] || "MotoFix activity";

    function renderNotification(notification) {
      const icon = iconFor(notification);
      const read = isRead(notification);
      const menuOpen = panel.dataset.openMenu === notification.id;
      return `<article class="motofix-notification-row ${read ? "is-read" : "is-unread"}">
        <button type="button" class="motofix-notification-open" data-notification-action="open-notification" data-notification-id="${escapeText(notification.id)}" aria-label="Open ${escapeText(notification.title || "notification")}">
          <span class="motofix-notification-type ${icon.type}" aria-hidden="true">${icon.icon}</span>
          <span class="motofix-notification-copy">
            <span class="motofix-notification-title"><strong>${escapeText(notification.title || "Notification")}</strong>${read ? "" : '<i aria-label="Unread"></i>'}</span>
            <span class="motofix-notification-message">${escapeText(notification.message || "There is a new update.")}</span>
            <time>${escapeText(formatTime(notification.createdAt))}</time>
          </span>
        </button>
        <span class="motofix-notification-more-wrap">
          <button type="button" class="motofix-notification-more" data-notification-action="toggle-menu" data-notification-id="${escapeText(notification.id)}" aria-label="More options for notification" aria-expanded="${menuOpen}">⋯</button>
          ${menuOpen ? `<span class="motofix-notification-item-menu"><button type="button" data-notification-action="toggle-read" data-notification-id="${escapeText(notification.id)}">${read ? "Mark as unread" : "Mark as read"}</button></span>` : ""}
        </span>
      </article>`;
    }

    panel.innerHTML = `
      <header class="motofix-notifications-header">
        <div class="motofix-notifications-heading">
          <span class="motofix-notifications-bell" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M10 21h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
          <div><h2>Notifications</h2><p>${subtitle}</p></div>
        </div>
        <div class="motofix-notifications-tools">
          <div class="motofix-notifications-menu-wrap">
            <button type="button" class="motofix-notification-action" data-notification-action="toggle-header-menu" aria-label="More notification actions" aria-expanded="${headerMenuOpen}">⋯</button>
            ${
              headerMenuOpen
                ? `<div class="motofix-notifications-menu" role="menu">
              <button type="button" role="menuitem" data-notification-action="mark-all-read" ${unreadCount ? "" : "disabled"}>Mark all as read</button>
              ${pendingRequests ? `<button type="button" role="menuitem" data-notification-action="review-requests">Review ${pendingRequests} account request${pendingRequests === 1 ? "" : "s"}</button>` : ""}
            </div>`
                : ""
            }
          </div>
          <button type="button" class="motofix-notification-action" data-notification-action="close" aria-label="Close notifications">×</button>
        </div>
      </header>
      <div class="motofix-notifications-tabs" role="group" aria-label="Notification filter">
        <button type="button" data-notification-action="filter" data-filter="all" aria-pressed="${filter === "all"}" class="${filter === "all" ? "active" : ""}">All <span>${notifications.length}</span></button>
        <button type="button" data-notification-action="filter" data-filter="unread" aria-pressed="${filter === "unread"}" class="${filter === "unread" ? "active" : ""}">Unread <span>${unreadCount}</span></button>
      </div>
      <div class="motofix-notifications-content">
        ${
          visible.length
            ? notificationGroups
                .map(
                  (group) => `
                  <section class="motofix-notification-group" aria-label="${group.label}">
                    <h3>${group.label}</h3>
                    <div class="motofix-notifications-list">${group.notifications.map(renderNotification).join("")}</div>
                  </section>`,
                )
                .join("")
            : `<div class="motofix-notifications-empty"><span aria-hidden="true">✓</span><strong>${filter === "unread" ? "You’re all caught up" : "No notifications yet"}</strong><p>${filter === "unread" ? "New unread activity will appear here." : "System updates will appear here when there is activity."}</p></div>`
        }
      </div>`;

    let dot = button.querySelector(".motofix-notification-dot");
    if (!dot) {
      dot = document.createElement("span");
      dot.className = "motofix-notification-dot";
      dot.setAttribute("aria-hidden", "true");
      button.appendChild(dot);
    }
    dot.textContent = unreadCount > 99 ? "99+" : String(unreadCount);
    button.classList.add("motofix-notification-trigger");
    button.setAttribute(
      "aria-label",
      unreadCount
        ? `Notifications, ${unreadCount} unread`
        : "Notifications, no unread notifications",
    );
    button.setAttribute("aria-haspopup", "dialog");
    button.setAttribute("aria-controls", instance.panelId);
    button.setAttribute("aria-expanded", String(!panel.hidden));
    dot.hidden = unreadCount === 0;
  }

  function refreshAll() {
    instances.forEach(render);
  }

  function init(options) {
    const role = options.role || localStorage.getItem("userRole") || "customer";
    const instance = {
      ...options,
      role,
      email: (
        options.email ||
        localStorage.getItem("userEmail") ||
        ""
      ).toLowerCase(),
      name: options.name || localStorage.getItem("userFullName") || "",
      buttonId: options.buttonId,
      panelId: options.panelId || "motofixNotificationsPanel",
    };
    instances.set(instance.panelId, instance);
    render(instance);
  }

  window.MotoFixNotifications = { init, refresh: refreshAll };
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY || event.key === "motofix_appointments")
      refreshAll();
  });
  window.addEventListener("motofix:notifications-changed", refreshAll);
})();
