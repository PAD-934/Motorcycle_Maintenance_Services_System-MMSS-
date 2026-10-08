const API_BASE_URL = new URL("../backend/public/api/v1/", import.meta.url);

export class ApiError extends Error {
  constructor(message, status, payload = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export async function apiRequest(path, options = {}) {
  const normalizedPath = String(path).replace(/^\/+/, "");
  const url = new URL(normalizedPath, API_BASE_URL);
  const headers = new Headers(options.headers || {});
  headers.set("Accept", "application/json");

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "same-origin",
    body:
      options.body === undefined
        ? undefined
        : typeof options.body === "string"
          ? options.body
          : JSON.stringify(options.body),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      payload?.message || payload?.error || "The API request failed.";
    throw new ApiError(message, response.status, payload);
  }
  return payload;
}

export const api = {
  health: () => apiRequest("health.php"),
  login: (credentials) =>
    apiRequest("auth/login.php", { method: "POST", body: credentials }),
  logout: () => apiRequest("auth/logout.php", { method: "POST" }),
  currentUser: () => apiRequest("auth/me.php"),
  services: () => apiRequest("services.php"),
  parts: () => apiRequest("parts.php"),
  appointments: () => apiRequest("appointments.php"),
  createAppointment: (appointment) =>
    apiRequest("appointments.php", { method: "POST", body: appointment }),
  notifications: () => apiRequest("notifications.php"),
};
