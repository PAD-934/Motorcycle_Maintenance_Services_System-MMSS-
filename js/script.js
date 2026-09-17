/* =========================================================
   MOTOFIX ADMIN DASHBOARD — sample data + rendering logic
   Replace the DATA object contents with real API calls
   whenever you're ready to connect a backend.
========================================================= */

const DATA = {
  pageMeta: {
    dashboard: { title: "Dashboard", sub: "Welcome back, Carlos" },
    appointments: { title: "Appointments", sub: "Manage service scheduling" },
    services: {
      title: "Services & Types",
      sub: "Browse all service offerings",
    },
    customization: {
      title: "Motorcycle Customization",
      sub: "Bike profiles & custom builds",
    },
    inventory: {
      title: "Inventory & Parts",
      sub: "Parts catalog and stock management",
    },
    billing: {
      title: "Billing & Reports",
      sub: "Invoices, tax records & revenue analytics",
    },
    jobs: { title: "Mechanic Jobs", sub: "Job transaction records" },
    users: { title: "User Management", sub: "Customers, mechanics & admins" },
    "master-mechanics": {
      title: "Master Control",
      sub: "Mechanic Account Manager",
    },
  },

  revenue: [
    { month: "Feb", value: 52000 },
    { month: "Mar", value: 63000 },
    { month: "Apr", value: 58000 },
    { month: "May", value: 71000 },
    { month: "Jun", value: 83000 },
    { month: "Jul", value: 34000 },
  ],

  serviceMix: [
    { label: "Maintenance", pct: 38, color: "#ff6b1a" },
    { label: "Engine", pct: 22, color: "#f5b942" },
    { label: "Customization", pct: 18, color: "#3b82f6" },
    { label: "Brakes", pct: 12, color: "#22c55e" },
    { label: "Other", pct: 10, color: "#a78bfa" },
  ],

  appointments: [
    {
      id: "A1",
      customer: "Miguel Torres",
      phone: "+63 912 100 0001",
      initials: "MT",
      bike: "2022 Honda PCX 160",
      services: ["Basic Oil Change", "Brake System Service"],
      date: "2026-07-24",
      time: "09:00",
      mechanic: "Ramon Santos",
      status: "Confirmed",
    },
    {
      id: "A2",
      customer: "Jose Bautista",
      phone: "+63 912 100 0002",
      initials: "JB",
      bike: "2023 Kawasaki Dominar 400",
      services: ["Full Tune-Up"],
      date: "2026-07-24",
      time: "11:00",
      mechanic: "Jake Reyes",
      status: "In Progress",
    },
    {
      id: "A3",
      customer: "Ana Flores",
      phone: "+63 912 100 0003",
      initials: "AF",
      bike: "2020 Suzuki Gixxer 150",
      services: ["Chain & Sprocket Kit"],
      date: "2026-07-25",
      time: "10:00",
      mechanic: "Ramon Santos",
      status: "Pending",
    },
    {
      id: "A4",
      customer: "Miguel Torres",
      phone: "+63 912 100 0001",
      initials: "MT",
      bike: "2021 Yamaha NMAX 155",
      services: ["Suspension Setup", "Performance Exhaust Install"],
      date: "2026-07-28",
      time: "14:00",
      mechanic: null,
      status: "Pending",
    },
    {
      id: "A5",
      customer: "Jose Bautista",
      phone: "+63 912 100 0002",
      initials: "JB",
      bike: "2023 Kawasaki Dominar 400",
      services: ["Engine Overhaul"],
      date: "2026-07-22",
      time: "08:00",
      mechanic: "Ramon Santos",
      status: "Complete transaction",
    },
  ],

  services: [
    {
      code: "S1",
      name: "Basic Oil Change",
      category: "Maintenance",
      price: 350,
      hours: 0.75,
      hoursLabel: "45 min",
      desc: "Engine oil + filter replacement",
    },
    {
      code: "S2",
      name: "Full Tune-Up",
      category: "Maintenance",
      price: 1200,
      hours: 2,
      hoursLabel: "2.0 hrs",
      desc: "Spark plugs, air filter, carburetor clean, chain adj.",
    },
    {
      code: "S3",
      name: "Brake System Service",
      category: "Safety",
      price: 800,
      hours: 1.5,
      hoursLabel: "1.5 hrs",
      desc: "Brake pads, fluid flush, rotor inspection",
    },
    {
      code: "S4",
      name: "Tire Replacement",
      category: "Tires",
      price: 600,
      hours: 1,
      hoursLabel: "1.0 hrs",
      desc: "Front or rear tire mount & balance",
    },
    {
      code: "S5",
      name: "Engine Overhaul",
      category: "Engine",
      price: 8500,
      hours: 8,
      hoursLabel: "8.0 hrs",
      desc: "Full engine rebuild, gaskets, valves",
    },
    {
      code: "S6",
      name: "Electrical Diagnostics",
      category: "Electrical",
      price: 500,
      hours: 1,
      hoursLabel: "1.0 hrs",
      desc: "Battery, charging system, wiring inspection",
    },
    {
      code: "S7",
      name: "Suspension Setup",
      category: "Suspension",
      price: 1500,
      hours: 2.5,
      hoursLabel: "2.5 hrs",
      desc: "Fork oil, rear shock, alignment",
    },
    {
      code: "S8",
      name: "Custom Paint Job",
      category: "Customization",
      price: 4500,
      hours: 48,
      hoursLabel: "48.0 hrs",
      desc: "Full custom paint with clear coat",
    },
    {
      code: "S9",
      name: "Performance Exhaust Install",
      category: "Customization",
      price: 2200,
      hours: 3,
      hoursLabel: "3.0 hrs",
      desc: "Aftermarket exhaust system fitting",
    },
    {
      code: "S10",
      name: "Chain & Sprocket Kit",
      category: "Drivetrain",
      price: 950,
      hours: 1.5,
      hoursLabel: "1.5 hrs",
      desc: "Chain + front/rear sprocket replacement",
    },
  ],

  bikes: [
    {
      name: "2022 Honda PCX 160",
      detail: "Pearl White · ABC 1234",
      owner: "Miguel Torres",
      odo: "12,450",
      mods: ["Aftermarket exhaust", "LED headlights"],
    },
    {
      name: "2021 Yamaha NMAX 155",
      detail: "Matte Black · XYZ 5678",
      owner: "Miguel Torres",
      odo: "28,300",
      mods: [],
    },
    {
      name: "2023 Kawasaki Dominar 400",
      detail: "Ebony Black · KLM 9012",
      owner: "Jose Bautista",
      odo: "5,200",
      mods: ["Crash guards", "Tank bag"],
    },
    {
      name: "2020 Suzuki Gixxer 150",
      detail: "Metallic Triton Blue · QRS 3456",
      owner: "Ana Flores",
      odo: "41,600",
      mods: ["Racing exhaust", "Custom decals"],
    },
  ],

  inventory: [
    {
      name: "Engine Oil 10W-40 (1L)",
      sku: "OIL-10W40-1L",
      brand: "Motul",
      category: "Fluids",
      stock: 48,
      max: 60,
      price: 180,
    },
    {
      name: "Oil Filter — Honda PCX",
      sku: "FLT-OIL-PCX",
      brand: "Honda Genuine",
      category: "Filters",
      stock: 22,
      max: 60,
      price: 95,
    },
    {
      name: "Spark Plug CR8E",
      sku: "SPK-CR8E",
      brand: "NGK",
      category: "Ignition",
      stock: 64,
      max: 70,
      price: 75,
    },
    {
      name: "Air Filter — Yamaha NMAX",
      sku: "FLT-AIR-NMAX",
      brand: "Yamaha Genuine",
      category: "Filters",
      stock: 18,
      max: 60,
      price: 220,
    },
    {
      name: "Brake Pad Set — Front",
      sku: "BRK-PAD-FR",
      brand: "EBC",
      category: "Brakes",
      stock: 30,
      max: 60,
      price: 450,
    },
    {
      name: "Brake Fluid DOT4 (500ml)",
      sku: "FLD-DOT4-500",
      brand: "Brembo",
      category: "Fluids",
      stock: 25,
      max: 60,
      price: 130,
    },
    {
      name: "Chain Kit 428 (110L)",
      sku: "CHN-428-110",
      brand: "DID",
      category: "Drivetrain",
      stock: 12,
      max: 60,
      price: 680,
    },
    {
      name: "Front Sprocket 15T",
      sku: "SPR-FR-15T",
      brand: "Renthal",
      category: "Drivetrain",
      stock: 20,
      max: 60,
      price: 240,
    },
    {
      name: "Rear Sprocket 42T",
      sku: "SPR-RR-42T",
      brand: "Renthal",
      category: "Drivetrain",
      stock: 15,
      max: 60,
      price: 380,
    },
    {
      name: "Fork Oil 15W (1L)",
      sku: "OIL-FRK-15W",
      brand: "Motul",
      category: "Fluids",
      stock: 16,
      max: 60,
      price: 210,
    },
    {
      name: "Carburetor Jet Kit",
      sku: "CARB-JET-UNI",
      brand: "Universal",
      category: "Engine",
      stock: 8,
      max: 60,
      price: 350,
    },
    {
      name: "Battery 12V 5Ah",
      sku: "BAT-12V-5AH",
      brand: "Yuasa",
      category: "Electrical",
      stock: 10,
      max: 60,
      price: 850,
    },
  ],

  invoices: [
    {
      id: "#INV001",
      customer: "Jose Bautista",
      jobRef: "J1",
      items: 4,
      subtotal: 11510,
      vat: 1381.2,
      total: 12891.2,
      status: "Paid",
      date: "2026-07-22",
    },
  ],

  jobs: [
    {
      id: "J1",
      customer: "Jose Bautista",
      bike: "2023 Kawasaki Dominar 400",
      mechanic: "Ramon Santos",
      initials: "RS",
      parts: 2,
      cost: 3010,
      note: "Found worn piston rings",
      status: "Completed",
    },
    {
      id: "J2",
      customer: "Jose Bautista",
      bike: "2023 Kawasaki Dominar 400",
      mechanic: "Jake Reyes",
      initials: "DC",
      parts: 3,
      cost: 1275,
      note: "Carburetor very dirty",
      status: "In Progress",
    },
  ],

  users: [
    {
      name: "Carlos Reyes",
      role: "Admin",
      email: "admin@motofix.com",
      phone: "+63 912 000 0001",
      since: "2022-01-15",
      initials: "CR",
    },
    {
      name: "Ramon Santos",
      role: "Mechanic",
      email: "mechanic1@motofix.com",
      phone: "+63 912 000 0002",
      since: "2022-03-10",
      initials: "RS",
    },
    {
      name: "Jake Reyes",
      role: "Mechanic",
      email: "mechanic2@motofix.com",
      phone: "+63 912 000 0003",
      since: "2023-06-01",
      initials: "DC",
    },
    {
      name: "Miguel Torres",
      role: "Customer",
      email: "miguel@email.com",
      phone: "+63 912 100 0001",
      since: "2023-08-20",
      initials: "MT",
    },
    {
      name: "Jose Bautista",
      role: "Customer",
      email: "jose@email.com",
      phone: "+63 912 100 0002",
      since: "2024-01-05",
      initials: "JB",
    },
    {
      name: "Ana Flores",
      role: "Customer",
      email: "ana@email.com",
      phone: "+63 912 100 0003",
      since: "2024-03-12",
      initials: "AF",
    },
  ],

  masterEmployees: [
    {
      id: 1,
      name: "Carlos Reyes",
      role: "Admin",
      email: "admin@motofix.com",
      status: "Active",
    },
    {
      id: 2,
      name: "Ramon Santos",
      role: "Mechanic",
      email: "mechanic1@motofix.com",
      status: "Active",
    },
    {
      id: 3,
      name: "Jake Reyes",
      role: "Mechanic",
      email: "mechanic2@motofix.com",
      status: "Active",
    },
  ],
};

/* =========================================================
   UPDATE BLOCK 1: LOCAL STORAGE SYNC & INITIALIZATION
   Ensures local storage gets populated with default dataset
   if empty, and syncs DATA variables for seamless live demo.
========================================================= */
function initLocalStorageData() {
  if (!localStorage.getItem("motofix_parts")) {
    localStorage.setItem("motofix_parts", JSON.stringify(DATA.inventory));
  } else {
    DATA.inventory = JSON.parse(localStorage.getItem("motofix_parts"));
  }

  if (!localStorage.getItem("motofix_services")) {
    localStorage.setItem("motofix_services", JSON.stringify(DATA.services));
  } else {
    DATA.services = JSON.parse(localStorage.getItem("motofix_services"));
  }
}
initLocalStorageData();

/* ===================== HELPERS ===================== */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const peso = (n) =>
  "₱" +
  Number(n).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function statusBadge(status) {
  const map = {
    Pending: "badge-pending",
    Confirmed: "badge-confirmed",
    "In Progress": "badge-inprogress",
    Completed: "badge-completed",
    Cancelled: "badge-cancelled",
    Paid: "badge-paid",
    Active: "badge-active",
  };
  return `<span class="badge ${map[status] || ""}">${status.toUpperCase()}</span>`;
}

function avatarInitials(name) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function renderAdminNotifications() {
  const button = document.getElementById("adminBellBtn");
  if (!button) return;
  const role = localStorage.getItem("userRole") || "admin";
  const notifications = JSON.parse(
    localStorage.getItem("motofix_notifications") || "[]",
  ).filter((notification) => notification.audiences?.includes(role));
  let panel = document.getElementById("adminNotifPanel");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "adminNotifPanel";
    panel.style.cssText =
      "position:fixed;top:64px;right:24px;width:320px;max-height:380px;overflow:auto;background:#131313;border:1px solid #232323;border-radius:12px;box-shadow:0 16px 40px rgba(0,0,0,.45);padding:8px;z-index:100;display:none;";
    document.body.appendChild(panel);
  }
  panel.innerHTML = `<div style="padding:10px 12px;font-weight:700;border-bottom:1px solid #232323;">Notifications</div>${
    notifications.length
      ? notifications
          .slice(0, 8)
          .map(
            (notification) =>
              `<div style="padding:11px 12px;border-bottom:1px solid #1c1c1c;"><strong style="display:block;font-size:13px;">${notification.title}</strong><span style="display:block;margin-top:3px;color:#9a9a9a;font-size:12px;">${notification.message}</span></div>`,
          )
          .join("")
      : '<div style="padding:14px 12px;color:#9a9a9a;font-size:12px;">No new notifications.</div>'
  }`;
  const dot = button.querySelector(".dot");
  if (dot) dot.style.display = notifications.length ? "block" : "none";
  button.onclick = (event) => {
    event.stopPropagation();
    panel.style.display = panel.style.display === "none" ? "block" : "none";
  };
  document.addEventListener(
    "click",
    (event) => {
      if (!panel.contains(event.target) && !button.contains(event.target))
        panel.style.display = "none";
    },
    { once: true },
  );
}

/* ===================== NAVIGATION ===================== */
function goToPage(page) {
  $$(".nav-item").forEach((b) =>
    b.classList.toggle("active", b.dataset.page === page),
  );
  $$(".page").forEach((p) =>
    p.classList.toggle("active", p.id === "page-" + page),
  );
  const meta = DATA.pageMeta[page];
  if (meta) {
    $("#pageTitle").textContent = meta.title;
    $("#pageSubtitle").textContent = meta.sub;
  }
  if (window.innerWidth <= 860) $("#sidebar").classList.remove("open");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

$$(".nav-item").forEach((btn) =>
  btn.addEventListener("click", () => goToPage(btn.dataset.page)),
);
$$("[data-page].link-arrow").forEach((a) =>
  a.addEventListener("click", (e) => {
    e.preventDefault();
    goToPage(a.dataset.page);
  }),
);

/* ===================== NAVIGATION & SIDEBAR ===================== */
const sidebar = $("#sidebar");
const menuToggle = $("#menuToggle");
const sidebarBackdrop = $("#sidebarBackdrop");

// Make sidebar closed/collapsed by default on desktop view on initial load
if (window.innerWidth > 860) {
  sidebar.classList.add("collapsed");
}

function updateSidebarState() {
  const isMobile = window.innerWidth <= 860;
  const isOpen = isMobile
    ? sidebar.classList.contains("open")
    : !sidebar.classList.contains("collapsed");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
}

function toggleSidebar() {
  const isMobile = window.innerWidth <= 860;

  if (isMobile) {
    sidebar.classList.toggle("open");
  } else {
    sidebar.classList.toggle("collapsed");
  }

  // Keep desktop dashboards readable while the sidebar is open.
  if (sidebarBackdrop) {
    if (isMobile) {
      sidebarBackdrop.classList.toggle(
        "active",
        sidebar.classList.contains("open"),
      );
    } else {
      sidebarBackdrop.classList.remove("active");
    }
  }

  updateSidebarState();
}

if (menuToggle) {
  menuToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleSidebar();
  });
}

// Clicking the backdrop closes/collapses the sidebar on any screen size
if (sidebarBackdrop) {
  sidebarBackdrop.addEventListener("click", () => {
    toggleSidebar();
  });
}

// Auto-close on mobile / Auto-collapse on desktop when a nav item is clicked
if (sidebar) {
  sidebar.addEventListener("click", (e) => {
    const clickedItem = e.target.closest("a, button"); // Target links or buttons inside sidebar

    if (clickedItem) {
      const isMobile = window.innerWidth <= 860;

      if (isMobile) {
        sidebar.classList.remove("open");
      } else {
        sidebar.classList.add("collapsed");
      }

      if (sidebarBackdrop) {
        sidebarBackdrop.classList.remove("active");
      }

      updateSidebarState();
    }
  });
}

window.addEventListener("resize", () => {
  updateSidebarState();

  // Only mobile uses a scrim; desktop keeps the dashboard unobstructed.
  if (sidebarBackdrop) {
    const isMobile = window.innerWidth <= 860;
    const isOpen = isMobile ? sidebar.classList.contains("open") : false;

    if (!isOpen) {
      sidebarBackdrop.classList.remove("active");
    }
  }
});

updateSidebarState();

const userMenu = $("#userMenu");
const userMenuToggle = $("#userMenuToggle");
userMenuToggle.addEventListener("click", () => {
  const isOpen = userMenu.classList.toggle("open");
  userMenuToggle.setAttribute("aria-expanded", String(isOpen));
});
document.addEventListener("click", (e) => {
  if (!userMenu.contains(e.target)) {
    userMenu.classList.remove("open");
    userMenuToggle.setAttribute("aria-expanded", "false");
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    userMenu.classList.remove("open");
    userMenuToggle.setAttribute("aria-expanded", "false");
  }
});
$("#signOutBtn").addEventListener("click", () => {
  window.location.href = "login.html";
});

/* ===================== MODAL ===================== */
function openModal(title, bodyHTML) {
  $("#modalTitle").textContent = title;
  $("#modalBody").innerHTML = bodyHTML;
  $("#modalBackdrop").classList.add("open");
}
$("#modalClose").addEventListener("click", () =>
  $("#modalBackdrop").classList.remove("open"),
);
$("#modalBackdrop").addEventListener("click", (e) => {
  if (e.target.id === "modalBackdrop")
    $("#modalBackdrop").classList.remove("open");
});

// 1. Hooks up the "Add New Part" button to your existing modal
document.getElementById("openAddPartBtn")?.addEventListener("click", () => {
  openModal(
    "Add New Part",
    `
        <form id="addPartForm">
            <div style="margin-bottom: 12px;">
                <label style="display:block; margin-bottom:4px; font-weight:500;">Part Name</label>
                <input type="text" id="newPartName" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
            </div>
            <div style="margin-bottom: 12px;">
                <label style="display:block; margin-bottom:4px; font-weight:500;">SKU</label>
                <input type="text" id="newPartSku" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
            </div>
            <div style="margin-bottom: 12px;">
                <label style="display:block; margin-bottom:4px; font-weight:500;">Brand</label>
                <input type="text" id="newPartBrand" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
            </div>
            <div style="margin-bottom: 12px;">
                <label style="display:block; margin-bottom:4px; font-weight:500;">Category</label>
                <input type="text" id="newPartCategory" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
            </div>
            <div style="margin-bottom: 12px;">
                <label style="display:block; margin-bottom:4px; font-weight:500;">Initial Stock</label>
                <input type="number" id="newPartStock" min="0" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
            </div>
            <div style="margin-bottom: 12px;">
                <label style="display:block; margin-bottom:4px; font-weight:500;">Unit Price (₱)</label>
                <input type="number" id="newPartPrice" step="0.01" min="0" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
            </div>
            <button type="submit" class="btn-primary" style="width:100%; margin-top:10px;">Save Part</button>
        </form>
    `,
  );
});

// 2. Hooks up the "Add New Service" button to your existing modal
document.getElementById("openAddServiceBtn")?.addEventListener("click", () => {
  openModal(
    "Add New Service",
    `
        <form id="addServiceForm">
            <div style="margin-bottom: 12px;">
                <label style="display:block; margin-bottom:4px; font-weight:500;">Service Name</label>
                <input type="text" id="newServiceName" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
            </div>
            <div style="margin-bottom: 12px;">
                <label style="display:block; margin-bottom:4px; font-weight:500;">Category</label>
                <input type="text" id="newServiceCategory" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
            </div>
            <div style="margin-bottom: 12px;">
                <label style="display:block; margin-bottom:4px; font-weight:500;">Description</label>
                <textarea id="newServiceDesc" rows="3" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;"></textarea>
            </div>
            <div style="margin-bottom: 12px;">
                <label style="display:block; margin-bottom:4px; font-weight:500;">Price (₱)</label>
                <input type="number" id="newServicePrice" step="0.01" min="0" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
            </div>
            <div style="margin-bottom: 12px;">
                <label style="display:block; margin-bottom:4px; font-weight:500;">Duration Label (e.g. 1.0 hrs)</label>
                <input type="text" id="newServiceHours" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;" value="1.0 hrs">
            </div>
            <button type="submit" class="btn-primary" style="width:100%; margin-top:10px;">Save Service</button>
        </form>
    `,
  );
});

/* =========================================================
   UPDATE BLOCK 2: LOCAL STORAGE FORM SUBMISSION HANDLERS
   Captures form inputs, stores items into localStorage,
   updates runtime DATA array, and re-renders UI components.
========================================================= */
document.addEventListener("submit", (e) => {
  // Handle Part Form Submit
  if (e.target && e.target.id === "addPartForm") {
    e.preventDefault();

    const newPart = {
      name: document.getElementById("newPartName").value,
      sku: document.getElementById("newPartSku").value,
      brand: document.getElementById("newPartBrand").value,
      category: document.getElementById("newPartCategory").value,
      stock: parseInt(document.getElementById("newPartStock").value, 10),
      max: 60,
      price: parseFloat(document.getElementById("newPartPrice").value),
    };

    // Update local storage array
    let partsList = JSON.parse(localStorage.getItem("motofix_parts")) || [];
    partsList.push(newPart);
    localStorage.setItem("motofix_parts", JSON.stringify(partsList));

    // Sync main DATA object and re-render inventory view
    DATA.inventory = partsList;
    renderInvFilters();
    renderInventoryTable();

    // Close modal
    document.getElementById("modalBackdrop").classList.remove("open");
  }

  // Handle Service Form Submit
  if (e.target && e.target.id === "addServiceForm") {
    e.preventDefault();

    const newServiceCode = "S" + (DATA.services.length + 1);
    const newService = {
      code: newServiceCode,
      name: document.getElementById("newServiceName").value,
      category: document.getElementById("newServiceCategory").value,
      price: parseFloat(document.getElementById("newServicePrice").value),
      hours: 1,
      hoursLabel: document.getElementById("newServiceHours").value,
      desc: document.getElementById("newServiceDesc").value,
    };

    // Update local storage array
    let servicesList =
      JSON.parse(localStorage.getItem("motofix_services")) || [];
    servicesList.push(newService);
    localStorage.setItem("motofix_services", JSON.stringify(servicesList));

    // Sync main DATA object and re-render services view
    DATA.services = servicesList;
    renderServiceFilters();
    renderServicesGrid();

    // Close modal
    document.getElementById("modalBackdrop").classList.remove("open");
  }
});

/* ===================== DASHBOARD: BAR CHART ===================== */
function renderBarChart(containerId, data) {
  const el = $("#" + containerId);
  if (!el) return;
  const max = Math.max(...data.map((d) => d.value));
  const step = Math.ceil(max / 4 / 25000) * 25000 || 25000;
  const top = step * 4;

  const yLabels = [4, 3, 2, 1, 0].map(
    (i) => `₱${Math.round((step * i) / 1000)}k`,
  );

  el.innerHTML = `
    <div class="bar-ylabels">${yLabels.map((l) => `<span>${l}</span>`).join("")}</div>
    ${data
      .map(
        (d) => `
      <div class="bar-col">
        <div class="bar" style="height:${((d.value / top) * 100).toFixed(1)}%" title="${peso(d.value)}"></div>
        <div class="bar-label">${d.month}</div>
      </div>
    `,
      )
      .join("")}
  `;
}

/* ===================== DASHBOARD: PIE CHART ===================== */
function renderPieChart(pieId, legendId, data) {
  const pieEl = $("#" + pieId);
  const legendEl = $("#" + legendId);
  if (!pieEl || !legendEl) return;
  let acc = 0;
  const stops = data
    .map((d) => {
      const start = acc;
      acc += d.pct;
      return `${d.color} ${start}% ${acc}%`;
    })
    .join(", ");
  pieEl.style.background = `conic-gradient(${stops})`;

  legendEl.innerHTML = data
    .map(
      (d) => `
    <li>
      <span class="swatch" style="background:${d.color}"></span>
      <span class="lname">${d.label}</span>
      <span class="lval">${d.pct}%</span>
    </li>
  `,
    )
    .join("");
}

/* ===================== SHARED APPOINTMENT STORAGE ===================== */
const APPOINTMENT_STORAGE_KEY = "motofix_appointments";

function syncAppointmentsFromStorage() {
  const stored = JSON.parse(
    localStorage.getItem(APPOINTMENT_STORAGE_KEY) || "[]",
  );
  if (Array.isArray(stored) && stored.length > 0) {
    DATA.appointments = stored.map((item) => ({
      id: item.id || `A${DATA.appointments.length + 1}`,
      customer: item.customer || "Customer",
      phone: item.phone || "N/A",
      initials: item.initials || "CU",
      bike: item.bike || item.motorcycle || "Unknown Motorcycle",
      services: Array.isArray(item.services)
        ? item.services
        : [item.services || "Service"],
      date: item.date || "",
      time: item.time || "",
      mechanic: item.mechanic || null,
      status: item.status || "Pending",
      notes: item.notes || "",
      parts: Array.isArray(item.parts) ? item.parts : [],
      createdAt: item.createdAt || new Date().toISOString(),
    }));
  }
}

function persistAppointments() {
  localStorage.setItem(
    APPOINTMENT_STORAGE_KEY,
    JSON.stringify(DATA.appointments),
  );
}

/* ===================== APPOINTMENTS TABLE & NATIVE MODAL ===================== */

const STATUS_FLOW = [
  "Pending",
  "Confirmed",
  "In Progress",
  "Work Finished (unpaid)",
  "Complete transaction",
  "Cancelled",
];

// Consistent Custom Status Badge Generator for Table Rows & Modals
function getCustomStatusBadge(status) {
  let bg = "rgba(255,255,255,0.1)";
  let color = "#ffffff";

  if (status === "Pending") {
    bg = "rgba(234, 179, 8, 0.15)";
    color = "#facc15";
  } else if (status === "Confirmed") {
    bg = "rgba(59, 130, 246, 0.15)";
    color = "#60a5fa";
  } else if (status === "In Progress") {
    bg = "rgba(249, 115, 22, 0.15)";
    color = "#fb923c";
  } // Distinct Orange
  else if (status === "Work Finished (unpaid)") {
    bg = "rgba(168, 85, 247, 0.15)";
    color = "#c084fc";
  } // Distinct Purple
  else if (status === "Complete transaction") {
    bg = "rgba(16, 185, 129, 0.15)";
    color = "#34d399";
  } else if (status === "Cancelled") {
    bg = "rgba(239, 68, 68, 0.15)";
    color = "#f87171";
  }

  return `
        <span style="
            background: ${bg}; 
            color: ${color}; 
            padding: 4px 10px; 
            border-radius: 20px; 
            font-size: 12.5px; 
            font-weight: 600; 
            font-family: 'Barlow Condensed', sans-serif; 
            letter-spacing: 0.5px; 
            text-transform: uppercase; 
            display: inline-block;
            text-align: center;">
            ${status}
        </span>
    `;
}

function apptRowHTML(a) {
  return `
    <tr style="cursor: pointer;" onclick="openAppointmentModal('${a.id}')">
      <td class="subtext">${a.id || ""}</td>
      <td>
        <div class="person">
          <div class="avatar">${a.initials || "MC"}</div>
          <div>
            <div class="person-name">${a.customer}</div>
            <div class="person-sub">${a.phone || "N/A"}</div>
          </div>
        </div>
      </td>
      <td>${a.bike}</td>
      <td>${Array.isArray(a.services) ? a.services.join(", ") : a.services}</td>
      <td>${a.date}<div class="dt-time">${a.time}</div></td>
      <td>${a.mechanic ? a.mechanic : '<span class="unassigned">Unassigned</span>'}</td>
      <td>${getCustomStatusBadge(a.status)}</td>
    </tr>
  `;
}

function renderDashboardAppointments() {
  const t = $("#dashAppointmentsTable");
  if (!t) return;
  t.innerHTML = `
    <thead><tr>
      <th>Customer</th><th>Motorcycle</th><th>Services</th><th>Date &amp; Time</th><th>Mechanic</th><th>Status</th>
    </tr></thead>
    <tbody>${DATA.appointments.map((a) => apptRowHTML(a)).join("")}</tbody>
  `;
}

function renderAppointmentsPage() {
  const activeFilter = $("#apptFilters .pill.active")?.dataset.filter || "All";
  const query = ($("#apptSearch").value || "").toLowerCase();

  let rows = DATA.appointments.filter(
    (a) => activeFilter === "All" || a.status === activeFilter,
  );
  if (query)
    rows = rows.filter((a) =>
      (a.customer + a.bike).toLowerCase().includes(query),
    );

  const t = $("#apptTable");
  if (!t) return;
  t.innerHTML = `
    <thead><tr>
      <th>#</th><th>Customer</th><th>Motorcycle</th><th>Services</th><th>Date / Time</th><th>Mechanic</th><th>Status</th>
    </tr></thead>
    <tbody>${
      rows.map((a) => apptRowHTML(a)).join("") ||
      `<tr><td colspan="7" class="subtext" style="padding:26px 22px;">No appointments found.</td></tr>`
    }
    </tbody>
  `;
}

// Global variable to keep track of the selected appointment for actions/printing
let currentSelectedAppointmentId = null;

// Use your native dashboard openModal() function
function openAppointmentModal(appId) {
  currentSelectedAppointmentId = appId;
  const app = DATA.appointments.find((a) => a.id === appId);
  if (!app) return;

  const modalBodyHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
            <div class="field" style="margin-bottom:0;"><label style="font-size:11px; color:var(--text-sub, #9ca3af);">Appointment ID</label><div style="font-weight:600;">${app.id}</div></div>
            <div class="field" style="margin-bottom:0;"><label style="font-size:11px; color:var(--text-sub, #9ca3af);">Status</label><div>${getCustomStatusBadge(app.status)}</div></div>
            
            <div class="field" style="margin-bottom:0;"><label style="font-size:11px; color:var(--text-sub, #9ca3af);">Customer Name</label><div style="font-weight:600;">${app.customer}</div></div>
            <div class="field" style="margin-bottom:0;"><label style="font-size:11px; color:var(--text-sub, #9ca3af);">Contact Number</label><div>${app.phone || "N/A"}</div></div>
            
            <div class="field" style="margin-bottom:0;"><label style="font-size:11px; color:var(--text-sub, #9ca3af);">Motorcycle Model</label><div>${app.bike}</div></div>
            <div class="field" style="margin-bottom:0;"><label style="font-size:11px; color:var(--text-sub, #9ca3af);">Assigned Mechanic</label><div>${app.mechanic || "Unassigned"}</div></div>
            
            <div class="field" style="margin-bottom:0; grid-column: span 2;"><label style="font-size:11px; color:var(--text-sub, #9ca3af);">Service Requested</label><div>${Array.isArray(app.services) ? app.services.join(", ") : app.services}</div></div>
            <div class="field" style="margin-bottom:0; grid-column: span 2;"><label style="font-size:11px; color:var(--text-sub, #9ca3af);">Scheduled Date & Time</label><div>${app.date} - ${app.time || ""}</div></div>
            
            <div class="field" style="margin-bottom:0; grid-column: span 2;"><label style="font-size:11px; color:var(--text-sub, #9ca3af);">Notes / Issues</label><div>${app.notes || "None specified."}</div></div>
            <div class="field" style="margin-bottom:0; grid-column: span 2;"><label style="font-size:11px; color:var(--text-sub, #9ca3af);">Parts Requested</label><div>${app.parts?.length ? app.parts.map((part) => `${part.name} x${part.quantity}`).join(", ") : "No parts requested."}</div></div>
        </div>

        <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
            <div>
               <div style="font-size: 11px; color: var(--text-sub, #9ca3af); margin-bottom: 4px;">Update Status (Dropdown):</div>
               <div id="modalStatusActionContainer">${getStatusAdvancementDropdown(app)}</div>
            </div>
            <button type="button" onclick="generateAppointmentReceipt()" style="background: rgba(255, 255, 255, 0.08); color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; transition: background 0.2s;">
                <i class="fas fa-print"></i> Print Receipt
            </button>
        </div>
    `;

  openModal(`Appointment Details: #${app.id}`, modalBodyHTML);
}

// Styled Status Dropdown Selector with Cancelled Option
function getStatusAdvancementDropdown(app) {
  return `
        <select onchange="updateAppointmentStatus('${app.id}', this.value)" style="background-color: #1e1e2d; color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.2); padding: 7px 12px; border-radius: 6px; font-size: 13px; cursor: pointer; outline: none;">
            ${STATUS_FLOW.map((status) => {
              const isCancelled = status === "Cancelled";
              const textColor = isCancelled ? "#ef4444" : "#ffffff";
              const fontWeight = isCancelled ? "font-weight: 600;" : "";
              return `
                    <option value="${status}" ${app.status === status ? "selected" : ""} style="background-color: #1e1e2d; color: ${textColor}; ${fontWeight} padding: 8px;">
                        ${status}
                    </option>
                `;
            }).join("")}
        </select>
    `;
}

function updateAppointmentStatus(appId, newStatus) {
  const app = DATA.appointments.find((a) => a.id === appId);
  if (app) {
    app.status = newStatus;
    persistAppointments();
    const notifications = JSON.parse(
      localStorage.getItem("motofix_notifications") || "[]",
    );
    notifications.unshift({
      id: `N${Date.now()}`,
      title: "Appointment status updated",
      message: `${app.id} is now ${newStatus}.`,
      audiences: ["customer"],
      createdAt: new Date().toISOString(),
      readBy: [],
    });
    localStorage.setItem(
      "motofix_notifications",
      JSON.stringify(notifications.slice(0, 100)),
    );

    if (typeof saveAppData === "function") saveAppData();

    renderAppointmentsPage();
    renderDashboardAppointments();
    openAppointmentModal(appId); // Refresh modal view

    if (typeof showNotification === "function") {
      showNotification(
        `Appointment #${appId} updated to: ${newStatus}`,
        "success",
      );
    }
  }
}

// Real-World Document & Receipt Generation Function
function generateAppointmentReceipt() {
  const app = DATA.appointments.find(
    (a) => a.id === currentSelectedAppointmentId,
  );
  if (!app) return;

  const isPaid =
    app.status === "Complete transaction" ||
    app.status === "Completed" ||
    app.status.toLowerCase().includes("complete");

  const printWindow = window.open("", "_blank");
  printWindow.document.write(`
        <html>
        <head>
            <title>MotoFix Service Receipt - #${app.id}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 30px; color: #333; }
                .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                .receipt-info { margin-bottom: 20px; }
                .receipt-info table { width: 100%; border-collapse: collapse; }
                .receipt-info td { padding: 6px 0; }
                .total-section { margin-top: 30px; border-top: 1px solid #ddd; padding-top: 15px; text-align: right; font-size: 1.2em; font-weight: bold; }
                .footer { margin-top: 50px; text-align: center; font-size: 0.9em; color: #777; }
                @media print { body { padding: 0; } }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>MotoFix Services & Parts Shop</h2>
                <p>Official Service Receipt / Job Order Document</p>
            </div>
            <div class="receipt-info">
                <table>
                    <tr><td><strong>Receipt / Ref ID:</strong> #${app.id}</td><td><strong>Date:</strong> ${app.date}</td></tr>
                    <tr><td><strong>Customer Name:</strong> ${app.customer}</td><td><strong>Contact:</strong> ${app.phone || "N/A"}</td></tr>
                    <tr><td><strong>Motorcycle Model:</strong> ${app.bike}</td><td><strong>Status:</strong> ${app.status}</td></tr>
                </table>
            </div>
            <hr/>
            <h3>Services Performed</h3>
            <p><strong>${Array.isArray(app.services) ? app.services.join(", ") : app.services}</strong></p>
            <p><em>Mechanic:</em> ${app.mechanic || "Unassigned"}</p>
            
            <div class="total-section">
                Payment Status: ${isPaid ? "PAID ON SITE" : app.status === "Cancelled" ? "CANCELLED" : "UNPAID / PENDING SETTLEMENT"}
            </div>
            <div class="footer">
                <p>Thank you for trusting MotoFix Services!</p>
                <p>This document serves as an official service reference.</p>
            </div>
            <script>
                window.onload = function() { window.print(); }
            </script>
        </body>
        </html>
    `);
  printWindow.document.close();
}

$$("#apptFilters .pill").forEach((p) =>
  p.addEventListener("click", () => {
    $$("#apptFilters .pill").forEach((x) => x.classList.remove("active"));
    p.classList.add("active");
    renderAppointmentsPage();
  }),
);

const apptSearchEl = $("#apptSearch");
if (apptSearchEl)
  apptSearchEl.addEventListener("input", renderAppointmentsPage);

const newApptBtnEl = $("#newApptBtn");
if (newApptBtnEl) {
  newApptBtnEl.addEventListener("click", () =>
    openModal(
      "New Appointment",
      `
      <div class="field"><label>Customer Name</label><input id="newApptCustomer" placeholder="e.g. Miguel Torres"></div>
      <div class="field"><label>Contact Number</label><input id="newApptPhone" placeholder="e.g. 09123456789"></div>
      <div class="field"><label>Motorcycle Model</label><input id="newApptBike" placeholder="e.g. 2022 Honda PCX 160"></div>
      <div class="field"><label>Service</label><select id="newApptService">${DATA.services.map((s) => `<option>${s.name}</option>`).join("")}</select></div>
      <div class="field"><label>Assigned Mechanic</label><select id="newApptMechanic"><option value="">Unassigned</option>${DATA.mechanics ? DATA.mechanics.map((m) => `<option>${m.name || m}</option>`).join("") : ""}</select></div>
      <div class="field"><label>Date &amp; Time</label><input id="newApptDateTime" type="datetime-local"></div>
      <button class="btn-primary" style="width:100%;margin-top:6px;" onclick="saveNewAppointment()">Create Appointment</button>
      `,
    ),
  );
}

/* =========================================================
   ADMIN APPOINTMENT MODAL - DYNAMIC MECHANIC SELECTOR
========================================================= */

// Call this function when opening the appointment modal or when date/time fields change
function updateAppointmentMechanicDropdown(
  dateInputId,
  timeInputId,
  selectElementId,
  currentApptId = null,
) {
  const dateVal = $(dateInputId)?.value;
  const timeVal = $(timeInputId)?.value;
  const selectEl = $(selectElementId);

  if (!selectEl) return;

  // If date or time isn't picked yet, show a placeholder
  if (!dateVal || !timeVal) {
    selectEl.innerHTML = `<option value="">-- Select date & time first --</option>`;
    selectEl.disabled = true;
    return;
  }

  selectEl.disabled = false;
  const availableList = getAvailableMechanics(dateVal, timeVal, currentApptId);

  // Build dropdown options, clearly flagging busy mechanics
  selectEl.innerHTML =
    `
    <option value="">-- Unassigned / Any Available --</option>
  ` +
    availableList
      .map(
        (m) => `
    <option value="${m.name}" ${m.busy ? 'disabled style="color: #6b7280; background: #111;"' : ""}>
      ${m.name} ${m.busy ? "❌ (Already Booked)" : "✅ (Available)"}
    </option>
  `,
      )
      .join("");
}

// Example Event Listeners to auto-refresh mechanic availability when date/time changes in the admin modal
document.addEventListener("DOMContentLoaded", () => {
  const apptDateInput = $("#apptDate"); // Adjust ID to match your HTML form
  const apptTimeInput = $("#apptTime"); // Adjust ID to match your HTML form

  if (apptDateInput && apptTimeInput) {
    apptDateInput.addEventListener("change", () => {
      updateAppointmentMechanicDropdown(
        "#apptDate",
        "#apptTime",
        "#apptMechanicSelect",
      );
    });
    apptTimeInput.addEventListener("change", () => {
      updateAppointmentMechanicDropdown(
        "#apptDate",
        "#apptTime",
        "#apptMechanicSelect",
      );
    });
  }
});

/* ===================== SERVICES PAGE ===================== */
function renderServiceFilters() {
  const container = $("#svcFilters");
  if (!container) return;
  const cats = ["All", ...new Set(DATA.services.map((s) => s.category))];
  container.innerHTML = cats
    .map(
      (c, i) =>
        `<button class="pill ${i === 0 ? "active" : ""}" data-filter="${c}">${c}</button>`,
    )
    .join("");
  $$("#svcFilters .pill").forEach((p) =>
    p.addEventListener("click", () => {
      $$("#svcFilters .pill").forEach((x) => x.classList.remove("active"));
      p.classList.add("active");
      renderServicesGrid();
    }),
  );
}

function renderServicesGrid() {
  const grid = $("#servicesGrid");
  if (!grid) return;
  const activeFilter = $("#svcFilters .pill.active")?.dataset.filter || "All";
  const query = ($("#svcSearch").value || "").toLowerCase();
  let list = DATA.services.filter(
    (s) => activeFilter === "All" || s.category === activeFilter,
  );
  if (query) list = list.filter((s) => s.name.toLowerCase().includes(query));

  grid.innerHTML =
    list
      .map(
        (s) => `
    <div class="svc-card svc-row" data-code="${s.code}" style="cursor:pointer; transition:border-color 0.2s;">
      <div class="svc-top">
        <div>
          <div class="svc-name">${s.name}</div>
          <div class="svc-tag" style="margin-top:8px;">${s.category}</div>
        </div>
        <div style="text-align:right;">
          <div class="svc-price">${peso(s.price)}</div>
          <div class="svc-price-note">base price</div>
        </div>
      </div>
      <div class="svc-desc">${s.desc}</div>
      <div class="svc-meta" style="display:flex; justify-content:space-between; align-items:center; margin-top:12px;">
        <span>⏱ ${s.hoursLabel}</span>
        <span class="subtext" style="font-size:11px;">Click to view options</span>
      </div>
    </div>
  `,
      )
      .join("") || `<p class="subtext">No services match your search.</p>`;

  // Attach click listener to open service details modal
  $$(".svc-row").forEach((card) => {
    card.addEventListener("click", () =>
      openServiceDetailsModal(card.dataset.code),
    );
  });
}

function openServiceDetailsModal(code) {
  const service = DATA.services.find((s) => s.code === code);
  if (!service) return;

  openModal(
    `Service Details: ${service.name}`,
    `
    <div style="margin-bottom: 16px; line-height: 1.6;">
      <p><strong>Category:</strong> ${service.category}</p>
      <p><strong>Description:</strong> ${service.desc}</p>
      <p><strong>Estimated Duration:</strong> ${service.hoursLabel}</p>
      <p><strong>Base Price:</strong> <span style="color:var(--orange); font-weight:700;">${peso(service.price)}</span></p>
    </div>
    <div style="display: flex; gap: 10px; margin-top: 20px;">
      <button type="button" class="btn-primary" id="modalEditSvcBtn" data-code="${service.code}" style="flex:1;">Edit Service</button>
      <button type="button" class="btn-view" id="modalDeleteSvcBtn" data-code="${service.code}" style="flex:1; color:var(--red); border-color:rgba(239,68,68,0.3);">Delete Service</button>
    </div>
  `,
  );

  document.getElementById("modalEditSvcBtn").addEventListener("click", () => {
    openEditServiceModal(code);
  });

  // === Add Service Modal with Dynamic Category Dropdown ===
  document
    .getElementById("openAddServiceBtn")
    ?.addEventListener("click", () => {
      const serviceCategories = [
        ...new Set(DATA.services.map((s) => s.category)),
      ];

      openModal(
        "Add New Service",
        `
          <form id="addServiceForm">
              <div style="margin-bottom: 12px;">
                  <label style="display:block; margin-bottom:4px; font-weight:500;">Service Name</label>
                  <input type="text" id="newServiceName" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
              </div>
              <div style="margin-bottom: 12px;">
                  <label style="display:block; margin-bottom:4px; font-weight:500;">Service Code</label>
                  <input type="text" id="newServiceCode" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
              </div>
              <div style="margin-bottom: 12px;">
                  <label style="display:block; margin-bottom:4px; font-weight:500;">Category</label>
                  <select id="newServiceCategorySelect" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px; margin-bottom: 6px;">
                      ${serviceCategories.map((c) => `<option value="${c}">${c}</option>`).join("")}
                      <option value="OTHER">+ Add New Category...</option>
                  </select>
                  <input type="text" id="newServiceCategoryCustom" placeholder="Type new category name..." style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px; display:none;">
              </div>
              <div style="margin-bottom: 12px;">
                  <label style="display:block; margin-bottom:4px; font-weight:500;">Description</label>
                  <textarea id="newServiceDesc" rows="3" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px; resize:vertical;"></textarea>
              </div>
              <div style="display: flex; gap: 10px; margin-bottom: 12px;">
                  <div style="flex: 1;">
                      <label style="display:block; margin-bottom:4px; font-weight:500;">Duration Label (e.g., 1-2 hrs)</label>
                      <input type="text" id="newServiceHours" value="1 hr" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
                  </div>
                  <div style="flex: 1;">
                      <label style="display:block; margin-bottom:4px; font-weight:500;">Base Price (₱)</label>
                      <input type="number" id="newServicePrice" step="0.01" min="0" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
                  </div>
              </div>
              <button type="submit" class="btn-primary" style="width:100%; margin-top:10px;">Save Service</button>
          </form>
      `,
      );

      const selectEl = document.getElementById("newServiceCategorySelect");
      const customInputEl = document.getElementById("newServiceCategoryCustom");

      selectEl.addEventListener("change", (e) => {
        if (e.target.value === "OTHER") {
          customInputEl.style.display = "block";
          customInputEl.required = true;
          customInputEl.focus();
        } else {
          customInputEl.style.display = "none";
          customInputEl.required = false;
        }
      });
    });

  document.getElementById("modalDeleteSvcBtn").addEventListener("click", () => {
    if (confirm(`Are you sure you want to delete service code: ${code}?`)) {
      DATA.services = DATA.services.filter((s) => s.code !== code);
      localStorage.setItem("motofix_services", JSON.stringify(DATA.services));
      document.getElementById("modalBackdrop").classList.remove("open");
      renderServiceFilters();
      renderServicesGrid();
    }
  });
}

/* =========================================================
   SERVICES SECTION SEARCH & FILTER FUNCTIONALITY
========================================================= */
const servicesSearchEl =
  $("#svcSearch") ||
  document.querySelector(
    "input[placeholder*='service' i], input[placeholder*='Search services' i]",
  );

if (servicesSearchEl) {
  servicesSearchEl.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();
    const serviceCards = document.querySelectorAll(
      "#page-services tr, .service-card, .stack-item",
    ); // Adjust selector based on your HTML layout

    // If you are rendering services dynamically via a DATA array:
    if (typeof DATA !== "undefined" && DATA.services) {
      const filteredServices = DATA.services.filter((s) =>
        (s.name + (s.description || "") + (s.mechanic || ""))
          .toLowerCase()
          .includes(query),
      );
      // Call your specific services render function here, e.g., renderServices(filteredServices);
    } else {
      // Fallback DOM filtering if static HTML rows are used
      serviceCards.forEach((card) => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(query) ? "" : "none";
      });
    }
    renderServicesGrid();
  });
}

/* =========================================================
   UPDATE BLOCK: LOCAL STORAGE SYNC FOR CUSTOMIZATION/BIKES
   Ensures local storage gets populated with default bike dataset
   if empty, and syncs DATA variables for persistent custom builds.
========================================================= */
function initCustomizationStorage() {
  if (!localStorage.getItem("motofix_bikes")) {
    localStorage.setItem("motofix_bikes", JSON.stringify(DATA.bikes));
  } else {
    DATA.bikes = JSON.parse(localStorage.getItem("motofix_bikes"));
  }
}
initCustomizationStorage();

/* ===================== CUSTOMIZATION PAGE RENDER & CRUD ===================== */
function renderCustomizationFilters() {
  const container = $("#customFilters");
  if (!container) return;

  // Attach filter event listeners for custom build pills
  $$("#customFilters .pill").forEach((p) => {
    p.addEventListener("click", () => {
      $$("#customFilters .pill").forEach((x) => x.classList.remove("active"));
      p.classList.add("active");
      renderBikes();
    });
  });
}

function renderBikes() {
  const listEl = $("#bikeList");
  if (!listEl) return;

  const activeFilter =
    $("#customFilters .pill.active")?.dataset.filter || "All";
  const query = ($("#customSearch")?.value || "").toLowerCase();

  // Filter bikes based on category pills and search query
  let filteredBikes = DATA.bikes.filter((b) => {
    const hasMods = b.mods && b.mods.length > 0;
    if (activeFilter === "Customized" && !hasMods) return false;
    if (activeFilter === "Stock" && hasMods) return false;
    return true;
  });

  if (query) {
    filteredBikes = filteredBikes.filter((b) =>
      (b.name + b.detail + b.owner + (b.mods ? b.mods.join(" ") : ""))
        .toLowerCase()
        .includes(query),
    );
  }

  listEl.innerHTML =
    filteredBikes
      .map(
        (b, index) => `
    <div class="bike-card" style="cursor: pointer;" onclick="openBikeDetailsModal(${index})">
      <div class="bike-top">
        <div>
          <div class="bike-name">${b.name}</div>
          <div class="bike-sub">${b.detail}</div>
          <div class="bike-owner">Owner: ${b.owner}</div>
        </div>
        <div class="bike-odo">
          <div class="bike-odo-val">${b.odo} km</div>
          <div class="bike-odo-label">odometer</div>
        </div>
      </div>
      ${b.mods && b.mods.length ? `<div class="bike-mods">${b.mods.map((m) => `<span class="mod-tag">${m}</span>`).join("")}</div>` : `<div class="subtext" style="font-size:12px; margin-top:8px;">No custom modifications recorded (Stock setup).</div>`}
    </div>
  `,
      )
      .join("") ||
    `<p class="subtext" style="padding: 20px;">No registered motorcycle profiles found.</p>`;
}

// Search input event listener for real-time filtering
const customSearchEl = $("#customSearch");
if (customSearchEl) {
  customSearchEl.addEventListener("input", renderBikes);
}

// Modal view to inspect or delete a specific bike profile
function openBikeDetailsModal(index) {
  const b = DATA.bikes[index];
  if (!b) return;

  openModal(
    `Motorcycle Profile: ${b.name}`,
    `
    <div style="margin-bottom: 16px; line-height: 1.6;">
      <p><strong>Model & Details:</strong> ${b.name} (${b.detail})</p>
      <p><strong>Registered Owner:</strong> ${b.owner}</p>
      <p><strong>Odometer Reading:</strong> ${b.odo} km</p>
      <p><strong>Modifications:</strong> ${b.mods && b.mods.length ? b.mods.join(", ") : "None (Stock)"}</p>
    </div>
    <div style="display: flex; gap: 10px; margin-top: 20px;">
      <button type="button" class="btn-view" onclick="deleteBikeProfile(${index})" style="flex:1; color:var(--red); border-color:rgba(239,68,68,0.3);">Delete Profile</button>
    </div>
  `,
  );
}

function deleteBikeProfile(index) {
  if (
    confirm(
      "Are you sure you want to remove this motorcycle customization profile?",
    )
  ) {
    DATA.bikes.splice(index, 1);
    localStorage.setItem("motofix_bikes", JSON.stringify(DATA.bikes));
    $("#modalBackdrop").classList.remove("open");
    renderBikes();
  }
}

// Hook up "+ Add Custom Build" button to open the creation modal
const openAddCustomModalBtn = $("#openAddCustomModalBtn");
if (openAddCustomModalBtn) {
  openAddCustomModalBtn.addEventListener("click", () => {
    openModal(
      "Add New Motorcycle Customization Profile",
      `
      <form id="addCustomBikeForm">
        <div style="margin-bottom: 12px;">
          <label style="display:block; margin-bottom:4px; font-weight:500;">Motorcycle Name / Model</label>
          <input type="text" id="newBikeName" placeholder="e.g. 2024 Honda Click 125i" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
        </div>
        <div style="margin-bottom: 12px;">
          <label style="display:block; margin-bottom:4px; font-weight:500;">Color & Plate Number</label>
          <input type="text" id="newBikeDetail" placeholder="e.g. Matte Gray · NEV 9876" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
        </div>
        <div style="margin-bottom: 12px;">
          <label style="display:block; margin-bottom:4px; font-weight:500;">Owner Name</label>
          <input type="text" id="newBikeOwner" placeholder="e.g. Juan Dela Cruz" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
        </div>
        <div style="margin-bottom: 12px;">
          <label style="display:block; margin-bottom:4px; font-weight:500;">Odometer (km)</label>
          <input type="text" id="newBikeOdo" value="1,200" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
        </div>
        <div style="margin-bottom: 12px;">
          <label style="display:block; margin-bottom:4px; font-weight:500;">Modifications (comma separated)</label>
          <input type="text" id="newBikeMods" placeholder="e.g. Upgraded suspension, Custom seat, LED pods" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
        </div>
        <button type="submit" class="btn-primary" style="width:100%; margin-top:10px;">Save Bike Profile</button>
      </form>
      `,
    );
  });
}

// Handle submission of the new custom build form
document.addEventListener("submit", (e) => {
  if (e.target && e.target.id === "addCustomBikeForm") {
    e.preventDefault();

    const rawMods = document.getElementById("newBikeMods").value;
    const modsArray = rawMods
      ? rawMods
          .split(",")
          .map((m) => m.trim())
          .filter(Boolean)
      : [];

    const newBike = {
      name: document.getElementById("newBikeName").value,
      detail: document.getElementById("newBikeDetail").value,
      owner: document.getElementById("newBikeOwner").value,
      odo: document.getElementById("newBikeOdo").value,
      mods: modsArray,
    };

    DATA.bikes.push(newBike);
    localStorage.setItem("motofix_bikes", JSON.stringify(DATA.bikes));

    $("#modalBackdrop").classList.remove("open");
    renderBikes();
  }
});

/* ===================== INVENTORY PAGE ===================== */
function renderInvFilters() {
  const container = $("#invFilters");
  if (!container) return;
  const cats = ["All", ...new Set(DATA.inventory.map((i) => i.category))];
  container.innerHTML = cats
    .map(
      (c, i) =>
        `<button class="pill ${i === 0 ? "active" : ""}" data-filter="${c}">${c}</button>`,
    )
    .join("");
  $$("#invFilters .pill").forEach((p) =>
    p.addEventListener("click", () => {
      $$("#invFilters .pill").forEach((x) => x.classList.remove("active"));
      p.classList.add("active");
      renderInventoryTable();
    }),
  );
}

function renderInventoryTable() {
  const table = $("#invTable");
  if (!table) return;
  const activeFilter = $("#invFilters .pill.active")?.dataset.filter || "All";
  const query = ($("#invSearch").value || "").toLowerCase();
  let list = DATA.inventory.filter(
    (i) => activeFilter === "All" || i.category === activeFilter,
  );
  if (query)
    list = list.filter((i) => (i.name + i.sku).toLowerCase().includes(query));

  table.innerHTML = `
    <thead><tr>
      <th>Part Name</th><th>SKU</th><th>Brand</th><th>Category</th><th>Stock</th><th>Unit Price</th><th>Status</th>
    </tr></thead>
    <tbody>${
      list
        .map(
          (i) => `
      <tr class="inv-row" data-sku="${i.sku}" style="cursor:pointer; transition:background 0.2s;">
        <td>${i.name}</td>
        <td class="subtext" style="font-family:var(--font-mono);">${i.sku}</td>
        <td>${i.brand}</td>
        <td>${i.category}</td>
        <td>
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:70px;height:5px;background:#232323;border-radius:3px;overflow:hidden;">
              <div style="width:${Math.min(100, (i.stock / i.max) * 100)}%;height:100%;background:var(--green);"></div>
            </div>
            <span>${i.stock}</span>
          </div>
        </td>
        <td style="color:var(--orange);font-weight:700;font-family:var(--font-mono);">${peso(i.price)}</td>
        <td>${statusBadge("Active")}</td>
      </tr>
    `,
        )
        .join("") ||
      `<tr><td colspan="7" class="subtext" style="padding:26px 22px;">No parts found.</td></tr>`
    }</tbody>
  `;

  // Attach click listener to open row details modal
  $$(".inv-row").forEach((row) => {
    row.addEventListener("click", () => openPartDetailsModal(row.dataset.sku));
  });
}

function openPartDetailsModal(sku) {
  const part = DATA.inventory.find((i) => i.sku === sku);
  if (!part) return;

  openModal(
    `Part Details: ${part.name}`,
    `
    <div style="margin-bottom: 16px; line-height: 1.6;">
      <p><strong>SKU:</strong> <span style="font-family:var(--font-mono);">${part.sku}</span></p>
      <p><strong>Brand:</strong> ${part.brand}</p>
      <p><strong>Category:</strong> ${part.category}</p>
      <p><strong>Stock Level:</strong> ${part.stock} / ${part.max || 60}</p>
      <p><strong>Unit Price:</strong> <span style="color:var(--orange); font-weight:700;">${peso(part.price)}</span></p>
    </div>
    <div style="display: flex; gap: 10px; margin-top: 20px;">
      <button type="button" class="btn-primary" id="modalEditPartBtn" data-sku="${part.sku}" style="flex:1;">Edit Part</button>
      <button type="button" class="btn-view" id="modalDeletePartBtn" data-sku="${part.sku}" style="flex:1; color:var(--red); border-color:rgba(239,68,68,0.3);">Delete Part</button>
    </div>
  `,
  );

  document.getElementById("modalEditPartBtn").addEventListener("click", () => {
    openEditPartModal(sku);
  });

  document
    .getElementById("modalDeletePartBtn")
    .addEventListener("click", () => {
      if (
        confirm(`Are you sure you want to delete the part with SKU: ${sku}?`)
      ) {
        DATA.inventory = DATA.inventory.filter((i) => i.sku !== sku);
        localStorage.setItem("motofix_parts", JSON.stringify(DATA.inventory));
        document.getElementById("modalBackdrop").classList.remove("open");
        renderInvFilters();
        renderInventoryTable();
      }
    });
}

// ===  Add Part Modal with Dynamic Category Dropdown & Max Stock ===
document.getElementById("openAddPartBtn")?.addEventListener("click", () => {
  // Extract unique existing categories dynamically
  const categories = [...new Set(DATA.inventory.map((i) => i.category))];

  openModal(
    "Add New Part",
    `
        <form id="addPartForm">
            <div style="margin-bottom: 12px;">
                <label style="display:block; margin-bottom:4px; font-weight:500;">Part Name</label>
                <input type="text" id="newPartName" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
            </div>
            <div style="margin-bottom: 12px;">
                <label style="display:block; margin-bottom:4px; font-weight:500;">SKU</label>
                <input type="text" id="newPartSku" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
            </div>
            <div style="margin-bottom: 12px;">
                <label style="display:block; margin-bottom:4px; font-weight:500;">Brand</label>
                <input type="text" id="newPartBrand" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
            </div>
            <div style="margin-bottom: 12px;">
                <label style="display:block; margin-bottom:4px; font-weight:500;">Category</label>
                <select id="newPartCategorySelect" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px; margin-bottom: 6px;">
                    ${categories.map((c) => `<option value="${c}">${c}</option>`).join("")}
                    <option value="OTHER">+ Add New Category...</option>
                </select>
                <!-- Hidden input field that reveals if "OTHER" is chosen -->
                <input type="text" id="newPartCategoryCustom" placeholder="Type new category name..." style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px; display:none;">
            </div>
            <div style="display: flex; gap: 10px; margin-bottom: 12px;">
                <div style="flex: 1;">
                    <label style="display:block; margin-bottom:4px; font-weight:500;">Initial Stock</label>
                    <input type="number" id="newPartStock" min="0" value="0" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
                </div>
                <div style="flex: 1;">
                    <label style="display:block; margin-bottom:4px; font-weight:500;">Max Stock Limit</label>
                    <input type="number" id="newPartMaxStock" min="1" value="60" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
                </div>
            </div>
            <div style="margin-bottom: 12px;">
                <label style="display:block; margin-bottom:4px; font-weight:500;">Unit Price (₱)</label>
                <input type="number" id="newPartPrice" step="0.01" min="0" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
            </div>
            <button type="submit" class="btn-primary" style="width:100%; margin-top:10px;">Save Part</button>
        </form>
    `,
  );

  // Toggle custom category text input visibility when "OTHER" is selected
  const selectEl = document.getElementById("newPartCategorySelect");
  const customInputEl = document.getElementById("newPartCategoryCustom");

  selectEl.addEventListener("change", (e) => {
    if (e.target.value === "OTHER") {
      customInputEl.style.display = "block";
      customInputEl.required = true;
      customInputEl.focus();
    } else {
      customInputEl.style.display = "none";
      customInputEl.required = false;
    }
  });
});

/* =========================================================
   PARTS SECTION SEARCH & FILTER FUNCTIONALITY
========================================================= */
const partsSearchEl =
  $("#invSearch") ||
  document.querySelector(
    "input[placeholder*='parts' i], input[placeholder*='Search parts' i]",
  );

if (partsSearchEl) {
  partsSearchEl.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();
    const partsRows = document.querySelectorAll(
      "#page-parts tr, .part-row, .inventory-card",
    ); // Adjust selector based on your HTML layout

    // If you are rendering parts dynamically via a DATA array:
    if (typeof DATA !== "undefined" && DATA.parts) {
      const filteredParts = DATA.parts.filter((p) =>
        (p.name + (p.category || "") + (p.code || ""))
          .toLowerCase()
          .includes(query),
      );
      // Call your specific parts render function here, e.g., renderParts(filteredParts);
    } else {
      // Fallback DOM filtering if static HTML rows are used
      partsRows.forEach((row) => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? "" : "none";
      });
    }
    renderInventoryTable();
  });
}

/* ===================== BILLING PAGE ===================== */
function renderInvoices() {
  const countEl = $("#invoiceCount");
  const tableEl = $("#invoiceTable");
  if (!countEl || !tableEl) return;

  countEl.textContent = `${DATA.invoices.length} invoice${DATA.invoices.length === 1 ? "" : "s"} total`;

  tableEl.innerHTML = `
    <thead><tr>
      <th>Invoice #</th><th>Customer</th><th>Job Ref</th><th>Items</th><th>Subtotal</th><th>VAT</th><th>Total</th><th>Status</th><th>Date</th>
    </tr></thead>
    <tbody>${DATA.invoices
      .map(
        (inv) => `
      <tr data-view-invoice="${inv.id}" style="cursor: pointer; transition: background 0.15s ease;">
        <td style="color:var(--orange);font-weight:700;font-family:var(--font-mono);">${inv.id}</td>
        <td>${inv.customer}</td>
        <td class="subtext">${inv.jobRef}</td>
        <td>${inv.items}</td>
        <td>${peso(inv.subtotal)}</td>
        <td>${peso(inv.vat)}</td>
        <td style="color:var(--orange);font-weight:700;">${peso(inv.total)}</td>
        <td>${statusBadge(inv.status)}</td>
        <td class="subtext">${inv.date}</td>
      </tr>
    `,
      )
      .join("")}</tbody>
  `;

  // Make the entire row clickable and add hover styling dynamically
  $$("#invoiceTable tbody tr").forEach((row) => {
    row.addEventListener("mouseenter", () => {
      row.style.background = "rgba(255, 255, 255, 0.04)";
    });
    row.addEventListener("mouseleave", () => {
      row.style.background = "transparent";
    });
    row.addEventListener("click", () => {
      openInvoiceModal(row.dataset.viewInvoice);
    });
  });
}

// Comprehensive Invoice Receipt Modal with Print Document Capability
function openInvoiceModal(invId) {
  const inv = DATA.invoices.find((i) => i.id === invId);
  if (!inv) return;

  // Find linked job or customer details for completeness
  const linkedJob = DATA.jobs.find((j) => j.id === inv.jobRef);
  const linkedBike = linkedJob
    ? linkedJob.bike
    : "Registered Motorcycle Profile";
  const customerObj = DATA.users.find((u) => u.name === inv.customer);
  const customerPhone = customerObj ? customerObj.phone : "+63 912 000 0000";

  const modalBodyHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
        <div class="field" style="margin-bottom:0;"><label style="font-size:11px; color:var(--text-sub, #9ca3af);">Invoice ID</label><div style="font-weight:600; color:var(--orange);">${inv.id}</div></div>
        <div class="field" style="margin-bottom:0;"><label style="font-size:11px; color:var(--text-sub, #9ca3af);">Payment Status</label><div>${statusBadge(inv.status)}</div></div>
        
        <div class="field" style="margin-bottom:0;"><label style="font-size:11px; color:var(--text-sub, #9ca3af);">Customer Name</label><div style="font-weight:600;">${inv.customer}</div></div>
        <div class="field" style="margin-bottom:0;"><label style="font-size:11px; color:var(--text-sub, #9ca3af);">Contact Number</label><div>${customerPhone}</div></div>
        
        <div class="field" style="margin-bottom:0;"><label style="font-size:11px; color:var(--text-sub, #9ca3af);">Motorcycle / Job Ref</label><div>${linkedBike} (${inv.jobRef})</div></div>
        <div class="field" style="margin-bottom:0;"><label style="font-size:11px; color:var(--text-sub, #9ca3af);">Transaction Date</label><div>${inv.date}</div></div>
        
        <div class="field" style="margin-bottom:0; grid-column: span 2;">
          <label style="font-size:11px; color:var(--text-sub, #9ca3af); margin-bottom:6px; display:block;">Financial Summary</label>
          <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08);">
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>Subtotal (${inv.items} items/services):</span> <strong>${peso(inv.subtotal)}</strong></div>
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>VAT (12%):</span> <strong>${peso(inv.vat)}</strong></div>
            <div style="display:flex; justify-content:space-between; border-top:1px solid rgba(255,255,255,0.1); padding-top:6px; margin-top:6px; color:var(--orange); font-size:1.1em;"><span>Total Amount Due:</span> <strong>${peso(inv.total)}</strong></div>
          </div>
        </div>
    </div>

    <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px; display: flex; justify-content: flex-end; gap: 10px;">
        <button type="button" onclick="printCustomerReceipt('${inv.id}')" style="background: rgba(255, 255, 255, 0.08); color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; transition: background 0.2s;">
            <i class="fas fa-print"></i> Print Official Receipt
        </button>
    </div>
  `;

  openModal(`Customer Receipt & Invoice: ${inv.id}`, modalBodyHTML);
}

function printCustomerReceipt(invId) {
  const inv = DATA.invoices.find((i) => i.id === invId);
  if (!inv) return;

  const customerObj = DATA.users.find((u) => u.name === inv.customer);
  const customerPhone = customerObj ? customerObj.phone : "+63 912 000 0000";

  const printWindow = window.open("", "_blank");
  printWindow.document.write(`
      <html>
      <head>
          <title>MotoFix Official Receipt - ${inv.id}</title>
          <style>
              body { font-family: Arial, sans-serif; padding: 40px; color: #222; max-width: 700px; margin: 0 auto; }
              .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 25px; }
              .header h2 { margin: 0; font-size: 24px; color: #111; }
              .header p { margin: 4px 0 0; color: #555; font-size: 14px; }
              .info-grid { width: 100%; margin-bottom: 25px; border-collapse: collapse; }
              .info-grid td { padding: 6px 0; font-size: 14px; }
              .table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
              .table th, .table td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 13px; }
              .table th { background: #f4f4f4; }
              .totals { float: right; width: 280px; font-size: 14px; }
              .totals div { display: flex; justify-content: space-between; padding: 5px 0; }
              .totals .grand-total { border-top: 2px solid #333; font-weight: bold; font-size: 16px; margin-top: 5px; padding-top: 8px; }
              .footer { clear: both; margin-top: 60px; text-align: center; font-size: 12px; color: #666; border-top: 1px dashed #ccc; padding-top: 15px; }
              @media print { body { padding: 0; } }
          </style>
      </head>
      <body>
          <div class="header">
              <h2>MOTOFIX SERVICES & PARTS SHOP</h2>
              <p>Official Customer Transaction Receipt & VAT Invoice</p>
          </div>
          <table class="info-grid">
              <tr>
                  <td><strong>Invoice Reference:</strong> ${inv.id}</td>
                  <td><strong>Date Issued:</strong> ${inv.date}</td>
              </tr>
              <tr>
                  <td><strong>Customer Name:</strong> ${inv.customer}</td>
                  <td><strong>Contact Number:</strong> ${customerPhone}</td>
              </tr>
              <tr>
                  <td><strong>Job Reference:</strong> ${inv.jobRef}</td>
                  <td><strong>Payment Status:</strong> ${inv.status.toUpperCase()}</td>
              </tr>
          </table>

          <table class="table">
              <thead>
                  <tr>
                      <th>Description / Particulars</th>
                      <th>Qty</th>
                      <th>Subtotal</th>
                  </tr>
              </thead>
              <tbody>
                  <tr>
                      <td>Completed Workshop Service & Parts (Ref: ${inv.jobRef})</td>
                      <td>${inv.items}</td>
                      <td>₱${Number(inv.subtotal).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
                  </tr>
              </tbody>
          </table>

          <div class="totals">
              <div><span>Subtotal:</span> <span>₱${Number(inv.subtotal).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span></div>
              <div><span>VAT (12%):</span> <span>₱${Number(inv.vat).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span></div>
              <div class="grand-total"><span>Total Paid:</span> <span>₱${Number(inv.total).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span></div>
          </div>

          <div class="footer">
              <p>Thank you for choosing MotoFix Services! This serves as an official receipt.</p>
              <p>Tin: 000-123-456-00009 · MotoFix Workshop Management System</p>
          </div>
          <script>
              window.onload = function() { window.print(); }
          </script>
      </body>
      </html>
  `);
  printWindow.document.close();
}

// Download Revenue Report Function (Direct PDF download via jsPDF & Word .doc export)
function downloadRevenueReport(fileType) {
  const totalRev = DATA.revenue.reduce((acc, r) => acc + r.value, 0);
  const totalVAT = totalRev * 0.12;
  const currentDate = new Date().toISOString().split("T")[0];

  if (fileType === "docx") {
    // Styled HTML Word document (.doc) export
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <title>MotoFix Revenue Report</title>
          <style>
              body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
              h1 { color: #111; font-size: 20px; border-bottom: 2px solid #333; padding-bottom: 8px; }
              h2 { font-size: 16px; margin-top: 20px; color: #444; }
              ul { line-height: 1.6; }
              table { width: 100%; border-collapse: collapse; margin-top: 15px; }
              th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; font-size: 14px; }
              th { background-color: #f4f4f4; }
          </style>
      </head>
      <body>
          <h1>MOTOFIX REVENUE & FINANCIAL REPORT</h1>
          <p><strong>Generated on:</strong> ${currentDate}</p>
          
          <h2>Summary Statistics</h2>
          <ul>
              <li><strong>Total Revenue (All Time):</strong> ₱${totalRev.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</li>
              <li><strong>Total VAT Collected (12%):</strong> ₱${totalVAT.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</li>
              <li><strong>Total Invoices Processed:</strong> ${DATA.invoices.length}</li>
          </ul>

          <h2>Monthly Breakdown</h2>
          <table>
              <thead>
                  <tr><th>Month</th><th>Revenue</th></tr>
              </thead>
              <tbody>
                  ${DATA.revenue.map((r) => `<tr><td>${r.month}</td><td>₱${r.value.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td></tr>`).join("")}
              </tbody>
          </table>
      </body>
      </html>
    `;

    const blob = new Blob(["\ufeff" + htmlContent], {
      type: "application/msword",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `MotoFix_Revenue_Report_${currentDate}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } else if (fileType === "pdf") {
    // Generate a real downloadable PDF using jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("MotoFix Revenue & Financial Report", 14, 20);

    // Metadata
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Generated on: ${currentDate}`, 14, 28);

    // Summary Section
    doc.setFont("helvetica", "bold");
    doc.text("Summary Statistics", 14, 38);
    doc.setFont("helvetica", "normal");
    doc.text(
      `- Total Revenue: P${totalRev.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
      14,
      46,
    );
    doc.text(
      `- Total VAT (12%): P${totalVAT.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
      14,
      54,
    );
    doc.text(`- Invoices Processed: ${DATA.invoices.length}`, 14, 62);

    // Monthly Breakdown Table Header
    doc.setFont("helvetica", "bold");
    doc.text("Monthly Breakdown", 14, 74);

    let yPos = 82;
    doc.setFillColor(240, 240, 240);
    doc.rect(14, yPos - 6, 180, 8, "F");
    doc.text("Month", 18, yPos);
    doc.text("Revenue", 120, yPos);

    // Table Rows
    doc.setFont("helvetica", "normal");
    yPos += 8;
    DATA.revenue.forEach((r) => {
      doc.text(r.month, 18, yPos);
      doc.text(
        `P${r.value.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
        120,
        yPos,
      );
      yPos += 8;
    });

    // Save the PDF file directly
    doc.save(`MotoFix_Revenue_Report_${currentDate}.pdf`);
  }
}

/* =========================================================
   BILLING TABS & REVENUE CHART RENDERER
========================================================= */
$$(".tab-row .tab").forEach((tabBtn) => {
  tabBtn.addEventListener("click", () => {
    // Remove active state from all tabs and panels
    $$(".tab-row .tab").forEach((t) => t.classList.remove("active"));
    $$(".tab-panel").forEach((p) => p.classList.remove("active"));

    // Add active state to clicked tab
    tabBtn.classList.add("active");

    // Activate corresponding panel
    const targetTab = tabBtn.dataset.tab;
    const targetPanel = $("#tab-" + targetTab);
    if (targetPanel) {
      targetPanel.classList.add("active");
    }

    // If Revenue tab is opened, render the chart, stats, and category breakdown
    if (targetTab === "revenue") {
      renderBarChart("revenueChart2", DATA.revenue);
      renderRevenueStatsAndBreakdown(); // <-- ADD THIS LINE
    } else if (targetTab === "invoices") {
      renderInvoices();
    }
  });
});

// <-- ADD THIS HELPER FUNCTION BELOW YOUR EVENT LISTENER -->
function renderRevenueStatsAndBreakdown() {
  const totalRev = DATA.revenue.reduce((acc, r) => acc + r.value, 0);
  const totalVAT = totalRev * 0.12;
  const invoiceCount = DATA.invoices.length;
  const avgVal = invoiceCount > 0 ? totalRev / invoiceCount : 0;

  // Update Stat Card Values on the UI
  const totalEl = $("#rev-total-val");
  const vatEl = $("#rev-vat-val");
  const aovEl = $("#rev-aov-val");
  const aovDescEl = $("#rev-aov-desc");

  if (totalEl)
    totalEl.textContent = `₱${totalRev.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
  if (vatEl)
    vatEl.textContent = `₱${totalVAT.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
  if (aovEl)
    aovEl.textContent = `₱${avgVal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
  if (aovDescEl)
    aovDescEl.textContent = `Based on ${invoiceCount} invoice${invoiceCount === 1 ? "" : "s"}`;

  // Populate Service Category Breakdown Panel
  const breakdownContainer = $("#category-breakdown-container");
  if (breakdownContainer) {
    breakdownContainer.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.08);">
          <span>🔧 Engine Maintenance</span>
          <strong style="color:var(--orange);">₱${(totalRev * 0.5).toLocaleString("en-PH", { minimumFractionDigits: 2 })} (50%)</strong>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.08);">
          <span>⚙️ Custom Parts & Upgrades</span>
          <strong style="color:var(--orange);">₱${(totalRev * 0.3).toLocaleString("en-PH", { minimumFractionDigits: 2 })} (30%)</strong>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0;">
          <span>🛠️ General Repairs</span>
          <strong style="color:var(--orange);">₱${(totalRev * 0.2).toLocaleString("en-PH", { minimumFractionDigits: 2 })} (20%)</strong>
        </div>
      </div>
    `;
  }
}

/* =========================================================
   MECHANIC JOBS & APPOINTMENT SYNC LOGIC
========================================================= */

// Helper to check if a mechanic is already booked on a specific date/time
function isMechanicBusy(mechanicName, date, time, excludeApptId = null) {
  return DATA.appointments.some((a) => {
    if (excludeApptId && a.id === excludeApptId) return false;
    if (a.status === "Cancelled" || a.status === "Complete transaction")
      return false;
    return a.mechanic === mechanicName && a.date === date && a.time === time;
  });
}

// Get list of available mechanics for a given date/time slot
function getAvailableMechanics(date, time, excludeApptId = null) {
  const allMechanics = DATA.users.filter((u) => u.role === "Mechanic");
  return allMechanics.map((m) => {
    const busy = isMechanicBusy(m.name, date, time, excludeApptId);
    return { name: m.name, initials: m.initials, busy };
  });
}

/* ===================== MECHANIC JOBS PAGE RENDER ===================== */
function renderJobs() {
  const jobsList = $("#jobsList");
  if (!jobsList) return;

  const activeStatus =
    $("#jobsAdminFilters .pill.active")?.dataset.status || "All";
  const searchTerm = ($("#jobsAdminSearch")?.value || "").trim().toLowerCase();

  // Dynamically sync jobs from active/confirmed/in-progress appointments if not already present
  DATA.appointments.forEach((app) => {
    if (app.mechanic && app.status !== "Cancelled") {
      let existingJob = DATA.jobs.find(
        (j) =>
          j.id === "J-" + app.id ||
          (j.customer === app.customer && j.bike === app.bike),
      );
      if (!existingJob) {
        DATA.jobs.push({
          id: "J-" + app.id,
          apptRef: app.id,
          customer: app.customer,
          bike: app.bike,
          mechanic: app.mechanic,
          initials: avatarInitials(app.mechanic),
          parts: 1,
          cost: 500, // Base estimated inspection/service cost
          note: `Service requested: ${Array.isArray(app.services) ? app.services.join(", ") : app.services}`,
          status: app.status === "In Progress" ? "In Progress" : "Pending",
        });
      }
    }
  });

  const filteredJobs = DATA.jobs.filter((job) => {
    const searchable = [job.id, job.customer, job.bike, job.mechanic, job.note]
      .join(" ")
      .toLowerCase();
    const matchesStatus = activeStatus === "All" || job.status === activeStatus;
    return matchesStatus && (!searchTerm || searchable.includes(searchTerm));
  });

  const summary = $("#jobsAdminSummary");
  if (summary)
    summary.textContent = `${filteredJobs.length} of ${DATA.jobs.length} mechanic jobs`;

  jobsList.innerHTML =
    filteredJobs
      .map(
        (j) => `
      <div class="job-card" style="background: #1e1e2d; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 16px; margin-bottom: 12px; display: flex; flex-direction: column; gap: 10px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-family: var(--font-mono); font-weight: 700; color: var(--orange);">${j.id}</span>
        <div style="display:flex; align-items:center; gap:10px;">${statusBadge(j.status)}<button class="job-view-details" type="button" data-admin-job-details="${j.id}">View Details</button></div>
      </div>
      <div style="font-size: 16px; font-weight: 600; color: #fff;">${j.customer} — <span style="font-weight: 400; color: var(--text-sub, #9ca3af);">${j.bike}</span></div>
      <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.03); padding: 8px 12px; border-radius: 6px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div class="avatar" style="width: 28px; height: 28px; font-size: 12px;">${j.initials}</div>
          <span style="font-weight: 500; font-size: 13px;">${j.mechanic}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 14px; font-size: 13px;">
          <span class="subtext">📦 ${j.parts} parts allocated</span>
          <span style="font-weight: 700; color: var(--orange); font-family: var(--font-mono);">${peso(j.cost)}</span>
        </div>
      </div>
      <div style="font-size: 13px; color: var(--text-sub, #9ca3af); font-style: italic;">Notes: ${j.note}</div>
    </div>
  `,
      )
      .join("") ||
    `<div class="jobs-admin-empty">No mechanic jobs match the selected filters.</div>`;

  document.querySelectorAll("[data-admin-job-details]").forEach((button) => {
    button.addEventListener("click", () => {
      const job = DATA.jobs.find(
        (item) => item.id === button.dataset.adminJobDetails,
      );
      if (job) openAdminJobDetails(job);
    });
  });
}

function openAdminJobDetails(job) {
  const appointment = DATA.appointments.find((item) => item.id === job.apptRef);
  const bookedAt = appointment?.createdAt
    ? new Date(appointment.createdAt).toLocaleString("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Not available for this legacy job";
  const services =
    appointment?.services || job.note || "Service details unavailable";
  const parts = appointment?.parts?.length
    ? appointment.parts
        .map((part) => `${part.name} x${part.quantity || 1}`)
        .join(", ")
    : "No parts requested";
  const details = `
      <div class="admin-job-details-grid">
        <div><span>Customer</span><strong>${job.customer}</strong></div>
        <div><span>Contact</span><strong>${appointment?.phone || "N/A"}</strong></div>
        <div><span>Motorcycle</span><strong>${job.bike}</strong></div>
        <div><span>Assigned mechanic</span><strong>${job.mechanic}</strong></div>
        <div><span>Service requested</span><strong>${Array.isArray(services) ? services.join(", ") : services}</strong></div>
        <div><span>Status</span><strong>${statusBadge(job.status)}</strong></div>
        <div><span>Scheduled date</span><strong>${appointment?.date || "Not set"}</strong></div>
        <div><span>Scheduled time</span><strong>${appointment?.time || "Not set"}</strong></div>
        <div class="full"><span>Booked by customer</span><strong>${bookedAt}</strong></div>
        <div class="full"><span>Parts requested</span><strong>${parts}</strong></div>
        <div class="full"><span>Notes</span><strong>${appointment?.notes || job.note || "No notes provided"}</strong></div>
      </div>`;
  openModal(`Job Details: ${job.id}`, details);
}

$("#jobsAdminSearch")?.addEventListener("input", renderJobs);
$("#jobsAdminFilters")?.addEventListener("click", (event) => {
  const pill = event.target.closest(".pill");
  if (!pill) return;
  $$("#jobsAdminFilters .pill").forEach((item) =>
    item.classList.remove("active"),
  );
  pill.classList.add("active");
  renderJobs();
});

/* ===================== USER MANAGEMENT PAGE ===================== */
function renderUsers() {
  const usersGrid = $("#usersGrid");
  if (!usersGrid) return;
  const activeFilter = $("#userFilters .pill.active")?.dataset.filter || "All";
  const query = ($("#userSearch")?.value || "").toLowerCase();

  let list = DATA.users.filter(
    (u) => activeFilter === "All" || u.role === activeFilter,
  );
  if (query) {
    list = list.filter((u) => (u.name + u.email).toLowerCase().includes(query));
  }

  usersGrid.innerHTML =
    list
      .map(
        (u) => `
    <div class="user-card" style="background: #1e1e2d; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 16px; display: flex; flex-direction: column; gap: 12px;">
      <div style="display: flex; align-items: center; gap: 12px;">
        <div class="avatar" style="width: 40px; height: 40px; font-size: 14px;">${u.initials || avatarInitials(u.name)}</div>
        <div>
          <div style="font-weight: 600; font-size: 15px; color: #fff;">${u.name}</div>
          <div style="font-size: 12px; color: var(--text-sub, #9ca3af);">${u.email}</div>
        </div>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 10px;">
        <span style="background: rgba(255,107,26,0.15); color: var(--orange); padding: 3px 8px; border-radius: 4px; font-weight: 600; font-size: 11px; text-transform: uppercase;">${u.role}</span>
        <span style="color: var(--text-sub, #9ca3af);">${u.phone || "No phone"}</span>
      </div>
    </div>
  `,
      )
      .join("") ||
    `<p class="subtext" style="padding: 20px;">No users found.</p>`;
}

$$("#userFilters .pill").forEach((p) =>
  p.addEventListener("click", () => {
    $$("#userFilters .pill").forEach((x) => x.classList.remove("active"));
    p.classList.add("active");
    renderUsers();
  }),
);

/* ===================== USER MANAGEMENT PAGE ===================== */
function renderUsers() {
  const usersGrid = $("#usersGrid");
  if (!usersGrid) return;
  const activeFilter = $("#userFilters .pill.active")?.dataset.filter || "All";
  const list = DATA.users.filter(
    (u) => activeFilter === "All" || u.role === activeFilter,
  );

  usersGrid.innerHTML =
    list
      .map(
        (u) => `
    <div class="user-card">
      <div class="user-head">
        <div class="user-id">
          <div class="avatar">${u.initials}</div>
          <div>
            <div class="user-name">${u.name}</div>
            <span class="role-badge role-${u.role.toLowerCase()}">${u.role}</span>
          </div>
        </div>
        <button class="more-btn">⋯</button>
      </div>
      <div class="user-detail">✉ ${u.email}</div>
      <div class="user-detail">📞 ${u.phone}</div>
      <div class="user-detail">🕒 Member since ${u.since}</div>
    </div>
  `,
      )
      .join("") || `<p class="subtext">No users in this category.</p>`;
}

$$("#userFilters .pill").forEach((p) =>
  p.addEventListener("click", () => {
    $$("#userFilters .pill").forEach((x) => x.classList.remove("active"));
    p.classList.add("active");
    renderUsers();
  }),
);

const addUserBtnEl = $("#addUserBtn");
if (addUserBtnEl) {
  addUserBtnEl.addEventListener("click", () =>
    openModal(
      "Add User",
      `
    <div class="field"><label>Full Name</label><input placeholder="e.g. Pedro Cruz"></div>
    <div class="field"><label>Role</label><select><option>Admin</option><option>Mechanic</option><option>Customer</option></select></div>
    <div class="field"><label>Email</label><input placeholder="name@motofix.com"></div>
    <div class="field"><label>Phone</label><input placeholder="+63 912 000 0000"></div>
    <button class="btn-primary" style="width:100%;margin-top:6px;">Add User</button>
  `,
    ),
  );
}

/* ===================== MASTER EMPLOYEE MANAGER (INLINE) ===================== */
function renderMasterMechanicsTable() {
  const table = $("#masterMechanicsTable");
  if (!table) return;

  table.innerHTML = `
    <thead>
        <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Role</th>
            <th>Email</th>
            <th>Status</th>
            <th>Actions</th>
        </tr>
    </thead>
    <tbody>
        ${DATA.masterEmployees
          .map(
            (e) => `
            <tr>
                <td>${e.id}</td>
                <td>
                    <div class="person">
                        <div class="avatar">${avatarInitials(e.name)}</div>
                        <div>
                            <div class="person-name">${e.name}</div>
                        </div>
                    </div>
                </td>
                <td><span class="role-badge role-${e.role.toLowerCase()}">${e.role}</span></td>
                <td>${e.email}</td>
                <td>${statusBadge(e.status)}</td>
                <td>
                    <button class="btn-view delete-emp-inline" data-id="${e.id}" style="color: var(--red); border-color: rgba(239,68,68,0.2);">Deactivate</button>
                </td>
            </tr>
        `,
          )
          .join("")}
    </tbody>
  `;

  document.querySelectorAll(".delete-emp-inline").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.getAttribute("data-id"));
      if (
        confirm(
          "Are you sure you want to deactivate this store employee account?",
        )
      ) {
        DATA.masterEmployees = DATA.masterEmployees.filter((e) => e.id !== id);
        renderMasterMechanicsTable();
      }
    });
  });
}

const openAddMechanicModalBtn = $("#openAddMechanicModalBtn");
if (openAddMechanicModalBtn) {
  openAddMechanicModalBtn.addEventListener("click", () => {
    openModal(
      "Add Store Employee Account",
      `
      <div class="field"><label>Full Name</label><input id="newEmpName" placeholder="e.g. Juan Perez"></div>
      <div class="field"><label>Employee Role</label>
        <select id="newEmpRole">
          <option value="Mechanic">Mechanic</option>
          <option value="Admin">Store Admin</option>
        </select>
      </div>
      <div class="field"><label>Email Address</label><input id="newEmpEmail" placeholder="employee@motofix.com"></div>
      <button class="btn-primary" id="saveNewEmpBtn" style="width:100%;margin-top:6px;">Create Account</button>
      `,
    );

    const saveBtn = $("#saveNewEmpBtn");
    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        const nameInput = $("#newEmpName");
        const roleInput = $("#newEmpRole");
        const emailInput = $("#newEmpEmail");

        if (nameInput && nameInput.value) {
          const newId =
            DATA.masterEmployees.length > 0
              ? Math.max(...DATA.masterEmployees.map((e) => e.id)) + 1
              : 1;
          DATA.masterEmployees.push({
            id: newId,
            name: nameInput.value,
            role: roleInput ? roleInput.value : "Mechanic",
            email: emailInput ? emailInput.value : "employee@motofix.com",
            status: "Active",
          });
          renderMasterMechanicsTable();
          $("#modalBackdrop").classList.remove("open");
        }
      });
    }
  });
}

/* ===================== INVENTORY CRUD (EDIT & DELETE) ===================== */
function openEditPartModal(sku) {
  const part = DATA.inventory.find((i) => i.sku === sku);
  if (!part) return;

  openModal(
    "Edit Part",
    `
    <form id="editPartForm">
        <input type="hidden" id="editPartOriginalSku" value="${part.sku}">
        <div style="margin-bottom: 12px;">
            <label style="display:block; margin-bottom:4px; font-weight:500;">Part Name</label>
            <input type="text" id="editPartName" value="${part.name}" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
        </div>
        <div style="margin-bottom: 12px;">
            <label style="display:block; margin-bottom:4px; font-weight:500;">SKU</label>
            <input type="text" id="editPartSku" value="${part.sku}" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
        </div>
        <div style="margin-bottom: 12px;">
            <label style="display:block; margin-bottom:4px; font-weight:500;">Brand</label>
            <input type="text" id="editPartBrand" value="${part.brand}" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
        </div>
        <div style="margin-bottom: 12px;">
            <label style="display:block; margin-bottom:4px; font-weight:500;">Category</label>
            <input type="text" id="editPartCategory" value="${part.category}" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
        </div>
        <div style="margin-bottom: 12px;">
            <label style="display:block; margin-bottom:4px; font-weight:500;">Stock</label>
            <input type="number" id="editPartStock" min="0" value="${part.stock}" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
        </div>
        <div style="margin-bottom: 12px;">
            <label style="display:block; margin-bottom:4px; font-weight:500;">Unit Price (₱)</label>
            <input type="number" id="editPartPrice" step="0.01" min="0" value="${part.price}" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
        </div>
        <button type="submit" class="btn-primary" style="width:100%; margin-top:10px;">Update Part</button>
    </form>
  `,
  );
}

function deletePart(sku) {
  if (confirm(`Are you sure you want to delete the part with SKU: ${sku}?`)) {
    DATA.inventory = DATA.inventory.filter((i) => i.sku !== sku);
    localStorage.setItem("motofix_parts", JSON.stringify(DATA.inventory));
    renderInvFilters();
    renderInventoryTable();
  }
}

/* ===================== SERVICES CRUD (EDIT & DELETE) ===================== */
function openEditServiceModal(code) {
  const service = DATA.services.find((s) => s.code === code);
  if (!service) return;

  openModal(
    "Edit Service",
    `
    <form id="editServiceForm">
        <input type="hidden" id="editServiceCode" value="${service.code}">
        <div style="margin-bottom: 12px;">
            <label style="display:block; margin-bottom:4px; font-weight:500;">Service Name</label>
            <input type="text" id="editServiceName" value="${service.name}" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
        </div>
        <div style="margin-bottom: 12px;">
            <label style="display:block; margin-bottom:4px; font-weight:500;">Category</label>
            <input type="text" id="editServiceCategory" value="${service.category}" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
        </div>
        <div style="margin-bottom: 12px;">
            <label style="display:block; margin-bottom:4px; font-weight:500;">Description</label>
            <textarea id="editServiceDesc" rows="3" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">${service.desc}</textarea>
        </div>
        <div style="margin-bottom: 12px;">
            <label style="display:block; margin-bottom:4px; font-weight:500;">Price (₱)</label>
            <input type="number" id="editServicePrice" step="0.01" min="0" value="${service.price}" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
        </div>
        <div style="margin-bottom: 12px;">
            <label style="display:block; margin-bottom:4px; font-weight:500;">Duration Label</label>
            <input type="text" id="editServiceHours" value="${service.hoursLabel}" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
        </div>
        <button type="submit" class="btn-primary" style="width:100%; margin-top:10px;">Update Service</button>
    </form>
  `,
  );
}

function deleteService(code) {
  if (confirm(`Are you sure you want to delete service code: ${code}?`)) {
    DATA.services = DATA.services.filter((s) => s.code !== code);
    localStorage.setItem("motofix_services", JSON.stringify(DATA.services));
    renderServiceFilters();
    renderServicesGrid();
  }
}

// Global listener handling edit form submissions
document.addEventListener("submit", (e) => {
  if (e.target && e.target.id === "editPartForm") {
    e.preventDefault();
    const originalSku = document.getElementById("editPartOriginalSku").value;

    const updatedPart = {
      name: document.getElementById("editPartName").value,
      sku: document.getElementById("editPartSku").value,
      brand: document.getElementById("editPartBrand").value,
      category: document.getElementById("editPartCategory").value,
      stock: parseInt(document.getElementById("editPartStock").value, 10),
      max: 60,
      price: parseFloat(document.getElementById("editPartPrice").value),
    };

    const index = DATA.inventory.findIndex((i) => i.sku === originalSku);
    if (index !== -1) {
      DATA.inventory[index] = updatedPart;
      localStorage.setItem("motofix_parts", JSON.stringify(DATA.inventory));
      renderInvFilters();
      renderInventoryTable();
    }
    document.getElementById("modalBackdrop").classList.remove("open");
  }

  if (e.target && e.target.id === "editServiceForm") {
    e.preventDefault();
    const code = document.getElementById("editServiceCode").value;

    const updatedService = {
      code: code,
      name: document.getElementById("editServiceName").value,
      category: document.getElementById("editServiceCategory").value,
      price: parseFloat(document.getElementById("editServicePrice").value),
      hours: 1,
      hoursLabel: document.getElementById("editServiceHours").value,
      desc: document.getElementById("editServiceDesc").value,
    };

    const index = DATA.services.findIndex((s) => s.code === code);
    if (index !== -1) {
      DATA.services[index] = updatedService;
      localStorage.setItem("motofix_services", JSON.stringify(DATA.services));
      renderServiceFilters();
      renderServicesGrid();
    }
    document.getElementById("modalBackdrop").classList.remove("open");
  }
});

/* ===================== INIT ===================== */
function init() {
  syncAppointmentsFromStorage();

  // Master Admin Sidebar Check
  const userRole = localStorage.getItem("userRole");
  if (userRole === "master_admin") {
    const masterNavItem = document.getElementById("masterPortalNavItem");
    const masterLabel = document.getElementById("masterAdminLabel");
    if (masterNavItem) masterNavItem.style.display = "flex";
    if (masterLabel) masterLabel.style.display = "block";
  }

  renderBarChart("revenueChart", DATA.revenue);
  renderBarChart("revenueChart2", DATA.revenue);
  renderPieChart("serviceMixPie", "serviceMixLegend", DATA.serviceMix);
  renderDashboardAppointments();

  renderAppointmentsPage();

  renderServiceFilters();
  renderServicesGrid();

  renderCustomizationFilters();
  renderBikes();

  renderInvFilters();
  renderInventoryTable();

  renderInvoices();

  renderJobs();

  renderUsers();

  renderMasterMechanicsTable();
  renderAdminNotifications();
}

document.addEventListener("DOMContentLoaded", init);

window.addEventListener("storage", (event) => {
  if (event.key === "motofix_notifications") renderAdminNotifications();
  if (event.key === APPOINTMENT_STORAGE_KEY) {
    syncAppointmentsFromStorage();
    renderDashboardAppointments();
    renderAppointmentsPage();
  }
});

/* =========================================================
   EDIT SERVICE FORM SUBMISSION HANDLER (Completion Fix)
========================================================= */
document.addEventListener("submit", (e) => {
  if (e.target && e.target.id === "editServiceForm") {
    e.preventDefault();

    const serviceCode = document.getElementById("editServiceCode").value;
    const serviceIndex = DATA.services.findIndex((s) => s.code === serviceCode);

    if (serviceIndex !== -1) {
      DATA.services[serviceIndex] = {
        ...DATA.services[serviceIndex],
        name: document.getElementById("editServiceName").value,
        category: document.getElementById("editServiceCategory").value,
        desc: document.getElementById("editServiceDesc").value,
        price: parseFloat(document.getElementById("editServicePrice").value),
      };

      // Save updated services list to localStorage
      localStorage.setItem("motofix_services", JSON.stringify(DATA.services));

      // Close modal and refresh UI views
      document.getElementById("modalBackdrop").classList.remove("open");
      renderServiceFilters();
      renderServicesGrid();

      if (typeof showNotification === "function") {
        showNotification(
          `Service ${serviceCode} updated successfully!`,
          "success",
        );
      }
    }
  }
});
