const REQUESTS_SESSION_KEY = "anima.admin.session.v1";
const REQUESTS_CURRENCY_KEY = "anima.admin.currency";
const REQUESTS_RANGE_KEY = "anima.admin.requests.range.v1";
const requestsSeedData = window.ANIMA_DATA || {};

const requestsSidebarSections = [
  {
    title: "Управление",
    items: [
      { id: "home", label: "Главная", icon: "house", href: "./dashboard.html" },
      { id: "objects", label: "Объекты и партнёры", icon: "buildings", href: "./objects-partners.html" },
      { id: "requests", label: "Заявки на бронирование", icon: "calendar-check", href: "./requests.html", active: true },
      { id: "bookings", label: "Бронирования", icon: "book-open", href: "./bookings.html" },
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
      { id: "chats", label: "Чаты", icon: "messages-square" },
      { id: "mailings", label: "Рассылки и уведомления", icon: "send" },
      { id: "support", label: "Поддержка", icon: "lifebuoy" },
    ],
  },
  {
    title: "Контент",
    items: [
      { id: "pages", label: "Страницы и контент", icon: "file-text" },
      { id: "blog", label: "Блог и публикации", icon: "pen-square" },
    ],
  },
  {
    title: "Система",
    items: [
      { id: "settings", label: "Настройки", icon: "settings" },
      { id: "logs", label: "Журналы действий", icon: "history" },
    ],
  },
];

const requestsState = {
  currency: localStorage.getItem(REQUESTS_CURRENCY_KEY) || "USD",
  filters: {
    search: "",
    status: "all",
    property: "all",
    from: "",
    to: "",
  },
  page: 1,
  perPage: 10,
  detailId: "",
  menuId: "",
  data: null,
};

document.addEventListener("DOMContentLoaded", () => {
  if (!ensureRequestsSession()) return;
  window.ANIMA_DB?.ensure?.(requestsSeedData);
  hydrateRange();
  hydrateDetailFromQuery();
  renderRequestsSidebar();
  bindRequestsUi();
  loadRequestsPage();
});

function ensureRequestsSession() {
  try {
    const session = JSON.parse(sessionStorage.getItem(REQUESTS_SESSION_KEY) || "null");
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

function currentRequestsSession() {
  try {
    return JSON.parse(sessionStorage.getItem(REQUESTS_SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

function bindRequestsUi() {
  const sidebar = document.querySelector("[data-sidebar]");
  const shell = document.querySelector(".dashboard-home-shell");
  document.querySelectorAll("[data-sidebar-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      sidebar?.classList.toggle("is-collapsed");
      shell?.classList.toggle("sidebar-collapsed");
    });
  });

  document.addEventListener("click", handleRequestsClick);
  document.addEventListener("input", handleRequestsInput);
  document.addEventListener("change", handleRequestsChange);
}

function loadRequestsPage() {
  requestsState.data = normalizeRequestsData();
  if (!requestsState.filters.propertyOptionsChecked) {
    if (!requestsState.filters.from || !requestsState.filters.to) applyDefaultRange();
    requestsState.filters.propertyOptionsChecked = true;
  }
  renderRequestsPage();
}

function renderRequestsSidebar() {
  const nav = document.querySelector("[data-sidebar-nav]");
  if (!nav || !requestsState.data) return;
  nav.innerHTML = requestsSidebarSections.map((section) => `
    <section class="sidebar-group">
      <h3>${section.title}</h3>
      <div class="sidebar-links">
        ${section.items.map((item) => `
          <button
            type="button"
            class="sidebar-link ${item.active ? "is-active" : ""}"
            data-nav-item="${item.id}"
            data-nav-label="${item.label}"
            ${item.href ? `data-nav-href="${item.href}"` : ""}
          >
            <span class="sidebar-link-icon">${requestsIcon(item.icon)}</span>
            <span class="sidebar-link-label">${item.label}</span>
            ${item.id === "requests" ? renderSidebarRequestBadges() : ""}
          </button>
        `).join("")}
      </div>
    </section>
  `).join("");
}

function renderRequestsPage() {
  renderTopbar();
  renderRequestsSidebar();
  const app = document.querySelector("[data-requests-app]");
  if (!app || !requestsState.data) return;
  app.innerHTML = requestsState.detailId
    ? renderDetailScreen()
    : renderListScreen();
}

function renderTopbar() {
  const topbar = document.querySelector("[data-topbar-right]");
  if (!topbar || !requestsState.data) return;
  const session = currentRequestsSession();
  topbar.innerHTML = `
    <label class="currency-switch requests-currency">
      <span class="currency-switch-label">Валюта</span>
      <select data-currency-select>
        ${(requestsState.data.currencies || ["USD", "VND", "EUR", "RUB", "UAH"]).map((code) => `<option value="${code}" ${code === requestsState.currency ? "selected" : ""}>${code}</option>`).join("")}
      </select>
    </label>
    <button type="button" class="topbar-link-button notification-button" data-show-notifications aria-label="Уведомления">
      ${requestsIcon("bell")}
      ${requestsState.data.newCount ? `<span class="notification-badge">${requestsState.data.newCount}</span>` : ""}
    </button>
    <button type="button" class="profile-button" data-logout-button>
      <span class="profile-avatar">${requestsIcon("user-fill")}</span>
      <span class="profile-copy">
        <strong>${escapeHtml(session?.username || "ADMIN_ANIMA1")}</strong>
        <small>Super Admin</small>
      </span>
      <span class="profile-chevron">${requestsIcon("chevron")}</span>
    </button>
  `;
}

function renderListScreen() {
  const filtered = filteredBookings();
  const page = paginate(filtered, requestsState.page, requestsState.perPage);
  requestsState.page = page.page;
  return `
    <section class="requests-hero">
      <div class="requests-hero-main">
        <h1>Запросы на бронирование</h1>
        <p>Управление входящими запросами от гостей</p>
      </div>
      <div class="requests-hero-actions">
        <button type="button" class="filter-button requests-date-button" data-open-quick-range>
          <span class="filter-icon">${requestsIcon("calendar")}</span>
          <span>${rangeLabel()}</span>
        </button>
        <button type="button" class="filter-button requests-filter-button" data-focus-filters>
          <span class="filter-icon">${requestsIcon("filter")}</span>
          <span>Фильтры</span>
          <span class="profile-chevron">${requestsIcon("chevron")}</span>
        </button>
      </div>
    </section>

    <section class="requests-kpis">
      ${renderKpiCards()}
    </section>

    <section class="requests-table-card dashboard-card">
      <div class="requests-filterbar" id="requests-filters">
        <label class="requests-filter-search">
          <span class="dashboard-search-icon">${requestsIcon("search")}</span>
          <input type="search" placeholder="Поиск по ID запроса, гостю, объекту..." value="${escapeAttribute(requestsState.filters.search)}" data-filter-search />
        </label>
        <label class="requests-select">
          <span class="requests-field-icon">${requestsIcon("filter")}</span>
          <select data-filter-status>
            ${statusFilterOptions().map((item) => `<option value="${item.value}" ${item.value === requestsState.filters.status ? "selected" : ""}>${item.label}</option>`).join("")}
          </select>
        </label>
        <label class="requests-select">
          <span class="requests-field-icon">${requestsIcon("building-2")}</span>
          <select data-filter-property>
            <option value="all">Все объекты</option>
            ${requestsState.data.properties.map((item) => `<option value="${escapeAttribute(item.id)}" ${item.id === requestsState.filters.property ? "selected" : ""}>${escapeHtml(item.title)}</option>`).join("")}
          </select>
        </label>
        <label class="requests-select requests-select-date">
          <span class="requests-field-icon">${requestsIcon("calendar-range")}</span>
          <input type="date" value="${escapeAttribute(requestsState.filters.from)}" data-filter-from />
        </label>
        <label class="requests-select requests-select-date">
          <span class="requests-field-icon">${requestsIcon("calendar-range")}</span>
          <input type="date" value="${escapeAttribute(requestsState.filters.to)}" data-filter-to />
        </label>
        <button type="button" class="requests-reset-button" data-reset-filters>
          ${requestsIcon("reset")}
          <span>Сбросить фильтры</span>
        </button>
        <button type="button" class="requests-list-style" aria-label="Вид списка">
          ${requestsIcon("list")}
        </button>
      </div>

      <div class="requests-table-wrap">
        <div class="requests-table-head">
          <span>${tableHeadLabel("hash", "Заявка")}</span>
          <span>${tableHeadLabel("building-2", "Объект")}</span>
          <span>${tableHeadLabel("user-round", "Гость")}</span>
          <span>${tableHeadLabel("calendar-range", "Даты проживания")}</span>
          <span>${tableHeadLabel("users", "Гости")}</span>
          <span>${tableHeadLabel("wallet", "Сумма")}</span>
          <span>${tableHeadLabel("badge-check", "Статус")}</span>
          <span>${tableHeadLabel("clock-3", "Создана")}</span>
          <span>${tableHeadLabel("sparkles", "Действия")}</span>
        </div>
        <div class="requests-table-body">
          ${page.items.map(renderBookingRow).join("") || `<div class="notification-empty requests-empty">По текущим фильтрам заявок нет.</div>`}
        </div>
      </div>

      <div class="requests-table-footer">
        <span>Показано ${page.total ? `${page.start}-${page.end}` : "0-0"} из ${page.total} запросов</span>
        <div class="requests-pagination">
          ${renderPagination(page.page, page.pages)}
        </div>
        <label class="requests-per-page">
          <span>Показывать по</span>
          <select data-per-page>
            ${[10, 20, 30].map((item) => `<option value="${item}" ${item === requestsState.perPage ? "selected" : ""}>${item}</option>`).join("")}
          </select>
        </label>
      </div>
    </section>
  `;
}

function renderDetailScreen() {
  const booking = requestsState.data.bookings.find((item) => item.id === requestsState.detailId);
  if (!booking) {
    requestsState.detailId = "";
    syncDetailQuery();
    return renderListScreen();
  }
  return `
    <section class="request-detail-shell">
      <div class="request-detail-top">
        <button type="button" class="request-back-button" data-close-detail>
          ${requestsIcon("chevron-left")}
          <span>Назад к списку</span>
        </button>
        <div class="request-detail-top-actions">
          ${booking.canConfirm ? `<button type="button" class="request-confirm-primary" data-action-confirm="${booking.id}">${requestsIcon("check")}<span>Подтвердить</span></button>` : ""}
          ${!booking.isCancelled ? `<button type="button" class="request-reject-button" data-action-cancel="${booking.id}">${requestsIcon("x")}<span>Отклонить</span></button>` : ""}
          <button type="button" class="request-menu-button" data-toggle-menu="${booking.id}">
            ${requestsIcon("more-vertical")}
          </button>
          ${requestsState.menuId === booking.id ? renderActionMenu(booking) : ""}
        </div>
      </div>

      <section class="request-detail-hero">
        <div>
          <h1>${escapeHtml(booking.displayId)}</h1>
          <p>${escapeHtml(booking.propertyTitle)}</p>
        </div>
        <div class="request-detail-status-row">
          ${renderStatusBadge(booking)}
          <span class="request-detail-created">${escapeHtml(formatDateTime(booking.createdAt))}</span>
        </div>
      </section>

      <section class="request-detail-grid">
        <article class="dashboard-card request-detail-main-card">
          <div class="request-detail-section">
            <h2>Основная информация</h2>
            <div class="request-detail-facts">
              ${detailItem("Объект", booking.propertyTitle)}
              ${detailItem("Номер заявки", booking.displayId)}
              ${detailItem("Даты", `${formatDate(booking.startDate)} - ${formatDate(booking.endDate)}`)}
              ${detailItem("Гостей", `${booking.guestsCount} ${plural(booking.guestsCount, ["гость", "гостя", "гостей"])}`)}
              ${detailItem("Сумма", booking.primaryAmount)}
              ${detailItem("Оплата", booking.paymentStatusLabel)}
              ${detailItem("Статус", booking.statusLabel)}
              ${detailItem("Ночей", `${booking.nights} ${plural(booking.nights, ["ночь", "ночи", "ночей"])}`)}
            </div>
          </div>

          <div class="request-detail-section">
            <h2>Контакты гостя</h2>
            <div class="request-detail-facts">
              ${detailItem("Гость", booking.guestName)}
              ${detailItem("Email", booking.guestEmail || "не указан")}
              ${detailItem("Телефон", booking.guestPhone || "не указан")}
              ${detailItem("Гражданство", booking.citizenship || "не указано")}
            </div>
          </div>

          <div class="request-detail-section">
            <h2>Комментарии</h2>
            <div class="request-timeline comments">
              ${booking.comments.length ? booking.comments.map((item) => `
                <article class="timeline-row">
                  <div class="timeline-dot"></div>
                  <div>
                    <strong>${escapeHtml(item.author)}</strong>
                    <p>${escapeHtml(item.text)}</p>
                    <small>${escapeHtml(formatDateTime(item.createdAt))}</small>
                  </div>
                </article>
              `).join("") : `<div class="notification-empty">Комментариев пока нет.</div>`}
            </div>
          </div>
        </article>

        <article class="dashboard-card request-detail-side-card">
          <div class="request-detail-section">
            <h2>История действий</h2>
            <div class="request-timeline">
              ${booking.history.length ? booking.history.map((item) => `
                <article class="timeline-row">
                  <div class="timeline-dot"></div>
                  <div>
                    <strong>${escapeHtml(item.title)}</strong>
                    <p>${escapeHtml(item.comment || "Без комментария")}</p>
                    <small>${escapeHtml(formatDateTime(item.createdAt))}</small>
                  </div>
                </article>
              `).join("") : `<div class="notification-empty">История пока пуста.</div>`}
            </div>
          </div>

          <div class="request-detail-section">
            <h2>Оплата</h2>
            <div class="request-payment-list">
              ${booking.payments.length ? booking.payments.map((item) => `
                <div class="request-payment-row">
                  <strong>${escapeHtml(formatMoney(item.amount || 0))}</strong>
                  <span>${escapeHtml(paymentLabel(item.status))} · ${escapeHtml(item.method || item.payment_method || "manual")}</span>
                  <small>${escapeHtml(formatDateTime(item.paid_at || item.createdAt))}</small>
                </div>
              `).join("") : `<div class="notification-empty">Оплат по заявке пока нет.</div>`}
            </div>
          </div>
        </article>
      </section>
    </section>
  `;
}

function renderKpiCards() {
  return requestsState.data.kpis.map((item) => `
    <article class="requests-kpi-card dashboard-card tone-${item.tone}">
      <div class="requests-kpi-copy">
        <span class="requests-kpi-title">${item.title}</span>
        <strong class="requests-kpi-value">${item.value}</strong>
        <span class="requests-kpi-meta ${item.trendValue > 0 ? "up" : item.trendValue < 0 ? "down" : ""}">${escapeHtml(item.trendLabel)}</span>
      </div>
      <div class="requests-kpi-side">
        <span class="requests-kpi-icon">${requestsIcon(item.icon)}</span>
        ${renderSparkline(item.points, item.color)}
      </div>
    </article>
  `).join("");
}

function renderBookingRow(booking) {
  return `
    <article class="requests-row ${booking.statusTone}" data-row-open="${booking.id}">
      <div class="requests-cell requests-cell-id">
        <strong>${escapeHtml(booking.displayId)}</strong>
        ${renderStatusBadge(booking)}
        <small>${escapeHtml(booking.presenceLabel)}</small>
      </div>
      <div class="requests-cell requests-cell-property">
        <span class="requests-thumb" style="${booking.photoStyle}"></span>
        <div>
          <strong>${escapeHtml(booking.propertyTitle)}</strong>
          <small class="requests-meta-line">${requestsInlineIcon("building-2")}${escapeHtml(booking.location)}</small>
        </div>
      </div>
      <div class="requests-cell requests-cell-guest">
        <strong>${escapeHtml(booking.guestName)}</strong>
        <small class="requests-meta-line">${requestsInlineIcon("mail")}${escapeHtml(booking.guestEmail || "")}</small>
        <small class="requests-meta-line">${requestsInlineIcon("phone")}${escapeHtml(booking.guestPhone || "")}</small>
      </div>
      <div class="requests-cell requests-cell-dates">
        <strong>${escapeHtml(`${formatDate(booking.startDate)} - ${formatDate(booking.endDate)}`)}</strong>
        <small class="requests-meta-line">${requestsInlineIcon("moon")}${booking.nights} ${plural(booking.nights, ["ночь", "ночи", "ночей"])}</small>
      </div>
      <div class="requests-cell requests-cell-guests">
        <span class="requests-mini-icon">${requestsIcon("users")}</span>
        <strong>${booking.guestsCount}</strong>
      </div>
      <div class="requests-cell requests-cell-sum">
        <strong>${escapeHtml(booking.primaryAmount)}</strong>
        <small class="requests-meta-line">${requestsInlineIcon("trending-up")}${escapeHtml(booking.secondaryAmount)}</small>
      </div>
      <div class="requests-cell requests-cell-status">
        ${renderStatusBadge(booking)}
      </div>
      <div class="requests-cell requests-cell-created">
        <strong>${escapeHtml(formatDateTime(booking.createdAt, true))}</strong>
        <small>${escapeHtml(relativeTime(booking.createdAt))}</small>
      </div>
      <div class="requests-cell requests-cell-actions">
        <button type="button" class="requests-action-button neutral" data-row-open="${booking.id}" aria-label="Просмотр">${requestsIcon("eye")}</button>
        <button type="button" class="requests-action-button" data-row-open="${booking.id}" aria-label="Комментарии">${requestsIcon("message-square")}</button>
        ${booking.canConfirm ? `<button type="button" class="requests-action-button confirm" data-action-confirm="${booking.id}" aria-label="Подтвердить">${requestsIcon("check")}</button>` : `<button type="button" class="requests-action-button ${booking.isCancelled ? "danger" : "neutral"}" data-action-cancel="${booking.id}" aria-label="Отклонить">${requestsIcon("x")}</button>`}
        <button type="button" class="requests-action-button" data-toggle-menu="${booking.id}" aria-label="Дополнительные действия">${requestsIcon("more-vertical")}</button>
        ${requestsState.menuId === booking.id ? renderActionMenu(booking) : ""}
      </div>
    </article>
  `;
}

function renderActionMenu(booking) {
  const items = [];
  items.push(`<button type="button" data-row-open="${booking.id}">Открыть детали</button>`);
  if (booking.canConfirm) items.push(`<button type="button" data-action-confirm="${booking.id}">Подтвердить</button>`);
  if (!booking.isCancelled) items.push(`<button type="button" data-action-cancel="${booking.id}">Отменить</button>`);
  if (!booking.hasPaidPayment) items.push(`<button type="button" data-action-paid="${booking.id}">Отметить оплату</button>`);
  items.push(`<button type="button" data-action-note="${booking.id}">Добавить комментарий</button>`);
  return `<div class="requests-action-menu">${items.join("")}</div>`;
}

function handleRequestsClick(event) {
  const navButton = event.target.closest("[data-nav-item]");
  if (navButton) {
    if (navButton.dataset.navHref) {
      location.assign(navButton.dataset.navHref);
      return;
    }
    showRequestsToast(`Раздел «${navButton.dataset.navLabel}» подготовим следующим экраном.`);
    return;
  }

  if (event.target.closest("[data-logout-button]")) {
    sessionStorage.removeItem(REQUESTS_SESSION_KEY);
    location.replace("./");
    return;
  }

  if (event.target.closest("[data-reset-filters]")) {
    requestsState.filters.search = "";
    requestsState.filters.status = "all";
    requestsState.filters.property = "all";
    applyDefaultRange();
    requestsState.page = 1;
    renderRequestsPage();
    return;
  }

  if (event.target.closest("[data-focus-filters]")) {
    document.querySelector("[data-filter-search]")?.focus();
    return;
  }

  if (event.target.closest("[data-open-quick-range]")) {
    applyMonthRange();
    renderRequestsPage();
    return;
  }

  const toggleMenu = event.target.closest("[data-toggle-menu]");
  if (toggleMenu) {
    const id = toggleMenu.dataset.toggleMenu;
    requestsState.menuId = requestsState.menuId === id ? "" : id;
    renderRequestsPage();
    return;
  }

  if (!event.target.closest(".requests-action-menu") && !event.target.closest("[data-toggle-menu]") && requestsState.menuId) {
    requestsState.menuId = "";
    renderRequestsPage();
    return;
  }

  const confirmButton = event.target.closest("[data-action-confirm]");
  if (confirmButton) {
    confirmBooking(confirmButton.dataset.actionConfirm);
    return;
  }

  const cancelButton = event.target.closest("[data-action-cancel]");
  if (cancelButton) {
    cancelBooking(cancelButton.dataset.actionCancel);
    return;
  }

  const paidButton = event.target.closest("[data-action-paid]");
  if (paidButton) {
    markBookingPaid(paidButton.dataset.actionPaid);
    return;
  }

  const noteButton = event.target.closest("[data-action-note]");
  if (noteButton) {
    addAdminNote(noteButton.dataset.actionNote);
    return;
  }

  if (event.target.closest("[data-close-detail]")) {
    closeDetail();
    return;
  }

  const pageButton = event.target.closest("[data-pagination-page]");
  if (pageButton) {
    requestsState.page = Number(pageButton.dataset.paginationPage);
    renderRequestsPage();
    return;
  }

  const rowOpen = event.target.closest("[data-row-open]");
  if (rowOpen) {
    openDetail(rowOpen.dataset.rowOpen);
  }
}

function handleRequestsInput(event) {
  if (event.target.matches("[data-global-search], [data-filter-search]")) {
    requestsState.filters.search = event.target.value;
    const global = document.querySelector("[data-global-search]");
    const local = document.querySelector("[data-filter-search]");
    if (global && global !== event.target) global.value = event.target.value;
    if (local && local !== event.target) local.value = event.target.value;
    requestsState.page = 1;
    renderRequestsPage();
  }
}

function handleRequestsChange(event) {
  if (event.target.matches("[data-filter-status]")) {
    requestsState.filters.status = event.target.value;
    requestsState.page = 1;
    renderRequestsPage();
    return;
  }
  if (event.target.matches("[data-filter-property]")) {
    requestsState.filters.property = event.target.value;
    requestsState.page = 1;
    renderRequestsPage();
    return;
  }
  if (event.target.matches("[data-filter-from]")) {
    requestsState.filters.from = event.target.value;
    persistRange();
    requestsState.page = 1;
    renderRequestsPage();
    return;
  }
  if (event.target.matches("[data-filter-to]")) {
    requestsState.filters.to = event.target.value;
    persistRange();
    requestsState.page = 1;
    renderRequestsPage();
    return;
  }
  if (event.target.matches("[data-per-page]")) {
    requestsState.perPage = Number(event.target.value || 10);
    requestsState.page = 1;
    renderRequestsPage();
    return;
  }
  if (event.target.matches("[data-currency-select]")) {
    requestsState.currency = event.target.value;
    localStorage.setItem(REQUESTS_CURRENCY_KEY, requestsState.currency);
    requestsState.data = normalizeRequestsData();
    renderRequestsPage();
  }
}

function normalizeRequestsData() {
  const state = window.ANIMA_DB.getState(requestsSeedData);
  const properties = state.tables.partnerProperties || [];
  const partners = state.tables.partners || [];
  const payments = state.tables.payments || [];
  const comments = state.tables.bookingComments || [];
  const history = state.tables.bookingStatusHistory || [];
  const notes = state.tables.adminNotes || [];
  const bookings = [...(state.tables.partnerBookings || [])].sort((a, b) => new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0));

  const propertiesById = new Map(properties.map((item) => [item.id, item]));
  const partnersById = new Map(partners.map((item) => [item.id, item]));
  const paymentByBooking = groupBy(payments, (item) => item.booking_id);
  const commentByBooking = groupBy(comments, (item) => item.booking_id);
  const historyByBooking = groupBy(history, (item) => item.booking_id);
  const notesByBooking = groupBy(notes, (item) => item.booking_id);
  const normalizedBookings = bookings.map((booking) => {
    const property = propertiesById.get(booking.property_id) || {};
    const partner = partnersById.get(booking.partner_id) || {};
    const stateMeta = bookingStatusMeta(booking.booking_status);
    const bookingPayments = paymentByBooking.get(booking.id) || [];
    const bookingComments = (commentByBooking.get(booking.id) || []).map((item) => ({
      author: item.author_name || item.author_role || "Комментарий",
      text: item.text || item.comment || "",
      createdAt: item.createdAt || item.created_at,
    }));
    const adminComments = (notesByBooking.get(booking.id) || []).map((item) => ({
      author: item.authorId || "admin",
      text: item.text || "",
      createdAt: item.createdAt || item.created_at,
    }));
    const bookingHistory = (historyByBooking.get(booking.id) || []).map((item) => ({
      title: `${statusLabel(item.old_status || "new_request")} → ${statusLabel(item.new_status)}`,
      comment: item.comment || "",
      createdAt: item.createdAt || item.created_at,
    }));
    const total = Number(booking.total_amount || 0);
    return {
      id: booking.id,
      displayId: displayBookingId(booking.id),
      raw: booking,
      propertyId: property.id || "",
      propertyTitle: property.title || partner.business_name || "Объект не указан",
      location: property.location || property.address || "Локация не указана",
      photoStyle: thumbStyle(property),
      guestName: booking.customer_name || "Гость ANIMA",
      guestEmail: booking.customer_email || booking.email || "",
      guestPhone: booking.customer_phone || booking.phone || "",
      citizenship: booking.citizenship || booking.guests_details?.[0]?.citizenship || "",
      startDate: booking.start_date || "",
      endDate: booking.end_date || "",
      createdAt: booking.createdAt || booking.created_at || "",
      guestsCount: Number(booking.guests_count || 1),
      nights: nightsBetween(booking.start_date, booking.end_date),
      totalAmount: total,
      primaryAmount: formatMoney(total),
      secondaryAmount: formatCurrency(total, "VND"),
      statusKey: stateMeta.key,
      statusTone: stateMeta.tone,
      statusLabel: stateMeta.label,
      paymentStatusLabel: paymentLabel(booking.payment_status),
      presenceLabel: ["confirmed", "paid", "active", "checked_in", "completed"].includes(booking.booking_status) ? "Online" : "Offline",
      canConfirm: ["new_request", "waiting_payment", "commission_paid", "pending_partner_confirmation"].includes(booking.booking_status),
      isCancelled: stateMeta.key === "cancelled",
      hasPaidPayment: bookingPayments.some((item) => item.status === "paid"),
      payments: bookingPayments,
      comments: [...adminComments, ...bookingComments].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
      history: bookingHistory.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
    };
  });

  const propertiesList = dedupeBy(normalizedBookings.map((item) => ({ id: item.propertyId, title: item.propertyTitle })), "id").filter((item) => item.id);
  const series = buildKpiSeries(normalizedBookings);
  const newCount = normalizedBookings.filter((item) => item.statusKey === "new").length;
  return {
    state,
    bookings: normalizedBookings,
    properties: propertiesList,
    newCount,
    currencies: state.settings?.currencies || ["USD", "VND", "EUR", "RUB", "UAH"],
    kpis: [
      kpiCard("Всего запросов", normalizedBookings, "all", "inbox", "#56d163"),
      kpiCard("Новые запросы", normalizedBookings, "new", "bell-dot", "#ff6554"),
      kpiCard("Ожидают подтверждения", normalizedBookings, "waiting", "pending", "#f2b33d"),
      kpiCard("Подтверждённые", normalizedBookings, "confirmed", "check-circle", "#56d163"),
      kpiCard("Отменённые", normalizedBookings, "cancelled", "close", "#b7bcc4"),
    ].map((item) => ({ ...item, points: series[item.seriesKey] || [] })),
  };
}

function filteredBookings() {
  return requestsState.data.bookings.filter((item) => {
    const query = requestsState.filters.search.trim().toLowerCase();
    const matchesQuery = !query
      || item.displayId.toLowerCase().includes(query)
      || item.propertyTitle.toLowerCase().includes(query)
      || item.guestName.toLowerCase().includes(query)
      || item.guestEmail.toLowerCase().includes(query);
    const matchesStatus = requestsState.filters.status === "all" || item.statusKey === requestsState.filters.status;
    const matchesProperty = requestsState.filters.property === "all" || item.propertyId === requestsState.filters.property;
    const created = new Date(item.createdAt || 0);
    const matchesFrom = !requestsState.filters.from || created >= new Date(`${requestsState.filters.from}T00:00:00`);
    const matchesTo = !requestsState.filters.to || created <= new Date(`${requestsState.filters.to}T23:59:59`);
    return matchesQuery && matchesStatus && matchesProperty && matchesFrom && matchesTo;
  });
}

function confirmBooking(id) {
  const booking = requestsState.data.bookings.find((item) => item.id === id);
  if (!booking) return;
  window.ANIMA_DB.updateBookingAdmin(id, {
    actorUserId: currentRequestsSession()?.username || "admin",
    booking_status: "confirmed",
    admin_comment: "Подтверждено из раздела заявок",
  }, requestsSeedData);
  showRequestsToast(`Заявка ${booking.displayId} подтверждена.`);
  afterMutation(id);
}

function cancelBooking(id) {
  const booking = requestsState.data.bookings.find((item) => item.id === id);
  if (!booking) return;
  window.ANIMA_DB.updateBookingAdmin(id, {
    actorUserId: currentRequestsSession()?.username || "admin",
    booking_status: "cancelled_by_anima",
    admin_comment: "Отменено из раздела заявок",
  }, requestsSeedData);
  showRequestsToast(`Заявка ${booking.displayId} отменена.`);
  afterMutation(id);
}

function markBookingPaid(id) {
  const booking = requestsState.data.bookings.find((item) => item.id === id);
  if (!booking) return;
  window.ANIMA_DB.recordPayment(id, {
    actorUserId: currentRequestsSession()?.username || "admin",
    status: "paid",
    method: "manual",
  }, requestsSeedData);
  showRequestsToast(`Оплата по ${booking.displayId} отмечена.`);
  afterMutation(id);
}

function addAdminNote(id) {
  const booking = requestsState.data.bookings.find((item) => item.id === id);
  if (!booking) return;
  const text = window.prompt("Комментарий администратора");
  if (!text) return;
  window.ANIMA_DB.addAdminNote({
    authorId: currentRequestsSession()?.username || "admin",
    partnerId: booking.raw.partner_id,
    bookingId: id,
    text,
  }, requestsSeedData);
  showRequestsToast(`Комментарий добавлен к ${booking.displayId}.`);
  afterMutation(id);
}

function afterMutation(detailId = "") {
  requestsState.menuId = "";
  requestsState.data = normalizeRequestsData();
  if (detailId) requestsState.detailId = detailId;
  renderRequestsPage();
}

function openDetail(id) {
  requestsState.detailId = id;
  syncDetailQuery();
  renderRequestsPage();
}

function closeDetail() {
  requestsState.detailId = "";
  syncDetailQuery();
  renderRequestsPage();
}

function hydrateDetailFromQuery() {
  const params = new URLSearchParams(location.search);
  requestsState.detailId = params.get("booking") || "";
}

function syncDetailQuery() {
  const url = new URL(location.href);
  if (requestsState.detailId) url.searchParams.set("booking", requestsState.detailId);
  else url.searchParams.delete("booking");
  history.replaceState({}, "", url);
}

function applyDefaultRange() {
  const dates = requestsState.data.bookings.map((item) => new Date(item.createdAt || 0)).filter((item) => !Number.isNaN(item.getTime())).sort((a, b) => a - b);
  const today = new Date();
  const from = dates[0] || new Date(today.getFullYear(), today.getMonth(), 1);
  const to = dates[dates.length - 1] || today;
  requestsState.filters.from = toInputDateValue(from);
  requestsState.filters.to = toInputDateValue(to);
  persistRange();
}

function applyMonthRange() {
  const today = new Date();
  requestsState.filters.from = toInputDateValue(new Date(today.getFullYear(), today.getMonth(), 1));
  requestsState.filters.to = toInputDateValue(new Date(today.getFullYear(), today.getMonth() + 1, 0));
  persistRange();
}

function hydrateRange() {
  try {
    const saved = JSON.parse(localStorage.getItem(REQUESTS_RANGE_KEY) || "null");
    if (!saved) return;
    requestsState.filters.from = saved.from || "";
    requestsState.filters.to = saved.to || "";
  } catch {}
}

function persistRange() {
  localStorage.setItem(REQUESTS_RANGE_KEY, JSON.stringify({
    from: requestsState.filters.from,
    to: requestsState.filters.to,
  }));
}

function rangeLabel() {
  if (!requestsState.filters.from || !requestsState.filters.to) return "Выберите даты";
  return `${formatDate(requestsState.filters.from, false)} - ${formatDate(requestsState.filters.to, false)}`;
}

function renderPagination(page, pages) {
  if (pages <= 1) return "";
  const items = [];
  for (let index = 1; index <= pages; index += 1) {
    items.push(`<button type="button" class="requests-page-button ${index === page ? "active" : ""}" data-pagination-page="${index}">${index}</button>`);
  }
  return items.join("");
}

function renderSidebarRequestBadges() {
  const newCount = requestsState.data?.newCount || 0;
  return `
    ${newCount ? `<span class="sidebar-link-badge request-main-badge">${newCount}</span>` : ""}
    ${newCount ? `<span class="sidebar-link-badge request-dot-badge">${newCount}</span>` : ""}
  `;
}

function renderStatusBadge(booking) {
  return `<span class="request-status-badge ${booking.statusTone}">${requestsInlineIcon(statusIconName(booking.statusTone), "status")}${escapeHtml(booking.statusLabel)}</span>`;
}

function statusIconName(statusTone = "") {
  return {
    new: "bell-dot",
    waiting: "clock-3",
    confirmed: "check",
    cancelled: "x",
  }[statusTone] || "circle";
}

function detailItem(label, value) {
  return `<div class="request-detail-item"><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value || "не указано"))}</strong></div>`;
}

function statusFilterOptions() {
  return [
    { value: "all", label: "Все статусы" },
    { value: "new", label: "Новые" },
    { value: "waiting", label: "Ожидают" },
    { value: "confirmed", label: "Подтверждённые" },
    { value: "cancelled", label: "Отменённые" },
  ];
}

function kpiCard(title, bookings, key, icon, color) {
  const current = key === "all" ? bookings : bookings.filter((item) => item.statusKey === key);
  const { currentCount, previousCount } = compareCounts(current);
  return {
    title,
    value: currentCount,
    trendValue: currentCount - previousCount,
    trendLabel: trendLabel(currentCount, previousCount),
    tone: key === "new" ? "red" : key === "waiting" ? "gold" : key === "cancelled" ? "gray" : "green",
    icon,
    color,
    seriesKey: key,
  };
}

function buildKpiSeries(bookings) {
  const sorted = [...bookings].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
  const last = sorted.slice(-7);
  const all = last.map((_, index) => index + 1);
  return {
    all,
    new: last.map((item) => item.statusKey === "new" ? 1 : 0),
    waiting: last.map((item) => item.statusKey === "waiting" ? 1 : 0),
    confirmed: last.map((item) => item.statusKey === "confirmed" ? 1 : 0),
    cancelled: last.map((item) => item.statusKey === "cancelled" ? 1 : 0),
  };
}

function compareCounts(items) {
  const dates = items.map((item) => new Date(item.createdAt || 0)).filter((item) => !Number.isNaN(item.getTime())).sort((a, b) => a - b);
  const totalDays = Math.max(1, Math.min(30, dates.length || 7));
  const end = new Date();
  const start = addDays(end, -(totalDays - 1));
  const previousEnd = addDays(start, -1);
  const previousStart = addDays(previousEnd, -(totalDays - 1));
  const currentCount = items.filter((item) => inRange(new Date(item.createdAt || 0), start, end)).length;
  const previousCount = items.filter((item) => inRange(new Date(item.createdAt || 0), previousStart, previousEnd)).length;
  return { currentCount, previousCount };
}

function trendLabel(current, previous) {
  const delta = current - previous;
  if (!previous && current) return `+${current} за период`;
  if (!delta) return "без изменений";
  return `${delta > 0 ? "+" : ""}${delta} за период`;
}

function bookingStatusMeta(status = "") {
  if (["new_request", "waiting_payment"].includes(status)) return { key: "new", label: "Новый", tone: "new" };
  if (["commission_paid", "pending_partner_confirmation"].includes(status)) return { key: "waiting", label: "Ожидает", tone: "waiting" };
  if (["confirmed", "paid", "active", "checked_in", "completed", "funds_available", "payout_requested", "payout_sent", "closed"].includes(status)) return { key: "confirmed", label: "Подтверждена", tone: "confirmed" };
  return { key: "cancelled", label: "Отменена", tone: "cancelled" };
}

function statusLabel(status = "") {
  return bookingStatusMeta(status).label;
}

function paymentLabel(status = "") {
  return {
    paid: "Оплачено",
    pending: "Ожидает оплаты",
    unpaid: "Не оплачено",
    refunded: "Возврат",
  }[status] || "Не оплачено";
}

function displayBookingId(id = "") {
  const parts = String(id).split("_");
  const suffix = parts[parts.length - 1] || id;
  return `#BR-${suffix.slice(-8).toUpperCase()}`;
}

function thumbStyle(property = {}) {
  const photo = property.photos?.[0] || property.property_photos?.[0] || "";
  return photo ? `background-image:url('${photo}')` : "background:linear-gradient(135deg, rgba(191,151,109,.92), rgba(77,57,39,.92))";
}

function formatMoney(value) {
  return formatCurrency(value, requestsState.currency);
}

function formatCurrency(value, currencyCode = "VND") {
  const amount = convertMoney(Number(value || 0), currencyCode);
  if (currencyCode === "USD") return `$${Math.round(amount).toLocaleString("en-US")}`;
  if (currencyCode === "EUR") return `€${Math.round(amount).toLocaleString("de-DE")}`;
  if (currencyCode === "RUB") return `${Math.round(amount).toLocaleString("ru-RU")} RUB`;
  if (currencyCode === "UAH") return `${Math.round(amount).toLocaleString("uk-UA")} UAH`;
  return `≈ ${Math.round(amount).toLocaleString("ru-RU")} VND`;
}

function convertMoney(value, currencyCode) {
  const rates = requestsState.data?.state?.settings?.currencyRates || requestsSeedData.user?.currencyRates || { VND: 1 };
  if (currencyCode === "VND") return value;
  return value / Number(rates[currencyCode] || 1);
}

function renderSparkline(values, color) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(1, max - min);
  const points = values.map((value, index) => {
    const x = values.length <= 1 ? 34 : (index / (values.length - 1)) * 72;
    const y = 24 - (((value - min) / range) * 18);
    return `${x},${y}`;
  }).join(" ");
  return `<svg class="requests-sparkline" viewBox="0 0 72 24" aria-hidden="true"><polyline points="${points}" style="stroke:${color}"></polyline></svg>`;
}

function requestsIcon(name) {
  const icons = {
    house: `<svg viewBox="0 0 24 24"><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.8V21h14V9.8" /><path d="M9 21v-6h6v6" /></svg>`,
    buildings: `<svg viewBox="0 0 24 24"><path d="M3 21V8l6-3v16" /><path d="M9 21V4l6 2v15" /><path d="M15 21v-9l6-2v11" /><path d="M6 10h.01M6 13h.01M12 9h.01M12 12h.01M18 13h.01M18 16h.01" /></svg>`,
    "building-2": `<svg viewBox="0 0 24 24"><path d="M6 22V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" /><path d="M4 22h16" /><path d="M10 8h4M10 12h4M10 16h4" /></svg>`,
    "calendar-check": `<svg viewBox="0 0 24 24"><path d="M8 2v4M16 2v4" /><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M3 10h18" /><path d="m9.5 16 2 2 4-4" /></svg>`,
    "book-open": `<svg viewBox="0 0 24 24"><path d="M12 7c-1.8-1.3-4-2-6.5-2A2.5 2.5 0 0 0 3 7.5V19a2 2 0 0 1 2-2c2.5 0 4.7.7 7 2" /><path d="M12 7c1.8-1.3 4-2 6.5-2A2.5 2.5 0 0 1 21 7.5V19a2 2 0 0 0-2-2c-2.5 0-4.7.7-7 2" /></svg>`,
    calendar: `<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></svg>`,
    "calendar-range": `<svg viewBox="0 0 24 24"><path d="M8 2v4M16 2v4" /><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M3 10h18" /><path d="M8 14h3M13 14h3M8 18h8" /></svg>`,
    users: `<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M4 19a5 5 0 0110 0M14 19a4 4 0 018 0" /></svg>`,
    "user-round": `<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 20a8 8 0 0 1 16 0" /></svg>`,
    star: `<svg viewBox="0 0 24 24"><path d="M12 3l2.7 5.5 6 .9-4.3 4.2 1 5.9L12 16.7 6.6 19.5l1-5.9L3.3 9.4l6-.9z" /></svg>`,
    wallet: `<svg viewBox="0 0 24 24"><path d="M4 7.5h14a2 2 0 012 2V18a2 2 0 01-2 2H6a2 2 0 01-2-2z" /><path d="M4 8V6a2 2 0 012-2h11" /><circle cx="16" cy="13" r="1" /></svg>`,
    banknote: `<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /><path d="M7 9h.01M17 15h.01" /></svg>`,
    percent: `<svg viewBox="0 0 24 24"><path d="M18 6L6 18" /><circle cx="7.5" cy="7.5" r="2.5" /><circle cx="16.5" cy="16.5" r="2.5" /></svg>`,
    "messages-square": `<svg viewBox="0 0 24 24"><path d="M16 4h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-4l-4 4v-4H7a2 2 0 0 1-2-2v-1" /><path d="M5 14H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H8l-3 3z" /></svg>`,
    "message-square": `<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>`,
    mail: `<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M4 8l8 6 8-6" /></svg>`,
    send: `<svg viewBox="0 0 24 24"><path d="M22 2 11 13" /><path d="m22 2-7 20-4-9-9-4Z" /></svg>`,
    lifebuoy: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="M18.4 5.6 14 10M9.9 14.1l-4.3 4.3M18.4 18.4 14 14M10 10 5.6 5.6" /></svg>`,
    "file-text": `<svg viewBox="0 0 24 24"><path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z" /><path d="M14 2v5h5" /><path d="M9 13h6M9 17h6M9 9h2" /></svg>`,
    "pen-square": `<svg viewBox="0 0 24 24"><path d="M11 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-6" /><path d="m18.5 2.5 3 3L12 15l-4 1 1-4Z" /></svg>`,
    settings: `<svg viewBox="0 0 24 24"><path d="M12 3l1.5 2.7 3 .7-.7 3 2.2 2.1-2.2 2.1.7 3-3 .7L12 21l-1.5-2.7-3-.7.7-3L6 12.5l2.2-2.1-.7-3 3-.7z" /><circle cx="12" cy="12" r="3" /></svg>`,
    history: `<svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 108-8" /><path d="M4 4v5h5" /><path d="M12 8v5l3 2" /></svg>`,
    bell: `<svg viewBox="0 0 24 24"><path d="M6 9a6 6 0 1112 0v4.2l1.5 2.8H4.5L6 13.2V9z" /><path d="M10 19a2 2 0 004 0" /></svg>`,
    "bell-dot": `<svg viewBox="0 0 24 24"><path d="M10.3 19a2 2 0 0 0 3.4 0" /><path d="M5 8a7 7 0 0 1 14 0v4l2 3H3l2-3Z" /><circle cx="18" cy="6" r="1.5" /></svg>`,
    "user-fill": `<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M5 20a7 7 0 0114 0" /></svg>`,
    chevron: `<svg viewBox="0 0 24 24"><path d="M7 10l5 5 5-5" /></svg>`,
    "chevron-left": `<svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6" /></svg>`,
    search: `<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5" /><path d="M16 16l5 5" /></svg>`,
    filter: `<svg viewBox="0 0 24 24"><path d="M4 7h16M7 12h10M10 17h4" /></svg>`,
    reset: `<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 10-2.3 5.7" /><path d="M20 5v7h-7" /></svg>`,
    list: `<svg viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="5" cy="6" r="1" /><circle cx="5" cy="12" r="1" /><circle cx="5" cy="18" r="1" /></svg>`,
    check: `<svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>`,
    x: `<svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12" /></svg>`,
    eye: `<svg viewBox="0 0 24 24"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" /><circle cx="12" cy="12" r="3" /></svg>`,
    "more-vertical": `<svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg>`,
    "calendar-alert": `<svg viewBox="0 0 24 24"><path d="M8 2v4M16 2v4" /><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M3 10h18" /><circle cx="17" cy="16" r="1.5" /></svg>`,
    pending: `<svg viewBox="0 0 24 24"><path d="M12 6v6l4 2" /><circle cx="12" cy="12" r="8" /></svg>`,
    "check-circle": `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" /><path d="M8.5 12.5l2.5 2.5 4.5-5" /></svg>`,
    close: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5 8.5 15.5M8.5 8.5l7 7" /></svg>`,
    "clock-3": `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" /><path d="M12 7v5l3 2" /></svg>`,
    hash: `<svg viewBox="0 0 24 24"><path d="M5 9h14M3 15h14M10 3 8 21M16 3l-2 18" /></svg>`,
    "badge-check": `<svg viewBox="0 0 24 24"><path d="m9 12 2 2 4-4" /><path d="M8.5 4.5 12 3l3.5 1.5 3 3L20 11l-1.5 3.5-3 3L12 19l-3.5-1.5-3-3L4 11l1.5-3.5z" /></svg>`,
    sparkles: `<svg viewBox="0 0 24 24"><path d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6Z" /><path d="M5 19l.7 1.8L7.5 21l-1.8.7L5 23l-.7-1.3L2.5 21l1.8-.2Z" /><path d="M19 15l.7 1.8 1.8.2-1.8.7L19 19l-.7-1.3-1.8-.7 1.8-.2Z" /></svg>`,
    inbox: `<svg viewBox="0 0 24 24"><path d="M4 13V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7" /><path d="M4 13h4l2 3h4l2-3h4" /><path d="M4 13v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" /></svg>`,
    phone: `<svg viewBox="0 0 24 24"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.4 2.9a2 2 0 0 1-.6 1.7l-1.3 1.3a16 16 0 0 0 6.4 6.4l1.3-1.3a2 2 0 0 1 1.7-.6l2.9.4A2 2 0 0 1 22 16.9Z" /></svg>`,
    moon: `<svg viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" /></svg>`,
    "trending-up": `<svg viewBox="0 0 24 24"><path d="M22 7h-6" /><path d="M22 7v6" /><path d="m22 7-8.5 8.5-5-5L2 17" /></svg>`,
    tag: `<svg viewBox="0 0 24 24"><path d="M20 10 11 19l-8-8V4h7Z" /><circle cx="7.5" cy="7.5" r=".5" /></svg>`,
    circle: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7" /></svg>`,
  };
  return icons[name] || "";
}

function requestsInlineIcon(name, extraClass = "") {
  return `<span class="requests-inline-icon ${extraClass}">${requestsIcon(name)}</span>`;
}

function tableHeadLabel(icon, label) {
  return `<span class="requests-head-label">${requestsInlineIcon(icon)}<span>${label}</span></span>`;
}

function showRequestsToast(message) {
  const toast = document.querySelector("[data-dashboard-toast]");
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  toast.classList.add("is-visible");
  window.clearTimeout(showRequestsToast.timer);
  showRequestsToast.timer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
    window.setTimeout(() => { toast.hidden = true; }, 180);
  }, 2400);
}

function groupBy(items, keyFn) {
  return items.reduce((map, item) => {
    const key = keyFn(item) || "";
    const list = map.get(key) || [];
    list.push(item);
    map.set(key, list);
    return map;
  }, new Map());
}

function dedupeBy(items, key) {
  const seen = new Set();
  return items.filter((item) => {
    const value = item[key];
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

function paginate(items, page = 1, perPage = 10) {
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const nextPage = Math.min(Math.max(1, page), pages);
  const start = (nextPage - 1) * perPage;
  const end = Math.min(total, start + perPage);
  return { page: nextPage, pages, total, start: total ? start + 1 : 0, end, items: items.slice(start, end) };
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value = "") {
  return escapeHtml(value);
}

function formatDate(value, withYear = true) {
  if (!value) return "не указано";
  const date = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value);
  if (Number.isNaN(date.getTime())) return "не указано";
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", ...(withYear ? { year: "numeric" } : {}) }).format(date).replace(" г.", "");
}

function formatDateTime(value, compact = false) {
  if (!value) return "не указано";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "не указано";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    ...(compact ? {} : { year: "numeric" }),
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function relativeTime(value) {
  if (!value) return "только что";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "только что";
  const diff = Math.max(0, Date.now() - date.getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes || 1} мин назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  return `${days} дн назад`;
}

function plural(count, forms) {
  const abs = Math.abs(Number(count));
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}

function nightsBetween(start, end) {
  const left = new Date(`${start || ""}T00:00:00`);
  const right = new Date(`${end || ""}T00:00:00`);
  if (Number.isNaN(left.getTime()) || Number.isNaN(right.getTime())) return 0;
  return Math.max(1, Math.round((right - left) / 86400000));
}

function toInputDateValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function inRange(date, from, to) {
  return date >= from && date <= to;
}
