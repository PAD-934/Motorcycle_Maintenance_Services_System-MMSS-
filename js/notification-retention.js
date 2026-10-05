(() => {
  // All four dashboards share one notification collection; retention applies to the
  // shared records regardless of audience or the dashboard that created them.
  const STORAGE_KEY = "motofix_notifications";
  const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

  function getNotificationTimestamp(notification) {
    const createdAt = Date.parse(notification.createdAt || "");
    if (Number.isFinite(createdAt)) return createdAt;

    const idTimestamp = String(notification.id || "").match(/^N(\d{13})(?:-|$)/);
    return idTimestamp ? Number(idTimestamp[1]) : null;
  }

  function pruneExpiredNotifications() {
    let notifications;
    try {
      notifications = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch (error) {
      console.error("Unable to read notifications for expiration cleanup:", error);
      return;
    }
    if (!Array.isArray(notifications)) {
      console.error("Unable to expire notifications: stored notification data is not an array.");
      return;
    }

    const cutoff = Date.now() - RETENTION_MS;
    const currentNotifications = notifications.filter((notification) => {
      const timestamp = getNotificationTimestamp(notification);
      return timestamp === null || timestamp > cutoff;
    });
    if (currentNotifications.length === notifications.length) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentNotifications));
    } catch (error) {
      console.error("Unable to remove expired notifications:", error);
    }
  }

  window.pruneExpiredNotifications = pruneExpiredNotifications;
  pruneExpiredNotifications();
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) pruneExpiredNotifications();
  });
  window.addEventListener("motofix:notifications-updated", pruneExpiredNotifications);
  window.setInterval(pruneExpiredNotifications, 60 * 60 * 1000);
})();
