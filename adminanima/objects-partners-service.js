const ANIMA_ADMIN_DB_KEY = "anima.db.v1";
const ANIMA_ADMIN_RANGE_KEY = "anima.admin.dashboardRange.v1";
const ANIMA_ADMIN_API_URL = "/api/db";

(function attachObjectsPartnersService() {
  function now() {
    return new Date().toISOString();
  }

  function uid(prefix) {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function readState(seedData = {}) {
    return clone(window.ANIMA_DB.getState(seedData));
  }

  function writeState(state) {
    localStorage.setItem(ANIMA_ADMIN_DB_KEY, JSON.stringify(state));
    try {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", ANIMA_ADMIN_API_URL, false);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.send(JSON.stringify(state));
    } catch {}
    return state;
  }

  function parseDateTime(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function parseDate(value) {
    if (!value) return null;
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function startOfDay(value) {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  function endOfDay(value) {
    const date = new Date(value);
    date.setHours(23, 59, 59, 999);
    return date;
  }

  function addDays(date, days) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }

  function sameDay(left, right) {
    return left && right
      && left.getFullYear() === right.getFullYear()
      && left.getMonth() === right.getMonth()
      && left.getDate() === right.getDate();
  }

  function inRange(date, from, to) {
    return Boolean(date && date >= from && date <= to);
  }

  function readRange(seedData = {}) {
    try {
      const saved = JSON.parse(localStorage.getItem(ANIMA_ADMIN_RANGE_KEY) || "null");
      if (saved?.from && saved?.to) {
        return {
          from: startOfDay(parseDate(saved.from)),
          to: endOfDay(parseDate(saved.to)),
        };
      }
    } catch {}
    const state = readState(seedData);
    const bookings = state.tables.partnerBookings || [];
    const dates = bookings.map((item) => parseDateTime(item.createdAt || item.created_at)).filter(Boolean).sort((a, b) => a - b);
    const today = new Date();
    return {
      from: startOfDay(dates[0] || new Date(today.getFullYear(), today.getMonth(), 1)),
      to: endOfDay(dates[dates.length - 1] || today),
    };
  }

  function previousRange(range) {
    const days = Math.max(1, Math.round((range.to - range.from) / 86400000) + 1);
    const prevTo = endOfDay(addDays(range.from, -1));
    const prevFrom = startOfDay(addDays(prevTo, -(days - 1)));
    return { from: prevFrom, to: prevTo };
  }

  function objectTypeLabel(property = {}) {
    const raw = String(property.content_category || property.type || property.property_type_id || "").toLowerCase();
    const category = window.ANIMA_DB?.categoryCatalog?.().find((item) => item.id === raw);
    return category?.label || ({
      hotel: "Отель",
      apartment: "Апартаменты",
      apartments: "Апартаменты",
      villa: "Вилла",
      house: "Дом",
      bungalow: "Бунгало",
      room_type: "Номер",
      whole_property: "Объект",
    }[raw] || (property.type || property.property_type_id || "Объект"));
  }

  function propertyStatusLabel(property = {}) {
    if (property.moderation_status === "pending_review") return "На модерации";
    return {
      active: "Активен",
      approved: "Активен",
      draft: "Ожидает",
      blocked: "Скрыт",
      archived: "Снят",
    }[property.status] || "Ожидает";
  }

  function propertyStatusTone(property = {}) {
    if (property.moderation_status === "pending_review") return "moderation";
    return {
      active: "confirmed",
      approved: "confirmed",
      draft: "waiting",
      blocked: "cancelled",
      archived: "cancelled",
    }[property.status] || "waiting";
  }

  function partnerStatusLabel(status = "") {
    return {
      active: "Активен",
      pending: "Ожидает",
      blocked: "Отключён",
    }[status] || "Ожидает";
  }

  function partnerStatusTone(status = "") {
    return {
      active: "confirmed",
      pending: "waiting",
      blocked: "cancelled",
    }[status] || "waiting";
  }

  function comparePercent(current, previous) {
    if (!previous) return null;
    const delta = current - previous;
    return (delta / previous) * 100;
  }

  function normalizeData(seedData = {}) {
    const state = readState(seedData);
    const range = readRange(seedData);
    const previous = previousRange(range);
    const partners = state.tables.partners || [];
    const users = state.tables.users || [];
    const properties = state.tables.partnerProperties || [];
    const bookings = state.tables.partnerBookings || [];
    const reviews = state.tables.reviews || [];
    const payments = state.tables.payments || [];
    const applications = state.tables.partnerApplications || [];
    const moderationRequests = state.tables.moderationRequests || [];
    const withdrawals = state.tables.withdrawalRequests || [];
    const audits = state.tables.auditLogs || [];

    const partnerMap = new Map(partners.map((item) => [item.id, item]));
    const userMap = new Map(users.map((item) => [item.id, item]));
    const propertyRows = properties.map((property) => {
      const partner = partnerMap.get(property.partner_id) || null;
      const propertyBookings = bookings.filter((item) => item.property_id === property.id);
      const currentBookings = propertyBookings.filter((item) => inRange(parseDateTime(item.createdAt || item.created_at), range.from, range.to));
      const previousBookings = propertyBookings.filter((item) => inRange(parseDateTime(item.createdAt || item.created_at), previous.from, previous.to));
      const revenue = currentBookings.reduce((sum, item) => sum + Number(item.total_amount || 0), 0);
      const previousRevenue = previousBookings.reduce((sum, item) => sum + Number(item.total_amount || 0), 0);
      const reviewRows = reviews.filter((item) => item.property_id === property.id);
      const auditRows = audits.filter((item) => item.entityType === "property" && item.entityId === property.id).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      return {
        id: property.id,
        title: property.title || "Без названия",
        location: property.location || property.address || "Локация не указана",
        photo: property.photos?.[0] || property.property_photos?.[0] || "",
        partnerId: property.partner_id || "",
        partnerName: partner?.business_name || "Партнёр не назначен",
        type: objectTypeLabel(property),
        rawType: String(property.type || property.property_type_id || ""),
        categoryId: property.content_category || property.type || "hotel",
        categoryBadge: categoryBadge(property.content_category || property.type || "hotel"),
        status: propertyStatusLabel(property),
        statusTone: propertyStatusTone(property),
        bookingsCount: currentBookings.length,
        revenue,
        revenueChange: comparePercent(revenue, previousRevenue),
        property,
        bookings: propertyBookings,
        currentBookings,
        reviews: reviewRows,
        audits: auditRows,
      };
    });

    const partnerCards = partners.map((partner) => {
      const partnerUser = users.find((item) => item.id === partner.user_id);
      const partnerProperties = propertyRows.filter((item) => item.partnerId === partner.id);
      const partnerBookings = bookings.filter((item) => item.partner_id === partner.id);
      const currentRevenue = partnerBookings
        .filter((item) => inRange(parseDateTime(item.createdAt || item.created_at), range.from, range.to))
        .reduce((sum, item) => sum + Number(item.total_amount || 0), 0);
      const previousRevenue = partnerBookings
        .filter((item) => inRange(parseDateTime(item.createdAt || item.created_at), previous.from, previous.to))
        .reduce((sum, item) => sum + Number(item.total_amount || 0), 0);
      const partnerWithdrawals = withdrawals.filter((item) => item.partner_id === partner.id);
      const partnerAudits = audits.filter((item) => item.partnerId === partner.id).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      return {
        id: partner.id,
        title: partner.business_name || "Партнёр",
        owner: partner.contact_name || partnerUser?.fullName || partnerUser?.name || "Без владельца",
        avatar: partner.business_name?.slice(0, 2).toUpperCase() || "AN",
        propertyCount: partnerProperties.length,
        properties: partnerProperties,
        status: partnerStatusLabel(partner.status),
        statusTone: partnerStatusTone(partner.status),
        revenue: currentRevenue,
        revenueChange: comparePercent(currentRevenue, previousRevenue),
        bookings: partnerBookings,
        payments: payments.filter((item) => item.partner_id === partner.id),
        withdrawals: partnerWithdrawals,
        audits: partnerAudits,
        partner,
      };
    });

    const statusOptions = ["Все статусы", "Опубликовано", "Черновик", "На модерации", "Отклонено", "Архив"];
    const typeOptions = ["Все типы", ...window.ANIMA_DB.categoryCatalog().map((item) => item.label)];
    const partnerOptions = ["Все партнёры", ...partnerCards.map((item) => item.title)];

    return {
      state,
      range,
      previous,
      propertyRows,
      partnerCards,
      filters: {
        statusOptions,
        typeOptions,
        partnerOptions,
        categoryTabs: [{ id: "all", label: "Все", emoji: "✨" }, ...window.ANIMA_DB.categoryCatalog().map((item) => ({ id: item.id, label: item.label, emoji: item.emoji }))],
      },
      kpis: {
        totalObjects: properties.length,
        activeObjects: properties.filter((item) => ["active", "approved"].includes(item.status)).length,
        totalPartners: partners.length,
        activePartners: partners.filter((item) => item.status === "active").length,
        newRequests: bookings.filter((item) => ["new_request", "waiting_payment", "commission_paid", "pending_partner_confirmation"].includes(item.booking_status)).length + applications.filter((item) => item.status === "new").length,
      },
      moderation: {
        newObjects: properties.filter((item) => item.moderation_status === "pending_review" || item.status === "draft").length,
        pendingPartners: partners.filter((item) => item.status === "pending").length + applications.filter((item) => item.status === "new").length + moderationRequests.filter((item) => item.status === "pending_review").length,
      },
    };
  }

  function applyFilters(data, filters = {}) {
    const query = String(filters.search || "").trim().toLowerCase();
    const status = filters.status || "Все статусы";
    const type = filters.type || "Все типы";
    const partner = filters.partner || "Все партнёры";
    const category = filters.category || "all";

    const properties = data.propertyRows.filter((row) => {
      const matchesQuery = !query
        || row.title.toLowerCase().includes(query)
        || row.location.toLowerCase().includes(query)
        || row.partnerName.toLowerCase().includes(query);
      const matchesStatus = status === "Все статусы"
        || (status === "Опубликовано" && row.property.status === "active")
        || (status === "Черновик" && row.property.status === "draft")
        || (status === "На модерации" && row.property.moderation_status === "pending_review")
        || (status === "Отклонено" && row.property.moderation_status === "rejected")
        || (status === "Архив" && row.property.status === "archived")
        || row.status === status;
      const matchesType = type === "Все типы" || row.type === type;
      const matchesPartner = partner === "Все партнёры" || row.partnerName === partner;
      const matchesCategory = category === "all" || row.categoryId === category;
      return matchesQuery && matchesStatus && matchesType && matchesPartner && matchesCategory;
    });

    const filteredPartnerIds = new Set(properties.map((row) => row.partnerId).filter(Boolean));
    const propertyScoped = query || status !== "Все статусы" || type !== "Все типы" || category !== "all" || partner !== "Все партнёры";

    const partners = data.partnerCards.filter((card) => {
      const matchesQuery = !query
        || card.title.toLowerCase().includes(query)
        || card.owner.toLowerCase().includes(query);
      const matchesStatus = status === "Все статусы" || card.status === status;
      const matchesPartner = partner === "Все партнёры" || card.title === partner;
      const matchesFilteredProperties = !propertyScoped || filteredPartnerIds.has(card.id);
      return matchesQuery && matchesStatus && matchesPartner && matchesFilteredProperties;
    });

    return { properties, partners };
  }

  function paginate(items, page = 1, perPage = 5) {
    const total = items.length;
    const pages = Math.max(1, Math.ceil(total / perPage));
    const currentPage = Math.min(Math.max(1, page), pages);
    const start = (currentPage - 1) * perPage;
    const end = Math.min(total, start + perPage);
    return {
      page: currentPage,
      pages,
      total,
      start: total ? start + 1 : 0,
      end,
      items: items.slice(start, end),
    };
  }

  function createPartner(payload = {}, seedData = {}) {
    return window.ANIMA_DB.createPartner({
      actorUserId: payload.actorUserId || "admin",
      business_name: payload.company || payload.name || "",
      business_type: payload.role || "other",
      contact_name: payload.owner || payload.name || "",
      email: payload.email || "",
      phone: payload.phone || "",
      login: payload.email || payload.phone || `partner_${Date.now()}`,
      status: payload.status || "pending",
      passwordHash: payload.passwordHash || undefined,
    }, seedData);
  }

  function createProperty(payload = {}, seedData = {}) {
    const state = readState(seedData);
    const partner = payload.partnerId ? state.tables.partners.find((item) => item.id === payload.partnerId) : null;
    if (payload.partnerId && !partner) throw new Error("PARTNER_NOT_FOUND");
    if (partner) {
      const property = window.ANIMA_DB.createPartnerProperty(partner.id, {
        userId: partner.user_id,
        title: payload.title,
        description: payload.description,
        type: payload.type,
        category: payload.category,
        address: payload.address,
        location: payload.city || payload.address,
        photos: payload.photos ? [payload.photos] : [],
        phone: payload.phone || partner.phone || "",
        email: payload.email || partner.email || "",
      }, seedData);
      mutateState(seedData, (nextState) => {
        const nextProperty = nextState.tables.partnerProperties.find((item) => item.id === property.id);
        if (!nextProperty) return;
        nextProperty.price = payload.price || "";
        nextProperty.category_details = payload.categoryDetails || {};
        nextProperty.updatedAt = now();
      });
      if (payload.publish === "published") {
        mutateState(seedData, (nextState) => {
          const nextProperty = nextState.tables.partnerProperties.find((item) => item.id === property.id);
          if (!nextProperty) return;
          nextProperty.status = "active";
          nextProperty.moderation_status = "approved";
          nextProperty.updatedAt = now();
        });
      }
      return property;
    }
    return mutateState(seedData, (nextState) => {
      const category = window.ANIMA_DB.resolveCategoryMeta(payload.category || payload.type || "hotel");
      const kind = window.ANIMA_DB.propertyKindFromValue(payload.type || category.id || "hotel");
      const photos = payload.photos ? String(payload.photos).split("\n").map((item) => item.trim()).filter(Boolean) : [];
      const property = {
        id: uid("property"),
        partner_id: "",
        sourceEntryId: "",
        type: kind,
        property_type_id: kind,
        content_category: category.id,
        booking_model: kind === "hotel" ? "room_type" : "whole_property",
        title: payload.title || "Без названия",
        description: payload.description || "",
        address: payload.address || "",
        location: payload.city || payload.address || "",
        photos,
        property_photos: photos,
        amenities: [],
        rules: [],
        contacts: { phone: payload.phone || "", email: payload.email || "", telegram: "", whatsapp: "" },
        payment_settings: { method: "cash_at_hotel", cash_allowed: true, force_anima_online: false, payout_provider: "manual" },
        status: payload.publish === "published" ? "active" : "draft",
        moderation_status: payload.publish === "published" ? "approved" : "draft",
        price: payload.price || "",
        category_details: payload.categoryDetails || {},
        createdAt: now(),
        updatedAt: now(),
      };
      nextState.tables.partnerProperties.unshift(property);
      return property;
    });
  }

  function updateProperty(propertyId, patch = {}, seedData = {}) {
    const state = readState(seedData);
    const property = state.tables.partnerProperties.find((item) => item.id === propertyId);
    if (!property) throw new Error("PROPERTY_NOT_FOUND");
    const nextPartnerId = typeof patch.partnerId === "string" ? patch.partnerId : property.partner_id;
    const partner = nextPartnerId ? state.tables.partners.find((item) => item.id === nextPartnerId) : null;
    if (nextPartnerId && !partner) throw new Error("PARTNER_NOT_FOUND");
    if (partner && property.partner_id) {
      return window.ANIMA_DB.updatePartnerProperty(partner.id, propertyId, {
        userId: partner.user_id,
        title: patch.title,
        description: patch.description,
        type: patch.type,
        category: patch.category,
        address: patch.address,
        location: patch.city || patch.address,
        photos: patch.photos ? [patch.photos] : property.photos,
        price: patch.price || property.price || "",
        status: patch.publish === "draft" ? "draft" : "active",
        partner_id: partner.id,
        category_details: patch.categoryDetails || property.category_details || {},
      }, seedData);
    }
    return mutateState(seedData, (nextState) => {
      const target = nextState.tables.partnerProperties.find((item) => item.id === propertyId);
      if (!target) throw new Error("PROPERTY_NOT_FOUND");
      const category = window.ANIMA_DB.resolveCategoryMeta(patch.category || target.content_category || target.type || "hotel");
      const kind = window.ANIMA_DB.propertyKindFromValue(patch.type || target.type || category.id);
      target.partner_id = nextPartnerId || "";
      target.title = patch.title || target.title;
      target.description = patch.description ?? target.description;
      target.type = kind;
      target.property_type_id = kind;
      target.content_category = category.id;
      target.address = patch.address || target.address;
      target.location = patch.city || patch.address || target.location;
      target.photos = patch.photos ? [patch.photos] : target.photos;
      target.property_photos = target.photos;
      target.price = patch.price || target.price || "";
      target.status = patch.publish === "draft" ? "draft" : "active";
      target.moderation_status = patch.publish === "draft" ? "draft" : "approved";
      target.booking_model = kind === "hotel" ? "room_type" : "whole_property";
      target.category_details = patch.categoryDetails || target.category_details || {};
      target.updatedAt = now();
      return target;
    });
  }

  function togglePropertyPublish(propertyId, nextPublished, seedData = {}) {
    return mutateState(seedData, (state) => {
      const property = state.tables.partnerProperties.find((item) => item.id === propertyId);
      if (!property) throw new Error("PROPERTY_NOT_FOUND");
      property.status = nextPublished ? "active" : "draft";
      property.moderation_status = nextPublished ? "approved" : property.moderation_status;
      property.updatedAt = now();
    });
  }

  function assignPropertyPartner(propertyId, partnerId, seedData = {}) {
    return mutateState(seedData, (state) => {
      const property = state.tables.partnerProperties.find((item) => item.id === propertyId);
      if (!property) throw new Error("PROPERTY_NOT_FOUND");
      property.partner_id = partnerId;
      property.updatedAt = now();
    });
  }

  function deleteProperty(propertyId, seedData = {}) {
    return mutateState(seedData, (state) => {
      state.tables.partnerProperties = state.tables.partnerProperties.filter((item) => item.id !== propertyId);
      state.tables.partnerBookings = state.tables.partnerBookings.filter((item) => item.property_id !== propertyId);
      state.tables.reviews = state.tables.reviews.filter((item) => item.property_id !== propertyId);
      state.tables.auditLogs = state.tables.auditLogs.filter((item) => item.entityId !== propertyId);
    });
  }

  function bulkUpdateProperties(payload = {}, seedData = {}) {
    const ids = Array.isArray(payload.ids) ? payload.ids : [];
    if (!ids.length) return null;
    return mutateState(seedData, (state) => {
      ids.forEach((propertyId) => {
        const property = state.tables.partnerProperties.find((item) => item.id === propertyId);
        if (!property) return;
        if (payload.action === "publish") {
          property.status = "active";
          property.moderation_status = "approved";
        }
        if (payload.action === "unpublish") property.status = "draft";
        if (payload.action === "archive") property.status = "archived";
        if (payload.action === "delete") {
          state.tables.partnerProperties = state.tables.partnerProperties.filter((item) => item.id !== propertyId);
          return;
        }
        property.updatedAt = now();
      });
    });
  }

  function categoryBadge(categoryId = "") {
    const category = window.ANIMA_DB?.categoryCatalog?.().find((item) => item.id === String(categoryId || "").toLowerCase());
    if (!category) return "🏨 Объект";
    const base = category.label.replace(/и$/u, "ь");
    return `${category.emoji} ${base}`;
  }

  function resetPartnerAccess(partnerId, seedData = {}) {
    return window.ANIMA_DB.resetPartnerPassword(partnerId, undefined, seedData);
  }

  function deactivatePartner(partnerId, seedData = {}) {
    return window.ANIMA_DB.updatePartner(partnerId, { status: "blocked", actorUserId: "admin" }, seedData);
  }

  function mutateState(seedData, mutator) {
    const state = readState(seedData);
    mutator(state);
    state.updatedAt = now();
    writeState(state);
    return clone(state);
  }

  function exportCsv(data) {
    const objectLines = [
      ["Объект", "Локация", "Партнёр", "Тип", "Статус", "Бронирования", "Доход"],
      ...data.propertyRows.map((item) => [item.title, item.location, item.partnerName, item.type, item.status, item.bookingsCount, item.revenue]),
    ];
    const partnerLines = [
      ["Партнёр", "Владелец", "Статус", "Объекты", "Доход"],
      ...data.partnerCards.map((item) => [item.title, item.owner, item.status, item.propertyCount, item.revenue]),
    ];
    const csv = [
      "Объекты",
      ...objectLines.map((row) => row.map(escapeCsv).join(";")),
      "",
      "Партнёры",
      ...partnerLines.map((row) => row.map(escapeCsv).join(";")),
    ].join("\n");
    return csv;
  }

  function incomingRequests(seedData = {}) {
    const state = readState(seedData);
    const partners = new Map((state.tables.partners || []).map((item) => [item.id, item]));
    const properties = new Map((state.tables.partnerProperties || []).map((item) => [item.id, item]));
    const applications = (state.tables.partnerApplications || [])
      .filter((item) => item.status === "new")
      .map((item) => ({
        id: item.id,
        type: "partner_application",
        title: item.business_name || "Новая заявка партнёра",
        subtitle: item.full_name || item.email || "Без контакта",
        description: item.description || item.comment || "Заявка на подключение к ANIMA",
        createdAt: item.createdAt,
        status: item.status,
        raw: item,
      }));
    const moderation = (state.tables.moderationRequests || [])
      .filter((item) => item.status === "pending_review")
      .map((item) => ({
        id: item.id,
        type: "moderation_request",
        title: item.title || "Запрос на модерацию",
        subtitle: partners.get(item.partner_id)?.business_name || properties.get(item.entity_id)?.title || "Без привязки",
        description: item.entity_type === "property" ? "Новый объект или изменение объекта" : "Изменение по типу номера / размещению",
        createdAt: item.createdAt,
        status: item.status,
        raw: item,
      }));
    const support = (state.tables.supportTickets || [])
      .filter((item) => item.status === "new" || item.status === "in_progress")
      .map((item) => ({
        id: item.id,
        type: "support_ticket",
        title: item.title || "Тикет поддержки",
        subtitle: partners.get(item.partner_id)?.business_name || "Партнёр",
        description: item.message || "Обращение без текста",
        createdAt: item.createdAt,
        status: item.status,
        raw: item,
      }));
    return [...applications, ...moderation, ...support]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  function resolveIncomingRequest(payload = {}, seedData = {}) {
    if (payload.type === "moderation_request") {
      return window.ANIMA_DB.reviewModerationRequest(payload.id, {
        status: payload.action === "approve" ? "approved" : "rejected",
        adminComment: payload.comment || "",
        actorUserId: payload.actorUserId || "admin",
      }, seedData);
    }
    if (payload.type === "support_ticket") {
      return window.ANIMA_DB.updateSupportTicketStatus(payload.id, {
        status: payload.action === "approve" ? "closed" : "in_progress",
        adminComment: payload.comment || "",
        actorUserId: payload.actorUserId || "admin",
      }, seedData);
    }
    if (payload.type === "partner_application") {
      return mutateState(seedData, (state) => {
        const item = state.tables.partnerApplications.find((entry) => entry.id === payload.id);
        if (!item) throw new Error("PARTNER_APPLICATION_NOT_FOUND");
        item.status = payload.action === "approve" ? "approved" : "rejected";
        item.admin_comment = payload.comment || "";
        item.reviewedAt = now();
        item.updatedAt = now();
      });
    }
    throw new Error("UNKNOWN_REQUEST_TYPE");
  }

  function escapeCsv(value) {
    const text = String(value ?? "");
    if (/[;"\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
    return text;
  }

  window.ANIMA_OBJECTS_PARTNERS_SERVICE = {
    normalizeData,
    applyFilters,
    paginate,
    createPartner,
    createProperty,
    updateProperty,
    togglePropertyPublish,
    assignPropertyPartner,
    deleteProperty,
    bulkUpdateProperties,
    resetPartnerAccess,
    deactivatePartner,
    exportCsv,
    incomingRequests,
    resolveIncomingRequest,
    categoryBadge,
  };
})();
