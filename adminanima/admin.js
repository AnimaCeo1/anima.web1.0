const STORAGE_KEY = "anima.admin.entries.v1";
const SESSION_KEY = "anima.admin.session.v1";
const PENDING_USER_KEY = "anima.admin.pendingUser.v1";
const ADMIN_SETTINGS_KEY = "anima.admin.settings.v1";
const seedData = window.ANIMA_DATA || {};

const admins = {
  ADMIN_ANIMA1: "af82a75d02f569ffce087f5921cc215307d3d4356c43967024a73243de55d10f",
  ADMIN_ANIMA2: "925765920630decff6e552d92bfc79762bee3f48897a13a873380edc548b0737",
};

const cardSections = [
  { value: "stay", label: "Жильё", categories: ["Hotels", "Apartments", "Houses", "Villas"] },
  { value: "eat", label: "Еда и напитки", categories: ["Coffee", "Breakfast", "Vietnamese", "Healthy", "Vegetarian", "Bakery", "Fine Dining", "Atmospheric Places"] },
  { value: "experiences", label: "Впечатления", categories: ["Nature", "Romantic", "Adventure", "Coffee", "Relax", "Photography", "Wellness", "Premium"] },
  { value: "transport", label: "Транспорт", categories: ["Moto", "Bike / E-bike", "Bicycle", "Car", "Personal Driver", "Transfer", "Bus"] },
  { value: "services", label: "Сервисы", categories: ["Creative", "Wellness", "Business", "Repair", "Tours", "Fitness", "Beauty", "Digital"] },
  { value: "jobs", label: "Работа", categories: ["Remote", "Local", "Part-time", "Full-time", "Freelance", "English-speaking"] },
  { value: "community", label: "Сообщество", categories: ["Events", "Meetups", "Housing", "Services", "Digital Nomads"] },
  { value: "for-business", label: "Для бизнеса", categories: ["Partner", "Campaign", "Offer", "Analytics"] },
  { value: "tech-solutions", label: "Цифровые услуги", categories: ["Web", "Apps", "Automation", "Booking", "Branding", "QR Solutions"] },
];

const optionLabels = {
  section: Object.fromEntries(cardSections.map((section) => [section.value, section.label])),
  category: {
    Hotels: "Отели",
    Apartments: "Апартаменты",
    Houses: "Дома",
    Villas: "Виллы",
    Coffee: "Кофе",
    Breakfast: "Завтраки",
    Vietnamese: "Вьетнамская кухня",
    Healthy: "Здоровое питание",
    Vegetarian: "Вегетарианское",
    Bakery: "Выпечка",
    "Fine Dining": "Высокая кухня",
    "Atmospheric Places": "Атмосферные места",
    Nature: "Природа",
    Romantic: "Романтика",
    Adventure: "Приключения",
    Relax: "Релакс",
    Photography: "Фото",
    Wellness: "Велнес",
    Premium: "Премиум",
    Moto: "Мото",
    "Bike / E-bike": "Байк / электробайк",
    Bicycle: "Велосипед",
    Car: "Авто",
    "Personal Driver": "Личный водитель",
    Transfer: "Трансфер",
    Bus: "Автобус",
    Creative: "Креатив",
    Business: "Бизнес",
    Repair: "Ремонт",
    Tours: "Туры",
    Fitness: "Фитнес",
    Beauty: "Красота",
    Digital: "Цифровые",
    Remote: "Удалённо",
    Local: "Локально",
    "Part-time": "Неполный день",
    "Full-time": "Полный день",
    Freelance: "Фриланс",
    "English-speaking": "Для англоязычных",
    Events: "События",
    Meetups: "Встречи",
    Housing: "Жильё",
    "Digital Nomads": "Для удалённой работы",
    Partner: "Партнёр",
    Campaign: "Кампания",
    Offer: "Оффер",
    Analytics: "Аналитика",
    Web: "Сайты",
    Apps: "Приложения",
    Automation: "Автоматизация",
    Booking: "Бронирование",
    Branding: "Брендинг",
    "QR Solutions": "QR-решения",
    "Honey & Bee Products": "Мёд и продукты пчёл",
    Strawberry: "Клубника",
    "Dairy Products": "Молочные продукты",
    Flowers: "Цветы",
    Merch: "Мерч",
    "Gift Sets": "Подарочные наборы",
    "Eco Products": "Эко-товары",
  },
  type: {
    event: "Событие",
    promotion: "Акция",
    community: "Сообщество",
    place: "Место",
    experience: "Впечатление",
  },
  status: {
    published: "Опубликовано",
    draft: "Черновик",
  },
  placement: {
    home: "Главная",
    feed: "Лента",
    stay: "Жильё",
    eat: "Еда и напитки",
    experiences: "Впечатления",
    transport: "Транспорт",
    jobs: "Работа",
    services: "Сервисы",
    store: "Магазин",
  },
  screen: {
    stay: "Жильё",
    eat: "Еда и напитки",
    experiences: "Впечатления",
    transport: "Транспорт",
    exchange: "Обмен",
    services: "Сервисы",
    jobs: "Работа",
    community: "Сообщество",
    "for-business": "Для бизнеса",
    "tech-solutions": "Цифровые услуги",
    store: "Магазин",
  },
  hasKitchen: {
    true: "Есть кухня",
    false: "Без кухни",
  },
  priceType: {
    "/ night": "за ночь",
    "/ month": "за месяц",
    "": "не указывать",
  },
  priceCurrency: {
    VND: "VND",
    USD: "USD",
    EUR: "EUR",
    RUB: "RUB",
    UAH: "UAH",
  },
  monthlyPriceCurrency: {
    VND: "VND",
    USD: "USD",
    EUR: "EUR",
    RUB: "RUB",
    UAH: "UAH",
  },
  cleaningFeeCurrency: {
    VND: "VND",
    USD: "USD",
    EUR: "EUR",
    RUB: "RUB",
    UAH: "UAH",
  },
  serviceFeeCurrency: {
    VND: "VND",
    USD: "USD",
    EUR: "EUR",
    RUB: "RUB",
    UAH: "UAH",
  },
  depositCurrency: {
    VND: "VND",
    USD: "USD",
    EUR: "EUR",
    RUB: "RUB",
    UAH: "UAH",
  },
  paymentFlow: {
    "full-prepaid": "Сразу полная оплата",
    "deposit-prepaid": "Сначала депозит",
    "commission-only": "Только комиссия ANIMA",
  },
  workflow: {
    news: "Новость",
    card: "Основное",
    product: "Товары",
  },
};

const workflows = [
  {
    id: "news",
    title: "Новость",
    icon: "+",
    hint: "Пост, событие, акция или обновление для ленты.",
    module: "feed",
    fields: [
      field("type", "Тип новости", "select", ["event", "promotion", "community", "place", "experience"]),
      field("label", "Метка", "text", "Событие сегодня"),
      field("title", "Заголовок", "text", "Живая музыка сегодня", true),
      field("text", "Короткий текст", "textarea", "Что случилось и почему это интересно", true),
      field("meta", "Дата / место / детали", "text", "Сегодня · 20:00 · Далат"),
      field("image", "Фото", "file", "Выбрать файл", true),
      field("points", "Баллы", "number", "70"),
      field("status", "Статус", "select", ["published", "draft"]),
    ],
  },
  {
    id: "product",
    title: "Товары",
    icon: "$",
    hint: "Товары для магазина ANIMA.",
    module: "store",
    fields: productFields(),
  },
  {
    id: "card",
    title: "Основное",
    icon: "*",
    hint: "Жильё, кафе, вакансии, сервисы, транспорт и другие карточки приложения.",
    fields: [
      field("section", "Раздел приложения", "select", cardSections.map((section) => section.value), false, "stay"),
      field("category", "Категория", "select", cardSections[0].categories),
      field("title", "Название карточки", "text", "Кафе Pine Brew", true),
      field("description", "Описание", "textarea", "Короткое понятное описание карточки", true),
      field("location", "Локация", "text", "Далат"),
      moneyField("price", "Цена / оплата", "500,000"),
      field("image", "Фото", "file", "Выбрать файл", true),
      field("points", "Баллы", "number", "60"),
      field("status", "Статус", "select", ["published", "draft"]),
    ],
  },
];

function productFields() {
  return [
    sectionTitle("Основное"),
    field("title", "Название товара", "text", "Подарочный набор Далата", true),
    field("category", "Категория товара", "select", ["Coffee", "Honey & Bee Products", "Strawberry", "Dairy Products", "Flowers", "Merch", "Gift Sets", "Eco Products"]),
    field("description", "Описание для карточки", "textarea", "Что входит, для кого товар и почему его стоит купить", true),

    sectionTitle("Цена и наличие"),
    field("size", "Размер / объём", "text", "3 позиции"),
    moneyField("price", "Цена", "520,000"),
    field("origin", "Происхождение / район", "text", "Далат"),
    field("contents", "Что внутри", "textarea", "Кофе, клубничный джем, открытка ANIMA", true),
    field("delivery", "Доставка / получение", "text", "Доставка по Далату или самовывоз"),
    field("stock", "Наличие", "text", "В наличии"),

    sectionTitle("Фото и публикация"),
    field("image", "Фото", "file", "Выбрать файл", true),
    field("status", "Статус", "select", ["published", "draft"]),
  ];
}

let entries = readEntries();
let activeWorkflow = "card";
let editingId = null;
let formDraft = null;
let activeAdminSection = "stats";
let adminCurrency = localStorage.getItem("anima.admin.currency") || "VND";

boot();

function boot() {
  showAdminSplash();
  const page = document.body.dataset.page;
  if (page === "login") initLoginPage();
  if (page === "password") initPasswordPage();
  if (page === "dashboard") initDashboardPage();
}

function showAdminSplash() {
  const splash = document.createElement("div");
  splash.className = "admin-launch-splash";
  splash.innerHTML = `
    <div class="admin-launch-mark">ANIMA</div>
    <p>Панель владельца и управления экосистемой</p>
  `;
  document.body.appendChild(splash);
  requestAnimationFrame(() => splash.classList.add("visible"));
  window.setTimeout(() => splash.classList.add("fade-out"), 1100);
  window.setTimeout(() => splash.remove(), 1680);
}

function readAdminSettings() {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_SETTINGS_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeAdminSettings(settings) {
  localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(settings));
}

function adminCredentials() {
  const overrides = readAdminSettings();
  const result = {};
  Object.entries(admins).forEach(([login, hash]) => {
    const item = overrides[login] || {};
    result[item.login || login] = {
      originalLogin: login,
      login: item.login || login,
      hash: item.hash || hash,
    };
  });
  return result;
}

function initLoginPage() {
  if (readSession()) {
    location.replace("./dashboard.html");
    return;
  }
  const form = document.querySelector("[data-login-form]");
  const error = document.querySelector("[data-auth-error]");
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const username = String(new FormData(form).get("username") || "").trim();
    const credentials = adminCredentials();
    if (!credentials[username]) {
      error.textContent = "Такого администратора нет";
      return;
    }
    sessionStorage.setItem(PENDING_USER_KEY, username);
    location.assign("./password.html");
  });
}

function initPasswordPage() {
  if (readSession()) {
    location.replace("./dashboard.html");
    return;
  }
  const username = sessionStorage.getItem(PENDING_USER_KEY);
  const credentials = adminCredentials();
  if (!username || !credentials[username]) {
    location.replace("./");
    return;
  }
  document.querySelector("[data-pending-user]").textContent = username;
  const form = document.querySelector("[data-password-form]");
  const error = document.querySelector("[data-auth-error]");
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const password = String(new FormData(form).get("password") || "");
    const hash = await sha256(password);
    if (credentials[username].hash !== hash) {
      error.textContent = "Неверный пароль";
      return;
    }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      username,
      originalUsername: credentials[username].originalLogin,
      expiresAt: Date.now() + 1000 * 60 * 60 * 8,
    }));
    sessionStorage.removeItem(PENDING_USER_KEY);
    location.assign("./dashboard.html");
  });
}

function initDashboardPage() {
  window.ANIMA_DB?.ensure(seedData);
  const session = readSession();
  if (!session) {
    location.replace("./");
    return;
  }
  document.querySelector("[data-session-user]").textContent = session.username;
  document.querySelector("[data-logout]")?.addEventListener("click", logout);
  document.querySelector("[data-admin-settings]")?.addEventListener("click", openAdminSettings);
  document.querySelector("[data-admin-profile]")?.addEventListener("click", openAdminSettings);
  document.querySelector("[data-export]")?.addEventListener("click", downloadJson);
  document.querySelector("[data-copy-json]")?.addEventListener("click", copyJson);
  document.querySelector("[data-clear-drafts]")?.addEventListener("click", clearDrafts);
  document.querySelector("[data-clear-form]")?.addEventListener("click", clearForm);
  document.querySelector("[data-create-partner]")?.addEventListener("click", openCreatePartnerModal);
  document.querySelector("[data-create-commission]")?.addEventListener("click", openCommissionModal);
  document.querySelector("[data-create-broadcast]")?.addEventListener("click", openBroadcastModal);
  const currencySelect = document.querySelector("[data-admin-currency]");
  if (currencySelect) {
    currencySelect.value = adminCurrency;
    currencySelect.addEventListener("change", () => {
      adminCurrency = currencySelect.value;
      localStorage.setItem("anima.admin.currency", adminCurrency);
      renderDashboard();
    });
  }
  document.querySelector("[data-content-form]")?.addEventListener("input", handleFormInput);
  document.querySelector("[data-content-form]")?.addEventListener("change", handleFormChange);
  document.querySelector("[data-content-form]")?.addEventListener("submit", saveEntry);
  renderDashboard();
}

function renderDashboard() {
  renderStatusBanner();
  renderWorkflowNav();
  renderModeStrip();
  syncAdminSections();
  renderMetrics();
  renderOperations();
  renderOrders();
  renderPartners();
  renderAdminModeration();
  renderAdminBookings();
  renderAdminPayouts();
  renderAdminPayments();
  renderAdminCommissions();
  renderAdminChats();
  renderAdminBroadcasts();
  renderAdminSupportTickets();
  renderPromotionRequests();
  renderEditor();
  renderEntries();
}

function renderStatusBanner() {
  const node = document.querySelector("[data-status-banner]");
  if (!node || !window.ANIMA_DB) return;
  const state = window.ANIMA_DB.getState(seedData);
  const stats = window.ANIMA_DB.getDashboardStats(seedData);
  const bookings = state.tables.partnerBookings || [];
  const from = bookings.length ? new Date(Math.min(...bookings.map((item) => new Date(item.createdAt || item.created_at || Date.now()).getTime()))) : new Date();
  const to = bookings.length ? new Date(Math.max(...bookings.map((item) => new Date(item.createdAt || item.created_at || Date.now()).getTime()))) : new Date();
  node.innerHTML = `
    <div class="status-banner-copy status-banner-copy-welcome">
      <h2>Добро пожаловать, ${escapeHtml(readSession()?.username || "ADMIN_ANIMA1")}! 👋</h2>
      <span>Супер админ панель управления ANIMA</span>
    </div>
    <div class="status-banner-actions">
      <label class="admin-range-pill">
        <span>🗓</span>
        <input type="text" value="${formatDateRange(from, to)}" readonly />
      </label>
      <label class="admin-range-pill admin-range-select">
        <select>
          <option>Этот месяц</option>
        </select>
      </label>
    </div>
  `;
}

function formatDateRange(from, to) {
  const left = `${String(from.getDate()).padStart(2, "0")}.${String(from.getMonth() + 1).padStart(2, "0")}.${from.getFullYear()}`;
  const right = `${String(to.getDate()).padStart(2, "0")}.${String(to.getMonth() + 1).padStart(2, "0")}.${to.getFullYear()}`;
  return `${left} - ${right}`;
}

function ecosystemUptime() {
  const launch = new Date("2025-02-02T00:00:00");
  const current = new Date();
  let years = current.getFullYear() - launch.getFullYear();
  let months = current.getMonth() - launch.getMonth();
  let days = current.getDate() - launch.getDate();
  if (days < 0) {
    months -= 1;
    days += new Date(current.getFullYear(), current.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return `${years} ${pluralRu(years, ["год", "года", "лет"])} ${months} ${pluralRu(months, ["месяц", "месяца", "месяцев"])} ${days} ${pluralRu(days, ["день", "дня", "дней"])}`;
}

function pluralRu(count, forms) {
  const abs = Math.abs(Number(count));
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}

function renderModeStrip() {
  const node = document.querySelector("[data-mode-strip]");
  if (!node) return;
  const modes = [
    { id: "stats", title: "Главная", hint: "Обзор системы", icon: "⌂" },
    { id: "partners", title: "Объекты и партнёры", hint: "Владельцы и карточки", icon: "◫" },
    { id: "booking-center", title: "Заявки на бронирование", hint: "Запросы и статусы", icon: "▥" },
    { id: "orders", title: "Бронирования", hint: "Клиентские заявки", icon: "◧" },
    { id: "publish", title: "Страницы и контент", hint: "Публикации и карточки", icon: "✎" },
    { id: "moderation", title: "Модерация", hint: "Объекты и номера", icon: "✓" },
    { id: "payments", title: "Касса и платежи", hint: "Оплаты клиентов", icon: "₫" },
    { id: "payouts", title: "Выплаты партнёрам", hint: "Финансы", icon: "⇡" },
    { id: "commissions", title: "Комиссии и правила", hint: "Комиссии ANIMA", icon: "%" },
    { id: "chats", title: "Чаты", hint: "Ручные и автоматические", icon: "◌" },
    { id: "broadcasts", title: "Рассылки и уведомления", hint: "Сообщения", icon: "✉" },
    { id: "support-tickets", title: "Поддержка", hint: "Тикеты партнёров", icon: "?" },
  ];
  node.innerHTML = modes.map((mode) => `
    <button class="${mode.id === activeAdminSection ? "active" : ""}" type="button" data-admin-mode="${mode.id}">
      <span>${mode.icon}</span>
      <div><strong>${mode.title}</strong><small>${mode.hint}</small></div>
    </button>
  `).join("");
  node.querySelectorAll("[data-admin-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      activeAdminSection = button.dataset.adminMode;
      syncAdminSections();
      renderModeStrip();
    });
  });
}

function syncAdminSections() {
  document.querySelectorAll("[data-admin-section]").forEach((section) => {
    section.hidden = section.dataset.adminSection !== activeAdminSection;
  });
}

function renderWorkflowNav() {
  const nav = document.querySelector("[data-workflow-nav]");
  nav.innerHTML = workflows.map((workflow) => {
    const count = entries.filter((entry) => workflowMatchesEntry(workflow.id, entry)).length;
    return `
      <button class="${workflow.id === activeWorkflow ? "active" : ""}" type="button" data-workflow="${workflow.id}">
        <span>${workflow.icon}</span>
        <strong>${workflow.title}</strong>
        <small>${count}</small>
      </button>
    `;
  }).join("");
  nav.querySelectorAll("[data-workflow]").forEach((button) => {
    button.addEventListener("click", () => selectWorkflow(button.dataset.workflow));
  });
}

function selectWorkflow(id) {
  activeWorkflow = id;
  editingId = null;
  activeAdminSection = "publish";
  renderDashboard();
}

function renderMetrics() {
  const node = document.querySelector("[data-metrics]");
  if (!node || !window.ANIMA_DB) return;
  const state = window.ANIMA_DB.getState(seedData);
  const bookings = state.tables.partnerBookings || [];
  const payments = state.tables.payments || [];
  const partners = state.tables.partners || [];
  const properties = state.tables.partnerProperties || [];
  const totalTurnover = bookings.reduce((sum, booking) => sum + Number(booking.total_amount || 0), 0);
  const totalCommission = bookings.reduce((sum, booking) => sum + Number(booking.commission_amount || 0), 0);
  const pendingPayout = bookings
    .filter((booking) => ["paid", "active", "checked_in", "completed", "funds_available", "payout_requested"].includes(booking.booking_status))
    .reduce((sum, booking) => sum + Number(booking.partner_balance_amount || booking.partner_amount || 0), 0);
  const paidToPartners = payments.reduce((sum, payment) => sum + Number(payment.partner_amount || 0), 0);
  const activeProperties = properties.filter((property) => ["active", "approved"].includes(property.status)).length;
  const newRequests = bookings.filter((booking) => ["new_request", "waiting_payment", "commission_paid", "pending_partner_confirmation"].includes(booking.booking_status)).length;
  const cards = [
    ["Общий оборот", formatMoneyVnd(totalTurnover), `${partners.length} партнёр`, "₽"],
    ["Комиссия ANIMA", formatMoneyVnd(totalCommission), `${bookings.length} броней`, "◔"],
    ["Ожидают выплат", formatMoneyVnd(pendingPayout), `${newRequests} заявки`, "◑"],
    ["Выплачено партнёрам", formatMoneyVnd(paidToPartners), `${payments.length} платежа`, "◕"],
    ["Активные объекты", activeProperties || "0", `из ${properties.length} всего`, "▣"],
    ["Новые заявки", newRequests || "0", newRequests ? "Требуют внимания" : "Новых заявок нет", "▤"],
  ];
  node.innerHTML = cards.map(([label, value, hint, icon]) => `
    <article class="metric-card metric-card-rich">
      <div class="metric-copy"><span>${label}</span><strong>${value}</strong><small>${hint}</small></div>
      <div class="metric-icon">${icon}</div>
    </article>
  `).join("");
}

function renderOperations() {
  const node = document.querySelector("[data-ops-panels]");
  if (!node || !window.ANIMA_DB) return;
  const state = window.ANIMA_DB.getState(seedData);
  const bookings = [...(state.tables.partnerBookings || [])].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
  const partners = state.tables.partners || [];
  const properties = state.tables.partnerProperties || [];
  const reviews = state.tables.reviews || [];
  const applications = state.tables.partnerApplications || [];
  const messages = state.tables.messages || [];
  const chartPoints = chartSeries(bookings, 8);
  const latestBookings = [...bookings].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5);
  const payoutRows = properties.map((property) => {
    const total = bookings.filter((booking) => booking.property_id === property.id).reduce((sum, booking) => sum + Number(booking.partner_balance_amount || booking.partner_amount || 0), 0);
    const count = bookings.filter((booking) => booking.property_id === property.id).length;
    return { title: property.title, amount: total, count };
  }).sort((a, b) => b.amount - a.amount).slice(0, 5);
  const statusStats = bookingStatusStats(bookings);
  const systemEvents = [
    ...applications.map((item) => ({ title: "Новая заявка партнёра", subtitle: item.business_name || "Без названия", time: item.createdAt, tone: "green" })),
    ...reviews.map((item) => ({ title: "Новый отзыв", subtitle: `${item.user_name || "Гость"} · ${item.rating || 5}★`, time: item.createdAt, tone: "gold" })),
    ...messages.map((item) => ({ title: "Новое сообщение", subtitle: item.text || "Сообщение", time: item.createdAt, tone: "blue" })),
  ].sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0)).slice(0, 5);
  node.innerHTML = `
    <article class="ops-panel chart-panel wide">
      <div class="panel-heading compact-panel-heading">
        <div><p>Динамика оборота</p><h2>Финансы за последние дни</h2></div>
        <button type="button" class="small-select-btn">По дням</button>
      </div>
      ${renderAdminChart(chartPoints)}
    </article>
    <article class="ops-panel">
      <div class="panel-heading compact-panel-heading">
        <div><p>Недавние заявки</p><h2>Последние бронирования</h2></div>
        <button type="button" class="link-btn">Смотреть все</button>
      </div>
      <div class="ops-list latest-admin-bookings">${latestBookings.map((booking) => {
        const partner = partners.find((item) => item.id === booking.partner_id);
        return `<div><strong>${escapeHtml(partner?.business_name || booking.customer_name || "Заявка")}</strong><span>${escapeHtml(booking.customer_name || "Клиент")}</span><small>${escapeHtml(booking.start_date || "")} - ${escapeHtml(booking.end_date || "")}</small><b>${formatMoneyVnd(booking.total_amount || 0)}</b></div>`;
      }).join("") || '<div><strong>Пока пусто</strong><span>Новые брони появятся здесь</span></div>'}</div>
    </article>
    <article class="ops-panel">
      <div class="panel-heading compact-panel-heading">
        <div><p>Статус заявок</p><h2>Распределение по статусам</h2></div>
      </div>
      ${renderStatusDonut(statusStats)}
    </article>
    <article class="ops-panel">
      <div class="panel-heading compact-panel-heading">
        <div><p>Ожидающие выплаты</p><h2>По объектам</h2></div>
        <button type="button" class="link-btn">Смотреть все</button>
      </div>
      <div class="ops-list">${payoutRows.map((row) => `<div><strong>${escapeHtml(row.title)}</strong><span>${formatMoneyVnd(row.amount)} · ${row.count} броней</span></div>`).join("") || '<div><strong>Нет данных</strong><span>Выплаты появятся здесь</span></div>'}</div>
    </article>
    <article class="ops-panel wide">
      <div class="panel-heading compact-panel-heading">
        <div><p>Активность системы</p><h2>Последние события</h2></div>
        <button type="button" class="link-btn">Смотреть все</button>
      </div>
      <div class="ops-list">${systemEvents.map((event) => `<div><strong>${escapeHtml(event.title)}</strong><span>${escapeHtml(event.subtitle)}</span><small>${timeAgo(event.time)}</small></div>`).join("") || '<div><strong>Нет событий</strong><span>Система пока спокойна</span></div>'}</div>
    </article>
    <article class="ops-panel wide admin-table-panel">
      <div class="panel-heading compact-panel-heading">
        <div><p>Последние бронирования</p><h2>Список заявок</h2></div>
        <button type="button" class="link-btn">Смотреть все</button>
      </div>
      ${renderAdminBookingsTable(latestBookings, partners)}
    </article>
  `;
}

function timeAgo(value) {
  const diff = Math.max(1, Math.round((Date.now() - new Date(value || Date.now()).getTime()) / 3600000));
  return `${diff} ч назад`;
}

function renderAdminBookingsTable(bookings, partners) {
  return `
    <div class="admin-bookings-table">
      <div class="admin-bookings-head"><span>ID</span><span>Объект</span><span>Партнёр</span><span>Клиент</span><span>Даты</span><span>Сумма</span><span>Статус</span></div>
      ${bookings.map((booking, index) => {
        const partner = partners.find((item) => item.id === booking.partner_id);
        return `<div class="admin-bookings-row"><span>#${1250 + index}</span><span>${escapeHtml(partner?.business_name || "Объект")}</span><span>${escapeHtml(partner?.business_name || "Партнёр")}</span><span>${escapeHtml(booking.customer_name || "Клиент")}</span><span>${escapeHtml(booking.start_date || "")} - ${escapeHtml(booking.end_date || "")}</span><span>${formatMoneyVnd(booking.total_amount || 0)}</span><span>${escapeHtml(adminBookingStatusLabel(booking.booking_status))}</span></div>`;
      }).join("")}
    </div>
  `;
}

function renderOrders() {
  const node = document.querySelector("[data-orders]");
  if (!node || !window.ANIMA_DB) return;
  const state = window.ANIMA_DB.getState(seedData);
  const orders = state.tables.orders.slice(0, 12);
  if (!orders.length) {
    node.innerHTML = `<div class="empty-table">Пока нет заявок. Брони и заказы появятся здесь.</div>`;
    return;
  }
  node.innerHTML = orders.map((order) => `
    <article class="entry-row order-row">
      <div>
        <h3>${escapeHtml(order.title || "Заявка")}</h3>
        <p>${escapeHtml(order.client || order.fullName || "ANIMA User")} · ${escapeHtml(order.phone || order.email || "без контакта")}</p>
      </div>
      <span class="entry-status">${escapeHtml(order.totalLabel || "без суммы")}</span>
      <span>${formatDate(order.createdAt)}</span>
      <div class="entry-actions order-meta">
        <span class="entry-status subtle">${escapeHtml(orderStatusLabel(order.status))}</span>
        <button type="button" data-order-details="${escapeAttribute(order.id)}">Детали</button>
      </div>
    </article>
  `).join("");
  node.querySelectorAll("[data-order-details]").forEach((button) => {
    button.addEventListener("click", () => {
      const order = orders.find((item) => item.id === button.dataset.orderDetails);
      if (order) openOrderDetails(order);
    });
  });
}

function renderPromotionRequests() {
  const node = document.querySelector("[data-promotion-requests]");
  if (!node || !window.ANIMA_DB) return;
  const requests = window.ANIMA_DB.listPromotionRequests(seedData).slice(0, 12);
  if (!requests.length) {
    node.innerHTML = `<div class="empty-table">Пока нет запросов на продвижение. Когда подключим кабинеты партнёров, они появятся здесь.</div>`;
    return;
  }
  node.innerHTML = requests.map((request) => `
    <article class="entry-row order-row">
      <div>
        <h3>${escapeHtml(request.title || "Запрос на продвижение")}</h3>
        <p>${escapeHtml(request.partnerName || request.email || "Партнёр")} · ${escapeHtml(request.category || "категория не указана")}</p>
      </div>
      <span class="entry-status">${escapeHtml(request.entryTitle || "без объекта")}</span>
      <span>${formatDate(request.createdAt)}</span>
      <div class="entry-actions order-meta">
        <span class="entry-status subtle">${escapeHtml(request.status === "done" ? "Обработан" : "Новый")}</span>
      </div>
    </article>
  `).join("");
}

function chartSeries(bookings = [], days = 8) {
  const result = [];
  for (let index = days - 1; index >= 0; index -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - index);
    const key = date.toISOString().slice(0, 10);
    const dayBookings = bookings.filter((booking) => String(booking.createdAt || booking.created_at || "").slice(0, 10) === key);
    result.push({
      label: `${date.getDate()}.${date.getMonth() + 1}`,
      turnover: dayBookings.reduce((sum, booking) => sum + Number(booking.total_amount || 0), 0),
      commission: dayBookings.reduce((sum, booking) => sum + Number(booking.commission_amount || 0), 0),
      payout: dayBookings.reduce((sum, booking) => sum + Number(booking.partner_amount || 0), 0),
    });
  }
  return result;
}

function renderAdminChart(points = []) {
  const max = Math.max(1, ...points.flatMap((point) => [point.turnover, point.commission, point.payout]));
  const project = (value, index, total) => {
    const x = total <= 1 ? 0 : (index / (total - 1)) * 100;
    const y = 100 - ((value || 0) / max) * 100;
    return `${x},${y}`;
  };
  const line = (key) => points.map((point, index) => project(point[key], index, points.length)).join(" ");
  return `
    <div class="admin-chart-wrap">
      <div class="admin-chart-legend"><span class="line green"></span>Оборот <span class="line gold"></span>Комиссия <span class="line blue"></span>Выплаты</div>
      <svg class="admin-chart" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <polyline points="${line("turnover")}" class="chart-line chart-green"></polyline>
        <polyline points="${line("commission")}" class="chart-line chart-gold"></polyline>
        <polyline points="${line("payout")}" class="chart-line chart-blue"></polyline>
      </svg>
      <div class="admin-chart-labels">${points.map((point) => `<span>${point.label}</span>`).join("")}</div>
    </div>
  `;
}

function bookingStatusStats(bookings = []) {
  const buckets = [
    { label: "Новые", value: bookings.filter((booking) => ["new_request", "waiting_payment"].includes(booking.booking_status)).length, color: "#5b7cff" },
    { label: "Ожидают", value: bookings.filter((booking) => ["commission_paid", "pending_partner_confirmation"].includes(booking.booking_status)).length, color: "#e6b84e" },
    { label: "Подтверждённые", value: bookings.filter((booking) => ["confirmed", "paid", "active", "checked_in"].includes(booking.booking_status)).length, color: "#77c65d" },
    { label: "Отменённые", value: bookings.filter((booking) => String(booking.booking_status || "").includes("cancel") || booking.booking_status === "rejected").length, color: "#db756d" },
    { label: "Завершённые", value: bookings.filter((booking) => ["completed", "closed", "payout_sent", "funds_available"].includes(booking.booking_status)).length, color: "#7c8aa5" },
  ];
  return buckets.filter((bucket) => bucket.value > 0);
}

function renderStatusDonut(items = []) {
  const total = Math.max(1, items.reduce((sum, item) => sum + item.value, 0));
  let offset = 0;
  const circles = items.map((item) => {
    const length = (item.value / total) * 251.2;
    const part = `<circle r="40" cx="50" cy="50" fill="transparent" stroke="${item.color}" stroke-width="12" stroke-dasharray="${length} ${251.2 - length}" stroke-dashoffset="${-offset}"></circle>`;
    offset += length;
    return part;
  }).join("");
  return `
    <div class="admin-donut-layout">
      <svg viewBox="0 0 100 100" class="admin-donut" aria-hidden="true">
        <circle r="40" cx="50" cy="50" fill="transparent" stroke="rgba(255,255,255,0.08)" stroke-width="12"></circle>
        ${circles}
      </svg>
      <div class="ops-list">${items.map((item) => `<div><strong>${item.label}</strong><span>${item.value} (${Math.round((item.value / total) * 100)}%)</span></div>`).join("")}</div>
    </div>
  `;
}

function renderPartners() {
  const node = document.querySelector("[data-partners]");
  if (!node || !window.ANIMA_DB?.listPartners) return;
  const partners = window.ANIMA_DB.listPartners(seedData);
  const state = window.ANIMA_DB.getState(seedData);
  const applications = [...(state.tables.partnerApplications || [])].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  const partnerMarkup = partners.length ? partners.map((partner) => `
    <article class="entry-row partner-admin-row">
      <div>
        <h3>${escapeHtml(partner.business_name)}</h3>
        <p>${escapeHtml(partner.contact_name || "контакт не указан")} · ${escapeHtml(partner.email || partner.phone || "без контакта")}</p>
        <p class="entry-stats-line">
          <span>Объекты: ${partner.propertiesCount || 0}</span>
          <span>Брони: ${partner.bookingsCount || 0}</span>
          <span>Оборот: ${formatMoneyVnd(partner.turnover || 0)}</span>
          <span>Комиссия: ${formatMoneyVnd(partner.commission || 0)}</span>
        </p>
      </div>
      <span class="entry-status ${escapeAttribute(partner.status)}">${escapeHtml(partnerStatusLabel(partner.status))}</span>
      <span>${formatDate(partner.createdAt || partner.created_at)}</span>
      <div class="entry-actions">
        <button type="button" data-open-partner="${escapeAttribute(partner.id)}">Открыть</button>
        <button type="button" data-activate-partner="${escapeAttribute(partner.id)}">${partner.status === "active" ? "Активен" : "Активировать"}</button>
        <button type="button" data-block-partner="${escapeAttribute(partner.id)}">Заблокировать</button>
        <button type="button" data-reset-partner="${escapeAttribute(partner.id)}">Сбросить пароль</button>
      </div>
    </article>
  `).join("") : `<div class="empty-table">Пока нет партнёров. Создайте владельца и выдайте временный пароль.</div>`;
  const applicationsMarkup = applications.length ? `
    <section class="dashboard-panel">
      <div class="section-heading compact"><h2>Новые заявки партнёров</h2></div>
      <div class="entry-list">
        ${applications.map((application) => `
          <article class="entry-row partner-admin-row">
            <div>
              <h3>${escapeHtml(application.business_name || "Без названия")}</h3>
              <p>${escapeHtml(application.full_name || "Без имени")} · ${escapeHtml(application.business_type || "без категории")}</p>
              <p class="entry-stats-line">
                <span>${escapeHtml(application.email || "без email")}</span>
                <span>${escapeHtml(application.phone || "без телефона")}</span>
                <span>${escapeHtml(application.preferred_contact || "контакт не указан")}</span>
              </p>
              ${application.comment ? `<p>${escapeHtml(application.comment)}</p>` : ""}
            </div>
            <span class="entry-status new">Новая</span>
            <span>${formatDate(application.createdAt)}</span>
            <div class="entry-actions">
              <button type="button" data-create-partner-from-app="${escapeAttribute(application.id)}">Создать партнёра</button>
            </div>
          </article>
        `).join("")}
      </div>
    </section>
  ` : "";
  node.innerHTML = `${partnerMarkup}${applicationsMarkup}`;
  node.querySelectorAll("[data-open-partner]").forEach((button) => {
    button.addEventListener("click", () => openPartnerDetails(button.dataset.openPartner));
  });
  node.querySelectorAll("[data-activate-partner]").forEach((button) => {
    button.addEventListener("click", () => {
      window.ANIMA_DB.updatePartner(button.dataset.activatePartner, { status: "active", actorUserId: readSession()?.username || "admin" }, seedData);
      renderDashboard();
    });
  });
  node.querySelectorAll("[data-block-partner]").forEach((button) => {
    button.addEventListener("click", () => {
      window.ANIMA_DB.updatePartner(button.dataset.blockPartner, { status: "blocked", actorUserId: readSession()?.username || "admin" }, seedData);
      renderDashboard();
    });
  });
  node.querySelectorAll("[data-reset-partner]").forEach((button) => {
    button.addEventListener("click", () => {
      window.ANIMA_DB.resetPartnerPassword(button.dataset.resetPartner, undefined, seedData);
      alert("Временный пароль сброшен: Anima2026. Партнёр должен сменить его при входе.");
      renderDashboard();
    });
  });
  node.querySelectorAll("[data-create-partner-from-app]").forEach((button) => {
    button.addEventListener("click", () => {
      const application = applications.find((item) => item.id === button.dataset.createPartnerFromApp);
      if (!application) return;
      window.ANIMA_DB.createPartner({
        actorUserId: readSession()?.username || "admin",
        business_name: application.business_name,
        business_type: application.business_type || "other",
        contact_name: application.full_name,
        email: application.email,
        phone: application.phone,
        telegram: application.telegram,
        whatsapp: application.whatsapp,
        login: application.email || application.phone || `${application.business_name}_${Date.now()}`,
        status: "pending",
      }, seedData);
      renderDashboard();
    });
  });
}

function partnerStatusLabel(status = "pending") {
  return {
    pending: "На проверке",
    active: "Активен",
    blocked: "Заблокирован",
  }[status] || status;
}

function businessTypeLabel(type = "other") {
  return {
    hotel: "Отель",
    apartment: "Апартаменты",
    cafe: "Кафе",
    tour: "Тур",
    other: "Другое",
  }[type] || type;
}

function openCreatePartnerModal() {
  const body = `
    <form class="profile-edit-form admin-partner-form" data-create-partner-form>
      <label><span>Название бизнеса</span><input name="business_name" required placeholder="IBIS Style Hotel Da Lat" /></label>
      <label><span>Тип бизнеса</span>
        <select name="business_type">
          <option value="hotel">hotel</option>
          <option value="apartment">apartment</option>
          <option value="cafe">cafe</option>
          <option value="tour">tour</option>
          <option value="other">other</option>
        </select>
      </label>
      <label><span>Имя владельца</span><input name="contact_name" required /></label>
      <label><span>Email</span><input name="email" type="email" /></label>
      <label><span>Телефон</span><input name="phone" /></label>
      <label><span>Telegram</span><input name="telegram" /></label>
      <label><span>WhatsApp</span><input name="whatsapp" /></label>
      <label><span>Логин</span><input name="login" required placeholder="partner_login" /></label>
      <label><span>Статус</span>
        <select name="status">
          <option value="pending">pending</option>
          <option value="active">active</option>
          <option value="blocked">blocked</option>
        </select>
      </label>
      <div class="form-guide full">Временный пароль по умолчанию: Anima2026. После первого входа партнёр обязан сменить пароль.</div>
      <div class="form-actions full"><button type="submit">Создать партнёра</button></div>
    </form>
  `;
  const modal = createAdminModal("Новый партнёр", body);
  modal.querySelector("[data-create-partner-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      window.ANIMA_DB.createPartner({ ...payload, actorUserId: readSession()?.username || "admin" }, seedData);
      modal.remove();
      activeAdminSection = "partners";
      renderDashboard();
    } catch (error) {
      alert(error?.message === "PARTNER_LOGIN_EXISTS" ? "Такой логин уже занят." : "Не удалось создать партнёра.");
    }
  });
}

function openPartnerDetails(partnerId) {
  const partner = window.ANIMA_DB.listPartners(seedData).find((item) => item.id === partnerId);
  const workspace = window.ANIMA_DB.getPartnerWorkspace(partnerId, seedData);
  if (!partner) return;
  const body = `
    <div class="order-detail-grid">
      ${[
        ["Бизнес", partner.business_name],
        ["Тип", businessTypeLabel(partner.business_type)],
        ["Владелец", partner.contact_name || "не указан"],
        ["Email", partner.email || "не указан"],
        ["Телефон", partner.phone || "не указан"],
        ["Telegram", partner.telegram || "не указан"],
        ["Статус", partnerStatusLabel(partner.status)],
        ["Комиссия", `${partner.commission_percent}%`],
        ["Объектов", workspace.properties.length],
        ["Броней", workspace.bookings.length],
        ["Оборот", formatMoneyVnd(workspace.stats.totalRevenue)],
        ["К выплате", formatMoneyVnd(workspace.stats.partnerAmount)],
      ].map(([label, value]) => `
        <div class="order-detail-item"><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value || ""))}</strong></div>
      `).join("")}
    </div>
    <div class="partner-admin-columns">
      <section>
        <h3>Объекты</h3>
        ${workspace.properties.map((property) => `<p>${escapeHtml(property.title)} · ${paymentMethodLabel(property.payment_settings?.method)} · ${property.payment_settings?.cash_allowed === false ? "наличные запрещены" : "наличные разрешены"} <button type="button" data-admin-property-payment="${escapeAttribute(property.id)}">Оплата</button></p>`).join("") || "<p>Нет объектов</p>"}
      </section>
      <section>
        <h3>Последние брони</h3>
        ${workspace.bookings.slice(0, 5).map((booking) => `<p>${escapeHtml(booking.customer_name)} · ${escapeHtml(booking.booking_status)} · ${formatMoneyVnd(booking.total_amount)}</p>`).join("") || "<p>Нет броней</p>"}
      </section>
      <section>
        <h3>Аудит</h3>
        ${workspace.auditLogs.slice(0, 6).map((item) => `<p>${escapeHtml(item.action)} · ${formatDate(item.createdAt)}</p>`).join("") || "<p>Пока нет действий</p>"}
      </section>
    </div>
    <div class="form-actions admin-order-actions">
      <a class="admin-link-button" href="../partner.html" target="_blank">Открыть кабинет партнёра</a>
      <button class="secondary" type="button" data-partner-activate="${escapeAttribute(partnerId)}">Активировать</button>
      <button class="secondary danger" type="button" data-partner-block="${escapeAttribute(partnerId)}">Заблокировать</button>
      <button type="button" data-partner-reset="${escapeAttribute(partnerId)}">Сбросить пароль</button>
    </div>
  `;
  const modal = createAdminModal("Карточка партнёра", body);
  modal.querySelector("[data-partner-activate]")?.addEventListener("click", () => {
    window.ANIMA_DB.updatePartner(partnerId, { status: "active", actorUserId: readSession()?.username || "admin" }, seedData);
    modal.remove();
    renderDashboard();
  });
  modal.querySelector("[data-partner-block]")?.addEventListener("click", () => {
    window.ANIMA_DB.updatePartner(partnerId, { status: "blocked", actorUserId: readSession()?.username || "admin" }, seedData);
    modal.remove();
    renderDashboard();
  });
  modal.querySelector("[data-partner-reset]")?.addEventListener("click", () => {
    window.ANIMA_DB.resetPartnerPassword(partnerId, undefined, seedData);
    alert("Временный пароль сброшен: Anima2026.");
    modal.remove();
    renderDashboard();
  });
  modal.querySelectorAll("[data-admin-property-payment]").forEach((button) => {
    button.addEventListener("click", () => openPropertyPaymentAdminModal(button.dataset.adminPropertyPayment));
  });
}

function renderAdminBookings() {
  const node = document.querySelector("[data-admin-bookings]");
  const filters = document.querySelector("[data-admin-booking-filters]");
  if (!node || !window.ANIMA_DB) return;
  const state = window.ANIMA_DB.getState(seedData);
  const partners = window.ANIMA_DB.listPartners(seedData);
  const bookings = [...(state.tables.partnerBookings || [])].sort((a, b) => new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0));
  const statuses = [
    ["", "Все заявки"],
    ["new_request", "Новые заявки"],
    ["pending_partner_confirmation", "Ожидают подтверждения отеля"],
    ["commission_paid", "Сервисный сбор оплачен"],
    ["confirmed", "Подтверждены отелем"],
    ["waiting_payment", "Ожидают оплаты"],
    ["paid", "Оплачены"],
    ["completed", "Завершены"],
    ["cancelled_by_client", "Отменены"],
    ["dispute", "Спорные"],
    ["problem", "Проблемные"],
  ];
  if (filters) {
    filters.innerHTML = statuses.map(([value, label]) => `<button class="admin-filter ${value === (filters.dataset.status || "") ? "active" : ""}" type="button" data-admin-booking-status="${escapeAttribute(value)}">${escapeHtml(label)}</button>`).join("");
    filters.querySelectorAll("[data-admin-booking-status]").forEach((button) => {
      button.addEventListener("click", () => {
        filters.dataset.status = button.dataset.adminBookingStatus;
        renderAdminBookings();
      });
    });
  }
  const activeStatus = filters?.dataset.status || "";
  const items = activeStatus ? bookings.filter((booking) => booking.booking_status === activeStatus) : bookings;
  node.innerHTML = items.map((booking) => {
    const partner = partners.find((item) => item.id === booking.partner_id);
    const room = state.tables.partnerUnits.find((item) => item.id === booking.unit_id);
    return `
      <article class="entry-row order-row">
        <div>
          <h3>${escapeHtml(booking.customer_name)} · ${escapeHtml(partner?.business_name || "Партнёр")}</h3>
          <p>${escapeHtml(room?.name || "Комната")} · ${escapeHtml(booking.start_date)} - ${escapeHtml(booking.end_date)} · ${booking.guests_count || 1} гостей</p>
          <p class="entry-stats-line">
            <span>Стоимость: ${formatMoneyVnd(booking.total_amount)}</span>
            <span>Сбор ANIMA: ${formatMoneyVnd(booking.commission_amount)}</span>
            <span>Чистая прибыль: ${formatMoneyVnd(booking.partner_amount)}</span>
          </p>
        </div>
        <span class="entry-status">${escapeHtml(adminBookingStatusLabel(booking.booking_status))}</span>
        <span>${escapeHtml(paymentStatusLabel(booking.payment_status))}</span>
        <div class="entry-actions">
          <button type="button" data-admin-booking="${escapeAttribute(booking.id)}">Открыть</button>
          <button type="button" data-admin-paid="${escapeAttribute(booking.id)}">Оплачено</button>
          <button type="button" data-admin-problem="${escapeAttribute(booking.id)}">Проблема</button>
        </div>
      </article>
    `;
  }).join("") || `<div class="empty-table">Заявок в этом статусе нет.</div>`;
  node.querySelectorAll("[data-admin-booking]").forEach((button) => button.addEventListener("click", () => openAdminBookingModal(button.dataset.adminBooking)));
  node.querySelectorAll("[data-admin-paid]").forEach((button) => button.addEventListener("click", () => {
    window.ANIMA_DB.recordPayment(button.dataset.adminPaid, { actorUserId: readSession()?.username || "admin", status: "paid", method: "manual" }, seedData);
    renderDashboard();
  }));
  node.querySelectorAll("[data-admin-problem]").forEach((button) => button.addEventListener("click", () => {
    window.ANIMA_DB.updateBookingAdmin(button.dataset.adminProblem, { actorUserId: readSession()?.username || "admin", booking_status: "problem", admin_comment: "Помечено как проблемная заявка" }, seedData);
    renderDashboard();
  }));
}

function renderAdminModeration() {
  const node = document.querySelector("[data-admin-moderation]");
  if (!node || !window.ANIMA_DB) return;
  const state = window.ANIMA_DB.getState(seedData);
  const partners = window.ANIMA_DB.listPartners(seedData);
  const requests = [...(state.tables.moderationRequests || [])].sort((a, b) => new Date(b.submitted_at || b.createdAt || 0) - new Date(a.submitted_at || a.createdAt || 0));
  node.innerHTML = requests.map((request) => {
    const partner = partners.find((item) => item.id === request.partner_id);
    return `
      <article class="entry-row order-row">
        <div>
          <h3>${escapeHtml(request.title || "Заявка на модерацию")}</h3>
          <p>${escapeHtml(partner?.business_name || "Партнёр")} · ${moderationEntityLabel(request.entity_type)} · ${moderationChangeLabel(request.change_type)} · ${formatDate(request.submitted_at || request.createdAt)}</p>
          ${request.admin_comment ? `<p class="entry-stats-line"><span>Комментарий: ${escapeHtml(request.admin_comment)}</span></p>` : ""}
        </div>
        <span class="entry-status">${moderationStatusLabel(request.status)}</span>
        <div class="entry-actions">
          <button type="button" data-open-moderation="${escapeAttribute(request.id)}">Открыть</button>
          ${request.status === "pending_review" ? `<button type="button" data-approve-moderation="${escapeAttribute(request.id)}">Одобрить</button><button type="button" data-reject-moderation="${escapeAttribute(request.id)}">Отклонить</button>` : ""}
        </div>
      </article>
    `;
  }).join("") || `<div class="empty-table">Заявок на модерацию пока нет.</div>`;
  node.querySelectorAll("[data-open-moderation]").forEach((button) => button.addEventListener("click", () => openModerationModal(button.dataset.openModeration)));
  node.querySelectorAll("[data-approve-moderation]").forEach((button) => button.addEventListener("click", () => reviewModeration(button.dataset.approveModeration, "approved")));
  node.querySelectorAll("[data-reject-moderation]").forEach((button) => button.addEventListener("click", () => reviewModeration(button.dataset.rejectModeration, "rejected")));
}

function openModerationModal(requestId) {
  const state = window.ANIMA_DB.getState(seedData);
  const request = state.tables.moderationRequests.find((item) => item.id === requestId);
  if (!request) return;
  const body = `
    <div class="order-detail-grid">
      ${[
        ["Тип", moderationEntityLabel(request.entity_type)],
        ["Изменение", moderationChangeLabel(request.change_type)],
        ["Статус", moderationStatusLabel(request.status)],
        ["Отправлено", formatDate(request.submitted_at || request.createdAt)],
      ].map(([label, value]) => `<div class="order-detail-item"><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value || ""))}</strong></div>`).join("")}
    </div>
    <div class="partner-admin-columns">
      <section><h3>Старая версия</h3><pre class="json-preview">${escapeHtml(JSON.stringify(request.old_value || {}, null, 2))}</pre></section>
      <section><h3>Новая версия</h3><pre class="json-preview">${escapeHtml(JSON.stringify(request.new_value || {}, null, 2))}</pre></section>
    </div>
    <form class="profile-edit-form admin-partner-form" data-moderation-form>
      <label class="full"><span>Комментарий администратора</span><input name="adminComment" value="${escapeAttribute(request.admin_comment || "")}" placeholder="Что исправить или почему одобрено" /></label>
      <div class="form-actions full">
        <button type="submit" name="decision" value="approved">Одобрить</button>
        <button class="secondary danger" type="submit" name="decision" value="rejected">Отклонить</button>
      </div>
    </form>
  `;
  const modal = createAdminModal("Модерация изменений", body);
  modal.querySelector("[data-moderation-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const submitter = event.submitter;
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    window.ANIMA_DB.reviewModerationRequest(requestId, {
      actorUserId: readSession()?.username || "admin",
      status: submitter?.value || "approved",
      adminComment: data.adminComment || "",
    }, seedData);
    modal.remove();
    renderDashboard();
  });
}

function reviewModeration(requestId, status) {
  const adminComment = status === "rejected" ? prompt("Комментарий для партнёра") || "" : "";
  window.ANIMA_DB.reviewModerationRequest(requestId, {
    actorUserId: readSession()?.username || "admin",
    status,
    adminComment,
  }, seedData);
  renderDashboard();
}

function openAdminBookingModal(bookingId) {
  const state = window.ANIMA_DB.getState(seedData);
  const booking = state.tables.partnerBookings.find((item) => item.id === bookingId);
  if (!booking) return;
  const partner = state.tables.partners.find((item) => item.id === booking.partner_id);
  const room = state.tables.partnerUnits.find((item) => item.id === booking.unit_id);
  const history = state.tables.bookingStatusHistory.filter((item) => item.booking_id === bookingId);
  const notes = state.tables.adminNotes.filter((item) => item.booking_id === bookingId);
  const body = `
    <div class="order-detail-grid">
      ${[
        ["Клиент", booking.customer_name],
        ["Отель", partner?.business_name || ""],
        ["Комната", room?.name || ""],
        ["Гражданство", booking.citizenship || booking.guests_details?.[0]?.citizenship || "не указано"],
        ["Данные гостей", adminGuestDetailsText(booking)],
        ["Даты", `${booking.start_date} - ${booking.end_date}`],
        ["Сумма", formatMoneyVnd(booking.total_amount)],
        ["Сбор ANIMA", formatMoneyVnd(booking.commission_amount)],
        ["Чистая прибыль владельца", formatMoneyVnd(booking.partner_amount)],
        ["Источник оплаты", paymentMethodLabel(booking.payment_method)],
        ["К оплате сейчас", formatMoneyVnd(booking.pay_now_amount || booking.total_amount)],
        ["Остаток к оплате в отеле", booking.payment_method === "cash_at_hotel" ? formatMoneyVnd(booking.pay_at_hotel_amount || 0) : "0 VND"],
        ["Статус брони", adminBookingStatusLabel(booking.booking_status)],
        ["Статус оплаты", paymentStatusLabel(booking.payment_status)],
        ["Статус выплаты", payoutStatusLabel(booking.payout_status)],
      ].map(([label, value]) => `<div class="order-detail-item"><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value || "не указано"))}</strong></div>`).join("")}
    </div>
    <form class="profile-edit-form admin-partner-form" data-admin-booking-form>
      <label><span>Статус заявки</span>
        <select name="booking_status">
          ${["new_request", "waiting_payment", "commission_paid", "pending_partner_confirmation", "confirmed", "paid", "active", "checked_in", "completed", "funds_available", "payout_requested", "payout_sent", "closed", "cancelled_by_anima", "refund", "dispute", "problem"].map((status) => `<option value="${status}" ${booking.booking_status === status ? "selected" : ""}>${adminBookingStatusLabel(status)}</option>`).join("")}
        </select>
      </label>
      <label><span>Сумма</span><input name="total_amount" inputmode="numeric" value="${escapeAttribute(booking.total_amount)}" /></label>
      <label><span>Комиссия %, ручная</span><input name="commission_percent" inputmode="numeric" value="${escapeAttribute(booking.commission_percent || 5)}" /></label>
      <label><span>Фиксированная комиссия</span><input name="commission_fixed_amount" inputmode="numeric" value="${escapeAttribute(booking.commission_fixed_amount || 0)}" /></label>
      <label><span>Тип комиссии</span><select name="commission_type"><option value="percent">процент</option><option value="fixed">фиксированная сумма</option><option value="percent_fixed">процент + фикс</option></select></label>
      <label class="full"><span>Внутренний комментарий</span><input name="admin_comment" placeholder="Видят только админы ANIMA" /></label>
      <div class="form-actions full"><button type="submit">Сохранить изменения</button><button class="secondary" type="button" data-admin-note-add>Добавить заметку</button></div>
    </form>
    <div class="partner-admin-columns">
      <section><h3>История действий</h3>${history.map((item) => `<p>${escapeHtml(item.old_status || "создано")} → ${escapeHtml(item.new_status)} · ${formatDate(item.createdAt)}</p>`).join("") || "<p>Истории пока нет</p>"}</section>
      <section><h3>Внутренние заметки</h3>${notes.map((item) => `<p>${escapeHtml(item.text)} · ${formatDate(item.createdAt)}</p>`).join("") || "<p>Заметок пока нет</p>"}</section>
    </div>
  `;
  const modal = createAdminModal("Заявка / бронь", body);
  modal.querySelector("[data-admin-booking-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    window.ANIMA_DB.updateBookingAdmin(bookingId, {
      actorUserId: readSession()?.username || "admin",
      booking_status: data.booking_status,
      total_amount: Number(data.total_amount || 0),
      commission_percent: Number(data.commission_percent || 0),
      commission_fixed_amount: Number(data.commission_fixed_amount || 0),
      commission_type: data.commission_type,
      admin_comment: data.admin_comment,
    }, seedData);
    if (data.admin_comment) {
      window.ANIMA_DB.addAdminNote({ authorId: readSession()?.username || "admin", partnerId: booking.partner_id, bookingId, text: data.admin_comment }, seedData);
    }
    modal.remove();
    renderDashboard();
  });
  modal.querySelector("[data-admin-note-add]")?.addEventListener("click", () => {
    const text = prompt("Внутренняя заметка ANIMA");
    if (!text) return;
    window.ANIMA_DB.addAdminNote({ authorId: readSession()?.username || "admin", partnerId: booking.partner_id, bookingId, text }, seedData);
    modal.remove();
    openAdminBookingModal(bookingId);
  });
}

function renderAdminPayouts() {
  const node = document.querySelector("[data-admin-payouts]");
  if (!node || !window.ANIMA_DB) return;
  const state = window.ANIMA_DB.getState(seedData);
  const partners = window.ANIMA_DB.listPartners(seedData);
  const items = state.tables.withdrawalRequests || [];
  node.innerHTML = items.map((request) => {
    const partner = partners.find((item) => item.id === request.partner_id);
    return `
      <article class="entry-row order-row">
        <div><h3>${escapeHtml(partner?.business_name || "Партнёр")} · ${formatMoneyVnd(request.amount)}</h3><p>${escapeHtml(request.recipient_name || "")} · ${escapeHtml(request.bank || "")} · ${escapeHtml(request.account_number || request.phone || "")}</p></div>
        <span class="entry-status">${escapeHtml(withdrawalStatusLabel(request.status))}</span>
        <span>${formatDate(request.createdAt)}</span>
        <div class="entry-actions">
          <button type="button" data-payout-approve="${escapeAttribute(request.id)}">Одобрить</button>
          <button type="button" data-payout-paid="${escapeAttribute(request.id)}">Выплачено</button>
          <button type="button" data-payout-reject="${escapeAttribute(request.id)}">Отклонить</button>
        </div>
      </article>
    `;
  }).join("") || `<div class="empty-table">Заявок на вывод пока нет.</div>`;
  node.querySelectorAll("[data-payout-approve]").forEach((button) => button.addEventListener("click", () => { window.ANIMA_DB.updateWithdrawalStatus(button.dataset.payoutApprove, "approved", { userId: readSession()?.username || "admin" }, seedData); renderDashboard(); }));
  node.querySelectorAll("[data-payout-paid]").forEach((button) => button.addEventListener("click", () => { window.ANIMA_DB.updateWithdrawalStatus(button.dataset.payoutPaid, "paid", { userId: readSession()?.username || "admin" }, seedData); renderDashboard(); }));
  node.querySelectorAll("[data-payout-reject]").forEach((button) => button.addEventListener("click", () => { window.ANIMA_DB.updateWithdrawalStatus(button.dataset.payoutReject, "rejected", { userId: readSession()?.username || "admin" }, seedData); renderDashboard(); }));
}

function renderAdminPayments() {
  const node = document.querySelector("[data-admin-payments]");
  if (!node || !window.ANIMA_DB) return;
  const state = window.ANIMA_DB.getState(seedData);
  const items = state.tables.payments || [];
  node.innerHTML = items.map((payment) => `
    <article class="entry-row order-row">
      <div><h3>${formatMoneyVnd(payment.amount)} · ${escapeHtml(payment.method || "manual")}</h3><p>Сбор ANIMA: ${formatMoneyVnd(payment.commission_amount)} · чистая прибыль: ${formatMoneyVnd(payment.partner_amount)} · бронь ${escapeHtml(payment.booking_id)}</p></div>
      <span class="entry-status">${escapeHtml(paymentStatusLabel(payment.status))}</span>
      <span>${formatDate(payment.createdAt)}</span>
      <div class="entry-actions"><button type="button" data-payment-paid="${escapeAttribute(payment.booking_id)}">Отметить оплату</button></div>
    </article>
  `).join("") || `<div class="empty-table">Платежей пока нет.</div>`;
  node.querySelectorAll("[data-payment-paid]").forEach((button) => button.addEventListener("click", () => { window.ANIMA_DB.recordPayment(button.dataset.paymentPaid, { actorUserId: readSession()?.username || "admin", status: "paid", method: "manual" }, seedData); renderDashboard(); }));
}

function renderAdminCommissions() {
  const node = document.querySelector("[data-admin-commissions]");
  if (!node || !window.ANIMA_DB) return;
  const state = window.ANIMA_DB.getState(seedData);
  const rules = state.tables.commissionRules || [];
  node.innerHTML = rules.map((rule) => `
    <article class="entry-row">
      <div><h3>${escapeHtml(rule.title || "Правило комиссии")}</h3><p>${escapeHtml(rule.scope)} · ${escapeHtml(rule.type)} · ${Number(rule.percent || 0)}% + ${formatMoneyVnd(rule.fixed_amount || 0)}</p></div>
      <span class="entry-status">${escapeHtml(rule.status || "active")}</span>
      <span>${formatDate(rule.updatedAt || rule.createdAt)}</span>
      <div class="entry-actions"><button type="button" data-edit-commission="${escapeAttribute(rule.id)}">Изменить</button></div>
    </article>
  `).join("") || `<div class="empty-table">Правил комиссии пока нет.</div>`;
  node.querySelectorAll("[data-edit-commission]").forEach((button) => button.addEventListener("click", () => openCommissionModal(button.dataset.editCommission)));
}

function openCommissionModal(ruleId = "") {
  const state = window.ANIMA_DB.getState(seedData);
  const partners = window.ANIMA_DB.listPartners(seedData);
  const properties = state.tables.partnerProperties || [];
  const rooms = state.tables.partnerUnits || [];
  const rule = state.tables.commissionRules.find((item) => item.id === ruleId) || {};
  const body = `
    <form class="profile-edit-form admin-partner-form" data-commission-form>
      <label><span>Название</span><input name="title" value="${escapeAttribute(rule.title || "")}" placeholder="Комиссия отеля A" required /></label>
      <label><span>Уровень</span><select name="scope"><option value="global">глобальная</option><option value="partner">отель</option><option value="property">объект</option><option value="room">комната</option><option value="booking">заявка</option></select></label>
      <label><span>Партнёр</span><select name="partner_id"><option value="">любой</option>${partners.map((p) => `<option value="${escapeAttribute(p.id)}" ${rule.partner_id === p.id ? "selected" : ""}>${escapeHtml(p.business_name)}</option>`).join("")}</select></label>
      <label><span>Объект</span><select name="property_id"><option value="">любой</option>${properties.map((p) => `<option value="${escapeAttribute(p.id)}" ${rule.property_id === p.id ? "selected" : ""}>${escapeHtml(p.title)}</option>`).join("")}</select></label>
      <label><span>Комната</span><select name="unit_id"><option value="">любая</option>${rooms.map((r) => `<option value="${escapeAttribute(r.id)}" ${rule.unit_id === r.id ? "selected" : ""}>${escapeHtml(r.name)}</option>`).join("")}</select></label>
      <label><span>Тип</span><select name="type"><option value="percent">процент</option><option value="fixed">фиксированная сумма</option><option value="percent_fixed">процент + фикс</option></select></label>
      <label><span>Процент</span><input name="percent" inputmode="numeric" value="${escapeAttribute(rule.percent ?? 5)}" /></label>
      <label><span>Фиксированная сумма</span><input name="fixed_amount" inputmode="numeric" value="${escapeAttribute(rule.fixed_amount || 0)}" /></label>
      <label><span>Дата с</span><input name="date_from" type="date" value="${escapeAttribute(rule.date_from || "")}" /></label>
      <label><span>Дата по</span><input name="date_to" type="date" value="${escapeAttribute(rule.date_to || "")}" /></label>
      <label><span>Приоритет</span><input name="priority" inputmode="numeric" value="${escapeAttribute(rule.priority || 10)}" /></label>
      <div class="form-actions full"><button type="submit">Сохранить правило</button></div>
    </form>
  `;
  const modal = createAdminModal("Правило комиссии", body);
  modal.querySelector("[data-commission-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    window.ANIMA_DB.setCommissionRule({ id: ruleId || undefined, actorUserId: readSession()?.username || "admin", ...Object.fromEntries(new FormData(event.currentTarget).entries()) }, seedData);
    modal.remove();
    renderDashboard();
  });
}

function renderAdminChats() {
  const node = document.querySelector("[data-admin-chats]");
  if (!node || !window.ANIMA_DB) return;
  const state = window.ANIMA_DB.getState(seedData);
  const chats = state.tables.chats || [];
  const messages = state.tables.messages || [];
  const classify = (chat) => messages.some((message) => message.chat_id === chat.id) ? "real" : "auto";
  const renderGroup = (title, items, emptyText) => `
    <section class="dashboard-panel">
      <div class="section-heading compact"><h2>${title}</h2></div>
      <div class="entry-list">
        ${items.map((chat) => `
          <article class="entry-row order-row">
            <div><h3>${escapeHtml(chat.title)}</h3><p>${escapeHtml(chat.type === "partner_admin" ? "Партнёр ↔ ANIMA" : "Клиент ↔ объект")} · ${escapeHtml(chat.lastMessage || "Системный чат без ручных сообщений")}</p></div>
            <span class="entry-status">${classify(chat) === "real" ? "Реальный чат" : "Автоматический чат"}</span>
            <span>${formatDate(chat.updatedAt || chat.createdAt)}</span>
            <div class="entry-actions"><button type="button" data-open-admin-chat="${escapeAttribute(chat.id)}">Открыть</button></div>
          </article>
        `).join("") || `<div class="empty-table">${emptyText}</div>`}
      </div>
    </section>
  `;
  node.innerHTML = [
    renderGroup("Реальные чаты", chats.filter((chat) => classify(chat) === "real"), "Пока нет ручных сообщений."),
    renderGroup("Автоматические чаты", chats.filter((chat) => classify(chat) === "auto"), "Пока нет автоматических чатов."),
  ].join("");
  node.querySelectorAll("[data-open-admin-chat]").forEach((button) => button.addEventListener("click", () => openAdminChatModal(button.dataset.openAdminChat)));
}

function openPropertyPaymentAdminModal(propertyId) {
  const state = window.ANIMA_DB.getState(seedData);
  const property = state.tables.partnerProperties.find((item) => item.id === propertyId);
  if (!property) return;
  const settings = property.payment_settings || {};
  const modal = createAdminModal("Способ оплаты объекта", `
    <form class="profile-edit-form admin-partner-form" data-property-payment-form>
      <label><span>Объект</span><input value="${escapeAttribute(property.title)}" disabled /></label>
      <label><span>Способ оплаты</span>
        <select name="method">
          <option value="cash_at_hotel" ${settings.method === "cash_at_hotel" ? "selected" : ""}>Оплата наличными в отеле</option>
          <option value="anima_online" ${settings.method === "anima_online" ? "selected" : ""}>Оплата сразу через ANIMA</option>
        </select>
      </label>
      <label><span>Наличные</span>
        <select name="cash_allowed">
          <option value="true" ${settings.cash_allowed !== false ? "selected" : ""}>Разрешить наличные</option>
          <option value="false" ${settings.cash_allowed === false ? "selected" : ""}>Запретить наличные</option>
        </select>
      </label>
      <label><span>Принудительный режим</span>
        <select name="force_anima_online">
          <option value="false" ${!settings.force_anima_online ? "selected" : ""}>Не принуждать</option>
          <option value="true" ${settings.force_anima_online ? "selected" : ""}>Только через ANIMA</option>
        </select>
      </label>
      <label><span>Payout provider</span>
        <select name="payout_provider">
          ${["manual", "stripe_connect", "paypal_payouts", "bank_transfer", "momo", "vnpay"].map((item) => `<option value="${item}" ${settings.payout_provider === item ? "selected" : ""}>${item}</option>`).join("")}
        </select>
      </label>
      <div class="form-actions full"><button type="submit">Сохранить</button></div>
    </form>
  `);
  modal.querySelector("[data-property-payment-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    window.ANIMA_DB.updatePropertyPaymentSettings(propertyId, {
      actorUserId: readSession()?.username || "admin",
      method: data.method,
      cash_allowed: data.cash_allowed === "true",
      force_anima_online: data.force_anima_online === "true",
      payout_provider: data.payout_provider,
    }, seedData);
    modal.remove();
    renderDashboard();
  });
}

function renderAdminBroadcasts() {
  const node = document.querySelector("[data-admin-broadcasts]");
  if (!node || !window.ANIMA_DB) return;
  const state = window.ANIMA_DB.getState(seedData);
  const items = state.tables.adminMessages || [];
  node.innerHTML = items.map((item) => `
    <article class="entry-row">
      <div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)} · ${escapeHtml(item.target)} · ${escapeHtml(item.priority)}</p></div>
      <span class="entry-status">${escapeHtml(item.status)}</span>
      <span>${formatDate(item.sent_at || item.scheduled_at || item.createdAt)}</span>
      <div class="entry-actions"><button type="button" disabled>${escapeHtml(item.type)}</button></div>
    </article>
  `).join("") || `<div class="empty-table">Сообщений пока нет.</div>`;
}

function renderAdminSupportTickets() {
  const node = document.querySelector("[data-admin-support-tickets]");
  if (!node || !window.ANIMA_DB) return;
  const state = window.ANIMA_DB.getState(seedData);
  const partners = state.tables.partners || [];
  const tickets = [...(state.tables.supportTickets || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  node.innerHTML = tickets.map((ticket) => {
    const partner = partners.find((item) => item.id === ticket.partner_id) || {};
    return `
      <article class="entry-row">
        <div>
          <h3>${escapeHtml(ticket.title)}</h3>
          <p>${escapeHtml(partner.business_name || "Партнёр не найден")} · ${escapeHtml(supportTopicLabel(ticket.topic))} · ${escapeHtml(ticket.message)}</p>
        </div>
        <span class="entry-status">${escapeHtml(supportStatusLabel(ticket.status))}</span>
        <span>${formatDate(ticket.createdAt)}</span>
        <div class="entry-actions">
          <button type="button" data-support-status="${escapeAttribute(ticket.id)}" data-status="in_progress">В работу</button>
          <button type="button" data-support-status="${escapeAttribute(ticket.id)}" data-status="closed">Закрыть</button>
        </div>
      </article>
    `;
  }).join("") || `<div class="empty-table">Тикетов поддержки пока нет.</div>`;
  node.querySelectorAll("[data-support-status]").forEach((button) => {
    button.addEventListener("click", () => {
      window.ANIMA_DB.updateSupportTicketStatus(button.dataset.supportStatus, {
        status: button.dataset.status,
        actorUserId: readSession()?.username || "admin",
      }, seedData);
      renderDashboard();
    });
  });
}

function openBroadcastModal() {
  const state = window.ANIMA_DB.getState(seedData);
  const partners = window.ANIMA_DB.listPartners(seedData);
  const users = state.tables.users.filter((user) => user.role === "client");
  const properties = state.tables.partnerProperties || [];
  const modal = createAdminModal("Сообщение пользователям", `
    <form class="profile-edit-form admin-partner-form" data-broadcast-form>
      <label><span>Кому</span>
        <select name="target">
          <option value="all_users">Всем пользователям</option>
          <option value="all_clients">Всем клиентам</option>
          <option value="all_partners">Всем партнёрам</option>
          <option value="client">Конкретному клиенту</option>
          <option value="partner">Конкретному партнёру</option>
          <option value="hotel_users">Пользователям конкретного отеля</option>
          <option value="active_booking_users">С активной бронью</option>
          <option value="cancelled_booking_users">С отменённой бронью</option>
        </select>
      </label>
      <label><span>Клиент</span><select name="userId"><option value="">не выбран</option>${users.map((user) => `<option value="${escapeAttribute(user.id)}">${escapeHtml(user.fullName || user.name || user.email)}</option>`).join("")}</select></label>
      <label><span>Партнёр</span><select name="partnerId"><option value="">не выбран</option>${partners.map((partner) => `<option value="${escapeAttribute(partner.id)}">${escapeHtml(partner.business_name)}</option>`).join("")}</select></label>
      <label><span>Отель</span><select name="propertyId"><option value="">не выбран</option>${properties.map((property) => `<option value="${escapeAttribute(property.id)}">${escapeHtml(property.title)}</option>`).join("")}</select></label>
      <label><span>Заголовок</span><input name="title" required placeholder="Ваша бронь подтверждена" /></label>
      <label class="full"><span>Текст</span><input name="text" required placeholder="Отель подтвердил вашу заявку." /></label>
      <label><span>Тип</span><select name="type"><option value="admin-message">Админ-сообщение</option><option value="booking">Бронь</option><option value="payment">Оплата</option><option value="warning">Предупреждение</option><option value="system">Системное</option></select></label>
      <label><span>Приоритет</span><select name="priority"><option value="normal">Обычный</option><option value="high">Высокий</option><option value="urgent">Срочный</option></select></label>
      <label><span>CTA текст</span><input name="ctaLabel" placeholder="Открыть бронь" /></label>
      <label><span>CTA ссылка</span><input name="ctaUrl" placeholder="/booking/123" /></label>
      <label><span>Отложить до</span><input name="scheduled_at" type="datetime-local" /></label>
      <div class="form-actions full"><button type="submit">Отправить</button></div>
    </form>
  `);
  modal.querySelector("[data-broadcast-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    window.ANIMA_DB.sendAdminMessage({
      ...data,
      actorUserId: readSession()?.username || "admin",
      ctas: data.ctaLabel && data.ctaUrl ? [{ label: data.ctaLabel, url: data.ctaUrl }] : [],
    }, seedData);
    modal.remove();
    renderDashboard();
  });
}

function paymentMethodLabel(method = "anima_online") {
  return method === "cash_at_hotel" ? "Наличные в отеле" : "Через ANIMA";
}

function openAdminChatModal(chatId) {
  const state = window.ANIMA_DB.getState(seedData);
  const chat = state.tables.chats.find((item) => item.id === chatId);
  const messages = state.tables.messages.filter((item) => item.chat_id === chatId);
  if (!chat) return;
  const modal = createAdminModal(chat.title, `
    <div class="ops-list">${messages.map((message) => `<div><strong>${escapeHtml(message.sender_role)}</strong><span>${escapeHtml(message.text)} · ${formatDate(message.createdAt)}</span></div>`).join("") || "<div><strong>Нет сообщений</strong><span>Можно написать первым</span></div>"}</div>
    <form class="profile-edit-form admin-message-form" data-admin-chat-form>
      <label><span>Сообщение</span><input name="text" required /></label>
      <div class="form-actions"><button type="submit">Отправить от ANIMA</button></div>
    </form>
  `);
  modal.querySelector("[data-admin-chat-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = String(new FormData(event.currentTarget).get("text") || "").trim();
    if (!text) return;
    window.ANIMA_DB.addMessage({ chatId, senderId: readSession()?.username || "admin", senderRole: "admin", text }, seedData);
    modal.remove();
    renderDashboard();
  });
}

function adminBookingStatusLabel(status = "") {
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
  }[status] || status || "не указан";
}

function moderationEntityLabel(value = "") {
  return {
    property: "Объект",
    room_type: "Тип номера",
    property_photo: "Фото объекта",
    room_type_photo: "Фото номера",
    price: "Цена",
    availability: "Доступность",
  }[value] || value || "Сущность";
}

function moderationChangeLabel(value = "") {
  return {
    create: "Создание",
    update: "Изменение",
    archive: "Архивирование",
  }[value] || value || "Изменение";
}

function moderationStatusLabel(value = "") {
  return {
    draft: "Черновик",
    pending_review: "На модерации",
    approved: "Одобрено",
    rejected: "Отклонено",
    archived: "Архив",
  }[value] || value || "не указан";
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

function supportStatusLabel(value = "") {
  return { new: "Новый", in_progress: "В работе", closed: "Закрыт" }[value] || value || "не указан";
}

function adminGuestDetailsText(booking = {}) {
  const guests = Array.isArray(booking.guests_details) ? booking.guests_details : booking.wishes?.guests_details || [];
  if (!guests.length) return `${booking.guests_count || 1} гостей`;
  return guests.map((guest, index) => {
    const parts = [guest.fullName, guest.birthDate, guest.passportNumber, guest.citizenship].filter(Boolean);
    return `${index + 1}. ${parts.join(" · ") || "данные не указаны"}`;
  }).join("; ");
}

function paymentStatusLabel(status = "") {
  return { unpaid: "Не оплачено", waiting_payment: "Ожидает оплаты", paid: "Оплачено", partially_paid: "Частично оплачено", refunded: "Возвращено", partial_refund: "Частичный возврат", failed: "Ошибка", dispute: "Спор" }[status] || status || "не указан";
}

function payoutStatusLabel(status = "") {
  return { not_due: "Не к выплате", pending_payout: "Ожидает выплату", paid_to_partner: "Выплачено", held: "Удержано", disputed: "Спор" }[status] || status || "не указан";
}

function withdrawalStatusLabel(status = "") {
  return { pending: "Ожидает одобрения", approved: "Одобрено", rejected: "Отклонено", paid: "Выплачено" }[status] || status || "не указан";
}

function orderStatusLabel(status = "new") {
  const labels = {
    new: "Новая",
    review: "В работе",
    approved: "Одобрено",
    payment_requested: "Ждём 5%",
    paid: "Оплачено",
    cancelled: "Отменено",
  };
  return labels[status] || status;
}

function updateOrderStatus(orderId, status) {
  if (!window.ANIMA_DB) return null;
  const nextOrder = window.ANIMA_DB.updateOrder(orderId, { status }, seedData);
  if (nextOrder.userId) {
    const notificationMap = {
      review: {
        title: "Заявка в работе",
        message: "Мы передали ваш запрос партнёру и уже уточняем подтверждение по бронированию.",
      },
      approved: {
        title: "Бронирование одобрено",
        message: "Ваше бронирование одобрено со стороны отеля. Следующий шаг уже подготовлен внутри приложения.",
      },
      payment_requested: {
        title: "Подтвердите бронь",
        message: "Ваше бронирование одобрено со стороны отеля. Для подтверждения оплаты внесите 5% от общей стоимости брони.",
        actionType: "pay-deposit",
      },
      paid: {
        title: "Бронь подтверждена",
        message: "Оплата получена. Бронь подтверждена, детали сохранены в вашем заказе внутри приложения.",
      },
      cancelled: {
        title: "Бронирование обновлено",
        message: "Статус вашего бронирования был обновлён. Откройте уведомление в приложении, чтобы увидеть детали.",
      },
    };
    const meta = notificationMap[status];
    if (meta) {
      window.ANIMA_DB.addNotification({
        userId: nextOrder.userId,
        orderId: nextOrder.id,
        type: `order-${status}`,
        senderName: "Администрация ANIMA",
        senderType: "admin",
        replyAllowed: false,
        title: meta.title,
        message: meta.message,
        actionType: meta.actionType || "",
      }, seedData);
    }
  }
  renderOrders();
  renderMetrics();
  renderOperations();
  return nextOrder;
}

function promoteEntry(entryId) {
  const entry = entries.find((item) => item.id === entryId);
  if (!entry || !window.ANIMA_DB) return;
  const nextFields = {
    ...(entry.fields || {}),
    promotedAt: new Date().toISOString(),
    promoted: "true",
  };
  const saved = window.ANIMA_DB.saveEntry({
    ...entry,
    fields: nextFields,
    updatedAt: new Date().toISOString(),
  }, seedData);
  entries = entries.map((item) => item.id === entryId ? saved : item);
  writeEntries();
  renderDashboard();
}

function openOrderDetails(order) {
  const details = [
    ["Тип заявки", order.type || order.source || "не указано"],
    ["Клиент", order.client || order.fullName || order.guestName || "не указано"],
    ["Телефон", order.phone || "не указано"],
    ["Почта", order.email || "не указано"],
    ["Объект / услуга", order.stayTitle || order.title || "не указано"],
    ["Заезд", order.checkin || "не указано"],
    ["Выезд", order.checkout || "не указано"],
    ["Гостей", order.guests || "не указано"],
    ["ФИО", order.fullName || order.guestName || "не указано"],
    ["Дата рождения", order.birthDate || "не указано"],
    ["Паспорт", order.passportNumber || order.passport || "не указано"],
    ["Сумма", order.totalLabel || "без суммы"],
    ["Статус", orderStatusLabel(order.status || "new")],
    ["Создано", formatDate(order.createdAt)],
    ["Комментарий", order.note || "без комментария"],
  ];
  const body = `
    <div class="order-detail-grid">
      ${details.map(([label, value]) => `
        <div class="order-detail-item">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(String(value || ""))}</strong>
        </div>
      `).join("")}
    </div>
    <div class="form-actions admin-order-actions">
      <button class="secondary" type="button" data-order-status="review" data-order-id="${escapeAttribute(order.id)}">В работу</button>
      <button class="secondary" type="button" data-order-status="approved" data-order-id="${escapeAttribute(order.id)}">Одобрить</button>
      <button type="button" data-order-status="payment_requested" data-order-id="${escapeAttribute(order.id)}">Запросить 5%</button>
      <button class="secondary" type="button" data-order-status="paid" data-order-id="${escapeAttribute(order.id)}">Оплачено</button>
      <button class="secondary danger" type="button" data-order-status="cancelled" data-order-id="${escapeAttribute(order.id)}">Отменить</button>
    </div>
    <form class="profile-edit-form admin-message-form" data-admin-message-form>
      <label>
        <span>Сообщение пользователю</span>
        <input name="title" value="Сообщение от администрации ANIMA" />
      </label>
      <label>
        <span>Текст сообщения</span>
        <input name="message" value="" placeholder="Например: мы уточнили условия по бронированию" />
      </label>
      <div class="form-actions">
        <button type="submit">Отправить сообщение</button>
      </div>
    </form>
  `;
  const modal = createAdminModal("Детали заявки", body);
  modal.querySelectorAll("[data-order-status]").forEach((button) => {
    button.addEventListener("click", () => {
      updateOrderStatus(button.dataset.orderId, button.dataset.orderStatus);
      modal.remove();
      const refreshed = window.ANIMA_DB.getState(seedData).tables.orders.find((item) => item.id === button.dataset.orderId);
      if (refreshed) openOrderDetails(refreshed);
    });
  });
  modal.querySelector("[data-admin-message-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") || "").trim();
    const message = String(formData.get("message") || "").trim();
    if (!order.userId || !message) return;
    window.ANIMA_DB.addNotification({
      userId: order.userId,
      orderId: order.id,
      type: "admin-message",
      senderName: "Администрация ANIMA",
      senderType: "admin",
      replyAllowed: true,
      title: title || "Сообщение от администрации ANIMA",
      message,
    }, seedData);
    modal.remove();
    openOrderDetails(window.ANIMA_DB.getState(seedData).tables.orders.find((item) => item.id === order.id) || order);
  });
}

function shareAnalytics(state = window.ANIMA_DB?.getState(seedData)) {
  const sourceState = state || { tables: { contentEntries: [], orders: [] } };
  const stayEntries = sourceState.tables.contentEntries.filter((entry) => entry.module === "stay" && entry.status === "published");
  const staysWithShare = stayEntries.filter((entry) => Number(entry.fields?.animaSharePercent) > 0);
  const perNightValues = staysWithShare.map((entry) => {
    const priceVnd = Number(entry.fields?.priceMap?.VND || 0);
    const sharePercent = Number(entry.fields?.animaSharePercent || 0);
    return Math.round(priceVnd * sharePercent / 100);
  }).filter(Boolean);
  const avgPerNight = perNightValues.length ? Math.round(perNightValues.reduce((sum, value) => sum + value, 0) / perNightValues.length) : 0;
  const shareByStay = Object.fromEntries(staysWithShare.map((entry) => [String(entry.fields?.title || entry.title || "").trim(), Number(entry.fields?.animaSharePercent || 0)]));
  const ordersShare = sourceState.tables.orders.reduce((sum, order) => {
    const total = Number(order.totalVnd || 0);
    const key = String(order.stayTitle || "").trim();
    const percent = shareByStay[key] || 0;
    return sum + Math.round(total * percent / 100);
  }, 0);
  return {
    staysWithShare: staysWithShare.length,
    perNightLabel: avgPerNight ? formatMoneyVnd(avgPerNight) : "не задано",
    ordersShareLabel: ordersShare ? formatMoneyVnd(ordersShare) : "пока 0",
  };
}

function formatMoneyVnd(value) {
  const amount = convertAdminMoney(Number(value || 0), adminCurrency);
  if (adminCurrency === "USD") return `$${Math.round(amount).toLocaleString("en-US")}`;
  return `${Math.round(amount).toLocaleString("ru-RU")} ${adminCurrency}`;
}

function convertAdminMoney(value, currency) {
  const rates = window.ANIMA_DB?.getState(seedData)?.settings?.currencyRates || {};
  if (currency === "VND") return value;
  return value / Number(rates[currency] || 1);
}

function renderEditor() {
  const workflow = currentWorkflow();
  const entry = entries.find((item) => item.id === editingId);
  const sourceFields = formDraft || entry?.fields || {};
  const fields = workflow.id === "card" ? cardFields({ fields: sourceFields }) : workflow.fields;
  document.querySelector("[data-workflow-title]").textContent = workflow.title;
  document.querySelector("[data-editor-kicker]").textContent = editingId ? "Редактирование" : workflow.hint;
  document.querySelector("[data-editor-title]").textContent = editingId ? "Изменить запись" : editorTitle(workflow.id);
  document.querySelector("[data-table-title]").textContent = `${workflow.title}: сохранённые записи`;
  document.querySelector("[data-content-form]").innerHTML = `
    ${editorGuide(workflow.id, sourceFields)}
    ${fields.map((item) => fieldMarkup(item, sourceFields[item.name])).join("")}
    <div class="form-actions">
      <button type="submit">${editingId ? "Сохранить изменения" : "Опубликовать"}</button>
      <button class="secondary" type="button" data-save-draft>Сохранить черновик</button>
    </div>
  `;
  formDraft = null;
  document.querySelector("[data-save-draft]")?.addEventListener("click", () => {
    const status = document.querySelector('[name="status"]');
    if (status) status.value = "draft";
    document.querySelector("[data-content-form]").requestSubmit();
  });
  updatePreview();
}

function cardFields(entry) {
  const sectionValue = entry?.fields?.section || document.querySelector('[name="section"]')?.value || "stay";
  const section = cardSections.find((item) => item.value === sectionValue) || cardSections[0];
  if (section.value === "stay") return stayCardFields(section);
  return workflows.find((item) => item.id === "card").fields.map((item) => {
    if (item.name === "category") return { ...item, options: section.categories };
    return item;
  });
}

function stayCardFields(section) {
  return [
    sectionTitle("Основное"),
    field("section", "Раздел приложения", "select", cardSections.map((item) => item.value), false, "stay"),
    field("category", "Тип жилья", "select", section.categories),
    field("title", "Название объекта", "text", "Отель у озера Tuyen Lam", true),
    field("type", "Подтип", "text", "Отель у озера"),
    field("location", "Район / локация", "text", "район озера Tuyen Lam"),
    field("distance", "Расстояние от центра", "text", "7 км от центра"),
    field("address", "Адрес", "text", "Hoa Phuong Tim, Tuyen Lam Lake", true),
    field("mapsUrl", "Ссылка на Google Maps", "text", "https://maps.google.com/?q=..."),
    field("description", "Описание", "textarea", "Короткое описание жилья и атмосферы.", true),

    sectionTitle("Детали проживания"),
    field("guests", "Сколько гостей", "number", ""),
    field("bedrooms", "Сколько спален", "number", ""),
    field("beds", "Сколько кроватей", "number", ""),
    field("baths", "Сколько ванных", "number", ""),
    field("size", "Площадь", "text", "36 м²"),
    field("hasKitchen", "Кухня", "select", ["false", "true"]),
    field("rating", "Оценка", "text", ""),
    field("reviews", "Отзывы", "text", ""),
    field("source", "Источник", "text", ""),

    sectionTitle("Цена и бронь"),
    moneyField("price", "Цена за ночь", "1,300,000"),
    field("priceType", "Подпись цены", "select", ["/ night", "/ month", ""]),
    moneyField("monthlyPrice", "Цена за месяц", ""),
    moneyField("cleaningFee", "Уборка", ""),
    moneyField("serviceFee", "Сервисный сбор", ""),
    moneyField("deposit", "Депозит", ""),
    field("nights", "Ночей в примере", "number", ""),
    field("animaSharePercent", "Наша доля, %", "number", "15"),
    field("paymentFlow", "Схема оплаты", "select", ["full-prepaid", "deposit-prepaid", "commission-only"]),

    sectionTitle("Фото, теги и удобства"),
    field("image", "Главное фото", "file", "Выбрать файл", true),
    field("gallery", "Дополнительные фото", "file-multiple", "Выбрать несколько фото", true),
    field("tags", "Теги через запятую", "text", "Отели, озеро Tuyen Lam, романтика", true),
    field("highlights", "Особенности через запятую", "textarea", "район озера Tuyen Lam, романтичная атмосфера, тихое жильё на природе", true),
    field("amenities", "Удобства через запятую", "textarea", "Wi-Fi, завтрак, парковка, ресторан", true),
    field("rules", "Правила через запятую", "textarea", "Заезд после 14:00, не курить, тихие часы 22:00-07:00", true),
    field("points", "Баллы ANIMA", "number", "120"),
    field("status", "Статус", "select", ["published", "draft"]),
  ];
}

function editorTitle(workflowId) {
  const titles = {
    news: "Добавить новость",
    card: "Добавить в основное",
    product: "Добавить товар",
  };
  return titles[workflowId] || "Добавить запись";
}

function editorGuide(workflowId, fields = {}) {
  const section = fields.section || "stay";
  const textByWorkflow = {
    news: "Заполните заголовок, короткий текст и место показа. После публикации новость попадёт в ленту.",
    product: "Заполните карточку товара: категорию, цену, наличие, состав и фото. После публикации товар появится в магазине.",
  };
  const cardText = section === "stay"
    ? "Для жилья заполните район, расстояние от центра, гостей, спальни, кровати, ванны, кухню и цену. Эти данные сразу попадут в карточку жилья."
    : "Для обычной карточки заполните раздел, категорию, описание, локацию, цену и фото. После публикации она появится в выбранном разделе.";
  return `<div class="form-guide">${workflowId === "card" ? cardText : textByWorkflow[workflowId] || "Заполните основные поля и опубликуйте запись."}</div>`;
}

function handleFormInput(event) {
  if (event.target.name === "section" && activeWorkflow === "card") {
    formDraft = normalizeFormFields(Object.fromEntries([...new FormData(event.currentTarget).entries()].map(([key, value]) => [key, String(value).trim()])));
    renderEditor();
    return;
  }
  updatePreview();
}

async function handleFormChange(event) {
  if (!event.target.matches("[data-file-input]")) return;
  const fieldName = event.target.dataset.fileInput;
  const hidden = event.currentTarget.querySelector(`[name="${fieldName}"]`);
  const status = event.target.closest(".file-picker")?.querySelector("[data-file-status]");
  const files = [...(event.target.files || [])];
  if (!files.length || !hidden) return;
  if (status) status.textContent = "Обрабатываю фото...";
  try {
    if (event.target.hasAttribute("multiple")) {
      const images = await Promise.all(files.map((file) => imageFileToDataUrl(file)));
      const existing = String(hidden.value || "")
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);
      hidden.value = [...existing, ...images].join("\n");
      if (status) status.textContent = `Загружено: ${existing.length + images.length}`;
    } else {
      hidden.value = await imageFileToDataUrl(files[0]);
      if (status) status.textContent = files[0].name;
    }
    updatePreview();
  } catch {
    if (status) status.textContent = "Не удалось загрузить фото";
  }
}

function updateCardCategoryOptions(sectionValue) {
  const category = document.querySelector('[name="category"]');
  const section = cardSections.find((item) => item.value === sectionValue) || cardSections[0];
  if (!category) return;
  const current = category.value;
  category.innerHTML = section.categories.map((option) => `<option value="${escapeAttribute(option)}">${escapeHtml(optionLabel("category", option))}</option>`).join("");
  category.value = section.categories.includes(current) ? current : section.categories[0];
}

function field(name, label, type, optionsOrPlaceholder, full = false, defaultValue = "", extra = {}) {
  const config = { name, label, type, full, defaultValue, ...extra };
  if (Array.isArray(optionsOrPlaceholder)) config.options = optionsOrPlaceholder;
  else config.placeholder = optionsOrPlaceholder || "";
  return config;
}

function moneyField(name, label, placeholder = "", full = false) {
  return field(name, label, "money", placeholder, full, "", {
    currencyName: `${name}Currency`,
    currencies: ["VND", "USD", "EUR", "RUB", "UAH"],
  });
}

function sectionTitle(title) {
  return { type: "section-title", title };
}

function fieldMarkup(item, savedValue = "") {
  if (item.type === "section-title") {
    return `<div class="form-section-title">${item.title}</div>`;
  }
  const value = savedValue || item.defaultValue || "";
  if (item.type === "select") {
    return `
      <label class="${item.full ? "full" : ""}">
        ${item.label}
        <select name="${item.name}">
          ${item.options.map((option) => `<option value="${escapeAttribute(option)}" ${String(value || item.options[0]) === option ? "selected" : ""}>${escapeHtml(optionLabel(item.name, option))}</option>`).join("")}
        </select>
      </label>
    `;
  }
  if (item.type === "money") {
    const parsed = parseMoneyValue(value);
    return `
      <label class="${item.full ? "full" : ""}">
        ${item.label}
        <div class="money-control">
          <input name="${item.name}" inputmode="decimal" type="text" value="${escapeAttribute(parsed.amount)}" placeholder="${escapeAttribute(item.placeholder)}" />
          <select name="${item.currencyName}">
            ${item.currencies.map((option) => `<option value="${escapeAttribute(option)}" ${parsed.currency === option ? "selected" : ""}>${escapeHtml(optionLabel(item.currencyName, option))}</option>`).join("")}
          </select>
        </div>
      </label>
    `;
  }
  if (item.type === "file") {
    const hasImage = Boolean(value);
    return `
      <label class="full file-field">
        ${item.label}
        <input name="${item.name}" type="hidden" value="${escapeAttribute(value)}" />
        <span class="file-picker">
          <input data-file-input="${item.name}" type="file" accept="image/*" />
          <b>Выбрать фото</b>
          <small data-file-status>${hasImage ? "Фото уже добавлено" : "Файл с компьютера"}</small>
        </span>
      </label>
    `;
  }
  if (item.type === "file-multiple") {
    const images = String(value || "")
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
    return `
      <label class="full file-field">
        ${item.label}
        <textarea name="${item.name}" hidden>${escapeTextarea(value)}</textarea>
        <span class="file-picker">
          <input data-file-input="${item.name}" type="file" accept="image/*" multiple />
          <b>Добавить фото</b>
          <small data-file-status>${images.length ? `Загружено: ${images.length}` : "Можно выбрать несколько файлов"}</small>
        </span>
      </label>
    `;
  }
  if (item.type === "textarea") {
    return `
      <label class="full">
        ${item.label}
        <textarea name="${item.name}" placeholder="${escapeAttribute(item.placeholder)}">${escapeTextarea(value)}</textarea>
      </label>
    `;
  }
  return `
    <label class="${item.full ? "full" : ""}">
      ${item.label}
      <input name="${item.name}" type="${item.type}" value="${escapeAttribute(value)}" placeholder="${escapeAttribute(item.placeholder)}" />
    </label>
  `;
}

function parseMoneyValue(value = "") {
  const text = String(value || "").trim();
  const match = text.match(/^(.*?)(?:\s+)?(VND|USD|EUR|RUB)$/i);
  if (!match) return { amount: text, currency: "VND" };
  return { amount: match[1].trim(), currency: match[2].toUpperCase() };
}

function optionLabel(name, value) {
  return optionLabels[name]?.[value] || value;
}

function saveEntry(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const fields = normalizeFormFields(Object.fromEntries([...new FormData(form).entries()].map(([key, value]) => [key, String(value).trim()])));
  const workflow = currentWorkflow();
  const now = new Date().toISOString();
  const module = workflow.id === "card" ? fields.section || "stay" : workflow.module;
  const previous = entries.find((entry) => entry.id === editingId);
  const entry = {
    id: editingId || createId(module),
    workflow: workflow.id,
    module,
    title: fields.title || "Без названия",
    status: fields.status || "published",
    fields: {
      views: previous?.fields?.views || "0",
      promotedAt: previous?.fields?.promotedAt || "",
      promoted: previous?.fields?.promoted || "false",
      ...fields,
    },
    createdAt: previous?.createdAt || now,
    updatedAt: now,
    author: readSession()?.username || "ADMIN",
  };
  const saved = window.ANIMA_DB?.saveEntry(entry, seedData) || entry;
  entries = editingId ? entries.map((item) => (item.id === editingId ? saved : item)) : [saved, ...entries];
  writeEntries();
  editingId = null;
  form.reset();
  renderDashboard();
}

function updatePreview() {
  const form = document.querySelector("[data-content-form]");
  const node = document.querySelector("[data-preview]");
  if (!form || !node) return;
  const fields = normalizeFormFields(Object.fromEntries([...new FormData(form).entries()].map(([key, value]) => [key, String(value).trim()])));
  const title = fields.title || "Новая запись";
  const label = optionLabel("category", fields.category) || fields.label || optionLabel("section", fields.section || "") || optionLabel("workflow", currentWorkflow().id);
  const text = fields.text || fields.description || "Описание появится здесь после заполнения формы.";
  const stayDetails = fields.section === "stay"
    ? [
      fields.guests ? `${fields.guests} гостей` : "",
      fields.bedrooms ? `${fields.bedrooms} спален` : "",
      fields.baths ? `${fields.baths} ванных` : "",
      fields.hasKitchen === "true" ? optionLabel("hasKitchen", fields.hasKitchen) : "",
    ]
    : [];
  const meta = [
    fields.location,
    fields.distance,
    fields.price,
    fields.meta,
    ...stayDetails,
    fields.points ? `${fields.points} баллов` : "",
    optionLabel("status", fields.status || "published"),
  ].filter(Boolean);
  const image = fields.image || "../assets/home-background.jpg";
  node.innerHTML = `
    <article class="preview-card" style="--preview-image: url('${escapeStyleUrl(image)}')">
      <div class="preview-image"></div>
      <div class="preview-body">
        <p>${escapeHtml(label)}</p>
        <h3>${escapeHtml(title)}</h3>
        <span>${escapeHtml(text)}</span>
        <div class="preview-meta">${meta.map((item) => `<small>${escapeHtml(item)}</small>`).join("")}</div>
      </div>
    </article>
  `;
}

function normalizeFormFields(fields) {
  ["price", "monthlyPrice", "cleaningFee", "serviceFee", "deposit"].forEach((name) => {
    if (!Object.prototype.hasOwnProperty.call(fields, name)) return;
    const amount = String(fields[name] || "").trim();
    const currency = fields[`${name}Currency`] || "VND";
    fields[name] = amount ? `${amount} ${currency}` : "";
  });
  return fields;
}

function renderEntries() {
  const node = document.querySelector("[data-entries]");
  const items = entries.filter((entry) => workflowMatchesEntry(activeWorkflow, entry));
  if (!items.length) {
    node.innerHTML = `<div class="empty-table">Пока нет записей. Выберите тип выше и заполните форму.</div>`;
    return;
  }
  node.innerHTML = items.map((entry) => `
    <article class="entry-row">
      <div>
        <h3>${escapeHtml(entry.title)}</h3>
        <p>${escapeHtml(entrySubtitle(entry))}</p>
        <p class="entry-stats-line">
          <span>Просмотры: ${Number(entry.fields?.views || 0)}</span>
          ${entry.fields?.promotedAt ? '<span class="entry-priority-badge">Продвигается</span>' : ""}
        </p>
      </div>
      <span class="entry-status ${entry.status}">${optionLabel("status", entry.status)}</span>
      <span>${formatDate(entry.updatedAt)}</span>
      <div class="entry-actions">
        <button type="button" data-promote="${entry.id}">Продвинуть</button>
        <button type="button" data-edit="${entry.id}">Изменить</button>
        <button type="button" data-delete="${entry.id}">Удалить</button>
      </div>
    </article>
  `).join("");
  node.querySelectorAll("[data-promote]").forEach((button) => {
    button.addEventListener("click", () => promoteEntry(button.dataset.promote));
  });
  node.querySelectorAll("[data-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      editingId = button.dataset.edit;
      const entry = entries.find((item) => item.id === editingId);
      activeWorkflow = workflowFromModule(entry?.module, entry?.workflow);
      renderDashboard();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
  node.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      if (window.ANIMA_DB) window.ANIMA_DB.deleteEntry(button.dataset.delete, seedData);
      entries = entries.filter((entry) => entry.id !== button.dataset.delete);
      writeEntries();
      renderDashboard();
    });
  });
}

function entrySubtitle(entry) {
  if (entry.workflow === "card" || workflowFromModule(entry.module) === "card") {
    return `${optionLabel("section", entry.module)} · ${optionLabel("category", entry.fields.category) || "Без категории"}`;
  }
  return optionLabel("category", entry.fields.category) || entry.fields.label || entry.fields.placement || currentWorkflow().title;
}

function workflowMatchesEntry(workflowId, entry) {
  return workflowFromModule(entry.module, entry.workflow) === workflowId;
}

function workflowFromModule(module, storedWorkflow = "") {
  if (storedWorkflow && workflows.some((workflow) => workflow.id === storedWorkflow)) return storedWorkflow;
  if (module === "feed") return "news";
  if (module === "store") return "product";
  return "card";
}

function currentWorkflow() {
  return workflows.find((workflow) => workflow.id === activeWorkflow) || workflows[0];
}

function clearForm() {
  editingId = null;
  renderEditor();
}

function clearDrafts() {
  entries.filter((entry) => entry.status === "draft").forEach((entry) => {
    if (window.ANIMA_DB) window.ANIMA_DB.deleteEntry(entry.id, seedData);
  });
  entries = readEntries().filter((entry) => entry.status !== "draft");
  writeEntries();
  renderDashboard();
}

function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(PENDING_USER_KEY);
  location.assign("./");
}

function downloadJson() {
  const blob = new Blob([JSON.stringify(exportPayload(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `anima-admin-content-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

async function copyJson() {
  await navigator.clipboard.writeText(JSON.stringify(exportPayload(), null, 2));
}

function openAdminSettings() {
  const session = readSession();
  if (!session) return;
  const overrides = readAdminSettings();
  const originalLogin = session.originalUsername || session.username;
  const current = overrides[originalLogin] || {};
  const modal = createAdminModal("Настройки админки", `
    <form class="admin-settings-form" data-admin-settings-form>
      <label>
        Логин
        <input name="login" value="${escapeAttribute(current.login || session.username)}" required />
      </label>
      <label>
        Новый пароль
        <input name="password" type="password" placeholder="Оставьте пустым, если не меняете" />
      </label>
      <div class="form-actions">
        <button class="secondary" type="button" data-close-admin-modal>Отмена</button>
        <button type="submit">Сохранить</button>
      </div>
    </form>
  `);
  modal.querySelector("[data-admin-settings-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const login = String(formData.get("login") || "").trim();
    const password = String(formData.get("password") || "");
    const nextSettings = readAdminSettings();
    nextSettings[originalLogin] = {
      ...(nextSettings[originalLogin] || {}),
      login: login || originalLogin,
    };
    if (password) nextSettings[originalLogin].hash = await sha256(password);
    writeAdminSettings(nextSettings);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      ...session,
      username: login || originalLogin,
    }));
    document.querySelector("[data-session-user]").textContent = login || originalLogin;
    modal.remove();
  });
}

function createAdminModal(title, body) {
  document.querySelector(".admin-modal")?.remove();
  const modal = document.createElement("div");
  modal.className = "admin-modal";
  modal.innerHTML = `
    <div class="admin-modal-backdrop" data-close-admin-modal></div>
    <section class="admin-modal-panel">
      <div class="panel-heading">
        <div><p>Настройки</p><h2>${title}</h2></div>
        <button type="button" data-close-admin-modal>Закрыть</button>
      </div>
      ${body}
    </section>
  `;
  document.body.appendChild(modal);
  modal.querySelectorAll("[data-close-admin-modal]").forEach((button) => {
    button.addEventListener("click", () => modal.remove());
  });
  return modal;
}

function exportPayload() {
  const state = window.ANIMA_DB?.getState(seedData);
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    entries,
    db: state || null,
  };
}

function readEntries() {
  if (window.ANIMA_DB) {
    return window.ANIMA_DB.listEntries(seedData);
  }
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeEntries() {
  if (window.ANIMA_DB) {
    entries = window.ANIMA_DB.listEntries(seedData);
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function readSession() {
  try {
    const session = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
    if (!session || session.expiresAt < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function createId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function imageFileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const image = new Image();
      image.onerror = reject;
      image.onload = () => {
        const maxSize = 1400;
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value = "") {
  return escapeHtml(value);
}

function escapeTextarea(value = "") {
  return escapeHtml(value);
}

function escapeStyleUrl(value = "") {
  return String(value).replaceAll("'", "%27").replaceAll(")", "%29");
}
