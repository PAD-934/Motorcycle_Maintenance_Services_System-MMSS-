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
      mechanic: "Dante Cruz",
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
      status: "Completed",
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
      mechanic: "Dante Cruz",
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
      name: "Dante Cruz",
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
};

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

const sidebar = $("#sidebar");
const menuToggle = $("#menuToggle");

function updateSidebarState() {
  const isMobile = window.innerWidth <= 860;
  const isOpen = isMobile
    ? sidebar.classList.contains("open")
    : !sidebar.classList.contains("collapsed");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
}

menuToggle.addEventListener("click", () => {
  if (window.innerWidth <= 860) {
    sidebar.classList.toggle("open");
  } else {
    sidebar.classList.toggle("collapsed");
  }
  updateSidebarState();
});

window.addEventListener("resize", updateSidebarState);
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

/* ===================== DASHBOARD: BAR CHART ===================== */
function renderBarChart(containerId, data) {
  const el = $("#" + containerId);
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
  let acc = 0;
  const stops = data
    .map((d) => {
      const start = acc;
      acc += d.pct;
      return `${d.color} ${start}% ${acc}%`;
    })
    .join(", ");
  $("#" + pieId).style.background = `conic-gradient(${stops})`;

  $("#" + legendId).innerHTML = data
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

/* ===================== APPOINTMENTS TABLE ===================== */
function apptRowHTML(a, withActions) {
  return `
    <tr>
      <td>
        <div class="person">
          <div class="avatar">${a.initials}</div>
          <div>
            <div class="person-name">${a.customer}</div>
            ${withActions ? `<div class="person-sub">${a.phone}</div>` : ""}
          </div>
        </div>
      </td>
      <td>${a.bike}</td>
      <td>${a.services.join(", ")}</td>
      <td>${a.date}<div class="dt-time">${a.time}</div></td>
      <td>${a.mechanic ? a.mechanic : '<span class="unassigned">Unassigned</span>'}</td>
      <td>${statusBadge(a.status)}</td>
      ${withActions ? `<td>${a.status !== "Completed" && a.status !== "Cancelled" ? `<button class="btn-mini" data-advance="${a.id}">Advance</button>` : ""}</td>` : ""}
    </tr>
  `;
}

function renderDashboardAppointments() {
  const t = $("#dashAppointmentsTable");
  t.innerHTML = `
    <thead><tr>
      <th>Customer</th><th>Motorcycle</th><th>Services</th><th>Date &amp; Time</th><th>Mechanic</th><th>Status</th>
    </tr></thead>
    <tbody>${DATA.appointments.map((a) => apptRowHTML(a, false)).join("")}</tbody>
  `;
}

const STATUS_FLOW = ["Pending", "Confirmed", "In Progress", "Completed"];

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
  t.innerHTML = `
    <thead><tr>
      <th>#</th><th>Customer</th><th>Motorcycle</th><th>Services</th><th>Date / Time</th><th>Mechanic</th><th>Status</th><th>Actions</th>
    </tr></thead>
    <tbody>${
      rows
        .map(
          (a) => `
      <tr>
        <td class="subtext">${a.id}</td>
        ${apptRowHTML(a, true).replace("<tr>", "").replace("</tr>", "")}
      </tr>`,
        )
        .join("") ||
      `<tr><td colspan="8" class="subtext" style="padding:26px 22px;">No appointments found.</td></tr>`
    }
    </tbody>
  `;

  $$("[data-advance]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const appt = DATA.appointments.find((a) => a.id === btn.dataset.advance);
      const idx = STATUS_FLOW.indexOf(appt.status);
      if (idx > -1 && idx < STATUS_FLOW.length - 1) {
        appt.status = STATUS_FLOW[idx + 1];
        renderAppointmentsPage();
        renderDashboardAppointments();
      }
    }),
  );
}

$$("#apptFilters .pill").forEach((p) =>
  p.addEventListener("click", () => {
    $$("#apptFilters .pill").forEach((x) => x.classList.remove("active"));
    p.classList.add("active");
    renderAppointmentsPage();
  }),
);
$("#apptSearch").addEventListener("input", renderAppointmentsPage);

$("#newApptBtn").addEventListener("click", () =>
  openModal(
    "New Appointment",
    `
  <div class="field"><label>Customer</label><input placeholder="e.g. Miguel Torres"></div>
  <div class="field"><label>Motorcycle</label><input placeholder="e.g. 2022 Honda PCX 160"></div>
  <div class="field"><label>Service</label><select>${DATA.services.map((s) => `<option>${s.name}</option>`).join("")}</select></div>
  <div class="field"><label>Date &amp; Time</label><input type="datetime-local"></div>
  <button class="btn-primary" style="width:100%;margin-top:6px;">Create Appointment</button>
`,
  ),
);

/* ===================== SERVICES PAGE ===================== */
function renderServiceFilters() {
  const cats = ["All", ...new Set(DATA.services.map((s) => s.category))];
  $("#svcFilters").innerHTML = cats
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
  const activeFilter = $("#svcFilters .pill.active")?.dataset.filter || "All";
  const query = ($("#svcSearch").value || "").toLowerCase();
  let list = DATA.services.filter(
    (s) => activeFilter === "All" || s.category === activeFilter,
  );
  if (query) list = list.filter((s) => s.name.toLowerCase().includes(query));

  $("#servicesGrid").innerHTML =
    list
      .map(
        (s) => `
    <div class="svc-card">
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
      <div class="svc-meta"><span>⏱ ${s.hoursLabel}</span><span># ${s.code}</span></div>
    </div>
  `,
      )
      .join("") || `<p class="subtext">No services match your search.</p>`;
}

$("#svcSearch").addEventListener("input", renderServicesGrid);

/* ===================== CUSTOMIZATION PAGE ===================== */
function renderBikes() {
  $("#bikeList").innerHTML = DATA.bikes
    .map(
      (b) => `
    <div class="bike-card">
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
      ${b.mods.length ? `<div class="bike-mods">${b.mods.map((m) => `<span class="mod-tag">${m}</span>`).join("")}</div>` : ""}
    </div>
  `,
    )
    .join("");
}

/* ===================== INVENTORY PAGE ===================== */
function renderInvFilters() {
  const cats = ["All", ...new Set(DATA.inventory.map((i) => i.category))];
  $("#invFilters").innerHTML = cats
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
  const activeFilter = $("#invFilters .pill.active")?.dataset.filter || "All";
  const query = ($("#invSearch").value || "").toLowerCase();
  let list = DATA.inventory.filter(
    (i) => activeFilter === "All" || i.category === activeFilter,
  );
  if (query)
    list = list.filter((i) => (i.name + i.sku).toLowerCase().includes(query));

  $("#invTable").innerHTML = `
    <thead><tr>
      <th>Part Name</th><th>SKU</th><th>Brand</th><th>Category</th><th>Stock</th><th>Unit Price</th><th>Status</th>
    </tr></thead>
    <tbody>${
      list
        .map(
          (i) => `
      <tr>
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
}

$("#invSearch").addEventListener("input", renderInventoryTable);

/* ===================== BILLING PAGE ===================== */
function renderInvoices() {
  $("#invoiceCount").textContent =
    `${DATA.invoices.length} invoice${DATA.invoices.length === 1 ? "" : "s"} total`;
  $("#invoiceTable").innerHTML = `
    <thead><tr>
      <th>Invoice #</th><th>Customer</th><th>Job Ref</th><th>Items</th><th>Subtotal</th><th>VAT</th><th>Total</th><th>Status</th><th>Date</th><th></th>
    </tr></thead>
    <tbody>${DATA.invoices
      .map(
        (inv) => `
      <tr>
        <td style="color:var(--orange);font-weight:700;font-family:var(--font-mono);">${inv.id}</td>
        <td>${inv.customer}</td>
        <td class="subtext">${inv.jobRef}</td>
        <td>${inv.items}</td>
        <td>${peso(inv.subtotal)}</td>
        <td>${peso(inv.vat)}</td>
        <td style="color:var(--orange);font-weight:700;">${peso(inv.total)}</td>
        <td>${statusBadge(inv.status)}</td>
        <td class="subtext">${inv.date}</td>
        <td><button class="btn-view" data-view-invoice="${inv.id}">👁 View</button></td>
      </tr>
    `,
      )
      .join("")}</tbody>
  `;
  $$("[data-view-invoice]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const inv = DATA.invoices.find((i) => i.id === btn.dataset.viewInvoice);
      openModal(
        inv.id,
        `
      <p><strong>Customer:</strong> ${inv.customer}</p>
      <p><strong>Job Reference:</strong> ${inv.jobRef}</p>
      <p><strong>Items:</strong> ${inv.items}</p>
      <p><strong>Subtotal:</strong> ${peso(inv.subtotal)}</p>
      <p><strong>VAT (12%):</strong> ${peso(inv.vat)}</p>
      <p><strong>Total:</strong> ${peso(inv.total)}</p>
      <p><strong>Status:</strong> ${inv.status}</p>
      <p><strong>Date:</strong> ${inv.date}</p>
    `,
      );
    }),
  );
}

$("#newInvoiceBtn").addEventListener("click", () =>
  openModal(
    "New Invoice",
    `
  <div class="field"><label>Job Reference</label><input placeholder="e.g. J2"></div>
  <div class="field"><label>Customer</label><input placeholder="e.g. Ana Flores"></div>
  <div class="field"><label>Subtotal</label><input placeholder="₱0.00"></div>
  <button class="btn-primary" style="width:100%;margin-top:6px;">Generate Invoice</button>
`,
  ),
);

$$(".tab").forEach((tab) =>
  tab.addEventListener("click", () => {
    $$(".tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    $$(".tab-panel").forEach((p) => p.classList.remove("active"));
    $("#tab-" + tab.dataset.tab).classList.add("active");
  }),
);

/* ===================== MECHANIC JOBS PAGE ===================== */
function renderJobs() {
  $("#jobsList").innerHTML = DATA.jobs
    .map(
      (j) => `
    <div class="job-card">
      <div class="job-top">
        <span class="job-id">${j.id}</span>
        ${statusBadge(j.status)}
      </div>
      <div class="job-customer">${j.customer}</div>
      <div class="job-bike">${j.bike}</div>
      <div class="job-mech">
        <div class="avatar">${j.initials}</div>
        <span>${j.mechanic}</span>
        <span class="subtext">${j.parts} parts</span>
        <span class="job-cost">${peso(j.cost)}</span>
      </div>
      <div class="job-note">${j.note}</div>
    </div>
  `,
    )
    .join("");
}

/* ===================== USER MANAGEMENT PAGE ===================== */
function renderUsers() {
  const activeFilter = $("#userFilters .pill.active")?.dataset.filter || "All";
  const list = DATA.users.filter(
    (u) => activeFilter === "All" || u.role === activeFilter,
  );

  $("#usersGrid").innerHTML =
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

$("#addUserBtn").addEventListener("click", () =>
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

/* ===================== INIT ===================== */
function init() {
  renderBarChart("revenueChart", DATA.revenue);
  renderBarChart("revenueChart2", DATA.revenue);
  renderPieChart("serviceMixPie", "serviceMixLegend", DATA.serviceMix);
  renderDashboardAppointments();

  renderAppointmentsPage();

  renderServiceFilters();
  renderServicesGrid();

  renderBikes();

  renderInvFilters();
  renderInventoryTable();

  renderInvoices();

  renderJobs();

  renderUsers();
}

document.addEventListener("DOMContentLoaded", init);
