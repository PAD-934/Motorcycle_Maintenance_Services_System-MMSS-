// js/appointments.js
export function initAppointments() {
    // Filtering Appointments via Top Category Buttons
    const filterBtns = document.querySelectorAll(".sc-filter-btn");
    filterBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            filterBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            const category = btn.getAttribute("data-filter");
            const rows = document.querySelectorAll("#sc-appointments-tbody tr");

            rows.forEach(row => {
                const status = row.getAttribute("data-status");
                if(category === "All" || status === category) {
                    row.style.display = "";
                } else {
                    row.style.display = "none";
                }
            });
        });
    });

    // Real-time Search Filtering
    const searchInput = document.getElementById("sc-search-input");
    if(searchInput) {
        searchInput.addEventListener("input", (e) => {
            const query = e.target.value.toLowerCase();
            const rows = document.querySelectorAll("#sc-appointments-tbody tr");
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                if(text.includes(query)) {
                    row.style.display = "";
                } else {
                    row.style.display = "none";
                }
            });
        });
    }

    // Handling New Appointment Submission
    const submitApptBtn = document.getElementById("sc-submit-appointment");
    let appointmentCounter = 5;
    const modalOverlay = document.getElementById("sc-modal-overlay");

    if(submitApptBtn) {
        submitApptBtn.addEventListener("click", () => {
            const moto = document.getElementById("sc-motorcycle-select").value;
            const mechanic = document.getElementById("sc-mechanic-select").value;
            const dateVal = document.getElementById("sc-date-input").value || "2026-08-01";
            const timeVal = document.getElementById("sc-time-input").value;
            
            const checkedServices = Array.from(document.querySelectorAll('input[name="service"]:checked'))
                                       .map(cb => cb.value);

            if(checkedServices.length === 0) {
                alert("Please select at least one service.");
                return;
            }

            const tbody = document.getElementById("sc-appointments-tbody");
            const newRow = document.createElement("tr");
            newRow.setAttribute("data-status", "Pending");

            newRow.innerHTML = `
                <td class="sc-id-col">A${appointmentCounter++}</td>
                <td>
                    <div class="sc-customer-info">
                        <div class="sc-avatar">MT</div>
                        <div>
                            <div class="sc-cust-name">Miguel Torres</div>
                            <div class="sc-cust-phone">+63 912 100 0001</div>
                        </div>
                    </div>
                </td>
                <td>${moto}</td>
                <td>
                    <div class="sc-service-tags">${checkedServices.join("<br>")}</div>
                </td>
                <td>
                    <div class="sc-datetime">${dateVal}<br><span>${timeVal}</span></div>
                </td>
                <td>${mechanic === "Unassigned" ? '<span class="sc-unassigned">Unassigned</span>' : mechanic}</td>
                <td><span class="sc-status-badge sc-pending">PENDING</span></td>
                <td></td>
            `;

            tbody.appendChild(newRow);
            if(modalOverlay) modalOverlay.style.display = "none";
            
            // Reset checkboxes
            document.querySelectorAll('input[name="service"]').forEach(cb => cb.checked = false);
        });
    }
}