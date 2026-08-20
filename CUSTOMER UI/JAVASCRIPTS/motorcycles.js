// JAVASCRIPTS/motorcycles.js

export function initMotorcycles() {
    const motorcyclesView = document.getElementById('motorcycles-page-view');
    const openModalBtn = document.getElementById('open-register-bike-modal');
    const closeModalBtn = document.getElementById('close-register-modal');
    const gotItBtn = document.getElementById('got-it-bike-modal');
    const registerModal = document.getElementById('register-bike-modal');

    const bikeCards = document.querySelectorAll('.mc-bike-card');
    const detailsPanel = document.getElementById('bike-details-panel');
    const closeDetailsBtn = document.getElementById('close-bike-details');

    // --- Modal Control: Register Motorcycle ---
    function openModal() {
        if (registerModal) registerModal.style.display = 'flex';
    }

    function closeModal() {
        if (registerModal) registerModal.style.display = 'none';
    }

    if (openModalBtn) openModalBtn.addEventListener('click', openModal);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (gotItBtn) gotItBtn.addEventListener('click', closeModal);

    // Close modal when clicking outside of card
    if (registerModal) {
        registerModal.addEventListener('click', (e) => {
            if (e.target === registerModal) closeModal();
        });
    }

    // --- Detail Panel Control: Open Details on Card Click ---
    bikeCards.forEach(card => {
        card.addEventListener('click', () => {
            // Optional: highlight selected card
            bikeCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');

            // Show the slide-out / side panel
            if (detailsPanel) detailsPanel.style.display = 'block';
        });
    });

    if (closeDetailsBtn) {
        closeDetailsBtn.addEventListener('click', () => {
            if (detailsPanel) detailsPanel.style.display = 'none';
            bikeCards.forEach(c => c.classList.remove('selected'));
        });
    }
}