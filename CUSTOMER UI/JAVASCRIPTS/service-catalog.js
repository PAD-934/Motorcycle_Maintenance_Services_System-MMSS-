import { fetchCustomerServices } from "./customer-api.js";

function isAvailable(service) {
  const unavailable = (value) =>
    value === false ||
    value === 0 ||
    ["false", "0", "inactive", "unavailable", "disabled", "archived"].includes(
      String(value ?? "").trim().toLowerCase(),
    );
  return !unavailable(service.active) &&
    !unavailable(service.available) &&
    !unavailable(service.isActive) &&
    !unavailable(service.isAvailable) &&
    !unavailable(service.status) &&
    !unavailable(service.availability);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function getDuration(service) {
  return String(
    service.hoursLabel ||
    service.durationLabel ||
    service.duration ||
    (service.durationMinutes
      ? `${service.durationMinutes} minutes`
      : service.hours
        ? `${service.hours} hour${Number(service.hours) === 1 ? "" : "s"}`
        : ""),
  ).trim();
}

export function initServiceCatalog() {
  const grid = document.getElementById("customer-services-grid");
  if (!grid) return;

  async function renderServices() {
    try {
      const services = (await fetchCustomerServices()).filter(isAvailable);
      if (!services.length) {
        grid.innerHTML = '<p class="customer-services-message">No services are currently available.</p>';
        return;
      }
      grid.innerHTML = services.map((service) => {
        const name = String(service.name || "").trim();
        if (!name) return "";
        const rawPrice = service.price ?? service.current_price ?? service.unitPrice ?? 0;
        const price = Number(String(rawPrice).replace(/[^\d.-]/g, ""));
        const duration = getDuration(service);
        const description = String(service.description || service.details || "").trim();
        const safePrice = Number.isFinite(price) ? price : 0;
        return `<article class="customer-service-card">
          <div class="customer-service-card-content">
            <h3>${escapeHtml(name)}</h3>
            ${description ? `<p>${escapeHtml(description)}</p>` : ""}
          </div>
          <div class="customer-service-meta">
            <strong>₱${safePrice.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            ${duration ? `<span>${escapeHtml(duration)}</span>` : ""}
          </div>
          <button type="button" class="customer-service-book-btn" data-service-name="${escapeHtml(name)}">Book this service</button>
        </article>`;
      }).join("");
      if (!grid.innerHTML.trim()) {
        grid.innerHTML = '<p class="customer-services-message">No services are currently available.</p>';
      }
    } catch (error) {
      console.error("Unable to load customer services:", error);
      grid.innerHTML = `<p class="customer-services-message" role="alert">Unable to load services. ${escapeHtml(error.message)}</p>`;
    }
  }

  grid.addEventListener("click", (event) => {
    const button = event.target.closest(".customer-service-book-btn");
    if (!button) return;
    window.dispatchEvent(new CustomEvent("motofix:book-service", {
      detail: { serviceName: button.dataset.serviceName },
    }));
  });

  renderServices();
  window.addEventListener("motofix:services-updated", renderServices);
  window.addEventListener("storage", (event) => {
    if (event.key === "motofix_services") renderServices();
  });
  if (String(window.MOTOFIX_API_BASE_URL || "").trim()) {
    window.setInterval(() => {
      if (!document.hidden) renderServices();
    }, 30000);
  }
}
