const BOOKINGS_SESSION_KEY = "anima.admin.session.v1";
const BOOKINGS_CURRENCY_KEY = "anima.admin.currency";
const BOOKINGS_RANGE_KEY = "anima.admin.bookings.range.v1";
const BOOKINGS_OBJECT_DETAIL_KEY = "anima.admin.objects.detail.v1";
const bookingsSeedData = window.ANIMA_DATA || {};

const bookingsSidebarSections = [
  {
    title: "Управление",
    items: [
      { id: "home", label: "Главная", icon: "house", href: "./dashboard.html" },
      { id: "objects", label: "Объекты и партнёры", icon: "buildings", href: "./objects-partners.html" },
      { id: "requests", label: "Заявки на бронирование", icon: "calendar-check", href: "./requests.html" },
      { id: "bookings", label: "Бронирования", icon: "book-open", href: "./bookings.html", active: true },
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

const bookingsState = {
  currency: localStorage.getItem(BOOKINGS_CURRENCY_KEY) || "USD",
  filters: {
    search: "",
    status: "all",
    property: "all",
    channel: "all",
    checkin: "",
    checkout: "",
  },
  tab: "all",
  page: 1,
  perPage: 10,
  detailId: "",
  menuId: "",
  panelMode: "edit",
  editDraft: null,
  data: null,
};

document.addEventListener("DOMContentLoaded", () => {
  if (!ensureBookingsSession()) return;
  window.ANIMA_DB?.ensure?.(bookingsSeedData);
  hydrateBookingRange();
  hydrateBookingQuery();
  renderBookingsSidebar();
  bindBookingsUi();
  loadBookingsPage();
});

function ensureBookingsSession() {
  try {
    const session = JSON.parse(sessionStorage.getItem(BOOKINGS_SESSION_KEY) || "null");
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

function currentBookingsSession() {
  try {
    return JSON.parse(sessionStorage.getItem(BOOKINGS_SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

function bindBookingsUi() {
  const sidebar = document.querySelector("[data-sidebar]");
  const shell = document.querySelector(".dashboard-home-shell");
  document.querySelectorAll("[data-sidebar-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      sidebar?.classList.toggle("is-collapsed");
      shell?.classList.toggle("sidebar-collapsed");
    });
  });
  document.addEventListener("click", handleBookingsClick);
  document.addEventListener("input", handleBookingsInput);
  document.addEventListener("change", handleBookingsChange);
}

function loadBookingsPage() {
  bookingsState.data = normalizeBookingsData();
  if (!bookingsState.filters.hydrated) {
    if (!bookingsState.filters.checkin || !bookingsState.filters.checkout) applyBookingsDefaultRange();
    bookingsState.filters.hydrated = true;
  }
  if (bookingsState.detailId && !bookingsState.editDraft) {
    const item = bookingsState.data.bookings.find((booking) => booking.id === bookingsState.detailId);
    if (item) bookingsState.editDraft = buildEditDraft(item);
  }
  renderBookingsPage();
}

function renderBookingsSidebar() {
  const nav = document.querySelector("[data-sidebar-nav]");
  if (!nav) return;
  nav.innerHTML = bookingsSidebarSections.map((section) => `
    <section class="sidebar-group">
      <h3>${section.title}</h3>
      <div class="sidebar-links">
        ${section.items.map((item) => `
          <button type="button" class="sidebar-link ${item.active ? "is-active" : ""}" data-nav-item="${item.id}" data-nav-label="${item.label}" ${item.href ? `data-nav-href="${item.href}"` : ""}>
            <span class="sidebar-link-icon">${bookingsIcon(item.icon)}</span>
            <span class="sidebar-link-label">${item.label}</span>
            ${item.id === "requests" ? renderSidebarRequestsCount() : ""}
          </button>
        `).join("")}
      </div>
    </section>
  `).join("");
}

function renderBookingsPage() {
  renderBookingsTopbar();
  renderBookingsSidebar();
  const app = document.querySelector("[data-bookings-app]");
  if (!app || !bookingsState.data) return;
  app.innerHTML = bookingsState.detailId ? renderBookingDetailScreen() : renderBookingsListScreen();
}

function renderBookingsTopbar() {
  const topbar = document.querySelector("[data-topbar-right]");
  if (!topbar || !bookingsState.data) return;
  const session = currentBookingsSession();
  topbar.innerHTML = `
    <label class="currency-switch requests-currency">
      <span class="currency-switch-label">Валюта</span>
      <select data-bookings-currency>
        ${(bookingsState.data.currencies || ["USD", "VND", "EUR", "RUB", "UAH"]).map((code) => `<option value="${code}" ${code === bookingsState.currency ? "selected" : ""}>${code}</option>`).join("")}
      </select>
    </label>
    <button type="button" class="topbar-link-button notification-button" aria-label="Уведомления">
      ${bookingsIcon("bell")}
      ${bookingsState.data.requestCount ? `<span class="notification-badge">${bookingsState.data.requestCount}</span>` : ""}
    </button>
    <button type="button" class="profile-button" data-logout-button>
      <span class="profile-avatar">${bookingsIcon("user-fill")}</span>
      <span class="profile-copy">
        <strong>${escapeHtml(session?.username || "ADMIN_ANIMA1")}</strong>
        <small>Super Admin</small>
      </span>
      <span class="profile-chevron">${bookingsIcon("chevron")}</span>
    </button>
  `;
}

function renderBookingsListScreen() {
  const filtered = filteredBookings();
  const page = paginate(filtered, bookingsState.page, bookingsState.perPage);
  bookingsState.page = page.page;
  return `
    <section class="bookings-hero">
      <div class="bookings-hero-main">
        <h1>Бронирования</h1>
        <p>Управление всеми бронированиями в системе</p>
      </div>
      <div class="bookings-hero-actions">
        <button type="button" class="filter-button requests-date-button" data-bookings-quick-range>
          <span class="filter-icon">${bookingsIcon("calendar")}</span>
          <span>${bookingsRangeLabel()}</span>
        </button>
        <button type="button" class="filter-button requests-filter-button" data-bookings-focus-filters>
          <span class="filter-icon">${bookingsIcon("filter")}</span>
          <span>Фильтры</span>
          <span class="profile-chevron">${bookingsIcon("chevron")}</span>
        </button>
      </div>
    </section>

    <section class="bookings-kpis">
      ${renderBookingsKpis()}
    </section>

    <section class="bookings-table-card dashboard-card">
      <div class="requests-filterbar bookings-filterbar" id="bookings-filters">
        <label class="requests-filter-search bookings-wide-search">
          <span class="dashboard-search-icon">${bookingsIcon("search")}</span>
          <input type="search" placeholder="Поиск по ID брони, гостю, объекту..." value="${escapeAttribute(bookingsState.filters.search)}" data-bookings-filter-search />
        </label>
        <label class="requests-select">
          <span class="requests-field-icon">${bookingsIcon("filter")}</span>
          <select data-bookings-filter-status>
            ${bookingStatusFilterOptions().map((item) => `<option value="${item.value}" ${item.value === bookingsState.filters.status ? "selected" : ""}>${item.label}</option>`).join("")}
          </select>
        </label>
        <label class="requests-select">
          <span class="requests-field-icon">${bookingsIcon("building-2")}</span>
          <select data-bookings-filter-property>
            <option value="all">Все объекты</option>
            ${bookingsState.data.properties.map((item) => `<option value="${escapeAttribute(item.id)}" ${item.id === bookingsState.filters.property ? "selected" : ""}>${escapeHtml(item.title)}</option>`).join("")}
          </select>
        </label>
        <label class="requests-select">
          <span class="requests-field-icon">${bookingsIcon("globe")}</span>
          <select data-bookings-filter-channel>
            <option value="all">Все каналы</option>
            ${bookingsState.data.channels.map((item) => `<option value="${escapeAttribute(item)}" ${item === bookingsState.filters.channel ? "selected" : ""}>${escapeHtml(item)}</option>`).join("")}
          </select>
        </label>
        <label class="requests-select requests-select-date">
          <span class="requests-field-icon">${bookingsIcon("calendar-range")}</span>
          <input type="date" value="${escapeAttribute(bookingsState.filters.checkin)}" data-bookings-filter-checkin />
        </label>
        <label class="requests-select requests-select-date">
          <span class="requests-field-icon">${bookingsIcon("calendar-range")}</span>
          <input type="date" value="${escapeAttribute(bookingsState.filters.checkout)}" data-bookings-filter-checkout />
        </label>
        <button type="button" class="requests-reset-button" data-bookings-reset>
          ${bookingsIcon("reset")}
          <span>Сбросить фильтры</span>
        </button>
        <button type="button" class="requests-list-style" aria-label="Вид списка">
          ${bookingsIcon("list")}
        </button>
      </div>

      <div class="bookings-tabs">
        ${bookingTabs().map((item) => `
          <button type="button" class="bookings-tab ${bookingsState.tab === item.id ? "active" : ""}" data-bookings-tab="${item.id}">
            ${bookingsInlineIcon(item.icon)}
            <span>${item.label}</span>
          </button>
        `).join("")}
      </div>

      <div class="bookings-table-wrap">
        <div class="bookings-table-head">
          <span>${bookingsHeadLabel("hash", "Бронирование")}</span>
          <span>${bookingsHeadLabel("building-2", "Объект / Номер")}</span>
          <span>${bookingsHeadLabel("user-round", "Гость")}</span>
          <span>${bookingsHeadLabel("mail", "Контакты")}</span>
          <span>${bookingsHeadLabel("calendar-range", "Даты проживания")}</span>
          <span>${bookingsHeadLabel("users", "Гости")}</span>
          <span>${bookingsHeadLabel("wallet", "Сумма")}</span>
          <span>${bookingsHeadLabel("badge-check", "Статус")}</span>
          <span>${bookingsHeadLabel("globe", "Канал")}</span>
          <span>${bookingsHeadLabel("clock-3", "Создана")}</span>
          <span>${bookingsHeadLabel("sparkles", "Действия")}</span>
        </div>
        <div class="bookings-table-body">
          ${page.items.map(renderBookingTableRow).join("") || `<div class="notification-empty requests-empty">По текущим фильтрам бронирований нет.</div>`}
        </div>
      </div>

      <div class="requests-table-footer">
        <span>Показано ${page.total ? `${page.start}-${page.end}` : "0-0"} из ${page.total} бронирований</span>
        <div class="requests-pagination">${renderBookingsPagination(page.page, page.pages)}</div>
        <label class="requests-per-page">
          <span>Показывать по</span>
          <select data-bookings-per-page>
            ${[10, 20, 30].map((item) => `<option value="${item}" ${item === bookingsState.perPage ? "selected" : ""}>${item}</option>`).join("")}
          </select>
        </label>
      </div>
    </section>
  `;
}

function renderBookingDetailScreen() {
  const booking = bookingsState.data.bookings.find((item) => item.id === bookingsState.detailId);
  if (!booking) {
    bookingsState.detailId = "";
    syncBookingsQuery();
    return renderBookingsListScreen();
  }
  if (!bookingsState.editDraft) bookingsState.editDraft = buildEditDraft(booking);
  const draft = bookingsState.editDraft;
  return `
    <section class="booking-detail-shell">
      <div class="booking-detail-main">
        <div class="booking-detail-back-row">
          <button type="button" class="request-back-button" data-bookings-close-detail>
            ${bookingsIcon("chevron-left")}
            <span>Назад к списку</span>
          </button>
        </div>

        <div class="booking-detail-header">
          <div>
            <h1>Бронирование ${escapeHtml(booking.displayId)}</h1>
            <div class="booking-detail-header-meta">
              ${renderBookingStatusBadge(booking)}
              ${booking.vip ? `<span class="booking-vip-chip">${bookingsInlineIcon("star")}VIP</span>` : ""}
            </div>
          </div>
          <div class="booking-detail-header-actions">
            <button type="button" class="request-back-button" data-booking-write-guest="${booking.id}">
              ${bookingsIcon("message-square")}
              <span>Написать гостю</span>
            </button>
            <button type="button" class="request-back-button" data-booking-open-object="${booking.id}">
              ${bookingsIcon("building-2")}
              <span>Открыть объект</span>
            </button>
            <button type="button" class="request-confirm-primary" data-booking-toggle-actions="${booking.id}">
              ${bookingsIcon("more-vertical")}
              <span>Действия</span>
            </button>
          </div>
        </div>

        <div class="booking-detail-overview">
          <article class="dashboard-card booking-overview-card booking-overview-object">
            <h2>Объект и номер</h2>
            <div class="booking-overview-object-row">
              <span class="booking-overview-thumb" style="${booking.photoStyle}"></span>
              <div>
                <strong>${escapeHtml(booking.propertyTitle)}</strong>
                <p>${escapeHtml(booking.location)}</p>
                <small>${escapeHtml(booking.unitName)}</small>
              </div>
            </div>
            <span class="booking-overview-id">ID объекта: ${escapeHtml(booking.propertySourceId)}</span>
          </article>

          <article class="dashboard-card booking-overview-card">
            <h2>Даты проживания</h2>
            <div class="booking-overview-date-grid">
              <div>
                <strong>${escapeHtml(formatDate(booking.startDate))}</strong>
                <small>заезд с 14:00</small>
              </div>
              <div class="booking-arrow">${bookingsIcon("arrow-right")}</div>
              <div>
                <strong>${escapeHtml(formatDate(booking.endDate))}</strong>
                <small>выезд до 12:00</small>
              </div>
            </div>
            <span class="booking-night-chip">${booking.nights} ${plural(booking.nights, ["ночь", "ночи", "ночей"])}</span>
          </article>

          <article class="dashboard-card booking-overview-card">
            <h2>Гости</h2>
            <div class="booking-guest-count-block">
              <strong>${booking.guestsCount} ${plural(booking.guestsCount, ["гость", "гостя", "гостей"])}</strong>
              <small>Взрослые: ${booking.guestsCount}</small>
              <small>Дети: 0</small>
            </div>
          </article>
        </div>

        <div class="booking-detail-cards">
          <article class="dashboard-card booking-guest-card ${booking.clientId ? "is-clickable" : ""}" ${booking.clientId ? `data-booking-open-guest="${booking.id}"` : ""}>
            <h2>Гость</h2>
            <div class="booking-guest-card-row">
              <span class="booking-guest-avatar">${escapeHtml(booking.guestInitials)}</span>
              <div>
                <strong>${escapeHtml(booking.guestName)}</strong>
                <p>${escapeHtml(booking.guestEmail || "email не указан")}</p>
                <small>${escapeHtml(booking.guestPhone || "телефон не указан")}</small>
                <small>${escapeHtml(booking.messengerLine)}</small>
              </div>
            </div>
            <div class="booking-guest-stats">
              <span>Бронирований: ${booking.guestBookingCount}</span>
              <span>Потрачено: ${escapeHtml(formatMoney(booking.guestSpend))}</span>
              <span>Статус: ${escapeHtml(booking.clientStatusLabel)}</span>
            </div>
            <button type="button" class="booking-open-profile-button" ${booking.clientId ? `data-booking-open-guest="${booking.id}"` : "disabled"}>Открыть профиль гостя</button>
          </article>

          <article class="dashboard-card booking-payment-card">
            <h2>Платёж</h2>
            <div class="booking-payment-grid">
              <span>Сумма бронирования</span><strong>${escapeHtml(booking.primaryAmount)}</strong>
              <span>Оплачено</span><strong>${escapeHtml(booking.paidAmountLabel)}</strong>
              <span>Способ оплаты</span><strong>${escapeHtml(booking.paymentMethodLabel)}</strong>
              <span>Статус оплаты</span><strong>${escapeHtml(booking.paymentStatusLabel)}</strong>
            </div>
            <button type="button" class="booking-open-profile-button" data-booking-open-payment="${booking.id}">${booking.payments.length ? "Открыть платёж" : "Создать платёж"}</button>
          </article>

          <article class="dashboard-card booking-comments-card">
            <div class="booking-card-head">
              <h2>Комментарии</h2>
              <button type="button" class="card-link-button" data-booking-panel="comments">...</button>
            </div>
            <div class="booking-comments-list">
              ${booking.commentLines.length ? booking.commentLines.map((line) => `<p>${escapeHtml(line)}</p>`).join("") : `<p>Комментариев пока нет.</p>`}
            </div>
          </article>
        </div>

        <article class="dashboard-card booking-history-card">
          <h2>История изменений</h2>
          <div class="booking-history-timeline">
            ${booking.history.length ? booking.history.slice(0, 8).map((item) => `
              <article class="booking-history-row">
                <span class="booking-history-dot"></span>
                <div>
                  <strong>${escapeHtml(formatDateTime(item.createdAt))}</strong>
                  <p>${escapeHtml(item.title)}</p>
                  <small>${escapeHtml(item.by)}</small>
                </div>
              </article>
            `).join("") : `<div class="notification-empty">История пока пуста.</div>`}
          </div>
          <button type="button" class="booking-history-more" data-booking-panel="history">Показать всю историю</button>
        </article>
      </div>

      <aside class="booking-detail-aside">
        ${renderBookingSidePanel(booking, draft)}
        ${renderBookingActionsCard(booking)}
      </aside>
    </section>
  `;
}

function renderBookingSidePanel(booking, draft) {
  if (bookingsState.panelMode === "guest") {
    return `
      <article class="dashboard-card booking-edit-panel">
        <div class="booking-side-head">
          <h2>Профиль гостя</h2>
          <button type="button" class="card-link-button" data-booking-panel="edit">×</button>
        </div>
        <div class="booking-side-user-card">
          <span class="booking-side-avatar">${escapeHtml(booking.guestInitials)}</span>
          <strong>${escapeHtml(booking.guestName)}</strong>
          <small>${escapeHtml(booking.guestEmail || "email не указан")}</small>
          <small>${escapeHtml(booking.guestPhone || "телефон не указан")}</small>
          <small>${escapeHtml(booking.messengerLine)}</small>
          <div class="booking-side-stats">
            <span>Бронирований: ${booking.guestBookingCount}</span>
            <span>Потрачено: ${escapeHtml(formatMoney(booking.guestSpend))}</span>
            <span>VIP: ${booking.vip ? "Да" : "Нет"}</span>
          </div>
        </div>
      </article>
    `;
  }

  if (bookingsState.panelMode === "payment") {
    return `
      <article class="dashboard-card booking-edit-panel">
        <div class="booking-side-head">
          <h2>Платёж бронирования</h2>
          <button type="button" class="card-link-button" data-booking-panel="edit">×</button>
        </div>
        <div class="booking-side-payment-block">
          ${booking.payments.length ? booking.payments.map((item) => `
            <div class="booking-side-payment-row">
              <strong>${escapeHtml(formatMoney(item.amount || 0))}</strong>
              <span>${escapeHtml(item.method || item.payment_method || "manual")}</span>
              <small>${escapeHtml(paymentStatusLabel(item.status))}</small>
            </div>
          `).join("") : `<div class="notification-empty">Платежа пока нет.</div>`}
        </div>
        <div class="booking-edit-actions">
          <button type="button" class="secondary" data-booking-create-payment="${booking.id}">${booking.payments.length ? "Записать ещё оплату" : "Создать платёж"}</button>
        </div>
      </article>
    `;
  }

  return `
    <article class="dashboard-card booking-edit-panel">
      <div class="booking-side-head">
        <h2>Редактирование бронирования</h2>
        <button type="button" class="card-link-button" data-booking-panel="guest">×</button>
      </div>
      <div class="booking-edit-group">
        <label>Статус
          <select data-booking-edit-status>
            ${editableStatuses().map((item) => `<option value="${item.value}" ${item.value === draft.status ? "selected" : ""}>${item.label}</option>`).join("")}
          </select>
        </label>
        <label>Объект
          <select data-booking-edit-property>
            ${bookingsState.data.properties.map((item) => `<option value="${item.id}" ${item.id === draft.propertyId ? "selected" : ""}>${escapeHtml(item.title)}</option>`).join("")}
          </select>
        </label>
        <label>Номер
          <select data-booking-edit-unit>
            ${unitsForProperty(draft.propertyId).map((item) => `<option value="${item.id}" ${item.id === draft.unitId ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}
          </select>
        </label>
        <div class="booking-edit-dates">
          <label>Дата заезда
            <input type="date" value="${escapeAttribute(draft.startDate)}" data-booking-edit-start />
          </label>
          <label>Дата выезда
            <input type="date" value="${escapeAttribute(draft.endDate)}" data-booking-edit-end />
          </label>
        </div>
        <label>Количество гостей
          <input type="number" min="1" value="${escapeAttribute(String(draft.guestsCount))}" data-booking-edit-guests />
        </label>
        <label>Комментарий администратора
          <textarea data-booking-edit-comment>${escapeHtml(draft.comment)}</textarea>
        </label>
        <button type="button" class="booking-recalc-button" data-booking-recalc="${booking.id}">Пересчитать стоимость</button>
      </div>
      <div class="booking-edit-actions">
        <button type="button" class="secondary" data-bookings-cancel-edit>Отмена</button>
        <button type="button" data-bookings-save-edit="${booking.id}">Сохранить изменения</button>
      </div>
    </article>
  `;
}

function renderBookingActionsCard(booking) {
  const open = bookingsState.menuId === booking.id || bookingsState.panelMode === "actions";
  return `
    <article class="dashboard-card booking-actions-panel">
      <div class="booking-actions-toolbar">
        <button type="button" class="requests-action-button neutral" data-booking-open-detail="${booking.id}" aria-label="Открыть">${bookingsIcon("eye")}</button>
        <button type="button" class="requests-action-button neutral" data-booking-panel="edit" aria-label="Редактировать">${bookingsIcon("pencil")}</button>
        <button type="button" class="requests-action-button neutral" data-booking-toggle-actions="${booking.id}" aria-label="Действия">${bookingsIcon("more-vertical")}</button>
      </div>
      ${open ? `
        <div class="booking-actions-menu">
          <button type="button" data-booking-copy="${booking.id}">${bookingsInlineIcon("copy")}Копировать номер брони</button>
          <button type="button" data-booking-open-guest="${booking.id}">${bookingsInlineIcon("user-round")}Открыть профиль гостя</button>
          <button type="button" data-booking-open-object="${booking.id}">${bookingsInlineIcon("building-2")}Открыть объект</button>
          <button type="button" data-booking-write-guest="${booking.id}">${bookingsInlineIcon("message-square")}Написать гостю</button>
          <button type="button" data-booking-send-confirmation="${booking.id}">${bookingsInlineIcon("mail")}Отправить подтверждение</button>
          <button type="button" data-booking-download-pdf="${booking.id}">${bookingsInlineIcon("file-text")}Скачать PDF ваучер</button>
          <button type="button" data-booking-open-payment="${booking.id}">${bookingsInlineIcon("wallet")}Открыть платёж</button>
          <button type="button" data-booking-panel="edit">${bookingsInlineIcon("badge-check")}Изменить статус</button>
          <button type="button" data-booking-toggle-vip="${booking.id}">${bookingsInlineIcon("star")}${booking.vip ? "Снять VIP" : "Пометить как VIP"}</button>
          <button type="button" data-booking-toggle-pin="${booking.id}">${bookingsInlineIcon("pin")}${booking.pinned ? "Открепить" : "Закрепить"}</button>
          <button type="button" class="danger" data-booking-delete="${booking.id}">${bookingsInlineIcon("trash")}Удалить бронь</button>
        </div>
      ` : ""}
    </article>
  `;
}

function normalizeBookingsData() {
  const state = window.ANIMA_DB.getState(bookingsSeedData);
  const properties = state.tables.partnerProperties || [];
  const units = state.tables.partnerUnits || [];
  const users = state.tables.users || [];
  const bookings = (state.tables.partnerBookings || [])
    .filter((item) => !item.deleted_at)
    .sort((a, b) => new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0));
  const payments = state.tables.payments || [];
  const notes = state.tables.adminNotes || [];
  const comments = state.tables.bookingComments || [];
  const history = state.tables.bookingStatusHistory || [];
  const orders = state.tables.orders || [];
  const chats = state.tables.chats || [];
  const messages = state.tables.messages || [];

  const propertyById = new Map(properties.map((item) => [item.id, item]));
  const unitById = new Map(units.map((item) => [item.id, item]));
  const userById = new Map(users.map((item) => [item.id, item]));
  const orderById = new Map(orders.map((item) => [item.id, item]));
  const paymentsByBooking = groupBy(payments, (item) => item.booking_id);
  const notesByBooking = groupBy(notes, (item) => item.booking_id);
  const commentsByBooking = groupBy(comments, (item) => item.booking_id);
  const historyByBooking = groupBy(history, (item) => item.booking_id);
  const chatByBooking = groupBy(chats, (item) => item.booking_id);
  const messagesByChat = groupBy(messages, (item) => item.chat_id);

  const normalizedBookings = bookings.map((booking) => {
    const property = propertyById.get(booking.property_id) || {};
    const unit = unitById.get(booking.unit_id) || {};
    const user = userById.get(booking.client_id) || {};
    const order = orderById.get(booking.sourceOrderId) || {};
    const paymentRows = paymentsByBooking.get(booking.id) || [];
    const noteRows = notesByBooking.get(booking.id) || [];
    const commentRows = commentsByBooking.get(booking.id) || [];
    const historyRows = historyByBooking.get(booking.id) || [];
    const chatRows = chatByBooking.get(booking.id) || [];
    const directChat = chatRows.find((item) => item.type === "client_hotel") || null;
    const guestBookings = bookings.filter((item) => item.client_id && item.client_id === booking.client_id);
    const guestSpend = guestBookings.reduce((sum, item) => sum + Number(item.total_amount || 0), 0);
    const channel = bookingChannelLabel(booking, order);
    const status = bookingStatusPresentation(booking.booking_status, booking.payment_status);
    const vip = Boolean(user.vip || booking.vip_flag);
    const pinned = Boolean(booking.is_pinned);
    return {
      id: booking.id,
      raw: booking,
      propertyId: booking.property_id,
      unitId: booking.unit_id,
      clientId: booking.client_id,
      displayId: displayBookingCode(booking.id),
      shortId: booking.id,
      propertyTitle: property.title || "Объект не указан",
      propertySourceId: String(property.sourceEntryId || property.id || "—"),
      location: property.location || property.address || "Локация не указана",
      unitName: unit.name || unit.title || "Номер не указан",
      photoStyle: photoStyle(property),
      guestName: booking.customer_name || user.fullName || user.name || "Гость",
      guestEmail: booking.customer_email || user.email || "",
      guestPhone: booking.customer_phone || user.phone || "",
      messengerLine: [user.telegram ? `Telegram: ${user.telegram}` : "", user.username ? `@${user.username}` : ""].filter(Boolean).join(" · ") || "Мессенджеры не указаны",
      guestInitials: initials(booking.customer_name || user.fullName || user.name || "Guest"),
      guestBookingCount: guestBookings.length,
      guestSpend,
      clientStatusLabel: vip ? "VIP клиент" : (user.status === "active" ? "Активный клиент" : "Гость"),
      startDate: booking.start_date || "",
      endDate: booking.end_date || "",
      createdAt: booking.createdAt || booking.created_at || "",
      guestsCount: Number(booking.guests_count || 1),
      nights: nightsBetween(booking.start_date, booking.end_date),
      totalAmount: Number(booking.total_amount || 0),
      primaryAmount: formatMoneyValue(Number(booking.total_amount || 0), bookingsState.currency, state),
      secondaryAmount: formatMoneyValue(Number(booking.total_amount || 0), "VND", state),
      paymentMethodLabel: paymentMethodLabel(booking.payment_method),
      paymentStatusLabel: paymentStatusLabel(booking.payment_status),
      paidAmountLabel: formatMoneyValue(paymentRows.reduce((sum, item) => sum + Number(item.amount || 0), 0), bookingsState.currency, state),
      payments: paymentRows,
      channel,
      channelTone: bookingChannelTone(channel),
      statusKey: status.key,
      statusLabel: status.label,
      statusTone: status.tone,
      vip,
      pinned,
      noteRows,
      commentLines: [
        ...(booking.wishes?.comment ? [booking.wishes.comment] : []),
        ...noteRows.map((item) => item.text),
        ...commentRows.map((item) => item.text || item.comment || ""),
      ].filter(Boolean),
      history: buildBookingHistory(historyRows, noteRows, paymentRows),
      directChatId: directChat?.id || "",
      directMessages: directChat ? (messagesByChat.get(directChat.id) || []) : [],
      user,
    };
  });

  return {
    state,
    bookings: normalizedBookings,
    properties: dedupeBy(normalizedBookings.map((item) => ({ id: item.propertyId, title: item.propertyTitle })), "id").filter((item) => item.id),
    channels: dedupePrimitive(normalizedBookings.map((item) => item.channel)),
    units,
    propertiesRaw: properties,
    requestCount: normalizedBookings.filter((item) => ["waiting_payment", "commission_paid", "pending_partner_confirmation"].includes(item.raw.booking_status)).length,
    currencies: state.settings?.currencies || ["USD", "VND", "EUR", "RUB", "UAH"],
    kpis: buildBookingKpis(normalizedBookings, state),
  };
}

function buildBookingKpis(bookings, state) {
  return [
    bookingKpiCard("Всего бронирований", bookings, (item) => true, "calendar-check", "green", "#6edb68", state),
    bookingKpiCard("Активные", bookings, (item) => ["active", "confirmed", "waiting_payment", "commission_paid"].includes(item.statusKey), "calendar-check", "green", "#6edb68", state),
    bookingKpiCard("Завершённые", bookings, (item) => item.statusKey === "completed", "badge-check", "blue", "#5f91ff", state),
    bookingKpiCard("Отменённые", bookings, (item) => item.statusKey === "cancelled", "x-circle", "red", "#f3695f", state),
    moneyKpiCard("Общий доход", bookings, (item) => item.totalAmount, "chart-up", "green", "#6edb68", state),
    moneyKpiCard("Средний чек", bookings, (item) => item.totalAmount, "wallet-card", "violet", "#aa79ff", state, true),
  ];
}

function bookingKpiCard(title, bookings, predicate, icon, tone, color, state) {
  const current = bookings.filter(predicate);
  const previous = previousPeriodRows(bookings).filter(predicate);
  return {
    title,
    value: current.length,
    trendLabel: countTrendLabel(current.length, previous.length),
    trendValue: current.length - previous.length,
    icon,
    tone,
    color,
    points: sparkSeries(current.map((_, index) => index + 1)),
  };
}

function moneyKpiCard(title, bookings, selector, icon, tone, color, state, average = false) {
  const currentRows = bookings;
  const previousRows = previousPeriodRows(bookings);
  const current = average
    ? Math.round(currentRows.reduce((sum, item) => sum + selector(item), 0) / Math.max(1, currentRows.length))
    : currentRows.reduce((sum, item) => sum + selector(item), 0);
  const previous = average
    ? Math.round(previousRows.reduce((sum, item) => sum + selector(item), 0) / Math.max(1, previousRows.length))
    : previousRows.reduce((sum, item) => sum + selector(item), 0);
  return {
    title,
    value: formatMoneyValue(current, bookingsState.currency, state),
    trendLabel: moneyTrendLabel(current, previous, bookingsState.currency, state),
    trendValue: current - previous,
    icon,
    tone,
    color,
    points: sparkSeries(currentRows.slice(-7).map((item) => selector(item))),
  };
}

function filteredBookings() {
  return bookingsState.data.bookings.filter((item) => {
    const query = String(bookingsState.filters.search || "").trim().toLowerCase();
    const matchesQuery = !query
      || item.displayId.toLowerCase().includes(query)
      || item.propertyTitle.toLowerCase().includes(query)
      || item.unitName.toLowerCase().includes(query)
      || item.guestName.toLowerCase().includes(query)
      || item.guestEmail.toLowerCase().includes(query)
      || item.guestPhone.toLowerCase().includes(query);
    const matchesStatus = bookingsState.filters.status === "all" || item.statusKey === bookingsState.filters.status;
    const matchesProperty = bookingsState.filters.property === "all" || item.propertyId === bookingsState.filters.property;
    const matchesChannel = bookingsState.filters.channel === "all" || item.channel === bookingsState.filters.channel;
    const matchesCheckin = !bookingsState.filters.checkin || item.startDate >= bookingsState.filters.checkin;
    const matchesCheckout = !bookingsState.filters.checkout || item.endDate <= bookingsState.filters.checkout;
    const matchesTab = bookingsState.tab === "all" || item.statusKey === bookingsState.tab || (bookingsState.tab === "active" && ["active", "confirmed", "waiting_payment"].includes(item.statusKey));
    return matchesQuery && matchesStatus && matchesProperty && matchesChannel && matchesCheckin && matchesCheckout && matchesTab;
  });
}

function renderBookingsKpis() {
  return bookingsState.data.kpis.map((item) => `
    <article class="requests-kpi-card dashboard-card tone-${item.tone}">
      <div class="requests-kpi-copy">
        <span class="requests-kpi-title">${item.title}</span>
        <strong class="requests-kpi-value">${escapeHtml(String(item.value))}</strong>
        <span class="requests-kpi-meta ${item.trendValue > 0 ? "up" : item.trendValue < 0 ? "down" : ""}">${escapeHtml(item.trendLabel)}</span>
      </div>
      <div class="requests-kpi-side">
        <span class="requests-kpi-icon">${bookingsIcon(item.icon)}</span>
        ${renderSparkline(item.points, item.color)}
      </div>
    </article>
  `).join("");
}

function renderBookingTableRow(booking) {
  return `
    <article class="bookings-row ${booking.statusTone} ${booking.pinned ? "is-pinned" : ""}" data-booking-open-detail="${booking.id}">
      <div class="requests-cell bookings-id-cell">
        <strong>${escapeHtml(booking.displayId)}</strong>
        ${renderBookingStatusBadge(booking)}
        <small>${bookingsInlineIcon("hash")}ID: ${escapeHtml(booking.shortId)}</small>
      </div>
      <div class="requests-cell bookings-object-cell">
        <span class="requests-thumb" style="${booking.photoStyle}"></span>
        <div>
          <strong>${escapeHtml(booking.propertyTitle)}</strong>
          <small>${escapeHtml(booking.location)}</small>
          <small>${escapeHtml(booking.unitName)}</small>
        </div>
      </div>
      <div class="requests-cell">
        <strong>${escapeHtml(booking.guestName)}</strong>
        ${booking.vip ? `<small class="booking-vip-inline">${bookingsInlineIcon("star")}VIP</small>` : `<small>${escapeHtml(booking.clientStatusLabel)}</small>`}
      </div>
      <div class="requests-cell">
        <small>${bookingsInlineIcon("mail")}${escapeHtml(booking.guestEmail || "—")}</small>
        <small>${bookingsInlineIcon("phone")}${escapeHtml(booking.guestPhone || "—")}</small>
      </div>
      <div class="requests-cell">
        <strong>${escapeHtml(`${formatDate(booking.startDate)} - ${formatDate(booking.endDate)}`)}</strong>
        <small>${booking.nights} ${plural(booking.nights, ["ночь", "ночи", "ночей"])}</small>
      </div>
      <div class="requests-cell bookings-guest-count">
        <span class="requests-mini-icon">${bookingsIcon("users")}</span>
        <strong>${booking.guestsCount}</strong>
      </div>
      <div class="requests-cell">
        <strong>${escapeHtml(booking.primaryAmount)}</strong>
        <small>${escapeHtml(booking.secondaryAmount)}</small>
      </div>
      <div class="requests-cell">${renderBookingStatusBadge(booking)}</div>
      <div class="requests-cell bookings-channel-cell">
        <span class="booking-channel-logo tone-${booking.channelTone}">${bookingsChannelMark(booking.channel)}</span>
        <strong>${escapeHtml(booking.channel)}</strong>
      </div>
      <div class="requests-cell">
        <strong>${escapeHtml(formatDateTime(booking.createdAt, true))}</strong>
        <small>${escapeHtml(relativeTime(booking.createdAt))}</small>
      </div>
      <div class="requests-cell requests-cell-actions">
        <button type="button" class="requests-action-button neutral" data-booking-open-detail="${booking.id}" aria-label="Открыть">${bookingsIcon("eye")}</button>
        <button type="button" class="requests-action-button neutral" data-booking-open-edit="${booking.id}" aria-label="Редактировать">${bookingsIcon("pencil")}</button>
        <button type="button" class="requests-action-button" data-booking-toggle-row-menu="${booking.id}" aria-label="Действия">${bookingsIcon("more-vertical")}</button>
        ${bookingsState.menuId === booking.id ? renderRowActionMenu(booking) : ""}
      </div>
    </article>
  `;
}

function renderRowActionMenu(booking) {
  return `
    <div class="requests-action-menu booking-row-action-menu">
      <button type="button" data-booking-copy="${booking.id}">Копировать номер брони</button>
      <button type="button" data-booking-open-guest="${booking.id}">Открыть профиль гостя</button>
      <button type="button" data-booking-open-object="${booking.id}">Открыть объект</button>
      <button type="button" data-booking-write-guest="${booking.id}">Написать гостю</button>
      <button type="button" data-booking-send-confirmation="${booking.id}">Отправить подтверждение</button>
      <button type="button" data-booking-download-pdf="${booking.id}">Скачать PDF ваучер</button>
      <button type="button" data-booking-open-payment="${booking.id}">Открыть платёж</button>
      <button type="button" data-booking-open-edit="${booking.id}">Изменить статус</button>
      <button type="button" data-booking-toggle-vip="${booking.id}">${booking.vip ? "Снять VIP" : "Пометить как VIP"}</button>
      <button type="button" data-booking-toggle-pin="${booking.id}">${booking.pinned ? "Открепить" : "Закрепить"}</button>
      <button type="button" class="danger" data-booking-delete="${booking.id}">Удалить бронь</button>
    </div>
  `;
}

function handleBookingsClick(event) {
  const navButton = event.target.closest("[data-nav-item]");
  if (navButton) {
    if (navButton.dataset.navHref) {
      location.assign(navButton.dataset.navHref);
      return;
    }
    showBookingsToast(`Раздел «${navButton.dataset.navLabel}» подготовим следующим экраном.`);
    return;
  }
  if (event.target.closest("[data-logout-button]")) {
    sessionStorage.removeItem(BOOKINGS_SESSION_KEY);
    location.replace("./");
    return;
  }
  if (event.target.closest("[data-bookings-focus-filters]")) {
    document.querySelector("[data-bookings-filter-search]")?.focus();
    return;
  }
  if (event.target.closest("[data-bookings-quick-range]")) {
    applyBookingsMonthRange();
    renderBookingsPage();
    return;
  }
  if (event.target.closest("[data-bookings-reset]")) {
    resetBookingsFilters();
    renderBookingsPage();
    return;
  }
  const tabButton = event.target.closest("[data-bookings-tab]");
  if (tabButton) {
    bookingsState.tab = tabButton.dataset.bookingsTab;
    bookingsState.page = 1;
    renderBookingsPage();
    return;
  }
  const rowMenuButton = event.target.closest("[data-booking-toggle-row-menu]");
  if (rowMenuButton) {
    bookingsState.menuId = bookingsState.menuId === rowMenuButton.dataset.bookingToggleRowMenu ? "" : rowMenuButton.dataset.bookingToggleRowMenu;
    renderBookingsPage();
    return;
  }
  const actionsToggle = event.target.closest("[data-booking-toggle-actions]");
  if (actionsToggle) {
    const nextOpen = !(bookingsState.panelMode === "actions" && bookingsState.menuId === actionsToggle.dataset.bookingToggleActions);
    bookingsState.panelMode = nextOpen ? "actions" : "edit";
    bookingsState.menuId = nextOpen ? actionsToggle.dataset.bookingToggleActions : "";
    syncBookingsQuery();
    renderBookingsPage();
    return;
  }

  const actionMap = [
    ["[data-booking-open-detail]", (el) => openBookingDetail(el.dataset.bookingOpenDetail, "edit")],
    ["[data-booking-open-edit]", (el) => openBookingDetail(el.dataset.bookingOpenEdit, "edit")],
    ["[data-bookings-close-detail]", () => closeBookingDetail()],
    ["[data-booking-copy]", (el) => copyBookingCode(el.dataset.bookingCopy)],
    ["[data-booking-open-guest]", (el) => openGuestPanel(el.dataset.bookingOpenGuest)],
    ["[data-booking-open-object]", (el) => openObjectFromBooking(el.dataset.bookingOpenObject)],
    ["[data-booking-write-guest]", (el) => writeGuest(el.dataset.bookingWriteGuest)],
    ["[data-booking-send-confirmation]", (el) => sendBookingConfirmation(el.dataset.bookingSendConfirmation)],
    ["[data-booking-download-pdf]", (el) => downloadBookingVoucher(el.dataset.bookingDownloadPdf)],
    ["[data-booking-open-payment]", (el) => openPaymentPanel(el.dataset.bookingOpenPayment)],
    ["[data-booking-toggle-vip]", (el) => toggleVip(el.dataset.bookingToggleVip)],
    ["[data-booking-toggle-pin]", (el) => togglePinned(el.dataset.bookingTogglePin)],
    ["[data-booking-delete]", (el) => deleteBooking(el.dataset.bookingDelete)],
    ["[data-booking-panel]", (el) => setPanelMode(el.dataset.bookingPanel)],
    ["[data-booking-recalc]", (el) => recalcBookingDraft(el.dataset.bookingRecalc)],
    ["[data-bookings-save-edit]", (el) => saveBookingEdit(el.dataset.bookingsSaveEdit)],
    ["[data-bookings-cancel-edit]", () => restoreBookingDraft()],
    ["[data-booking-create-payment]", (el) => createManualPayment(el.dataset.bookingCreatePayment)],
    ["[data-booking-open-payment]", (el) => openPaymentPanel(el.dataset.bookingOpenPayment)],
  ];
  for (const [selector, handler] of actionMap) {
    const button = event.target.closest(selector);
    if (button) {
      handler(button);
      return;
    }
  }

  if (
    bookingsState.menuId &&
    !event.target.closest(".requests-action-menu") &&
    !event.target.closest(".booking-actions-menu") &&
    !event.target.closest("[data-booking-toggle-row-menu]") &&
    !event.target.closest("[data-booking-toggle-actions]")
  ) {
    bookingsState.menuId = "";
    if (bookingsState.panelMode === "actions") bookingsState.panelMode = "edit";
    syncBookingsQuery();
    renderBookingsPage();
    return;
  }

  const pageButton = event.target.closest("[data-bookings-page]");
  if (pageButton) {
    bookingsState.page = Number(pageButton.dataset.bookingsPage);
    renderBookingsPage();
    return;
  }

  const detailRow = event.target.closest("[data-booking-open-detail]");
  if (detailRow) openBookingDetail(detailRow.dataset.bookingOpenDetail, "edit");
}

function handleBookingsInput(event) {
  if (event.target.matches("[data-global-search], [data-bookings-filter-search]")) {
    bookingsState.filters.search = event.target.value;
    syncSearchInputs(event.target.value);
    bookingsState.page = 1;
    renderBookingsPage();
    return;
  }
  if (event.target.matches("[data-booking-edit-comment]")) {
    ensureEditDraft();
    bookingsState.editDraft.comment = event.target.value;
  }
}

function handleBookingsChange(event) {
  if (event.target.matches("[data-bookings-currency]")) {
    bookingsState.currency = event.target.value;
    localStorage.setItem(BOOKINGS_CURRENCY_KEY, bookingsState.currency);
    bookingsState.data = normalizeBookingsData();
    renderBookingsPage();
    return;
  }
  if (event.target.matches("[data-bookings-filter-status]")) {
    bookingsState.filters.status = event.target.value;
    bookingsState.page = 1;
    renderBookingsPage();
    return;
  }
  if (event.target.matches("[data-bookings-filter-property]")) {
    bookingsState.filters.property = event.target.value;
    bookingsState.page = 1;
    renderBookingsPage();
    return;
  }
  if (event.target.matches("[data-bookings-filter-channel]")) {
    bookingsState.filters.channel = event.target.value;
    bookingsState.page = 1;
    renderBookingsPage();
    return;
  }
  if (event.target.matches("[data-bookings-filter-checkin]")) {
    bookingsState.filters.checkin = event.target.value;
    persistBookingRange();
    bookingsState.page = 1;
    renderBookingsPage();
    return;
  }
  if (event.target.matches("[data-bookings-filter-checkout]")) {
    bookingsState.filters.checkout = event.target.value;
    persistBookingRange();
    bookingsState.page = 1;
    renderBookingsPage();
    return;
  }
  if (event.target.matches("[data-bookings-per-page]")) {
    bookingsState.perPage = Number(event.target.value || 10);
    bookingsState.page = 1;
    renderBookingsPage();
    return;
  }
  if (event.target.matches("[data-booking-edit-status]")) {
    ensureEditDraft();
    bookingsState.editDraft.status = event.target.value;
    return;
  }
  if (event.target.matches("[data-booking-edit-property]")) {
    ensureEditDraft();
    bookingsState.editDraft.propertyId = event.target.value;
    const nextUnits = unitsForProperty(bookingsState.editDraft.propertyId);
    bookingsState.editDraft.unitId = nextUnits[0]?.id || "";
    renderBookingsPage();
    return;
  }
  if (event.target.matches("[data-booking-edit-unit]")) {
    ensureEditDraft();
    bookingsState.editDraft.unitId = event.target.value;
    return;
  }
  if (event.target.matches("[data-booking-edit-start]")) {
    ensureEditDraft();
    bookingsState.editDraft.startDate = event.target.value;
    return;
  }
  if (event.target.matches("[data-booking-edit-end]")) {
    ensureEditDraft();
    bookingsState.editDraft.endDate = event.target.value;
    return;
  }
  if (event.target.matches("[data-booking-edit-guests]")) {
    ensureEditDraft();
    bookingsState.editDraft.guestsCount = Math.max(1, Number(event.target.value || 1));
  }
}

function openBookingDetail(id, panelMode = "edit") {
  bookingsState.detailId = id;
  bookingsState.panelMode = panelMode;
  bookingsState.menuId = panelMode === "actions" ? id : "";
  const booking = bookingsState.data.bookings.find((item) => item.id === id);
  bookingsState.editDraft = booking ? buildEditDraft(booking) : null;
  syncBookingsQuery();
  renderBookingsPage();
}

function closeBookingDetail() {
  bookingsState.detailId = "";
  bookingsState.panelMode = "edit";
  bookingsState.menuId = "";
  bookingsState.editDraft = null;
  syncBookingsQuery();
  renderBookingsPage();
}

function buildEditDraft(booking) {
  return {
    status: booking.raw.booking_status,
    propertyId: booking.propertyId,
    unitId: booking.unitId,
    startDate: booking.startDate,
    endDate: booking.endDate,
    guestsCount: booking.guestsCount,
    comment: booking.commentLines[0] || "",
    calculatedAmount: booking.totalAmount,
  };
}

function ensureEditDraft() {
  if (bookingsState.editDraft) return;
  const booking = bookingsState.data.bookings.find((item) => item.id === bookingsState.detailId);
  if (booking) bookingsState.editDraft = buildEditDraft(booking);
}

function restoreBookingDraft() {
  const booking = bookingsState.data.bookings.find((item) => item.id === bookingsState.detailId);
  if (!booking) return;
  bookingsState.editDraft = buildEditDraft(booking);
  renderBookingsPage();
}

function recalcBookingDraft(id) {
  const booking = bookingsState.data.bookings.find((item) => item.id === id);
  if (!booking) return;
  ensureEditDraft();
  const state = bookingsState.data.state;
  const unit = bookingsState.data.units.find((item) => item.id === bookingsState.editDraft.unitId) || {};
  const nights = nightsBetween(bookingsState.editDraft.startDate, bookingsState.editDraft.endDate);
  const base = Number(unit.base_price || unit.price || booking.totalAmount || 0);
  const totalAmount = Math.max(base, base * Math.max(1, nights));
  bookingsState.editDraft.calculatedAmount = totalAmount;
  showBookingsToast(`Стоимость пересчитана: ${formatMoneyValue(totalAmount, bookingsState.currency, state)}.`);
}

function saveBookingEdit(id) {
  const booking = bookingsState.data.bookings.find((item) => item.id === id);
  if (!booking || !bookingsState.editDraft) return;
  const totalAmount = Number(bookingsState.editDraft.calculatedAmount || booking.totalAmount || 0);
  window.ANIMA_DB.updateBookingAdmin(id, {
    actorUserId: currentBookingsSession()?.username || "admin",
    booking_status: bookingsState.editDraft.status,
    property_id: bookingsState.editDraft.propertyId,
    unit_id: bookingsState.editDraft.unitId,
    room_type_id: bookingsState.editDraft.unitId,
    start_date: bookingsState.editDraft.startDate,
    end_date: bookingsState.editDraft.endDate,
    guests_count: bookingsState.editDraft.guestsCount,
    total_amount: totalAmount,
    admin_comment: bookingsState.editDraft.comment || "",
  }, bookingsSeedData);
  if (bookingsState.editDraft.comment) {
    window.ANIMA_DB.addAdminNote({
      authorId: currentBookingsSession()?.username || "admin",
      partnerId: booking.raw.partner_id,
      bookingId: id,
      text: bookingsState.editDraft.comment,
    }, bookingsSeedData);
  }
  showBookingsToast(`Изменения по ${booking.displayId} сохранены.`);
  reloadBookings(id);
}

function copyBookingCode(id) {
  const booking = bookingsState.data.bookings.find((item) => item.id === id);
  if (!booking) return;
  bookingsState.menuId = "";
  if (bookingsState.panelMode === "actions") bookingsState.panelMode = "edit";
  const text = booking.displayId;
  navigator.clipboard?.writeText(text).catch(() => null);
  syncBookingsQuery();
  renderBookingsPage();
  showBookingsToast(`Номер ${text} скопирован.`);
}

function openGuestPanel(id) {
  bookingsState.detailId = id;
  bookingsState.panelMode = "guest";
  bookingsState.menuId = "";
  const booking = bookingsState.data.bookings.find((item) => item.id === id);
  if (booking) bookingsState.editDraft = buildEditDraft(booking);
  syncBookingsQuery();
  renderBookingsPage();
}

function openObjectFromBooking(id) {
  const booking = bookingsState.data.bookings.find((item) => item.id === id);
  if (!booking) return;
  sessionStorage.setItem(BOOKINGS_OBJECT_DETAIL_KEY, JSON.stringify({ type: "object", id: booking.propertyId }));
  location.assign("./objects-partners.html");
}

function writeGuest(id) {
  const booking = bookingsState.data.bookings.find((item) => item.id === id);
  if (!booking) return;
  bookingsState.menuId = "";
  if (bookingsState.panelMode === "actions") bookingsState.panelMode = "edit";
  syncBookingsQuery();
  renderBookingsPage();
  const text = window.prompt("Сообщение гостю");
  if (!text) return;
  if (booking.directChatId) {
    window.ANIMA_DB.addMessage({
      chatId: booking.directChatId,
      bookingId: booking.id,
      partnerId: booking.raw.partner_id,
      senderId: currentBookingsSession()?.username || "admin",
      senderRole: "admin",
      text,
    }, bookingsSeedData);
  }
  window.ANIMA_DB.addAdminNote({
    authorId: currentBookingsSession()?.username || "admin",
    partnerId: booking.raw.partner_id,
    bookingId: booking.id,
    text: `Гостю отправлено сообщение: ${text}`,
  }, bookingsSeedData);
  showBookingsToast(`Сообщение отправлено гостю ${booking.guestName}.`);
  reloadBookings(id);
}

function sendBookingConfirmation(id) {
  const booking = bookingsState.data.bookings.find((item) => item.id === id);
  if (!booking || !booking.clientId) return;
  bookingsState.menuId = "";
  if (bookingsState.panelMode === "actions") bookingsState.panelMode = "edit";
  syncBookingsQuery();
  renderBookingsPage();
  const title = `Подтверждение бронирования ${booking.displayId}`;
  const text = `${booking.propertyTitle}, ${formatDate(booking.startDate)} - ${formatDate(booking.endDate)}. Сумма: ${booking.primaryAmount}.`;
  window.ANIMA_DB.sendAdminMessage({
    actorUserId: currentBookingsSession()?.username || "admin",
    target: "client",
    userId: booking.clientId,
    title,
    text,
    type: "booking-confirmation-email",
  }, bookingsSeedData);
  window.ANIMA_DB.addAdminNote({
    authorId: currentBookingsSession()?.username || "admin",
    partnerId: booking.raw.partner_id,
    bookingId: booking.id,
    text: "Гостю отправлено подтверждение по email и в системе.",
  }, bookingsSeedData);
  showBookingsToast(`Подтверждение по ${booking.displayId} отправлено.`);
  reloadBookings(id);
}

function openPaymentPanel(id) {
  bookingsState.detailId = id;
  bookingsState.panelMode = "payment";
  bookingsState.menuId = "";
  syncBookingsQuery();
  renderBookingsPage();
}

function createManualPayment(id) {
  const booking = bookingsState.data.bookings.find((item) => item.id === id);
  if (!booking) return;
  const amount = booking.raw.pay_now_amount || booking.raw.total_amount || booking.totalAmount || 0;
  window.ANIMA_DB.recordPayment(id, {
    actorUserId: currentBookingsSession()?.username || "admin",
    status: "paid",
    method: "manual",
    amount,
  }, bookingsSeedData);
  showBookingsToast(`Платёж по ${booking.displayId} создан.`);
  reloadBookings(id);
}

function toggleVip(id) {
  const booking = bookingsState.data.bookings.find((item) => item.id === id);
  if (!booking) return;
  const next = !booking.vip;
  if (booking.clientId) {
    window.ANIMA_DB.updateUser(booking.clientId, { vip: next }, bookingsSeedData);
  } else {
    window.ANIMA_DB.updateBookingAdmin(id, { actorUserId: currentBookingsSession()?.username || "admin", vip_flag: next }, bookingsSeedData);
  }
  showBookingsToast(next ? "Клиент отмечен как VIP." : "VIP-метка снята.");
  reloadBookings(id);
}

function togglePinned(id) {
  const booking = bookingsState.data.bookings.find((item) => item.id === id);
  if (!booking) return;
  window.ANIMA_DB.updateBookingAdmin(id, {
    actorUserId: currentBookingsSession()?.username || "admin",
    is_pinned: !booking.pinned,
  }, bookingsSeedData);
  showBookingsToast(booking.pinned ? "Бронь откреплена." : "Бронь закреплена.");
  reloadBookings(id);
}

function deleteBooking(id) {
  const booking = bookingsState.data.bookings.find((item) => item.id === id);
  if (!booking) return;
  window.ANIMA_DB.updateBookingAdmin(id, {
    actorUserId: currentBookingsSession()?.username || "admin",
    deleted_at: new Date().toISOString(),
    admin_comment: "Удалено из раздела бронирований",
  }, bookingsSeedData);
  showBookingsToast(`Бронь ${booking.displayId} удалена.`);
  closeBookingDetail();
  loadBookingsPage();
}

function setPanelMode(mode) {
  bookingsState.panelMode = mode;
  bookingsState.menuId = mode === "actions" ? bookingsState.detailId : "";
  syncBookingsQuery();
  renderBookingsPage();
}

function downloadBookingVoucher(id) {
  const booking = bookingsState.data.bookings.find((item) => item.id === id);
  if (!booking) return;
  bookingsState.menuId = "";
  if (bookingsState.panelMode === "actions") bookingsState.panelMode = "edit";
  const lines = [
    "ANIMA BOOKING VOUCHER",
    `Booking: ${booking.displayId}`,
    `Property: ${booking.propertyTitle}`,
    `Room: ${booking.unitName}`,
    `Guest: ${booking.guestName}`,
    `Dates: ${booking.startDate} - ${booking.endDate}`,
    `Guests: ${booking.guestsCount}`,
    `Amount: ${booking.primaryAmount}`,
    `Email: ${booking.guestEmail || "-"}`,
    `Phone: ${booking.guestPhone || "-"}`,
  ];
  const blob = buildVoucherPdf(lines);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${booking.displayId.replace(/#/g, "")}-voucher.pdf`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  syncBookingsQuery();
  renderBookingsPage();
  showBookingsToast(`PDF ваучер ${booking.displayId} подготовлен.`);
}

function reloadBookings(detailId = bookingsState.detailId) {
  bookingsState.menuId = "";
  if (bookingsState.panelMode === "actions") bookingsState.panelMode = "edit";
  bookingsState.data = normalizeBookingsData();
  bookingsState.detailId = detailId;
  const booking = bookingsState.data.bookings.find((item) => item.id === detailId);
  bookingsState.editDraft = booking ? buildEditDraft(booking) : null;
  syncBookingsQuery();
  renderBookingsPage();
}

function resetBookingsFilters() {
  bookingsState.filters.search = "";
  bookingsState.filters.status = "all";
  bookingsState.filters.property = "all";
  bookingsState.filters.channel = "all";
  applyBookingsDefaultRange();
  bookingsState.tab = "all";
  bookingsState.page = 1;
}

function syncSearchInputs(value) {
  const global = document.querySelector("[data-global-search]");
  const local = document.querySelector("[data-bookings-filter-search]");
  if (global && global.value !== value) global.value = value;
  if (local && local.value !== value) local.value = value;
}

function renderSidebarRequestsCount() {
  const count = bookingsState.data?.requestCount || 0;
  return count ? `<span class="sidebar-link-badge request-main-badge">${count}</span>` : "";
}

function bookingStatusFilterOptions() {
  return [
    { value: "all", label: "Все статусы" },
    { value: "active", label: "Активные" },
    { value: "waiting_payment", label: "Ожидают оплаты" },
    { value: "completed", label: "Завершённые" },
    { value: "cancelled", label: "Отменённые" },
    { value: "no_show", label: "Не заехали" },
  ];
}

function bookingTabs() {
  return [
    { id: "all", label: "Все", icon: "grid" },
    { id: "active", label: "Активные", icon: "calendar-check" },
    { id: "confirmed", label: "Подтверждённые", icon: "badge-check" },
    { id: "waiting_payment", label: "Ожидают оплаты", icon: "clock-3" },
    { id: "completed", label: "Завершённые", icon: "check-circle" },
    { id: "cancelled", label: "Отменённые", icon: "x-circle" },
    { id: "no_show", label: "Не заехали", icon: "alert" },
  ];
}

function editableStatuses() {
  return [
    ["waiting_payment", "Ожидает оплаты"],
    ["commission_paid", "Ожидает подтверждения"],
    ["confirmed", "Подтверждено"],
    ["active", "Активное"],
    ["completed", "Завершено"],
    ["cancelled", "Отменено"],
    ["no_show", "Не заехал"],
  ].map(([value, label]) => ({ value, label }));
}

function unitsForProperty(propertyId) {
  return (bookingsState.data?.units || []).filter((item) => item.property_id === propertyId);
}

function bookingStatusPresentation(status = "", paymentStatus = "") {
  if (["completed", "closed", "payout_sent", "funds_available"].includes(status)) return { key: "completed", label: "Завершено", tone: "completed" };
  if (["cancelled", "cancelled_by_client", "cancelled_by_anima", "rejected"].includes(status)) return { key: "cancelled", label: "Отменено", tone: "cancelled" };
  if (["no_show", "problem", "dispute"].includes(status)) return { key: "no_show", label: "Не заехал", tone: "no-show" };
  if (["waiting_payment"].includes(status) || paymentStatus === "waiting_payment") return { key: "waiting_payment", label: "Ожидает оплаты", tone: "waiting" };
  if (["confirmed", "commission_paid", "pending_partner_confirmation"].includes(status)) return { key: "confirmed", label: "Подтверждено", tone: "confirmed" };
  return { key: "active", label: "Активное", tone: "confirmed" };
}

function bookingChannelLabel(booking, order) {
  const source = String(booking.channel || order.channel || order.source || "").toLowerCase();
  if (source.includes("booking")) return "Booking.com";
  if (source.includes("airbnb")) return "Airbnb";
  if (source.includes("agoda")) return "Agoda";
  if (source.includes("expedia")) return "Expedia";
  return "Прямое бронирование";
}

function bookingChannelTone(channel = "") {
  if (channel.includes("Booking")) return "blue";
  if (channel.includes("Airbnb")) return "red";
  if (channel.includes("Agoda")) return "violet";
  if (channel.includes("Expedia")) return "yellow";
  return "light";
}

function bookingsChannelMark(channel = "") {
  if (channel.includes("Booking")) return "B.";
  if (channel.includes("Airbnb")) return "A";
  if (channel.includes("Agoda")) return "a";
  if (channel.includes("Expedia")) return "↗";
  return bookingsIcon("calendar");
}

function buildBookingHistory(historyRows, noteRows, paymentRows) {
  const items = [
    ...historyRows.map((item) => ({
      createdAt: item.createdAt || item.created_at,
      title: `${statusHistoryLabel(item.old_status)} → ${statusHistoryLabel(item.new_status)}`,
      by: item.changed_by || "system",
    })),
    ...noteRows.map((item) => ({
      createdAt: item.createdAt,
      title: item.text,
      by: item.author_id || item.authorId || "admin",
    })),
    ...paymentRows.map((item) => ({
      createdAt: item.createdAt,
      title: `Платёж ${paymentStatusLabel(item.status)} на ${Math.round(Number(item.amount || 0)).toLocaleString("ru-RU")} ${bookingsState.currency}`,
      by: item.method || "manual",
    })),
  ];
  return items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

function buildVoucherPdf(lines) {
  const content = lines
    .map((line, index) => `BT /F1 12 Tf 50 ${780 - (index * 20)} Td (${escapePdf(line)}) Tj ET`)
    .join("\n");
  const objects = [];
  const addObject = (body) => {
    objects.push(body);
    return objects.length;
  };
  const catalogId = addObject("<< /Type /Catalog /Pages 2 0 R >>");
  const pagesId = addObject("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  const pageId = addObject("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>");
  const stream = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`;
  const contentId = addObject(stream);
  const fontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((body, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer << /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}

function escapePdf(value = "") {
  return String(value).replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}

function renderBookingStatusBadge(booking) {
  return `<span class="booking-status-badge ${booking.statusTone}">${bookingsInlineIcon(statusToneIcon(booking.statusTone), "status")}${escapeHtml(booking.statusLabel)}</span>`;
}

function statusToneIcon(tone = "") {
  return {
    confirmed: "check",
    waiting: "clock-3",
    completed: "badge-check",
    cancelled: "x",
    "no-show": "alert",
  }[tone] || "circle";
}

function renderBookingsPagination(page, pages) {
  if (pages <= 1) return "";
  return Array.from({ length: pages }, (_, index) => index + 1)
    .map((item) => `<button type="button" class="requests-page-button ${item === page ? "active" : ""}" data-bookings-page="${item}">${item}</button>`)
    .join("");
}

function hydrateBookingRange() {
  try {
    const saved = JSON.parse(localStorage.getItem(BOOKINGS_RANGE_KEY) || "null");
    if (!saved) return;
    bookingsState.filters.checkin = saved.checkin || "";
    bookingsState.filters.checkout = saved.checkout || "";
  } catch {}
}

function persistBookingRange() {
  localStorage.setItem(BOOKINGS_RANGE_KEY, JSON.stringify({
    checkin: bookingsState.filters.checkin,
    checkout: bookingsState.filters.checkout,
  }));
}

function applyBookingsDefaultRange() {
  const dates = bookingsState.data.bookings.map((item) => item.startDate).filter(Boolean).sort();
  bookingsState.filters.checkin = dates[0] || "";
  bookingsState.filters.checkout = dates[dates.length - 1] || "";
  persistBookingRange();
}

function applyBookingsMonthRange() {
  const today = new Date();
  bookingsState.filters.checkin = inputDate(new Date(today.getFullYear(), today.getMonth(), 1));
  bookingsState.filters.checkout = inputDate(new Date(today.getFullYear(), today.getMonth() + 1, 0));
  persistBookingRange();
}

function bookingsRangeLabel() {
  if (!bookingsState.filters.checkin || !bookingsState.filters.checkout) return "Выберите даты";
  return `${formatDate(bookingsState.filters.checkin, false)} - ${formatDate(bookingsState.filters.checkout, false)}`;
}

function hydrateBookingQuery() {
  const params = new URLSearchParams(location.search);
  bookingsState.detailId = params.get("booking") || "";
  bookingsState.panelMode = params.get("panel") || "edit";
}

function syncBookingsQuery() {
  const url = new URL(location.href);
  if (bookingsState.detailId) url.searchParams.set("booking", bookingsState.detailId);
  else url.searchParams.delete("booking");
  if (bookingsState.panelMode && bookingsState.detailId) url.searchParams.set("panel", bookingsState.panelMode);
  else url.searchParams.delete("panel");
  history.replaceState({}, "", url);
}

function previousPeriodRows(bookings) {
  const dates = bookings.map((item) => new Date(item.createdAt || 0)).filter((item) => !Number.isNaN(item.getTime())).sort((a, b) => a - b);
  const days = Math.max(1, Math.min(30, dates.length || 7));
  const end = new Date();
  const start = addDays(end, -(days - 1));
  const previousEnd = addDays(start, -1);
  const previousStart = addDays(previousEnd, -(days - 1));
  return bookings.filter((item) => {
    const stamp = new Date(item.createdAt || 0);
    return stamp >= previousStart && stamp <= previousEnd;
  });
}

function countTrendLabel(current, previous) {
  const delta = current - previous;
  if (!previous && current) return `+${current} за период`;
  if (!delta) return "без изменений";
  return `${delta > 0 ? "+" : ""}${delta} за период`;
}

function moneyTrendLabel(current, previous, currency, state) {
  if (!previous && current) return `+${formatMoneyValue(current, currency, state)} за период`;
  const delta = current - previous;
  if (!delta) return "без изменений";
  return `${delta > 0 ? "+" : "-"}${formatMoneyValue(Math.abs(delta), currency, state)} за период`;
}

function sparkSeries(values) {
  return values.length ? values : [0, 0, 0, 0];
}

function formatMoneyValue(value, currencyCode, state) {
  const rates = state?.settings?.currencyRates || bookingsSeedData.user?.currencyRates || { VND: 1 };
  const amount = currencyCode === "VND" ? Number(value || 0) : Number(value || 0) / Number(rates[currencyCode] || 1);
  if (currencyCode === "USD") return `$${Math.round(amount).toLocaleString("en-US")}`;
  if (currencyCode === "EUR") return `€${Math.round(amount).toLocaleString("de-DE")}`;
  if (currencyCode === "RUB") return `${Math.round(amount).toLocaleString("ru-RU")} RUB`;
  if (currencyCode === "UAH") return `${Math.round(amount).toLocaleString("uk-UA")} UAH`;
  return `≈ ${Math.round(amount).toLocaleString("ru-RU")} VND`;
}

function paymentMethodLabel(value = "") {
  return {
    cash_at_hotel: "Прямое бронирование",
    anima_online: "Оплата через ANIMA",
  }[value] || "Прямое бронирование";
}

function paymentStatusLabel(value = "") {
  return {
    paid: "Оплачено",
    waiting_payment: "Ожидает оплаты",
    unpaid: "Не оплачено",
    pending: "Ожидает оплаты",
  }[value] || "Не оплачено";
}

function statusHistoryLabel(value = "") {
  return bookingStatusPresentation(value).label;
}

function displayBookingCode(id = "") {
  const suffix = String(id).split("_").pop() || id;
  return `#BK-${suffix.slice(-8).toUpperCase()}`;
}

function photoStyle(property = {}) {
  const photo = property.photos?.[0] || property.property_photos?.[0] || "";
  return photo ? `background-image:url('${photo}')` : "background:linear-gradient(135deg, rgba(191,151,109,.92), rgba(77,57,39,.92))";
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

function bookingsHeadLabel(icon, label) {
  return `<span class="requests-head-label">${bookingsInlineIcon(icon)}<span>${label}</span></span>`;
}

function bookingsInlineIcon(name, extraClass = "") {
  return `<span class="requests-inline-icon ${extraClass}">${bookingsIcon(name)}</span>`;
}

function bookingsIcon(name) {
  const shared = {
    house: `<svg viewBox="0 0 24 24"><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.8V21h14V9.8" /><path d="M9 21v-6h6v6" /></svg>`,
    buildings: `<svg viewBox="0 0 24 24"><path d="M3 21V8l6-3v16" /><path d="M9 21V4l6 2v15" /><path d="M15 21v-9l6-2v11" /><path d="M6 10h.01M6 13h.01M12 9h.01M12 12h.01M18 13h.01M18 16h.01" /></svg>`,
    "building-2": `<svg viewBox="0 0 24 24"><path d="M6 22V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" /><path d="M4 22h16" /><path d="M10 8h4M10 12h4M10 16h4" /></svg>`,
    "calendar-check": `<svg viewBox="0 0 24 24"><path d="M8 2v4M16 2v4" /><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M3 10h18" /><path d="m9.5 16 2 2 4-4" /></svg>`,
    "book-open": `<svg viewBox="0 0 24 24"><path d="M12 7c-1.8-1.3-4-2-6.5-2A2.5 2.5 0 0 0 3 7.5V19a2 2 0 0 1 2-2c2.5 0 4.7.7 7 2" /><path d="M12 7c1.8-1.3 4-2 6.5-2A2.5 2.5 0 0 1 21 7.5V19a2 2 0 0 0-2-2c-2.5 0-4.7.7-7 2" /></svg>`,
    users: `<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M4 19a5 5 0 0110 0M14 19a4 4 0 018 0" /></svg>`,
    star: `<svg viewBox="0 0 24 24"><path d="M12 3l2.7 5.5 6 .9-4.3 4.2 1 5.9L12 16.7 6.6 19.5l1-5.9L3.3 9.4l6-.9z" /></svg>`,
    wallet: `<svg viewBox="0 0 24 24"><path d="M4 7.5h14a2 2 0 012 2V18a2 2 0 01-2 2H6a2 2 0 01-2-2z" /><path d="M4 8V6a2 2 0 012-2h11" /><circle cx="16" cy="13" r="1" /></svg>`,
    banknote: `<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /><path d="M7 9h.01M17 15h.01" /></svg>`,
    percent: `<svg viewBox="0 0 24 24"><path d="M18 6L6 18" /><circle cx="7.5" cy="7.5" r="2.5" /><circle cx="16.5" cy="16.5" r="2.5" /></svg>`,
    "messages-square": `<svg viewBox="0 0 24 24"><path d="M16 4h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-4l-4 4v-4H7a2 2 0 0 1-2-2v-1" /><path d="M5 14H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H8l-3 3z" /></svg>`,
    send: `<svg viewBox="0 0 24 24"><path d="M22 2 11 13" /><path d="m22 2-7 20-4-9-9-4Z" /></svg>`,
    lifebuoy: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="M18.4 5.6 14 10M9.9 14.1l-4.3 4.3M18.4 18.4 14 14M10 10 5.6 5.6" /></svg>`,
    "file-text": `<svg viewBox="0 0 24 24"><path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z" /><path d="M14 2v5h5" /><path d="M9 13h6M9 17h6M9 9h2" /></svg>`,
    "pen-square": `<svg viewBox="0 0 24 24"><path d="M11 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-6" /><path d="m18.5 2.5 3 3L12 15l-4 1 1-4Z" /></svg>`,
    settings: `<svg viewBox="0 0 24 24"><path d="M12 3l1.5 2.7 3 .7-.7 3 2.2 2.1-2.2 2.1.7 3-3 .7L12 21l-1.5-2.7-3-.7.7-3L6 12.5l2.2-2.1-.7-3 3-.7z" /><circle cx="12" cy="12" r="3" /></svg>`,
    history: `<svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 108-8" /><path d="M4 4v5h5" /><path d="M12 8v5l3 2" /></svg>`,
    bell: `<svg viewBox="0 0 24 24"><path d="M6 9a6 6 0 1112 0v4.2l1.5 2.8H4.5L6 13.2V9z" /><path d="M10 19a2 2 0 004 0" /></svg>`,
    "user-fill": `<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M5 20a7 7 0 0114 0" /></svg>`,
    chevron: `<svg viewBox="0 0 24 24"><path d="M7 10l5 5 5-5" /></svg>`,
    "chevron-left": `<svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6" /></svg>`,
    search: `<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5" /><path d="M16 16l5 5" /></svg>`,
    filter: `<svg viewBox="0 0 24 24"><path d="M4 7h16M7 12h10M10 17h4" /></svg>`,
    reset: `<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 10-2.3 5.7" /><path d="M20 5v7h-7" /></svg>`,
    list: `<svg viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="5" cy="6" r="1" /><circle cx="5" cy="12" r="1" /><circle cx="5" cy="18" r="1" /></svg>`,
    calendar: `<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></svg>`,
    "calendar-range": `<svg viewBox="0 0 24 24"><path d="M8 2v4M16 2v4" /><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M3 10h18" /><path d="M8 14h3M13 14h3M8 18h8" /></svg>`,
    "clock-3": `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" /><path d="M12 7v5l3 2" /></svg>`,
    check: `<svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>`,
    "check-circle": `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" /><path d="M8.5 12.5l2.5 2.5 4.5-5" /></svg>`,
    x: `<svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12" /></svg>`,
    "x-circle": `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" /><path d="M15 9 9 15M9 9l6 6" /></svg>`,
    eye: `<svg viewBox="0 0 24 24"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" /><circle cx="12" cy="12" r="3" /></svg>`,
    pencil: `<svg viewBox="0 0 24 24"><path d="M12 20h9" /><path d="m16.5 3.5 4 4L7 21l-4 1 1-4Z" /></svg>`,
    "message-square": `<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>`,
    "more-vertical": `<svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg>`,
    "user-round": `<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 20a8 8 0 0 1 16 0" /></svg>`,
    mail: `<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M4 8l8 6 8-6" /></svg>`,
    phone: `<svg viewBox="0 0 24 24"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.4 2.9a2 2 0 0 1-.6 1.7l-1.3 1.3a16 16 0 0 0 6.4 6.4l1.3-1.3a2 2 0 0 1 1.7-.6l2.9.4A2 2 0 0 1 22 16.9Z" /></svg>`,
    hash: `<svg viewBox="0 0 24 24"><path d="M5 9h14M3 15h14M10 3 8 21M16 3l-2 18" /></svg>`,
    "badge-check": `<svg viewBox="0 0 24 24"><path d="m9 12 2 2 4-4" /><path d="M8.5 4.5 12 3l3.5 1.5 3 3L20 11l-1.5 3.5-3 3L12 19l-3.5-1.5-3-3L4 11l1.5-3.5z" /></svg>`,
    sparkles: `<svg viewBox="0 0 24 24"><path d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6Z" /><path d="M5 19l.7 1.8L7.5 21l-1.8.7L5 23l-.7-1.3L2.5 21l1.8-.2Z" /><path d="M19 15l.7 1.8 1.8.2-1.8.7L19 19l-.7-1.3-1.8-.7 1.8-.2Z" /></svg>`,
    grid: `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>`,
    globe: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15.3 15.3 0 0 1 4 9 15.3 15.3 0 0 1-4 9 15.3 15.3 0 0 1-4-9 15.3 15.3 0 0 1 4-9Z" /></svg>`,
    "chart-up": `<svg viewBox="0 0 24 24"><path d="M3 17l6-6 4 4 7-8" /><path d="M14 7h6v6" /></svg>`,
    "wallet-card": `<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M15 10h6v4h-6a2 2 0 0 1 0-4Z" /><circle cx="16.8" cy="12" r=".8" /></svg>`,
    "arrow-right": `<svg viewBox="0 0 24 24"><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>`,
    copy: `<svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>`,
    pin: `<svg viewBox="0 0 24 24"><path d="m15 5 4 4-3 3 3 7-7-3-3 3-4-4 3-3-3-7 7 3z" /></svg>`,
    trash: `<svg viewBox="0 0 24 24"><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="m19 6-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></svg>`,
    alert: `<svg viewBox="0 0 24 24"><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.3 3.5 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.5a2 2 0 0 0-3.4 0Z" /></svg>`,
    circle: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7" /></svg>`,
  };
  return shared[name] || "";
}

function paginate(items, page = 1, perPage = 10) {
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const currentPage = Math.min(Math.max(1, page), pages);
  const start = (currentPage - 1) * perPage;
  const end = Math.min(total, start + perPage);
  return { page: currentPage, pages, total, start: total ? start + 1 : 0, end, items: items.slice(start, end) };
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

function dedupePrimitive(items) {
  return [...new Set(items.filter(Boolean))];
}

function initials(value = "") {
  return String(value).split(/\s+/).filter(Boolean).slice(0, 2).map((item) => item[0]?.toUpperCase() || "").join("");
}

function nightsBetween(start, end) {
  const left = new Date(`${start || ""}T00:00:00`);
  const right = new Date(`${end || ""}T00:00:00`);
  if (Number.isNaN(left.getTime()) || Number.isNaN(right.getTime())) return 0;
  return Math.max(1, Math.round((right - left) / 86400000));
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function inputDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
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

function escapeHtml(value = "") {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function escapeAttribute(value = "") {
  return escapeHtml(value);
}

function showBookingsToast(message) {
  const toast = document.querySelector("[data-dashboard-toast]");
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  toast.classList.add("is-visible");
  clearTimeout(showBookingsToast.timer);
  showBookingsToast.timer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
    window.setTimeout(() => { toast.hidden = true; }, 180);
  }, 2400);
}
