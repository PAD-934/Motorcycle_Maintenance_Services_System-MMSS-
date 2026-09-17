// JAVASCRIPTS/parts.js

const partsData = [
  {
    id: 1,
    name: "Engine Oil 10W-40 (1L)",
    sku: "OIL-10W40-1L",
    brand: "Motul",
    category: "Fluids",
    stock: 48,
    price: 180.0,
  },
  {
    id: 2,
    name: "Oil Filter — Honda PCX",
    sku: "FLT-OIL-PCX",
    brand: "Honda Genuine",
    category: "Filters",
    stock: 22,
    price: 95.0,
  },
  {
    id: 3,
    name: "Spark Plug CR8E",
    sku: "SPK-CR8E",
    brand: "NGK",
    category: "Ignition",
    stock: 64,
    price: 75.0,
  },
  {
    id: 4,
    name: "Air Filter — Yamaha NMAX",
    sku: "FLT-AIR-NMAX",
    brand: "Yamaha Genuine",
    category: "Filters",
    stock: 18,
    price: 220.0,
  },
  {
    id: 5,
    name: "Brake Pad Set — Front",
    sku: "BRK-PAD-FR",
    brand: "EBC",
    category: "Brakes",
    stock: 30,
    price: 450.0,
  },
  {
    id: 6,
    name: "Brake Fluid DOT4 (500ml)",
    sku: "FLD-DOT4-500",
    brand: "Brembo",
    category: "Fluids",
    stock: 25,
    price: 130.0,
  },
  {
    id: 7,
    name: "Chain Kit 428 (110L)",
    sku: "CHN-428-110",
    brand: "DID",
    category: "Drivetrain",
    stock: 12,
    price: 680.0,
  },
  {
    id: 8,
    name: "Front Sprocket 15T",
    sku: "SPR-FR-15T",
    brand: "Renthal",
    category: "Drivetrain",
    stock: 20,
    price: 240.0,
  },
  {
    id: 9,
    name: "Rear Sprocket 42T",
    sku: "SPR-RR-42T",
    brand: "Renthal",
    category: "Drivetrain",
    stock: 15,
    price: 380.0,
  },
  {
    id: 10,
    name: "Fork Oil 15W (1L)",
    sku: "OIL-FRK-15W",
    brand: "Motul",
    category: "Fluids",
    stock: 16,
    price: 210.0,
  },
  {
    id: 11,
    name: "Carburetor Jet Kit",
    sku: "CARB-JET-UNI",
    brand: "Universal",
    category: "Engine",
    stock: 8,
    price: 350.0,
  },
  {
    id: 12,
    name: "Battery 12V 5Ah",
    sku: "BAT-12V-5Ah",
    brand: "Yuasa",
    category: "Electrical",
    stock: 10,
    price: 850.0,
  },
  {
    id: 13,
    name: "Iridium Spark Plug IX",
    sku: "SPK-IRIDIUM",
    brand: "NGK",
    category: "Ignition",
    stock: 40,
    price: 320.0,
  },
  {
    id: 14,
    name: "Clutch Lining Set",
    sku: "CLT-SET-ADV",
    brand: "FCC",
    category: "Engine",
    stock: 14,
    price: 950.0,
  },
  {
    id: 15,
    name: "Radiator Coolant (1L)",
    sku: "CLNT-PRE-1L",
    brand: "Prestone",
    category: "Fluids",
    stock: 35,
    price: 190.0,
  },
  {
    id: 16,
    name: "Handlebar Grips",
    sku: "GRP-PRO-TAPER",
    brand: "Pro Taper",
    category: "Accessories",
    stock: 25,
    price: 280.0,
  },
  {
    id: 17,
    name: "LED Headlight Bulb H4",
    sku: "LED-H4-PHL",
    brand: "Philips",
    category: "Electrical",
    stock: 19,
    price: 550.0,
  },
  {
    id: 18,
    name: "Tubeless Tire 90/90-14",
    sku: "TRE-9090-14",
    brand: "FDR",
    category: "Tires",
    stock: 11,
    price: 1250.0,
  },
  {
    id: 19,
    name: "Braided Brake Hose",
    sku: "HOSE-BRK-UNI",
    brand: "Earl's",
    category: "Brakes",
    stock: 16,
    price: 720.0,
  },
  {
    id: 20,
    name: "Exhaust Gasket Ring",
    sku: "GSK-EXH-UNI",
    brand: "Universal",
    category: "Engine",
    stock: 50,
    price: 45.0,
  },
];

// Track selected states for items: { [id]: { source: 'buy' | 'bring', qty: number } }
let selectedCart = {};
const PARTS_REQUEST_KEY = "motofix_pending_parts";
const NOTIFICATION_STORE_KEY = "motofix_notifications";

function savePartsRequest(parts) {
  localStorage.setItem(PARTS_REQUEST_KEY, JSON.stringify(parts));
  const current = JSON.parse(
    localStorage.getItem(NOTIFICATION_STORE_KEY) || "[]",
  );
  const email = localStorage.getItem("userEmail") || "customer";
  current.unshift({
    id: `N${Date.now()}`,
    title: "New parts request",
    message: `${email} added ${parts.length} part${parts.length === 1 ? "" : "s"} to an appointment.`,
    audiences: ["admin", "master_admin", "mechanic"],
    createdAt: new Date().toISOString(),
    readBy: [],
  });
  localStorage.setItem(
    NOTIFICATION_STORE_KEY,
    JSON.stringify(current.slice(0, 100)),
  );
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
      tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #71717a; padding: 24px;">No matching parts found</td></tr>`;
      return;
    }

    filtered.forEach((item) => {
      const currentSource = selectedCart[item.id]
        ? selectedCart[item.id].source
        : "buy";
      const isAdded = !!selectedCart[item.id];
      const isBringOwn = currentSource === "bring";

      const tr = document.createElement("tr");
      tr.innerHTML = `
                <td>
                    <div class="part-name-main">${item.name}</div>
                </td>
                <td><span class="part-sku-sub">${item.sku}</span></td>
                <td>${item.brand}</td>
                <td>${item.category}</td>
                <td>
                    <div class="stock-indicator">
                        <div class="stock-bar-bg"><div class="stock-bar-fill" style="width: ${Math.min(item.stock * 2, 100)}%;"></div></div>
                        <span style="font-size: 12px; color: #a1a1aa;">${item.stock}</span>
                    </div>
                </td>
                <td><span class="part-price">₱${item.price.toFixed(2)}</span></td>
                <td>
                    <div class="source-switch-group">
                        <button class="source-btn ${currentSource === "buy" ? "active-buy" : ""}" data-id="${item.id}" data-source="buy">Buy</button>
                        <button class="source-btn ${currentSource === "bring" ? "active-bring" : ""}" data-id="${item.id}" data-source="bring">Bring Own</button>
                    </div>
                </td>
                <td>
                    <button class="parts-add-btn" data-id="${item.id}" ${isBringOwn ? 'disabled style="opacity: 0.4; cursor: not-allowed;"' : ""}>
                        ${isAdded && !isBringOwn ? "Added ✓" : "Add"}
                    </button>
                </td>
            `;
      tableBody.appendChild(tr);
    });

    attachRowEventListeners();
  }

  function attachRowEventListeners() {
    // Toggle Source Switch (Buy vs Bring Own)
    document.querySelectorAll(".source-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = parseInt(e.target.getAttribute("data-id"));
        const source = e.target.getAttribute("data-source");

        if (!selectedCart[id]) {
          selectedCart[id] = { source: source, qty: 1 };
        } else {
          selectedCart[id].source = source;
          // If switched to bring own, remove it from the buy cart list automatically
          if (source === "bring") {
            delete selectedCart[id];
          }
        }
        renderTable();
        renderCartPanel();
      });
    });

    // Add / Remove from Cart Button
    document.querySelectorAll(".parts-add-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        if (btn.disabled) return;

        const id = parseInt(e.target.getAttribute("data-id"));

        if (!selectedCart[id]) {
          selectedCart[id] = { source: "buy", qty: 1 };
        } else {
          delete selectedCart[id]; // Toggle off if already added
        }

        renderTable();
        renderCartPanel();
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
      const id = parseInt(idStr);
      const item = partsData.find((p) => p.id === id);
      const cartItem = selectedCart[id];
      if (!item || !cartItem) return;

      const card = document.createElement("div");
      card.className = "cart-item-card";

      if (cartItem.source === "buy") {
        subtotal += item.price * cartItem.qty;
        card.innerHTML = `
                    <div class="cart-item-top">
                        <span class="cart-item-name">${item.name}</span>
                        <span class="cart-item-source-badge">Shop Purchase</span>
                    </div>
                    <div class="cart-item-controls">
                        <div class="qty-stepper">
                            <button class="qty-btn dec-qty" data-id="${id}">-</button>
                            <span class="qty-val">${cartItem.qty}</span>
                            <button class="qty-btn inc-qty" data-id="${id}">+</button>
                        </div>
                        <span class="cart-item-price">₱${(item.price * cartItem.qty).toFixed(2)}</span>
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
        const id = parseInt(e.target.getAttribute("data-id"));
        if (selectedCart[id]) {
          selectedCart[id].qty++;
          renderCartPanel();
        }
      });
    });

    document.querySelectorAll(".dec-qty").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = parseInt(e.target.getAttribute("data-id"));
        if (selectedCart[id]) {
          if (selectedCart[id].qty > 1) {
            selectedCart[id].qty--;
          } else {
            delete selectedCart[id];
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

  const addToAppointmentBtn = document.getElementById("add-to-appointment-btn");
  if (addToAppointmentBtn) {
    addToAppointmentBtn.addEventListener("click", () => {
      const request = Object.entries(selectedCart)
        .map(([id, selection]) => {
          const item = partsData.find((part) => part.id === Number(id));
          return item
            ? {
                id: item.id,
                name: item.name,
                sku: item.sku,
                source: selection.source,
                quantity: selection.qty,
                price: item.price,
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
}
