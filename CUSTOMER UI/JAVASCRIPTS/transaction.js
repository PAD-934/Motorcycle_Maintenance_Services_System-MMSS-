import {
    cancelCustomerAppointment,
    requestCustomerAppointmentCancellation,
    sortAppointmentsNewestFirst,
} from "./customer-api.js";
import { collectCancellationReason } from "./cancellation-request-dialog.js";

export function initTransactions() {
    // Invoice projection from appointments and ID relationship: ../../BACKEND_DATA_CONTRACT.md
    const transactionsTableBody = document.getElementById("transactions-table-body");
    const invoiceCountLabel = document.getElementById("invoice-count-label");
    const filterTabs = document.querySelectorAll(".filter-tab");
    const APPOINTMENT_STORE_KEY = "motofix_appointments";
    const currentEmail = (localStorage.getItem("userEmail") || "").trim().toLowerCase();
    // Customer invoices are derived from shared appointment records and matched by
    // customerEmail; the appointment ID is the stable invoice/detail navigation key.
    const defaultNames = {
        "jose@email.com": "Jose Bautista",
        "miguel@email.com": "Miguel Torres",
        "ana@email.com": "Ana Flores",
    };
    let registeredUser = null;
    let savedName = "";
    try {
        const users = JSON.parse(localStorage.getItem("motofix_users") || "[]");
        registeredUser = Array.isArray(users)
            ? users.find((user) => user.email?.trim().toLowerCase() === currentEmail)
            : null;
        savedName = JSON.parse(localStorage.getItem("motofix_profiles") || "{}")[currentEmail]?.name || "";
    } catch (error) {
        console.error("Unable to load customer identity for transactions:", error);
    }
    const customerName =
        savedName ||
        registeredUser?.name ||
        localStorage.getItem("userFullName") ||
        defaultNames[currentEmail] ||
        "Customer";
    const canMatchLegacyName = customerName.trim().toLowerCase() !== "customer";
    const escapeHtml = (value) => String(value ?? "").replace(/[&<>\"']/g, (char) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[char]);
    const canonicalStatus = (value) => {
        const status = String(value || "Pending").trim();
        const aliases = {
            "complete transaction": "Completed",
            completed: "Completed",
            "work finished (unpaid)": "Unpaid",
            "work finished": "Work Finished",
            pending: "Pending",
            cancelled: "Canceled",
            canceled: "Canceled",
            confirmed: "Confirmed",
            "in progress": "In Progress",
            unpaid: "Unpaid",
        };
        return aliases[status.toLowerCase()] || status;
    };
    const statusClass = (status) => canonicalStatus(status).toLowerCase().replace(/\s+/g, "-");
    const isCurrentCustomerAppointment = (appointment) =>
        Boolean(currentEmail) &&
        String(appointment.customerEmail || "").trim().toLowerCase() === currentEmail;

    async function cancelAppointment(appointmentId) {
        const appointment = readCustomerAppointments().find(
            (record) => String(record.id) === String(appointmentId),
        );
        const isConfirmed = canonicalStatus(appointment?.status) === "Confirmed";
        const reason = isConfirmed
            ? await collectCancellationReason(appointment, escapeHtml)
            : null;
        if (isConfirmed && reason === null) return;
        if (!isConfirmed && !window.confirm("Cancel this pending appointment?")) return;
        try {
            if (isConfirmed) {
                await requestCustomerAppointmentCancellation(appointmentId, reason);
            } else {
                await cancelCustomerAppointment(appointmentId);
            }
            loadTransactions(document.querySelector(".filter-tab.active")?.dataset.filter || "all");
            const updated = readCustomerAppointments().find(
                (appointment) => String(appointment.id) === String(appointmentId),
            );
            if (updated) showInvoiceDetails(updated);
        } catch (error) {
            window.alert(error.message || "Unable to cancel this appointment.");
        }
    }

    function readAppointments() {
        try {
            const appointments = JSON.parse(localStorage.getItem(APPOINTMENT_STORE_KEY) || "[]");
            return Array.isArray(appointments) ? appointments : [];
        } catch {
            return [];
        }
    }

    function readCustomerAppointments() {
        return readAppointments().filter((appointment) =>
            (appointment.customerEmail || "").trim().toLowerCase() === currentEmail ||
            (!appointment.customerEmail &&
                canMatchLegacyName &&
                appointment.customer === customerName),
        );
    }

    function showInvoiceDetails(appointment) {
        let overlay = document.getElementById("invoice-details-overlay");
        if (!overlay) {
            overlay = document.createElement("div");
            overlay.id = "invoice-details-overlay";
            overlay.className = "invoice-details-overlay";
            document.body.appendChild(overlay);
            overlay.addEventListener("click", (event) => {
                if (event.target === overlay || event.target.closest("[data-close-invoice-details]")) {
                    overlay.classList.remove("is-open");
                }
            });
        }

        const services = Array.isArray(appointment.services)
            ? appointment.services
            : [appointment.services || "Service"];
        const parts = Array.isArray(appointment.parts) ? appointment.parts : [];
        const status = canonicalStatus(appointment.status);
        const cancellationRequestPending =
            String(appointment.cancellationRequest?.status || "").toLowerCase() === "pending";
        const canceledByCustomer =
            status === "Canceled" && appointment.canceledByRole === "customer";
        const invoiceId = appointment.transaction?.id || `INV-${appointment.id}`;
        const total = appointment.transaction?.total || appointment.total || "₱0.00";

        overlay.innerHTML = `
            <section class="invoice-details-dialog" role="dialog" aria-modal="true" aria-labelledby="invoice-details-title">
                <header class="invoice-details-header">
                    <div><p>Transaction details</p><h2 id="invoice-details-title">${escapeHtml(invoiceId)}</h2></div>
                    <button type="button" class="invoice-details-close" data-close-invoice-details aria-label="Close invoice details">✕</button>
                </header>
                <dl class="invoice-details-grid">
                    <div><dt>Customer</dt><dd>${escapeHtml(appointment.customer || "Customer")}</dd></div>
                    <div><dt>Motorcycle</dt><dd>${escapeHtml(appointment.bike || "Unknown Motorcycle")}</dd></div>
                    <div><dt>Date and time</dt><dd>${escapeHtml(`${appointment.date || "N/A"} ${appointment.time || ""}`.trim())}</dd></div>
                    <div><dt>Mechanic</dt><dd>${escapeHtml(appointment.mechanic || "Unassigned")}</dd></div>
                    <div><dt>Status</dt><dd><span class="status-badge status-${statusClass(status)}">${escapeHtml(status)}</span></dd></div>
                    ${canceledByCustomer ? `<div><dt>Cancellation</dt><dd>Canceled by customer${appointment.canceledByEmail ? ` (${escapeHtml(appointment.canceledByEmail)})` : ""}</dd></div>` : ""}
                    ${cancellationRequestPending ? "<div><dt>Cancellation request</dt><dd>Awaiting Admin review</dd></div>" : ""}
                    ${cancellationRequestPending && appointment.cancellationRequest?.reason ? `<div><dt>Requested cancellation reason</dt><dd>${escapeHtml(appointment.cancellationRequest.reason)}</dd></div>` : ""}
                    <div><dt>Total</dt><dd class="invoice-details-total">${escapeHtml(total)}</dd></div>
                </dl>
                <div class="invoice-details-section invoice-services-section"><h3>Services</h3><ul>${services.map((service) => `<li>${escapeHtml(service)}</li>`).join("")}</ul></div>
                <div class="invoice-details-section invoice-parts-section"><h3>Parts</h3>${parts.length
                    ? `<ul>${parts.map((part) => `<li>${escapeHtml(part.name || "Part")} × ${escapeHtml(part.quantity || 1)} <span>${escapeHtml(part.source === "client" ? "Customer supplied" : "Shop part")}</span></li>`).join("")}</ul>`
                    : "<p class=\"invoice-details-empty\">No parts on this invoice.</p>"}</div>
                ${appointment.notes ? `<div class="invoice-details-section invoice-notes-section"><h3>Notes</h3><p>${escapeHtml(appointment.notes)}</p></div>` : ""}
                ${isCurrentCustomerAppointment(appointment) && !cancellationRequestPending && ["Pending", "Confirmed"].includes(status)
                    ? `<button type="button" class="sc-submit-btn sc-danger-btn" data-cancel-appointment="${escapeHtml(appointment.id)}">${status === "Confirmed" ? "Request Cancellation" : "Cancel Appointment"}</button>`
                    : ""}
            </section>
        `;
        overlay.classList.add("is-open");
        overlay.querySelector("[data-close-invoice-details]")?.focus();
        overlay.querySelector("[data-cancel-appointment]")?.addEventListener("click", (event) => {
            const button = event.currentTarget;
            button.disabled = true;
            cancelAppointment(button.dataset.cancelAppointment).finally(() => {
                if (button.isConnected) button.disabled = false;
            });
        });
    }

    function loadTransactions(filter = "all") {
        if (!transactionsTableBody) return;

        const appointments = readCustomerAppointments();
        const filtered = sortAppointmentsNewestFirst(appointments.filter((appointment) =>
            filter === "all" || canonicalStatus(appointment.status).toLowerCase() === filter.toLowerCase(),
        ));

        if (invoiceCountLabel) {
            invoiceCountLabel.textContent = `${filtered.length} invoice${filtered.length === 1 ? "" : "s"} total`;
        }

        if (!filtered.length) {
            transactionsTableBody.innerHTML = `
                <tr><td colspan="7"><div class="transactions-empty"><p>No transaction history found matching this filter.</p></div></td></tr>
            `;
            return;
        }

        transactionsTableBody.innerHTML = filtered.map((appointment) => {
            const services = Array.isArray(appointment.services)
                ? appointment.services.join(", ")
                : appointment.services || "Service";
            const parts = Array.isArray(appointment.parts) && appointment.parts.length
                ? appointment.parts.map((part) => `${part.name || "Part"} (x${part.quantity || 1})`).join(", ")
                : "None";
            const status = canonicalStatus(appointment.status);
            const cancellationRequestPending =
                String(appointment.cancellationRequest?.status || "").toLowerCase() === "pending";
            const invoiceId = appointment.transaction?.id || `INV-${appointment.id}`;
            const total = appointment.transaction?.total || appointment.total || "₱0.00";
            return `
                <tr data-appointment-id="${escapeHtml(appointment.id)}" class="invoice-row">
                    <td><button type="button" class="invoice-details-trigger" data-invoice-appointment="${escapeHtml(appointment.id)}">${escapeHtml(invoiceId)}</button></td>
                    <td>${escapeHtml(services)}</td>
                    <td>${escapeHtml(appointment.mechanic || "Unassigned")}</td>
                    <td><div>${escapeHtml(parts)}</div><small style="color:#94a3b8">Brought own: ${appointment.parts?.some((part) => part.source === "client") ? "Yes" : "No"}</small></td>
                    <td><strong>${escapeHtml(total)}</strong></td>
                    <td><span class="status-badge status-${statusClass(status)}">${escapeHtml(status)}</span>
                        ${isCurrentCustomerAppointment(appointment) && !cancellationRequestPending && ["Pending", "Confirmed"].includes(status)
                            ? `<button type="button" class="sc-secondary-btn sc-danger-btn" data-cancel-appointment="${escapeHtml(appointment.id)}">${status === "Confirmed" ? "Request Cancellation" : "Cancel"}</button>`
                            : cancellationRequestPending ? '<small>Cancellation request pending</small>' : ""}
                    </td>
                    <td>${escapeHtml(appointment.date || "N/A")}</td>
                </tr>
            `;
        }).join("");
    }

    filterTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            filterTabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            loadTransactions(tab.getAttribute("data-filter"));
        });
    });

    transactionsTableBody?.addEventListener("click", (event) => {
        const cancelButton = event.target.closest("[data-cancel-appointment]");
        if (cancelButton) {
            event.stopPropagation();
            cancelButton.disabled = true;
            cancelAppointment(cancelButton.dataset.cancelAppointment).finally(() => {
                if (cancelButton.isConnected) cancelButton.disabled = false;
            });
            return;
        }
        const row = event.target.closest("tr[data-appointment-id]");
        if (!row) return;
        const appointment = readCustomerAppointments().find(
            (item) => item.id === row.dataset.appointmentId,
        );
        if (appointment) showInvoiceDetails(appointment);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            document.getElementById("invoice-details-overlay")?.classList.remove("is-open");
        }
    });

    window.addEventListener("storage", (event) => {
        if (event.key === APPOINTMENT_STORE_KEY) {
            loadTransactions(document.querySelector(".filter-tab.active")?.dataset.filter || "all");
        }
    });
    window.addEventListener("motofix:appointments-updated", () => {
        loadTransactions(document.querySelector(".filter-tab.active")?.dataset.filter || "all");
    });

    // Notification navigation sends the appointment ID so this view opens the exact invoice.
    window.addEventListener("motofix:open-customer-transaction", (event) => {
        const appointmentId = String(event.detail?.appointmentId || "");
        if (!appointmentId) return;
        const allTab = document.querySelector('.filter-tab[data-filter="all"]');
        filterTabs.forEach((tab) => tab.classList.remove("active"));
        allTab?.classList.add("active");
        loadTransactions("all");
        const appointment = readCustomerAppointments().find(
            (item) => String(item.id) === appointmentId,
        );
        if (!appointment) return;
        const row = [...(transactionsTableBody?.querySelectorAll("tr[data-appointment-id]") || [])]
            .find((item) => item.dataset.appointmentId === appointmentId);
        row?.scrollIntoView({ behavior: "smooth", block: "center" });
        showInvoiceDetails(appointment);
    });

    // Expose global refresh so navigation or other scripts can trigger it easily
    window.refreshTransactions = loadTransactions;
    loadTransactions();
}