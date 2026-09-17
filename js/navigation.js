// THIS FILE WILL BE THE HOME FOR THE NAVIGATION SCRIPTS 
import { checkMasterAdminAuth, handleSignOut } from './auth-guard.js';
import { fetchMechanics, removeMechanic } from './database-connection.js';

// Handles smooth scrolling for internal header links (Landing Page)
document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.sub_nav_parent .link');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId && targetId.startsWith('#')) {
                e.preventDefault();
                const targetSection = document.querySelector(targetId);
                if (targetSection) {
                    targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    });

    // Back-to-Top Button Logic
    const backToTopBtn = document.getElementById('backToTopBtn');
    if (backToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTopBtn.classList.add('show');
            } else {
                backToTopBtn.classList.remove('show');
            }
        });

        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // --- MASTER DASHBOARD SPECIFIC CONTROLS (Runs only if on Master Dashboard) ---
    const mechanicsTable = document.getElementById("mechanicsTable");
    if (mechanicsTable) {
        // 1. Run security check
        checkMasterAdminAuth();

        // 2. Bind Sign Out
        handleSignOut("signOutBtn");

        // 3. Load and Render Mechanics Data
        loadMasterDashboardData();
    }

});

async function loadMasterDashboardData() {
    const table = document.getElementById("mechanicsTable");
    if (!table) return;

    const mechanics = await fetchMechanics();

    table.innerHTML = `
        <thead>
            <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            ${mechanics.map(m => `
                <tr>
                    <td>${m.id}</td>
                    <td>${m.name}</td>
                    <td>${m.email}</td>
                    <td><span style="color: #22c55e;">${m.status}</span></td>
                    <td><button class="delete-mechanic-btn" data-id="${m.id}" style="background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Deactivate</button></td>
                </tr>
            `).join("")}
        </tbody>
    `;

    // Bind Deactivate / Delete actions
    document.querySelectorAll(".delete-mechanic-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
            const id = Number(btn.getAttribute("data-id"));
            if (confirm("Are you sure you want to deactivate this mechanic?")) {
                await removeMechanic(id);
                loadMasterDashboardData(); // Refresh table view
            }
        });
    });
}