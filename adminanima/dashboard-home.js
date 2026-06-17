const DASHBOARD_SESSION_KEY = "anima.admin.session.v1";
const DASHBOARD_CURRENCY_KEY = "anima.admin.currency";
const DASHBOARD_RANGE_KEY = "anima.admin.dashboardRange.v1";
const DASHBOARD_CHART_GRANULARITY_KEY = "anima.admin.dashboardChartGranularity.v1";
const seedData = window.ANIMA_DATA || {};

const sidebarSections = [
  {
    title: "Управление",
    items: [
      { id: "home", label: "Главная", icon: "home", active: true },
      { id: "objects", label: "Объекты и партнёры", icon: "building" },
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

let dashboardState = null;
let currency = localStorage.getItem(DASHBOARD_CURRENCY_KEY) || "RUB";
let selectedPreset = "thisMonth";
let selectedRange = null;
let chartGranularity = localStorage.getItem(DASHBOARD_CHART_GRANULARITY_KEY) || "day";
let activePopover = null;

document.addEventListener("DOMContentLoaded", () => {
  if (!ensureSession()) return;
  window.ANIMA_DB?.ensure?.(seedData);
  renderSidebar();
  bindUi();
  initializeRange();
  refreshDashboard();
});

function ensureSession() {
  try {
    const session = JSON.parse(sessionStorage.getItem(DASHBOARD_SESSION_KEY) || "null");
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

function currentSession() {
  try {
    return JSON.parse(sessionStorage.getItem(DASHBOARD_SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

function initializeRange() {
  const allBookings = getAllBookings();
  const bookingDates = allBookings
    .map((booking) => booking.createdAtDate)
    .filter(Boolean)
    .sort((a, b) => a - b);
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const saved = readRangeState();
  const minDate = bookingDates[0] || monthStart;
  const maxDate = bookingDates[bookingDates.length - 1] || today;

  if (saved?.from && saved?.to) {
    selectedRange = {
      from: parseDate(saved.from) || monthStart,
      to: parseDate(saved.to) || monthEnd,
    };
    selectedPreset = saved.preset || "custom";
  } else if (sameMonth(minDate, maxDate)) {
    selectedRange = { from: new Date(minDate), to: new Date(maxDate) };
    selectedPreset = "dataRange";
  } else {
    selectedRange = { from: monthStart, to: monthEnd };
    selectedPreset = "thisMonth";
  }
  persistRangeState();
}

function refreshDashboard() {
  const state = window.ANIMA_DB?.getState?.(seedData);
  if (!state) return;
  const allBookings = getAllBookings(state);
  const allPayments = [...(state.tables.payments || [])];
  const partners = window.ANIMA_DB?.listPartners?.(seedData) || [];
  const properties = [...(state.tables.partnerProperties || [])];
  const users = [...(state.tables.users || [])];
  const reviews = [...(state.tables.reviews || [])];
  const partnerMessages = [...(state.tables.messages || [])].filter((item) => item.sender_role === "partner");
  const applications = [...(state.tables.partnerApplications || [])];
  const notifications = buildNotifications({ applications, partnerMessages, properties, partners });
  const filtered = filterDashboardData({
    bookings: allBookings,
    payments: allPayments,
    partnerMessages,
    applications,
    reviews,
  });

  dashboardState = {
    state,
    allBookings,
    partners,
    properties,
    users,
    reviews,
    notifications,
    filtered,
    profile: buildProfile(partners, properties, allBookings),
  };

  renderHero();
  renderTopbar();
  renderKpis();
  renderLineChart();
  renderRecentApplications();
  renderStatusDonut();
  renderPendingPayouts();
  renderSystemActivity();
  renderBookingsTable();
}

function bindUi() {
  const sidebar = document.querySelector("[data-sidebar]");
  const shell = document.querySelector(".dashboard-home-shell");
  document.querySelectorAll("[data-sidebar-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      sidebar?.classList.toggle("is-collapsed");
      shell?.classList.toggle("sidebar-collapsed");
    });
  });

  document.querySelector("[data-sidebar-nav]")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-nav-item]");
    if (!button || button.dataset.navItem === "home") return;
    if (button.dataset.navItem === "objects") {
      location.assign("./objects-partners.html");
      return;
    }
    if (button.dataset.navItem === "requests") {
      location.assign("./requests.html");
      return;
    }
    if (button.dataset.navItem === "bookings") {
      location.assign("./bookings.html");
      return;
    }
    showToast(`Раздел «${button.dataset.navLabel}» подготовим следующим экраном.`);
  });

  document.querySelector("[data-range-apply]")?.addEventListener("click", applyRangeFromUi);
  document.querySelector("[data-range-preset]")?.addEventListener("change", (event) => {
    selectedPreset = event.target.value;
    applyPreset(selectedPreset);
    updateRangeUi();
  });
  document.querySelectorAll('[data-popover-trigger="range"]').forEach((button) => {
    button.addEventListener("click", () => togglePopover("range"));
  });
  document.querySelector("[data-chart-granularity]")?.addEventListener("change", (event) => {
    chartGranularity = event.target.value;
    localStorage.setItem(DASHBOARD_CHART_GRANULARITY_KEY, chartGranularity);
    refreshDashboard();
  });

  const searchInput = document.querySelector(".dashboard-search input");
  searchInput?.addEventListener("input", () => renderDashboardSearch(searchInput.value));
  searchInput?.addEventListener("focus", () => renderDashboardSearch(searchInput.value));

  document.querySelectorAll(".card-link-button").forEach((button) => {
    button.addEventListener("click", () => handleViewAll(button.closest(".dashboard-card")?.querySelector("h2")?.textContent || ""));
  });

  document.addEventListener("click", (event) => {
    const result = event.target.closest("[data-search-entity]");
    if (result) {
      openSearchEntity(result.dataset.searchEntity, result.dataset.searchId);
      return;
    }
    if (!event.target.closest(".dashboard-search")) {
      document.querySelector("[data-dashboard-search-results]")?.remove();
    }
  });

  document.addEventListener("click", (event) => {
    if (!activePopover) return;
    const inside = event.target.closest(`[data-popover="${activePopover}"]`) || event.target.closest(`[data-popover-trigger="${activePopover}"]`);
    if (!inside) closePopovers();
  });
}

function handleViewAll(title) {
  if (/заяв/i.test(title) || /бронир/i.test(title) || /выплат/i.test(title) || /систем/i.test(title)) {
    location.assign("./objects-partners.html");
    return;
  }
  showToast(`Открываю полный раздел для блока «${title}».`);
  location.assign("./objects-partners.html");
}

function renderDashboardSearch(query = "") {
  const root = document.querySelector(".dashboard-search");
  if (!root || !dashboardState) return;
  root.querySelector("[data-dashboard-search-results]")?.remove();
  const needle = String(query || "").trim();
  if (!needle) return;
  const results = window.ANIMA_DB?.searchEntities?.(needle, seedData) || [];
  const panel = document.createElement("div");
  panel.className = "dashboard-search-results";
  panel.dataset.dashboardSearchResults = "true";
  panel.innerHTML = results.length ? results.slice(0, 8).map((item) => `
    <button type="button" class="dashboard-search-result" data-search-entity="${escapeHtml(item.entity)}" data-search-id="${escapeHtml(item.id)}">
      <strong>${escapeHtml(item.title || item.name || item.id)}</strong>
      <span>${escapeHtml(item.entity)} · ${escapeHtml(item.subtitle || item.status || "")}</span>
    </button>
  `).join("") : `<div class="notification-empty">Ничего не найдено.</div>`;
  root.appendChild(panel);
}

function openSearchEntity(entity, id) {
  sessionStorage.setItem("anima.admin.objects.detail.v1", JSON.stringify({
    type: entity === "partner" ? "partner" : entity === "application" ? "request" : "object",
    id,
  }));
  location.assign("./objects-partners.html");
}

function applyRangeFromUi() {
  const fromInput = document.querySelector("[data-range-from]");
  const toInput = document.querySelector("[data-range-to]");
  const nextFrom = parseDate(fromInput?.value);
  const nextTo = parseDate(toInput?.value);
  if (!nextFrom || !nextTo) {
    showToast("Выберите обе даты периода.");
    return;
  }
  if (nextFrom > nextTo) {
    showToast("Дата начала не может быть позже даты окончания.");
    return;
  }
  selectedRange = { from: nextFrom, to: nextTo };
  if (selectedPreset !== "all" && selectedPreset !== "thisMonth" && selectedPreset !== "thisWeek" && selectedPreset !== "last30" && selectedPreset !== "dataRange") {
    selectedPreset = "custom";
  }
  persistRangeState();
  closePopovers();
  refreshDashboard();
}

function applyPreset(preset) {
  const allBookings = getAllBookings();
  const bookingDates = allBookings.map((item) => item.createdAtDate).filter(Boolean).sort((a, b) => a - b);
  const today = new Date();
  switch (preset) {
    case "thisWeek": {
      const day = today.getDay() || 7;
      const monday = addDays(today, 1 - day);
      selectedRange = { from: startOfDay(monday), to: endOfDay(today) };
      break;
    }
    case "last30":
      selectedRange = { from: startOfDay(addDays(today, -29)), to: endOfDay(today) };
      break;
    case "all":
    case "dataRange": {
      const minDate = bookingDates[0] || startOfDay(today);
      const maxDate = bookingDates[bookingDates.length - 1] || endOfDay(today);
      selectedRange = { from: startOfDay(minDate), to: endOfDay(maxDate) };
      break;
    }
    case "custom":
      break;
    case "thisMonth":
    default:
      selectedRange = {
        from: new Date(today.getFullYear(), today.getMonth(), 1),
        to: new Date(today.getFullYear(), today.getMonth() + 1, 0),
      };
      break;
  }
  persistRangeState();
}

function renderSidebar() {
  const nav = document.querySelector("[data-sidebar-nav]");
  if (!nav) return;
  nav.innerHTML = sidebarSections.map((section) => `
    <section class="sidebar-group">
      <h3>${section.title}</h3>
      <div class="sidebar-links">
        ${section.items.map((item) => `
          <button type="button" class="sidebar-link ${item.active ? "is-active" : ""}" data-nav-item="${item.id}" data-nav-label="${item.label}">
            <span class="sidebar-link-icon">${icon(item.icon)}</span>
            <span class="sidebar-link-label">${item.label}</span>
            ${item.id === "requests" ? `<span class="sidebar-link-badge" data-booking-request-badge></span>` : ""}
          </button>
        `).join("")}
      </div>
    </section>
  `).join("");
}

function renderHero() {
  const session = currentSession();
  const title = document.querySelector(".dashboard-hero h1");
  const subtitle = document.querySelector(".dashboard-hero p");
  if (title) title.textContent = `Добро пожаловать, ${session?.username || "ADMIN_ANIMA1"}! 👋`;
  if (subtitle) subtitle.textContent = "Супер админ панель управления ANIMA";
  updateRangeUi();
}

function renderTopbar() {
  const topbarRight = document.querySelector(".topbar-right");
  const requestBadge = document.querySelector("[data-booking-request-badge]");
  if (requestBadge) requestBadge.textContent = String(dashboardState.filtered.newRequests.length);
  if (!topbarRight) return;
  topbarRight.innerHTML = `
    <div class="topbar-currency-wrap">
      <label class="currency-switch" data-popover-trigger="currency">
        <span class="currency-switch-label">Валюта</span>
        <select data-currency-select>
          ${supportedCurrencies().map((code) => `<option value="${code}" ${code === currency ? "selected" : ""}>${code}</option>`).join("")}
        </select>
      </label>
    </div>
    <div class="topbar-popover-wrap">
      <button type="button" class="topbar-icon-button notification-button" data-popover-trigger="notifications" aria-label="Уведомления">
        ${icon("bell")}
        <span class="notification-badge">${dashboardState.notifications.length}</span>
      </button>
      <div class="topbar-popover notifications-popover" data-popover="notifications" hidden>
        <div class="popover-header">
          <strong>Важные уведомления</strong>
          <small>${dashboardState.notifications.length} шт.</small>
        </div>
        <div class="notifications-list">
          ${dashboardState.notifications.length ? dashboardState.notifications.map((item) => `
            <article class="notification-row">
              <div class="notification-row-icon tone-${item.tone}">${icon(item.icon)}</div>
              <div class="notification-row-copy">
                <strong>${escapeHtml(item.title)}</strong>
                <small>${escapeHtml(item.description)}</small>
              </div>
              <span>${item.timeLabel}</span>
            </article>
          `).join("") : `<div class="notification-empty">Новых важных уведомлений пока нет.</div>`}
        </div>
      </div>
    </div>
    <div class="topbar-popover-wrap">
      <button type="button" class="profile-button" data-popover-trigger="profile">
        <span class="profile-avatar">${icon("user-fill")}</span>
        <span class="profile-copy">
          <strong>${escapeHtml(dashboardState.profile.username)}</strong>
          <small>${escapeHtml(dashboardState.profile.role)}</small>
        </span>
        <span class="profile-chevron" aria-hidden="true">${icon("chevron")}</span>
      </button>
      <div class="topbar-popover profile-popover" data-popover="profile" hidden>
        <div class="profile-popover-head">
          <strong>${escapeHtml(dashboardState.profile.username)}</strong>
          <small>${escapeHtml(dashboardState.profile.role)}</small>
        </div>
        <div class="profile-popover-stats">
          <span>Партнёров: ${dashboardState.profile.partnerCount}</span>
          <span>Объектов: ${dashboardState.profile.propertyCount}</span>
          <span>Бронирований: ${dashboardState.profile.bookingCount}</span>
        </div>
        <div class="profile-popover-actions">
          <button type="button" data-profile-refresh>Обновить данные</button>
          <button type="button" data-profile-logout>Выйти</button>
        </div>
      </div>
    </div>
  `;

  topbarRight.querySelector("[data-currency-select]")?.addEventListener("change", (event) => {
    currency = event.target.value;
    localStorage.setItem(DASHBOARD_CURRENCY_KEY, currency);
    refreshDashboard();
  });

  topbarRight.querySelector("[data-profile-refresh]")?.addEventListener("click", () => {
    refreshDashboard();
    showToast("Статистика обновлена из текущей базы.");
  });

  topbarRight.querySelector("[data-profile-logout]")?.addEventListener("click", () => {
    sessionStorage.removeItem(DASHBOARD_SESSION_KEY);
    location.replace("./");
  });

  topbarRight.querySelectorAll("[data-popover-trigger]").forEach((button) => {
    button.addEventListener("click", () => togglePopover(button.dataset.popoverTrigger));
  });

  updateRangeUi();
}

function renderKpis() {
  const node = document.querySelector("[data-kpi-grid]");
  if (!node) return;
  const { filtered } = dashboardState;
  const previous = filtered.previous;
  const currentStats = computeStats(filtered.bookings, filtered.payments);
  const previousStats = computeStats(previous.bookings, previous.payments);
  const cards = [
    {
      title: "Общий оборот",
      value: formatMoney(currentStats.turnover),
      meta: compareLabel(currentStats.turnover, previousStats.turnover, true),
      hint: previousLabel(filtered.previousLabel),
      icon: "ruble",
      tone: "green",
      sparkline: buildSparkline(filtered.chartSeries, "turnover"),
    },
    {
      title: "Комиссия ANIMA",
      value: formatMoney(currentStats.commission),
      meta: compareLabel(currentStats.commission, previousStats.commission, true),
      hint: previousLabel(filtered.previousLabel),
      icon: "pie",
      tone: "gold",
      sparkline: buildSparkline(filtered.chartSeries, "commission"),
    },
    {
      title: "Ожидают выплат",
      value: formatMoney(currentStats.pendingPayout),
      meta: `${currentStats.pendingPayoutBookings} ${plural(currentStats.pendingPayoutBookings, ["заявка", "заявки", "заявок"])}`,
      hint: "по активным выплатам периода",
      icon: "clock-pie",
      tone: "violet",
    },
    {
      title: "Выплачено партнёрам",
      value: formatMoney(currentStats.paidToPartners),
      meta: compareLabel(currentStats.paidToPartners, previousStats.paidToPartners, true),
      hint: previousLabel(filtered.previousLabel),
      icon: "wallet-card",
      tone: "blue",
    },
    {
      title: "Активные объекты",
      value: String(currentStats.activeProperties),
      meta: propertyDeltaLabel(currentStats.activeProperties, previousStats.activeProperties),
      hint: "объекты со статусом active/approved",
      icon: "buildings",
      tone: "green",
    },
    {
      title: "Новые заявки",
      value: String(filtered.newRequests.length),
      meta: filtered.newRequests.length ? "Требуют внимания" : "Новых заявок нет",
      hint: "по статусам новых бронирований",
      icon: "clipboard-badge",
      tone: "red",
    },
  ];

  node.innerHTML = cards.map((item) => `
    <article class="kpi-card tone-${item.tone}">
      <div class="kpi-copy">
        <span class="kpi-title">${item.title}</span>
        <strong class="kpi-value">${item.value}</strong>
        <div class="kpi-meta-row">
          <span class="kpi-meta">${item.meta}</span>
          <small>${item.hint}</small>
        </div>
      </div>
      <div class="kpi-side">
        <span class="kpi-icon">${icon(item.icon)}</span>
        ${item.sparkline ? renderSparkline(item.sparkline, item.tone) : ""}
      </div>
    </article>
  `).join("");
}

function renderLineChart() {
  const legend = document.querySelector("[data-chart-legend]");
  const node = document.querySelector("[data-line-chart]");
  const granularitySelect = document.querySelector("[data-chart-granularity]");
  if (!legend || !node) return;
  if (granularitySelect) granularitySelect.value = chartGranularity;
  const points = dashboardState.filtered.chartSeries;
  legend.innerHTML = [
    { label: "Оборот", tone: "green" },
    { label: "Комиссия", tone: "gold" },
    { label: "Выплаты", tone: "blue" },
  ].map((item) => `<span><i class="legend-line ${item.tone}"></i>${item.label}</span>`).join("");

  const width = 820;
  const height = 292;
  const padding = { top: 12, right: 18, bottom: 34, left: 44 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const max = Math.max(1, ...points.flatMap((point) => [point.turnover, point.commission, point.payout]));
  const gridY = Array.from({ length: 6 }, (_, index) => (max / 5) * index);

  const x = (index) => padding.left + (points.length <= 1 ? 0 : (index / (points.length - 1)) * innerWidth);
  const y = (value) => padding.top + innerHeight - (value / max) * innerHeight;
  const pathFor = (key) => points.map((point, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(2)} ${y(point[key]).toFixed(2)}`).join(" ");

  node.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" class="turnover-chart" aria-label="Динамика оборота">
      ${gridY.map((value) => `
        <g>
          <line x1="${padding.left}" x2="${width - padding.right}" y1="${y(value)}" y2="${y(value)}" class="chart-grid-line" />
          <text x="${padding.left - 18}" y="${y(value) + 4}" class="chart-axis-label chart-axis-left">${formatAxisValue(value)}</text>
        </g>
      `).join("")}
      ${points.map((point, index) => `<text x="${x(index)}" y="${height - 10}" class="chart-axis-label">${point.label}</text>`).join("")}
      <path d="${pathFor("turnover")}" class="chart-path green" />
      <path d="${pathFor("commission")}" class="chart-path gold" />
      <path d="${pathFor("payout")}" class="chart-path blue" />
    </svg>
  `;
}

function renderRecentApplications() {
  const node = document.querySelector("[data-recent-applications]");
  if (!node) return;
  const items = dashboardState.filtered.recentBookings;
  node.innerHTML = items.length ? items.map((booking) => `
    <article class="application-row">
      <div class="application-main">
        <span class="application-thumb" style="${thumbStyle(booking.property)}">${thumbIcon()}</span>
        <div class="application-copy">
          <strong>${escapeHtml(booking.propertyTitle)}</strong>
          <small>${escapeHtml(booking.customer_name || "Клиент")}</small>
        </div>
      </div>
      <span class="application-dates">${formatStayRange(booking.start_date, booking.end_date)}</span>
      <strong class="application-amount">${formatMoney(booking.total_amount)}</strong>
      <span class="status-badge ${bookingStatusTone(booking.booking_status)}">${bookingStatusLabel(booking.booking_status)}</span>
      <span class="application-time">${relativeTime(booking.createdAt)}</span>
    </article>
  `).join("") : `<div class="notification-empty">В выбранном периоде нет бронирований.</div>`;
}

function renderStatusDonut() {
  const node = document.querySelector("[data-status-donut]");
  if (!node) return;
  const items = bookingStatusBreakdown(dashboardState.filtered.bookings);
  const total = Math.max(1, items.reduce((sum, item) => sum + item.value, 0));
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const segments = items.map((item) => {
    const length = (item.value / total) * circumference;
    const segment = `<circle cx="90" cy="90" r="${radius}" fill="none" stroke="${item.color}" stroke-width="26" stroke-dasharray="${length} ${circumference - length}" stroke-dashoffset="${-offset}" transform="rotate(-90 90 90)" />`;
    offset += length;
    return segment;
  }).join("");

  node.innerHTML = `
    <div class="donut-visual">
      <svg viewBox="0 0 180 180" class="status-donut-chart" aria-label="Статус заявок">
        <circle cx="90" cy="90" r="${radius}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="26" />
        ${segments}
        <circle cx="90" cy="90" r="36" fill="#122028" />
      </svg>
    </div>
    <div class="donut-legend">
      ${items.map((item) => `<div class="donut-legend-row"><span><i style="background:${item.color}"></i>${item.label}</span><strong>${item.value} (${Math.round((item.value / total) * 100)}%)</strong></div>`).join("")}
    </div>
  `;
}

function renderPendingPayouts() {
  const node = document.querySelector("[data-payouts-list]");
  if (!node) return;
  const rows = computePendingPayoutRows(dashboardState.filtered.bookings, dashboardState.properties);
  node.innerHTML = rows.length ? rows.map((item) => `
    <article class="payout-row">
      <div class="payout-main">
        <span class="mini-thumb">${escapeHtml(initials(item.title))}</span>
        <strong>${escapeHtml(item.title)}</strong>
      </div>
      <span class="payout-amount">${formatMoney(item.amount)}</span>
      <small>${item.count} ${plural(item.count, ["заявка", "заявки", "заявок"])}</small>
    </article>
  `).join("") : `<div class="notification-empty">Нет ожидающих выплат в выбранном периоде.</div>`;
}

function renderSystemActivity() {
  const node = document.querySelector("[data-system-activity]");
  if (!node) return;
  const items = buildSystemActivity();
  node.innerHTML = items.length ? items.map((item) => `
    <article class="system-row">
      <div class="system-icon tone-${item.tone}">${icon(item.icon)}</div>
      <div class="system-copy">
        <strong>${escapeHtml(item.title)}</strong>
        <small>${escapeHtml(item.description)}</small>
      </div>
      <span class="system-time">${item.time}</span>
    </article>
  `).join("") : `<div class="notification-empty">В выбранном периоде нет событий системы.</div>`;
}

function renderBookingsTable() {
  const node = document.querySelector("[data-bookings-table]");
  if (!node) return;
  const items = dashboardState.filtered.tableBookings;
  node.innerHTML = items.length ? `
    <div class="bookings-head">
      <span>ID</span>
      <span>Объект</span>
      <span>Партнёр</span>
      <span>Клиент</span>
      <span>Даты</span>
      <span>Сумма</span>
      <span>Статус</span>
    </div>
    ${items.map((item) => `
      <article class="bookings-row">
        <span class="booking-id">${escapeHtml(shortBookingId(item.id))}</span>
        <span>${escapeHtml(item.propertyTitle)}</span>
        <span>${escapeHtml(item.partnerName)}</span>
        <span>${escapeHtml(item.customer_name || "Клиент")}</span>
        <span>${formatStayRange(item.start_date, item.end_date)}</span>
        <span>${formatMoney(item.total_amount)}</span>
        <span><i class="status-badge ${bookingStatusTone(item.booking_status)}">${bookingStatusLabel(item.booking_status)}</i></span>
      </article>
    `).join("")}
  ` : `<div class="notification-empty">В выбранном периоде нет бронирований.</div>`;
}

function updateRangeUi() {
  const rangeButton = document.querySelector("[data-range-button]");
  const presetButton = document.querySelector("[data-range-preset-button]");
  const fromInput = document.querySelector("[data-range-from]");
  const toInput = document.querySelector("[data-range-to]");
  const presetSelect = document.querySelector("[data-range-preset]");
  if (rangeButton) rangeButton.querySelector("span:last-child").textContent = `${formatDateUi(selectedRange.from)} - ${formatDateUi(selectedRange.to)}`;
  if (presetButton) presetButton.querySelector("span:first-child").textContent = presetLabel(selectedPreset);
  if (fromInput) fromInput.value = toInputDateValue(selectedRange.from);
  if (toInput) toInput.value = toInputDateValue(selectedRange.to);
  if (presetSelect) presetSelect.value = selectedPreset;
}

function filterDashboardData({ bookings, payments, partnerMessages, applications, reviews }) {
  const from = startOfDay(selectedRange.from);
  const to = endOfDay(selectedRange.to);
  const previous = previousRange(from, to);

  const bookingsInRange = bookings.filter((item) => inRange(item.createdAtDate, from, to));
  const previousBookings = bookings.filter((item) => inRange(item.createdAtDate, previous.from, previous.to));
  const paymentsInRange = payments.filter((item) => inRange(parseDateTime(item.paid_at || item.createdAt), from, to));
  const previousPayments = payments.filter((item) => inRange(parseDateTime(item.paid_at || item.createdAt), previous.from, previous.to));
  const partnerMessagesInRange = partnerMessages.filter((item) => inRange(parseDateTime(item.createdAt), from, to));
  const applicationsInRange = applications.filter((item) => inRange(parseDateTime(item.createdAt), from, to));
  const reviewsInRange = reviews.filter((item) => inRange(parseDateTime(item.createdAt), from, to));

  return {
    bookings: bookingsInRange,
    payments: paymentsInRange,
    partnerMessages: partnerMessagesInRange,
    applications: applicationsInRange,
    reviews: reviewsInRange,
    recentBookings: [...bookingsInRange].sort((a, b) => b.createdAtDate - a.createdAtDate).slice(0, 5),
    tableBookings: [...bookingsInRange].sort((a, b) => b.createdAtDate - a.createdAtDate).slice(0, 5),
    newRequests: bookingsInRange.filter((booking) => ["new_request", "waiting_payment", "commission_paid", "pending_partner_confirmation"].includes(booking.booking_status)),
    chartSeries: buildChartSeries(bookingsInRange, paymentsInRange, from, to, chartGranularity),
    previous: { bookings: previousBookings, payments: previousPayments },
    previousLabel: `${formatDateUi(previous.from)} - ${formatDateUi(previous.to)}`,
  };
}

function getAllBookings(state = window.ANIMA_DB?.getState?.(seedData)) {
  const propertiesById = new Map((state?.tables.partnerProperties || []).map((item) => [item.id, item]));
  const partnersById = new Map((window.ANIMA_DB?.listPartners?.(seedData) || []).map((item) => [item.id, item]));
  return [...(state?.tables.partnerBookings || [])]
    .map((booking) => {
      const property = propertiesById.get(booking.property_id);
      const partner = partnersById.get(booking.partner_id);
      return {
        ...booking,
        property,
        propertyTitle: property?.title || "Объект ANIMA",
        partnerName: partner?.business_name || "Партнёр ANIMA",
        createdAtDate: parseDateTime(booking.createdAt || booking.created_at),
      };
    })
    .sort((a, b) => b.createdAtDate - a.createdAtDate);
}

function computeStats(bookings, payments) {
  const currentProperties = new Set(
    dashboardState.properties
      .filter((item) => ["active", "approved"].includes(item.status) || ["approved"].includes(item.moderation_status))
      .map((item) => item.id)
  );
  const turnover = bookings.reduce((sum, item) => sum + Number(item.total_amount || 0), 0);
  const commission = bookings.reduce((sum, item) => sum + Number(item.commission_amount || 0), 0);
  const pendingPayoutBookings = bookings.filter((item) => ["pending_payout", "not_due", "requested", "processing"].includes(item.payout_status || "") || ["confirmed", "paid", "active", "checked_in", "commission_paid", "pending_partner_confirmation"].includes(item.booking_status || ""));
  const pendingPayout = pendingPayoutBookings.reduce((sum, item) => sum + Number(item.partner_amount || item.partner_balance_amount || 0), 0);
  const paidToPartners = payments
    .filter((item) => item.status === "paid")
    .reduce((sum, item) => sum + Number(item.partner_amount || 0), 0);
  return {
    turnover,
    commission,
    pendingPayout,
    pendingPayoutBookings: pendingPayoutBookings.length,
    paidToPartners,
    activeProperties: currentProperties.size,
  };
}

function buildChartSeries(bookings, payments, from, to, granularity = "day") {
  const totalDays = Math.max(1, Math.round((endOfDay(to) - startOfDay(from)) / 86400000) + 1);
  const points = [];
  if (granularity === "month") {
    const monthBuckets = new Map();
    for (let cursor = 0; cursor < totalDays; cursor += 1) {
      const day = addDays(from, cursor);
      const key = `${day.getFullYear()}-${day.getMonth()}`;
      if (!monthBuckets.has(key)) {
        monthBuckets.set(key, {
          from: new Date(day.getFullYear(), day.getMonth(), 1),
          to: new Date(day.getFullYear(), day.getMonth() + 1, 0),
        });
      }
    }
    monthBuckets.forEach((bucket) => {
      const bucketBookings = bookings.filter((item) => inRange(item.createdAtDate, startOfDay(bucket.from), endOfDay(bucket.to)));
      const bucketPayments = payments.filter((item) => inRange(parseDateTime(item.paid_at || item.createdAt), startOfDay(bucket.from), endOfDay(bucket.to)));
      points.push(makeChartPoint(bucketBookings, bucketPayments, `${monthShort(bucket.from)} ${bucket.from.getFullYear()}`));
    });
    return points;
  }
  if (granularity === "week") {
    for (let cursor = 0; cursor < totalDays; cursor += 7) {
      const bucketFrom = addDays(from, cursor);
      const bucketTo = addDays(from, Math.min(totalDays - 1, cursor + 6));
      const bucketBookings = bookings.filter((item) => inRange(item.createdAtDate, startOfDay(bucketFrom), endOfDay(bucketTo)));
      const bucketPayments = payments.filter((item) => inRange(parseDateTime(item.paid_at || item.createdAt), startOfDay(bucketFrom), endOfDay(bucketTo)));
      points.push(makeChartPoint(bucketBookings, bucketPayments, `${bucketFrom.getDate()}–${bucketTo.getDate()} ${monthShort(bucketTo)}`));
    }
    return points;
  }
  for (let cursor = 0; cursor < totalDays; cursor += 1) {
    const day = addDays(from, cursor);
    const bucketBookings = bookings.filter((item) => sameCalendarDay(item.createdAtDate, day));
    const bucketPayments = payments.filter((item) => sameCalendarDay(parseDateTime(item.paid_at || item.createdAt), day));
    points.push(makeChartPoint(bucketBookings, bucketPayments, `${day.getDate()} ${monthShort(day)}`));
  }
  return points;
}

function makeChartPoint(bookings, payments, label) {
  return {
    label,
    turnover: bookings.reduce((sum, item) => sum + Number(item.total_amount || 0), 0),
    commission: bookings.reduce((sum, item) => sum + Number(item.commission_amount || 0), 0),
    payout: payments.filter((item) => item.status === "paid").reduce((sum, item) => sum + Number(item.partner_amount || 0), 0),
  };
}

function buildSparkline(series, key) {
  return series.map((item) => Number(item[key] || 0));
}

function renderSparkline(values, tone) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(1, max - min);
  const points = values.map((value, index) => {
    const x = values.length <= 1 ? 34 : (index / (values.length - 1)) * 68;
    const y = 22 - (((value - min) / range) * 18);
    return `${x},${y}`;
  }).join(" ");
  return `
    <svg class="kpi-sparkline ${tone}" viewBox="0 0 68 24" aria-hidden="true">
      <polyline points="${points}" />
    </svg>
  `;
}

function buildNotifications({ applications, partnerMessages, properties, partners }) {
  const propertiesById = new Map(properties.map((item) => [item.id, item]));
  const partnersById = new Map(partners.map((item) => [item.id, item]));
  return [
    ...applications.map((item) => ({
      title: "Новая заявка на партнёрство",
      description: `${item.business_name || "Без названия"} · ${item.full_name || "без контакта"}`,
      timeLabel: relativeTime(item.createdAt),
      sortDate: parseDateTime(item.createdAt),
      tone: "gold",
      icon: "building",
    })),
    ...partnerMessages.map((item) => {
      const property = propertiesById.get(item.property_id);
      const partner = partnersById.get(item.partner_id);
      return {
        title: "Сообщение от партнёра",
        description: `${partner?.business_name || property?.title || "Партнёр"} · ${item.text || "Без текста"}`,
        timeLabel: relativeTime(item.createdAt),
        sortDate: parseDateTime(item.createdAt),
        tone: "teal",
        icon: "message",
      };
    }),
  ]
    .sort((a, b) => b.sortDate - a.sortDate)
    .slice(0, 12);
}

function buildSystemActivity() {
  return [
    ...dashboardState.filtered.recentBookings.map((item) => ({
      title: `Бронирование ${shortBookingId(item.id)}`,
      description: `${item.propertyTitle} · ${item.customer_name || "Клиент"}`,
      time: relativeTime(item.createdAt),
      tone: "gold",
      icon: "booking",
      sortDate: item.createdAtDate,
    })),
    ...dashboardState.filtered.partnerMessages.map((item) => ({
      title: "Сообщение партнёра",
      description: item.text || "Без текста",
      time: relativeTime(item.createdAt),
      tone: "teal",
      icon: "message",
      sortDate: parseDateTime(item.createdAt),
    })),
    ...dashboardState.filtered.reviews.map((item) => ({
      title: "Новый отзыв",
      description: `${item.user_name || "Гость"} · ${item.rating || 0} ⭐`,
      time: relativeTime(item.createdAt),
      tone: "green",
      icon: "review",
      sortDate: parseDateTime(item.createdAt),
    })),
  ]
    .sort((a, b) => b.sortDate - a.sortDate)
    .slice(0, 5);
}

function computePendingPayoutRows(bookings, properties) {
  const propertiesById = new Map(properties.map((item) => [item.id, item]));
  const rows = new Map();
  bookings
    .filter((item) => ["pending_payout", "not_due", "requested", "processing"].includes(item.payout_status || "") || ["confirmed", "paid", "active", "checked_in", "commission_paid", "pending_partner_confirmation"].includes(item.booking_status || ""))
    .forEach((item) => {
      const key = item.property_id || "unknown";
      const current = rows.get(key) || { title: propertiesById.get(key)?.title || "Объект ANIMA", amount: 0, count: 0 };
      current.amount += Number(item.partner_amount || item.partner_balance_amount || 0);
      current.count += 1;
      rows.set(key, current);
    });
  return [...rows.values()].sort((a, b) => b.amount - a.amount).slice(0, 5);
}

function bookingStatusBreakdown(bookings) {
  return [
    { label: "Новые", value: bookings.filter((item) => ["new_request", "waiting_payment"].includes(item.booking_status)).length, color: "#5475d9" },
    { label: "Ожидают", value: bookings.filter((item) => ["commission_paid", "pending_partner_confirmation"].includes(item.booking_status)).length, color: "#e0ae43" },
    { label: "Подтверждённые", value: bookings.filter((item) => ["confirmed", "paid", "active", "checked_in"].includes(item.booking_status)).length, color: "#6bbf59" },
    { label: "Отменённые", value: bookings.filter((item) => ["rejected", "cancelled_by_client", "cancelled_by_anima"].includes(item.booking_status)).length, color: "#cf695f" },
    { label: "Завершённые", value: bookings.filter((item) => ["completed", "closed", "payout_sent", "funds_available"].includes(item.booking_status)).length, color: "#758dd7" },
  ].filter((item) => item.value > 0);
}

function buildProfile(partners, properties, bookings) {
  const session = currentSession();
  return {
    username: session?.username || "ADMIN_ANIMA1",
    role: "Super Admin",
    partnerCount: partners.length,
    propertyCount: properties.length,
    bookingCount: bookings.length,
  };
}

function supportedCurrencies() {
  return dashboardState?.state?.settings?.currencies || ["VND", "USD", "EUR", "RUB", "UAH"];
}

function formatMoney(value) {
  const amount = convertMoney(Number(value || 0), currency);
  if (currency === "USD") return `$${Math.round(amount).toLocaleString("en-US")}`;
  if (currency === "EUR") return `€${Math.round(amount).toLocaleString("de-DE")}`;
  return `${Math.round(amount).toLocaleString("ru-RU")} ${currency}`;
}

function convertMoney(value, nextCurrency) {
  const rates = dashboardState?.state?.settings?.currencyRates || seedData.user?.currencyRates || { VND: 1 };
  if (nextCurrency === "VND") return value;
  return value / Number(rates[nextCurrency] || 1);
}

function formatAxisValue(value) {
  const converted = convertMoney(value, currency);
  if (converted >= 1000000) return `${(converted / 1000000).toFixed(1).replace(".0", "")}M`;
  if (converted >= 1000) return `${Math.round(converted / 1000)}k`;
  return `${Math.round(converted)}`;
}

function compareLabel(current, previous, showPercent = false) {
  if (!previous) return "без прошлого периода";
  const delta = current - previous;
  if (delta === 0) return "без изменений";
  if (!showPercent) return `${delta > 0 ? "+" : "−"}${formatMoney(Math.abs(delta))}`;
  const pct = previous ? (delta / previous) * 100 : 0;
  return `${pct > 0 ? "+" : ""}${pct.toFixed(1)}%`;
}

function propertyDeltaLabel(current, previous) {
  const delta = current - previous;
  if (!previous && current) return `${current} в базе`;
  if (delta === 0) return "без изменений";
  return `${delta > 0 ? "+" : ""}${delta} ${plural(Math.abs(delta), ["объект", "объекта", "объектов"])}`;
}

function previousLabel(label) {
  return `сравнение с ${label}`;
}

function presetLabel(value) {
  return {
    thisWeek: "Эта неделя",
    thisMonth: "Этот месяц",
    last30: "30 дней",
    all: "Весь период",
    dataRange: "Период данных",
    custom: "Свой период",
  }[value] || "Свой период";
}

function readRangeState() {
  try {
    return JSON.parse(localStorage.getItem(DASHBOARD_RANGE_KEY) || "null");
  } catch {
    return null;
  }
}

function persistRangeState() {
  localStorage.setItem(DASHBOARD_RANGE_KEY, JSON.stringify({
    from: toInputDateValue(selectedRange.from),
    to: toInputDateValue(selectedRange.to),
    preset: selectedPreset,
  }));
}

function togglePopover(name) {
  const popover = document.querySelector(`[data-popover="${name}"]`);
  if (!popover) return;
  const shouldOpen = activePopover !== name;
  closePopovers();
  if (shouldOpen) {
    popover.hidden = false;
    activePopover = name;
  }
}

function closePopovers() {
  document.querySelectorAll("[data-popover]").forEach((item) => {
    item.hidden = true;
  });
  activePopover = null;
}

function relativeTime(value) {
  const date = parseDateTime(value);
  if (!date) return "только что";
  const diffMin = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));
  if (diffMin < 60) return `${diffMin} мин назад`;
  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 24) return `${diffHours} ч назад`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} дн назад`;
}

function inRange(value, from, to) {
  if (!value) return false;
  return value >= from && value <= to;
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

function previousRange(from, to) {
  const diffDays = Math.max(1, Math.round((endOfDay(to) - startOfDay(from)) / 86400000) + 1);
  const previousTo = addDays(from, -1);
  const previousFrom = addDays(previousTo, -(diffDays - 1));
  return { from: startOfDay(previousFrom), to: endOfDay(previousTo) };
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function sameMonth(left, right) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
}

function sameCalendarDay(left, right) {
  return left && right
    && left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

function toInputDateValue(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDateUi(date) {
  return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()}`;
}

function monthShort(date) {
  return ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"][date.getMonth()];
}

function formatStayRange(start, end) {
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  if (!startDate || !endDate) return "Даты не заданы";
  return `${startDate.getDate()}–${endDate.getDate()} ${monthShort(endDate)}, ${endDate.getFullYear()}`;
}

function bookingStatusLabel(status = "") {
  return {
    new_request: "Новая",
    waiting_payment: "Ожидает",
    commission_paid: "Ожидает",
    pending_partner_confirmation: "Ожидает",
    confirmed: "Подтверждена",
    paid: "Подтверждена",
    active: "Подтверждена",
    checked_in: "Подтверждена",
    rejected: "Отменена",
    cancelled_by_client: "Отменена",
    cancelled_by_anima: "Отменена",
    completed: "Завершена",
    closed: "Завершена",
    payout_sent: "Завершена",
    funds_available: "Завершена",
  }[status] || "В работе";
}

function bookingStatusTone(status = "") {
  return {
    new_request: "new",
    waiting_payment: "waiting",
    commission_paid: "waiting",
    pending_partner_confirmation: "waiting",
    confirmed: "confirmed",
    paid: "confirmed",
    active: "confirmed",
    checked_in: "confirmed",
    completed: "complete",
    closed: "complete",
    payout_sent: "complete",
    funds_available: "complete",
    rejected: "cancelled",
    cancelled_by_client: "cancelled",
    cancelled_by_anima: "cancelled",
  }[status] || "waiting";
}

function shortBookingId(id = "") {
  const suffix = id.split("_").pop() || id;
  return `#${suffix.slice(-4)}`;
}

function initials(value = "") {
  return String(value)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0]?.toUpperCase() || "")
    .join("");
}

function thumbStyle(property) {
  const photo = property?.photos?.[0];
  return photo ? `background-image:url('${photo}');` : "background:linear-gradient(135deg, rgba(128,145,109,.95), rgba(66,86,60,.95));";
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
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function thumbIcon() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 18V8.8A1.8 1.8 0 015.8 7h12.4A1.8 1.8 0 0120 8.8V18" />
      <path d="M2.5 18h19" />
      <path d="M8 18v-4.5A1.5 1.5 0 019.5 12h5a1.5 1.5 0 011.5 1.5V18" />
      <path d="M9 7V5.8A1.8 1.8 0 0110.8 4h2.4A1.8 1.8 0 0115 5.8V7" />
    </svg>
  `;
}

function showToast(message) {
  const toast = document.querySelector("[data-dashboard-toast]");
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
    window.setTimeout(() => {
      toast.hidden = true;
    }, 180);
  }, 2400);
}

function icon(name) {
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
    ruble: `<svg viewBox="0 0 24 24"><path d="M8 4v16M8 4h5a4 4 0 010 8H8M6 16h8" /></svg>`,
    pie: `<svg viewBox="0 0 24 24"><path d="M12 3v9h9A9 9 0 0012 3z" /><path d="M11 4.1A9 9 0 1020 13h-9z" /></svg>`,
    "clock-pie": `<svg viewBox="0 0 24 24"><path d="M12 3v9l7.5 4.3A9 9 0 1012 3z" /><path d="M12 3a9 9 0 019 9h-9z" /></svg>`,
    "wallet-card": `<svg viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="12" rx="2" /><path d="M15 10h5v4h-5a2 2 0 010-4z" /><circle cx="16.7" cy="12" r=".7" /></svg>`,
    buildings: `<svg viewBox="0 0 24 24"><path d="M3 20V8l6-2v14" /><path d="M9 20V4l6 2v14" /><path d="M15 20v-9l6-2v11" /><path d="M6 10h.01M6 13h.01M12 9h.01M12 12h.01M18 12h.01M18 15h.01" /></svg>`,
    "clipboard-badge": `<svg viewBox="0 0 24 24"><rect x="5" y="4" width="14" height="16" rx="2" /><path d="M9 4.5h6v3H9z" /><path d="M9 12h6" /><circle cx="17.5" cy="8.5" r="2.5" /></svg>`,
    booking: `<svg viewBox="0 0 24 24"><path d="M5 19V7l7-3 7 3v12" /><path d="M9 11h6M9 15h4" /></svg>`,
    review: `<svg viewBox="0 0 24 24"><path d="M12 3l2.2 4.6 5 .8-3.6 3.5.8 4.9L12 14.8 7.6 16.8l.8-4.9L4.8 8.4l5-.8z" /></svg>`,
    bell: `<svg viewBox="0 0 24 24"><path d="M6 9a6 6 0 1112 0v4.2l1.5 2.8H4.5L6 13.2V9z" /><path d="M10 19a2 2 0 004 0" /></svg>`,
    chevron: `<svg viewBox="0 0 24 24"><path d="M7 10l5 5 5-5" /></svg>`,
    "user-fill": `<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M5 20a7 7 0 0114 0" /></svg>`,
  };
  return icons[name] || "";
}
