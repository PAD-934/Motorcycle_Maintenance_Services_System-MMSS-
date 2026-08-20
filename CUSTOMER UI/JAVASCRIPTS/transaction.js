export function initTransactions() {
    const transactionsTableBody = document.getElementById("transactions-table-body");
    const invoiceCountLabel = document.getElementById("invoice-count-label");
    const filterTabs = document.querySelectorAll(".transactions-filters .filter-tab");

    function loadTransactions(filter = "all") {
        if (!transactionsTableBody) return;

        let transactions = JSON.parse(localStorage.getItem("userTransactions")) || [];

        // Fallback demo data if nothing is booked yet
        if (transactions.length === 0) {
            transactions = [
                {
                    id: "A1",
                    service: "Basic Oil Change, Brake System Service",
                    mechanic: "Ramon Santos",
                    parts: "Spark Plug (₱350)",
                    broughtOwnParts: "No",
                    total: "₱1,850.00",
                    status: "completed",
                    date: "2026-07-24"
                },
                {
                    id: "A4",
                    service: "Suspension Setup, Performance Exhaust Install",
                    mechanic: "Unassigned",
                    parts: "None",
                    broughtOwnParts: "Yes (Motul Oil 10W40)",
                    total: "₱950.00",
                    status: "pending",
                    date: "2026-07-28"
                }
            ];
        }

        let filtered = transactions;
        if (filter !== "all") {
            filtered = transactions.filter(t => t.status === filter);
        }

        invoiceCountLabel.textContent = `${filtered.length} invoice${filtered.length === 1 ? '' : 's'} total`;

        if (filtered.length === 0) {
            transactionsTableBody.innerHTML = `
                <tr>
                    <td colspan="8">
                        <div class="transactions-empty">
                            <p>No transaction history found matching this filter.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        transactionsTableBody.innerHTML = filtered.map(t => `
            <tr>
                <td><strong>${t.id}</strong></td>
                <td>${t.service}</td>
                <td>${t.mechanic || 'Standard Assigned'}</td>
                <td>
                    <div>${t.parts || 'None'}</div>
                    <small style="color: #94a3b8;">Brought own: ${t.broughtOwnParts || 'No'}</small>
                </td>
                <td><strong>${t.total}</strong></td>
                <td><span class="badge-status ${t.status}">${t.status.toUpperCase()}</span></td>
                <td>${t.date}</td>
                <td>
                    <button class="receipt-details-btn" onclick="alert('Viewing receipt details for ${t.id}\\nService: ${t.service}\\nMechanic: ${t.mechanic}\\nTotal: ${t.total}')">View</button>
                </td>
            </tr>
        `).join("");
    }

    filterTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            filterTabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            loadTransactions(tab.getAttribute("data-filter"));
        });
    });

    // Expose global refresh so navigation or other scripts can trigger it easily
    window.refreshTransactions = loadTransactions;
    loadTransactions();
}