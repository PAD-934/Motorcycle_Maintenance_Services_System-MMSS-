// JAVASCRIPTS/parts.js
// Cart-to-appointment parts and inventory relationship: ../../BACKEND_DATA_CONTRACT.md

const INVENTORY_KEY = "motofix_parts";
localStorage.removeItem("motofix_inventory");

function loadInventory() {
  try {
    const saved = JSON.parse(localStorage.getItem(INVENTORY_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {}
  return [];
}

let partsData = loadInventory();
// Track selected states for items: { [id]: { source: 'buy' | 'bring', qty: number } }
let selectedCart = {};
const PARTS_REQUEST_KEY = "motofix_pending_parts";
const NOTIFICATION_STORE_KEY = "motofix_notifications";

// Customer cart parts are staged under motofix_pending_parts, then copied onto
// the appointment at booking; inventory deduction reads that appointment snapshot.
function savePartsRequest(parts) {
  const partsRequestId = `PR-${Date.now()}`;
  const customerEmail = (localStorage.getItem("userEmail") || "customer")
    .trim()
    .toLowerCase();
  localStorage.setItem(PARTS_REQUEST_KEY, JSON.stringify(parts));
  localStorage.setItem("motofix_pending_parts_request_id", partsRequestId);
  const current = JSON.parse(
    localStorage.getItem(NOTIFICATION_STORE_KEY) || "[]",
  );
  current.unshift({
    id: `N${Date.now()}`,
    title: "New parts request",
    message: `${customerEmail} added ${parts.length} part${parts.length === 1 ? "" : "s"} to an appointment.`,
    customerEmail,
    partsRequestId,
    audiences: ["admin", "master_admin", "customer"],
    createdAt: new Date().toISOString(),
    readBy: [],
  });
  localStorage.setItem(
    NOTIFICATION_STORE_KEY,
    JSON.stringify(current.slice(0, 100)),
  );
  window.dispatchEvent(new Event("motofix:notifications-changed"));
}

export function initPartsShop() {
  const tableBody = document.getElementById("parts-table-body");
  const searchInput = document.getElementById("parts-search-input");
  const filterChips = document.querySelectorAll(".parts-filter-chip");
  const detailsPanel = document.getElementById("parts-details-panel");
  const closePanelBtn = document.getElementById("close-parts-panel");
  const cartContainer = document.getElementById("cart-items-container");
  const cartSubtotalEl = document.getElementById("cart-subtotal");

  let currentCategory = "All";
  let searchQuery = "";

  function renderTable() {
    partsData = loadInventory();
    if (!tableBody) return;
    tableBody.innerHTML = "";

    const filtered = partsData.filter((item) => {
      const matchesCat =
        currentCategory === "All" || item.category === currentCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brand.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });

    if (filtered.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #71717a; padding: 24px;">No matching parts found</td></tr>`;
      return;
    }

    filtered.forEach((item) => {
      const isUnavailable = Number(item.stock) <= 0;
      const currentSource = selectedCart[item.sku]
        ? selectedCart[item.sku].source
        : "buy";
      const isAdded = !!selectedCart[item.sku];

      const tr = document.createElement("tr");
      tr.className = `parts-row${isAdded ? " row-selected" : ""}${isUnavailable ? " part-unavailable" : ""}`;
      tr.dataset.sku = item.sku;
      tr.tabIndex = isUnavailable ? -1 : 0;
      tr.setAttribute("aria-disabled", String(isUnavailable));
      tr.style.cursor = isUnavailable ? "not-allowed" : "pointer";
if (isAdded) {
  tr.style.background = "rgba(249, 115, 22, 0.1)";
  tr.style.boxShadow = "inset 3px 0 0 #f97316";
}
      tr.innerHTML = `
        <td>
          <div class="part-name-main">${item.name}</div>
        </td>
        <td><span class="part-sku-sub">${item.sku}</span></td>
        <td>${item.brand}</td>
        <td>${item.category}</td>
        <td>
          <div class="stock-indicator">
            <div class="stock-bar-bg"><div class="stock-bar-fill" style="width: ${Math.min((Number(item.stock) / Number(item.max || 60)) * 100, 100)}%;"></div></div>
            <span style="font-size: 12px; color: #a1a1aa;">${item.stock}</span>
          </div>
        </td>
        <td><span class="part-price">₱${Number(item.price || 0).toFixed(2)}</span></td>
        <td>
          <div class="source-switch-group">
            ${
              isUnavailable
                ? '<button class="source-btn out-of-stock-label" disabled>Out of Stock</button>'
                : `<button class="source-btn ${currentSource === "buy" ? "active-buy" : ""}" data-sku="${item.sku}" data-source="buy">Buy</button>
            <button class="source-btn ${currentSource === "bring" ? "active-bring" : ""}" data-sku="${item.sku}" data-source="bring">Bring Own</button>`
            }
          </div>
        </td>
      `;
      tableBody.appendChild(tr);
    });

    attachRowEventListeners();
  }

  // Click a row: add it to the cart, click again: remove it
  function toggleRow(sku) {
    const item = partsData.find((part) => part.sku === sku);
    if (!item || Number(item.stock) <= 0) return;
    if (selectedCart[sku]) {
      delete selectedCart[sku];
    } else {
      selectedCart[sku] = { source: "buy", qty: 1 };
    }
    renderTable();
    renderCartPanel();
  }

  function attachRowEventListeners() {
    // Toggle Source Switch (Buy vs Bring Own)
    document.querySelectorAll(".source-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation(); // don't trigger the row click
        const sku = btn.dataset.sku;
        const source = btn.getAttribute("data-source");
        const item = partsData.find((part) => part.sku === sku);
        if (!item || Number(item.stock) <= 0) return;

        if (!selectedCart[sku]) {
          selectedCart[sku] = { source: source, qty: 1 };
        } else {
          selectedCart[sku].source = source;
          // If switched to bring own, remove it from the buy cart list automatically
          if (source === "bring") {
            delete selectedCart[sku];
          }
        }
        renderTable();
        renderCartPanel();
      });
    });

    // Whole row is clickable
    document.querySelectorAll(".parts-row").forEach((row) => {
      const sku = row.dataset.sku;
      row.addEventListener("click", () => {
        if (row.getAttribute("aria-disabled") !== "true") toggleRow(sku);
      });
      row.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (row.getAttribute("aria-disabled") !== "true") toggleRow(sku);
        }
      });
    });
  }

  function renderCartPanel() {
    if (!cartContainer) return;
    cartContainer.innerHTML = "";

    const activeIds = Object.keys(selectedCart);
    if (activeIds.length === 0) {
      if (detailsPanel) detailsPanel.style.display = "none";
      return;
    }

    // Show the panel when items exist
    if (detailsPanel) detailsPanel.style.display = "flex";

    let subtotal = 0;

    activeIds.forEach((idStr) => {
      const sku = idStr;
      const item = partsData.find((part) => part.sku === sku);
      const cartItem = selectedCart[sku];
      if (!item || !cartItem) return;

      const card = document.createElement("div");
      card.className = "cart-item-card";

      if (cartItem.source === "buy") {
        subtotal += Number(item.price || 0) * cartItem.qty;
        card.innerHTML = `
          <div class="cart-item-top">
            <span class="cart-item-name">${item.name}</span>
            <span class="cart-item-source-badge">Shop Purchase</span>
          </div>
          <div class="cart-item-controls">
            <div class="qty-stepper">
              <button class="qty-btn dec-qty" data-sku="${sku}">-</button>
              <span class="qty-val">${cartItem.qty}</span>
              <button class="qty-btn inc-qty" data-sku="${sku}" ${cartItem.qty >= Number(item.stock) ? "disabled" : ""}>+</button>
            </div>
            <span class="cart-item-price">₱${(Number(item.price || 0) * cartItem.qty).toFixed(2)}</span>
          </div>
        `;
      } else {
        card.innerHTML = `
          <div class="cart-item-top">
            <span class="cart-item-name">${item.name}</span>
            <span class="cart-item-source-badge bring-own">Bringing own</span>
          </div>
          <p class="customer-supplied-msg">Customer supplied part. Inspection required upon arrival.</p>
        `;
      }
      cartContainer.appendChild(card);
    });

    if (cartSubtotalEl) {
      cartSubtotalEl.textContent = `₱${subtotal.toFixed(2)}`;
    }

    attachCartEventListeners();
  }

  function attachCartEventListeners() {
    document.querySelectorAll(".inc-qty").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const sku = e.currentTarget.dataset.sku;
        const item = partsData.find((part) => part.sku === sku);
        if (selectedCart[sku] && item && selectedCart[sku].qty < Number(item.stock)) {
          selectedCart[sku].qty++;
          renderCartPanel();
        }
      });
    });

    document.querySelectorAll(".dec-qty").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const sku = e.currentTarget.dataset.sku;
        if (selectedCart[sku]) {
          if (selectedCart[sku].qty > 1) {
            selectedCart[sku].qty--;
          } else {
            delete selectedCart[sku];
            renderTable();
          }
          renderCartPanel();
        }
      });
    });
  }

  // Search filter listener
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value;
      renderTable();
    });
  }

  // Category filter chips listener
  filterChips.forEach((chip) => {
    chip.addEventListener("click", (e) => {
      filterChips.forEach((c) => c.classList.remove("active"));
      e.target.classList.add("active");
      currentCategory = e.target.getAttribute("data-category");
      renderTable();
    });
  });

  // Close panel button
  if (closePanelBtn) {
    closePanelBtn.addEventListener("click", () => {
      if (detailsPanel) detailsPanel.style.display = "none";
    });
  }
  if (detailsPanel) {
    detailsPanel.addEventListener("click", (event) => {
      if (event.target === detailsPanel) detailsPanel.style.display = "none";
    });
  }
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && detailsPanel?.style.display === "flex") {
      detailsPanel.style.display = "none";
    }
  });

  const addToAppointmentBtn = document.getElementById("add-to-appointment-btn");
  if (addToAppointmentBtn) {
    addToAppointmentBtn.addEventListener("click", () => {
        const unavailableItem = Object.entries(selectedCart).find(([sku, selection]) => {
          const item = partsData.find((part) => part.sku === sku);
          return !item || Number(item.stock) <= 0 || (
            selection.source === "buy" && Number(item.stock) < selection.qty
          );
        });
        if (unavailableItem) {
          delete selectedCart[unavailableItem[0]];
          renderTable();
          renderCartPanel();
          alert("A selected part is no longer available. Please review your parts selection.");
          return;
        }
        const request = Object.entries(selectedCart)
        .map(([sku, selection]) => {
          const item = partsData.find((part) => part.sku === sku);
          return item
            ? {
                id: item.sku,
                name: item.name,
                sku: item.sku,
                source: selection.source,
                quantity: selection.qty,
                price: Number(item.price) || 0,
              }
            : null;
        })
        .filter(Boolean);

      if (request.length === 0) {
        alert("Please add at least one part first.");
        return;
      }

      savePartsRequest(request);
      selectedCart = {};
      renderTable();
      renderCartPanel();
      alert("Parts added to your next appointment request.");
    });
  }

  // Initial render
  renderTable();

  window.addEventListener("storage", (event) => {
    if (event.key !== INVENTORY_KEY) return;
    refreshInventoryView();
  });

  window.addEventListener("motofix:inventory-updated", refreshInventoryView);

  function refreshInventoryView() {
    partsData = loadInventory();
    Object.keys(selectedCart).forEach((sku) => {
      const part = partsData.find((item) => item.sku === sku);
      if (!part || Number(part.stock) <= 0) {
        delete selectedCart[sku];
      } else if (selectedCart[sku].source === "buy") {
        selectedCart[sku].qty = Math.min(selectedCart[sku].qty, Number(part.stock));
      }
    });
    renderTable();
    renderCartPanel();
  }
}