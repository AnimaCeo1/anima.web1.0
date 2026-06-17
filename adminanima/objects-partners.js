const OBJECTS_SESSION_KEY = "anima.admin.session.v1";
const OBJECTS_CURRENCY_KEY = "anima.admin.currency";
const objectsSeedData = window.ANIMA_DATA || {};

const sidebarSectionsObjects = [
  {
    title: "Управление",
    items: [
      { id: "home", label: "Главная", icon: "home", href: "./dashboard.html" },
      { id: "objects", label: "Объекты и партнёры", icon: "building", href: "./objects-partners.html", active: true },
      { id: "requests", label: "Заявки на бронирование", icon: "clipboard", href: "./requests.html" },
      { id: "bookings", label: "Бронирования", icon: "calendar", href: "./bookings.html" },
      { id: "users", label: "Пользователи", icon: "users" },
      { id: "reviews", label: "Отзывы и рейтинг", icon: "star" },
    ],
  },
  {
    title: "Финансы",
    items: [
      { id: "cash", label: "Касса и платежи", icon: "wallet" },
      { id: "partner-payouts", label: "Выплаты партнёрам", icon: "banknote" },
      { id: "commissions", label: "Комиссии и правила", icon: "percent" },
    ],
  },
  {
    title: "Коммуникация",
    items: [
      { id: "chats", label: "Чаты", icon: "message" },
      { id: "mailings", label: "Рассылки и уведомления", icon: "mail" },
      { id: "support", label: "Поддержка", icon: "support" },
    ],
  },
  {
    title: "Контент",
    items: [
      { id: "pages", label: "Страницы и контент", icon: "file" },
      { id: "blog", label: "Блог и публикации", icon: "pen" },
    ],
  },
  {
    title: "Система",
    items: [
      { id: "settings", label: "Настройки", icon: "settings" },
      { id: "logs", label: "Журналы действий", icon: "history" },
      { id: "integrations", label: "Интеграции", icon: "nodes" },
    ],
  },
];

const state = {
  loading: true,
  error: "",
  currency: localStorage.getItem(OBJECTS_CURRENCY_KEY) || "RUB",
  filters: {
    search: "",
    status: "Все статусы",
    type: "Все типы",
    partner: "Все партнёры",
    category: "all",
  },
  objectPage: 1,
  partnerPage: 1,
  tab: "objects",
  data: null,
  selectedObjectIds: new Set(),
  detail: { type: "", id: "" },
};

const OBJECT_DETAIL_QUERY_KEY = "anima.admin.objects.detail.v1";
const CATEGORY_FIELDS = {
  hotel: [
    { name: "detail_rooms_overview", label: "Номера и категории", type: "textarea", placeholder: "Deluxe, Suite, Family..." },
    { name: "detail_amenities_overview", label: "Удобства объекта", type: "textarea", placeholder: "SPA, бассейн, ресторан..." },
    { name: "detail_checkin_policy", label: "Заезд / выезд", type: "text", placeholder: "Заезд после 14:00, выезд до 12:00" },
    { name: "detail_booking_notes", label: "Правила бронирования", type: "textarea", placeholder: "Предоплата, отмена, депозит..." },
  ],
  apartment: [
    { name: "detail_layout", label: "Планировка", type: "text", placeholder: "1 спальня, кухня-гостиная..." },
    { name: "detail_self_checkin", label: "Самостоятельное заселение", type: "text", placeholder: "Кодовый замок / консьерж" },
    { name: "detail_min_stay", label: "Минимальный срок", type: "text", placeholder: "От 2 ночей" },
    { name: "detail_apartment_features", label: "Особенности", type: "textarea", placeholder: "Вид, балкон, парковка..." },
  ],
  villa: [
    { name: "detail_bedrooms", label: "Спальни", type: "text", placeholder: "4 спальни" },
    { name: "detail_territory", label: "Территория", type: "textarea", placeholder: "Сад, бассейн, BBQ..." },
    { name: "detail_staff", label: "Персонал", type: "text", placeholder: "Уборка, повар, охрана" },
    { name: "detail_villa_terms", label: "Условия бронирования", type: "textarea", placeholder: "Депозит, правила вечеринок..." },
  ],
  cafe: [
    { name: "detail_location_name", label: "Название локации", type: "text", placeholder: "Anima Coffee Tuyen Lam" },
    { name: "detail_menu", label: "Меню", type: "textarea", placeholder: "Кофе, десерты, завтраки..." },
    { name: "detail_working_hours", label: "Часы работы", type: "text", placeholder: "08:00 - 22:00" },
    { name: "detail_anima_coins", label: "ANIMA Coin на счёт", type: "number", placeholder: "50" },
  ],
  restaurant: [
    { name: "detail_cuisine", label: "Кухня", type: "text", placeholder: "Итальянская, азиатская..." },
    { name: "detail_menu", label: "Меню", type: "textarea", placeholder: "Основные блюда, бар, десерты..." },
    { name: "detail_table_booking", label: "Бронь столиков", type: "text", placeholder: "Да / нет / по депозиту" },
    { name: "detail_average_bill", label: "Средний чек", type: "text", placeholder: "1,200,000 VND" },
  ],
  tour: [
    { name: "detail_route", label: "Маршрут", type: "textarea", placeholder: "Точки маршрута..." },
    { name: "detail_duration", label: "Продолжительность", type: "text", placeholder: "6 часов / 2 дня" },
    { name: "detail_event_date", label: "Дата проведения", type: "text", placeholder: "Ежедневно / по субботам" },
    { name: "detail_tour_price", label: "Цена", type: "text", placeholder: "2,500,000 VND" },
  ],
  entertainment: [
    { name: "detail_format", label: "Формат", type: "text", placeholder: "Квест, шоу, концерт..." },
    { name: "detail_age", label: "Возраст", type: "text", placeholder: "12+" },
    { name: "detail_schedule", label: "Расписание", type: "text", placeholder: "Пт-Вс, 18:00" },
    { name: "detail_price", label: "Цена", type: "text", placeholder: "900,000 VND" },
  ],
  relax: [
    { name: "detail_program", label: "Программа", type: "textarea", placeholder: "Массаж, чайная церемония..." },
    { name: "detail_duration", label: "Длительность", type: "text", placeholder: "90 минут" },
    { name: "detail_included", label: "Что включено", type: "textarea", placeholder: "Полотенца, напитки..." },
    { name: "detail_price", label: "Цена", type: "text", placeholder: "1,100,000 VND" },
  ],
  service: [
    { name: "detail_service_description", label: "Описание услуги", type: "textarea", placeholder: "Трансфер, аренда авто, гид..." },
    { name: "detail_service_cost", label: "Стоимость", type: "text", placeholder: "от 700,000 VND" },
    { name: "detail_service_area", label: "Зона работы", type: "text", placeholder: "Da Lat / весь регион" },
    { name: "detail_service_contacts", label: "Контакты", type: "text", placeholder: "Телефон, Telegram..." },
  ],
  vacancy: [
    { name: "detail_salary", label: "Зарплата", type: "text", placeholder: "от 18,000,000 VND" },
    { name: "detail_schedule", label: "График", type: "text", placeholder: "2/2, полный день" },
    { name: "detail_requirements", label: "Требования", type: "textarea", placeholder: "Опыт, языки, навыки..." },
    { name: "detail_contacts", label: "Контакты", type: "text", placeholder: "HR Telegram / телефон" },
  ],
};

document.addEventListener("DOMContentLoaded", () => {
  if (!ensureObjectsSession()) return;
  window.ANIMA_DB?.ensure?.(objectsSeedData);
  renderObjectsSidebar();
  bindObjectsShell();
  loadObjectsPage();
});

function ensureObjectsSession() {
  try {
    const session = JSON.parse(sessionStorage.getItem(OBJECTS_SESSION_KEY) || "null");
    if (!session?.username || !session?.expiresAt || session.expiresAt < Date.now()) {
      location.replace("./");
      return false;
    }
    return true;
  } catch {
    location.replace("./");
    return false;
  }
}

function currentObjectsSession() {
  try {
    return JSON.parse(sessionStorage.getItem(OBJECTS_SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

function bindObjectsShell() {
  const sidebar = document.querySelector("[data-sidebar]");
  const shell = document.querySelector(".dashboard-home-shell");
  document.querySelectorAll("[data-sidebar-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      sidebar?.classList.toggle("is-collapsed");
      shell?.classList.toggle("sidebar-collapsed");
    });
  });

  document.addEventListener("click", handleObjectsClick);
  document.addEventListener("change", handleObjectsChange);
  document.addEventListener("input", handleObjectsInput);
}

function handleObjectsClick(event) {
  const navButton = event.target.closest("[data-nav-item]");
  if (navButton) {
    if (navButton.dataset.navHref) {
      location.assign(navButton.dataset.navHref);
      return;
    }
    showObjectsToast(`Раздел «${navButton.dataset.navLabel}» подготовим следующим экраном.`);
    return;
  }

  if (event.target.closest("[data-add-object]")) {
    openObjectCreateModal();
    return;
  }
  if (event.target.closest("[data-open-incoming]")) {
    openIncomingRequestsModal();
    return;
  }
  if (event.target.closest("[data-add-partner]")) {
    openPartnerCreateModal();
    return;
  }
  if (event.target.closest("[data-reset-filters]")) {
    state.filters = { search: "", status: "Все статусы", type: "Все типы", partner: "Все партнёры", category: "all" };
    state.objectPage = 1;
    state.partnerPage = 1;
    renderObjectsPage();
    return;
  }
  if (event.target.closest("[data-open-filters]")) {
    showObjectsToast("Фильтры применяются сразу по всем полям.");
    return;
  }
  if (event.target.closest("[data-export]")) {
    exportObjectsData();
    return;
  }
  if (event.target.closest("[data-logout-button]")) {
    sessionStorage.removeItem(OBJECTS_SESSION_KEY);
    location.replace("./");
    return;
  }
  if (event.target.closest("[data-view-all-partners]") || event.target.closest("[data-view-all-partners-bottom]")) {
    document.querySelector(".partners-side-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  const objectPageButton = event.target.closest("[data-page-object]");
  if (objectPageButton) {
    state.objectPage = Number(objectPageButton.dataset.pageObject);
    renderObjectsTable();
    return;
  }

  const openObjectButton = event.target.closest("[data-open-object]");
  if (openObjectButton) {
    const item = state.data?.propertyRows.find((row) => row.id === openObjectButton.dataset.openObject);
    setDetail("object", item?.id);
    return;
  }

  const menuObjectButton = event.target.closest("[data-menu-object]");
  if (menuObjectButton) {
    const item = state.data?.propertyRows.find((row) => row.id === menuObjectButton.dataset.menuObject);
    openObjectMenu(item);
    return;
  }

  const managePartnerButton = event.target.closest("[data-manage-partner]");
  if (managePartnerButton) {
    const item = state.data?.partnerCards.find((row) => row.id === managePartnerButton.dataset.managePartner);
    setDetail("partner", item?.id);
  }

  const categoryTab = event.target.closest("[data-category-tab]");
  if (categoryTab) {
    state.filters.category = categoryTab.dataset.categoryTab;
    state.objectPage = 1;
    renderObjectsPage();
    return;
  }

  const bulkAction = event.target.closest("[data-bulk-action]");
  if (bulkAction) {
    runBulkAction(bulkAction.dataset.bulkAction);
    return;
  }

  const requestButton = event.target.closest("[data-open-request-detail]");
  if (requestButton) {
    setDetail("request", requestButton.dataset.openRequestDetail);
    return;
  }

  const clearDetail = event.target.closest("[data-clear-detail]");
  if (clearDetail) {
    setDetail("", "");
    return;
  }

  const resetAccess = event.target.closest("[data-reset-partner-access]");
  if (resetAccess) {
    window.ANIMA_OBJECTS_PARTNERS_SERVICE.resetPartnerAccess(resetAccess.dataset.resetPartnerAccess, objectsSeedData);
    showObjectsToast("Доступ партнёра сброшен. Временный пароль: Anima2026.");
    return;
  }

  const deactivatePartner = event.target.closest("[data-deactivate-partner-detail]");
  if (deactivatePartner) {
    window.ANIMA_OBJECTS_PARTNERS_SERVICE.deactivatePartner(deactivatePartner.dataset.deactivatePartnerDetail, objectsSeedData);
    loadObjectsPage();
    return;
  }

  const rejectInline = event.target.closest("[data-inline-request-reject]");
  if (rejectInline) {
    const form = event.target.closest("[data-inline-incoming-form]");
    const requestId = rejectInline.dataset.inlineRequestReject;
    const item = window.ANIMA_OBJECTS_PARTNERS_SERVICE.incomingRequests(objectsSeedData).find((row) => row.id === requestId);
    if (item) resolveIncoming(item, "reject", String(new FormData(form).get("comment") || ""));
    return;
  }
}

function handleObjectsChange(event) {
  if (event.target.matches("[data-filter-status]")) {
    state.filters.status = event.target.value;
    state.objectPage = 1;
    state.partnerPage = 1;
    renderObjectsPage();
    return;
  }
  if (event.target.matches("[data-filter-type]")) {
    state.filters.type = event.target.value;
    state.objectPage = 1;
    renderObjectsPage();
    return;
  }
  if (event.target.matches("[data-filter-partner]")) {
    state.filters.partner = event.target.value;
    state.objectPage = 1;
    state.partnerPage = 1;
    renderObjectsPage();
    return;
  }
  if (event.target.matches("[data-object-select]")) {
    if (event.target.checked) state.selectedObjectIds.add(event.target.value);
    else state.selectedObjectIds.delete(event.target.value);
    renderBulkToolbar();
    return;
  }
  if (event.target.matches("[data-select-all-objects]")) {
    const filtered = window.ANIMA_OBJECTS_PARTNERS_SERVICE.applyFilters(state.data, state.filters);
    state.selectedObjectIds = event.target.checked ? new Set(filtered.properties.map((item) => item.id)) : new Set();
    renderObjectsTable();
    renderBulkToolbar();
    return;
  }
  if (event.target.matches("[data-objects-currency]")) {
    state.currency = event.target.value;
    localStorage.setItem(OBJECTS_CURRENCY_KEY, state.currency);
    renderObjectsPage();
  }
}

function handleObjectsInput(event) {
  if (event.target.matches("[data-global-search], [data-filter-search]")) {
    state.filters.search = event.target.value;
    const global = document.querySelector("[data-global-search]");
    const local = document.querySelector("[data-filter-search]");
    if (global && global !== event.target) global.value = event.target.value;
    if (local && local !== event.target) local.value = event.target.value;
    state.objectPage = 1;
    state.partnerPage = 1;
    renderObjectsPage();
  }
}

document.addEventListener("submit", (event) => {
  const form = event.target.closest("[data-inline-incoming-form]");
  if (!form) return;
  event.preventDefault();
  const item = window.ANIMA_OBJECTS_PARTNERS_SERVICE.incomingRequests(objectsSeedData).find((row) => row.id === state.detail.id);
  if (item) resolveIncoming(item, "approve", String(new FormData(form).get("comment") || ""));
});

function loadObjectsPage() {
  state.loading = true;
  state.error = "";
  hydrateDetailFromQuery();
  renderObjectsPage();
  try {
    state.data = window.ANIMA_OBJECTS_PARTNERS_SERVICE.normalizeData(objectsSeedData);
    state.loading = false;
    renderObjectsPage();
  } catch (error) {
    state.loading = false;
    state.error = error?.message || "Не удалось загрузить данные.";
    renderObjectsPage();
  }
}

function renderObjectsSidebar() {
  const nav = document.querySelector("[data-sidebar-nav]");
  if (!nav) return;
  nav.innerHTML = sidebarSectionsObjects.map((section) => `
    <section class="sidebar-group">
      <h3>${section.title}</h3>
      <div class="sidebar-links">
        ${section.items.map((item) => `
          <button type="button" class="sidebar-link ${item.active ? "is-active" : ""}" data-nav-item="${item.id}" data-nav-label="${item.label}" ${item.href ? `data-nav-href="${item.href}"` : ""}>
            <span class="sidebar-link-icon">${objectsIcon(item.icon)}</span>
            <span class="sidebar-link-label">${item.label}</span>
            ${item.id === "requests" ? `<span class="sidebar-link-badge">${requestCountBadge()}</span>` : ""}
          </button>
        `).join("")}
      </div>
    </section>
  `).join("");
}

function renderObjectsPage() {
  if (state.data) {
    const filtered = window.ANIMA_OBJECTS_PARTNERS_SERVICE.applyFilters(state.data, state.filters);
    if (state.detail.type === "object" && !filtered.properties.some((item) => item.id === state.detail.id)) {
      state.detail = { type: "", id: "" };
      sessionStorage.removeItem(OBJECT_DETAIL_QUERY_KEY);
    }
    if (state.detail.type === "partner" && !filtered.partners.some((item) => item.id === state.detail.id)) {
      state.detail = { type: "", id: "" };
      sessionStorage.removeItem(OBJECT_DETAIL_QUERY_KEY);
    }
  }
  renderObjectsTopbar();
  renderFilterOptions();
  renderCategoryTabs();
  renderKpis();
  renderObjectsTable();
  renderPartnersList();
  renderModeration();
  renderBulkToolbar();
  renderDetailPanel();
  renderDraftsPanel();
}

function renderObjectsTopbar() {
  const topbar = document.querySelector("[data-topbar-right]");
  if (!topbar || !state.data) return;
  const session = currentObjectsSession();
  topbar.innerHTML = `
    <label class="currency-switch">
      <span class="currency-switch-label">Валюта</span>
      <select data-objects-currency>
        ${(state.data.state.settings.currencies || ["VND", "USD", "EUR", "RUB", "UAH"]).map((code) => `<option value="${code}" ${code === state.currency ? "selected" : ""}>${code}</option>`).join("")}
      </select>
    </label>
    <button type="button" class="profile-button" data-logout-button>
      <span class="profile-avatar">${objectsIcon("user-fill")}</span>
      <span class="profile-copy">
        <strong>${escapeObjectsHtml(session?.username || "ADMIN_ANIMA1")}</strong>
        <small>Super Admin</small>
      </span>
      <span class="profile-chevron">${objectsIcon("chevron")}</span>
    </button>
  `;
}

function renderFilterOptions() {
  if (!state.data) return;
  const fields = [
    ["[data-filter-status]", state.data.filters.statusOptions, state.filters.status],
    ["[data-filter-type]", state.data.filters.typeOptions, state.filters.type],
    ["[data-filter-partner]", state.data.filters.partnerOptions, state.filters.partner],
  ];
  fields.forEach(([selector, options, selected]) => {
    const select = document.querySelector(selector);
    if (!select) return;
    select.innerHTML = options.map((option) => `<option value="${option}" ${option === selected ? "selected" : ""}>${option}</option>`).join("");
  });
  document.querySelector("[data-filter-search]").value = state.filters.search;
}

function renderCategoryTabs() {
  const node = document.querySelector("[data-category-tabs]");
  if (!node || !state.data) return;
  node.innerHTML = state.data.filters.categoryTabs.map((item) => `
    <button
      type="button"
      class="${state.filters.category === item.id ? "active" : ""}"
      data-category-tab="${item.id}"
    >${item.emoji ? `<span>${item.emoji}</span>` : ""}${escapeObjectsHtml(item.label)}</button>
  `).join("");
}

function renderKpis() {
  const node = document.querySelector("[data-objects-kpis]");
  if (!node) return;
  if (state.loading) {
    node.innerHTML = repeatCards(5);
    return;
  }
  if (state.error) {
    node.innerHTML = `<div class="notification-empty">${escapeObjectsHtml(state.error)}</div>`;
    return;
  }
  const kpi = state.data.kpis;
  const cards = [
    { title: "Всего объектов", value: kpi.totalObjects, hint: monthlyDelta(state.data.propertyRows.length), tone: "blue", icon: "clipboard-badge" },
    { title: "Активные объекты", value: kpi.activeObjects, hint: percentHint(kpi.activeObjects, kpi.totalObjects), tone: "green", icon: "buildings" },
    { title: "Всего партнёров", value: kpi.totalPartners, hint: monthlyDelta(state.data.partnerCards.length), tone: "violet", icon: "users" },
    { title: "Активные партнёры", value: kpi.activePartners, hint: percentHint(kpi.activePartners, kpi.totalPartners), tone: "green", icon: "support" },
    { title: "Новые заявки", value: kpi.newRequests, hint: kpi.newRequests ? "Требуют внимания" : "Новых заявок нет", tone: "red", icon: "calendar" },
  ];
  node.innerHTML = cards.map((item) => `
    <article class="kpi-card tone-${item.tone}">
      <div class="kpi-copy">
        <span class="kpi-title">${item.title}</span>
        <strong class="kpi-value">${item.value}</strong>
        <div class="kpi-meta-row"><span class="kpi-meta">${item.hint}</span></div>
      </div>
      <div class="kpi-side"><span class="kpi-icon">${objectsIcon(item.icon)}</span></div>
    </article>
  `).join("");
}

function renderObjectsTable() {
  const stateNode = document.querySelector("[data-objects-state]");
  const wrap = document.querySelector("[data-objects-table-wrap]");
  const table = document.querySelector("[data-objects-table]");
  const footer = document.querySelector("[data-objects-footer]");
  if (!stateNode || !wrap || !table || !footer) return;
  if (state.loading) {
    stateNode.innerHTML = `<div class="notification-empty">Загрузка объектов...</div>`;
    wrap.hidden = true;
    table.innerHTML = "";
    footer.innerHTML = "";
    return;
  }
  if (state.error) {
    stateNode.innerHTML = `<div class="notification-empty">${escapeObjectsHtml(state.error)}</div>`;
    wrap.hidden = true;
    table.innerHTML = "";
    footer.innerHTML = "";
    return;
  }
  const filtered = window.ANIMA_OBJECTS_PARTNERS_SERVICE.applyFilters(state.data, state.filters);
  const page = window.ANIMA_OBJECTS_PARTNERS_SERVICE.paginate(filtered.properties, state.objectPage, 5);
  state.objectPage = page.page;
  if (!page.total) {
    stateNode.innerHTML = `<div class="notification-empty">По текущим фильтрам объекты не найдены.</div>`;
    wrap.hidden = true;
    table.innerHTML = "";
    footer.innerHTML = "";
    return;
  }
  stateNode.innerHTML = "";
  wrap.hidden = false;
  table.innerHTML = `
    <div class="objects-table-head">
      <span><input type="checkbox" data-select-all-objects ${page.items.every((item) => state.selectedObjectIds.has(item.id)) ? "checked" : ""} /></span>
      <span>Объект</span>
      <span>Партнёр</span>
      <span>Категория</span>
      <span>Статус</span>
      <span>Бронирования</span>
      <span>Доход</span>
      <span>Действия</span>
    </div>
    ${page.items.map((item) => `
      <article class="objects-table-row">
        <span><input type="checkbox" data-object-select value="${item.id}" ${state.selectedObjectIds.has(item.id) ? "checked" : ""} /></span>
        <div class="object-cell-main">
          <span class="object-photo" style="${item.photo ? `background-image:url('${item.photo}')` : ""}"></span>
          <div class="object-cell-copy">
            <strong>${escapeObjectsHtml(item.title)}</strong>
            <small>${escapeObjectsHtml(item.location)}</small>
          </div>
        </div>
        <span>${escapeObjectsHtml(item.partnerName)}</span>
        <span>${renderCategoryBadge(item.categoryId, item.categoryBadge)}</span>
        <span><i class="status-badge ${item.statusTone}">${escapeObjectsHtml(item.status)}</i></span>
        <span>${item.bookingsCount}<small>в выбранном периоде</small></span>
        <span>${formatObjectsMoney(item.revenue)}<small class="${item.revenueChange >= 0 ? "text-positive" : "text-negative"}">${formatChange(item.revenueChange)}</small></span>
        <div class="row-actions">
          <button type="button" class="row-icon-button row-emoji-button" data-open-object="${item.id}" title="Смотреть детали">👁</button>
          <button type="button" class="row-icon-button" data-menu-object="${item.id}" title="Действия">${objectsIcon("dots")}</button>
        </div>
      </article>
    `).join("")}
  `;
  footer.innerHTML = `
    <span>Показано ${page.start}-${page.end} из ${page.total} объектов</span>
    <div class="pagination">${renderPagination(page.page, page.pages, "object")}</div>
  `;
}

function renderPartnersList() {
  const stateNode = document.querySelector("[data-partners-state]");
  const list = document.querySelector("[data-partners-list]");
  const footer = document.querySelector("[data-partners-footer]");
  if (!stateNode || !list || !footer) return;
  if (state.loading) {
    stateNode.innerHTML = `<div class="notification-empty">Загрузка партнёров...</div>`;
    list.innerHTML = "";
    footer.textContent = "";
    return;
  }
  if (state.error) {
    stateNode.innerHTML = `<div class="notification-empty">${escapeObjectsHtml(state.error)}</div>`;
    list.innerHTML = "";
    footer.textContent = "";
    return;
  }
  const filtered = window.ANIMA_OBJECTS_PARTNERS_SERVICE.applyFilters(state.data, state.filters);
  const page = window.ANIMA_OBJECTS_PARTNERS_SERVICE.paginate(filtered.partners, state.partnerPage, 5);
  state.partnerPage = page.page;
  if (!page.total) {
    stateNode.innerHTML = `<div class="notification-empty">Партнёры по текущим фильтрам не найдены.</div>`;
    list.innerHTML = "";
    footer.textContent = "";
    return;
  }
  stateNode.innerHTML = "";
  list.innerHTML = page.items.map((item) => `
    <article class="partner-side-row">
      <div class="partner-side-main">
        <span class="partner-avatar">${escapeObjectsHtml(item.avatar)}</span>
        <div class="partner-side-copy">
          <strong>${escapeObjectsHtml(item.title)}</strong>
          <small>Владелец: ${escapeObjectsHtml(item.owner)}</small>
          <small>${item.propertyCount} объектов</small>
        </div>
      </div>
      <div class="partner-side-meta">
        <span class="partner-side-status ${item.statusTone}">${escapeObjectsHtml(item.status)}</span>
        <span class="partner-side-revenue ${item.revenueChange >= 0 ? "text-positive" : "text-negative"}">${formatChange(item.revenueChange)} доход</span>
        <button type="button" class="partner-manage-button" data-manage-partner="${item.id}">Открыть профиль <span>⌄</span></button>
      </div>
    </article>
  `).join("");
  footer.textContent = `Показано ${page.start}-${page.end} из ${page.total} партнёров`;
}

function renderBulkToolbar() {
  const node = document.querySelector("[data-bulk-toolbar]");
  if (!node) return;
  const count = state.selectedObjectIds.size;
  if (!count) {
    node.hidden = true;
    node.innerHTML = "";
    return;
  }
  node.hidden = false;
  node.innerHTML = `
    <div class="bulk-toolbar-copy">
      <strong>Выбрано объектов: ${count}</strong>
      <span>Массовые действия применяются сразу ко всем выбранным карточкам.</span>
    </div>
    <div class="bulk-toolbar-actions">
      <button type="button" data-bulk-action="publish">Опубликовать</button>
      <button type="button" data-bulk-action="unpublish">Снять с публикации</button>
      <button type="button" data-bulk-action="archive">В архив</button>
      <button type="button" data-bulk-action="delete" class="danger">Удалить</button>
    </div>
  `;
}

function renderDetailPanel() {
  const title = document.querySelector("[data-detail-title]");
  const clearButton = document.querySelector("[data-clear-detail]");
  const node = document.querySelector("[data-entity-detail]");
  if (!title || !clearButton || !node || !state.data) return;
  const { type, id } = state.detail;
  if (!type || !id) {
    title.textContent = "Детали";
    clearButton.hidden = true;
    node.innerHTML = `<div class="notification-empty">Выберите объект, партнёра или заявку, чтобы открыть полноценную карточку деталей.</div>`;
    return;
  }
  clearButton.hidden = false;
  if (type === "object") {
    const item = state.data.propertyRows.find((row) => row.id === id);
    if (!item) return;
    title.textContent = item.title;
    node.innerHTML = renderObjectDetail(item);
    return;
  }
  if (type === "partner") {
    const item = state.data.partnerCards.find((row) => row.id === id);
    if (!item) return;
    title.textContent = item.title;
    node.innerHTML = renderPartnerDetail(item);
    return;
  }
  if (type === "request") {
    const item = window.ANIMA_OBJECTS_PARTNERS_SERVICE.incomingRequests(objectsSeedData).find((row) => row.id === id);
    if (!item) return;
    title.textContent = item.title;
    node.innerHTML = renderRequestDetail(item);
  }
}

function renderDraftsPanel() {
  const node = document.querySelector("[data-drafts-panel]");
  if (!node || !state.data) return;
  const drafts = state.data.propertyRows.filter((item) => item.property.status === "draft" || item.property.moderation_status === "draft");
  node.innerHTML = drafts.length ? drafts.slice(0, 8).map((item) => `
    <button type="button" class="draft-row" data-open-object="${item.id}">
      <div>
        <strong>${escapeObjectsHtml(item.title)}</strong>
        <small>${escapeObjectsHtml(item.partnerName)} · ${escapeObjectsHtml(item.type)}</small>
      </div>
      ${renderCategoryBadge(item.categoryId, item.categoryBadge)}
    </button>
  `).join("") : `<div class="notification-empty">Черновиков пока нет.</div>`;
}

function renderModeration() {
  const node = document.querySelector("[data-moderation-stats]");
  if (!node) return;
  if (state.loading || state.error || !state.data) {
    node.innerHTML = `<div class="notification-empty">${state.loading ? "Загрузка..." : "Нет данных."}</div>`;
    return;
  }
  node.innerHTML = `
    <div class="moderation-row"><span>Новые объекты</span><strong>${state.data.moderation.newObjects}</strong></div>
    <div class="moderation-row"><span>Партнёры на рассмотрении</span><strong>${state.data.moderation.pendingPartners}</strong></div>
  `;
}

function openObjectCreateModal() {
  const partners = state.data?.partnerCards || [];
  openObjectsModal("Добавить объект", `
    <form class="objects-form" data-object-form>
      <label><span>Категория</span><select name="category" required>${categoryOptions()}</select></label>
      <label><span>Название</span><input name="title" required /></label>
      <label><span>Описание</span><textarea name="description" required></textarea></label>
      <label><span>Тип</span><input name="type" placeholder="hotel / apartment / villa" required /></label>
      <label><span>Город / адрес</span><input name="address" required /></label>
      <label class="full"><span>Фотографии</span>${mediaUploaderMarkup("object-photos")}</label>
      <label><span>Фото URL / data URI</span><textarea name="photos" data-upload-output="object-photos"></textarea></label>
      <label><span>Цена</span><input name="price" /></label>
      <label><span>Партнёр</span><select name="partnerId"><option value="">Без партнёра</option>${partners.map((item) => `<option value="${item.id}">${escapeObjectsHtml(item.title)}</option>`).join("")}</select></label>
      <label><span>Статус публикации</span><select name="publish"><option value="draft">Сохранить как черновик</option><option value="published">Опубликовать</option></select></label>
      <div class="category-dynamic-fields" data-category-fields></div>
      <div class="objects-form-actions"><button type="submit">Сохранить</button></div>
    </form>
  `, (modal) => {
    bindMediaUploader(modal, "object-photos");
    bindCategoryDynamicFields(modal.querySelector("[name='category']"), modal.querySelector("[data-category-fields]"));
    modal.querySelector("[data-object-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const form = Object.fromEntries(new FormData(event.currentTarget).entries());
      form.categoryDetails = extractCategoryDetails(form);
      try {
        window.ANIMA_OBJECTS_PARTNERS_SERVICE.createProperty(form, objectsSeedData);
        closeObjectsModal();
        loadObjectsPage();
        showObjectsToast("Объект сохранён.");
      } catch (error) {
        showObjectsToast(error.message || "Не удалось создать объект.");
      }
    });
  });
}

function openPartnerCreateModal() {
  openObjectsModal("Добавить партнёра", `
    <form class="objects-form" data-partner-form>
      <label><span>Имя / название</span><input name="name" required /></label>
      <label><span>Email</span><input name="email" type="email" /></label>
      <label><span>Телефон</span><input name="phone" /></label>
      <label><span>Компания</span><input name="company" required /></label>
      <label><span>Роль партнёра</span><input name="role" placeholder="hotel / apartment / other" /></label>
      <label><span>Статус</span><select name="status"><option value="pending">На рассмотрении</option><option value="active">Активен</option><option value="blocked">Отключён</option></select></label>
      <label><span>Владелец</span><input name="owner" /></label>
      <div class="objects-form-actions"><button type="submit">Создать учётку</button></div>
    </form>
  `, (modal) => {
    modal.querySelector("[data-partner-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      try {
        const form = Object.fromEntries(new FormData(event.currentTarget).entries());
        window.ANIMA_OBJECTS_PARTNERS_SERVICE.createPartner(form, objectsSeedData);
        closeObjectsModal();
        loadObjectsPage();
        showObjectsToast("Партнёр создан.");
      } catch (error) {
        showObjectsToast(error.message || "Не удалось создать партнёра.");
      }
    });
  });
}

function openObjectDetailModal(item) {
  if (!item) return;
  setDetail("object", item.id);
}

function openObjectAnalyticsModal(item) {
  if (!item) return;
  openObjectsModal(`Аналитика: ${item.title}`, `
    <div class="analytics-grid">
      <div><span>Бронирования</span><strong>${item.bookingsCount}</strong></div>
      <div><span>Доход</span><strong>${formatObjectsMoney(item.revenue)}</strong></div>
      <div><span>Изменение</span><strong class="${item.revenueChange >= 0 ? "text-positive" : "text-negative"}">${formatChange(item.revenueChange)}</strong></div>
    </div>
    <div class="detail-list">
      <h3>Бронирования объекта</h3>
      ${item.bookings.length ? item.bookings.map((booking) => `<p>${shortObjectBooking(booking.id)} · ${escapeObjectsHtml(booking.customer_name || "Клиент")} · ${formatObjectsMoney(booking.total_amount || 0)}</p>`).join("") : "<p>Бронирований пока нет.</p>"}
    </div>
  `);
}

function openObjectMenu(item) {
  if (!item) return;
  openObjectsModal(`Действия: ${item.title}`, `
    <div class="detail-list action-list">
      <button type="button" data-edit-object>Редактировать</button>
      <button type="button" data-object-details>Смотреть детали объекта</button>
      <button type="button" data-object-analytics>Посмотреть аналитику</button>
      <button type="button" data-toggle-object>${item.property.status === "active" ? "Снять с публикации" : "Опубликовать"}</button>
      <button type="button" data-assign-partner>Назначить партнёра</button>
      <button type="button" data-view-bookings>Посмотреть бронирования</button>
      <button type="button" data-delete-object class="danger">Удалить</button>
    </div>
  `, (modal) => {
    modal.querySelector("[data-edit-object]")?.addEventListener("click", () => openObjectEditModal(item));
    modal.querySelector("[data-object-details]")?.addEventListener("click", () => openObjectDetailModal(item));
    modal.querySelector("[data-object-analytics]")?.addEventListener("click", () => openObjectAnalyticsModal(item));
    modal.querySelector("[data-toggle-object]")?.addEventListener("click", () => {
      window.ANIMA_OBJECTS_PARTNERS_SERVICE.togglePropertyPublish(item.id, item.property.status !== "active", objectsSeedData);
      closeObjectsModal();
      loadObjectsPage();
    });
    modal.querySelector("[data-assign-partner]")?.addEventListener("click", () => openAssignPartnerModal(item));
    modal.querySelector("[data-view-bookings]")?.addEventListener("click", () => openObjectAnalyticsModal(item));
    modal.querySelector("[data-delete-object]")?.addEventListener("click", () => {
      window.ANIMA_OBJECTS_PARTNERS_SERVICE.deleteProperty(item.id, objectsSeedData);
      closeObjectsModal();
      loadObjectsPage();
    });
  });
}

function openObjectEditModal(item) {
  const partners = state.data?.partnerCards || [];
  const detailValues = item.property?.category_details || {};
  openObjectsModal(`Редактировать: ${item.title}`, `
    <form class="objects-form" data-object-edit-form>
      <label><span>Категория</span><select name="category" required>${categoryOptions(item.categoryId)}</select></label>
      <label><span>Название</span><input name="title" value="${escapeObjectsHtml(item.title)}" required /></label>
      <label><span>Описание</span><textarea name="description">${escapeObjectsHtml(item.property.description || "")}</textarea></label>
      <label><span>Тип</span><input name="type" value="${escapeObjectsHtml(item.rawType)}" required /></label>
      <label><span>Город / адрес</span><input name="address" value="${escapeObjectsHtml(item.property.address || item.location)}" required /></label>
      <label class="full"><span>Фотографии</span>${mediaUploaderMarkup(`object-edit-${item.id}`)}</label>
      <label><span>Фото URL / data URI</span><textarea name="photos" data-upload-output="object-edit-${item.id}">${escapeObjectsHtml(item.photo || "")}</textarea></label>
      <label><span>Цена</span><input name="price" value="${escapeObjectsHtml(item.property.price || "")}" /></label>
      <label><span>Партнёр</span><select name="partnerId"><option value="">Без партнёра</option>${partners.map((partner) => `<option value="${partner.id}" ${partner.id === item.partnerId ? "selected" : ""}>${escapeObjectsHtml(partner.title)}</option>`).join("")}</select></label>
      <label><span>Статус публикации</span><select name="publish"><option value="draft" ${item.property.status !== "active" ? "selected" : ""}>Черновик</option><option value="published" ${item.property.status === "active" ? "selected" : ""}>Опубликован</option></select></label>
      <div class="category-dynamic-fields" data-category-fields></div>
      <div class="objects-form-actions"><button type="submit">Сохранить</button></div>
    </form>
  `, (modal) => {
    bindMediaUploader(modal, `object-edit-${item.id}`);
    bindCategoryDynamicFields(modal.querySelector("[name='category']"), modal.querySelector("[data-category-fields]"), detailValues);
    modal.querySelector("[data-object-edit-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const form = Object.fromEntries(new FormData(event.currentTarget).entries());
      form.categoryDetails = extractCategoryDetails(form);
      window.ANIMA_OBJECTS_PARTNERS_SERVICE.updateProperty(item.id, form, objectsSeedData);
      closeObjectsModal();
      loadObjectsPage();
    });
  });
}

function openAssignPartnerModal(item) {
  const partners = state.data?.partnerCards || [];
  openObjectsModal(`Назначить партнёра: ${item.title}`, `
    <form class="objects-form" data-assign-form>
      <label><span>Партнёр</span><select name="partnerId">${partners.map((partner) => `<option value="${partner.id}" ${partner.id === item.partnerId ? "selected" : ""}>${escapeObjectsHtml(partner.title)}</option>`).join("")}</select></label>
      <div class="objects-form-actions"><button type="submit">Назначить</button></div>
    </form>
  `, (modal) => {
    modal.querySelector("[data-assign-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const form = Object.fromEntries(new FormData(event.currentTarget).entries());
      window.ANIMA_OBJECTS_PARTNERS_SERVICE.assignPropertyPartner(item.id, form.partnerId, objectsSeedData);
      closeObjectsModal();
      loadObjectsPage();
    });
  });
}

function openPartnerMenu(item) {
  if (!item) return;
  setDetail("partner", item.id);
}

function openPartnerDetailModal(item) {
  if (!item) return;
  setDetail("partner", item.id);
}

function exportObjectsData() {
  if (!state.data) return;
  const csv = window.ANIMA_OBJECTS_PARTNERS_SERVICE.exportCsv(state.data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "anima-objects-partners.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function openIncomingRequestsModal() {
  const items = window.ANIMA_OBJECTS_PARTNERS_SERVICE.incomingRequests(objectsSeedData);
  openObjectsModal("Входящие запросы", `
    <div class="incoming-requests-list">
      ${items.length ? items.map((item) => `
        <button type="button" class="incoming-request-row" data-open-request-detail="${item.id}">
          <div>
            <strong>${escapeObjectsHtml(item.title)}</strong>
            <small>${escapeObjectsHtml(item.subtitle)}</small>
          </div>
          <span>${requestTypeLabel(item.type)}</span>
        </button>
      `).join("") : `<div class="notification-empty">Нет запросов, требующих решения.</div>`}
    </div>
  `);
}

function openIncomingRequestDetail(item) {
  setDetail("request", item.id);
}

function resolveIncoming(item, action, comment) {
  try {
    window.ANIMA_OBJECTS_PARTNERS_SERVICE.resolveIncomingRequest({
      id: item.id,
      type: item.type,
      action,
      comment,
      actorUserId: currentObjectsSession()?.username || "admin",
    }, objectsSeedData);
    closeObjectsModal();
    loadObjectsPage();
    showObjectsToast(action === "approve" ? "Запрос обработан." : "Запрос отклонён.");
  } catch (error) {
    showObjectsToast(error.message || "Не удалось обработать запрос.");
  }
}

function openObjectsModal(title, body, onReady) {
  const overlay = document.querySelector("[data-admin-overlay]");
  const modal = document.querySelector("[data-admin-modal]");
  if (!overlay || !modal) return;
  overlay.hidden = false;
  modal.hidden = false;
  modal.innerHTML = `
    <div class="admin-modal-card">
      <div class="admin-modal-head">
        <strong>${escapeObjectsHtml(title)}</strong>
        <button type="button" class="row-icon-button" data-close-modal>${objectsIcon("close")}</button>
      </div>
      <div class="admin-modal-body">${body}</div>
    </div>
  `;
  modal.querySelector("[data-close-modal]")?.addEventListener("click", closeObjectsModal);
  overlay.onclick = closeObjectsModal;
  if (typeof onReady === "function") onReady(modal);
}

function closeObjectsModal() {
  const overlay = document.querySelector("[data-admin-overlay]");
  const modal = document.querySelector("[data-admin-modal]");
  if (overlay) overlay.hidden = true;
  if (modal) {
    modal.hidden = true;
    modal.innerHTML = "";
  }
}

function showObjectsToast(message) {
  const toast = document.querySelector("[data-dashboard-toast]");
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  toast.classList.add("is-visible");
  clearTimeout(showObjectsToast.timer);
  showObjectsToast.timer = setTimeout(() => {
    toast.classList.remove("is-visible");
    setTimeout(() => { toast.hidden = true; }, 180);
  }, 2400);
}

function repeatCards(count) {
  return Array.from({ length: count }, () => `<article class="kpi-card"><div class="notification-empty">Загрузка...</div></article>`).join("");
}

function requestCountBadge() {
  try {
    const current = window.ANIMA_OBJECTS_PARTNERS_SERVICE.normalizeData(objectsSeedData);
    return String(current.kpis.newRequests || 0);
  } catch {
    return "0";
  }
}

function formatObjectsMoney(value) {
  const rates = state.data?.state?.settings?.currencyRates || { VND: 1 };
  const numeric = Number(value || 0);
  if (state.currency === "VND") return `${Math.round(numeric).toLocaleString("ru-RU")} VND`;
  const converted = numeric / Number(rates[state.currency] || 1);
  if (state.currency === "USD") return `$${Math.round(converted).toLocaleString("en-US")}`;
  if (state.currency === "EUR") return `€${Math.round(converted).toLocaleString("de-DE")}`;
  return `${Math.round(converted).toLocaleString("ru-RU")} ${state.currency}`;
}

function percentHint(current, total) {
  if (!total) return "0% от общего";
  return `${((current / total) * 100).toFixed(1)}% от общего`;
}

function monthlyDelta(value) {
  return value ? `+${value} в базе` : "Нет данных";
}

function formatChange(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "0%";
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function renderPagination(current, pages, type) {
  return Array.from({ length: pages }, (_, index) => index + 1)
    .slice(0, 6)
    .map((page) => `<button type="button" class="${page === current ? "active" : ""}" data-page-${type}="${page}">${page}</button>`)
    .join("");
}

function shortObjectBooking(id = "") {
  const part = id.split("_").pop() || id;
  return `#${part.slice(-4)}`;
}

function formatDateTime(value) {
  const date = new Date(value || Date.now());
  return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function requestTypeLabel(type = "") {
  return {
    partner_application: "Партнёрство",
    moderation_request: "Модерация",
    support_ticket: "Поддержка",
  }[type] || "Запрос";
}

function escapeObjectsHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderCategoryBadge(categoryId, categoryBadge = "") {
  return `<span class="category-pill category-${escapeObjectsHtml(categoryId || "default")}">${escapeObjectsHtml(categoryBadge || categoryId || "Категория")}</span>`;
}

function categoryOptions(selected = "") {
  return (window.ANIMA_DB?.categoryCatalog?.() || []).map((item) => `
    <option value="${item.id}" ${item.id === selected ? "selected" : ""}>${item.emoji || ""} ${escapeObjectsHtml(item.label)}</option>
  `).join("");
}

function bindCategoryDynamicFields(select, container, values = {}) {
  if (!select || !container) return;
  const render = () => {
    const fields = CATEGORY_FIELDS[select.value] || [];
    container.innerHTML = `
      <div class="dynamic-field-grid">
        ${fields.map((field) => `
          <label>
            <span>${escapeObjectsHtml(field.label)}</span>
            ${field.type === "textarea"
              ? `<textarea name="${field.name}" placeholder="${escapeObjectsHtml(field.placeholder || field.label)}">${escapeObjectsHtml(values[field.name] || "")}</textarea>`
              : `<input name="${field.name}" type="${field.type || "text"}" value="${escapeObjectsHtml(values[field.name] || "")}" placeholder="${escapeObjectsHtml(field.placeholder || field.label)}" />`
            }
          </label>
        `).join("") || `<div class="notification-empty">Для этой категории дополнительных полей пока нет.</div>`}
      </div>
    `;
  };
  render();
  select.addEventListener("change", render);
}

function extractCategoryDetails(form) {
  return Object.fromEntries(
    Object.entries(form).filter(([key, value]) => key.startsWith("detail_") && String(value || "").trim())
  );
}

function mediaUploaderMarkup(id) {
  return `
    <div class="media-uploader" data-media-uploader="${id}">
      <input type="file" accept="image/*" multiple data-media-input="${id}" />
      <div class="media-uploader-drop">
        <strong>Перетащите фотографии сюда</strong>
        <span>Или выберите несколько файлов с устройства</span>
      </div>
      <div class="media-uploader-preview" data-media-preview="${id}"></div>
    </div>
  `;
}

function bindMediaUploader(scope, id) {
  const root = scope.querySelector(`[data-media-uploader="${id}"]`);
  const input = scope.querySelector(`[data-media-input="${id}"]`);
  const output = scope.querySelector(`[data-upload-output="${id}"]`);
  const preview = scope.querySelector(`[data-media-preview="${id}"]`);
  if (!root || !input || !output || !preview) return;
  const processFiles = async (files) => {
    const urls = await Promise.all([...files].map(fileToDataUrl));
    output.value = [...new Set([...(output.value ? output.value.split("\n").filter(Boolean) : []), ...urls])].join("\n");
    preview.innerHTML = urls.map((url) => `<span style="background-image:url('${url}')"></span>`).join("");
  };
  input.addEventListener("change", () => processFiles(input.files || []));
  root.addEventListener("dragover", (event) => {
    event.preventDefault();
    root.classList.add("is-dragover");
  });
  root.addEventListener("dragleave", () => root.classList.remove("is-dragover"));
  root.addEventListener("drop", (event) => {
    event.preventDefault();
    root.classList.remove("is-dragover");
    processFiles(event.dataTransfer?.files || []);
  });
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function runBulkAction(action) {
  if (!state.selectedObjectIds.size) return;
  window.ANIMA_OBJECTS_PARTNERS_SERVICE.bulkUpdateProperties({
    ids: [...state.selectedObjectIds],
    action,
  }, objectsSeedData);
  state.selectedObjectIds = new Set();
  loadObjectsPage();
  showObjectsToast("Массовое действие применено.");
}

function setDetail(type, id) {
  state.editor = { mode: "", id: "" };
  state.detail = { type, id };
  if (type && id) sessionStorage.setItem(OBJECT_DETAIL_QUERY_KEY, JSON.stringify(state.detail));
  else sessionStorage.removeItem(OBJECT_DETAIL_QUERY_KEY);
  renderDetailPanel();
}


function hydrateDetailFromQuery() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(OBJECT_DETAIL_QUERY_KEY) || "null");
    if (saved?.type && saved?.id) state.detail = saved;
  } catch {}
}

function renderObjectDetail(item) {
  return `
    <div class="entity-detail-layout">
      <div class="entity-detail-hero">
        ${item.photo ? `<img src="${item.photo}" alt="${escapeObjectsHtml(item.title)}" />` : `<div class="detail-empty-photo">Нет фото</div>`}
        <div class="entity-detail-head">
          <div>
            <p>${escapeObjectsHtml(item.partnerName)}</p>
            <h3>${escapeObjectsHtml(item.title)}</h3>
          </div>
          ${renderCategoryBadge(item.categoryId, item.categoryBadge)}
        </div>
      </div>
      <div class="entity-detail-metrics">
        <div><span>Статус</span><strong>${escapeObjectsHtml(item.status)}</strong></div>
        <div><span>Тип</span><strong>${escapeObjectsHtml(item.type)}</strong></div>
        <div><span>Бронирования</span><strong>${item.bookings.length}</strong></div>
        <div><span>Доход</span><strong>${formatObjectsMoney(item.revenue)}</strong></div>
      </div>
      <div class="entity-detail-columns">
        <section class="detail-list">
          <h3>Описание и поля категории</h3>
          <p>${escapeObjectsHtml(item.property.description || "Описание не заполнено.")}</p>
          ${(CATEGORY_FIELDS[item.categoryId] || []).map((field) => `<p>${escapeObjectsHtml(field)}</p>`).join("")}
        </section>
        <section class="detail-list">
          <h3>Действия</h3>
          <p><button type="button" class="inline-detail-action" data-menu-object="${item.id}">Управление объектом</button></p>
          <p><button type="button" class="inline-detail-action" data-open-object="${item.id}">Обновить карточку</button></p>
        </section>
      </div>
      <div class="detail-list">
        <h3>Последние изменения</h3>
        ${item.audits.length ? item.audits.slice(0, 6).map((audit) => `<p>${escapeObjectsHtml(audit.action || "update")} · ${formatDateTime(audit.createdAt)}</p>`).join("") : "<p>История изменений пока пустая.</p>"}
      </div>
    </div>
  `;
}

function renderPartnerDetail(item) {
  return `
    <div class="entity-detail-layout">
      <div class="entity-detail-head standalone">
        <div>
          <p>Партнёр</p>
          <h3>${escapeObjectsHtml(item.title)}</h3>
        </div>
        <span class="status-badge ${item.statusTone}">${escapeObjectsHtml(item.status)}</span>
      </div>
      <div class="entity-detail-metrics">
        <div><span>Владелец</span><strong>${escapeObjectsHtml(item.owner)}</strong></div>
        <div><span>Объекты</span><strong>${item.propertyCount}</strong></div>
        <div><span>Доход</span><strong>${formatObjectsMoney(item.revenue)}</strong></div>
        <div><span>Выплаты</span><strong>${item.withdrawals.length}</strong></div>
      </div>
      <div class="detail-list">
        <h3>Объекты партнёра</h3>
        ${item.properties.length ? item.properties.map((property) => `<p>${escapeObjectsHtml(property.title)} · ${escapeObjectsHtml(property.status)}</p>`).join("") : "<p>Объектов пока нет.</p>"}
      </div>
      <div class="detail-list">
        <h3>Действия</h3>
        <p><button type="button" class="inline-detail-action" data-reset-partner-access="${item.id}">Сбросить доступ</button></p>
        <p><button type="button" class="inline-detail-action danger" data-deactivate-partner-detail="${item.id}">Деактивировать партнёра</button></p>
      </div>
    </div>
  `;
}

function renderRequestDetail(item) {
  return `
    <div class="entity-detail-layout">
      <div class="entity-detail-head standalone">
        <div>
          <p>${escapeObjectsHtml(requestTypeLabel(item.type))}</p>
          <h3>${escapeObjectsHtml(item.title)}</h3>
        </div>
        <span>${formatDateTime(item.createdAt)}</span>
      </div>
      <div class="detail-list">
        <h3>Источник</h3>
        <p>${escapeObjectsHtml(item.subtitle)}</p>
      </div>
      <div class="detail-list">
        <h3>Описание</h3>
        <p>${escapeObjectsHtml(item.description)}</p>
      </div>
      <form class="objects-form incoming-decision-form" data-inline-incoming-form>
        <label><span>Комментарий администратора</span><textarea name="comment" placeholder="Комментарий к решению"></textarea></label>
        <div class="objects-form-actions incoming-actions">
          <button type="button" class="secondary-action" data-inline-request-reject="${item.id}">Отклонить</button>
          <button type="submit">Принять</button>
        </div>
      </form>
    </div>
  `;
}

function objectsIcon(name) {
  const icons = {
    home: `<svg viewBox="0 0 24 24"><path d="M4 10.5L12 4l8 6.5V20H4z" /><path d="M9 20v-5h6v5" /></svg>`,
    building: `<svg viewBox="0 0 24 24"><path d="M4 20V6l7-2v16" /><path d="M20 20V10l-9-3" /><path d="M8 8h.01M8 12h.01M8 16h.01M15 12h.01M15 16h.01" /></svg>`,
    clipboard: `<svg viewBox="0 0 24 24"><rect x="5" y="4" width="14" height="16" rx="2" /><path d="M9 4.5h6v3H9z" /><path d="M9 11h6M9 15h4" /></svg>`,
    calendar: `<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></svg>`,
    users: `<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M4 19a5 5 0 0110 0M14 19a4 4 0 018 0" /></svg>`,
    star: `<svg viewBox="0 0 24 24"><path d="M12 3l2.7 5.5 6 .9-4.3 4.2 1 5.9L12 16.7 6.6 19.5l1-5.9L3.3 9.4l6-.9z" /></svg>`,
    wallet: `<svg viewBox="0 0 24 24"><path d="M4 7.5h14a2 2 0 012 2V18a2 2 0 01-2 2H6a2 2 0 01-2-2z" /><path d="M4 8V6a2 2 0 012-2h11" /><circle cx="16" cy="13" r="1" /></svg>`,
    banknote: `<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /><path d="M7 9h.01M17 15h.01" /></svg>`,
    percent: `<svg viewBox="0 0 24 24"><path d="M18 6L6 18" /><circle cx="7.5" cy="7.5" r="2.5" /><circle cx="16.5" cy="16.5" r="2.5" /></svg>`,
    message: `<svg viewBox="0 0 24 24"><path d="M20 15a3 3 0 01-3 3H8l-4 3V6a3 3 0 013-3h10a3 3 0 013 3z" /></svg>`,
    mail: `<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M4 8l8 6 8-6" /></svg>`,
    support: `<svg viewBox="0 0 24 24"><path d="M5 13a7 7 0 0114 0v5a2 2 0 01-2 2h-2v-6h4" /><path d="M5 20H3a2 2 0 01-2-2v-5h4" /></svg>`,
    file: `<svg viewBox="0 0 24 24"><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v6h5M10 13h4M10 17h4" /></svg>`,
    pen: `<svg viewBox="0 0 24 24"><path d="M4 20l4.5-1 9.8-9.8a2.1 2.1 0 10-3-3L5.5 16z" /><path d="M13.5 6.5l4 4" /></svg>`,
    settings: `<svg viewBox="0 0 24 24"><path d="M12 3l1.5 2.7 3 .7-.7 3 2.2 2.1-2.2 2.1.7 3-3 .7L12 21l-1.5-2.7-3-.7.7-3L6 12.5l2.2-2.1-.7-3 3-.7z" /><circle cx="12" cy="12" r="3" /></svg>`,
    history: `<svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 108-8" /><path d="M4 4v5h5" /><path d="M12 8v5l3 2" /></svg>`,
    nodes: `<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="2" /><circle cx="19" cy="5" r="2" /><circle cx="19" cy="19" r="2" /><path d="M7 12h6M17.5 6.5l-4 4M17.5 17.5l-4-4" /></svg>`,
    "clipboard-badge": `<svg viewBox="0 0 24 24"><rect x="5" y="4" width="14" height="16" rx="2" /><path d="M9 4.5h6v3H9z" /><path d="M9 12h6" /><circle cx="17.5" cy="8.5" r="2.5" /></svg>`,
    buildings: `<svg viewBox="0 0 24 24"><path d="M3 20V8l6-2v14" /><path d="M9 20V4l6 2v14" /><path d="M15 20v-9l6-2v11" /><path d="M6 10h.01M6 13h.01M12 9h.01M12 12h.01M18 12h.01M18 15h.01" /></svg>`,
    eye: `<svg viewBox="0 0 24 24"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" /><circle cx="12" cy="12" r="3" /></svg>`,
    chart: `<svg viewBox="0 0 24 24"><path d="M4 19h16" /><path d="M7 16V9" /><path d="M12 16V5" /><path d="M17 16v-7" /></svg>`,
    dots: `<svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="12" cy="19" r="1.7" /></svg>`,
    close: `<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg>`,
    "user-fill": `<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M5 20a7 7 0 0114 0" /></svg>`,
    chevron: `<svg viewBox="0 0 24 24"><path d="M7 10l5 5 5-5" /></svg>`,
  };
  return icons[name] || "";
}
