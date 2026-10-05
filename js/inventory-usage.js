(() => {
  const INVENTORY_KEY = "motofix_parts";
  const NOTIFICATIONS_KEY = "motofix_notifications";

  // Mechanic completion consumes appointment-linked parts from the shared inventory.
  // Stock alerts reference the inventory SKU so Admin/Master Admin can open that part.
  window.updateInventoryLowStockAlerts = (inventory) => {
    const updatedInventory = inventory.map((part) => {
      const stock = Number(part.stock) || 0;
      const configuredThreshold = Number(part.reorderLevel ?? 10);
      const threshold = Number.isFinite(configuredThreshold) ? configuredThreshold : 10;
      if (stock > threshold) return { ...part, lowStockAlerted: false };
      if (part.lowStockAlerted) return { ...part };

      let notifications;
      try {
        const stored = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || "[]");
        if (!Array.isArray(stored)) throw new Error("Notification data is not an array.");
        notifications = stored;
      } catch (error) {
        console.error("Unable to read notifications for low-stock alert:", error);
        throw new Error("Could not create a low-stock notification. Please try again.");
      }

      const timestamp = new Date().toISOString();
      notifications.unshift({
        id: `N${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: stock === 0 ? "Part out of stock" : "Low stock alert",
        message: `${part.name} (SKU ${part.sku}) has ${stock} in stock${stock === 0 ? "" : `; reorder threshold is ${threshold}`}.`,
        audiences: ["admin", "master_admin"],
        destination: "inventory",
        inventorySku: part.sku,
        createdAt: timestamp,
        readBy: [],
      });
      try {
        localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications.slice(0, 100)));
      } catch (error) {
        console.error("Unable to save low-stock notification:", error);
        throw new Error("Could not save a low-stock notification. Please try again.");
      }
      window.dispatchEvent(new Event("motofix:notifications-updated"));
      return { ...part, lowStockAlerted: true };
    });
    return updatedInventory;
  };

  window.consumeAppointmentInventory = (appointment) => {
    const purchasedParts = (Array.isArray(appointment?.parts) ? appointment.parts : [])
      .filter((part) => part.source === "buy");
    if (!purchasedParts.length) return { ok: true, deducted: false };

    const quantitiesBySku = new Map();
    for (const part of purchasedParts) {
      const sku = String(part.sku || part.id || "").trim();
      const quantity = Number(part.quantity ?? 1);
      if (!sku || !Number.isInteger(quantity) || quantity <= 0) {
        return {
          ok: false,
          deducted: false,
          message: `Cannot complete appointment ${appointment.id}: a purchased part has invalid SKU or quantity data.`,
        };
      }
      quantitiesBySku.set(sku, (quantitiesBySku.get(sku) || 0) + quantity);
    }

    let inventory;
    try {
      const stored = JSON.parse(localStorage.getItem(INVENTORY_KEY) || "[]");
      if (!Array.isArray(stored)) throw new Error("Inventory data is not an array.");
      inventory = stored;
    } catch (error) {
      console.error("Unable to read inventory before completing appointment:", error);
      return {
        ok: false,
        deducted: false,
        message: "Cannot complete the job because inventory could not be read. Please check Inventory & Parts and try again.",
      };
    }

    const appointmentId = String(appointment.id);
    const requiredParts = [...quantitiesBySku].map(([sku, quantity]) => {
      const index = inventory.findIndex((item) => String(item.sku) === sku);
      return { sku, quantity, index };
    });
    const missingPart = requiredParts.find((part) => part.index < 0);
    if (missingPart) {
      return {
        ok: false,
        deducted: false,
        message: `Cannot complete the job: part SKU ${missingPart.sku} is no longer in Inventory & Parts.`,
      };
    }

    const alreadyDeducted = requiredParts.map(({ index }) =>
      (Array.isArray(inventory[index].consumedAppointmentIds)
        ? inventory[index].consumedAppointmentIds
        : []
      ).includes(appointmentId),
    );
    if (alreadyDeducted.every(Boolean)) {
      return { ok: true, deducted: false };
    }
    if (alreadyDeducted.some(Boolean)) {
      return {
        ok: false,
        deducted: false,
        message: `Inventory usage for appointment ${appointmentId} is incomplete. Please review its parts and inventory before completing it.`,
      };
    }

    const shortage = requiredParts.find(({ index, quantity }) => {
      const stock = Number(inventory[index].stock);
      return !Number.isFinite(stock) || stock < quantity;
    });
    if (shortage) {
      const part = inventory[shortage.index];
      return {
        ok: false,
        deducted: false,
        message: `Cannot complete the job: ${part.name} (SKU ${shortage.sku}) has ${Number(part.stock) || 0} in stock, but ${shortage.quantity} are required.`,
      };
    }

    const updatedInventory = inventory.map((part) => ({ ...part }));
    for (const { sku, quantity, index } of requiredParts) {
      const part = updatedInventory[index];
      part.stock = Number(part.stock) - quantity;
      const consumedAppointmentIds = Array.isArray(part.consumedAppointmentIds)
        ? part.consumedAppointmentIds
        : [];
      part.consumedAppointmentIds = [...consumedAppointmentIds, appointmentId];
    }

    try {
      const inventoryWithAlerts = window.updateInventoryLowStockAlerts(updatedInventory);
      localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventoryWithAlerts));
    } catch (error) {
      console.error("Unable to save inventory usage for completed appointment:", error);
      return {
        ok: false,
        deducted: false,
        message: error.message || "Cannot complete the job because the inventory update could not be saved. Please try again.",
      };
    }

    window.dispatchEvent(new CustomEvent("motofix:inventory-updated"));
    return { ok: true, deducted: true };
  };
})();
