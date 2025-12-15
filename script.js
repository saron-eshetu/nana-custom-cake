document.addEventListener("DOMContentLoaded", () => {
  const yearSpan = document.getElementById("year");
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  const lightbox = document.getElementById("lightbox");
  const lightboxImage = document.getElementById("lightboxImage");

  function openLightbox(src, alt) {
    if (!lightbox || !lightboxImage) return;
    lightboxImage.src = src;
    lightboxImage.alt = alt || "";
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
  }

  function closeLightbox() {
    if (!lightbox || !lightboxImage) return;
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    lightboxImage.src = "";
    lightboxImage.alt = "";
  }

  document.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;

    const item = target.closest(".gallery-item");
    if (item) {
      const src = item.getAttribute("data-fullsrc") || "";
      const alt = item.getAttribute("data-alt") || "";
      if (src) openLightbox(src, alt);
      return;
    }

    if (target.closest("[data-lightbox-close]") && lightbox?.classList.contains("is-open")) {
      closeLightbox();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lightbox?.classList.contains("is-open")) {
      closeLightbox();
    }
  });

  const orderForm = document.getElementById("orderConfirmationForm");
  const orderStatus = document.getElementById("order-confirmation-status");
  const orderResult = document.getElementById("order-confirmation-result");
  const cardBox = document.getElementById("cardBox");
  const zelleBox = document.getElementById("zelleBox");
  const tierBox = document.getElementById("tierBox");
  const sheetBox = document.getElementById("sheetBox");
  const cupcakesBox = document.getElementById("cupcakesBox");
  const tierCountInput = document.getElementById("tier_count");
  const tierFlavorNote = document.getElementById("tierFlavorNote");

  function show(el) {
    if (el) el.classList.remove("hidden");
  }

  function hide(el) {
    if (el) el.classList.add("hidden");
  }

  function getCheckedValue(name) {
    if (!orderForm) return "";
    const v = orderForm.querySelector(`input[name="${name}"]:checked`);
    return v ? String(v.value) : "";
  }

  function getCheckedValues(name) {
    if (!orderForm) return [];
    return [...orderForm.querySelectorAll(`input[name="${name}"]:checked`)].map((i) => String(i.value));
  }

  function showCakeSection(type) {
    hide(tierBox);
    hide(sheetBox);
    hide(cupcakesBox);
    if (type === "tier") show(tierBox);
    if (type === "sheet") show(sheetBox);
    if (type === "cupcakes") show(cupcakesBox);
  }

  function enforceTierFlavorLimit() {
    if (!orderForm || !tierCountInput) return;
    const tiers = parseInt(String(tierCountInput.value || "0"), 10);
    const boxes = [...orderForm.querySelectorAll('input[name="tier_flavors"]')];
    const selected = boxes.filter((b) => b.checked);

    if (tierFlavorNote) {
      if (tiers > 0) {
        tierFlavorNote.textContent = `Select ${tiers} flavor${tiers > 1 ? "s" : ""} for ${tiers} tier${tiers > 1 ? "s" : ""}.`;
      } else {
        tierFlavorNote.textContent = "Select the same number of flavors as tiers.";
      }
    }

    if (tiers > 0 && selected.length > tiers) {
      selected[selected.length - 1].checked = false;
    }
  }

  function validateOrderForm() {
    if (!orderForm) return false;
    const requiredIds = ["occasion", "people", "date", "time", "customerName", "phone", "email"];
    for (const id of requiredIds) {
      const el = document.getElementById(id);
      if (!el || !String(el.value || "").trim()) return false;
    }

    const cakeType = getCheckedValue("cake_type");
    if (!cakeType) return false;

    if (cakeType === "tier") {
      const tiers = parseInt(String(tierCountInput?.value || "0"), 10);
      if (!tiers || tiers < 1) return false;
      if (getCheckedValues("tier_flavors").length !== tiers) return false;
    }

    if (cakeType === "sheet") {
      if (getCheckedValues("sheet_flavors").length < 1) return false;
    }

    if (cakeType === "cupcakes") {
      const variant = getCheckedValue("cupcakes_variant");
      if (!variant) return false;
      const qty = parseInt(String(document.getElementById("cupcakes_quantity")?.value || "0"), 10);
      if (!qty || qty < 1) return false;
      if (getCheckedValues("cupcakes_flavors").length < 1) return false;
    }

    const method = getCheckedValue("paymentMethod");
    if (!method) return false;

    return true;
  }

  if (orderForm) {
    orderForm.addEventListener("change", (e) => {
      const target = e.target;
      if (!target) return;

      if (target.name === "paymentMethod") {
        const m = getCheckedValue("paymentMethod");
        if (m === "card") {
          show(cardBox);
          hide(zelleBox);
        } else if (m === "zelle") {
          show(zelleBox);
          hide(cardBox);
        }
      }

      if (target.name === "cake_type") {
        showCakeSection(getCheckedValue("cake_type"));
      }

      if (target.id === "tier_count" || target.name === "tier_flavors") {
        enforceTierFlavorLimit();
      }
    });

    orderForm.addEventListener("reset", () => {
      hide(cardBox);
      hide(zelleBox);
      hide(tierBox);
      hide(sheetBox);
      hide(cupcakesBox);
      hide(orderResult);
      if (orderStatus) orderStatus.textContent = "";
    });

    orderForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (!validateOrderForm()) {
        alert("Please complete all required fields.");
        return;
      }

      if (orderStatus) orderStatus.textContent = "Submitting...";

      const endpoint = String(orderForm.getAttribute("action") || "").trim();
      const data = new FormData(orderForm);

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          body: data,
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Request failed");
        }

        if (orderStatus) orderStatus.textContent = "Thank you! Your confirmation was submitted.";
        show(orderResult);
        orderForm.reset();
      } catch (err) {
        if (orderStatus) orderStatus.textContent = "Sorry, something went wrong. Please try again.";
      }
    });

    (function initMinDate() {
      const d = document.getElementById("date");
      if (!d) return;
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      d.min = `${yyyy}-${mm}-${dd}`;
    })();
  }

  const guestCountInput = document.getElementById("guestCount");
  const flavorTypeSelect = document.getElementById("flavorType");
  const decorSelect = document.getElementById("decorationLevel");
  const deliveryMethodSelect = document.getElementById("deliveryMethod");
  const deliveryZipInput = document.getElementById("deliveryZip");
  const calcBtn = document.getElementById("calculateBtn");

  const basePriceEl = document.getElementById("basePrice");
  const decorPriceEl = document.getElementById("decorationPrice");
  const deliveryPriceEl = document.getElementById("deliveryPrice");
  const totalPriceEl = document.getElementById("totalPrice");

  if (!calcBtn) return;

  const ZIP_ORIGIN = "90005";
  const DELIVERY_MINIMUM = 50;

  function haversineMiles(lat1, lon1, lat2, lon2) {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 3958.7613;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  async function zipToLatLon(zip) {
    const res = await fetch(`https://api.zippopotam.us/us/${encodeURIComponent(zip)}`);
    if (!res.ok) return null;
    const data = await res.json();
    const place = Array.isArray(data.places) ? data.places[0] : null;
    if (!place) return null;
    const lat = Number(place.latitude);
    const lon = Number(place.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return { lat, lon };
  }

  calcBtn.addEventListener("click", async () => {
    const guestCount = Number(guestCountInput?.value || 0);
    const flavorType = String(flavorTypeSelect?.value || "normal");
    const decorPrice = Number(decorSelect?.value || 0);
    const deliveryMethod = String(deliveryMethodSelect?.value || "pickup");
    const deliveryZipRaw = String(deliveryZipInput?.value || "").trim();
    const deliveryZip = deliveryZipRaw.replace(/[^0-9]/g, "");

    if (!Number.isFinite(guestCount) || guestCount <= 0) {
      alert("Please enter how many guests.");
      return;
    }

    const isSmallOrder = guestCount < 50;
    const perGuest = (() => {
      if (isSmallOrder) return flavorType === "specialty" ? 6 : 5;
      return flavorType === "specialty" ? 7 : 6;
    })();
    const basePrice = guestCount * perGuest;

    basePriceEl.textContent = `$${basePrice.toFixed(2)}`;
    decorPriceEl.textContent = `$${decorPrice.toFixed(2)}`;

    let deliveryPrice = 0;
    if (deliveryMethod === "delivery") {
      if (deliveryZip.length === 0) {
        alert("Please enter a delivery ZIP code.");
        return;
      }

      deliveryPriceEl.textContent = "Calculating...";
      totalPriceEl.textContent = "Calculating...";

      const [origin, destination] = await Promise.all([
        zipToLatLon(ZIP_ORIGIN),
        zipToLatLon(deliveryZip),
      ]);

      if (!origin || !destination) {
        alert("Could not calculate delivery for that ZIP code. Please check the ZIP and try again.");
        deliveryPriceEl.textContent = "$0.00";
        const total = basePrice + decorPrice;
        totalPriceEl.textContent = `$${total.toFixed(2)}`;
        return;
      }

      const miles = haversineMiles(origin.lat, origin.lon, destination.lat, destination.lon);
      deliveryPrice = Math.max(DELIVERY_MINIMUM, miles * 2);
    }

    const total = basePrice + decorPrice + deliveryPrice;

    deliveryPriceEl.textContent = `$${deliveryPrice.toFixed(2)}`;
    totalPriceEl.textContent = `$${total.toFixed(2)}`;
  });
});
