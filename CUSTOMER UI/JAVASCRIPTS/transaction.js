export function initTransactions() {
    const transactionsTableBody = document.getElementById("transactions-table-body");
    const invoiceCountLabel = document.getElementById("invoice-count-label");
    const filterTabs = document.querySelectorAll(".filter-tab");
    const NOTIFICATION_STORE_KEY = "motofix_notifications";

    function escapeHtml(value) {
        return String(value ?? "").replace(/[&<>'"]/g, (c) => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
        })[c]);
    }

    function readNotifications() {
        try {
            const value = JSON.parse(localStorage.getItem(NOTIFICATION_STORE_KEY) || "[]");
            return Array.isArray(value) ? value : [];
        } catch {
            return [];
        }
    }

    function addTransactionNotification(transaction) {
        if (!transaction || String(transaction.status).toLowerCase() !== "completed") return;

        const notifications = readNotifications();
        const exists = notifications.some(
            (n) => n.type === "transaction_receipt" && n.transactionId === transaction.id
        );
        if (exists) return;

        const email = (localStorage.getItem("userEmail") || "").trim().toLowerCase();
        notifications.unshift({
            id: `N${Date.now()}_${transaction.id}`,
            type: "transaction_receipt",
            transactionId: transaction.id,
            customerEmail: email,
            title: "Transaction completed",
            message: `Receipt ${transaction.id} is ready to view.`,
            audiences: ["customer"],
            createdAt: new Date().toISOString(),
            readBy: [],
            action: "view_receipt"
        });
        localStorage.setItem(
            NOTIFICATION_STORE_KEY,
            JSON.stringify(notifications.slice(0, 100))
        );
        window.dispatchEvent(new CustomEvent("motofix-notifications-updated"));
    }

    function ensureReceiptModal() {
        let modal = document.getElementById("customerReceiptModal");
        if (modal) return modal;

        modal = document.createElement("div");
        modal.id = "customerReceiptModal";
        modal.className = "receipt-modal-overlay";
        modal.setAttribute("aria-hidden", "true");
        modal.innerHTML = `
            <div class="receipt-modal-card" role="dialog" aria-modal="true" aria-labelledby="receipt-modal-title">
                <div class="receipt-modal-header">
                    <div>
                        <span class="receipt-modal-kicker">CUSTOMER TRANSACTION SUMMARY</span>
                        <h2 id="receipt-modal-title">All Invoice Details</h2>
                    </div>
                    <button type="button" class="receipt-modal-close" id="closeReceiptModal" aria-label="Close receipt">×</button>
                </div>
                <div class="receipt-modal-body" id="receiptModalBody"></div>
                <div class="receipt-modal-footer">
                    <span class="receipt-viewed-note" id="receiptViewedNote">Transaction marked as viewed.</span>
                    <button type="button" class="sc-secondary-btn" id="receiptModalDone">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const close = () => {
            modal.classList.remove("show");
            modal.setAttribute("aria-hidden", "true");
            document.body.classList.remove("receipt-modal-open");
        };
        document.getElementById("closeReceiptModal")?.addEventListener("click", close);
        document.getElementById("receiptModalDone")?.addEventListener("click", close);
        modal.addEventListener("click", (event) => {
            if (event.target === modal) close();
        });
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && modal.classList.contains("show")) close();
        });
        return modal;
    }

    function markTransactionAsViewed(transaction) {
        if (!transaction?.id) return;

        const viewedAt = new Date().toISOString();
        let changed = false;

        const updateStoredTransactions = (key, idPrefix = "") => {
            let items;
            try {
                items = JSON.parse(localStorage.getItem(key) || "[]");
            } catch {
                items = [];
            }
            if (!Array.isArray(items)) return;

            let keyChanged = false;
            const updated = items.map(item => {
                const itemId = idPrefix ? `${idPrefix}${item.id}` : item.id;
                if (String(itemId) !== String(transaction.id)) return item;
                keyChanged = true;
                changed = true;
                return { ...item, viewed: true, viewedAt, viewStatus: "Viewed" };
            });

            if (keyChanged) localStorage.setItem(key, JSON.stringify(updated));
        };

        // Keep the existing invoice status (PENDING/CONFIRMED/etc.).
        // "viewed" is a separate state so opening the receipt never changes
        // the service workflow status.
        updateStoredTransactions("userTransactions");
        updateStoredTransactions("motofix_appointments", "INV-");

        if (changed) {
            window.dispatchEvent(new CustomEvent("motofix-transactions-updated", {
                detail: { transactionId: transaction.id, viewedAt }
            }));
        }

        transaction.viewed = true;
        transaction.viewedAt = viewedAt;
        transaction.viewStatus = "Viewed";
    }

    function formatCurrency(value) {
        const amount = Number(value || 0);
        return Number.isFinite(amount)
            ? `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
            : "₱0.00";
    }

    function renderReceiptTransaction(transaction, index) {
        const status = String(transaction.status || "pending").toLowerCase();
        const additionalParts = Number(transaction.additionalPartsPrice || 0);
        const additionalLabor = Number(transaction.additionalLaborPayment || 0);
        const customerParts = String(transaction.broughtOwnParts || "No");

        return `
            <article class="receipt-transaction-card">
                <div class="receipt-transaction-heading">
                    <div class="receipt-transaction-title">
                        <span class="receipt-transaction-index">INVOICE ${index + 1}</span>
                        <strong>${escapeHtml(transaction.id)}</strong>
                    </div>
                    <span class="receipt-status ${escapeHtml(status)}">${escapeHtml(status.toUpperCase())}</span>
                </div>

                <div class="receipt-checklist-grid">
                    <div class="receipt-info-item">
                        <span>Invoice #</span>
                        <strong>${escapeHtml(transaction.id)}</strong>
                    </div>
                    <div class="receipt-info-item receipt-info-wide">
                        <span>Services / Packages</span>
                        <strong>${escapeHtml(transaction.service || "Service")}</strong>
                    </div>
                    <div class="receipt-info-item">
                        <span>Assigned Mechanic</span>
                        <strong>${escapeHtml(transaction.mechanic || "Standard Assigned")}</strong>
                    </div>
                    <div class="receipt-info-item">
                        <span>Status</span>
                        <strong>${escapeHtml(status.toUpperCase())}</strong>
                    </div>
                    <div class="receipt-info-item">
                        <span>Service Date</span>
                        <strong>${escapeHtml(transaction.date || "N/A")}</strong>
                    </div>
                    <div class="receipt-info-item">
                        <span>Client-Supplied Parts</span>
                        <strong>${escapeHtml(customerParts)}</strong>
                    </div>
                </div>

                <div class="receipt-parts-block">
                    <div class="receipt-line-item">
                        <span>Parts Added</span>
                        <strong>${escapeHtml(transaction.parts || "None")}</strong>
                    </div>
                    <div class="receipt-line-item">
                        <span>Additional Parts</span>
                        <strong>${formatCurrency(additionalParts)}</strong>
                    </div>
                    <div class="receipt-line-item">
                        <span>Additional Labor</span>
                        <strong>${formatCurrency(additionalLabor)}</strong>
                    </div>
                </div>

                <div class="receipt-transaction-total">
                    <span>Individual Total</span>
                    <strong>${escapeHtml(transaction.total || "₱0.00")}</strong>
                </div>
            </article>
        `;
    }

    function openReceiptModal(transaction) {
        const modal = ensureReceiptModal();
        const body = document.getElementById("receiptModalBody");
        const viewedNote = document.getElementById("receiptViewedNote");
        if (!body) return;

        // The clicked invoice is the entry point, but the modal intentionally
        // consolidates every transaction belonging to the currently logged-in
        // customer so mobile users do not need to reopen each invoice.
        const allTransactions = buildTransactions();
        const transactions = allTransactions.length ? allTransactions : [transaction];

        // Mark the transaction that the customer explicitly opened as viewed.
        markTransactionAsViewed(transaction);

        const totalAmount = transactions.reduce((sum, item) => {
            const numeric = Number(String(item.total || "").replace(/[^0-9.-]/g, ""));
            return sum + (Number.isFinite(numeric) ? numeric : 0);
        }, 0);

        body.innerHTML = `
            <section class="receipt-customer-summary">
                <div>
                    <span class="receipt-modal-kicker">CUSTOMER RECEIPT</span>
                    <strong>${transactions.length} invoice${transactions.length === 1 ? "" : "s"} in this account</strong>
                </div>
                <div class="receipt-summary-total">
                    <span>Combined Total</span>
                    <strong>${formatCurrency(totalAmount)}</strong>
                </div>
            </section>

            <div class="receipt-list" aria-label="All customer invoices">
                ${transactions.map(renderReceiptTransaction).join("")}
            </div>
        `;

        if (viewedNote) viewedNote.textContent = `${transaction.id} marked as viewed.`;

        modal.classList.add("show");
        modal.setAttribute("aria-hidden", "false");
        document.body.classList.add("receipt-modal-open");

        // Always begin at the top for predictable mobile scrolling.
        body.scrollTop = 0;
    }

    window.openCustomerReceipt = openReceiptModal;

    // --- Database-Ready API Abstraction Layer ---
    async function fetchTransactionsFromDB() {
        try {
            const data = localStorage.getItem("userTransactions");
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error("Failed to load transactions:", error);
            return [];
        }
    }

    function buildTransactions() {
        let transactions = [];
        try {
            transactions = JSON.parse(localStorage.getItem("userTransactions")) || [];
        } catch {
            transactions = [];
        }

        const appointments = JSON.parse(localStorage.getItem("motofix_appointments")) || [];
        const appointmentTransactions = appointments.map(app => {
            const partsList = Array.isArray(app.parts) && app.parts.length
                ? app.parts.map(p => `${p.name} (x${p.quantity})`).join(", ")
                : "None";

            return {
                id: `INV-${app.id}`,
                service: Array.isArray(app.services) ? app.services.join(", ") : (app.services || "Service"),
                mechanic: app.mechanic || "Standard Assigned",
                parts: partsList,
                broughtOwnParts: Array.isArray(app.parts) && app.parts.some(p => p.source === "bring" || p.source === "client") ? "Yes" : "No",
                additionalPartsPrice: Number(app.additionalPartsPrice || 0),
                additionalLaborPayment: Number(app.additionalLaborPayment || 0),
                total: (() => {
                    const numericTotal = typeof app.total === "number"
                        ? app.total
                        : Number(String(app.total || "").replace(/[₱,\s]/g, ""));
                    return Number.isFinite(numericTotal)
                        ? `₱${numericTotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
                        : "₱0.00";
                })(),
                status: (app.status || "pending").toLowerCase(),
                date: app.date || "N/A",
                viewed: app.viewed === true,
                viewedAt: app.viewedAt || null,
                viewStatus: app.viewStatus || (app.viewed ? "Viewed" : null)
            };
        });

        const combinedMap = new Map();
        [...transactions, ...appointmentTransactions].forEach(item => {
            if (!combinedMap.has(item.id)) combinedMap.set(item.id, item);
        });
        return Array.from(combinedMap.values());
    }

    function loadTransactions(filter = "all") {
        if (!transactionsTableBody) return;

        const allTransactions = buildTransactions();
        allTransactions.forEach(addTransactionNotification);

        let filtered = allTransactions;
        if (filter !== "all") {
            filtered = filtered.filter(t => t.status.toLowerCase() === filter.toLowerCase());
        }

        invoiceCountLabel.textContent = `${filtered.length} invoice${filtered.length === 1 ? '' : 's'} total`;

        if (filtered.length === 0) {
            transactionsTableBody.innerHTML = `
                <tr>
                    <td colspan="7">
                        <div class="transactions-empty">
                            <p>No transaction history found matching this filter.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        transactionsTableBody.innerHTML = filtered.map(t => `
            <tr class="transaction-row"
                data-transaction-id="${escapeHtml(t.id)}"
                tabindex="0"
                role="button"
                aria-label="Open invoice ${escapeHtml(t.id)}">
                <td><strong>${escapeHtml(t.id)}</strong></td>
                <td>${escapeHtml(t.service)}</td>
                <td>${escapeHtml(t.mechanic || "Standard Assigned")}</td>
                <td>
                    <div>${escapeHtml(t.parts || "None")}</div>
                    <small style="color: #94a3b8;">Brought own: ${escapeHtml(t.broughtOwnParts || "No")}</small>
                </td>
                <td>
                    <strong>${escapeHtml(t.total)}</strong>
                    ${t.broughtOwnParts === "Yes" ? `<small style="display:block;color:#94a3b8;">Bring Own → Labor: ₱${Number(t.additionalLaborPayment || 0).toLocaleString("en-PH", {minimumFractionDigits:2})}</small>` : ""}
                </td>
                <td>
                    <span class="badge-status ${escapeHtml(t.viewed ? "viewed" : t.status)}">
                        ${escapeHtml(t.viewed ? "VIEWED" : t.status.toUpperCase())}
                    </span>
                </td>
                <td>${escapeHtml(t.date)}</td>
            </tr>
        `).join("");
    }

    function openTransactionFromRow(row) {
        const transactionId = row?.dataset?.transactionId;
        if (!transactionId) return;
        const transaction = buildTransactions().find(
            (item) => String(item.id) === String(transactionId)
        );
        if (transaction) openReceiptModal(transaction);
    }

    transactionsTableBody?.addEventListener("click", (event) => {
        const row = event.target.closest("tr.transaction-row");
        if (!row || !transactionsTableBody.contains(row)) return;
        openTransactionFromRow(row);
    });

    transactionsTableBody?.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        const row = event.target.closest("tr.transaction-row");
        if (!row || !transactionsTableBody.contains(row)) return;
        event.preventDefault();
        openTransactionFromRow(row);
    });

    filterTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            filterTabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            loadTransactions(tab.getAttribute("data-filter"));
        });
    });

    window.refreshTransactions = loadTransactions;
    window.getCustomerTransactions = buildTransactions;

    loadTransactions();
    window.addEventListener("storage", (event) => {
        if (event.key === "motofix_appointments" || event.key === "userTransactions") {
            loadTransactions(document.querySelector(".filter-tab.active")?.getAttribute("data-filter") || "all");
        }
    });
}
