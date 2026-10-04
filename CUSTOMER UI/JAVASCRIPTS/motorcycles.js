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
  function ensureDetailEditor() {
    const body = detailsPanel?.querySelector(".mc-details-body");
    if (!body) return null;

    let editor = document.getElementById("bike-detail-editor");
    if (editor) return editor;

    const fields = [
      ["make", "MAKE", "text"],
      ["model", "MODEL", "text"],
      ["year", "YEAR", "number"],
      ["color", "COLOR", "text"],
      ["plate", "PLATE NO.", "text"],
      ["mileage", "MILEAGE (KM)", "number"],
    ];

    const grid = body.querySelector(".mc-specs-grid");
    if (grid) {
      grid.innerHTML = fields.map(([key, label, type]) => `
        <label class="mc-spec-box mc-detail-field">
          <span class="spec-lbl">${label}</span>
          <input
            type="${type}"
            id="detail-${key}"
            class="mc-detail-input"
            data-detail-field="${key}"
            readonly
            aria-readonly="true"
          />
        </label>
      `).join("");
    }

    const modsBlock = body.querySelector(".mc-section-block");
    if (modsBlock) {
      modsBlock.innerHTML = `
        <label for="detail-customizations-input">Existing Customizations</label>
        <input
          type="text"
          id="detail-customizations-input"
          class="mc-detail-input"
          placeholder="e.g. Aftermarket exhaust, LED headlights"
          readonly
          aria-readonly="true"
        />
        <div class="mc-tags-row" id="detail-customizations"></div>
      `;
    }

    editor = document.createElement("div");
    editor.id = "bike-detail-editor";
    editor.className = "mc-detail-actions";
    editor.innerHTML = `
      <button type="button" class="sc-submit-btn" id="edit-bike-details-btn">Edit</button>
      <button type="button" class="sc-submit-btn" id="save-bike-details-btn" style="display:none">Save Changes</button>
      <button type="button" class="sc-secondary-btn" id="cancel-bike-details-btn" style="display:none">Cancel</button>
    `;
    body.appendChild(editor);
    wireDetailInteractivity();
    return editor;
  }

  function setDetailEditMode(editing, focusKey = null) {
    const editor = ensureDetailEditor();
    if (!editor) return;

    editor.querySelectorAll(".mc-detail-input").forEach((input) => {
      input.readOnly = !editing;
      input.setAttribute("aria-readonly", String(!editing));
      input.classList.toggle("is-editing", editing);
    });

    const editBtn = document.getElementById("edit-bike-details-btn");
    const saveBtn = document.getElementById("save-bike-details-btn");
    const cancelBtn = document.getElementById("cancel-bike-details-btn");
    if (editBtn) editBtn.style.display = editing ? "none" : "block";
    if (saveBtn) saveBtn.style.display = editing ? "block" : "none";
    if (cancelBtn) cancelBtn.style.display = editing ? "block" : "none";

    if (editing) {
      const target = focusKey
        ? document.querySelector(`[data-detail-field="${focusKey}"]`)
        : document.getElementById("detail-make");
      target?.focus();
      target?.select?.();
    }
  }

  function activateDetailField(fieldKey) {
    if (!fieldKey) return;
    const input = document.querySelector(`[data-detail-field="${fieldKey}"]`);
    if (!input) return;
    setDetailEditMode(true, fieldKey);
  }

  function wireDetailInteractivity() {
    const body = detailsPanel?.querySelector(".mc-details-body");
    if (!body || body.dataset.interactiveWired === "true") return;
    body.dataset.interactiveWired = "true";

    body.addEventListener("click", (event) => {
      const tag = event.target.closest(".mc-tag-editable");
      if (tag) {
        event.preventDefault();
        openCustomizationEditor(Number(tag.dataset.customizationIndex));
        return;
      }

      const input = event.target.closest(".mc-detail-input");
      if (input && input.readOnly) {
        const key = input.dataset.detailField;
        if (key) activateDetailField(key);
        else setDetailEditMode(true);
        return;
      }

      const field = event.target.closest(".mc-detail-field");
      if (field && !event.target.closest("button")) {
        activateDetailField(field.querySelector(".mc-detail-input")?.dataset.detailField);
      }
    });

    body.addEventListener("keydown", (event) => {
      const field = event.target.closest(".mc-detail-field");
      if (!field || !["Enter", " "].includes(event.key)) return;
      event.preventDefault();
      activateDetailField(field.querySelector(".mc-detail-input")?.dataset.detailField);
    });
  }

  function populateDetailFields(bike) {
    ensureDetailEditor();
    const values = {
      make: bike.make || "",
      model: bike.model || "",
      year: bike.year || "",
      color: bike.color || "",
      plate: bike.plate || "",
      mileage: bike.mileage ?? 0,
    };
    Object.entries(values).forEach(([key, value]) => {
      const input = document.getElementById(`detail-${key}`);
      if (input) input.value = value;
    });

    const modsInput = document.getElementById("detail-customizations-input");
    if (modsInput) modsInput.value = (bike.customizations || []).join(", ");

    const mods = document.getElementById("detail-customizations");
    if (mods) {
      mods.innerHTML = bike.customizations?.length
        ? bike.customizations
            .map((m, index) => `
              <button
                type="button"
                class="mc-tag mc-tag-editable"
                data-customization-index="${index}"
                title="Click to edit ${escapeHtml(m)}"
                aria-label="Edit customization ${escapeHtml(m)}"
              >${escapeHtml(m)} <span class="mc-tag-edit-icon" aria-hidden="true">✎</span></button>
            `)
            .join("")
        : `<button type="button" class="mc-tag mc-tag-editable" data-customization-index="-1" title="Add a customization">None <span class="mc-tag-edit-icon" aria-hidden="true">＋</span></button>`;
    }
    setDetailEditMode(false);
  }

  function openCustomizationEditor(index) {
    const panel = detailsPanel;
    if (!panel) return;

    const bikeId = panel.dataset.bikeId;
    const bike = getMyBikes().find((b) => b.id === bikeId);
    if (!bike) return;

    let modal = document.getElementById("customization-edit-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "customization-edit-modal";
      modal.className = "mc-modal-overlay";
      modal.innerHTML = `
        <div class="mc-modal-card mc-customization-editor-card" role="dialog" aria-modal="true" aria-labelledby="customization-edit-title">
          <div class="mc-modal-header">
            <h2 id="customization-edit-title">Edit Customization</h2>
            <button type="button" class="mc-close-panel-btn" id="close-customization-editor" aria-label="Close">×</button>
          </div>
          <div class="mc-modal-body">
            <label for="customization-edit-name">Customization / Part Name</label>
            <input id="customization-edit-name" class="sc-input-field" type="text" maxlength="120"
              placeholder="e.g. LED Headlights" />
            <div class="mc-customization-editor-actions">
              <button type="button" class="sc-secondary-btn" id="delete-customization-btn">Delete</button>
              <span></span>
              <button type="button" class="sc-secondary-btn" id="cancel-customization-btn">Cancel</button>
              <button type="button" class="sc-submit-btn" id="save-customization-btn">Save</button>
            </div>
          </div>
        </div>`;
      document.body.appendChild(modal);

      const close = () => {
        modal.style.display = "none";
        modal.removeAttribute("data-bike-id");
        modal.removeAttribute("data-index");
      };
      document.getElementById("close-customization-editor")?.addEventListener("click", close);
      document.getElementById("cancel-customization-btn")?.addEventListener("click", close);
      modal.addEventListener("click", (e) => {
        if (e.target === modal) close();
      });

      document.getElementById("save-customization-btn")?.addEventListener("click", () => {
        const currentBike = getMyBikes().find((b) => b.id === modal.dataset.bikeId);
        if (!currentBike) return close();

        const name = (document.getElementById("customization-edit-name")?.value || "").trim();
        if (!name) return window.alert("Please enter a customization name.");

        const editIndex = Number(modal.dataset.index);
        const all = readAllBikes();
        const storageIndex = all.findIndex(
          (b) => b.id === currentBike.id && b.ownerEmail === currentEmail()
        );
        if (storageIndex === -1) return window.alert("Motorcycle not found.");

        const customizations = Array.isArray(all[storageIndex].customizations)
          ? [...all[storageIndex].customizations]
          : [];

        if (editIndex >= 0 && editIndex < customizations.length) {
          customizations[editIndex] = name;
        } else {
          customizations.push(name);
        }

        all[storageIndex] = {
          ...all[storageIndex],
          customizations,
          updatedAt: new Date().toISOString(),
        };
        writeAllBikes(all);
        renderAll();
        showDetails(all[storageIndex]);
        close();
      });

      document.getElementById("delete-customization-btn")?.addEventListener("click", () => {
        const currentBike = getMyBikes().find((b) => b.id === modal.dataset.bikeId);
        const editIndex = Number(modal.dataset.index);
        if (!currentBike || editIndex < 0) return close();

        const all = readAllBikes();
        const storageIndex = all.findIndex(
          (b) => b.id === currentBike.id && b.ownerEmail === currentEmail()
        );
        if (storageIndex === -1) return close();

        all[storageIndex] = {
          ...all[storageIndex],
          customizations: (all[storageIndex].customizations || []).filter((_, i) => i !== editIndex),
          updatedAt: new Date().toISOString(),
        };
        writeAllBikes(all);
        renderAll();
        showDetails(all[storageIndex]);
        close();
      });
    }

    modal.dataset.bikeId = bike.id;
    modal.dataset.index = String(index);
    const nameInput = document.getElementById("customization-edit-name");
    const deleteBtn = document.getElementById("delete-customization-btn");
    if (nameInput) nameInput.value = index >= 0 ? (bike.customizations?.[index] || "") : "";
    if (deleteBtn) deleteBtn.style.display = index >= 0 ? "block" : "none";
    modal.style.display = "flex";
    requestAnimationFrame(() => {
      nameInput?.focus();
      nameInput?.select();
    });
  }

  function showDetails(bike) {
    ensureDetailEditor();
    if (detailsPanel) detailsPanel.dataset.bikeId = bike.id;
    populateDetailFields(bike);

    const editBtn = document.getElementById("edit-bike-details-btn");
    const saveBtn = document.getElementById("save-bike-details-btn");
    const cancelBtn = document.getElementById("cancel-bike-details-btn");

    if (editBtn) {
      editBtn.onclick = () => {
        populateDetailFields(bike);
        setDetailEditMode(true, "make");
      };
    }

    if (cancelBtn) {
      cancelBtn.onclick = () => {
        const current = getMyBikes().find((b) => b.id === bike.id);
        if (current) populateDetailFields(current);
      };
    }

    if (saveBtn) {
      saveBtn.onclick = () => saveDetailChanges(bike);
    }

    // Keep delete available without turning the view into an edit state.
    let deleteBtn = document.getElementById("delete-bike-btn");
    if (!deleteBtn) {
      deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.id = "delete-bike-btn";
      deleteBtn.className = "sc-secondary-btn";
      deleteBtn.textContent = "Delete";
      document.getElementById("bike-detail-editor")?.appendChild(deleteBtn);
    }
    deleteBtn.onclick = () => deleteBike(bike);

    if (detailsPanel) detailsPanel.style.display = "block";
  }

  function saveDetailChanges(originalBike) {
    const val = (id) => document.getElementById(id)?.value.trim() || "";
    const make = val("detail-make");
    const model = val("detail-model");
    const year = Number(val("detail-year"));
    const plate = val("detail-plate").toUpperCase();
    const mileage = Number(val("detail-mileage")) || 0;

    if (!make || !model || !plate) {
      return window.alert("Please enter the make, model, and plate number.");
    }
    if (!year || year < 1950 || year > new Date().getFullYear() + 1) {
      return window.alert("Please enter a valid year.");
    }
    if (mileage < 0) return window.alert("Mileage cannot be negative.");

    const all = readAllBikes();
    const duplicate = all.some(
      (b) =>
        b.ownerEmail === currentEmail() &&
        b.plate === plate &&
        b.id !== originalBike.id
    );
    if (duplicate) return window.alert("You already have a motorcycle with this plate number.");

    const idx = all.findIndex(
      (b) => b.id === originalBike.id && b.ownerEmail === currentEmail()
    );
    if (idx === -1) return window.alert("Motorcycle not found.");

    all[idx] = {
      ...all[idx],
      make,
      model,
      year,
      color: val("detail-color"),
      plate,
      mileage,
      customizations: val("detail-customizations-input")
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean),
      updatedAt: new Date().toISOString(),
    };

    writeAllBikes(all);
    renderAll();
    showDetails(all[idx]);
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
    if (bike) showDetails(bike);
  });
  
  dashListEl?.addEventListener("click", (e) => {
  const row = e.target.closest(".motorcycle_list_subparent");
  if (!row) return;
  const bike = getMyBikes().find((b) => b.id === row.dataset.bikeId);
  if (bike) showDetails(bike);
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