export function collectCancellationReason(appointment, escapeHtml) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "sc-modal-overlay";
    overlay.innerHTML = `
      <section class="sc-modal-card" role="dialog" aria-modal="true" aria-labelledby="sc-cancellation-request-title">
        <div class="sc-modal-header">
          <h2 id="sc-cancellation-request-title">Request Appointment Cancellation</h2>
          <button type="button" class="sc-modal-close" aria-label="Close cancellation request">&times;</button>
        </div>
        <form class="sc-modal-body" data-cancellation-request-form>
          <p>Provide a reason for requesting cancellation of appointment ${escapeHtml(appointment.id)}. An Admin will review your request.</p>
          <div class="sc-form-group">
            <label for="sc-cancellation-request-reason">Reason for cancellation</label>
            <textarea class="sc-input-field" id="sc-cancellation-request-reason" rows="4" maxlength="1000" required placeholder="Explain why you need to cancel this appointment..."></textarea>
          </div>
          <div style="display:flex; justify-content:flex-end; gap:10px;">
            <button type="button" class="sc-secondary-btn" data-cancel-request>Cancel</button>
            <button type="submit" class="sc-submit-btn">Send Request</button>
          </div>
        </form>
      </section>
    `;
    const form = overlay.querySelector("[data-cancellation-request-form]");
    const reasonField = overlay.querySelector("#sc-cancellation-request-reason");
    let settled = false;
    const finish = (reason) => {
      if (settled) return;
      settled = true;
      document.removeEventListener("keydown", handleKeydown);
      overlay.remove();
      resolve(reason);
    };
    const handleKeydown = (event) => {
      if (event.key === "Escape") finish(null);
    };

    overlay.querySelector(".sc-modal-close").addEventListener("click", () => finish(null));
    overlay.querySelector("[data-cancel-request]").addEventListener("click", () => finish(null));
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) finish(null);
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const reason = reasonField.value.trim();
      if (!reason) {
        reasonField.setCustomValidity("Enter a reason before sending this request.");
        reasonField.reportValidity();
        return;
      }
      finish(reason);
    });
    reasonField.addEventListener("input", () => reasonField.setCustomValidity(""));
    document.addEventListener("keydown", handleKeydown);
    document.body.appendChild(overlay);
    reasonField.focus();
  });
}
