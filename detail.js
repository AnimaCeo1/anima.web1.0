(function () {
  const AUTH_SESSION_KEY = "anima.auth.session.v1";
  const AUTH_PERSISTENT_SESSION_KEY = "anima.auth.session.persistent.v1";
  const PERF_LOG_ENABLED = true;
  const baseData = clone(window.ANIMA_DATA || {});
  const userLanguage = safeGet("anima.language", "English");
  const userCurrency = safeGet("anima.currency", baseData.user?.currency || "VND");
  const root = document.querySelector("#detail-page-root");
  const authSession = readAuthSession();
  const currentUser = authSession?.userId && window.ANIMA_DB ? window.ANIMA_DB.getUser(authSession.userId, baseData) : null;

  if (window.ANIMA_DB) {
    window.ANIMA_DB.ensure(baseData);
    window.ANIMA_DB.trackVisit(baseData);
  }

  function perfMark(label, startedAt) {
    if (!PERF_LOG_ENABLED || typeof performance === "undefined") return;
    const duration = performance.now() - startedAt;
    console.log(`[perf][detail] ${label}: ${duration.toFixed(1)}ms`);
  }

  function perfRun(label, fn) {
    const startedAt = typeof performance !== "undefined" ? performance.now() : 0;
    const result = fn();
    perfMark(label, startedAt);
    return result;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value || {}));
  }

  function safeGet(key, fallback) {
    try {
      return localStorage.getItem(key) || fallback;
    } catch {
      return fallback;
    }
  }

  function safeJson(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key) || "null") || fallback;
    } catch {
      return fallback;
    }
  }

  function safeSessionJson(key, fallback) {
    try {
      return JSON.parse(sessionStorage.getItem(key) || "null") || fallback;
    } catch {
      return fallback;
    }
  }

  function readAuthSession() {
    return safeSessionJson(AUTH_SESSION_KEY, null) || safeJson(AUTH_PERSISTENT_SESSION_KEY, null);
  }

  function isRu() {
    return userLanguage === "Russian";
  }

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function readEntries() {
    if (window.ANIMA_DB) return window.ANIMA_DB.listEntries(baseData);
    return [];
  }

  function splitList(value) {
    return String(value || "")
      .split(/,|\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function splitGalleryList(value) {
    return String(value || "")
      .split(/\n+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function normalizeEntry(entry) {
    const fields = entry.fields || {};
    const gallery = splitGalleryList(fields.gallery);
    if (fields.image) gallery.unshift(fields.image);
    return {
      id: entry.id,
      slug: fields.slug || slugify(fields.title || entry.title),
      title: fields.title || entry.title || "Stay",
      category: fields.category || "Hotels",
      type: fields.type || fields.category || "Hotel",
      description: fields.description || fields.text || "",
      location: fields.location || "",
      address: fields.address || "",
      distance: fields.distance || "",
      guests: fields.guests || "",
      bedrooms: fields.bedrooms || "",
      beds: fields.beds || "",
      baths: fields.baths || "",
      size: fields.size || "",
      image: fields.image || "",
      gallery: gallery.length ? gallery : [fields.image].filter(Boolean),
      tags: splitList(fields.tags || fields.category),
      highlights: splitList(fields.highlights),
      amenities: splitList(fields.amenities),
      rules: splitList(fields.rules),
      mapsUrl: fields.mapsUrl || "https://maps.google.com",
      sourceUrl: fields.sourceUrl || "",
      source: fields.source || "ANIMA",
      reviews: fields.reviews || "",
      rating: fields.rating || "",
      price: fields.price || "",
      cleaningFee: fields.cleaningFee || "",
      serviceFee: fields.serviceFee || "",
    };
  }

  function resolveStayFromPath() {
    const slug = window.location.pathname.split("/").filter(Boolean)[0] || "";
    const entries = readEntries()
      .filter((entry) => entry.status === "published" && entry.module === "stay")
      .map(normalizeEntry);
    return entries.find((entry) => entry.slug === slug) || null;
  }

  function escapeHtml(value = "") {
    return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
  }

  function formatMoney(vnd, currency) {
    if (!vnd) return currency === "USD" ? "$0" : `0 ${currency}`;
    const rates = baseData.user?.currencyRates || { USD: 25400, EUR: 27600, RUB: 280, UAH: 620, VND: 1 };
    if (currency === "VND") return `${Math.round(vnd).toLocaleString("en-US")} VND`;
    if (currency === "USD") return `$${Math.round(vnd / rates.USD).toLocaleString("en-US")}`;
    return `${Math.round(vnd / rates[currency]).toLocaleString("en-US")} ${currency}`;
  }

  function parsePriceNumber(value) {
    const text = String(value || "");
    if (text.includes("$")) {
      const usd = Number(text.replace(/[^\d.]/g, ""));
      return Math.round(usd * (baseData.user?.currencyRates?.USD || 25400));
    }
    return Number(text.replace(/[^\d]/g, "")) || 0;
  }

  function currentUserProfileData() {
    return {
      fullName: currentUser?.fullName || currentUser?.name || "",
      birthDate: currentUser?.birthDate || "",
      email: currentUser?.email || "",
      phone: currentUser?.phone || "",
    };
  }

  function formatRoomSize(value = "") {
    const text = String(value || "").trim();
    if (!text) return "48 м²";
    if (/м²|m²|sqm|sq\.?\s*m/i.test(text)) return text;
    return `${text} м²`;
  }

  function resolveFacts(item) {
    return [
      [item.guests, isRu() ? "Гости" : "Guests"],
      [item.bedrooms, isRu() ? "Спальни" : "Bedrooms"],
      [item.beds, isRu() ? "Кровати" : "Beds"],
      [item.size ? formatRoomSize(item.size) : "", isRu() ? "Площадь" : "Size"],
    ].filter(([value]) => value);
  }

  function roomMeta(room) {
    return [
      room.size ? formatRoomSize(room.size) : "",
      `${room.capacity || 1} ${isRu() ? "гостя" : "guests"}`,
      `${room.beds_count || 1} ${isRu() ? "кровать" : "bed"}`,
      `${room.baths_count || 1} ${isRu() ? "ванная" : "bathroom"}`,
    ].filter(Boolean);
  }

  function roomRules(room, property) {
    const fallback = [
      `${isRu() ? "Заезд после" : "Check-in after"} ${property?.checkin || "14:00"}`,
      `${isRu() ? "Выезд до" : "Check-out until"} ${property?.checkout || "12:00"}`,
      isRu() ? "Бесплатная отмена за 24 часа" : "Free cancellation 24 hours before arrival",
      isRu() ? "Завтрак включен" : "Breakfast included",
    ];
    return (room.rules?.length ? room.rules : property?.rules?.length ? property.rules : fallback).slice(0, 4);
  }

  function roomFeatures(room, property) {
    return (room.amenities?.length ? room.amenities : property?.amenities || []).slice(0, 6);
  }

  function selectedRoomPhotos(state) {
    return Array.isArray(state.selectedRoom?.photos) ? state.selectedRoom.photos.filter(Boolean) : [];
  }

  function getPaymentMode(property) {
    const settings = property?.payment_settings || {};
    if (settings.force_anima_online) return "anima_online";
    if (settings.method === "cash_at_hotel" && settings.cash_allowed !== false) return "cash_at_hotel";
    return settings.method || "anima_online";
  }

  function countryPhoneData() {
    return [
      ["🇻🇳", "Vietnam", "Вьетнам", "+84"],
      ["🇷🇺", "Russia", "Россия", "+7"],
      ["🇺🇦", "Ukraine", "Украина", "+380"],
      ["🇬🇪", "Georgia", "Грузия", "+995"],
      ["🇰🇿", "Kazakhstan", "Казахстан", "+7 6"],
      ["🇺🇸", "United States", "США", "+1"],
      ["🇬🇧", "United Kingdom", "Великобритания", "+44"],
      ["🇩🇪", "Germany", "Германия", "+49"],
      ["🇫🇷", "France", "Франция", "+33"],
      ["🇮🇹", "Italy", "Италия", "+39"],
      ["🇪🇸", "Spain", "Испания", "+34"],
      ["🇹🇷", "Turkey", "Турция", "+90"],
      ["🇦🇪", "UAE", "ОАЭ", "+971"],
      ["🇹🇭", "Thailand", "Таиланд", "+66"],
      ["🇮🇩", "Indonesia", "Индонезия", "+62"],
      ["🇮🇳", "India", "Индия", "+91"],
      ["🇨🇳", "China", "Китай", "+86"],
      ["🇯🇵", "Japan", "Япония", "+81"],
      ["🇰🇷", "South Korea", "Южная Корея", "+82"],
      ["🇦🇲", "Armenia", "Армения", "+374"],
      ["🇦🇿", "Azerbaijan", "Азербайджан", "+994"],
      ["🇺🇿", "Uzbekistan", "Узбекистан", "+998"],
      ["🇰🇬", "Kyrgyzstan", "Кыргызстан", "+996"],
      ["🇹🇯", "Tajikistan", "Таджикистан", "+992"],
      ["🇲🇩", "Moldova", "Молдова", "+373"],
      ["🇵🇱", "Poland", "Польша", "+48"],
      ["🇨🇿", "Czechia", "Чехия", "+420"],
      ["🇳🇱", "Netherlands", "Нидерланды", "+31"],
      ["🇨🇦", "Canada", "Канада", "+1"],
      ["🇦🇺", "Australia", "Австралия", "+61"],
    ];
  }

  function countriesOptions() {
    return countryPhoneData().map(([flag, en, ru]) => `<option value="${flag} ${isRu() ? ru : en}"></option>`).join("");
  }

  function countryPhoneLabel(code = "") {
    const match = countryPhoneData().find((item) => item[3] === code);
    if (!match) return code || "+84";
    return `${match[0]} ${match[3]}`;
  }

  function localPhoneValue(phone = "", code = "") {
    const text = String(phone || "").trim();
    const normalizedCode = String(code || "").trim();
    if (!text) return "";
    if (normalizedCode && text.startsWith(normalizedCode)) {
      return text.slice(normalizedCode.length).trim();
    }
    return text;
  }

  function bookingTotals(form) {
    const nightly = Number(form.dataset.nightlyRate || 0);
    const cleaning = Number(form.dataset.cleaningFee || 0);
    const service = Number(form.dataset.serviceFee || 0);
    const checkin = form.elements.checkin.value ? new Date(form.elements.checkin.value) : null;
    const checkout = form.elements.checkout.value ? new Date(form.elements.checkout.value) : null;
    const nights = checkin && checkout ? Math.max(1, Math.round((checkout - checkin) / 86400000)) : 1;
    const subtotal = nightly * nights;
    return { nights, subtotal, totalVnd: subtotal + cleaning + service, cleaning, service };
  }

  function collectGuestDetails(form) {
    const count = Number(form.elements.guests?.value || 1);
    const guests = [{
      fullName: form.elements.fullName?.value || "",
      birthDate: form.elements.birthDate?.value || "",
      passportNumber: form.elements.passportNumber?.value || "",
      citizenship: form.elements.citizenship?.value || "",
    }];
    for (let index = 2; index <= count; index += 1) {
      guests.push({
        fullName: form.elements[`guest${index}FullName`]?.value || "",
        birthDate: form.elements[`guest${index}BirthDate`]?.value || "",
        passportNumber: form.elements[`guest${index}PassportNumber`]?.value || "",
        citizenship: form.elements[`guest${index}Citizenship`]?.value || "",
      });
    }
    return guests;
  }

  function buildRoomSlides(state) {
    return state.gallery.map((image, index) => `
      <article class="hotel-hero-slide" data-hero-slide="${index}">
        <img src="${escapeHtml(image)}" alt="" />
      </article>
    `).join("");
  }

  function buildSelectedRoomGallery(state) {
    const photos = selectedRoomPhotos(state);
    if (!photos.length) {
      return `
        <article class="room-gallery-empty">
          <strong>${isRu() ? "Фото пока нет" : "No photos yet"}</strong>
          <p>${isRu() ? "Для этого номера фотографии ещё не добавлены." : "Photos for this room have not been added yet."}</p>
        </article>
      `;
    }
    return photos.map((image, index) => `
      <article class="room-gallery-slide" data-room-gallery-slide="${index}">
        <img src="${escapeHtml(image)}" alt="" />
      </article>
    `).join("");
  }

  function amenityIcon(amenity = "") {
    const value = String(amenity || "").toLowerCase();
    if (value.includes("wifi") || value.includes("wi-fi")) {
      return `
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <path d="M12 24c12-10 28-10 40 0" />
          <path d="M20 34c7-6 17-6 24 0" />
          <path d="M28 44c3-3 5-3 8 0" />
          <circle cx="32" cy="52" r="2.6" fill="currentColor" stroke="none" />
        </svg>
      `;
    }
    if (value.includes("уборк") || value.includes("clean")) {
      return `
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <path d="M35 14c5 0 8 4 8 9v18" />
          <path d="M31 40h16" />
          <path d="M20 46h30" />
          <path d="M18 46c0-7 5-12 12-12" />
          <circle cx="20" cy="38" r="7" />
          <circle cx="20" cy="38" r="2.4" fill="currentColor" stroke="none" />
          <path d="M43 46l4 6" />
        </svg>
      `;
    }
    if (value.includes("стир") || value.includes("laundry")) {
      return `
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <rect x="16" y="12" width="32" height="40" rx="3" />
          <circle cx="32" cy="34" r="10" />
          <path d="M28 34a4 4 0 0 1 8 0" />
          <path d="M22 18h8" />
          <circle cx="39.5" cy="18" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="44.5" cy="18" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      `;
    }
    if (value.includes("завтрак") || value.includes("breakfast")) {
      return `
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <path d="M20 41h18a8 8 0 0 0 0-16H20z" />
          <path d="M20 41c0 4 3 7 7 7h15" />
          <path d="M42 31h4a5 5 0 0 1 0 10h-2" />
          <path d="M18 48h32" />
          <path d="M22 16c-2 3-2 6 0 9" />
          <path d="M30 14c-2 3-2 6 0 9" />
          <path d="M38 16c-2 3-2 6 0 9" />
          <path d="M46 44c3-2 6-5 8-8" />
          <path d="M47 39c2 1 4 3 5 5" />
        </svg>
      `;
    }
    return `
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="10" />
      </svg>
    `;
  }

  function renderExtraGuest(index) {
    const prefix = `guest${index}`;
    return `
      <section class="booking-guest-card">
        <h3>${isRu() ? `Гость ${index}` : `Guest ${index}`}</h3>
        <div class="booking-form-grid">
          <label class="full"><span>${isRu() ? "ФИО" : "Full name"}</span><input name="${prefix}FullName" type="text" /></label>
          <label><span>${isRu() ? "Дата рождения" : "Date of birth"}</span><input name="${prefix}BirthDate" type="date" /></label>
          <label><span>${isRu() ? "Паспорт" : "Passport"}</span><input name="${prefix}PassportNumber" type="text" /></label>
          <label class="full"><span>${isRu() ? "Гражданство" : "Citizenship"}</span><input name="${prefix}Citizenship" list="country-list" /></label>
        </div>
      </section>
    `;
  }

  function renderRoomCards(state) {
    return state.rooms.map((room) => `
      <article class="room-selection-card ${room.id === state.selectedRoom.id ? "selected" : ""}" data-room-select="${escapeHtml(room.id)}">
        <div class="room-selection-image">
          ${room.photos?.[0] ? `<img src="${escapeHtml(room.photos[0])}" alt="" />` : `<div class="room-selection-placeholder"></div>`}
          ${room.id === state.selectedRoom.id ? `<span class="room-selection-check">✓</span>` : ""}
        </div>
        <div class="room-selection-copy">
          <h3>${escapeHtml(room.name)}</h3>
          <strong>${formatMoney(Number(room.base_price || 0), userCurrency)} / ${isRu() ? "ночь" : "night"}</strong>
          <div class="room-selection-meta">
            <span>${escapeHtml(formatRoomSize(room.size))}</span>
            <span>${escapeHtml(`${room.capacity || 2} ${isRu() ? "гостя" : "guests"}`)}</span>
            <span>${escapeHtml(`${room.quantity || 1} ${isRu() ? "доступно" : "available"}`)}</span>
          </div>
        </div>
      </article>
    `).join("");
  }

  function renderRoomDetails(state) {
    const room = state.selectedRoom;
    if (!room) return "";
    const description = room.description?.trim() || (isRu() ? "Описание номера появится после публикации." : "Room description will appear after publishing.");
    const features = roomFeatures(room, state.property);
    const rules = roomRules(room, state.property);
    return `
      <div class="room-detail-shell">
        <div class="section-heading"><h2>${isRu() ? "Детали номера" : "Room details"}</h2></div>
        <div class="room-detail-copy">
          <div class="room-detail-title-row">
            <h3>${escapeHtml(room.name)}</h3>
            <span class="room-selection-badge">${isRu() ? "Популярный" : "Popular"}</span>
          </div>
          <strong>${formatMoney(Number(room.base_price || 0), userCurrency)} / ${isRu() ? "ночь" : "night"}</strong>
          <div class="room-detail-meta">${roomMeta(room).map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>
          <p>${escapeHtml(description)}</p>
          <button class="secondary-button room-gallery-button" type="button" data-open-room-gallery>${isRu() ? "Посмотреть фотографии" : "View photos"}</button>
          <div class="room-detail-feature-block">
            <h4>${isRu() ? "Удобства в номере" : "Room amenities"}</h4>
            <div class="room-feature-list">
              ${features.map((item, index) => `<article><span>${index + 1}</span><p>${escapeHtml(item)}</p></article>`).join("")}
            </div>
          </div>
          <div class="room-detail-rule-block">
            <h4>${isRu() ? "Правила и условия" : "Rules and conditions"}</h4>
            <div class="room-rule-list">${rules.map((item) => `<div><span>✓</span><p>${escapeHtml(item)}</p></div>`).join("")}</div>
          </div>
          <button class="gold-button hotel-primary-button" type="button" data-scroll-booking>${isRu() ? "Перейти к бронированию" : "Go to booking"}</button>
        </div>
      </div>
    `;
  }

  function renderStayScreen(state) {
    const item = state.item;
    const facts = resolveFacts(item);
    const heroCount = state.gallery.length;
    const locationText = [item.type || item.category, item.location].filter(Boolean).join(" · ");
    return `
      <section class="detail-page-screen detail-open hotel-flow-shell">
        <div class="screen-inner stay-detail-screen hotel-flow">
          <section class="hotel-card-panel">
            <div class="hotel-hero" data-hero-gallery>
              <div class="hotel-hero-track" data-hero-track>
                ${buildRoomSlides(state)}
              </div>
              <a class="hotel-hero-back" href="/" aria-label="Back">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
              </a>
              <button class="hotel-hero-nav hotel-hero-prev" type="button" data-hero-prev aria-label="Previous photo">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
              </button>
              <button class="hotel-hero-nav hotel-hero-next" type="button" data-hero-next aria-label="Next photo">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
              </button>
              <div class="hotel-hero-actions">
                <button type="button" aria-label="share">↗</button>
                <button type="button" aria-label="favorite">♡</button>
              </div>
              <span class="hotel-hero-counter"><span data-hero-index>${state.heroIndex + 1}</span> / ${heroCount}</span>
            </div>

            <div class="hotel-card-content">
              <div class="hotel-topline">
                <h1>${escapeHtml(item.title)}</h1>
              </div>
              <h2>${escapeHtml(item.title)}</h2>
              <p class="hotel-location-line">${escapeHtml(locationText)}</p>
              <div class="hotel-badges-row">
                <span class="hotel-rating-badge">★ ${escapeHtml(item.rating || "4.4")}</span>
                <span class="hotel-verified-badge">${isRu() ? "Проверено ANIMA" : "Verified by ANIMA"}</span>
              </div>
              <div class="hotel-amenity-grid">${(item.amenities || []).slice(0, 4).map((amenity) => `<article><span class="hotel-amenity-icon">${amenityIcon(amenity)}</span><strong>${escapeHtml(amenity)}</strong><i></i></article>`).join("")}</div>
              <div class="hotel-stats-grid">${facts.map(([value, label]) => `<article><strong>${escapeHtml(String(value))}</strong><span>${escapeHtml(label)}</span></article>`).join("")}</div>
              <article class="hotel-copy-card"><p>${escapeHtml(item.description || "")}</p></article>
              <article class="hotel-location-card">
                <div class="hotel-location-copy">
                  <h3>${isRu() ? "Локация" : "Location"}</h3>
                  <p>${escapeHtml(item.address || item.location || "Dalat")}</p>
                </div>
                <a class="hotel-map-button" href="${escapeHtml(item.mapsUrl || item.sourceUrl || "https://maps.google.com")}" target="_blank" rel="noopener">${isRu() ? "Открыть в Google Maps" : "Open in Google Maps"}</a>
              </article>
            </div>
          </section>

          <section class="hotel-section-card room-flow-section room-flow-unified" data-room-detail>
            <div class="section-heading"><h2>${isRu() ? "Выберите номер" : "Choose room"}</h2></div>
            <div class="room-flow-body">
              <div class="room-card-scroller">${renderRoomCards(state)}</div>
              <div class="room-flow-divider"></div>
              ${renderRoomDetails(state)}
            </div>
          </section>
          ${state.roomGalleryOpen ? renderRoomGalleryOverlay(state) : ""}
        </div>
      </section>
    `;
  }

  function renderRoomGalleryOverlay(state) {
    const photos = selectedRoomPhotos(state);
    const hasPhotos = photos.length > 0;
    return `
      <div class="room-gallery-overlay" data-room-gallery-overlay>
        <div class="room-gallery-modal">
          <div class="room-gallery-head">
            <strong>${escapeHtml(state.selectedRoom.name)}</strong>
            <button type="button" data-close-room-gallery>×</button>
          </div>
          <div class="room-gallery-track" data-room-gallery-track>
            ${buildSelectedRoomGallery(state)}
          </div>
          <div class="room-gallery-footer">
            <button type="button" data-room-gallery-prev ${hasPhotos ? "" : "disabled"}>${isRu() ? "Назад" : "Prev"}</button>
            <span>${hasPhotos ? `<span data-room-gallery-index>${(state.roomGalleryIndex || 0) + 1}</span> / ${photos.length}` : (isRu() ? "Фото пока нет" : "No photos yet")}</span>
            <button type="button" data-room-gallery-next ${hasPhotos ? "" : "disabled"}>${isRu() ? "Вперёд" : "Next"}</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderBookingFormScreen(state) {
    return `
      <section class="detail-page-screen detail-open hotel-flow-shell flow-single-screen">
        <div class="screen-inner stay-detail-screen hotel-flow">
          <section class="hotel-section-card booking-step-card payment-page-card">
            <div class="section-heading"><h2>${isRu() ? "Бронирование" : "Booking"}</h2><span>${isRu() ? "Шаг 1 из 3" : "Step 1 of 3"}</span></div>
            <div class="booking-stepbar"><span></span></div>
            <form class="booking-form booking-flow-form" data-booking-form data-nightly-rate="${state.selectedRoom.base_price || 0}" data-cleaning-fee="${state.cleaning}" data-service-fee="${state.service}" data-selected-room="${escapeHtml(state.selectedRoom.id)}">
              <input type="hidden" name="unitId" value="${escapeHtml(state.selectedRoom.id)}" />
              <div class="booking-block">
                <h3>${isRu() ? "Даты проживания" : "Stay dates"}</h3>
                <div class="booking-form-grid">
                  <label><span>${isRu() ? "Заезд" : "Check-in"}</span><input name="checkin" type="date" required value="${escapeHtml(state.formData.checkin || "")}" /></label>
                  <label><span>${isRu() ? "Выезд" : "Check-out"}</span><input name="checkout" type="date" required value="${escapeHtml(state.formData.checkout || "")}" /></label>
                  <label class="full"><span>${isRu() ? "Гости" : "Guests"}</span><select name="guests"><option value="1" ${state.formData.guests === "1" ? "selected" : ""}>1</option><option value="2" ${!state.formData.guests || state.formData.guests === "2" ? "selected" : ""}>2</option><option value="3" ${state.formData.guests === "3" ? "selected" : ""}>3</option><option value="4" ${state.formData.guests === "4" ? "selected" : ""}>4</option></select></label>
                </div>
              </div>
              <div class="booking-block">
                <h3>${isRu() ? "Ваши данные" : "Your details"}</h3>
                <div class="booking-form-grid">
                  <label class="phone-country-field">
                    <span>${isRu() ? "Страна" : "Country"}</span>
                    <input name="phoneCountrySearch" type="text" autocomplete="off" value="${escapeHtml(countryPhoneLabel(state.formData.phoneCountry || "+84"))}" />
                    <input name="phoneCountry" type="hidden" value="${escapeHtml(state.formData.phoneCountry || "+84")}" />
                    <div class="phone-country-suggestions hidden" data-country-suggestions></div>
                  </label>
                  <label><span>${isRu() ? "Телефон" : "Phone"}</span><input name="phone" type="tel" required value="${escapeHtml(localPhoneValue(state.formData.phone || "", state.formData.phoneCountry || "+84"))}" /></label>
                  <label class="full"><span>${isRu() ? "ФИО" : "Full name"}</span><input name="fullName" type="text" required value="${escapeHtml(state.formData.fullName || "")}" /></label>
                  <label><span>${isRu() ? "Дата рождения" : "Date of birth"}</span><input name="birthDate" type="date" required value="${escapeHtml(state.formData.birthDate || "")}" /></label>
                  <label><span>${isRu() ? "Паспорт" : "Passport"}</span><input name="passportNumber" type="text" required value="${escapeHtml(state.formData.passportNumber || "")}" /></label>
                  <label class="full"><span>${isRu() ? "Гражданство" : "Citizenship"}</span><input name="citizenship" list="country-list" required value="${escapeHtml(state.formData.citizenship || "")}" /></label>
                  <label class="full"><span>Email</span><input name="email" type="email" required value="${escapeHtml(state.formData.email || "")}" /></label>
                </div>
                <div class="messenger-chip-row">
                  <span class="messenger-chip">${isRu() ? "Есть WhatsApp" : "WhatsApp available"}</span>
                  <span class="messenger-chip">${isRu() ? "Есть Telegram" : "Telegram available"}</span>
                </div>
                <div class="booking-extra-guests" data-extra-guests></div>
              </div>
              <div class="booking-block booking-summary-block">
                <h3>${isRu() ? "Итоговый блок" : "Booking summary"}</h3>
                <div class="booking-summary-list" data-booking-summary></div>
              </div>
              <div class="flow-single-actions">
                <button class="secondary-button" type="button" data-back-to-stay>${isRu() ? "Назад" : "Back"}</button>
                <button class="gold-button hotel-primary-button" type="submit">${isRu() ? "Продолжить" : "Continue"}</button>
              </div>
              <datalist id="country-list">${countriesOptions()}</datalist>
            </form>
          </section>
        </div>
      </section>
    `;
  }

  function renderPaymentOptions(state) {
    const labels = [
      ["bank_card", isRu() ? "Банковская карта" : "Bank card", "💳"],
      ["apple_pay", "Apple Pay", ""],
      ["google_pay", "Google Pay", "G"],
    ];
    return labels.map(([value, label, badge], index) => `
      <label class="payment-option ${state.paymentMethod === value || (!state.paymentMethod && index === 0) ? "selected" : ""}" data-payment-option="${value}">
        <input type="radio" name="paymentMethod" value="${value}" ${state.paymentMethod === value || (!state.paymentMethod && index === 0) ? "checked" : ""} />
        <span>${label}</span>
        ${badge ? `<b>${badge}</b>` : ""}
      </label>
    `).join("");
  }

  function renderPaymentScreen(state) {
    const mode = getPaymentMode(state.property);
    const total = state.pendingBooking?.totalVnd || 0;
    const payNow = mode === "cash_at_hotel" ? Math.round(total * 0.05) : total;
    const payAtHotel = Math.max(0, total - payNow);
    return `
      <section class="detail-page-screen detail-open hotel-flow-shell flow-single-screen">
        <div class="screen-inner stay-detail-screen hotel-flow">
          <section class="hotel-section-card booking-step-card payment-page-card">
            <div class="section-heading"><h2>${isRu() ? "Оплата" : "Payment"}</h2><span>${isRu() ? "Шаг 2 из 3" : "Step 2 of 3"}</span></div>
            <div class="booking-stepbar"><span class="is-two"></span></div>
            <div class="payment-screen">
              <div class="payment-summary-card">
                <div class="payment-summary-head">
                  ${state.selectedRoom.photos?.[0] ? `<img src="${escapeHtml(state.selectedRoom.photos[0])}" alt="" />` : ""}
                  <div>
                    <strong>${escapeHtml(state.selectedRoom.name)}</strong>
                    <p>${formatMoney(Number(state.selectedRoom.base_price || 0), userCurrency)} / ${isRu() ? "ночь" : "night"}</p>
                  </div>
                </div>
                <div class="payment-summary-grid">
                  <div><span>${isRu() ? "Заезд" : "Check-in"}</span><b>${escapeHtml(state.pendingBooking.checkin || "")}</b></div>
                  <div><span>${isRu() ? "Выезд" : "Check-out"}</span><b>${escapeHtml(state.pendingBooking.checkout || "")}</b></div>
                  <div><span>${isRu() ? "Гости" : "Guests"}</span><b>${escapeHtml(String(state.pendingBooking.guests || ""))}</b></div>
                  ${mode === "cash_at_hotel"
                    ? `<div><span>${isRu() ? "Сервисный сбор ANIMA" : "ANIMA service fee"}</span><b>${formatMoney(payNow, userCurrency)}</b></div>
                       <div><span>${isRu() ? "Оплата в отеле" : "Pay at hotel"}</span><b>${formatMoney(payAtHotel, userCurrency)}</b></div>`
                    : `<div><span>${isRu() ? "Итого" : "Total"}</span><b>${formatMoney(total, userCurrency)}</b></div>`}
                </div>
              </div>
              <div class="payment-methods-card">
                <h3>${isRu() ? "Способ оплаты" : "Payment method"}</h3>
                <p class="payment-helper-copy">${mode === "cash_at_hotel"
                  ? (isRu() ? "Сейчас оплачивается только сервисный сбор ANIMA. Остаток оплачивается в отеле." : "Only the ANIMA service fee is charged now. The rest is paid at the hotel.")
                  : (isRu() ? "Оплата онлайн через ANIMA. Наличный способ недоступен." : "Online payment through ANIMA. Cash is not available.")}</p>
                ${renderPaymentOptions(state)}
                ${(state.paymentMethod || "bank_card") === "bank_card" ? `
                  <div class="payment-card-fields">
                    <label><span>${isRu() ? "Номер карты" : "Card number"}</span><input type="text" placeholder="4242 4242 4242 4242" /></label>
                    <label><span>${isRu() ? "Срок действия" : "Expiry"}</span><input type="text" placeholder="12/28" /></label>
                    <label><span>CVV</span><input type="text" placeholder="123" /></label>
                    <label class="full"><span>${isRu() ? "ФИО владельца" : "Cardholder name"}</span><input type="text" placeholder="IVAN PETROV" /></label>
                  </div>
                ` : ""}
              </div>
              <div class="flow-single-actions">
                <button class="secondary-button" type="button" data-back-to-stay>${isRu() ? "Назад" : "Back"}</button>
                <button class="gold-button hotel-primary-button" type="button" data-confirm-payment>${isRu() ? "Продолжить" : "Continue"}</button>
              </div>
            </div>
          </section>
        </div>
      </section>
    `;
  }

  function renderSuccessScreen(state) {
    const booking = state.bookingRecord;
    return `
      <section class="detail-page-screen detail-open hotel-flow-shell flow-single-screen">
        <div class="screen-inner stay-detail-screen hotel-flow">
          <section class="hotel-section-card booking-step-card payment-page-card">
            <div class="section-heading"><h2>${isRu() ? "Бронирование" : "Booking"}</h2><span>${isRu() ? "Шаг 3 из 3" : "Step 3 of 3"}</span></div>
            <div class="booking-stepbar"><span class="is-three"></span></div>
            <div class="success-screen">
              <div class="success-icon">✓</div>
              <h3>${isRu() ? "Бронирование подтверждено!" : "Booking confirmed!"}</h3>
              <p>${isRu() ? "Ваше бронирование успешно создано" : "Your booking was created successfully"}</p>
              <article class="success-booking-card">
                <div class="success-booking-number">
                  <span>${isRu() ? "Номер бронирования" : "Booking number"}</span>
                  <strong>#${escapeHtml(String(booking.id || "").toUpperCase())}</strong>
                </div>
                <div class="success-booking-room">
                  ${state.selectedRoom.photos?.[0] ? `<img src="${escapeHtml(state.selectedRoom.photos[0])}" alt="" />` : ""}
                  <div>
                    <strong>${escapeHtml(state.selectedRoom.name)}</strong>
                    <p>${escapeHtml(state.item.title)}</p>
                  </div>
                </div>
                <div class="success-booking-grid">
                  <div><span>${isRu() ? "Заезд" : "Check-in"}</span><b>${escapeHtml(booking.start_date || "")}</b></div>
                  <div><span>${isRu() ? "Выезд" : "Check-out"}</span><b>${escapeHtml(booking.end_date || "")}</b></div>
                  <div><span>${isRu() ? "Гости" : "Guests"}</span><b>${escapeHtml(String(booking.guests_count || ""))}</b></div>
                </div>
                <div class="success-booking-total"><span>${isRu() ? "Сумма оплачена" : "Amount paid"}</span><strong>${formatMoney(Number(booking.total_amount || 0), userCurrency)}</strong></div>
              </article>
              <div class="flow-single-actions">
                <button class="secondary-button" type="button" data-open-booking-details>${isRu() ? "Детали брони" : "Booking details"}</button>
                <a class="gold-button hotel-primary-button" href="/">${isRu() ? "Вернуться к поиску" : "Back to search"}</a>
              </div>
            </div>
          </section>
        </div>
      </section>
    `;
  }

  function renderBookingDetailsScreen(state) {
    const booking = state.bookingRecord;
    return `
      <section class="detail-page-screen detail-open hotel-flow-shell flow-single-screen">
        <div class="screen-inner stay-detail-screen hotel-flow">
          <section class="hotel-section-card payment-page-card">
            <div class="section-heading"><h2>${isRu() ? "Детали брони" : "Booking details"}</h2></div>
            <article class="booking-detail-card">
              <div class="booking-detail-head">
                <div>
                  <strong>${escapeHtml(state.item.title)}</strong>
                  <p>${escapeHtml(state.selectedRoom.name)}</p>
                </div>
                <span class="booking-status-pill">${isRu() ? "Подтверждено" : "Confirmed"}</span>
              </div>
              <div class="booking-detail-grid">
                <div><span>${isRu() ? "Код брони" : "Booking code"}</span><b>#${escapeHtml(String(booking.id || "").toUpperCase())}</b></div>
                <div><span>${isRu() ? "Статус оплаты" : "Payment status"}</span><b>${escapeHtml(booking.payment_status || "paid")}</b></div>
                <div><span>${isRu() ? "Заезд" : "Check-in"}</span><b>${escapeHtml(booking.start_date || "")}</b></div>
                <div><span>${isRu() ? "Выезд" : "Check-out"}</span><b>${escapeHtml(booking.end_date || "")}</b></div>
                <div><span>${isRu() ? "Гости" : "Guests"}</span><b>${escapeHtml(String(booking.guests_count || ""))}</b></div>
                <div><span>${isRu() ? "Итог" : "Total"}</span><b>${formatMoney(Number(booking.total_amount || 0), userCurrency)}</b></div>
              </div>
            </article>
            <div class="flow-single-actions">
              <button class="secondary-button" type="button" data-back-to-success>${isRu() ? "Назад" : "Back"}</button>
              <a class="gold-button hotel-primary-button" href="/">${isRu() ? "Вернуться к поиску" : "Back to search"}</a>
            </div>
          </section>
        </div>
      </section>
    `;
  }

  function renderEmpty(title, text) {
    root.innerHTML = `
      <section class="detail-page-empty">
        <a class="back-button detail-page-back" href="/" aria-label="Back">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
        </a>
        <h1>${title}</h1>
        <p>${text}</p>
      </section>
    `;
  }

  function createState(stay, bundle) {
    const property = bundle?.property || {};
    const rooms = bundle?.rooms?.length ? bundle.rooms : [];
    const gallery = [
      ...(property.photos || []),
      ...(stay.gallery || []),
      ...rooms.flatMap((room) => room.photos || []),
      stay.image,
    ].filter(Boolean).filter((value, index, array) => array.indexOf(value) === index);
    return {
      phase: "stay",
      item: stay,
      property,
      rooms,
      gallery,
      heroIndex: 0,
      roomGalleryIndex: 0,
      roomGalleryOpen: false,
      selectedRoom: rooms[0] || null,
      cleaning: parsePriceNumber(stay.cleaningFee),
      service: parsePriceNumber(stay.serviceFee),
      formData: {},
      pendingBooking: null,
      paymentMethod: "bank_card",
      bookingRecord: null,
    };
  }

  function init() {
    const stay = perfRun("resolveStayFromPath", () => resolveStayFromPath());
    const bundle = stay?.id && window.ANIMA_DB?.publicPropertyBundle
      ? perfRun("publicPropertyBundle", () => window.ANIMA_DB.publicPropertyBundle(stay.id, baseData))
      : null;
    if (!root) return;
    if (!authSession || authSession.guest || !authSession.userId) {
      renderEmpty(isRu() ? "Сначала войдите" : "Sign in first", isRu() ? "Для просмотра деталей, брони и оплаты нужно авторизоваться." : "Sign in to view details, booking and payment.");
      return;
    }
    if (!stay || !bundle?.rooms?.length) {
      renderEmpty(isRu() ? "Объект не найден" : "Stay not found", isRu() ? "Проверьте ссылку или откройте карточку снова из списка." : "Check the link or open the stay again from the list.");
      return;
    }
    const profile = currentUserProfileData();
    const state = createState(stay, bundle);
    state.formData = {
      fullName: profile.fullName || "",
      birthDate: profile.birthDate || "",
      email: profile.email || "",
      phone: profile.phone || "",
      guests: "2",
    };
    renderApp(state);
  }

  function renderApp(state) {
    perfRun(`renderApp:${state.phase}`, () => {
      if (state.phase === "stay") root.innerHTML = renderStayScreen(state);
      if (state.phase === "booking-form") root.innerHTML = renderBookingFormScreen(state);
      if (state.phase === "payment") root.innerHTML = renderPaymentScreen(state);
      if (state.phase === "success") root.innerHTML = renderSuccessScreen(state);
      if (state.phase === "booking-details") root.innerHTML = renderBookingDetailsScreen(state);
      bindState(state);
    });
  }

  function bindState(state) {
    if (state.phase === "stay") bindStayScreen(state);
    if (state.phase === "booking-form") bindBookingFormScreen(state);
    if (state.phase === "payment") bindPaymentScreen(state);
    if (state.phase === "success") bindSuccessScreen(state);
    if (state.phase === "booking-details") bindBookingDetailsScreen(state);
  }

  function bindHero(state) {
    const track = document.querySelector("[data-hero-track]");
    const indexNode = document.querySelector("[data-hero-index]");
    if (!track || !indexNode) return;
    let ticking = false;
    const update = () => {
      const width = track.clientWidth || 1;
      state.heroIndex = Math.round(track.scrollLeft / width);
      indexNode.textContent = String(state.heroIndex + 1);
      ticking = false;
    };
    track.addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    });
    document.querySelector("[data-hero-prev]")?.addEventListener("click", () => {
      const width = track.clientWidth || 1;
      track.scrollTo({ left: Math.max(0, track.scrollLeft - width), behavior: "smooth" });
    });
    document.querySelector("[data-hero-next]")?.addEventListener("click", () => {
      const width = track.clientWidth || 1;
      track.scrollTo({ left: Math.min(track.scrollWidth, track.scrollLeft + width), behavior: "smooth" });
    });
  }

  function bindRoomGallery(state) {
    const overlay = document.querySelector("[data-room-gallery-overlay]");
    const track = document.querySelector("[data-room-gallery-track]");
    const indexNode = document.querySelector("[data-room-gallery-index]");
    if (!overlay || !track || !indexNode) return;
    const update = () => {
      const width = track.clientWidth || 1;
      state.roomGalleryIndex = Math.round(track.scrollLeft / width);
      indexNode.textContent = String((state.roomGalleryIndex || 0) + 1);
    };
    track.addEventListener("scroll", () => requestAnimationFrame(update));
    document.querySelector("[data-close-room-gallery]")?.addEventListener("click", () => {
      state.roomGalleryOpen = false;
      renderApp(state);
    });
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        state.roomGalleryOpen = false;
        renderApp(state);
      }
    });
    document.querySelector("[data-room-gallery-prev]")?.addEventListener("click", () => {
      const width = track.clientWidth || 1;
      track.scrollTo({ left: Math.max(0, ((state.roomGalleryIndex || 0) - 1) * width), behavior: "smooth" });
    });
    document.querySelector("[data-room-gallery-next]")?.addEventListener("click", () => {
      const width = track.clientWidth || 1;
      track.scrollTo({ left: ((state.roomGalleryIndex || 0) + 1) * width, behavior: "smooth" });
    });
  }

  function bindStayScreen(state) {
    bindHero(state);
    bindRoomGallery(state);
    document.querySelectorAll("[data-room-select]").forEach((card) => {
      card.addEventListener("click", () => {
        const nextRoom = state.rooms.find((room) => room.id === card.dataset.roomSelect);
        if (!nextRoom) return;
        state.selectedRoom = nextRoom;
        state.roomGalleryIndex = 0;
        renderApp(state);
      });
    });

    document.querySelector("[data-scroll-booking]")?.addEventListener("click", () => {
      state.phase = "booking-form";
      renderApp(state);
    });
    document.querySelector("[data-open-booking-form]")?.addEventListener("click", () => {
      state.phase = "booking-form";
      renderApp(state);
    });
    document.querySelector("[aria-label='favorite']")?.addEventListener("click", (event) => {
      event.currentTarget.classList.toggle("is-active");
    });
    document.querySelector("[aria-label='share']")?.addEventListener("click", async () => {
      const shareData = { title: state.item.title, text: state.item.description || state.item.title, url: location.href };
      try {
        if (navigator.share) await navigator.share(shareData);
        else {
          await navigator.clipboard.writeText(location.href);
          alert(isRu() ? "Ссылка скопирована." : "Link copied.");
        }
      } catch {}
    });
    document.querySelector("[data-open-room-gallery]")?.addEventListener("click", () => {
      state.roomGalleryOpen = true;
      state.roomGalleryIndex = 0;
      renderApp(state);
    });
  }

  function bindBookingFormScreen(state) {
    const form = document.querySelector("[data-booking-form]");
    const extraGuests = document.querySelector("[data-extra-guests]");
    const summary = document.querySelector("[data-booking-summary]");
    const countrySearch = form?.elements.phoneCountrySearch;
    const countryHidden = form?.elements.phoneCountry;
    const countrySuggestions = document.querySelector("[data-country-suggestions]");

    function filterCountryOptions(query = "") {
      const normalized = String(query || "").replace(/[^\d+]/g, "");
      if (!normalized) return countryPhoneData();
      return countryPhoneData().filter((item) => item[3].replace(/[^\d+]/g, "").startsWith(normalized) || item[3].replace(/[^\d]/g, "").startsWith(normalized.replace(/[^\d]/g, "")));
    }

    function renderCountrySuggestions(query = "") {
      if (!countrySuggestions) return;
      const items = filterCountryOptions(query).slice(0, 8);
      countrySuggestions.innerHTML = items.map(([flag, en, ru, code]) => `
        <button type="button" data-country-option="${escapeHtml(code)}">
          <span>${flag} ${code}</span>
          <small>${escapeHtml(isRu() ? ru : en)}</small>
        </button>
      `).join("");
      countrySuggestions.classList.toggle("hidden", !items.length);
      countrySuggestions.querySelectorAll("[data-country-option]").forEach((button) => {
        button.addEventListener("click", () => {
          countryHidden.value = button.dataset.countryOption;
          countrySearch.value = countryPhoneLabel(button.dataset.countryOption);
          countrySuggestions.classList.add("hidden");
        });
      });
    }

    function syncGuests() {
      const count = Number(form.elements.guests.value || 1);
      extraGuests.innerHTML = "";
      for (let index = 2; index <= count; index += 1) extraGuests.insertAdjacentHTML("beforeend", renderExtraGuest(index));
    }

    function refreshSummary() {
      const booking = bookingTotals(form);
      summary.innerHTML = `
        <div><span>${isRu() ? "Стоимость проживания" : "Stay cost"}</span><b>${formatMoney(booking.subtotal, userCurrency)}</b></div>
        <div><span>${isRu() ? "Доп услуги" : "Extra services"}</span><b>${formatMoney(booking.cleaning + booking.service, userCurrency)}</b></div>
        <strong><span>${isRu() ? "Итоговая сумма" : "Total amount"}</span><b>${formatMoney(booking.totalVnd, userCurrency)}</b></strong>
      `;
    }

    syncGuests();
    refreshSummary();
    if (countrySearch && countryHidden) {
      countrySearch.addEventListener("focus", () => renderCountrySuggestions(countryHidden.value || countrySearch.value));
      countrySearch.addEventListener("input", () => renderCountrySuggestions(countrySearch.value));
      countrySearch.addEventListener("blur", () => {
        window.setTimeout(() => countrySuggestions?.classList.add("hidden"), 120);
      });
    }
    form.elements.guests.addEventListener("change", () => {
      syncGuests();
      refreshSummary();
    });
    form.addEventListener("input", refreshSummary);
    document.querySelector("[data-back-to-stay]")?.addEventListener("click", () => {
      state.phase = "stay";
      renderApp(state);
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const booking = bookingTotals(form);
      state.formData = {
        checkin: form.elements.checkin.value,
        checkout: form.elements.checkout.value,
        guests: form.elements.guests.value,
        phoneCountry: form.elements.phoneCountry.value,
        phone: `${form.elements.phoneCountry.value} ${form.elements.phone.value}`.trim(),
        fullName: form.elements.fullName.value,
        birthDate: form.elements.birthDate.value,
        passportNumber: form.elements.passportNumber.value,
        citizenship: form.elements.citizenship.value,
        email: form.elements.email.value,
      };
      state.pendingBooking = {
        ...state.formData,
        guestsDetails: collectGuestDetails(form),
        totalVnd: booking.totalVnd,
      };
      state.phase = "payment";
      renderApp(state);
    });
  }

  function bindPaymentScreen(state) {
    document.querySelectorAll("[data-payment-option]").forEach((option) => {
      option.addEventListener("click", () => {
        state.paymentMethod = option.dataset.paymentOption;
        renderApp(state);
      });
    });
    document.querySelector("[data-back-to-stay]")?.addEventListener("click", () => {
      state.phase = "stay";
      renderApp(state);
    });
    document.querySelector("[data-confirm-payment]")?.addEventListener("click", () => {
      try {
        const result = window.ANIMA_DB?.createBookingRequest({
          entryId: state.item.id,
          propertyId: state.property.id || "",
          unitId: state.selectedRoom.id,
          slug: state.item.slug,
          userId: currentUser?.id || "",
          fullName: state.pendingBooking.fullName,
          birthDate: state.pendingBooking.birthDate,
          phone: state.pendingBooking.phone,
          email: state.pendingBooking.email,
          passportNumber: state.pendingBooking.passportNumber,
          citizenship: state.pendingBooking.citizenship,
          guestsDetails: state.pendingBooking.guestsDetails,
          checkin: state.pendingBooking.checkin,
          checkout: state.pendingBooking.checkout,
          guests: state.pendingBooking.guests,
          note: "",
          totalVnd: state.pendingBooking.totalVnd,
          totalLabel: formatMoney(state.pendingBooking.totalVnd, userCurrency),
        }, baseData);
        if (!result?.booking) throw new Error("BOOKING_CREATE_FAILED");
        window.ANIMA_DB?.recordPayment(result.booking.id, {
          actorUserId: currentUser?.id || "",
          status: "paid",
          method: state.paymentMethod,
          provider: "ANIMA demo checkout",
        }, baseData);
        state.bookingRecord = clone(result.booking);
        state.bookingRecord.payment_status = "paid";
        state.phase = "success";
        renderApp(state);
      } catch {
        alert(isRu() ? "Не удалось создать бронирование. Проверьте данные и попробуйте снова." : "Could not create booking. Check details and try again.");
      }
    });
  }

  function bindSuccessScreen(state) {
    document.querySelector("[data-open-booking-details]")?.addEventListener("click", () => {
      state.phase = "booking-details";
      renderApp(state);
    });
  }

  function bindBookingDetailsScreen(state) {
    document.querySelector("[data-back-to-success]")?.addEventListener("click", () => {
      state.phase = "success";
      renderApp(state);
    });
  }

  init();
})();
