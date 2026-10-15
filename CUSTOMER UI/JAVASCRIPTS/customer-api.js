const API_BASE_URL = String(window.MOTOFIX_API_BASE_URL || "").replace(/\/+$/, "");
const APPOINTMENT_STORE_KEY = "motofix_appointments";
const SERVICE_STORE_KEY = "motofix_services";

export function customerApiEnabled() {
  return API_BASE_URL.length > 0;
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    cache: "no-store",
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const text = await response.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  if (!response.ok) {
    const message =
      body && typeof body === "object"
        ? body.message || body.error
        : body;
    throw new Error(message || `Request failed (${response.status}).`);
  }
  return body;
}

function unwrapList(body, key) {
  const records = Array.isArray(body)
    ? body
    : body?.[key] ?? body?.data?.[key] ?? body?.data;
  if (!Array.isArray(records)) {
    throw new Error(`The server returned an invalid ${key} response.`);
  }
  return records;
}

function readStoredArray(key) {
  try {
    const records = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(records) ? records : [];
  } catch (error) {
    console.error(`Unable to read ${key}:`, error);
    return [];
  }
}

function writeAppointments(records) {
  localStorage.setItem(APPOINTMENT_STORE_KEY, JSON.stringify(records));
  window.dispatchEvent(new Event("motofix:appointments-updated"));
}

function mergeAppointments(updates) {
  const records = readStoredArray(APPOINTMENT_STORE_KEY);
  const byId = new Map(records.map((appointment) => [String(appointment.id), appointment]));
  updates.forEach((appointment) => {
    if (appointment?.id != null) {
      byId.set(String(appointment.id), {
        ...byId.get(String(appointment.id)),
        ...appointment,
      });
    }
  });
  writeAppointments([...byId.values()]);
}

function unwrapAppointment(body, fallback) {
  const appointment = body?.appointment ?? body?.data?.appointment ?? body?.data ?? body;
  return appointment && typeof appointment === "object" && !Array.isArray(appointment)
    ? { ...fallback, ...appointment }
    : fallback;
}

function normalizedEmail() {
  return (localStorage.getItem("userEmail") || "").trim().toLowerCase();
}

function customerStorageKey(prefix) {
  const email = normalizedEmail();
  return `${prefix}:${email || "anonymous"}`;
}

export function readBookingDraft() {
  try {
    const draft = JSON.parse(localStorage.getItem(customerStorageKey("motofix_booking_draft")) || "null");
    return draft && typeof draft === "object" ? draft : null;
  } catch (error) {
    console.error("Unable to restore appointment draft:", error);
    return null;
  }
}

export function writeBookingDraft(draft) {
  localStorage.setItem(customerStorageKey("motofix_booking_draft"), JSON.stringify(draft));
}

export function readPendingParts() {
  try {
    const parts = JSON.parse(localStorage.getItem(customerStorageKey("motofix_pending_parts")) || "[]");
    return Array.isArray(parts) ? parts : [];
  } catch (error) {
    console.error("Unable to restore selected parts:", error);
    return [];
  }
}

export function writePendingParts(parts) {
  localStorage.setItem(customerStorageKey("motofix_pending_parts"), JSON.stringify(parts));
}

export function sortAppointmentsNewestFirst(appointments) {
  const timestamp = (appointment) => {
    const createdAt =
      appointment.createdAt || appointment.created_at || appointment.bookingCreatedAt;
    const value = createdAt || [appointment.date, appointment.time].filter(Boolean).join(" ");
    const parsed = Date.parse(value || "");
    return Number.isFinite(parsed) ? parsed : 0;
  };
  return [...appointments].sort((left, right) => timestamp(right) - timestamp(left));
}

export function clearBookingDraft() {
  localStorage.removeItem(customerStorageKey("motofix_booking_draft"));
  localStorage.removeItem(customerStorageKey("motofix_pending_parts"));
}

export async function fetchCustomerServices() {
  if (!customerApiEnabled()) return readStoredArray(SERVICE_STORE_KEY);
  return unwrapList(await request("/services?active=true"), "services");
}

export async function fetchCustomerAppointments() {
  if (!customerApiEnabled()) return readStoredArray(APPOINTMENT_STORE_KEY);
  const appointments = unwrapList(await request("/appointments"), "appointments");
  mergeAppointments(appointments);
  return appointments;
}

export async function createCustomerAppointment(appointment) {
  let created = appointment;
  if (customerApiEnabled()) {
    const payload = { ...appointment, transaction: { ...appointment.transaction } };
    delete payload.id;
    delete payload.transaction.id;
    const body = await request("/appointments", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const responseAppointment = body?.appointment ?? body?.data?.appointment ?? body?.data ?? body;
    if (!responseAppointment?.id) {
      throw new Error("The server did not return the created appointment ID.");
    }
    created = unwrapAppointment(body, appointment);
    created.transaction = {
      ...appointment.transaction,
      ...created.transaction,
      id: created.transaction?.id || `INV-${created.id}`,
    };
  }
  mergeAppointments([created]);
  return created;
}

function addLocalCancellationNotification(appointment) {
  let notifications = [];
  try {
    const stored = JSON.parse(localStorage.getItem("motofix_notifications") || "[]");
    notifications = Array.isArray(stored) ? stored : [];
  } catch (error) {
    console.error("Unable to read notifications:", error);
  }
  const email = normalizedEmail();
  notifications.unshift({
    id: `N${Date.now()}`,
    title: "Appointment canceled",
    message: `Customer ${email} canceled appointment ${appointment.id}.`,
    audiences: ["admin", "master_admin", `customer:${email}`],
    appointmentId: appointment.id,
    destination: "appointments",
    createdAt: new Date().toISOString(),
    readBy: [],
  });
  localStorage.setItem("motofix_notifications", JSON.stringify(notifications.slice(0, 100)));
  window.dispatchEvent(new Event("motofix:notifications-updated"));
}

function addLocalCancellationRequestNotification(appointment) {
  const notifications = readStoredArray("motofix_notifications");
  const email = normalizedEmail();
  notifications.unshift({
    id: `N${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: "Customer requested appointment cancellation",
    message: `${appointment.customer || email} requested cancellation of confirmed appointment ${appointment.id}.`,
    audiences: ["admin"],
    appointmentId: appointment.id,
    destination: "appointments",
    createdAt: appointment.cancellationRequest.requestedAt,
    readBy: [],
  });
  localStorage.setItem("motofix_notifications", JSON.stringify(notifications.slice(0, 100)));
  window.dispatchEvent(new Event("motofix:notifications-updated"));
}

export async function requestCustomerAppointmentCancellation(appointmentId, reason) {
  const email = normalizedEmail();
  if (!email) throw new Error("Sign in to request appointment cancellation.");
  const cancellationReason = String(reason || "").trim();
  if (!cancellationReason) throw new Error("Enter a reason for requesting cancellation.");
  if (cancellationReason.length > 1000) {
    throw new Error("The cancellation reason must be 1,000 characters or fewer.");
  }
  const appointment = readStoredArray(APPOINTMENT_STORE_KEY).find(
    (record) =>
      String(record.id) === String(appointmentId) &&
      String(record.customerEmail || "").trim().toLowerCase() === email,
  );
  if (!appointment) throw new Error("This appointment could not be found in your account.");
  if (String(appointment.status || "").trim().toLowerCase() !== "confirmed") {
    throw new Error("Only confirmed appointments can be submitted for cancellation review.");
  }
  if (String(appointment.cancellationRequest?.status || "").toLowerCase() === "pending") {
    throw new Error("Your cancellation request is already awaiting Admin review.");
  }

  const requestedAt = new Date().toISOString();
  let updated = {
    ...appointment,
    cancellationRequest: {
      status: "Pending",
      requestedByRole: "customer",
      requestedByEmail: email,
      requestedAt,
      reason: cancellationReason,
    },
  };
  if (customerApiEnabled()) {
    const body = await request(
      `/appointments/${encodeURIComponent(appointment.id)}/cancellation-request`,
      {
        method: "POST",
        body: JSON.stringify({ reason: cancellationReason }),
      },
    );
    updated = unwrapAppointment(body, updated);
    if (String(updated.cancellationRequest?.status || "").toLowerCase() !== "pending") {
      throw new Error("The server did not confirm the cancellation request.");
    }
    updated.cancellationRequest = {
      ...updated.cancellationRequest,
      reason: updated.cancellationRequest.reason || cancellationReason,
    };
  } else {
    addLocalCancellationRequestNotification(updated);
  }
  mergeAppointments([updated]);
  return updated;
}

export async function cancelCustomerAppointment(appointmentId) {
  const email = normalizedEmail();
  if (!email) throw new Error("Sign in to cancel an appointment.");
  const appointment = readStoredArray(APPOINTMENT_STORE_KEY).find(
    (record) =>
      String(record.id) === String(appointmentId) &&
      String(record.customerEmail || "").trim().toLowerCase() === email,
  );
  if (!appointment) throw new Error("This appointment could not be found in your account.");
  if (String(appointment.status || "").trim().toLowerCase() !== "pending") {
    throw new Error("Only pending appointments can be canceled.");
  }

  const canceledAt = new Date().toISOString();
  let updated = {
    ...appointment,
    status: "Canceled",
    canceledByRole: "customer",
    canceledByEmail: email,
    canceledAt,
  };
  if (customerApiEnabled()) {
    const body = await request(`/appointments/${encodeURIComponent(appointment.id)}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "Canceled" }),
    });
    updated = unwrapAppointment(body, updated);
    if (updated.status !== "Canceled") {
      throw new Error("The server did not confirm the appointment cancellation.");
    }
  } else {
    addLocalCancellationNotification(updated);
  }
  updated.status = "Canceled";
  updated.canceledByRole = "customer";
  updated.canceledByEmail = email;
  updated.canceledAt = updated.canceledAt || canceledAt;
  updated.total = "₱0.00";
  updated.transaction = {
    ...(updated.transaction && typeof updated.transaction === "object" ? updated.transaction : {}),
    status: "Canceled",
    total: "₱0.00",
  };
  mergeAppointments([updated]);
  return updated;
}
