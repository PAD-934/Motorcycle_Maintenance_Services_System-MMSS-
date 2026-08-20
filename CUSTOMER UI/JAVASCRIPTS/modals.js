// js/modals.js
export function initModals() {
    // Modal Controls for Booking
    const modalOverlay = document.getElementById("sc-modal-overlay");
    const openModalBtn = document.getElementById("sc-open-modal-btn");
    const closeModalBtn = document.getElementById("sc-close-modal-btn");

    if (openModalBtn && modalOverlay && closeModalBtn) {
        openModalBtn.addEventListener("click", () => {
            modalOverlay.style.display = "flex";
        });
        closeModalBtn.addEventListener("click", () => {
            modalOverlay.style.display = "none";
        });
    }

    // Modal Controls for Adding Motorbike
    const bikeModalOverlay = document.getElementById("sc-bike-modal-overlay");
    const addBikeBtn = document.getElementById("sc-add-motorbike-btn");
    const closeBikeModalBtn = document.getElementById("sc-close-bike-modal-btn");
    const saveBikeBtn = document.getElementById("sc-save-bike-btn");

    if (addBikeBtn && bikeModalOverlay) {
        addBikeBtn.addEventListener("click", () => {
            bikeModalOverlay.style.display = "flex";
        });
        closeBikeModalBtn.addEventListener("click", () => {
            bikeModalOverlay.style.display = "none";
        });

        saveBikeBtn.addEventListener("click", () => {
            const modelInput = document.getElementById("sc-new-bike-model").value.trim();
            const plateInput = document.getElementById("sc-new-bike-plate").value.trim();
            if(modelInput) {
                const comboValue = modelInput + (plateInput ? " — " + plateInput : "");
                const selectEl = document.getElementById("sc-motorcycle-select");
                const opt = document.createElement("option");
                opt.value = comboValue;
                opt.textContent = comboValue;
                selectEl.appendChild(opt);
                selectEl.value = comboValue;
                
                document.getElementById("sc-new-bike-model").value = "";
                document.getElementById("sc-new-bike-plate").value = "";
                bikeModalOverlay.style.display = "none";
            }
        });
    }
}