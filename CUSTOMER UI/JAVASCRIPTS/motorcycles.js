// JAVASCRIPTS/motorcycles.js
const MOTORCYCLE_STORE_KEY = "motofix_motorcycles";

// Motorcycle ownership currently joins to the signed-in user by normalized email.
// A database migration can replace ownerEmail with a foreign key to the users table.
const currentEmail = () =>
  (localStorage.getItem("userEmail") || "").trim().toLowerCase();

function readAllBikes() {
  try {
    const parsed = JSON.parse(localStorage.getItem(MOTORCYCLE_STORE_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    const cleaned = parsed.map(({ customizations, ...bike }) => bike);
    if (parsed.some((bike) => Object.hasOwn(bike, "customizations"))) {
      localStorage.setItem(MOTORCYCLE_STORE_KEY, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch {
    return [];
  }
}

const writeAllBikes = (bikes) =>
  localStorage.setItem(
    MOTORCYCLE_STORE_KEY,
    JSON.stringify(bikes.map(({ customizations, ...bike }) => bike)),
  );

const getMyBikes = () =>
  readAllBikes().filter((b) => b.ownerEmail === currentEmail());

// Signup stores an initial bike on the user record; migrate it once into the
// motorcycle collection, linked back to that user through ownerEmail.
function migrateSignupMotorcycle() {
  const email = currentEmail();
  if (!email || localStorage.getItem(`motofix_signup_motorcycle_migrated:${email}`)) {
    return;
  }

  try {
    const users = JSON.parse(localStorage.getItem("motofix_users") || "[]");
    const account = Array.isArray(users)
      ? users.find((user) => user.email?.trim().toLowerCase() === email)
      : null;
    if (!account) return;

    const model = String(account.moto_model || "").trim();
    const plate = String(account.plate_number || "")
      .trim()
      .toUpperCase();
    const hasModel = model && model.toLowerCase() !== "none specified";
    const hasPlate = plate && plate.toLowerCase() !== "unregistered";
    if (!hasModel && !hasPlate) {
      localStorage.setItem(`motofix_signup_motorcycle_migrated:${email}`, "true");
      return;
    }

    const bikes = readAllBikes();
    const registeredBikeIndex = bikes.findIndex(
      (bike) =>
        bike.ownerEmail?.trim().toLowerCase() === email &&
        (hasPlate
          ? String(bike.plate || "").trim().toUpperCase() === plate
          : String(bike.model || "").trim().toLowerCase() === model.toLowerCase()),
    );
    if (registeredBikeIndex >= 0) {
      const bike = bikes[registeredBikeIndex];
      bikes[registeredBikeIndex] = {
        ...bike,
        model: bike.model || (hasModel ? model : "Motorcycle"),
        plate: bike.plate || (hasPlate ? plate : ""),
      };
      writeAllBikes(bikes);
    } else {
      bikes.push({
        id: `signup-${encodeURIComponent(email)}`,
        ownerEmail: email,
        make: "",
        model: hasModel ? model : "Motorcycle",
        year: "",
        color: "",
        plate: hasPlate ? plate : "",
        mileage: 0,
        createdAt: account.created_at || new Date().toISOString(),
      });
      writeAllBikes(bikes);
    }
    localStorage.setItem(`motofix_signup_motorcycle_migrated:${email}`, "true");
  } catch (error) {
    console.error("Unable to migrate the motorcycle saved during signup:", error);
  }
}

function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>'"]/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[c]
  );
}

const bikeTitle = (b) => [b.year, b.make, b.model].filter(Boolean).join(" ");
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
  let activeBikeId = null;

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
        <div class="mc-bike-card" data-bike-id="${escapeHtml(b.id)}" tabindex="0" role="button" aria-label="View details for ${escapeHtml(bikeTitle(b))}">
          <div class="mc-bike-info">
            <div class="mc-bike-title">${escapeHtml(bikeTitle(b))}</div>
            <div class="mc-bike-sub">${escapeHtml(bikeSub(b))}</div>
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
        <div class="motorcycle_list_subparent" data-bike-id="${escapeHtml(b.id)}" tabindex="0" role="button" aria-label="View details for ${escapeHtml(bikeTitle(b))}" style="cursor:pointer" title="View motorcycle details">
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
    activeBikeId = bike.id;
    listEl?.querySelectorAll(".mc-bike-card").forEach((card) => {
      card.classList.toggle("selected", card.dataset.bikeId === String(bike.id));
    });
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

    if (detailsPanel) {
      detailsPanel.style.display = "flex";
      document.getElementById("close-bike-details")?.focus();
    }
  }

  function closeDetails() {
    activeBikeId = null;
    if (detailsPanel) detailsPanel.style.display = "none";
    listEl?.querySelectorAll(".mc-bike-card").forEach((card) => card.classList.remove("selected"));
  }

  function deleteBike(bike) {
    if (!confirm(`Delete ${bikeTitle(bike)}?`)) return;
    writeAllBikes(
      readAllBikes().filter(
        (b) => !(b.id === bike.id && b.ownerEmail === currentEmail())
      )
    );
    closeDetails();
    renderAll();
  }

  listEl?.addEventListener("click", (e) => {
    const card = e.target.closest(".mc-bike-card");
    if (!card) return;
    const bike = getMyBikes().find((b) => b.id === card.dataset.bikeId);
    if (bike) {
      listEl.querySelectorAll(".mc-bike-card").forEach((item) => item.classList.remove("selected"));
      card.classList.add("selected");
      showDetails(bike);
    }
  });

  listEl?.addEventListener("keydown", (event) => {
    const card = event.target.closest(".mc-bike-card");
    if (!card || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    card.click();
  });

  dashListEl?.addEventListener("click", (e) => {
    const row = e.target.closest(".motorcycle_list_subparent");
    if (!row) return;
    const bike = getMyBikes().find((b) => b.id === row.dataset.bikeId);
    if (bike) showDetails(bike);
  });

  dashListEl?.addEventListener("keydown", (event) => {
    const row = event.target.closest(".motorcycle_list_subparent");
    if (!row || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    row.click();
  });

  detailsPanel?.addEventListener("click", (event) => {
    if (event.target === detailsPanel) closeDetails();
  });

  if (closeDetailsBtn) {
    closeDetailsBtn.addEventListener("click", closeDetails);
  }
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && detailsPanel?.style.display === "flex") closeDetails();
  });

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

    if (errorBox) errorBox.hidden = true;
    let delBtn = document.getElementById("delete-bike-in-modal");
    if (!delBtn && saveBtn) {
      delBtn = document.createElement("button");
      delBtn.id = "delete-bike-in-modal";
      delBtn.type = "button";
      delBtn.className = "sc-submit-btn sc-danger-btn";
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
    };

    const keepId = editingId;
    if (keepId) {
      const idx = all.findIndex(
        (b) => b.id === keepId && b.ownerEmail === currentEmail()
      );
      if (idx === -1) return showError("Motorcycle not found.");
      all[idx] = { ...all[idx], ...data, updatedAt: new Date().toISOString() };
    } else {
      // id identifies the motorcycle; ownerEmail is its current user relationship.
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

  migrateSignupMotorcycle();
  renderAll();

  window.addEventListener("storage", (event) => {
    if (event.key !== MOTORCYCLE_STORE_KEY) return;
    renderAll();
    if (detailsPanel?.style.display === "flex") {
      const selectedBike = getMyBikes().find((bike) => bike.id === activeBikeId);
      if (selectedBike) showDetails(selectedBike);
      else closeDetails();
    }
  });
}