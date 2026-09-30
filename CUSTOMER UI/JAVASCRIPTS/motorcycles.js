// JAVASCRIPTS/motorcycles.js
const MOTORCYCLE_STORE_KEY = "motofix_motorcycles";

const currentEmail = () =>
  (localStorage.getItem("userEmail") || "").trim().toLowerCase();

function readAllBikes() {
  try {
    const parsed = JSON.parse(localStorage.getItem(MOTORCYCLE_STORE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const writeAllBikes = (bikes) =>
  localStorage.setItem(MOTORCYCLE_STORE_KEY, JSON.stringify(bikes));

const getMyBikes = () =>
  readAllBikes().filter((b) => b.ownerEmail === currentEmail());

function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>'"]/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[c]
  );
}

const bikeTitle = (b) => `${b.year} ${b.make} ${b.model}`.trim();
const bikeSub = (b) => [b.color, b.plate].filter(Boolean).join(" · ");
const formatKm = (n) => `${Number(n || 0).toLocaleString("en-PH")} km`;

const BIKE_ICON = `
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
    stroke-linejoin="round" aria-hidden="true" style="color: rgb(249, 115, 22)">
    <circle cx="18.5" cy="17.5" r="3.5"></circle>
    <circle cx="5.5" cy="17.5" r="3.5"></circle>
    <circle cx="15" cy="5" r="1"></circle>
    <path d="M12 17.5V14l-3-3 4-3 2 3h2"></path>
  </svg>`;

export function initMotorcycles() {
  const listEl = document.getElementById("motorcycles-list");
  const dashListEl = document.getElementById("dashboard-motorcycles-list");
  const bikeSelect = document.getElementById("sc-motorcycle-select");
  const detailsPanel = document.getElementById("bike-details-panel");
  const closeDetailsBtn = document.getElementById("close-bike-details");

  const registerModal = document.getElementById("register-bike-modal");
  const modalTitle = registerModal?.querySelector("h2");
  const openModalBtn = document.getElementById("open-register-bike-modal");
  const closeModalBtn = document.getElementById("close-register-modal");
  const saveBtn = document.getElementById("save-bike-btn");
  const errorBox = document.getElementById("bike-form-error");

  let editingId = null; // null = adding a new bike

  const setField = (name, value) => {
    const el = document.getElementById(`bike-${name}`);
    if (el) el.value = value ?? "";
  };

  // ---------- Rendering ----------
  function renderPageList(bikes) {
    if (!listEl) return;
    listEl.innerHTML = bikes.length
      ? bikes
          .map(
            (b) => `
        <div class="mc-bike-card" data-bike-id="${escapeHtml(b.id)}">
          <div class="mc-bike-info">
            <div class="mc-bike-title">${escapeHtml(bikeTitle(b))}</div>
            <div class="mc-bike-sub">${escapeHtml(bikeSub(b))}</div>
            ${
              b.customizations?.length
                ? `<div class="mc-tags-row">${b.customizations
                    .map((m) => `<span class="mc-tag">${escapeHtml(m)}</span>`)
                    .join("")}</div>`
                : ""
            }
          </div>
          <div class="mc-bike-meta">
            <div class="mc-odometer-val">${escapeHtml(formatKm(b.mileage))}</div>
            <div class="mc-odometer-label">odometer</div>
          </div>
        </div>`
          )
          .join("")
      : `<div class="mc-empty" style="padding:24px;color:#9a9a9a;">
           No motorcycles yet. Click "Add Bike" to register one.
         </div>`;
  }

  function renderDashboardList(bikes) {
    if (!dashListEl) return;
    dashListEl.innerHTML = bikes.length
      ? bikes
          .map(
            (b) => `
        <div class="motorcycle_list_subparent" data-bike-id="${escapeHtml(b.id)}" style="cursor:pointer" title="Click to edit">
          <div class="moto_label_parent">
            <div class="moto_label_subparent">
              <div class="third_div_moto_icon">${BIKE_ICON}</div>
              <div>
                <div class="third_div_moto_label">${escapeHtml(bikeTitle(b))}</div>
                <div class="third_div_moto_sublabel">${escapeHtml(bikeSub(b))}</div>
              </div>
            </div>
          </div>
          <div class="moto_km_parent">
            <div class="moto_km">${escapeHtml(formatKm(b.mileage))}</div>
            ${
              b.customizations?.length
                ? `<div class="moto_mods">${b.customizations.length} mod${b.customizations.length === 1 ? "" : "s"}</div>`
                : ""
            }
          </div>
        </div>`
          )
          .join("")
      : `<div style="padding:16px;color:#9a9a9a;">No motorcycles added yet.</div>`;
  }

  function renderBookingSelect(bikes) {
    if (!bikeSelect) return;
    bikeSelect.innerHTML = bikes.length
      ? bikes
          .map((b) => {
            const label = `${bikeTitle(b)} — ${b.plate}`;
            return `<option value="${escapeHtml(label)}">${escapeHtml(label)}</option>`;
          })
          .join("")
      : `<option value="" disabled selected>-- Add a motorbike first --</option>`;
  }

  function renderAll() {
    const bikes = getMyBikes();
    renderPageList(bikes);
    renderDashboardList(bikes);
    renderBookingSelect(bikes);
  }

  // ---------- Details panel ----------
  function showDetails(bike) {
    const set = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };
    set("detail-make", bike.make);
    set("detail-model", bike.model);
    set("detail-year", bike.year);
    set("detail-color", bike.color || "—");
    set("detail-plate", bike.plate);
    set("detail-mileage", formatKm(bike.mileage));

    const mods = document.getElementById("detail-customizations");
    if (mods) {
      mods.innerHTML = bike.customizations?.length
        ? bike.customizations
            .map((m) => `<span class="mc-tag">${escapeHtml(m)}</span>`)
            .join("")
        : `<span class="mc-tag">None</span>`;
    }

    // Edit / Delete buttons (created here, no HTML edit needed)
    let actions = document.getElementById("bike-detail-actions");
    if (!actions) {
      actions = document.createElement("div");
      actions.id = "bike-detail-actions";
      actions.style.cssText = "display:flex;gap:8px;margin-top:16px";
      detailsPanel?.querySelector(".mc-details-body")?.appendChild(actions);
    }
    actions.innerHTML = `
      <button type="button" class="sc-submit-btn" id="edit-bike-btn">Edit Bike</button>
      <button type="button" class="sc-secondary-btn" id="delete-bike-btn">Delete</button>`;
    document.getElementById("edit-bike-btn").addEventListener("click", () => openModal(bike));
    document.getElementById("delete-bike-btn").addEventListener("click", () => deleteBike(bike));

    if (detailsPanel) detailsPanel.style.display = "block";
  }

  function deleteBike(bike) {
    if (!confirm(`Delete ${bikeTitle(bike)}?`)) return;
    writeAllBikes(
      readAllBikes().filter(
        (b) => !(b.id === bike.id && b.ownerEmail === currentEmail())
      )
    );
    if (detailsPanel) detailsPanel.style.display = "none";
    renderAll();
  }

    listEl?.addEventListener("click", (e) => {
    const card = e.target.closest(".mc-bike-card");
    if (!card) return;
    const bike = getMyBikes().find((b) => b.id === card.dataset.bikeId);
    if (bike) openModal(bike);
  });
  
  dashListEl?.addEventListener("click", (e) => {
  const row = e.target.closest(".motorcycle_list_subparent");
  if (!row) return;
  const bike = getMyBikes().find((b) => b.id === row.dataset.bikeId);
  if (bike) openModal(bike);
});
  if (closeDetailsBtn) {
    closeDetailsBtn.addEventListener("click", () => {
      if (detailsPanel) detailsPanel.style.display = "none";
      listEl?.querySelectorAll(".mc-bike-card").forEach((c) => c.classList.remove("selected"));
    });
  }

  // ---------- Add / Edit modal ----------
  function openModal(bike = null) {
    editingId = bike ? bike.id : null;
    if (modalTitle) modalTitle.textContent = bike ? "Edit Details of Motorcycle?" : "Register Motorcycle";
    if (saveBtn) saveBtn.textContent = bike ? "Save Changes" : "Save Motorcycle";

    setField("make", bike?.make);
    setField("model", bike?.model);
    setField("year", bike?.year);
    setField("color", bike?.color);
    setField("plate", bike?.plate);
    setField("mileage", bike?.mileage);
    setField("mods", bike?.customizations?.join(", "));

    if (errorBox) errorBox.hidden = true;
    let delBtn = document.getElementById("delete-bike-in-modal");
    if (!delBtn && saveBtn) {
      delBtn = document.createElement("button");
      delBtn.id = "delete-bike-in-modal";
      delBtn.type = "button";
      delBtn.className = "sc-secondary-btn";
      delBtn.style.cssText = "width:100%;margin-top:8px";
      delBtn.textContent = "Delete Motorcycle";
      saveBtn.after(delBtn);
      delBtn.addEventListener("click", () => {
        const bike = getMyBikes().find((b) => b.id === editingId);
        if (!bike) return;
        deleteBike(bike);
        if (!getMyBikes().some((b) => b.id === bike.id)) closeModal();
      });
    }
    if (delBtn) delBtn.style.display = bike ? "block" : "none";

    if (registerModal) registerModal.style.display = "flex";
  }

  function closeModal() {
    editingId = null;
    if (registerModal) registerModal.style.display = "none";
  }

  openModalBtn?.addEventListener("click", () => openModal());
  closeModalBtn?.addEventListener("click", closeModal);
  registerModal?.addEventListener("click", (e) => {
    if (e.target === registerModal) closeModal();
  });

  const showError = (msg) => {
    if (!errorBox) return;
    errorBox.textContent = msg;
    errorBox.hidden = false;
  };

  saveBtn?.addEventListener("click", () => {
    const val = (id) => document.getElementById(id)?.value.trim() || "";
    const make = val("bike-make");
    const model = val("bike-model");
    const year = Number(val("bike-year"));
    const plate = val("bike-plate").toUpperCase();
    const mileage = Number(val("bike-mileage")) || 0;

    if (!make || !model || !plate) {
      return showError("Please enter the make, model, and plate number.");
    }
    if (!year || year < 1950 || year > new Date().getFullYear() + 1) {
      return showError("Please enter a valid year.");
    }
    if (mileage < 0) return showError("Mileage cannot be negative.");

    const all = readAllBikes();
    const duplicate = all.some(
      (b) =>
        b.ownerEmail === currentEmail() && b.plate === plate && b.id !== editingId
    );
    if (duplicate) {
      return showError("You already have a motorcycle with this plate number.");
    }

    const data = {
      make,
      model,
      year,
      color: val("bike-color"),
      plate,
      mileage,
      customizations: val("bike-mods")
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean),
    };

    const keepId = editingId;
    if (keepId) {
      const idx = all.findIndex(
        (b) => b.id === keepId && b.ownerEmail === currentEmail()
      );
      if (idx === -1) return showError("Motorcycle not found.");
      all[idx] = { ...all[idx], ...data, updatedAt: new Date().toISOString() };
    } else {
      all.push({
        id: `B${Date.now()}`,
        ownerEmail: currentEmail(),
        ...data,
        createdAt: new Date().toISOString(),
      });
    }
    writeAllBikes(all);

    renderAll();
    closeModal();

    // After an edit, keep the details panel open with the new values
    if (keepId) {
      const updated = getMyBikes().find((b) => b.id === keepId);
      listEl
        ?.querySelector(`.mc-bike-card[data-bike-id="${keepId}"]`)
        ?.classList.add("selected");
      if (updated) showDetails(updated);
    }
  });

  renderAll();
}