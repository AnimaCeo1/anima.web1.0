(() => {
  const DB_KEY = "anima.db.v1";
  const LEGACY_ENTRIES_KEY = "anima.admin.entries.v1";
  const SESSION_KEY = "anima.analytics.session.v1";
  const DEFAULT_RATES = { VND: 1, USD: 25400, EUR: 27600, RUB: 280, UAH: 620 };
  const SUPPORTED_CURRENCIES = ["VND", "USD", "EUR", "RUB", "UAH"];
  const API_URL = "/api/db";
  const SERVER_SYNC_TIMEOUT_MS = 350;
  const COMMISSION_PERCENT = 5;
  const DEFAULT_PARTNER_PASSWORD_HASH = "7a124770a1e1acc52ee9f6c8007f0b248e43672d66635fe197fedb591b4c11df";
  let memoryState = null;
  let serverHydrationStarted = false;
  let serverWriteInFlight = false;
  let queuedServerState = null;
  const CONTENT_CATEGORY_DEFS = [
    { id: "hotel", label: "Отели", emoji: "🏨", kind: "stay" },
    { id: "apartment", label: "Апартаменты", emoji: "🏢", kind: "stay" },
    { id: "villa", label: "Виллы", emoji: "🏡", kind: "stay" },
    { id: "cafe", label: "Кофейни", emoji: "☕", kind: "food" },
    { id: "restaurant", label: "Рестораны", emoji: "🍽", kind: "food" },
    { id: "tour", label: "Туры", emoji: "🧳", kind: "experience" },
    { id: "entertainment", label: "Развлечения", emoji: "🎉", kind: "experience" },
    { id: "relax", label: "Отдых", emoji: "🌿", kind: "experience" },
    { id: "service", label: "Сервисы", emoji: "🛎", kind: "service" },
    { id: "vacancy", label: "Вакансии", emoji: "💼", kind: "job" },
  ];
  const BASE_TABLES = [
    "contentEntries",
    "listings",
    "products",
    "categories",
    "users",
    "orders",
    "notifications",
    "promotionRequests",
    "verifications",
  ];
  const PARTNER_TABLES = [
    "partners",
    "partnerStaff",
    "partnerProperties",
    "partnerUnits",
    "availability",
    "partnerBookings",
    "bookingStatusHistory",
    "financeTransactions",
    "auditLogs",
    "partnerNotifications",
    "partnerApplications",
    "bookingComments",
    "commissionRules",
    "payments",
    "partnerBalances",
    "withdrawalRequests",
    "chats",
    "messages",
    "adminNotes",
    "adminMessages",
    "animaLedger",
    "payoutTasks",
    "propertyTypes",
    "roomTypes",
    "propertyPhotos",
    "roomTypePhotos",
    "amenities",
    "propertyAmenities",
    "roomTypeAmenities",
    "prices",
    "moderationRequests",
    "supportTickets",
    "reviews",
  ];

  function now() {
    return new Date().toISOString();
  }

  function uid(prefix) {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function readLocal() {
    try {
      return JSON.parse(localStorage.getItem(DB_KEY) || "null");
    } catch {
      return null;
    }
  }

  function writeLocal(state) {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(state));
    } catch {}
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function queueServerWrite(state) {
    queuedServerState = clone(state);
    if (serverWriteInFlight || typeof fetch !== "function") return;
    serverWriteInFlight = true;
    Promise.resolve().then(flushQueuedServerWrite);
  }

  async function flushQueuedServerWrite() {
    while (queuedServerState) {
      const nextState = queuedServerState;
      queuedServerState = null;
      const startedAt = typeof performance !== "undefined" ? performance.now() : 0;
      try {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nextState),
          keepalive: true,
          cache: "no-store",
        });
        if (startedAt) {
          console.log(`[perf][db] flushQueuedServerWrite: ${response.status} in ${(performance.now() - startedAt).toFixed(1)}ms`);
        }
      } catch {}
    }
    serverWriteInFlight = false;
    if (queuedServerState) queueServerWrite(queuedServerState);
  }

  function hydrateFromServerAsync() {
    if (serverHydrationStarted || typeof fetch !== "function") return;
    serverHydrationStarted = true;
    Promise.resolve().then(async () => {
      const startedAt = typeof performance !== "undefined" ? performance.now() : 0;
      try {
        const response = await fetch(API_URL, { cache: "no-store" });
        if (!response.ok) return;
        const serverState = await response.json();
        if (!serverState?.version) return;
        const localState = memoryState || readLocal();
        if (localState?.version === 1) {
          if ((localState.updatedAt || "") === (serverState.updatedAt || "")) {
            memoryState = localState;
            return;
          }
          const merged = mergeStates(serverState, localState);
          memoryState = merged;
          writeLocal(merged);
          return;
        }
        memoryState = serverState;
        writeLocal(serverState);
      } catch {}
      finally {
        if (startedAt) {
          console.log(`[perf][db] hydrateFromServerAsync: ${(performance.now() - startedAt).toFixed(1)}ms`);
        }
      }
    });
  }

  function categoryCatalog() {
    return clone(CONTENT_CATEGORY_DEFS);
  }

  function resolveCategoryMeta(value = "") {
    const normalized = String(value || "").trim().toLowerCase();
    return CONTENT_CATEGORY_DEFS.find((item) => item.id === normalized || item.label.toLowerCase() === normalized)
      || CONTENT_CATEGORY_DEFS.find((item) => normalized.includes(item.id))
      || CONTENT_CATEGORY_DEFS[0];
  }

  function mergeUniqueRecords(primary = [], secondary = []) {
    const byId = new Map();
    [...secondary, ...primary].forEach((item) => {
      if (!item?.id) return;
      const existing = byId.get(item.id);
      if (!existing) {
        byId.set(item.id, clone(item));
        return;
      }
      const currentStamp = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
      const nextStamp = new Date(item.updatedAt || item.createdAt || 0).getTime();
      byId.set(item.id, clone(nextStamp >= currentStamp ? item : existing));
    });
    return Array.from(byId.values()).sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
  }

  function stateWeight(state) {
    if (!state?.tables) return 0;
    return [...BASE_TABLES, ...PARTNER_TABLES].reduce((sum, key) => sum + (Array.isArray(state.tables[key]) ? state.tables[key].length : 0), 0);
  }

  function mergeStates(serverState, localState) {
    if (!serverState?.version) return localState || null;
    if (!localState?.version) return serverState || null;
    const primary = stateWeight(localState) > stateWeight(serverState) ? localState : serverState;
    const secondary = primary === localState ? serverState : localState;
    const merged = clone(primary);
    merged.createdAt = secondary.createdAt || merged.createdAt || now();
    merged.updatedAt = now();
    merged.settings = {
      ...secondary.settings,
      ...merged.settings,
      currencies: merged.settings?.currencies?.length ? merged.settings.currencies : secondary.settings?.currencies || SUPPORTED_CURRENCIES,
      currencyRates: {
        ...(secondary.settings?.currencyRates || {}),
        ...(merged.settings?.currencyRates || {}),
      },
    };
    merged.analytics = {
      ...(secondary.analytics || {}),
      ...(merged.analytics || {}),
      visits: Math.max(secondary.analytics?.visits || 0, merged.analytics?.visits || 0),
      appOpens: Math.max(secondary.analytics?.appOpens || 0, merged.analytics?.appOpens || 0),
      registrations: Math.max(secondary.analytics?.registrations || 0, merged.analytics?.registrations || 0),
      activeClients: Math.max(secondary.analytics?.activeClients || 0, merged.analytics?.activeClients || 0),
      orders: Math.max(secondary.analytics?.orders || 0, merged.analytics?.orders || 0),
      lastVisitAt: [secondary.analytics?.lastVisitAt, merged.analytics?.lastVisitAt].filter(Boolean).sort().pop() || "",
    };
    merged.tables = Object.fromEntries([...BASE_TABLES, ...PARTNER_TABLES].map((key) => [
      key,
      mergeUniqueRecords(primary.tables?.[key], secondary.tables?.[key]),
    ]));
    merged.analytics.orders = merged.tables.orders.length;
    merged.analytics.registrations = Math.max(merged.analytics.registrations || 0, merged.tables.users.length);
    merged.analytics.activeClients = Math.max(merged.analytics.activeClients || 0, merged.tables.users.length);
    return merged;
  }

  function read() {
    const startedAt = typeof performance !== "undefined" ? performance.now() : 0;
    if (memoryState?.version === 1) return memoryState;
    const localState = readLocal();
    if (localState?.version === 1) {
      memoryState = localState;
      hydrateFromServerAsync();
      if (startedAt) {
        console.log(`[perf][db] read(local): ${(performance.now() - startedAt).toFixed(1)}ms`);
      }
      return memoryState;
    }
    hydrateFromServerAsync();
    if (startedAt) {
      console.log(`[perf][db] read(no-local-state): ${(performance.now() - startedAt).toFixed(1)}ms`);
    }
    return null;
  }

  function write(state) {
    memoryState = state;
    writeLocal(state);
    queueServerWrite(state);
    return state;
  }

  function createEmptyState(seed = {}) {
    return {
      version: 1,
      createdAt: now(),
      updatedAt: now(),
      settings: {
        currencies: seed.user?.supportedCurrencies || SUPPORTED_CURRENCIES,
        currencyRates: seed.user?.currencyRates || DEFAULT_RATES,
      },
      analytics: {
        visits: 0,
        appOpens: 0,
        registrations: 0,
        activeClients: 0,
        orders: 0,
        lastVisitAt: "",
      },
      tables: {
        contentEntries: [],
        listings: [],
        products: [],
        categories: [],
        users: [],
        orders: [],
        notifications: [],
        promotionRequests: [],
        verifications: [],
        partners: [],
        partnerStaff: [],
        partnerProperties: [],
        partnerUnits: [],
        availability: [],
        partnerBookings: [],
        bookingStatusHistory: [],
        financeTransactions: [],
        auditLogs: [],
        partnerNotifications: [],
        partnerApplications: [],
        bookingComments: [],
        commissionRules: [],
        payments: [],
        partnerBalances: [],
        withdrawalRequests: [],
        chats: [],
        messages: [],
        adminNotes: [],
        adminMessages: [],
        animaLedger: [],
        payoutTasks: [],
        propertyTypes: [],
        roomTypes: [],
        propertyPhotos: [],
        roomTypePhotos: [],
        amenities: [],
        propertyAmenities: [],
        roomTypeAmenities: [],
        prices: [],
        moderationRequests: [],
        supportTickets: [],
        reviews: [],
      },
    };
  }

  function normalizeLogin(value = "") {
    return String(value || "").trim().toLowerCase();
  }

  function generateCode(length = 6) {
    return String(Math.floor(Math.random() * 10 ** length)).padStart(length, "0");
  }

  function publicUser(user) {
    if (!user) return null;
    const cloneUser = clone(user);
    delete cloneUser.passwordHash;
    if (cloneUser.verification) delete cloneUser.verification.code;
    return cloneUser;
  }

  function findUserByLogin(state, login) {
    const normalized = normalizeLogin(login);
    return state.tables.users.find((user) => {
      if (user.status && user.status !== "active") return false;
      return [user.email, user.username, user.telegram]
        .filter(Boolean)
        .map(normalizeLogin)
        .includes(normalized);
    }) || null;
  }

  function assertRegistrationAvailability(state, payload) {
    const email = normalizeLogin(payload.email);
    const username = normalizeLogin(payload.username);
    const telegram = normalizeLogin(payload.telegram);
    const conflict = state.tables.users.find((user) => {
      const checks = [
        email && normalizeLogin(user.email) === email,
        username && normalizeLogin(user.username) === username,
        telegram && normalizeLogin(user.telegram) === telegram,
      ];
      return checks.some(Boolean);
    });
    if (conflict?.status === "active") throw new Error("USER_EXISTS");
    return conflict || null;
  }

  function parsePriceText(value) {
    const text = String(value || "").trim();
    if (!text) return null;
    const match = text.match(/^([\d.,\s]+)\s*(VND|USD|EUR|RUB|UAH)$/i);
    if (!match) return null;
    return {
      amount: Number(match[1].replace(/\s/g, "").replace(/,/g, "")) || 0,
      currency: match[2].toUpperCase(),
    };
  }

  function convertPriceMap(amount, currency, rates) {
    if (!amount || !currency) return {};
    const rateMap = rates || DEFAULT_RATES;
    const baseVnd = currency === "VND" ? amount : amount * (rateMap[currency] || 1);
    return Object.fromEntries(SUPPORTED_CURRENCIES.map((code) => {
      const value = code === "VND" ? baseVnd : baseVnd / (rateMap[code] || 1);
      return [code, Math.round(value * 100) / 100];
    }));
  }

  function attachPriceMaps(fields, rates) {
    const next = { ...fields };
    ["price", "monthlyPrice", "cleaningFee", "serviceFee", "deposit", "salary"].forEach((key) => {
      const parsed = parsePriceText(fields[key]);
      if (!parsed) return;
      next[`${key}Value`] = parsed.amount;
      next[`${key}Currency`] = parsed.currency;
      next[`${key}Map`] = convertPriceMap(parsed.amount, parsed.currency, rates);
    });
    return next;
  }

  function classifyEntry(entry) {
    if (entry.module === "store") return "product";
    if (entry.module === "feed") return "news";
    if (entry.module === "categories") return "category";
    return "listing";
  }

  function projectListing(entry) {
    return {
      id: entry.id,
      module: entry.module,
      status: entry.status,
      title: entry.title,
      category: entry.fields.category || "",
      section: entry.fields.section || entry.module,
      price: entry.fields.price || "",
      priceMap: entry.fields.priceMap || {},
      image: entry.fields.image || "",
      updatedAt: entry.updatedAt,
    };
  }

  function projectProduct(entry) {
    return {
      id: entry.id,
      status: entry.status,
      title: entry.title,
      category: entry.fields.category || "",
      price: entry.fields.price || "",
      priceMap: entry.fields.priceMap || {},
      image: entry.fields.image || "",
      updatedAt: entry.updatedAt,
    };
  }

  function projectCategory(entry) {
    return {
      id: entry.id,
      title: entry.title,
      placement: entry.fields.placement || "",
      screen: entry.fields.screen || "",
      status: entry.status,
      updatedAt: entry.updatedAt,
    };
  }

  function upsertInTable(items, nextItem) {
    const filtered = items.filter((item) => item.id !== nextItem.id);
    return [nextItem, ...filtered];
  }

  function seedState(seedData = {}) {
    const state = createEmptyState(seedData);
    state.tables.users = [
      {
        id: "user_simbios",
        role: "client",
        name: seedData.user?.name || "ANIMA User",
        city: seedData.user?.city || "Dalat",
        preferredCurrency: seedData.user?.currency || "VND",
        createdAt: now(),
      },
    ];
    state.analytics.registrations = state.tables.users.length;
    state.analytics.activeClients = state.tables.users.length;
    try {
      const legacyEntries = JSON.parse(localStorage.getItem(LEGACY_ENTRIES_KEY) || "[]");
      legacyEntries.forEach((entry) => {
        const nextEntry = {
          ...entry,
          fields: attachPriceMaps(entry.fields || {}, state.settings.currencyRates),
          entityType: classifyEntry(entry),
        };
        state.tables.contentEntries.push(nextEntry);
        if (nextEntry.entityType === "listing" || nextEntry.entityType === "news") {
          state.tables.listings = upsertInTable(state.tables.listings, projectListing(nextEntry));
        }
        if (nextEntry.entityType === "product") {
          state.tables.products = upsertInTable(state.tables.products, projectProduct(nextEntry));
        }
        if (nextEntry.entityType === "category") {
          state.tables.categories = upsertInTable(state.tables.categories, projectCategory(nextEntry));
        }
      });
    } catch {}
    return state;
  }

  function ensureArrayTables(state) {
    state.tables = state.tables || {};
    [...BASE_TABLES, ...PARTNER_TABLES].forEach((key) => {
      if (!Array.isArray(state.tables[key])) state.tables[key] = [];
    });
    return state;
  }

  function dateDays(start, end) {
    const days = [];
    const startDate = new Date(`${start}T00:00:00`);
    const endDate = new Date(`${end}T00:00:00`);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return days;
    for (let item = new Date(startDate); item < endDate; item.setDate(item.getDate() + 1)) {
      days.push(item.toISOString().slice(0, 10));
    }
    return days;
  }

  function bookingStatusFromOrder(status = "new") {
    return {
      new: "pending_partner_confirmation",
      review: "pending_partner_confirmation",
      approved: "confirmed",
      payment_requested: "confirmed",
      paid: "confirmed",
      cancelled: "cancelled_by_client",
    }[status] || "pending_partner_confirmation";
  }

  function paymentStatusFromOrder(status = "new") {
    if (status === "paid") return "paid";
    if (status === "payment_requested" || status === "approved") return "waiting_payment";
    return "unpaid";
  }

  function orderStatusFromBooking(status = "pending_partner_confirmation") {
    return {
      pending_partner_confirmation: "review",
      confirmed: "payment_requested",
      rejected: "cancelled",
      cancelled_by_client: "cancelled",
      cancelled_by_partner: "cancelled",
      completed: "paid",
      no_show: "cancelled",
      dispute: "review",
    }[status] || "review";
  }

  function commissionOf(totalAmount, percent = COMMISSION_PERCENT, fixedAmount = 0, type = "percent") {
    const total = Math.max(0, Number(totalAmount || 0));
    const commissionPercent = Number(percent || COMMISSION_PERCENT);
    const fixed = Math.max(0, Number(fixedAmount || 0));
    const percentAmount = Math.round(total * commissionPercent / 100);
    const commissionAmount = Math.min(total, type === "fixed" ? fixed : type === "percent_fixed" ? percentAmount + fixed : percentAmount);
    return {
      totalAmount: total,
      commissionPercent,
      commissionFixedAmount: fixed,
      commissionType: type,
      commissionAmount,
      partnerAmount: Math.max(0, total - commissionAmount),
    };
  }

  function statusStep(status = "pending_partner_confirmation") {
    return {
      new_request: "Новая заявка",
      pending_partner_confirmation: "Ожидает подтверждения отеля",
      confirmed: "Подтверждена отелем",
      waiting_payment: "Ожидает оплаты клиента",
      commission_paid: "Сервисный сбор ANIMA оплачен",
      paid: "Оплачена",
      active: "Бронь активна",
      checked_in: "Клиент заселился",
      completed: "Проживание завершено",
      funds_available: "Деньги доступны партнёру",
      payout_requested: "Выплата запрошена",
      payout_sent: "Выплата отправлена",
      closed: "Завершено",
      rejected: "Отклонена отелем",
      cancelled_by_client: "Отменена клиентом",
      cancelled_by_anima: "Отменена ANIMA",
      refund: "Возврат",
      dispute: "Спор",
      problem: "Проблема",
    }[status] || status;
  }

  function resolveCommissionRule(state, booking = {}) {
    const rules = (state.tables.commissionRules || [])
      .filter((rule) => rule.status !== "disabled")
      .filter((rule) => {
        if (rule.booking_id && rule.booking_id !== booking.id) return false;
        if (rule.partner_id && rule.partner_id !== booking.partner_id) return false;
        if (rule.property_id && rule.property_id !== booking.property_id) return false;
        if (rule.unit_id && rule.unit_id !== booking.unit_id) return false;
        if (rule.date_from && booking.start_date && booking.start_date < rule.date_from) return false;
        if (rule.date_to && booking.start_date && booking.start_date > rule.date_to) return false;
        return true;
      })
      .sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0));
    return rules[0] || {
      id: "commission_default",
      scope: "global",
      type: "percent",
      percent: Number(state.settings?.defaultCommissionPercent || COMMISSION_PERCENT),
      fixed_amount: 0,
      priority: 0,
      status: "active",
    };
  }

  function bookingFinance(state, booking) {
    const rule = resolveCommissionRule(state, booking);
    return {
      ...commissionOf(booking.total_amount, rule.percent, rule.fixed_amount, rule.type),
      commissionRuleId: rule.id,
    };
  }

  function propertyPaymentMode(property = {}) {
    const settings = property.payment_settings || {};
    if (settings.force_anima_online) return "anima_online";
    if (settings.method === "cash_at_hotel" && settings.cash_allowed !== false) return "cash_at_hotel";
    return settings.method || "anima_online";
  }

  function paymentModeLabel(mode = "anima_online") {
    return mode === "cash_at_hotel" ? "Оплата наличными в отеле" : "Оплата сразу через ANIMA";
  }

  function moderationStatus(value = "approved") {
    const allowed = ["draft", "pending_review", "approved", "rejected", "archived"];
    return allowed.includes(value) ? value : value === "pending" ? "pending_review" : value === "moderation" ? "pending_review" : "approved";
  }

  function propertyKindFromValue(value = "") {
    const normalized = String(value || "").toLowerCase();
    if (normalized.includes("restaurant") || normalized.includes("рест")) return "restaurant";
    if (normalized.includes("tour") || normalized.includes("тур")) return "tour";
    if (normalized.includes("entertainment") || normalized.includes("развлеч")) return "entertainment";
    if (normalized.includes("relax") || normalized.includes("отдых")) return "relax";
    if (normalized.includes("service") || normalized.includes("серв")) return "service";
    if (normalized.includes("vacancy") || normalized.includes("ваканс")) return "vacancy";
    if (normalized.includes("villa") || normalized.includes("вилл")) return "villa";
    if (normalized.includes("house") || normalized.includes("дом")) return "house";
    if (normalized.includes("apartment") || normalized.includes("апартамент")) return "apartment";
    if (normalized.includes("cafe") || normalized.includes("каф")) return "cafe";
    return "hotel";
  }

  function createModerationRequest(state, payload = {}) {
    const request = {
      id: uid("moderation"),
      partner_id: payload.partnerId || "",
      user_id: payload.userId || "",
      entity_type: payload.entityType || "",
      entity_id: payload.entityId || "",
      change_type: payload.changeType || "update",
      title: payload.title || "Изменение на модерации",
      status: "pending_review",
      old_value: payload.oldValue ?? null,
      new_value: payload.newValue ?? null,
      admin_comment: "",
      submitted_at: now(),
      reviewed_at: "",
      reviewed_by: "",
      createdAt: now(),
      updatedAt: now(),
    };
    state.tables.moderationRequests.unshift(request);
    return request;
  }

  function financialBreakdown(state, input = {}) {
    const property = state.tables.partnerProperties.find((item) => item.id === input.property_id) || {};
    const booking = {
      id: input.booking_id || input.id || "",
      partner_id: input.partner_id || property.partner_id || "",
      property_id: input.property_id || "",
      unit_id: input.unit_id || "",
      start_date: input.start_date || input.checkin || "",
      total_amount: Number(input.total_amount || input.totalVnd || 0),
      commission_percent: input.commission_percent,
      commission_fixed_amount: input.commission_fixed_amount,
      commission_type: input.commission_type,
    };
    const rule = resolveCommissionRule(state, booking);
    const finance = commissionOf(
      booking.total_amount,
      booking.commission_percent ?? rule.percent,
      booking.commission_fixed_amount ?? rule.fixed_amount,
      booking.commission_type ?? rule.type,
    );
    const mode = input.payment_method || propertyPaymentMode(property);
    const payNow = mode === "cash_at_hotel" ? finance.commissionAmount : finance.totalAmount;
    const payAtHotel = mode === "cash_at_hotel" ? finance.partnerAmount : 0;
    const partnerBalanceAmount = mode === "anima_online" ? finance.partnerAmount : 0;
    return {
      payment_method: mode,
      payment_method_label: paymentModeLabel(mode),
      total_amount: finance.totalAmount,
      commission_percent: finance.commissionPercent,
      commission_type: finance.commissionType,
      commission_fixed_amount: finance.commissionFixedAmount,
      commission_amount: finance.commissionAmount,
      partner_amount: finance.partnerAmount,
      pay_now_amount: payNow,
      pay_at_hotel_amount: payAtHotel,
      partner_balance_amount: partnerBalanceAmount,
      anima_commission_amount: finance.commissionAmount,
      client_copy: mode === "cash_at_hotel"
        ? "Для подтверждения брони оплатите сервисный сбор ANIMA. Остальную сумму вы оплатите напрямую в отеле при заселении."
        : "Для подтверждения брони оплатите полную стоимость проживания онлайн через ANIMA.",
    };
  }

  function bookedUnitsForDay(state, unitId, date, excludeBookingId = "") {
    return state.tables.partnerBookings.reduce((sum, booking) => {
      if (booking.id === excludeBookingId || booking.unit_id !== unitId) return sum;
      if (!["confirmed", "waiting_payment", "paid", "active", "checked_in", "completed", "funds_available", "payout_requested"].includes(booking.booking_status)) return sum;
      if (!dateDays(booking.start_date, booking.end_date).includes(date)) return sum;
      return sum + Number(booking.units_count || 1);
    }, 0);
  }

  function availableUnitsForDay(state, unitId, date, excludeBookingId = "") {
    const unit = state.tables.partnerUnits.find((item) => item.id === unitId);
    const quantity = Math.max(0, Number(unit?.quantity || 1));
    const day = state.tables.availability.find((item) => item.unit_id === unitId && item.date === date);
    if (["closed", "admin_closed", "technical"].includes(day?.status)) return 0;
    return Math.max(0, quantity - bookedUnitsForDay(state, unitId, date, excludeBookingId));
  }

  function normalizePartnerProperty(entry, partnerId) {
    const fields = entry?.fields || {};
    const propertyKind = propertyKindFromValue(fields.propertyType || fields.category || fields.type || fields.section);
    const objectPhotos = [fields.image, ...(String(fields.propertyGallery || fields.gallery || "").split("\n"))].filter(Boolean);
    return {
      id: `property_${entry.id}`,
      partner_id: partnerId,
      sourceEntryId: entry.id,
      type: propertyKind,
      property_type_id: propertyKind,
      booking_model: propertyKind === "hotel" ? "room_type" : "whole_property",
      title: fields.title || entry.title || "Объект ANIMA",
      description: fields.description || "",
      address: fields.address || fields.location || "Dalat",
      location: fields.location || "Dalat",
      photos: objectPhotos,
      property_photos: objectPhotos,
      amenities: String(fields.amenities || "").split(",").map((item) => item.trim()).filter(Boolean),
      rules: String(fields.rules || "").split(",").map((item) => item.trim()).filter(Boolean),
      contacts: {
        phone: fields.phone || "",
        email: fields.email || "",
        telegram: fields.telegram || "",
        whatsapp: fields.whatsapp || "",
      },
      payment_settings: {
        method: fields.paymentMethod || "cash_at_hotel",
        cash_allowed: true,
        force_anima_online: false,
        payout_provider: "manual",
      },
      checkin: fields.checkin || "14:00",
      checkout: fields.checkout || "12:00",
      status: "active",
      moderation_status: "approved",
      criticalChanges: [],
      createdAt: entry.createdAt || now(),
      updatedAt: entry.updatedAt || now(),
    };
  }

  function normalizePartnerUnit(entry, propertyId) {
    const fields = entry?.fields || {};
    const price = parsePriceText(fields.price) || { amount: Number(fields.priceValue || 0), currency: fields.priceCurrency || "VND" };
    const roomPhotos = String(fields.roomGallery || "").split("\n").map((item) => item.trim()).filter(Boolean);
    return {
      id: `unit_${entry.id}_standard`,
      property_id: propertyId,
      type: fields.category || "Hotels",
      name: fields.type || "Стандартный номер",
      description: fields.roomDescription || fields.description || "",
      size: fields.size || "",
      capacity: Number(fields.guests || 2),
      beds_count: Number(fields.beds || fields.guests || 1),
      baths_count: Number(fields.baths || 1),
      base_price: Number(fields.priceMap?.VND || price.amount || 0),
      quantity: Number(fields.rooms || 1),
      photos: roomPhotos.length ? roomPhotos : [fields.image].filter(Boolean),
      amenities: String(fields.roomAmenities || fields.amenities || "").split(",").map((item) => item.trim()).filter(Boolean),
      rules: String(fields.roomRules || fields.rules || "").split(",").map((item) => item.trim()).filter(Boolean),
      min_nights: Number(fields.minNights || 1),
      status: "active",
      moderation_status: "approved",
      createdAt: entry.createdAt || now(),
      updatedAt: entry.updatedAt || now(),
    };
  }

  function audit(state, entry = {}) {
    state.tables.auditLogs.unshift({
      id: uid("audit"),
      user_id: entry.userId || "",
      partner_id: entry.partnerId || "",
      entity_type: entry.entityType || "",
      entity_id: entry.entityId || "",
      action: entry.action || "",
      old_value: entry.oldValue ?? null,
      new_value: entry.newValue ?? null,
      ip: entry.ip || "",
      created_at: now(),
      createdAt: now(),
    });
  }

  function pushPartnerNotification(state, notification = {}) {
    state.tables.partnerNotifications.unshift({
      id: uid("partner_notification"),
      user_id: notification.userId || "",
      partner_id: notification.partnerId || "",
      type: notification.type || "info",
      title: notification.title || "Уведомление ANIMA",
      message: notification.message || "",
      read_at: "",
      created_at: now(),
      createdAt: now(),
    });
  }

  function addNotificationToState(state, notification = {}) {
    if (!notification.userId) return null;
    const item = {
      id: uid("notification"),
      status: "unread",
      createdAt: now(),
      userId: notification.userId,
      orderId: notification.orderId || "",
      bookingId: notification.bookingId || "",
      type: notification.type || "system",
      senderName: notification.senderName || "ANIMA",
      senderType: notification.senderType || "system",
      title: notification.title || "Уведомление ANIMA",
      message: notification.message || "",
      priority: notification.priority || "normal",
      actionType: notification.actionType || "",
      actionUrl: notification.actionUrl || "",
      cta: notification.cta || null,
      replyAllowed: Boolean(notification.replyAllowed),
    };
    state.tables.notifications.unshift(item);
    return item;
  }

  function addAdminSystemNotification(state, title, message) {
    state.tables.partnerNotifications.unshift({
      id: uid("admin_notification"),
      user_id: "admin",
      partner_id: "",
      type: "admin-system",
      title,
      message,
      read_at: "",
      created_at: now(),
      createdAt: now(),
    });
  }

  function markAvailabilityDay(state, payload) {
    const id = `availability_${payload.propertyId}_${payload.unitId || "all"}_${payload.date}${payload.timeSlot ? `_${payload.timeSlot}` : ""}`;
    const existing = state.tables.availability.find((item) => item.id === id);
    const nextItem = {
      id,
      property_id: payload.propertyId,
      unit_id: payload.unitId || "",
      date: payload.date,
      time_slot: payload.timeSlot || "",
      status: payload.status,
      price: Number(payload.price || existing?.price || 0),
      reason: payload.reason || "",
      createdAt: existing?.createdAt || now(),
      updatedAt: now(),
    };
    state.tables.availability = upsertInTable(state.tables.availability, nextItem);
    return nextItem;
  }

  function syncHousingArchitecture(state) {
    let changed = false;
    const propertyTypeSeeds = [
      ["hotel", "Отель", true],
      ["villa", "Вилла", false],
      ["house", "Дом", false],
      ["apartment", "Апартамент", false],
      ["other", "Другое жильё", false],
      ["cafe", "Кафе", false],
    ];
    propertyTypeSeeds.forEach(([id, title, requiresRoomTypes]) => {
      if (state.tables.propertyTypes.some((item) => item.id === id)) return;
      state.tables.propertyTypes.push({ id, title, requires_room_types: requiresRoomTypes, createdAt: now(), updatedAt: now() });
      changed = true;
    });
    const amenityByTitle = new Map(state.tables.amenities.map((item) => [String(item.title || "").toLowerCase(), item]));
    const ensureAmenity = (title) => {
      const clean = String(title || "").trim();
      if (!clean) return null;
      const key = clean.toLowerCase();
      if (amenityByTitle.has(key)) return amenityByTitle.get(key);
      const amenity = { id: uid("amenity"), title: clean, createdAt: now(), updatedAt: now() };
      state.tables.amenities.push(amenity);
      amenityByTitle.set(key, amenity);
      changed = true;
      return amenity;
    };
    state.tables.partnerProperties.forEach((property) => {
      const kind = propertyKindFromValue(property.property_type_id || property.type || "hotel");
      const nextProperty = {
        ...property,
        type: kind,
        property_type_id: kind,
        booking_model: property.booking_model || (kind === "hotel" ? "room_type" : "whole_property"),
        moderation_status: moderationStatus(property.moderation_status),
        public_version: property.public_version || clone(property),
      };
      if (JSON.stringify(nextProperty) !== JSON.stringify(property)) {
        state.tables.partnerProperties = upsertInTable(state.tables.partnerProperties, nextProperty);
        changed = true;
      }
      (nextProperty.photos || []).forEach((url, index) => {
        const id = `property_photo_${nextProperty.id}_${index}`;
        if (!state.tables.propertyPhotos.some((item) => item.id === id)) {
          state.tables.propertyPhotos.push({ id, property_id: nextProperty.id, url, caption: index === 0 ? "Главное фото объекта" : "", moderation_status: "approved", sort_order: index, createdAt: now(), updatedAt: now() });
          changed = true;
        }
      });
      (nextProperty.amenities || []).forEach((title) => {
        const amenity = ensureAmenity(title);
        if (!amenity) return;
        const id = `property_amenity_${nextProperty.id}_${amenity.id}`;
        if (!state.tables.propertyAmenities.some((item) => item.id === id)) {
          state.tables.propertyAmenities.push({ id, property_id: nextProperty.id, amenity_id: amenity.id, createdAt: now(), updatedAt: now() });
          changed = true;
        }
      });
    });
    state.tables.partnerUnits.forEach((room) => {
      const nextRoom = {
        ...room,
        room_type_id: room.room_type_id || room.id,
        room_type: room.type || "standard",
        moderation_status: moderationStatus(room.moderation_status),
        public_version: room.public_version || clone(room),
      };
      if (JSON.stringify(nextRoom) !== JSON.stringify(room)) {
        state.tables.partnerUnits = upsertInTable(state.tables.partnerUnits, nextRoom);
        changed = true;
      }
      if (!state.tables.roomTypes.some((item) => item.id === nextRoom.id)) {
        state.tables.roomTypes.push(clone(nextRoom));
        changed = true;
      }
      (nextRoom.photos || []).forEach((url, index) => {
        const id = `room_type_photo_${nextRoom.id}_${index}`;
        if (!state.tables.roomTypePhotos.some((item) => item.id === id)) {
          state.tables.roomTypePhotos.push({ id, room_type_id: nextRoom.id, property_id: nextRoom.property_id, url, caption: index === 0 ? "Главное фото номера" : "", moderation_status: "approved", sort_order: index, createdAt: now(), updatedAt: now() });
          changed = true;
        }
      });
      (nextRoom.amenities || []).forEach((title) => {
        const amenity = ensureAmenity(title);
        if (!amenity) return;
        const id = `room_type_amenity_${nextRoom.id}_${amenity.id}`;
        if (!state.tables.roomTypeAmenities.some((item) => item.id === id)) {
          state.tables.roomTypeAmenities.push({ id, room_type_id: nextRoom.id, amenity_id: amenity.id, createdAt: now(), updatedAt: now() });
          changed = true;
        }
      });
      const priceId = `price_${nextRoom.id}_base`;
      if (!state.tables.prices.some((item) => item.id === priceId)) {
        state.tables.prices.push({ id: priceId, property_id: nextRoom.property_id, room_type_id: nextRoom.id, date_from: "", date_to: "", type: "base", amount: Number(nextRoom.base_price || 0), currency: "VND", moderation_status: "approved", createdAt: now(), updatedAt: now() });
        changed = true;
      }
    });
    return changed;
  }

  function ensurePartnerSeed(state) {
    ensureArrayTables(state);
    let changed = false;
    if (!state.settings.defaultCommissionPercent) {
      state.settings.defaultCommissionPercent = COMMISSION_PERCENT;
      changed = true;
    }
    if (!state.tables.commissionRules.some((rule) => rule.id === "commission_default")) {
      state.tables.commissionRules.unshift({
        id: "commission_default",
        scope: "global",
        title: "Глобальная комиссия ANIMA",
        type: "percent",
        percent: COMMISSION_PERCENT,
        fixed_amount: 0,
        currency: "VND",
        status: "active",
        priority: 0,
        createdAt: now(),
        updatedAt: now(),
      });
      changed = true;
    }
    const stayEntry = state.tables.contentEntries.find((entry) => entry.module === "stay" && entry.status === "published") || state.tables.contentEntries.find((entry) => entry.module === "stay");
    if (!stayEntry) return false;
    const partnerId = "partner_ibis_dalat";
    const userId = "user_partner_ibis_dalat";
    const businessName = stayEntry.fields?.title || stayEntry.title || "IBIS Style Hotel Da Lat";
    if (!state.tables.partners.some((partner) => partner.id === partnerId)) {
      state.tables.partners.unshift({
        id: partnerId,
        user_id: userId,
        business_name: businessName,
        business_type: "hotel",
        contact_name: "Владелец IBIS Style",
        phone: "+84 000 000 000",
        email: "partner@anima.local",
        telegram: "@anima_partner",
        whatsapp: "",
        status: "active",
        commission_percent: COMMISSION_PERCENT,
        login: "ibis_partner",
        temporaryPasswordHash: DEFAULT_PARTNER_PASSWORD_HASH,
        mustChangePassword: true,
        created_at: now(),
        updated_at: now(),
        createdAt: now(),
        updatedAt: now(),
      });
      changed = true;
    }
    if (!state.tables.users.some((user) => user.id === userId)) {
      state.tables.users.unshift({
        id: userId,
        role: "partner_owner",
        status: "active",
        name: "IBIS Style Partner",
        fullName: "IBIS Style Partner",
        email: "partner@anima.local",
        username: "ibis_partner",
        city: "Dalat, Vietnam",
        partnerId,
        passwordHash: DEFAULT_PARTNER_PASSWORD_HASH,
        mustChangePassword: true,
        security: { twoFactorEnabled: false, pinEnabled: false, pinHash: "", faceIdEnabled: false },
        createdAt: now(),
        updatedAt: now(),
      });
      changed = true;
    }
    if (!state.tables.partnerStaff.some((staff) => staff.partner_id === partnerId && staff.user_id === userId)) {
      state.tables.partnerStaff.unshift({
        id: "staff_ibis_owner",
        partner_id: partnerId,
        user_id: userId,
        role: "partner_owner",
        permissions: ["dashboard", "properties", "rooms", "bookings", "calendar", "finance", "withdrawals", "messages", "settings", "documents"],
        createdAt: now(),
        updatedAt: now(),
      });
      changed = true;
    }
    const propertyId = `property_${stayEntry.id}`;
    const unitId = `unit_${stayEntry.id}_standard`;
    if (!state.tables.partnerProperties.some((property) => property.id === propertyId)) {
      state.tables.partnerProperties.unshift(normalizePartnerProperty(stayEntry, partnerId));
      changed = true;
    }
    state.tables.partnerProperties.forEach((property) => {
      if (property.partner_id !== partnerId || property.payment_settings) return;
      property.payment_settings = {
        method: "cash_at_hotel",
        cash_allowed: true,
        force_anima_online: false,
        payout_provider: "manual",
      };
      property.updatedAt = now();
      state.tables.partnerProperties = upsertInTable(state.tables.partnerProperties, property);
      changed = true;
    });
    if (!state.tables.partnerUnits.some((unit) => unit.id === unitId)) {
      state.tables.partnerUnits.unshift(normalizePartnerUnit(stayEntry, propertyId));
      changed = true;
    }
    for (let index = 0; index < 45; index += 1) {
      const date = new Date();
      date.setDate(date.getDate() + index);
      const dateKey = date.toISOString().slice(0, 10);
      const id = `availability_${propertyId}_${unitId}_${dateKey}`;
      if (!state.tables.availability.some((item) => item.id === id)) {
        state.tables.availability.push({
          id,
          property_id: propertyId,
          unit_id: unitId,
          date: dateKey,
          time_slot: "",
          status: "available",
          price: state.tables.partnerUnits.find((unit) => unit.id === unitId)?.base_price || 0,
          reason: "",
          createdAt: now(),
          updatedAt: now(),
        });
        changed = true;
      }
    }
    state.tables.orders
      .filter((order) => order.type === "stay-booking" && String(order.stayTitle || "").trim() === String(businessName).trim())
      .forEach((order) => {
        if (state.tables.partnerBookings.some((booking) => booking.sourceOrderId === order.id)) return;
        const finance = commissionOf(order.totalVnd, COMMISSION_PERCENT);
        const bookingStatus = bookingStatusFromOrder(order.status);
        const paymentStatus = paymentStatusFromOrder(order.status);
        const booking = {
          id: `booking_${order.id}`,
          sourceOrderId: order.id,
          client_id: order.userId || "",
          partner_id: partnerId,
          property_id: propertyId,
          unit_id: unitId,
          room_type_id: unitId,
          units_count: 1,
          start_date: order.checkin || "",
          end_date: order.checkout || "",
          time_slot: "",
          guests_count: Number(order.guests || 1),
          customer_name: order.fullName || order.guestName || order.client || "Клиент ANIMA",
          customer_phone: order.phone || "",
          customer_email: order.email || "",
          wishes: {
            comment: order.note || "",
            early_checkin: false,
            late_checkout: false,
            transfer: false,
            room_decoration: false,
            window_view: false,
            floor: "",
            pets: false,
            children: false,
          },
          partner_response: { status: "", comment: "" },
          total_amount: finance.totalAmount,
          commission_percent: finance.commissionPercent,
          commission_amount: finance.commissionAmount,
          partner_amount: finance.partnerAmount,
          payment_status: paymentStatus,
          payout_status: ["completed", "funds_available"].includes(bookingStatus) ? "pending_payout" : "not_due",
          booking_status: bookingStatus,
          lifecycle_status: statusStep(bookingStatus),
          rejection_reason: "",
          created_at: order.createdAt || now(),
          updated_at: order.updatedAt || order.createdAt || now(),
          createdAt: order.createdAt || now(),
          updatedAt: order.updatedAt || order.createdAt || now(),
        };
        state.tables.partnerBookings.unshift(booking);
        if (!state.tables.chats.some((chat) => chat.booking_id === booking.id && chat.type === "client_hotel")) {
          state.tables.chats.unshift({
            id: `chat_client_${booking.id}`,
            booking_id: booking.id,
            partner_id: partnerId,
            client_id: booking.client_id,
            type: "client_hotel",
            title: `Клиент ↔ отель: ${booking.customer_name}`,
            visible_to_anima: true,
            createdAt: now(),
            updatedAt: now(),
          });
          state.tables.chats.unshift({
            id: `chat_admin_${booking.id}`,
            booking_id: booking.id,
            partner_id: partnerId,
            client_id: "",
            type: "partner_admin",
            title: `Партнёр ↔ ANIMA: ${booking.customer_name}`,
            visible_to_anima: true,
            createdAt: now(),
            updatedAt: now(),
          });
        }
        if (paymentStatus !== "unpaid" && !state.tables.payments.some((payment) => payment.booking_id === booking.id)) {
          state.tables.payments.unshift({
            id: uid("payment"),
            booking_id: booking.id,
            partner_id: partnerId,
            client_id: booking.client_id,
            amount: finance.totalAmount,
            commission_amount: finance.commissionAmount,
            partner_amount: finance.partnerAmount,
            method: "manual",
            status: paymentStatus,
            provider: "ANIMA manual",
            paid_at: paymentStatus === "paid" ? order.updatedAt || order.createdAt || now() : "",
            createdAt: now(),
            updatedAt: now(),
          });
        }
        state.tables.bookingStatusHistory.unshift({
          id: uid("booking_history"),
          booking_id: booking.id,
          old_status: "",
          new_status: bookingStatus,
          changed_by: "system",
          comment: "Импортировано из существующей заявки ANIMA",
          created_at: now(),
          createdAt: now(),
        });
        if (bookingStatus === "confirmed") {
          state.tables.financeTransactions.unshift({
            id: uid("finance"),
            booking_id: booking.id,
            partner_id: partnerId,
            type: "booking_commission",
            amount: finance.commissionAmount,
            status: "recorded",
            description: "Комиссия ANIMA 5%",
            created_at: now(),
            createdAt: now(),
          });
          dateDays(booking.start_date, booking.end_date).forEach((date) => {
            markAvailabilityDay(state, { propertyId, unitId, date, status: "occupied", reason: `Бронь ${booking.id}` });
          });
        }
        changed = true;
      });
    state.tables.partnerBookings
      .filter((booking) => booking.partner_id === partnerId)
      .forEach((booking) => {
        if (!state.tables.chats.some((chat) => chat.booking_id === booking.id && chat.type === "client_hotel")) {
          state.tables.chats.unshift({
            id: `chat_client_${booking.id}`,
            booking_id: booking.id,
            partner_id: partnerId,
            client_id: booking.client_id,
            type: "client_hotel",
            title: `Клиент ↔ отель: ${booking.customer_name}`,
            visible_to_anima: true,
            createdAt: now(),
            updatedAt: now(),
          });
          state.tables.chats.unshift({
            id: `chat_admin_${booking.id}`,
            booking_id: booking.id,
            partner_id: partnerId,
            client_id: "",
            type: "partner_admin",
            title: `Партнёр ↔ ANIMA: ${booking.customer_name}`,
            visible_to_anima: true,
            createdAt: now(),
            updatedAt: now(),
          });
          changed = true;
        }
        if (booking.payment_status !== "unpaid" && !state.tables.payments.some((payment) => payment.booking_id === booking.id)) {
          state.tables.payments.unshift({
            id: uid("payment"),
            booking_id: booking.id,
            partner_id: partnerId,
            client_id: booking.client_id,
            amount: booking.total_amount,
            commission_amount: booking.commission_amount,
            partner_amount: booking.partner_amount,
            method: "manual",
            status: booking.payment_status,
            provider: "ANIMA manual",
            paid_at: booking.payment_status === "paid" ? booking.updatedAt || now() : "",
            createdAt: now(),
            updatedAt: now(),
          });
          changed = true;
        }
      });
    return changed;
  }

  function ensure(seedData = {}) {
    const existing = read();
    if (existing?.version === 1) {
      ensureArrayTables(existing);
      const partnerChanged = ensurePartnerSeed(existing);
      const architectureChanged = syncHousingArchitecture(existing);
      if (partnerChanged || architectureChanged) {
        existing.updatedAt = now();
        return write(existing);
      }
      return existing;
    }
    const seeded = seedState(seedData);
    ensurePartnerSeed(seeded);
    syncHousingArchitecture(seeded);
    return write(seeded);
  }

  function trackVisit(seedData = {}) {
    const state = ensure(seedData);
    let sessionSeen = false;
    try {
      sessionSeen = sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {}
    if (!sessionSeen) {
      state.analytics.visits += 1;
      state.analytics.appOpens += 1;
      state.analytics.lastVisitAt = now();
      state.updatedAt = now();
      write(state);
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {}
    }
    return state.analytics;
  }

  function getState(seedData = {}) {
    return ensure(seedData);
  }

  function sortEntriesByPriority(items = []) {
    return [...items].sort((a, b) => {
      const aPromoted = a.fields?.promotedAt ? new Date(a.fields.promotedAt).getTime() : 0;
      const bPromoted = b.fields?.promotedAt ? new Date(b.fields.promotedAt).getTime() : 0;
      if (bPromoted !== aPromoted) return bPromoted - aPromoted;
      return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
    });
  }

  function listEntries(seedData = {}) {
    return clone(sortEntriesByPriority(getState(seedData).tables.contentEntries));
  }

  function saveEntry(entry, seedData = {}) {
    const state = ensure(seedData);
    const nextEntry = {
      ...entry,
      fields: attachPriceMaps(entry.fields || {}, state.settings.currencyRates),
      entityType: classifyEntry(entry),
    };
    state.tables.contentEntries = upsertInTable(state.tables.contentEntries, nextEntry);
    if (nextEntry.entityType === "listing" || nextEntry.entityType === "news") {
      state.tables.listings = upsertInTable(state.tables.listings, projectListing(nextEntry));
    }
    if (nextEntry.entityType === "product") {
      state.tables.products = upsertInTable(state.tables.products, projectProduct(nextEntry));
    }
    if (nextEntry.entityType === "category") {
      state.tables.categories = upsertInTable(state.tables.categories, projectCategory(nextEntry));
    }
    state.updatedAt = now();
    write(state);
    return nextEntry;
  }

  function deleteEntry(id, seedData = {}) {
    const state = ensure(seedData);
    state.tables.contentEntries = state.tables.contentEntries.filter((item) => item.id !== id);
    state.tables.listings = state.tables.listings.filter((item) => item.id !== id);
    state.tables.products = state.tables.products.filter((item) => item.id !== id);
    state.tables.categories = state.tables.categories.filter((item) => item.id !== id);
    state.updatedAt = now();
    write(state);
  }

  function addOrder(order, seedData = {}) {
    const state = ensure(seedData);
    const nextOrder = {
      id: uid("order"),
      status: "new",
      createdAt: now(),
      ...order,
    };
    state.tables.orders.unshift(nextOrder);
    state.analytics.orders = state.tables.orders.length;
    state.updatedAt = now();
    write(state);
    return nextOrder;
  }

  function updateOrder(orderId, patch = {}, seedData = {}) {
    const state = ensure(seedData);
    const order = state.tables.orders.find((item) => item.id === orderId);
    if (!order) throw new Error("ORDER_NOT_FOUND");
    const nextOrder = {
      ...order,
      ...patch,
      updatedAt: now(),
    };
    state.tables.orders = upsertInTable(state.tables.orders, nextOrder);
    state.updatedAt = now();
    write(state);
    return clone(nextOrder);
  }

  function addNotification(notification, seedData = {}) {
    const state = ensure(seedData);
    const nextNotification = {
      id: uid("notification"),
      status: "unread",
      createdAt: now(),
      ...notification,
    };
    state.tables.notifications.unshift(nextNotification);
    state.updatedAt = now();
    write(state);
    return clone(nextNotification);
  }

  function listNotifications(userId, seedData = {}) {
    const state = ensure(seedData);
    return clone(state.tables.notifications.filter((item) => item.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  }

  function markNotificationRead(notificationId, seedData = {}) {
    const state = ensure(seedData);
    const item = state.tables.notifications.find((entry) => entry.id === notificationId);
    if (!item) return null;
    const nextItem = {
      ...item,
      status: "read",
      readAt: now(),
      updatedAt: now(),
    };
    state.tables.notifications = upsertInTable(state.tables.notifications, nextItem);
    state.updatedAt = now();
    write(state);
    return clone(nextItem);
  }

  function markAllNotificationsRead(userId, seedData = {}) {
    const state = ensure(seedData);
    state.tables.notifications = state.tables.notifications.map((item) => {
      if (item.userId !== userId || item.status === "read") return item;
      return { ...item, status: "read", readAt: now(), updatedAt: now() };
    });
    state.updatedAt = now();
    write(state);
    return listNotifications(userId, seedData);
  }

  function incrementEntryViews(entryId, seedData = {}) {
    const state = ensure(seedData);
    const entry = state.tables.contentEntries.find((item) => item.id === entryId);
    if (!entry) return null;
    const nextEntry = {
      ...entry,
      fields: {
        ...(entry.fields || {}),
        views: Number(entry.fields?.views || 0) + 1,
      },
      updatedAt: now(),
    };
    state.tables.contentEntries = upsertInTable(state.tables.contentEntries, nextEntry);
    state.updatedAt = now();
    write(state);
    return clone(nextEntry);
  }

  function addPromotionRequest(request, seedData = {}) {
    const state = ensure(seedData);
    const nextRequest = {
      id: uid("promo"),
      status: "new",
      createdAt: now(),
      ...request,
    };
    state.tables.promotionRequests.unshift(nextRequest);
    state.updatedAt = now();
    write(state);
    return clone(nextRequest);
  }

  function updatePromotionRequest(requestId, patch = {}, seedData = {}) {
    const state = ensure(seedData);
    const request = state.tables.promotionRequests.find((item) => item.id === requestId);
    if (!request) throw new Error("PROMOTION_REQUEST_NOT_FOUND");
    const nextRequest = {
      ...request,
      ...patch,
      updatedAt: now(),
    };
    state.tables.promotionRequests = upsertInTable(state.tables.promotionRequests, nextRequest);
    state.updatedAt = now();
    write(state);
    return clone(nextRequest);
  }

  function listPromotionRequests(seedData = {}) {
    const state = ensure(seedData);
    return clone((state.tables.promotionRequests || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  }

  function getDashboardStats(seedData = {}) {
    const state = ensure(seedData);
    const publishedEntries = state.tables.contentEntries.filter((item) => item.status === "published").length;
    return {
      totalEntries: state.tables.contentEntries.length,
      publishedEntries,
      draftEntries: state.tables.contentEntries.length - publishedEntries,
      listings: state.tables.listings.length,
      products: state.tables.products.length,
      categories: state.tables.categories.length,
      users: state.tables.users.length,
      orders: state.tables.orders.length,
      visits: state.analytics.visits,
      registrations: state.analytics.registrations,
      activeClients: state.analytics.activeClients,
      lastVisitAt: state.analytics.lastVisitAt,
    };
  }

  function formatStoredPrice(priceMap, currency, fallback = "") {
    if (!priceMap || !currency || typeof priceMap[currency] !== "number") return fallback;
    const value = priceMap[currency];
    if (currency === "USD") return `$${Math.round(value).toLocaleString("en-US")}`;
    return `${Math.round(value).toLocaleString("en-US")} ${currency}`;
  }

  function beginRegistration(payload, seedData = {}) {
    const state = ensure(seedData);
    const existing = assertRegistrationAvailability(state, payload);
    const code = generateCode(6);
    const user = {
      id: existing?.id || uid("user"),
      role: "client",
      status: "pending",
      name: payload.fullName,
      fullName: payload.fullName,
      birthDate: payload.birthDate,
      email: payload.email,
      username: payload.username || "",
      telegram: payload.telegram || "",
      preferredCurrency: payload.preferredCurrency || "VND",
      city: payload.city || "Dalat",
      passwordHash: payload.passwordHash,
      security: {
        twoFactorEnabled: false,
        pinEnabled: false,
        pinHash: "",
        faceIdEnabled: false,
      },
      verification: {
        purpose: "register",
        code,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      },
      createdAt: existing?.createdAt || now(),
      updatedAt: now(),
    };
    state.tables.users = upsertInTable(state.tables.users, user);
    state.tables.verifications = upsertInTable(state.tables.verifications, {
      id: `verify_${user.id}`,
      userId: user.id,
      email: user.email,
      purpose: "register",
      code,
      expiresAt: user.verification.expiresAt,
      createdAt: now(),
      updatedAt: now(),
    });
    state.updatedAt = now();
    write(state);
    return { user: publicUser(user), code };
  }

  function completeRegistration(payload, seedData = {}) {
    const state = ensure(seedData);
    const normalizedEmail = normalizeLogin(payload.email);
    const user = state.tables.users.find((item) => normalizeLogin(item.email) === normalizedEmail);
    if (!user || user.status !== "pending" || user.verification?.purpose !== "register") throw new Error("USER_NOT_FOUND");
    if (new Date(user.verification.expiresAt).getTime() < Date.now()) throw new Error("CODE_EXPIRED");
    if (String(user.verification.code) !== String(payload.code).trim()) throw new Error("INVALID_CODE");
    user.status = "active";
    user.verifiedAt = now();
    user.updatedAt = now();
    delete user.verification;
    state.tables.users = upsertInTable(state.tables.users, user);
    state.tables.verifications = state.tables.verifications.filter((item) => item.userId !== user.id);
    state.analytics.registrations = state.tables.users.filter((item) => item.status === "active").length;
    state.analytics.activeClients = state.analytics.registrations;
    state.updatedAt = now();
    write(state);
    return publicUser(user);
  }

  function authenticate(payload, seedData = {}) {
    const state = ensure(seedData);
    const user = findUserByLogin(state, payload.login);
    if (!user) throw new Error("USER_NOT_FOUND");
    if (user.passwordHash !== payload.passwordHash) throw new Error("INVALID_PASSWORD");
    if (user.security?.twoFactorEnabled) {
      const code = generateCode(6);
      user.verification = {
        purpose: "login",
        code,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      };
      user.updatedAt = now();
      state.tables.users = upsertInTable(state.tables.users, user);
      state.tables.verifications = upsertInTable(state.tables.verifications, {
        id: `verify_${user.id}`,
        userId: user.id,
        email: user.email,
        purpose: "login",
        code,
        expiresAt: user.verification.expiresAt,
        createdAt: now(),
        updatedAt: now(),
      });
      write(state);
      return { requiresTwoFactor: true, code, user: publicUser(user) };
    }
    return { requiresTwoFactor: false, user: publicUser(user) };
  }

  function verifyLoginCode(payload, seedData = {}) {
    const state = ensure(seedData);
    const user = state.tables.users.find((item) => item.id === payload.userId);
    if (!user || user.status !== "active" || user.verification?.purpose !== "login") throw new Error("USER_NOT_FOUND");
    if (new Date(user.verification.expiresAt).getTime() < Date.now()) throw new Error("CODE_EXPIRED");
    if (String(user.verification.code) !== String(payload.code).trim()) throw new Error("INVALID_CODE");
    delete user.verification;
    user.updatedAt = now();
    state.tables.users = upsertInTable(state.tables.users, user);
    state.tables.verifications = state.tables.verifications.filter((item) => item.userId !== user.id);
    write(state);
    return publicUser(user);
  }

  function updateUser(userId, patch = {}, seedData = {}) {
    const state = ensure(seedData);
    const user = state.tables.users.find((item) => item.id === userId);
    if (!user) throw new Error("USER_NOT_FOUND");
    const nextUser = {
      ...user,
      ...patch,
      security: {
        ...(user.security || {}),
        ...(patch.security || {}),
      },
      updatedAt: now(),
    };
    state.tables.users = upsertInTable(state.tables.users, nextUser);
    state.updatedAt = now();
    write(state);
    return publicUser(nextUser);
  }

  function getUser(userId, seedData = {}) {
    const state = ensure(seedData);
    return publicUser(state.tables.users.find((item) => item.id === userId) || null);
  }

  function listUsers(seedData = {}) {
    const state = ensure(seedData);
    return state.tables.users.map(publicUser);
  }

  function publicPartner(partner) {
    if (!partner) return null;
    const nextPartner = clone(partner);
    delete nextPartner.temporaryPasswordHash;
    return nextPartner;
  }

  function partnerAccess(state, partnerId, userId = "") {
    const partner = state.tables.partners.find((item) => item.id === partnerId);
    if (!partner || partner.status === "blocked") throw new Error("PARTNER_FORBIDDEN");
    if (!userId) return partner;
    const staff = state.tables.partnerStaff.find((item) => item.partner_id === partnerId && item.user_id === userId);
    if (!staff) throw new Error("PARTNER_FORBIDDEN");
    return partner;
  }

  function authenticatePartner(payload, seedData = {}) {
    const state = ensure(seedData);
    const normalized = normalizeLogin(payload.login);
    const partner = state.tables.partners.find((item) => {
      if (item.status !== "active") return false;
      return [item.login, item.email, item.telegram, item.phone].filter(Boolean).map(normalizeLogin).includes(normalized);
    });
    if (!partner) throw new Error("PARTNER_NOT_FOUND");
    const user = state.tables.users.find((item) => item.id === partner.user_id);
    const expectedHash = user?.passwordHash || partner.temporaryPasswordHash;
    if (expectedHash !== payload.passwordHash) throw new Error("INVALID_PASSWORD");
    audit(state, {
      userId: user?.id || partner.user_id,
      partnerId: partner.id,
      entityType: "partner",
      entityId: partner.id,
      action: "partner_login",
      newValue: { login: partner.login || partner.email },
    });
    state.updatedAt = now();
    write(state);
    return {
      partner: publicPartner(partner),
      user: publicUser(user || { id: partner.user_id, role: "partner_owner", partnerId: partner.id }),
      mustChangePassword: Boolean(user?.mustChangePassword || partner.mustChangePassword),
    };
  }

  function changePartnerPassword(payload, seedData = {}) {
    const state = ensure(seedData);
    const partner = partnerAccess(state, payload.partnerId, payload.userId);
    const user = state.tables.users.find((item) => item.id === partner.user_id);
    if (!payload.passwordHash || !user) throw new Error("USER_NOT_FOUND");
    const previous = { mustChangePassword: user.mustChangePassword };
    user.passwordHash = payload.passwordHash;
    user.mustChangePassword = false;
    user.updatedAt = now();
    partner.mustChangePassword = false;
    partner.temporaryPasswordHash = "";
    partner.updatedAt = now();
    partner.updated_at = now();
    state.tables.users = upsertInTable(state.tables.users, user);
    state.tables.partners = upsertInTable(state.tables.partners, partner);
    audit(state, {
      userId: user.id,
      partnerId: partner.id,
      entityType: "partner",
      entityId: partner.id,
      action: "partner_password_changed",
      oldValue: previous,
      newValue: { mustChangePassword: false },
    });
    state.updatedAt = now();
    write(state);
    return { partner: publicPartner(partner), user: publicUser(user) };
  }

  function listPartners(seedData = {}) {
    const state = ensure(seedData);
    return clone(state.tables.partners.map((partner) => {
      const properties = state.tables.partnerProperties.filter((item) => item.partner_id === partner.id);
      const bookings = state.tables.partnerBookings.filter((item) => item.partner_id === partner.id);
      const turnover = bookings.reduce((sum, booking) => sum + Number(booking.total_amount || 0), 0);
      const commission = bookings.reduce((sum, booking) => sum + Number(booking.commission_amount || 0), 0);
      return {
        ...publicPartner(partner),
        propertiesCount: properties.length,
        bookingsCount: bookings.length,
        turnover,
        commission,
      };
    }));
  }

  function createPartner(payload, seedData = {}) {
    const state = ensure(seedData);
    const partnerId = uid("partner");
    const userId = uid("user_partner");
    const login = normalizeLogin(payload.login || payload.email || `${payload.business_name || "partner"}_${Date.now()}`);
    const passwordHash = payload.passwordHash || DEFAULT_PARTNER_PASSWORD_HASH;
    if (state.tables.partners.some((item) => normalizeLogin(item.login) === login)) throw new Error("PARTNER_LOGIN_EXISTS");
    const partner = {
      id: partnerId,
      user_id: userId,
      business_name: payload.business_name || "Новый партнёр",
      business_type: payload.business_type || "other",
      contact_name: payload.contact_name || "",
      phone: payload.phone || "",
      email: payload.email || "",
      telegram: payload.telegram || "",
      whatsapp: payload.whatsapp || "",
      status: payload.status || "pending",
      commission_percent: COMMISSION_PERCENT,
      login,
      temporaryPasswordHash: passwordHash,
      mustChangePassword: true,
      created_at: now(),
      updated_at: now(),
      createdAt: now(),
      updatedAt: now(),
    };
    const user = {
      id: userId,
      role: "partner_owner",
      status: partner.status === "blocked" ? "blocked" : "active",
      name: partner.contact_name || partner.business_name,
      fullName: partner.contact_name || partner.business_name,
      email: partner.email,
      username: partner.login,
      partnerId,
      passwordHash,
      mustChangePassword: true,
      security: { twoFactorEnabled: false, pinEnabled: false, pinHash: "", faceIdEnabled: false },
      createdAt: now(),
      updatedAt: now(),
    };
    state.tables.partners.unshift(partner);
    state.tables.users.unshift(user);
    state.tables.partnerStaff.unshift({
      id: uid("staff"),
      partner_id: partnerId,
      user_id: userId,
      role: "partner_owner",
      permissions: ["dashboard", "properties", "bookings", "calendar", "finance", "messages", "settings"],
      createdAt: now(),
      updatedAt: now(),
    });
    audit(state, {
      userId: payload.actorUserId || "admin",
      partnerId,
      entityType: "partner",
      entityId: partnerId,
      action: "partner_created",
      newValue: publicPartner(partner),
    });
    state.updatedAt = now();
    write(state);
    return publicPartner(partner);
  }

  function updatePartner(partnerId, patch = {}, seedData = {}) {
    const state = ensure(seedData);
    const partner = state.tables.partners.find((item) => item.id === partnerId);
    if (!partner) throw new Error("PARTNER_NOT_FOUND");
    const oldValue = publicPartner(partner);
    const allowedPatch = { ...patch };
    delete allowedPatch.id;
    delete allowedPatch.commission_percent;
    delete allowedPatch.temporaryPasswordHash;
    delete allowedPatch.actorUserId;
    const nextPartner = {
      ...partner,
      ...allowedPatch,
      commission_percent: partner.commission_percent,
      updated_at: now(),
      updatedAt: now(),
    };
    state.tables.partners = upsertInTable(state.tables.partners, nextPartner);
    const user = state.tables.users.find((item) => item.id === partner.user_id);
    if (user && patch.status) {
      user.status = patch.status === "blocked" ? "blocked" : "active";
      user.updatedAt = now();
      state.tables.users = upsertInTable(state.tables.users, user);
    }
    audit(state, {
      userId: patch.actorUserId || "admin",
      partnerId,
      entityType: "partner",
      entityId: partnerId,
      action: "partner_updated",
      oldValue,
      newValue: publicPartner(nextPartner),
    });
    state.updatedAt = now();
    write(state);
    return publicPartner(nextPartner);
  }

  function resetPartnerPassword(partnerId, passwordHash = DEFAULT_PARTNER_PASSWORD_HASH, seedData = {}) {
    const state = ensure(seedData);
    const partner = state.tables.partners.find((item) => item.id === partnerId);
    if (!partner) throw new Error("PARTNER_NOT_FOUND");
    const user = state.tables.users.find((item) => item.id === partner.user_id);
    if (!user) throw new Error("USER_NOT_FOUND");
    user.passwordHash = passwordHash;
    user.mustChangePassword = true;
    user.updatedAt = now();
    partner.temporaryPasswordHash = passwordHash;
    partner.mustChangePassword = true;
    partner.updatedAt = now();
    partner.updated_at = now();
    state.tables.users = upsertInTable(state.tables.users, user);
    state.tables.partners = upsertInTable(state.tables.partners, partner);
    audit(state, {
      userId: "admin",
      partnerId,
      entityType: "partner",
      entityId: partnerId,
      action: "partner_password_reset",
      newValue: { mustChangePassword: true },
    });
    state.updatedAt = now();
    write(state);
    return publicPartner(partner);
  }

  function getPartnerWorkspace(partnerId, seedData = {}) {
    const state = ensure(seedData);
    const partner = partnerAccess(state, partnerId);
    const properties = state.tables.partnerProperties.filter((item) => item.partner_id === partnerId);
    const propertyIds = new Set(properties.map((item) => item.id));
    const units = state.tables.partnerUnits.filter((item) => propertyIds.has(item.property_id));
    const unitIds = new Set(units.map((item) => item.id));
    const bookings = state.tables.partnerBookings.filter((item) => item.partner_id === partnerId);
    const availability = state.tables.availability.filter((item) => propertyIds.has(item.property_id) || unitIds.has(item.unit_id));
    const financeTransactions = state.tables.financeTransactions.filter((item) => item.partner_id === partnerId);
    const payments = state.tables.payments.filter((item) => item.partner_id === partnerId);
    const withdrawalRequests = state.tables.withdrawalRequests.filter((item) => item.partner_id === partnerId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const chats = state.tables.chats.filter((item) => item.partner_id === partnerId);
    const chatIds = new Set(chats.map((item) => item.id));
    const messages = state.tables.messages.filter((item) => chatIds.has(item.chat_id)).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const adminNotes = state.tables.adminNotes.filter((item) => item.partner_id === partnerId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const notifications = state.tables.partnerNotifications.filter((item) => item.partner_id === partnerId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const auditLogs = state.tables.auditLogs.filter((item) => item.partner_id === partnerId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const comments = state.tables.bookingComments.filter((item) => bookings.some((booking) => booking.id === item.booking_id));
    const supportTickets = state.tables.supportTickets.filter((item) => item.partner_id === partnerId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const reviews = state.tables.reviews.filter((item) => propertyIds.has(item.property_id) || item.partner_id === partnerId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const confirmed = bookings.filter((item) => item.booking_status === "confirmed");
    const totalRevenue = bookings.reduce((sum, booking) => sum + Number(booking.total_amount || 0), 0);
    const commissionAmount = bookings.reduce((sum, booking) => sum + Number(booking.commission_amount || 0), 0);
    const partnerAmount = bookings.reduce((sum, booking) => sum + Number(booking.partner_amount || 0), 0);
    const cashToCollect = bookings
      .filter((booking) => booking.payment_method === "cash_at_hotel")
      .reduce((sum, booking) => sum + Number(booking.pay_at_hotel_amount || booking.partner_amount || 0), 0);
    const availableBalance = bookings
      .filter((booking) => booking.payment_method === "anima_online" && ["funds_available", "payout_requested"].includes(booking.booking_status) && !["paid_to_partner", "held", "disputed"].includes(booking.payout_status))
      .reduce((sum, booking) => sum + Number(booking.partner_balance_amount || booking.partner_amount || 0), 0);
    const pendingCompletion = bookings
      .filter((booking) => booking.payment_method === "anima_online" && ["paid", "active", "checked_in", "completed"].includes(booking.booking_status))
      .reduce((sum, booking) => sum + Number(booking.partner_balance_amount || booking.partner_amount || 0), 0);
    const paidOut = withdrawalRequests
      .filter((request) => request.status === "paid")
      .reduce((sum, request) => sum + Number(request.amount || 0), 0);
    const requestStatuses = ["new_request", "waiting_payment", "commission_paid", "pending_partner_confirmation"];
    const newRequests = bookings.filter((item) => requestStatuses.includes(item.booking_status)).length;
    const today = new Date().toISOString().slice(0, 10);
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrow = tomorrowDate.toISOString().slice(0, 10);
    const warnings = [];
    if (newRequests) warnings.push("Есть неподтверждённые заявки");
    if (properties.some((item) => item.status === "draft")) warnings.push("Есть объекты в черновике");
    if (!availability.length) warnings.push("Не указан календарь доступности");
    if (units.some((unit) => !Number(unit.base_price))) warnings.push("Не заполнены цены");
    return clone({
      partner: publicPartner(partner),
      properties,
      units,
      bookings,
      availability,
      financeTransactions,
      payments,
      withdrawalRequests,
      chats,
      messages,
      adminNotes,
      notifications,
      auditLogs,
      comments,
      supportTickets,
      reviews,
      stats: {
        newRequests,
        confirmedBookings: confirmed.length,
        upcoming: bookings.filter((item) => item.start_date >= today && ["commission_paid", "pending_partner_confirmation", "confirmed", "paid"].includes(item.booking_status)).length,
        todayTomorrow: bookings.filter((item) => [today, tomorrow].includes(item.start_date)),
        totalRevenue,
        commissionAmount,
        partnerAmount,
        cashToCollect,
        availableBalance,
        pendingCompletion,
        paidOut,
        paidToPartner: paidOut,
        held: bookings.filter((item) => item.payout_status === "held").reduce((sum, item) => sum + Number(item.partner_amount || 0), 0),
        disputed: bookings.filter((item) => item.payout_status === "disputed").reduce((sum, item) => sum + Number(item.partner_amount || 0), 0),
        requestedPayout: withdrawalRequests.filter((request) => ["requested", "pending_review", "approved", "processing"].includes(request.status)).reduce((sum, request) => sum + Number(request.amount || 0), 0),
        rating: reviews.length ? reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviews.length : null,
        reviewsCount: reviews.length,
        warnings,
      },
    });
  }

  function listPartnerBookings(partnerId, seedData = {}) {
    return getPartnerWorkspace(partnerId, seedData).bookings;
  }

  function publicPropertyBundle(propertyId, seedData = {}) {
    const state = ensure(seedData);
    const property = state.tables.partnerProperties.find((item) => item.id === propertyId || item.sourceEntryId === propertyId);
    if (!property || moderationStatus(property.moderation_status) !== "approved" || !["active", "approved"].includes(property.status)) return null;
    const roomStatuses = ["active", "approved"];
    let rooms = state.tables.partnerUnits
      .filter((room) => room.property_id === property.id && roomStatuses.includes(room.status) && moderationStatus(room.moderation_status) === "approved")
      .map((room) => ({
        ...clone(room),
        photos: state.tables.roomTypePhotos
          .filter((photo) => photo.room_type_id === room.id && moderationStatus(photo.moderation_status) === "approved")
          .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
          .map((photo) => photo.url)
          .concat(room.photos || [])
          .filter(Boolean)
          .filter((url, index, list) => list.indexOf(url) === index),
      }));
    if (!rooms.length) {
      rooms = state.tables.partnerUnits
        .filter((room) => room.property_id === property.id)
        .map((room) => ({
          ...clone(room),
          photos: state.tables.roomTypePhotos
            .filter((photo) => photo.room_type_id === room.id)
            .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
            .map((photo) => photo.url)
            .concat(room.photos || [])
            .filter(Boolean)
            .filter((url, index, list) => list.indexOf(url) === index),
        }));
    }
    if (rooms.length) {
      const allRooms = state.tables.partnerUnits
        .filter((room) => room.property_id === property.id)
        .map((room) => ({
          ...clone(room),
          photos: state.tables.roomTypePhotos
            .filter((photo) => photo.room_type_id === room.id)
            .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
            .map((photo) => photo.url)
            .concat(room.photos || [])
            .filter(Boolean)
            .filter((url, index, list) => list.indexOf(url) === index),
        }));
      if (allRooms.length > rooms.length) {
        const existing = new Set(rooms.map((room) => room.id));
        rooms = rooms.concat(allRooms.filter((room) => !existing.has(room.id)));
      }
    }
    return clone({
      property: {
        ...property,
        photos: state.tables.propertyPhotos
          .filter((photo) => photo.property_id === property.id && moderationStatus(photo.moderation_status) === "approved")
          .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
          .map((photo) => photo.url)
          .concat(property.photos || [])
          .filter(Boolean)
          .filter((url, index, list) => list.indexOf(url) === index),
      },
      rooms,
      propertyType: state.tables.propertyTypes.find((item) => item.id === property.property_type_id) || null,
    });
  }

  function createPartnerProperty(partnerId, payload = {}, seedData = {}) {
    const state = ensure(seedData);
    partnerAccess(state, partnerId, payload.userId || "");
    if (!String(payload.title || "").trim()) throw new Error("PROPERTY_TITLE_REQUIRED");
    const kind = propertyKindFromValue(payload.type || payload.property_type_id || "hotel");
    const property = {
      id: uid("property"),
      partner_id: partnerId,
      sourceEntryId: "",
      type: kind,
      property_type_id: kind,
      content_category: resolveCategoryMeta(payload.category || kind).id,
      booking_model: kind === "hotel" ? "room_type" : "whole_property",
      title: String(payload.title || "").trim(),
      description: payload.description || "",
      address: payload.address || "",
      location: payload.location || payload.address || "Dalat",
      photos: Array.isArray(payload.photos) ? payload.photos : String(payload.photos || "").split("\n").map((item) => item.trim()).filter(Boolean),
      property_photos: Array.isArray(payload.photos) ? payload.photos : String(payload.photos || "").split("\n").map((item) => item.trim()).filter(Boolean),
      amenities: Array.isArray(payload.amenities) ? payload.amenities : String(payload.amenities || "").split(",").map((item) => item.trim()).filter(Boolean),
      rules: Array.isArray(payload.rules) ? payload.rules : String(payload.rules || "").split(",").map((item) => item.trim()).filter(Boolean),
      contacts: { phone: payload.phone || "", email: payload.email || "", telegram: payload.telegram || "", whatsapp: payload.whatsapp || "" },
      payment_settings: { method: payload.payment_method || "cash_at_hotel", cash_allowed: true, force_anima_online: false, payout_provider: "manual" },
      checkin: payload.checkin || "14:00",
      checkout: payload.checkout || "12:00",
      status: "draft",
      moderation_status: "pending_review",
      criticalChanges: {},
      createdAt: now(),
      updatedAt: now(),
    };
    state.tables.partnerProperties.unshift(property);
    createModerationRequest(state, {
      partnerId,
      userId: payload.userId || "",
      entityType: "property",
      entityId: property.id,
      changeType: "create",
      title: `Новый объект: ${property.title}`,
      oldValue: null,
      newValue: property,
    });
    audit(state, { userId: payload.userId || "", partnerId, entityType: "property", entityId: property.id, action: "property_submitted_for_moderation", newValue: property });
    state.updatedAt = now();
    write(state);
    return clone(property);
  }

  function createBookingRequest(payload = {}, seedData = {}) {
    const state = ensure(seedData);
    const property = state.tables.partnerProperties.find((item) => item.sourceEntryId === payload.entryId || item.id === payload.propertyId);
    if (!property) throw new Error("PROPERTY_NOT_FOUND");
    if (moderationStatus(property.moderation_status) !== "approved") throw new Error("PROPERTY_NOT_APPROVED");
    let units = state.tables.partnerUnits.filter((item) => item.property_id === property.id && item.status === "active" && moderationStatus(item.moderation_status) === "approved");
    if (!units.length) {
      units = state.tables.partnerUnits.filter((item) => item.property_id === property.id);
    }
    const unit = units.find((item) => item.id === payload.unitId) || units[0];
    if (property.booking_model === "room_type" && !payload.unitId && units.length > 1) throw new Error("ROOM_TYPE_REQUIRED");
    if (!unit) throw new Error("ROOM_NOT_FOUND");
    const unitsCount = Math.max(1, Number(payload.unitsCount || 1));
    const days = dateDays(payload.checkin, payload.checkout);
    if (!days.length) throw new Error("INVALID_DATES");
    const unavailable = days.some((date) => availableUnitsForDay(state, unit.id, date) < unitsCount);
    if (unavailable) throw new Error("DATE_ALREADY_BOOKED");
    const breakdown = financialBreakdown(state, {
      property_id: property.id,
      partner_id: property.partner_id,
      unit_id: unit.id,
      start_date: payload.checkin,
      total_amount: payload.totalVnd,
    });
    const order = {
      id: uid("order"),
      status: "waiting_payment",
      createdAt: now(),
      title: `Stay booking: ${property.title}`,
      type: "stay-booking",
      stayTitle: property.title,
      slug: payload.slug || "",
      userId: payload.userId || "",
      guestName: payload.fullName || "",
      fullName: payload.fullName || "",
      birthDate: payload.birthDate || "",
      phone: payload.phone || "",
      email: payload.email || "",
      passportNumber: payload.passportNumber || "",
      citizenship: payload.citizenship || "",
      guestsDetails: Array.isArray(payload.guestsDetails) ? payload.guestsDetails : [],
      checkin: payload.checkin,
      checkout: payload.checkout,
      guests: payload.guests,
      note: payload.note || "",
      totalVnd: breakdown.total_amount,
      totalLabel: payload.totalLabel || `${breakdown.total_amount.toLocaleString("ru-RU")} VND`,
      paymentMethod: breakdown.payment_method,
    };
    state.tables.orders.unshift(order);
    const booking = {
      id: uid("booking"),
      sourceOrderId: order.id,
      client_id: payload.userId || "",
      partner_id: property.partner_id,
      property_id: property.id,
      unit_id: unit.id,
      room_type_id: unit.id,
      units_count: unitsCount,
      start_date: payload.checkin,
      end_date: payload.checkout,
      guests_count: Number(payload.guests || 1),
      customer_name: payload.fullName || "Клиент ANIMA",
      customer_phone: payload.phone || "",
      customer_email: payload.email || "",
      citizenship: payload.citizenship || "",
      guests_details: Array.isArray(payload.guestsDetails) ? payload.guestsDetails : [],
      wishes: { comment: payload.note || "", guests_details: Array.isArray(payload.guestsDetails) ? payload.guestsDetails : [] },
      partner_response: { status: "", comment: "" },
      total_amount: breakdown.total_amount,
      commission_percent: breakdown.commission_percent,
      commission_type: breakdown.commission_type,
      commission_fixed_amount: breakdown.commission_fixed_amount,
      commission_amount: breakdown.commission_amount,
      partner_amount: breakdown.partner_amount,
      pay_now_amount: breakdown.pay_now_amount,
      pay_at_hotel_amount: breakdown.pay_at_hotel_amount,
      partner_balance_amount: breakdown.partner_balance_amount,
      payment_method: breakdown.payment_method,
      payment_status: "waiting_payment",
      payout_status: "not_due",
      booking_status: "waiting_payment",
      lifecycle_status: statusStep("waiting_payment"),
      rejection_reason: "",
      created_at: now(),
      updated_at: now(),
      createdAt: now(),
      updatedAt: now(),
    };
    state.tables.partnerBookings.unshift(booking);
    state.tables.bookingStatusHistory.unshift({
      id: uid("booking_history"),
      booking_id: booking.id,
      old_status: "",
      new_status: "waiting_payment",
      changed_by: "system",
      comment: "Создана заявка на бронирование",
      created_at: now(),
      createdAt: now(),
    });
    days.forEach((date) => markAvailabilityDay(state, {
      propertyId: property.id,
      unitId: unit.id,
      date,
      status: "pending",
      reason: `Ожидает оплаты: ${booking.id}`,
    }));
    ["client_hotel", "partner_admin"].forEach((type) => {
      state.tables.chats.unshift({
        id: `chat_${type}_${booking.id}`,
        booking_id: booking.id,
        partner_id: property.partner_id,
        client_id: booking.client_id,
        type,
        title: type === "client_hotel" ? `Клиент ↔ отель: ${booking.customer_name}` : `Партнёр ↔ ANIMA: ${booking.customer_name}`,
        visible_to_anima: true,
        createdAt: now(),
        updatedAt: now(),
      });
    });
    addNotificationToState(state, {
      userId: booking.client_id,
      orderId: order.id,
      bookingId: booking.id,
      type: "booking",
      title: "Заявка создана",
      message: breakdown.client_copy,
      actionType: "pay-booking",
      actionUrl: `/booking/${booking.id}`,
    });
    pushPartnerNotification(state, {
      partnerId: property.partner_id,
      type: "booking",
      title: "Новая заявка на бронирование",
      message: `${booking.customer_name}: ${booking.start_date} - ${booking.end_date}`,
    });
    addAdminSystemNotification(state, "Новая заявка", `${property.title}: ${booking.customer_name}`);
    audit(state, { userId: booking.client_id, partnerId: property.partner_id, entityType: "booking", entityId: booking.id, action: "booking_request_created", newValue: booking });
    state.analytics.orders = state.tables.orders.length;
    state.updatedAt = now();
    write(state);
    return clone({ order, booking, breakdown });
  }

  function createRoomType(partnerId, payload = {}, seedData = {}) {
    const state = ensure(seedData);
    partnerAccess(state, partnerId, payload.userId || "");
    const property = state.tables.partnerProperties.find((item) => item.id === payload.propertyId && item.partner_id === partnerId);
    if (!property) throw new Error("PROPERTY_NOT_FOUND");
    if (!String(payload.name || "").trim()) throw new Error("ROOM_NAME_REQUIRED");
    if (Number(payload.base_price || 0) < 0 || Number(payload.weekend_price || 0) < 0) throw new Error("PRICE_NEGATIVE");
    const room = {
      id: uid("room_type"),
      property_id: payload.propertyId,
      type: payload.type || "standard",
      name: payload.name,
      capacity: Number(payload.capacity || 2),
      beds_count: Number(payload.beds_count || 1),
      base_price: Number(payload.base_price || 0),
      weekend_price: Number(payload.weekend_price || payload.base_price || 0),
      seasonal_price: Number(payload.seasonal_price || 0),
      quantity: Math.max(1, Number(payload.quantity || 1)),
      photos: Array.isArray(payload.photos) ? payload.photos : String(payload.photos || "").split("\n").map((item) => item.trim()).filter(Boolean),
      description: payload.description || "",
      amenities: Array.isArray(payload.amenities) ? payload.amenities : String(payload.amenities || "").split(",").map((item) => item.trim()).filter(Boolean),
      rules: Array.isArray(payload.rules) ? payload.rules : String(payload.rules || "").split(",").map((item) => item.trim()).filter(Boolean),
      min_nights: Math.max(1, Number(payload.min_nights || 1)),
      size: payload.size || "",
      baths_count: Math.max(1, Number(payload.baths_count || 1)),
      status: "draft",
      moderation_status: "pending_review",
      commission_override: payload.commission_override ? Number(payload.commission_override) : null,
      createdAt: now(),
      updatedAt: now(),
    };
    state.tables.partnerUnits.unshift(room);
    state.tables.roomTypes.unshift(clone(room));
    (room.photos || []).forEach((url, index) => state.tables.roomTypePhotos.unshift({
      id: `room_type_photo_${room.id}_${index}`,
      room_type_id: room.id,
      property_id: room.property_id,
      url,
      caption: index === 0 ? "Главное фото номера" : "",
      moderation_status: "pending_review",
      sort_order: index,
      createdAt: now(),
      updatedAt: now(),
    }));
    for (let index = 0; index < 60; index += 1) {
      const date = new Date();
      date.setDate(date.getDate() + index);
      markAvailabilityDay(state, {
        propertyId: payload.propertyId,
        unitId: room.id,
        date: date.toISOString().slice(0, 10),
        status: "available",
        price: room.base_price,
      });
    }
    createModerationRequest(state, {
      partnerId,
      userId: payload.userId || "",
      entityType: "room_type",
      entityId: room.id,
      changeType: "create",
      title: `Новый тип номера: ${room.name}`,
      oldValue: null,
      newValue: room,
    });
    audit(state, { userId: payload.userId || "", partnerId, entityType: "room_type", entityId: room.id, action: "room_submitted_for_moderation", newValue: room });
    state.updatedAt = now();
    write(state);
    return clone(room);
  }

  function updateRoomType(partnerId, roomId, patch = {}, seedData = {}) {
    const state = ensure(seedData);
    partnerAccess(state, partnerId, patch.userId || "");
    const propertyIds = state.tables.partnerProperties.filter((item) => item.partner_id === partnerId).map((item) => item.id);
    const room = state.tables.partnerUnits.find((item) => item.id === roomId && propertyIds.includes(item.property_id));
    if (!room) throw new Error("ROOM_NOT_FOUND");
    if (patch.name !== undefined && !String(patch.name || "").trim()) throw new Error("ROOM_NAME_REQUIRED");
    if (Number(patch.base_price ?? room.base_price) < 0) throw new Error("PRICE_NEGATIVE");
    const oldValue = clone(room);
    const nextRoom = {
      ...room,
      ...patch,
      id: room.id,
      property_id: room.property_id,
      quantity: Math.max(1, Number(patch.quantity ?? room.quantity ?? 1)),
      capacity: Math.max(1, Number(patch.capacity ?? room.capacity ?? 1)),
      beds_count: Math.max(1, Number(patch.beds_count ?? room.beds_count ?? 1)),
      base_price: Number(patch.base_price ?? room.base_price ?? 0),
      weekend_price: Number(patch.weekend_price ?? room.weekend_price ?? patch.base_price ?? room.base_price ?? 0),
      seasonal_price: Number(patch.seasonal_price ?? room.seasonal_price ?? 0),
      min_nights: Math.max(1, Number(patch.min_nights ?? room.min_nights ?? 1)),
      size: patch.size ?? room.size ?? "",
      baths_count: Math.max(1, Number(patch.baths_count ?? room.baths_count ?? 1)),
      status: "draft",
      moderation_status: "pending_review",
      updatedAt: now(),
    };
    state.tables.partnerUnits = upsertInTable(state.tables.partnerUnits, nextRoom);
    state.tables.roomTypes = upsertInTable(state.tables.roomTypes, clone(nextRoom));
    createModerationRequest(state, {
      partnerId,
      userId: patch.userId || "",
      entityType: "room_type",
      entityId: roomId,
      changeType: "update",
      title: `Изменение типа номера: ${nextRoom.name}`,
      oldValue,
      newValue: nextRoom,
    });
    audit(state, { userId: patch.userId || "", partnerId, entityType: "room_type", entityId: roomId, action: "room_update_submitted_for_moderation", oldValue, newValue: nextRoom });
    state.updatedAt = now();
    write(state);
    return clone(nextRoom);
  }

  function updatePartnerProperty(partnerId, propertyId, patch = {}, seedData = {}) {
    const state = ensure(seedData);
    partnerAccess(state, partnerId, patch.userId || "");
    const property = state.tables.partnerProperties.find((item) => item.id === propertyId && item.partner_id === partnerId);
    if (!property) throw new Error("PROPERTY_NOT_FOUND");
    if (!String(patch.title || property.title || "").trim()) throw new Error("PROPERTY_TITLE_REQUIRED");
    const criticalKeys = ["title", "type", "property_type_id", "address", "photos", "amenities", "rules", "price", "commission_percent", "bankDetails"];
    const criticalPatch = {};
    criticalKeys.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(patch, key) && JSON.stringify(patch[key]) !== JSON.stringify(property[key])) {
        criticalPatch[key] = patch[key];
      }
    });
    const oldValue = clone(property);
    const nextProperty = {
      ...property,
      ...patch,
      partner_id: partnerId,
      id: propertyId,
      type: propertyKindFromValue(patch.type || patch.property_type_id || property.type),
      property_type_id: propertyKindFromValue(patch.type || patch.property_type_id || property.property_type_id || property.type),
      content_category: resolveCategoryMeta(patch.category || patch.content_category || patch.type || patch.property_type_id || property.content_category || property.type).id,
      booking_model: propertyKindFromValue(patch.type || patch.property_type_id || property.type) === "hotel" ? "room_type" : "whole_property",
      photos: Array.isArray(patch.photos) ? patch.photos : property.photos,
      status: "draft",
      moderation_status: "pending_review",
      criticalChanges: Object.keys(criticalPatch).length ? criticalPatch : property.criticalChanges || [],
      updatedAt: now(),
    };
    state.tables.partnerProperties = upsertInTable(state.tables.partnerProperties, nextProperty);
    createModerationRequest(state, {
      partnerId,
      userId: patch.userId || "",
      entityType: "property",
      entityId: propertyId,
      changeType: "update",
      title: `Изменение объекта: ${nextProperty.title}`,
      oldValue,
      newValue: nextProperty,
    });
    audit(state, {
      userId: patch.userId || "",
      partnerId,
      entityType: "property",
      entityId: propertyId,
      action: "property_update_submitted_for_moderation",
      oldValue,
      newValue: nextProperty,
    });
    state.updatedAt = now();
    write(state);
    return clone(nextProperty);
  }

  function updatePropertyPaymentSettings(propertyId, settings = {}, seedData = {}) {
    const state = ensure(seedData);
    const property = state.tables.partnerProperties.find((item) => item.id === propertyId);
    if (!property) throw new Error("PROPERTY_NOT_FOUND");
    const oldValue = clone(property.payment_settings || {});
    const nextSettings = {
      method: settings.method || property.payment_settings?.method || "anima_online",
      cash_allowed: settings.cash_allowed !== undefined ? Boolean(settings.cash_allowed) : property.payment_settings?.cash_allowed !== false,
      force_anima_online: Boolean(settings.force_anima_online),
      payout_provider: settings.payout_provider || property.payment_settings?.payout_provider || "manual",
    };
    if (nextSettings.force_anima_online) nextSettings.method = "anima_online";
    if (!nextSettings.cash_allowed && nextSettings.method === "cash_at_hotel") nextSettings.method = "anima_online";
    const nextProperty = {
      ...property,
      payment_settings: nextSettings,
      updatedAt: now(),
    };
    state.tables.partnerProperties = upsertInTable(state.tables.partnerProperties, nextProperty);
    audit(state, {
      userId: settings.actorUserId || "admin",
      partnerId: property.partner_id,
      entityType: "property",
      entityId: propertyId,
      action: "property_payment_settings_updated",
      oldValue,
      newValue: nextSettings,
    });
    state.updatedAt = now();
    write(state);
    return clone(nextProperty);
  }

  function reviewModerationRequest(requestId, payload = {}, seedData = {}) {
    const state = ensure(seedData);
    const request = state.tables.moderationRequests.find((item) => item.id === requestId);
    if (!request) throw new Error("MODERATION_REQUEST_NOT_FOUND");
    const decision = payload.status === "approved" ? "approved" : "rejected";
    const nextRequest = {
      ...request,
      status: decision,
      admin_comment: payload.adminComment || payload.admin_comment || "",
      reviewed_by: payload.actorUserId || "admin",
      reviewed_at: now(),
      updatedAt: now(),
    };
    if (decision === "approved") {
      if (request.entity_type === "property") {
        const nextValue = { ...(request.new_value || {}), status: "active", moderation_status: "approved", public_version: request.new_value, updatedAt: now() };
        state.tables.partnerProperties = upsertInTable(state.tables.partnerProperties, nextValue);
        (nextValue.photos || []).forEach((url, index) => {
          state.tables.propertyPhotos = upsertInTable(state.tables.propertyPhotos, {
            id: `property_photo_${nextValue.id}_${index}`,
            property_id: nextValue.id,
            url,
            caption: index === 0 ? "Главное фото объекта" : "",
            moderation_status: "approved",
            sort_order: index,
            createdAt: now(),
            updatedAt: now(),
          });
        });
      }
      if (request.entity_type === "room_type") {
        const nextValue = { ...(request.new_value || {}), status: "active", moderation_status: "approved", public_version: request.new_value, updatedAt: now() };
        state.tables.partnerUnits = upsertInTable(state.tables.partnerUnits, nextValue);
        state.tables.roomTypes = upsertInTable(state.tables.roomTypes, clone(nextValue));
        (nextValue.photos || []).forEach((url, index) => {
          state.tables.roomTypePhotos = upsertInTable(state.tables.roomTypePhotos, {
            id: `room_type_photo_${nextValue.id}_${index}`,
            room_type_id: nextValue.id,
            property_id: nextValue.property_id,
            url,
            caption: index === 0 ? "Главное фото номера" : "",
            moderation_status: "approved",
            sort_order: index,
            createdAt: now(),
            updatedAt: now(),
          });
        });
      }
    } else {
      if (request.entity_type === "property") {
        const fallback = request.old_value ? { ...request.old_value, moderation_status: "approved", status: request.old_value.status || "active", updatedAt: now() } : { ...(request.new_value || {}), moderation_status: "rejected", status: "draft", updatedAt: now() };
        state.tables.partnerProperties = upsertInTable(state.tables.partnerProperties, fallback);
      }
      if (request.entity_type === "room_type") {
        const fallback = request.old_value ? { ...request.old_value, moderation_status: "approved", status: request.old_value.status || "active", updatedAt: now() } : { ...(request.new_value || {}), moderation_status: "rejected", status: "draft", updatedAt: now() };
        state.tables.partnerUnits = upsertInTable(state.tables.partnerUnits, fallback);
        state.tables.roomTypes = upsertInTable(state.tables.roomTypes, clone(fallback));
      }
    }
    state.tables.moderationRequests = upsertInTable(state.tables.moderationRequests, nextRequest);
    pushPartnerNotification(state, {
      partnerId: request.partner_id,
      type: "moderation",
      title: decision === "approved" ? "Изменения одобрены" : "Изменения отклонены",
      message: `${request.title}${nextRequest.admin_comment ? ` · ${nextRequest.admin_comment}` : ""}`,
    });
    audit(state, { userId: payload.actorUserId || "admin", partnerId: request.partner_id, entityType: "moderation_request", entityId: requestId, action: `moderation_${decision}`, oldValue: request, newValue: nextRequest });
    syncHousingArchitecture(state);
    state.updatedAt = now();
    write(state);
    return clone(nextRequest);
  }

  function updateAvailability(partnerId, payload = {}, seedData = {}) {
    const state = ensure(seedData);
    partnerAccess(state, partnerId, payload.userId || "");
    const property = state.tables.partnerProperties.find((item) => item.id === payload.propertyId && item.partner_id === partnerId);
    if (!property) throw new Error("PROPERTY_NOT_FOUND");
    if (Number(payload.price || 0) < 0) throw new Error("PRICE_NEGATIVE");
    const confirmedConflict = state.tables.partnerBookings.some((booking) => {
      if (booking.partner_id !== partnerId || booking.property_id !== payload.propertyId || booking.booking_status !== "confirmed") return false;
      return dateDays(booking.start_date, booking.end_date).includes(payload.date);
    });
    if (confirmedConflict && payload.status !== "occupied") throw new Error("DATE_HAS_CONFIRMED_BOOKING");
    const oldValue = state.tables.availability.find((item) => item.property_id === payload.propertyId && item.unit_id === (payload.unitId || "") && item.date === payload.date && item.time_slot === (payload.timeSlot || "")) || null;
    const item = markAvailabilityDay(state, {
      propertyId: payload.propertyId,
      unitId: payload.unitId || "",
      date: payload.date,
      timeSlot: payload.timeSlot || "",
      status: payload.status || "available",
      price: payload.price,
      reason: payload.reason || "",
    });
    audit(state, {
      userId: payload.userId || "",
      partnerId,
      entityType: "availability",
      entityId: item.id,
      action: "availability_updated",
      oldValue,
      newValue: item,
    });
    state.updatedAt = now();
    write(state);
    return clone(item);
  }

  function hasBookingConflict(state, booking) {
    return dateDays(booking.start_date, booking.end_date).some((date) => {
      const available = availableUnitsForDay(state, booking.unit_id, date, booking.id);
      return available < Number(booking.units_count || 1);
    });
  }

  function updatePartnerBookingStatus(partnerId, bookingId, nextStatus, meta = {}, seedData = {}) {
    const state = ensure(seedData);
    partnerAccess(state, partnerId, meta.userId || "");
    const booking = state.tables.partnerBookings.find((item) => item.id === bookingId && item.partner_id === partnerId);
    if (!booking) throw new Error("BOOKING_NOT_FOUND");
    if (nextStatus === "confirmed" && hasBookingConflict(state, booking)) throw new Error("DATE_ALREADY_BOOKED");
    if (nextStatus === "rejected" && !meta.reason) throw new Error("REJECTION_REASON_REQUIRED");
    const oldStatus = booking.booking_status;
    const oldValue = clone(booking);
    const finance = commissionOf(booking.total_amount, booking.commission_percent || COMMISSION_PERCENT);
    const nextBooking = {
      ...booking,
      booking_status: nextStatus,
      payment_status: nextStatus === "confirmed" && booking.payment_status === "unpaid" ? "waiting_payment" : booking.payment_status,
      payout_status: nextStatus === "confirmed" ? "pending_payout" : booking.payout_status,
      partner_response: {
        status: nextStatus,
        comment: meta.comment || booking.partner_response?.comment || "",
      },
      rejection_reason: nextStatus === "rejected" ? meta.reason : booking.rejection_reason || "",
      commission_percent: finance.commissionPercent,
      commission_amount: finance.commissionAmount,
      partner_amount: finance.partnerAmount,
      updated_at: now(),
      updatedAt: now(),
    };
    state.tables.partnerBookings = upsertInTable(state.tables.partnerBookings, nextBooking);
    state.tables.bookingStatusHistory.unshift({
      id: uid("booking_history"),
      booking_id: bookingId,
      old_status: oldStatus,
      new_status: nextStatus,
      changed_by: meta.userId || "partner",
      comment: meta.reason || meta.comment || "",
      created_at: now(),
      createdAt: now(),
    });
    if (nextStatus === "confirmed") {
      dateDays(nextBooking.start_date, nextBooking.end_date).forEach((date) => {
        markAvailabilityDay(state, {
          propertyId: nextBooking.property_id,
          unitId: nextBooking.unit_id,
          date,
          status: "occupied",
          reason: `Бронь ${bookingId}`,
        });
      });
      if (!state.tables.financeTransactions.some((item) => item.booking_id === bookingId && item.type === "booking_commission")) {
        state.tables.financeTransactions.unshift({
          id: uid("finance"),
          booking_id: bookingId,
          partner_id: partnerId,
          type: "booking_commission",
          amount: finance.commissionAmount,
          status: "recorded",
          description: "Комиссия ANIMA 5%",
          created_at: now(),
          createdAt: now(),
        });
      }
    }
    if (nextStatus === "rejected") {
      dateDays(nextBooking.start_date, nextBooking.end_date).forEach((date) => {
        markAvailabilityDay(state, {
          propertyId: nextBooking.property_id,
          unitId: nextBooking.unit_id,
          date,
          status: "available",
          reason: meta.reason || "",
        });
      });
    }
    const order = state.tables.orders.find((item) => item.id === booking.sourceOrderId);
    if (order) {
      state.tables.orders = upsertInTable(state.tables.orders, {
        ...order,
        status: orderStatusFromBooking(nextStatus),
        partnerBookingStatus: nextStatus,
        updatedAt: now(),
      });
      if (order.userId) {
        state.tables.notifications.unshift({
          id: uid("notification"),
          status: "unread",
          userId: order.userId,
          orderId: order.id,
          type: `booking-${nextStatus}`,
          title: nextStatus === "confirmed" ? "Бронь подтверждена партнёром" : "Бронь отклонена партнёром",
          message: nextStatus === "confirmed"
            ? "Партнёр подтвердил бронь. Следующий шаг сохранён в заявке ANIMA."
            : `Партнёр отклонил бронь. Причина: ${meta.reason || "не указана"}.`,
          createdAt: now(),
        });
      }
    }
    pushPartnerNotification(state, {
      partnerId,
      userId: meta.userId || "",
      type: `booking-${nextStatus}`,
      title: nextStatus === "confirmed" ? "Бронь подтверждена" : "Бронь отклонена",
      message: `${nextBooking.customer_name}: ${nextBooking.start_date} - ${nextBooking.end_date}`,
    });
    audit(state, {
      userId: meta.userId || "",
      partnerId,
      entityType: "booking",
      entityId: bookingId,
      action: `booking_${nextStatus}`,
      oldValue,
      newValue: nextBooking,
    });
    state.updatedAt = now();
    write(state);
    return clone(nextBooking);
  }

  function confirmPartnerBooking(partnerId, bookingId, meta = {}, seedData = {}) {
    return updatePartnerBookingStatus(partnerId, bookingId, "confirmed", meta, seedData);
  }

  function rejectPartnerBooking(partnerId, bookingId, meta = {}, seedData = {}) {
    return updatePartnerBookingStatus(partnerId, bookingId, "rejected", meta, seedData);
  }

  function addBookingComment(partnerId, payload = {}, seedData = {}) {
    const state = ensure(seedData);
    partnerAccess(state, partnerId, payload.userId || "");
    const booking = state.tables.partnerBookings.find((item) => item.id === payload.bookingId && item.partner_id === partnerId);
    if (!booking) throw new Error("BOOKING_NOT_FOUND");
    const comment = {
      id: uid("booking_comment"),
      booking_id: payload.bookingId,
      partner_id: partnerId,
      author_id: payload.userId || "",
      author_role: payload.authorRole || "partner",
      visibility: payload.visibility || "partner_admin",
      text: payload.text || "",
      created_at: now(),
      createdAt: now(),
    };
    state.tables.bookingComments.unshift(comment);
    audit(state, {
      userId: payload.userId || "",
      partnerId,
      entityType: "booking_comment",
      entityId: comment.id,
      action: "booking_comment_created",
      newValue: comment,
    });
    state.updatedAt = now();
    write(state);
    return clone(comment);
  }

  function addMessage(payload = {}, seedData = {}) {
    const state = ensure(seedData);
    const chat = state.tables.chats.find((item) => item.id === payload.chatId);
    if (!chat) throw new Error("CHAT_NOT_FOUND");
    const message = {
      id: uid("message"),
      chat_id: chat.id,
      booking_id: chat.booking_id || payload.bookingId || "",
      partner_id: chat.partner_id || payload.partnerId || "",
      sender_id: payload.senderId || "",
      sender_role: payload.senderRole || "partner",
      text: payload.text || "",
      visibility: chat.type === "partner_admin" ? "partner_admin" : "client_partner_admin",
      createdAt: now(),
      updatedAt: now(),
    };
    state.tables.messages.unshift(message);
    state.tables.chats = upsertInTable(state.tables.chats, { ...chat, updatedAt: now(), lastMessage: message.text });
    audit(state, { userId: message.sender_id, partnerId: message.partner_id, entityType: "chat", entityId: chat.id, action: "message_created", newValue: message });
    state.updatedAt = now();
    write(state);
    return clone(message);
  }

  function addAdminNote(payload = {}, seedData = {}) {
    const state = ensure(seedData);
    const note = {
      id: uid("admin_note"),
      partner_id: payload.partnerId || "",
      booking_id: payload.bookingId || "",
      entity_type: payload.bookingId ? "booking" : "partner",
      entity_id: payload.bookingId || payload.partnerId || "",
      author_id: payload.authorId || "admin",
      text: payload.text || "",
      createdAt: now(),
      updatedAt: now(),
    };
    state.tables.adminNotes.unshift(note);
    audit(state, { userId: note.author_id, partnerId: note.partner_id, entityType: "admin_note", entityId: note.id, action: "admin_note_created", newValue: note });
    state.updatedAt = now();
    write(state);
    return clone(note);
  }

  function requestWithdrawal(partnerId, payload = {}, seedData = {}) {
    const state = ensure(seedData);
    partnerAccess(state, partnerId, payload.userId || "");
    const workspace = getPartnerWorkspace(partnerId, seedData);
    const amount = Number(payload.amount || 0);
    if (amount <= 0) throw new Error("WITHDRAWAL_AMOUNT_REQUIRED");
    if (amount > workspace.stats.availableBalance) throw new Error("WITHDRAWAL_AMOUNT_TOO_HIGH");
    const request = {
      id: uid("withdrawal"),
      partner_id: partnerId,
      amount,
      currency: payload.currency || "VND",
      recipient_name: payload.recipient_name || "",
      bank: payload.bank || "",
      account_number: payload.account_number || "",
      phone: payload.phone || "",
      comment: payload.comment || "",
      status: "pending",
      createdAt: now(),
      updatedAt: now(),
    };
    state.tables.withdrawalRequests.unshift(request);
    state.tables.partnerBookings
      .filter((booking) => booking.partner_id === partnerId && booking.booking_status === "funds_available" && booking.payout_status !== "paid_to_partner")
      .forEach((booking) => {
        booking.booking_status = "payout_requested";
        booking.payout_status = "pending_payout";
        booking.updatedAt = now();
        state.tables.partnerBookings = upsertInTable(state.tables.partnerBookings, booking);
      });
    pushPartnerNotification(state, { partnerId, userId: payload.userId || "", type: "withdrawal-requested", title: "Заявка на вывод отправлена", message: `${request.amount.toLocaleString("ru-RU")} ${request.currency}` });
    audit(state, { userId: payload.userId || "", partnerId, entityType: "withdrawal", entityId: request.id, action: "withdrawal_requested", newValue: request });
    state.updatedAt = now();
    write(state);
    return clone(request);
  }

  function updateWithdrawalStatus(withdrawalId, status, meta = {}, seedData = {}) {
    const state = ensure(seedData);
    const request = state.tables.withdrawalRequests.find((item) => item.id === withdrawalId);
    if (!request) throw new Error("WITHDRAWAL_NOT_FOUND");
    const oldValue = clone(request);
    const nextRequest = { ...request, status, admin_comment: meta.comment || request.admin_comment || "", updatedAt: now() };
    if (status === "paid") nextRequest.paid_at = now();
    if (status === "approved") {
      nextRequest.review_status = "approved";
      nextRequest.provider = meta.provider || request.provider || "manual";
      state.tables.payoutTasks.unshift({
        id: uid("payout_task"),
        withdrawal_id: request.id,
        partner_id: request.partner_id,
        provider: nextRequest.provider,
        amount: request.amount,
        currency: request.currency,
        status: nextRequest.provider === "manual" ? "manual_review" : "sending",
        provider_payload: {
          recipient_name: request.recipient_name,
          bank: request.bank,
          account_number: request.account_number,
          phone: request.phone,
        },
        createdAt: now(),
        updatedAt: now(),
      });
    }
    state.tables.withdrawalRequests = upsertInTable(state.tables.withdrawalRequests, nextRequest);
    if (status === "paid") {
      state.tables.partnerBookings
        .filter((booking) => booking.partner_id === request.partner_id && booking.booking_status === "payout_requested")
        .forEach((booking) => {
          booking.booking_status = "payout_sent";
          booking.payout_status = "paid_to_partner";
          booking.updatedAt = now();
          state.tables.partnerBookings = upsertInTable(state.tables.partnerBookings, booking);
        });
    }
    pushPartnerNotification(state, { partnerId: request.partner_id, type: `withdrawal-${status}`, title: status === "paid" ? "Выплата отправлена" : "Статус выплаты обновлён", message: `${request.amount.toLocaleString("ru-RU")} ${request.currency}` });
    audit(state, { userId: meta.userId || "admin", partnerId: request.partner_id, entityType: "withdrawal", entityId: request.id, action: `withdrawal_${status}`, oldValue, newValue: nextRequest });
    state.updatedAt = now();
    write(state);
    return clone(nextRequest);
  }

  function setCommissionRule(payload = {}, seedData = {}) {
    const state = ensure(seedData);
    const rule = {
      id: payload.id || uid("commission"),
      scope: payload.scope || "partner",
      title: payload.title || "Правило комиссии",
      partner_id: payload.partner_id || "",
      property_id: payload.property_id || "",
      unit_id: payload.unit_id || "",
      booking_id: payload.booking_id || "",
      type: payload.type || "percent",
      percent: Number(payload.percent || 0),
      fixed_amount: Number(payload.fixed_amount || 0),
      currency: payload.currency || "VND",
      date_from: payload.date_from || "",
      date_to: payload.date_to || "",
      status: payload.status || "active",
      priority: Number(payload.priority || 10),
      createdAt: payload.createdAt || now(),
      updatedAt: now(),
    };
    state.tables.commissionRules = upsertInTable(state.tables.commissionRules, rule);
    if (rule.id === "commission_default") state.settings.defaultCommissionPercent = rule.percent;
    state.tables.partnerBookings.forEach((booking) => {
      const applies = (!rule.partner_id || rule.partner_id === booking.partner_id)
        && (!rule.property_id || rule.property_id === booking.property_id)
        && (!rule.unit_id || rule.unit_id === booking.unit_id)
        && (!rule.booking_id || rule.booking_id === booking.id);
      if (!applies) return;
      const finance = bookingFinance(state, booking);
      state.tables.partnerBookings = upsertInTable(state.tables.partnerBookings, {
        ...booking,
        commission_percent: finance.commissionPercent,
        commission_fixed_amount: finance.commissionFixedAmount,
        commission_type: finance.commissionType,
        commission_rule_id: finance.commissionRuleId,
        commission_amount: finance.commissionAmount,
        partner_amount: finance.partnerAmount,
        updatedAt: now(),
      });
    });
    audit(state, { userId: payload.actorUserId || "admin", partnerId: payload.partner_id || "", entityType: "commission_rule", entityId: rule.id, action: "commission_rule_saved", newValue: rule });
    state.updatedAt = now();
    write(state);
    return clone(rule);
  }

  function updateBookingAdmin(bookingId, patch = {}, seedData = {}) {
    const state = ensure(seedData);
    const booking = state.tables.partnerBookings.find((item) => item.id === bookingId);
    if (!booking) throw new Error("BOOKING_NOT_FOUND");
    const oldValue = clone(booking);
    const nextBooking = { ...booking, ...patch, id: booking.id, updatedAt: now(), updated_at: now() };
    if (patch.total_amount || patch.commission_percent || patch.commission_fixed_amount || patch.commission_type) {
      const finance = commissionOf(
        nextBooking.total_amount,
        patch.commission_percent ?? nextBooking.commission_percent,
        patch.commission_fixed_amount ?? nextBooking.commission_fixed_amount,
        patch.commission_type ?? nextBooking.commission_type ?? "percent",
      );
      nextBooking.commission_percent = finance.commissionPercent;
      nextBooking.commission_fixed_amount = finance.commissionFixedAmount;
      nextBooking.commission_type = finance.commissionType;
      nextBooking.commission_amount = finance.commissionAmount;
      nextBooking.partner_amount = finance.partnerAmount;
    }
    if (patch.booking_status && patch.booking_status !== booking.booking_status) {
      state.tables.bookingStatusHistory.unshift({
        id: uid("booking_history"),
        booking_id: bookingId,
        old_status: booking.booking_status,
        new_status: patch.booking_status,
        changed_by: patch.actorUserId || "admin",
        comment: patch.admin_comment || "",
        created_at: now(),
        createdAt: now(),
      });
    }
    state.tables.partnerBookings = upsertInTable(state.tables.partnerBookings, nextBooking);
    audit(state, { userId: patch.actorUserId || "admin", partnerId: booking.partner_id, entityType: "booking", entityId: bookingId, action: "booking_admin_updated", oldValue, newValue: nextBooking });
    state.updatedAt = now();
    write(state);
    return clone(nextBooking);
  }

  function recordPayment(bookingId, payload = {}, seedData = {}) {
    const state = ensure(seedData);
    const booking = state.tables.partnerBookings.find((item) => item.id === bookingId);
    if (!booking) throw new Error("BOOKING_NOT_FOUND");
    const breakdown = financialBreakdown(state, booking);
    const amount = Number(payload.amount || breakdown.pay_now_amount || 0);
    const payment = {
      id: uid("payment"),
      provider_payment_id: payload.providerPaymentId || uid("provider_payment"),
      booking_id: bookingId,
      partner_id: booking.partner_id,
      client_id: booking.client_id,
      amount,
      commission_amount: breakdown.commission_amount,
      partner_amount: breakdown.payment_method === "anima_online" ? breakdown.partner_amount : 0,
      hotel_cash_amount: breakdown.pay_at_hotel_amount,
      payment_method: breakdown.payment_method,
      method: payload.method || "manual",
      status: payload.status || "paid",
      provider: payload.provider || "ANIMA manual",
      paid_at: payload.status === "paid" || !payload.status ? now() : "",
      createdAt: now(),
      updatedAt: now(),
    };
    state.tables.payments.unshift(payment);
    const nextStatus = payment.status === "paid"
      ? (breakdown.payment_method === "cash_at_hotel" ? "commission_paid" : "paid")
      : booking.booking_status;
    const nextPayoutStatus = breakdown.payment_method === "anima_online" && payment.status === "paid" ? "not_due" : "not_due";
    state.tables.partnerBookings = upsertInTable(state.tables.partnerBookings, {
      ...booking,
      payment_status: payment.status,
      booking_status: nextStatus,
      total_amount: breakdown.total_amount,
      commission_amount: breakdown.commission_amount,
      partner_amount: breakdown.partner_amount,
      pay_now_amount: breakdown.pay_now_amount,
      pay_at_hotel_amount: breakdown.pay_at_hotel_amount,
      partner_balance_amount: breakdown.partner_balance_amount,
      payment_method: breakdown.payment_method,
      payout_status: nextPayoutStatus,
      updatedAt: now(),
    });
    state.tables.bookingStatusHistory.unshift({
      id: uid("booking_history"),
      booking_id: bookingId,
      old_status: booking.booking_status,
      new_status: nextStatus,
      changed_by: payload.actorUserId || "system",
      comment: breakdown.payment_method === "cash_at_hotel" ? "Клиент оплатил сервисный сбор ANIMA" : "Клиент оплатил полную стоимость через ANIMA",
      created_at: now(),
      createdAt: now(),
    });
    state.tables.animaLedger.unshift({
      id: uid("ledger"),
      booking_id: bookingId,
      partner_id: booking.partner_id,
      type: breakdown.payment_method === "cash_at_hotel" ? "cash_booking_commission" : "online_booking_commission",
      amount: breakdown.commission_amount,
      status: "earned",
      description: "Комиссия ANIMA",
      createdAt: now(),
    });
    pushPartnerNotification(state, {
      partnerId: booking.partner_id,
      type: "payment",
      title: breakdown.payment_method === "cash_at_hotel" ? "Клиент оплатил сервисный сбор ANIMA" : "Бронь оплачена клиентом",
      message: breakdown.payment_method === "cash_at_hotel"
        ? `Остаток к получению в отеле: ${breakdown.pay_at_hotel_amount.toLocaleString("ru-RU")} VND`
        : `Ваша чистая прибыль ожидает завершения проживания: ${breakdown.partner_amount.toLocaleString("ru-RU")} VND`,
    });
    addNotificationToState(state, {
      userId: booking.client_id,
      bookingId,
      type: "payment",
      title: "Оплата получена",
      message: breakdown.payment_method === "cash_at_hotel"
        ? "Сервисный сбор ANIMA оплачен. Остальную сумму вы оплатите в отеле при заселении."
        : "Оплата бронирования получена. Мы передали информацию отелю.",
      actionType: "open-booking",
    });
    addAdminSystemNotification(state, "Клиент оплатил", `${booking.customer_name}: ${amount.toLocaleString("ru-RU")} VND`);
    audit(state, { userId: payload.actorUserId || "admin", partnerId: booking.partner_id, entityType: "payment", entityId: payment.id, action: "payment_recorded", newValue: payment });
    state.updatedAt = now();
    write(state);
    return clone(payment);
  }

  function sendAdminMessage(payload = {}, seedData = {}) {
    const state = ensure(seedData);
    const target = payload.target || "all_users";
    const bookings = state.tables.partnerBookings || [];
    const clientIds = new Set();
    const partnerIds = new Set();
    if (target === "client" && payload.userId) clientIds.add(payload.userId);
    if (target === "partner" && payload.partnerId) partnerIds.add(payload.partnerId);
    if (target === "all_clients" || target === "all_users") {
      state.tables.users.filter((user) => user.role === "client").forEach((user) => clientIds.add(user.id));
    }
    if (target === "all_partners" || target === "all_users") {
      state.tables.partners.forEach((partner) => partnerIds.add(partner.id));
    }
    if (target === "hotel_users" && payload.propertyId) {
      bookings.filter((booking) => booking.property_id === payload.propertyId).forEach((booking) => booking.client_id && clientIds.add(booking.client_id));
    }
    if (target === "active_booking_users") {
      bookings.filter((booking) => ["confirmed", "commission_paid", "paid", "active", "checked_in"].includes(booking.booking_status)).forEach((booking) => booking.client_id && clientIds.add(booking.client_id));
    }
    if (target === "cancelled_booking_users") {
      bookings.filter((booking) => ["cancelled_by_client", "cancelled_by_anima", "rejected"].includes(booking.booking_status)).forEach((booking) => booking.client_id && clientIds.add(booking.client_id));
    }
    const message = {
      id: uid("admin_message"),
      title: payload.title || "Сообщение от ANIMA",
      text: payload.text || "",
      type: payload.type || "admin-message",
      priority: payload.priority || "normal",
      target,
      ctas: payload.ctas || [],
      scheduled_at: payload.scheduled_at || "",
      sent_at: payload.scheduled_at ? "" : now(),
      status: payload.scheduled_at ? "scheduled" : "sent",
      createdAt: now(),
      updatedAt: now(),
    };
    state.tables.adminMessages.unshift(message);
    clientIds.forEach((userId) => addNotificationToState(state, {
      userId,
      type: message.type,
      senderName: "ANIMA",
      senderType: "admin",
      title: message.title,
      message: message.text,
      priority: message.priority,
      cta: message.ctas[0] || null,
      actionUrl: message.ctas[0]?.url || "",
    }));
    partnerIds.forEach((partnerId) => pushPartnerNotification(state, {
      partnerId,
      type: message.type,
      title: message.title,
      message: message.text,
    }));
    audit(state, { userId: payload.actorUserId || "admin", entityType: "admin_message", entityId: message.id, action: "admin_message_sent", newValue: message });
    state.updatedAt = now();
    write(state);
    return clone(message);
  }

  function createSupportTicket(payload = {}, seedData = {}) {
    const state = ensure(seedData);
    const title = String(payload.title || payload.subject || "").trim();
    const message = String(payload.message || "").trim();
    if (!message) throw new Error("SUPPORT_MESSAGE_REQUIRED");
    const ticket = {
      id: uid("support_ticket"),
      partner_id: payload.partnerId || "",
      user_id: payload.userId || "",
      topic: payload.topic || "other",
      title: title || supportTopicLabel(payload.topic || "other"),
      message,
      files: Array.isArray(payload.files) ? payload.files : [],
      status: "new",
      priority: payload.priority || "normal",
      source: "partner_cabinet",
      createdAt: now(),
      updatedAt: now(),
    };
    state.tables.supportTickets.unshift(ticket);
    pushPartnerNotification(state, {
      partnerId: ticket.partner_id,
      userId: ticket.user_id,
      type: "support",
      title: "Тикет отправлен в ANIMA",
      message: ticket.title,
    });
    addAdminSystemNotification(state, "Новый тикет поддержки", `${ticket.title}: ${ticket.message.slice(0, 120)}`);
    audit(state, { userId: ticket.user_id, partnerId: ticket.partner_id, entityType: "support_ticket", entityId: ticket.id, action: "support_ticket_created", newValue: ticket });
    state.updatedAt = now();
    write(state);
    return clone(ticket);
  }

  function listPublicReviews(payload = {}, seedData = {}) {
    const state = ensure(seedData);
    const propertyId = payload.propertyId || "";
    const partnerId = payload.partnerId || "";
    const sourceEntryId = payload.sourceEntryId || "";
    let propertyIds = propertyId ? [propertyId] : [];
    if (!propertyIds.length && sourceEntryId) {
      propertyIds = state.tables.partnerProperties
        .filter((item) => item.sourceEntryId === sourceEntryId)
        .map((item) => item.id);
    }
    return clone((state.tables.reviews || [])
      .filter((review) => review.status !== "hidden")
      .filter((review) => {
        if (propertyIds.length && propertyIds.includes(review.property_id)) return true;
        if (partnerId && review.partner_id === partnerId) return true;
        return false;
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)));
  }

  function createReview(payload = {}, seedData = {}) {
    const state = ensure(seedData);
    const bookingId = payload.bookingId || "";
    const booking = state.tables.partnerBookings.find((item) => item.id === bookingId);
    if (!booking) throw new Error("BOOKING_NOT_FOUND");
    if ((payload.userId || "") !== booking.client_id) throw new Error("REVIEW_FORBIDDEN");
    const checkinValue = `${booking.start_date || ""}T${payload.checkinTime || "14:00"}:00`;
    if (!booking.start_date || Number.isNaN(new Date(checkinValue).getTime()) || Date.now() < new Date(checkinValue).getTime()) {
      throw new Error("REVIEW_NOT_AVAILABLE_YET");
    }
    const text = String(payload.text || "").trim();
    if (!text) throw new Error("REVIEW_TEXT_REQUIRED");
    const existing = state.tables.reviews.find((item) => item.booking_id === bookingId && item.user_id === booking.client_id);
    const review = {
      id: existing?.id || uid("review"),
      booking_id: bookingId,
      property_id: booking.property_id,
      partner_id: booking.partner_id,
      user_id: booking.client_id,
      user_name: payload.userName || booking.customer_name || "Гость ANIMA",
      rating: Math.max(1, Math.min(5, Number(payload.rating || existing?.rating || 5))),
      text,
      status: "published",
      likes: Number(existing?.likes || 0),
      createdAt: existing?.createdAt || now(),
      updatedAt: now(),
    };
    state.tables.reviews = upsertInTable(state.tables.reviews, review);
    audit(state, { userId: review.user_id, partnerId: review.partner_id, entityType: "review", entityId: review.id, action: existing ? "review_updated" : "review_created", newValue: review });
    state.updatedAt = now();
    write(state);
    return clone(review);
  }

  function createPartnerApplication(payload = {}, seedData = {}) {
    const state = ensure(seedData);
    const application = {
      id: uid("partner_application"),
      full_name: String(payload.fullName || "").trim(),
      business_name: String(payload.businessName || "").trim(),
      business_type: String(payload.businessType || "").trim(),
      email: String(payload.email || "").trim(),
      phone: String(payload.phone || "").trim(),
      telegram: String(payload.telegram || "").trim(),
      whatsapp: String(payload.whatsapp || "").trim(),
      zalo: String(payload.zalo || "").trim(),
      address: String(payload.address || "").trim(),
      website: String(payload.website || "").trim(),
      position: String(payload.position || "").trim(),
      description: String(payload.description || "").trim(),
      preferred_contact: String(payload.preferredContact || "").trim(),
      comment: String(payload.comment || "").trim(),
      status: "new",
      source: payload.source || "client_for_business",
      createdAt: now(),
      updatedAt: now(),
    };
    state.tables.partnerApplications.unshift(application);
    addAdminSystemNotification(state, "Новая заявка партнёра", `${application.business_name || "Без названия"} · ${application.full_name || "без контакта"}`);
    audit(state, { userId: payload.userId || "", entityType: "partner_application", entityId: application.id, action: "partner_application_created", newValue: application });
    state.updatedAt = now();
    write(state);
    return clone(application);
  }

  function createPartnerStaff(partnerId, payload = {}, seedData = {}) {
    const state = ensure(seedData);
    partnerAccess(state, partnerId, payload.userId || "");
    const name = String(payload.name || "").trim();
    const login = normalizeLogin(payload.login || payload.email || payload.phone || "");
    if (!name) throw new Error("STAFF_NAME_REQUIRED");
    if (!login) throw new Error("STAFF_LOGIN_REQUIRED");
    if (state.tables.users.some((user) => normalizeLogin(user.login || user.email || user.phone || "") === login)) {
      throw new Error("STAFF_LOGIN_EXISTS");
    }
    const user = {
      id: uid("user"),
      login,
      name,
      fullName: name,
      email: payload.email || "",
      phone: payload.phone || "",
      role: "partner_staff",
      status: "active",
      passwordHash: payload.passwordHash || DEFAULT_PARTNER_PASSWORD_HASH,
      mustChangePassword: true,
      createdAt: now(),
      updatedAt: now(),
    };
    const staff = {
      id: uid("partner_staff"),
      partner_id: partnerId,
      user_id: user.id,
      role: payload.role || "partner_staff",
      permissions: Array.isArray(payload.permissions) ? payload.permissions : [],
      status: payload.status || "active",
      createdAt: now(),
      updatedAt: now(),
    };
    state.tables.users.push(user);
    state.tables.partnerStaff.push(staff);
    audit(state, { userId: payload.userId || "", partnerId, entityType: "partner_staff", entityId: staff.id, action: "partner_staff_created", newValue: { staff, user: publicUser(user) } });
    state.updatedAt = now();
    write(state);
    return clone({ staff, user: publicUser(user) });
  }

  function updatePartnerStaff(partnerId, staffId, patch = {}, seedData = {}) {
    const state = ensure(seedData);
    partnerAccess(state, partnerId, patch.userId || "");
    const staff = state.tables.partnerStaff.find((item) => item.id === staffId && item.partner_id === partnerId);
    if (!staff) throw new Error("STAFF_NOT_FOUND");
    const oldValue = clone(staff);
    const nextStaff = {
      ...staff,
      role: patch.role || staff.role,
      permissions: Array.isArray(patch.permissions) ? patch.permissions : staff.permissions,
      status: patch.status || staff.status,
      updatedAt: now(),
    };
    state.tables.partnerStaff = upsertInTable(state.tables.partnerStaff, nextStaff);
    audit(state, { userId: patch.userId || "", partnerId, entityType: "partner_staff", entityId: staffId, action: "partner_staff_updated", oldValue, newValue: nextStaff });
    state.updatedAt = now();
    write(state);
    return clone(nextStaff);
  }

  function removePartnerStaff(partnerId, staffId, payload = {}, seedData = {}) {
    const state = ensure(seedData);
    partnerAccess(state, partnerId, payload.userId || "");
    const staff = state.tables.partnerStaff.find((item) => item.id === staffId && item.partner_id === partnerId);
    if (!staff) throw new Error("STAFF_NOT_FOUND");
    const nextStaff = { ...staff, status: "blocked", updatedAt: now() };
    const user = state.tables.users.find((item) => item.id === staff.user_id);
    if (user) state.tables.users = upsertInTable(state.tables.users, { ...user, status: "blocked", updatedAt: now() });
    state.tables.partnerStaff = upsertInTable(state.tables.partnerStaff, nextStaff);
    audit(state, { userId: payload.userId || "", partnerId, entityType: "partner_staff", entityId: staffId, action: "partner_staff_blocked", oldValue: staff, newValue: nextStaff });
    state.updatedAt = now();
    write(state);
    return clone(nextStaff);
  }

  function updateSupportTicketStatus(ticketId, payload = {}, seedData = {}) {
    const state = ensure(seedData);
    const ticket = state.tables.supportTickets.find((item) => item.id === ticketId);
    if (!ticket) throw new Error("SUPPORT_TICKET_NOT_FOUND");
    const previous = clone(ticket);
    const nextTicket = {
      ...ticket,
      status: payload.status || ticket.status,
      admin_comment: payload.adminComment ?? ticket.admin_comment,
      updatedAt: now(),
    };
    state.tables.supportTickets = upsertInTable(state.tables.supportTickets, nextTicket);
    if (payload.status && payload.status !== previous.status) {
      pushPartnerNotification(state, {
        partnerId: nextTicket.partner_id,
        userId: nextTicket.user_id,
        type: "support",
        title: "Статус тикета изменён",
        message: `${nextTicket.title}: ${supportStatusLabel(nextTicket.status)}`,
      });
    }
    audit(state, { userId: payload.actorUserId || "admin", partnerId: nextTicket.partner_id, entityType: "support_ticket", entityId: ticketId, action: "support_ticket_status_changed", oldValue: previous, newValue: nextTicket });
    state.updatedAt = now();
    write(state);
    return clone(nextTicket);
  }

  function supportStatusLabel(value = "") {
    return { new: "Новый", in_progress: "В работе", closed: "Закрыт" }[value] || value;
  }

  function supportTopicLabel(value = "") {
    return {
      booking: "Бронирование",
      payouts: "Выплаты",
      system_error: "Ошибка системы",
      property_onboarding: "Подключение объекта",
      other: "Другое",
    }[value] || "Другое";
  }

  function markPartnerNotificationRead(notificationId, seedData = {}) {
    const state = ensure(seedData);
    const item = state.tables.partnerNotifications.find((entry) => entry.id === notificationId);
    if (!item) return null;
    const nextItem = { ...item, read_at: now(), updatedAt: now() };
    state.tables.partnerNotifications = upsertInTable(state.tables.partnerNotifications, nextItem);
    state.updatedAt = now();
    write(state);
    return clone(nextItem);
  }

  function searchEntities(query = "", seedData = {}) {
    const state = ensure(seedData);
    const text = String(query || "").trim().toLowerCase();
    if (!text) return [];
    const partners = state.tables.partners || [];
    const users = state.tables.users || [];
    const properties = state.tables.partnerProperties || [];
    const bookings = state.tables.partnerBookings || [];
    const applications = state.tables.partnerApplications || [];
    const partnerById = new Map(partners.map((item) => [item.id, item]));
    const propertyById = new Map(properties.map((item) => [item.id, item]));
    const rows = [];
    properties.forEach((property) => {
      const partner = partnerById.get(property.partner_id);
      const haystack = [property.title, property.location, property.address, property.content_category, partner?.business_name].filter(Boolean).join(" ").toLowerCase();
      if (haystack.includes(text)) rows.push({ id: property.id, entityType: "property", title: property.title || "Объект", subtitle: partner?.business_name || "", status: property.status || "", routeKey: "objects" });
    });
    partners.forEach((partner) => {
      const haystack = [partner.business_name, partner.contact_name, partner.email, partner.phone, partner.business_type].filter(Boolean).join(" ").toLowerCase();
      if (haystack.includes(text)) rows.push({ id: partner.id, entityType: "partner", title: partner.business_name || "Партнёр", subtitle: partner.contact_name || "", status: partner.status || "", routeKey: "partners" });
    });
    bookings.forEach((booking) => {
      const property = propertyById.get(booking.property_id);
      const haystack = [booking.id, booking.customer_name, booking.customer_email, property?.title].filter(Boolean).join(" ").toLowerCase();
      if (haystack.includes(text)) rows.push({ id: booking.id, entityType: "booking", title: booking.customer_name || "Бронирование", subtitle: property?.title || "", status: booking.booking_status || "", routeKey: "bookings" });
    });
    applications.forEach((application) => {
      const haystack = [application.business_name, application.full_name, application.email, application.description].filter(Boolean).join(" ").toLowerCase();
      if (haystack.includes(text)) rows.push({ id: application.id, entityType: "application", title: application.business_name || "Заявка", subtitle: application.full_name || "", status: application.status || "", routeKey: "requests" });
    });
    users.forEach((user) => {
      const haystack = [user.fullName, user.name, user.email, user.username, user.telegram].filter(Boolean).join(" ").toLowerCase();
      if (haystack.includes(text)) rows.push({ id: user.id, entityType: "user", title: user.fullName || user.name || "Пользователь", subtitle: user.email || user.username || "", status: user.status || "", routeKey: "users" });
    });
    return rows.slice(0, 50);
  }

  window.ANIMA_DB = {
    key: DB_KEY,
    ensure,
    getState,
    listEntries,
    saveEntry,
    deleteEntry,
    addOrder,
    updateOrder,
    addNotification,
    listNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    incrementEntryViews,
    addPromotionRequest,
    updatePromotionRequest,
    listPromotionRequests,
    trackVisit,
    getDashboardStats,
    beginRegistration,
    completeRegistration,
    authenticate,
    verifyLoginCode,
    updateUser,
    getUser,
    listUsers,
    authenticatePartner,
    changePartnerPassword,
    listPartners,
    createPartner,
    updatePartner,
    resetPartnerPassword,
    getPartnerWorkspace,
    listPartnerBookings,
    publicPropertyBundle,
    createBookingRequest,
    createPartnerProperty,
    createRoomType,
    updateRoomType,
    updatePartnerProperty,
    updatePropertyPaymentSettings,
    reviewModerationRequest,
    updateAvailability,
    confirmPartnerBooking,
    rejectPartnerBooking,
    addBookingComment,
    addMessage,
    addAdminNote,
    requestWithdrawal,
    updateWithdrawalStatus,
    setCommissionRule,
    updateBookingAdmin,
    recordPayment,
    sendAdminMessage,
    createSupportTicket,
    updateSupportTicketStatus,
    listPublicReviews,
    createReview,
    createPartnerApplication,
    createPartnerStaff,
    updatePartnerStaff,
    removePartnerStaff,
    markPartnerNotificationRead,
    searchEntities,
    categoryCatalog,
    resolveCategoryMeta,
    propertyKindFromValue,
    attachPriceMaps,
    formatStoredPrice,
    parsePriceText,
    convertPriceMap,
    commissionOf,
    financialBreakdown,
  };
})();
