(function () {
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  const userRole = localStorage.getItem("userRole");
  if (!isLoggedIn || userRole !== "mechanic") {
    window.location.href = "../../login.html";
    return;
  }

  /* ---------------- Data ---------------- */
  const mechanicProfiles = {
    "mechanic1@motofix.com": {
      name: "Ramon Santos",
      email: "mechanic1@motofix.com",
      role: "Mechanic",
      initials: "RS",
    },
    "mechanic2@motofix.com": {
      name: "Jake Reyes",
      email: "mechanic2@motofix.com",
      role: "Mechanic",
      initials: "JR",
    },
  };
  const CURRENT_USER =
    mechanicProfiles[(localStorage.getItem("userEmail") || "").toLowerCase()] ||
    mechanicProfiles["mechanic1@motofix.com"];
  const TODAY = "2026-07-22";

  const STATUS_ORDER = ["pending", "confirmed", "in_progress", "completed"];
  const STATUS_LABEL = {
    pending: "Pending",
    confirmed: "Confirmed",
    in_progress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  let jobs = [
    {
      id: "A1",
      customer: "Miguel Torres",
      phone: "+63 912 100 0001",
      initials: "MT",
      motorcycle: "2022 Honda PCX 160",
      plate: null,
      services: ["Basic Oil Change", "Brake System Service"],
      date: "2026-07-24",
      time: "09:00",
      status: "confirmed",
      mechanic: "Ramon Santos",
      notes: "Brakes feel spongy",
      labor: null,
    },
    {
      id: "A3",
      customer: "Ana Flores",
      phone: "+63 912 100 0003",
      initials: "AF",
      motorcycle: "2020 Suzuki Gixxer 150",
      plate: null,
      services: ["Chain & Sprocket Kit"],
      date: "2026-07-25",
      time: "10:00",
      status: "pending",
      mechanic: "Ramon Santos",
      notes: null,
      labor: null,
    },
    {
      id: "A5",
      customer: "Jose Bautista",
      phone: "+63 912 100 0002",
      initials: "JB",
      motorcycle: "2023 Kawasaki Dominar 400",
      plate: "KLM 9012",
      services: ["Engine Overhaul"],
      date: "2026-07-22",
      time: "08:00",
      status: "completed",
      mechanic: "Ramon Santos",
      notes: "Engine knock at high RPM",
      labor: 2500,
      record:
        "Engine overhauled, new piston rings, gaskets replaced. Test ride confirmed fix.",
    },
  ];

  function normalizeMechanicStatus(status) {
    const value = (status || "Pending").toString();
    const map = {
      Pending: "pending",
      Confirmed: "confirmed",
      "In Progress": "in_progress",
      "Work Finished (unpaid)": "completed",
      "Complete transaction": "completed",
      Cancelled: "cancelled",
      cancelled: "cancelled",
    };
    return map[value] || value.toLowerCase().replace(/\s+/g, "_");
  }

  function syncJobsFromSharedAppointments() {
    try {
      const stored = JSON.parse(
        localStorage.getItem("motofix_appointments") || "[]",
      );
      if (!Array.isArray(stored)) return;

      jobs = stored
        .filter((appointment) => appointment.mechanic === CURRENT_USER.name)
        .map((appointment) => ({
          id: appointment.id || "A1",
          customer: appointment.customer || "Customer",
          phone: appointment.phone || "N/A",
          initials:
            appointment.initials ||
            (appointment.customer || "C")
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase(),
          motorcycle:
            appointment.bike || appointment.motorcycle || "Unknown Motorcycle",
          plate: appointment.plate || null,
          services: Array.isArray(appointment.services)
            ? appointment.services
            : [appointment.services || "Service"],
          date: appointment.date || "",
          time: appointment.time || "",
          status: normalizeMechanicStatus(appointment.status),
          mechanic: appointment.mechanic || "Unassigned",
          notes: appointment.notes || null,
          labor: appointment.labor || null,
          record: appointment.record || null,
          createdAt: appointment.createdAt || null,
          parts: Array.isArray(appointment.parts) ? appointment.parts : [],
        }));
    } catch (error) {
      console.error(
        "Unable to sync mechanic jobs from shared appointments:",
        error,
      );
    }
  }

  function persistMechanicStatus(jobId, status) {
    const appointments = JSON.parse(
      localStorage.getItem("motofix_appointments") || "[]",
    );
    const appointment = appointments.find((item) => item.id === jobId);
    if (!appointment) return;

    const labels = {
      pending: "Pending",
      confirmed: "Confirmed",
      in_progress: "In Progress",
      completed: "Complete transaction",
      cancelled: "Cancelled",
    };
    appointment.status = labels[status] || status;
    localStorage.setItem("motofix_appointments", JSON.stringify(appointments));

    const notifications = JSON.parse(
      localStorage.getItem("motofix_notifications") || "[]",
    );
    notifications.unshift({
      id: `N${Date.now()}`,
      title: "Appointment status updated",
      message: `${appointment.id} is now ${appointment.status}.`,
      audiences: ["customer", "admin", "master_admin"],
      createdAt: new Date().toISOString(),
      readBy: [],
    });
    localStorage.setItem(
      "motofix_notifications",
      JSON.stringify(notifications.slice(0, 100)),
    );
  }

  function renderMechanicNotifications() {
    const panel = document.getElementById("notifPanel");
    const dot = document.getElementById("bellDot");
    if (!panel) return;
    const notifications = JSON.parse(
      localStorage.getItem("motofix_notifications") || "[]",
    ).filter(
      (notification) =>
        notification.audiences?.includes("mechanic") ||
        notification.audiences?.includes(`mechanic:${CURRENT_USER.name}`),
    );
    panel.innerHTML = `<div class="notif-head">Notifications</div>${
      notifications.length
        ? notifications
            .slice(0, 8)
            .map(
              (notification) => `
      <div class="notif-item"><div class="t">${escapeHtml(notification.title)}</div><div class="d">${escapeHtml(notification.message)}</div></div>
    `,
            )
            .join("")
        : '<div class="notif-item"><div class="d">No new notifications.</div></div>'
    }`;
    if (dot) dot.style.display = notifications.length ? "block" : "none";
  }

  window.addEventListener("storage", (event) => {
    if (event.key === "motofix_notifications") renderMechanicNotifications();
    if (event.key === "motofix_appointments") {
      syncJobsFromSharedAppointments();
      renderAppointments();
      renderDashboard();
      renderJobs();
    }
  });

  const parts = [
    {
      name: "Engine Oil 10W-40 (1L)",
      sku: "OIL-10W40-1L",
      brand: "Motul",
      cat: "Fluids",
      stock: 48,
      price: 180,
    },
    {
      name: "Oil Filter — Honda PCX",
      sku: "FLT-OIL-PCX",
      brand: "Honda Genuine",
      cat: "Filters",
      stock: 22,
      price: 95,
    },
    {
      name: "Spark Plug CR8E",
      sku: "SPK-CR8E",
      brand: "NGK",
      cat: "Ignition",
      stock: 64,
      price: 75,
    },
    {
      name: "Air Filter — Yamaha NMAX",
      sku: "FLT-AIR-NMAX",
      brand: "Yamaha Genuine",
      cat: "Filters",
      stock: 18,
      price: 220,
    },
    {
      name: "Brake Pad Set — Front",
      sku: "BRK-PAD-FR",
      brand: "EBC",
      cat: "Brakes",
      stock: 30,
      price: 450,
    },
    {
      name: "Brake Fluid DOT4 (500ml)",
      sku: "FLD-DOT4-500",
      brand: "Brembo",
      cat: "Fluids",
      stock: 25,
      price: 130,
    },
    {
      name: "Chain Kit 428 (110L)",
      sku: "CHN-428-110",
      brand: "DID",
      cat: "Drivetrain",
      stock: 12,
      price: 680,
    },
    {
      name: "Front Sprocket 15T",
      sku: "SPR-FR-15T",
      brand: "Renthal",
      cat: "Drivetrain",
      stock: 20,
      price: 240,
    },
    {
      name: "Rear Sprocket 42T",
      sku: "SPR-RR-42T",
      brand: "Renthal",
      cat: "Drivetrain",
      stock: 15,
      price: 380,
    },
    {
      name: "Fork Oil 15W (1L)",
      sku: "OIL-FRK-15W",
      brand: "Motul",
      cat: "Fluids",
      stock: 16,
      price: 210,
    },
    {
      name: "Carburetor Jet Kit",
      sku: "CARB-JET-UNI",
      brand: "Universal",
      cat: "Engine",
      stock: 8,
      price: 350,
    },
    {
      name: "Battery 12V 5Ah",
      sku: "BAT-12V-5AH",
      brand: "Yuasa",
      cat: "Electrical",
      stock: 10,
      price: 850,
    },
  ];

  let apptStatusFilter = "pending";
  let apptSearchTerm = "";
  let jobsSearchTerm = "";
  let jobsStatusFilter = "all";
  let jobsScheduleFilter = "all";
  let invCatFilter = "All";
  let invSearchTerm = "";

  /* ---------------- Helpers ---------------- */
  const fmtDate = (iso) => {
    const d = new Date(iso + "T00:00:00");
    return d
      .toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
      .replace(/\//g, "-")
      .split("-")
      .reverse()
      .join("-") === iso
      ? iso
      : iso;
  };
  const peso = (n) =>
    "₱" +
    Number(n).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const escapeHtml = (s) =>
    (s || "").replace(
      /[&<>"']/g,
      (m) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[m],
    );

  function badge(status) {
    return `<span class="badge ${status}">${STATUS_LABEL[status]}</span>`;
  }

  function nextStatus(s) {
    const i = STATUS_ORDER.indexOf(s);
    if (i === -1 || i === STATUS_ORDER.length - 1) return null;
    return STATUS_ORDER[i + 1];
  }

  /* ---------------- Renderers ---------------- */
  function statCard(label, value, iconSvg, colorClass, isCurrency) {
    return `
      <div class="stat-card">
        <div class="stat-top">
          <div class="stat-label">${label}</div>
          <div class="stat-icon ${colorClass}">${iconSvg}</div>
        </div>
        <div class="stat-value">${isCurrency ? `<span class="cur">₱</span>${Number(value).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : value}</div>
      </div>`;
  }

  const ICONS = {
    calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="16" rx="2"></rect><path d="M3 9.5h18M8 3v3M16 3v3"></path></svg>`,
    progress: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>`,
    check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M8.5 12.5l2.5 2.5 5-5.5"></path></svg>`,
    cash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="12" cy="12" r="3"></circle></svg>`,
    clipboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="17" rx="2"></rect><path d="M9 3h6v3H9zM8 11h8M8 15h5"></path></svg>`,
  };

  function renderDashboard() {
    const todaysJobs = jobs.filter((j) => j.date === TODAY);
    const inProgress = jobs.filter((j) => j.status === "in_progress");
    const completed = jobs.filter((j) => j.status === "completed");
    const monthLabor = jobs
      .filter((j) => j.status === "completed")
      .reduce((s, j) => s + (j.labor || 0), 0);

    document.getElementById("dashStats").innerHTML = [
      statCard("Today's Jobs", todaysJobs.length, ICONS.calendar, "orange"),
      statCard("In Progress", inProgress.length, ICONS.progress, "blue"),
      statCard("Completed", completed.length, ICONS.check, "green"),
      statCard("This Month Labor", monthLabor, ICONS.cash, "amber", true),
    ].join("");

    const box = document.getElementById("todaySchedule");
    if (todaysJobs.length === 0) {
      box.innerHTML = emptyState(
        "No jobs scheduled today",
        "Enjoy the downtime — check Appointments for what's coming up.",
      );
      return;
    }
    box.innerHTML = todaysJobs
      .map(
        (j) => `
      <div class="sched-item">
        <div class="sched-time">${j.time}</div>
        <div class="sched-main">
          <div class="c-name">${escapeHtml(j.customer)}</div>
          <div class="c-bike">${escapeHtml(j.motorcycle)}${j.plate ? " · " + escapeHtml(j.plate) : ""}</div>
          <div class="c-service">${j.services.map(escapeHtml).join(", ")}</div>
          ${
            j.notes
              ? `<div class="c-warn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"></path></svg>
            ${escapeHtml(j.notes)}
          </div>`
              : ""
          }
        </div>
        ${badge(j.status)}
      </div>
    `,
      )
      .join("");
  }

  function emptyState(title, sub) {
    return `<div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M9 10h.01M15 10h.01M8 15c1 1.2 2.4 2 4 2s3-.8 4-2"></path></svg>
      <div class="e-title">${title}</div>
      <div class="e-sub">${sub}</div>
    </div>`;
  }

  function renderJobs() {
    const mine = jobs.filter((j) => j.mechanic === CURRENT_USER.name);
    const inProgress = mine.filter((j) => j.status === "in_progress").length;
    const completedToday = mine.filter(
      (j) => j.status === "completed" && j.date === TODAY,
    ).length;
    const laborEarned = mine
      .filter((j) => j.status === "completed")
      .reduce((s, j) => s + (j.labor || 0), 0);

    document.getElementById("jobsStats").innerHTML = [
      statCard("Assigned Jobs", mine.length, ICONS.clipboard, "blue"),
      statCard("In Progress", inProgress, ICONS.progress, "orange"),
      statCard("Completed Today", completedToday, ICONS.check, "green"),
      statCard("Labor Earned", laborEarned, ICONS.cash, "amber", true),
    ].join("");

    const today = new Date().toISOString().slice(0, 10);
    const query = jobsSearchTerm.trim().toLowerCase();
    const visibleJobs = mine.filter((job) => {
      const searchable = [
        job.customer,
        job.motorcycle,
        ...(job.services || []),
        job.id,
      ]
        .join(" ")
        .toLowerCase();
      const matchesSearch = !query || searchable.includes(query);
      const matchesStatus =
        jobsStatusFilter === "all" || job.status === jobsStatusFilter;
      const matchesSchedule =
        jobsScheduleFilter === "all" ||
        (jobsScheduleFilter === "today" && job.date === today) ||
        (jobsScheduleFilter === "upcoming" && job.date >= today) ||
        (jobsScheduleFilter === "past" && job.date < today);
      return matchesSearch && matchesStatus && matchesSchedule;
    });

    document.getElementById("jobsCount").textContent = visibleJobs.length;
    document.getElementById("jobsFilterSummary").textContent =
      `${visibleJobs.length} of ${mine.length} assigned jobs`;
    document.getElementById("jobsTableBody").innerHTML = visibleJobs.length
      ? visibleJobs
          .map(
            (j) => `
      <tr>
        <td>
          <div class="cust-cell">
            <div class="init">${j.initials}</div>
            <div><div class="c-name">${escapeHtml(j.customer)}</div><div class="c-phone">${j.phone}</div></div>
          </div>
        </td>
        <td>${escapeHtml(j.motorcycle)}</td>
        <td>${j.services.map((s) => `<span class="svc-line">${escapeHtml(s)}</span>`).join("")}</td>
        <td><div class="dt-cell"><div class="d">${j.date}</div><div class="t">${j.time}</div></div></td>
        <td>${badge(j.status)}</td>
        <td class="${j.notes ? "note-warn" : "note-dim"}">${j.notes ? escapeHtml(j.notes) : "—"}</td>
        <td><button class="job-details-btn" type="button" data-job-details="${j.id}">View Details</button></td>
      </tr>
    `,
          )
          .join("")
      : `<tr><td colspan="7" class="jobs-empty-row">No jobs match the selected filters.</td></tr>`;

    document.querySelectorAll("[data-job-details]").forEach((button) => {
      button.addEventListener("click", () => {
        const job = jobs.find((item) => item.id === button.dataset.jobDetails);
        if (job) openJobDetails(job);
      });
    });

    const records = mine.filter((j) => j.status === "completed" && j.record);
    const recBox = document.getElementById("jobRecords");
    if (records.length === 0) {
      recBox.innerHTML = emptyState(
        "No job records yet",
        "Completed jobs with a service summary will show up here.",
      );
    } else {
      recBox.innerHTML = records
        .map(
          (j) => `
        <div class="record-card">
          <div class="record-top">
            <div>
              <div class="record-id">${j.id}</div>
              <div class="record-name">${escapeHtml(j.customer)}</div>
            </div>
            <div style="text-align:right">
              ${badge(j.status)}
              ${j.labor ? `<div class="record-labor">${peso(j.labor)} Labor</div>` : ""}
            </div>
          </div>
          <div class="record-note">${escapeHtml(j.record)}</div>
        </div>
      `,
        )
        .join("");
    }
  }

  function openJobDetails(job) {
    const existing = document.getElementById("jobDetailsModal");
    if (existing) existing.remove();
    const bookedAt = job.createdAt
      ? new Date(job.createdAt).toLocaleString("en-PH", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "Not available for this legacy booking";
    const parts = job.parts?.length
      ? job.parts
          .map((part) => `${escapeHtml(part.name)} x${part.quantity || 1}`)
          .join(", ")
      : "No parts requested";
    const modal = document.createElement("div");
    modal.id = "jobDetailsModal";
    modal.className = "job-details-backdrop";
    modal.innerHTML = `
      <section class="job-details-modal" role="dialog" aria-modal="true" aria-labelledby="jobDetailsTitle">
        <div class="job-details-head"><div><div class="job-details-kicker">Appointment ${escapeHtml(job.id)}</div><h2 id="jobDetailsTitle">${escapeHtml(job.customer)}</h2></div><button class="job-details-close" type="button" aria-label="Close details">&times;</button></div>
        <div class="job-details-grid">
          <div><span>Customer</span><strong>${escapeHtml(job.customer)}</strong><small>${escapeHtml(job.phone)}</small></div>
          <div><span>Assigned mechanic</span><strong>${escapeHtml(job.mechanic)}</strong></div>
          <div><span>Motorcycle</span><strong>${escapeHtml(job.motorcycle)}</strong></div>
          <div><span>Appointment status</span><strong>${badge(job.status)}</strong></div>
          <div><span>Scheduled date</span><strong>${escapeHtml(job.date || "Not set")}</strong></div>
          <div><span>Scheduled time</span><strong>${escapeHtml(job.time || "Not set")}</strong></div>
          <div class="full"><span>Booked by customer</span><strong>${escapeHtml(bookedAt)}</strong></div>
          <div class="full"><span>Service requested</span><strong>${job.services.map((service) => escapeHtml(service)).join(", ")}</strong></div>
          <div class="full"><span>Parts requested</span><strong>${parts}</strong></div>
          <div class="full"><span>Notes</span><strong>${escapeHtml(job.notes || "No notes provided")}</strong></div>
        </div>
      </section>`;
    document.body.appendChild(modal);
    const close = () => modal.remove();
    modal.querySelector(".job-details-close").addEventListener("click", close);
    modal.addEventListener("click", (event) => {
      if (event.target === modal) close();
    });
  }

  function renderAppointments() {
    let list = jobs.slice();
    if (apptStatusFilter !== "all")
      list = list.filter((j) => j.status === apptStatusFilter);
    if (apptSearchTerm.trim()) {
      const q = apptSearchTerm.toLowerCase();
      list = list.filter(
        (j) =>
          j.customer.toLowerCase().includes(q) ||
          j.motorcycle.toLowerCase().includes(q) ||
          j.services.join(" ").toLowerCase().includes(q) ||
          j.id.toLowerCase().includes(q),
      );
    }

    const body = document.getElementById("apptTableBody");
    const emptyBox = document.getElementById("apptEmpty");

    if (list.length === 0) {
      body.innerHTML = "";
      emptyBox.innerHTML = emptyState(
        "No appointments found",
        "Try a different search term or filter.",
      );
      return;
    }
    emptyBox.innerHTML = "";

    body.innerHTML = list
      .map((j) => {
        return `
        <tr>
          <td class="sku-tag">${j.id}</td>
          <td>
            <div class="cust-cell">
              <div class="init">${j.initials}</div>
              <div><div class="c-name">${escapeHtml(j.customer)}</div><div class="c-phone">${j.phone}</div></div>
            </div>
          </td>
          <td>${escapeHtml(j.motorcycle)}</td>
          <td>${j.services.map((s) => `<span class="svc-line">${escapeHtml(s)}</span>`).join("")}</td>
          <td><div class="dt-cell"><div class="d">${j.date}</div><div class="t">${j.time}</div></div></td>
          <td>${escapeHtml(j.mechanic)}</td>
          <td>${badge(j.status)}</td>
        </tr>`;
      })
      .join("");
  }

  function renderInventory() {
    let list = parts.slice();
    if (invCatFilter !== "All")
      list = list.filter((p) => p.cat === invCatFilter);
    if (invSearchTerm.trim()) {
      const q = invSearchTerm.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q),
      );
    }

    const body = document.getElementById("invTableBody");
    const emptyBox = document.getElementById("invEmpty");

    if (list.length === 0) {
      body.innerHTML = "";
      emptyBox.innerHTML = emptyState(
        "No parts found",
        "Try a different search term or category.",
      );
      return;
    }
    emptyBox.innerHTML = "";

    const MAX_STOCK = 70;
    body.innerHTML = list
      .map((p) => {
        const pct = Math.min(100, Math.round((p.stock / MAX_STOCK) * 100));
        const low = p.stock <= 12;
        return `
        <tr>
          <td style="font-weight:600">${escapeHtml(p.name)}</td>
          <td class="sku-tag">${p.sku}</td>
          <td>${escapeHtml(p.brand)}</td>
          <td>${escapeHtml(p.cat)}</td>
          <td>
            <div class="stock-cell">
              <div class="stock-bar ${low ? "low" : ""}"><span style="width:${pct}%"></span></div>
              <div class="stock-num">${p.stock}</div>
            </div>
          </td>
          <td class="price-tag">₱${p.price.toFixed(2)}</td>
          <td><span class="status-dot-badge">Active</span></td>
        </tr>`;
      })
      .join("");
  }

  /* ---------------- View switching ---------------- */
  const views = {
    dashboard: "view-dashboard",
    jobs: "view-jobs",
    appointments: "view-appointments",
    inventory: "view-inventory",
  };
  const titles = {
    dashboard: [
      "Dashboard",
      `Welcome back, ${CURRENT_USER.name.split(" ")[0]}`,
    ],
    jobs: ["My Jobs", "Your assigned work queue"],
    appointments: ["Appointments", "Manage service scheduling"],
    inventory: ["Inventory & Parts", "Parts catalog and stock management"],
  };

  function goTo(key) {
    document
      .querySelectorAll(".view")
      .forEach((v) => v.classList.remove("active"));
    document.getElementById(views[key]).classList.add("active");
    document
      .querySelectorAll(".nav-item")
      .forEach((n) => n.classList.toggle("active", n.dataset.view === key));
    document.getElementById("pageTitle").textContent = titles[key][0];
    document.getElementById("pageSubtitle").textContent = titles[key][1];
    const app = document.getElementById("app");
    app.classList.remove("mobile-open");
    if (key === "dashboard") renderDashboard();
    if (key === "jobs") renderJobs();
    if (key === "appointments") renderAppointments();
    if (key === "inventory") renderInventory();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  document.getElementById("nav").addEventListener("click", (e) => {
    const item = e.target.closest(".nav-item");
    if (!item) return;
    e.preventDefault();
    goTo(item.dataset.view);
  });

  /* ---------------- Sidebar toggle ---------------- */
  const app = document.getElementById("app");
  document.getElementById("menuToggle").addEventListener("click", () => {
    if (window.innerWidth <= 860) {
      app.classList.toggle("mobile-open");
    } else {
      app.classList.toggle("collapsed");
    }
  });
  document
    .getElementById("scrim")
    .addEventListener("click", () => app.classList.remove("mobile-open"));

  /* ---------------- User dropdown ---------------- */
  const userTrigger = document.getElementById("userTrigger");
  const userDropdown = document.getElementById("userDropdown");
  userTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    userDropdown.classList.toggle("show");
    userTrigger.classList.toggle("open");
    document.getElementById("notifPanel").classList.remove("show");
  });
  document.getElementById("signOutBtn").addEventListener("click", () => {
    userDropdown.classList.remove("show");
    userTrigger.classList.remove("open");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");
    window.location.href = "../../login.html";
  });

  /* ---------------- Notifications ---------------- */
  const bellBtn = document.getElementById("bellBtn");
  const notifPanel = document.getElementById("notifPanel");
  const bellDot = document.getElementById("bellDot");
  renderMechanicNotifications();
  bellBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    notifPanel.classList.toggle("show");
    userDropdown.classList.remove("show");
    userTrigger.classList.remove("open");
    bellDot.style.display = "none";
  });

  document.addEventListener("click", () => {
    userDropdown.classList.remove("show");
    userTrigger.classList.remove("open");
    notifPanel.classList.remove("show");
  });

  /* ---------------- Appointments filters ---------------- */
  document.getElementById("apptFilters").addEventListener("click", (e) => {
    const pill = e.target.closest(".pill");
    if (!pill) return;
    document
      .querySelectorAll("#apptFilters .pill")
      .forEach((p) => p.classList.remove("active"));
    pill.classList.add("active");
    apptStatusFilter = pill.dataset.status || "all";
    renderAppointments();
  });
  document.getElementById("apptSearch").addEventListener("input", (e) => {
    apptSearchTerm = e.target.value;
    renderAppointments();
  });

  document.getElementById("jobsSearch").addEventListener("input", (e) => {
    jobsSearchTerm = e.target.value;
    renderJobs();
  });
  document
    .getElementById("jobsStatusFilter")
    .addEventListener("change", (e) => {
      jobsStatusFilter = e.target.value;
      renderJobs();
    });
  document
    .getElementById("jobsScheduleFilter")
    .addEventListener("change", (e) => {
      jobsScheduleFilter = e.target.value;
      renderJobs();
    });

  /* ---------------- Inventory filters ---------------- */
  document.getElementById("invFilters").addEventListener("click", (e) => {
    const pill = e.target.closest(".pill");
    if (!pill) return;
    document
      .querySelectorAll("#invFilters .pill")
      .forEach((p) => p.classList.remove("active"));
    pill.classList.add("active");
    invCatFilter = pill.dataset.cat;
    renderInventory();
  });
  document.getElementById("invSearch").addEventListener("input", (e) => {
    invSearchTerm = e.target.value;
    renderInventory();
  });

  /* ---------------- Init ---------------- */
  syncJobsFromSharedAppointments();
  document.getElementById("sideAvatar").textContent = CURRENT_USER.initials;
  document.getElementById("sideName").textContent = CURRENT_USER.name;
  document.getElementById("topAvatar").textContent = CURRENT_USER.initials;
  document.getElementById("userDisplayName").textContent = CURRENT_USER.name;
  document.getElementById("userDisplayEmail").textContent = CURRENT_USER.email;
  goTo("dashboard");
})();
