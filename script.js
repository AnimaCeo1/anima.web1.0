const ADMIN_CONTENT_STORAGE_KEY = "anima.admin.entries.v1";
const launchScreen = document.querySelector("[data-launch-screen]");
const baseData = cloneData(window.ANIMA_DATA || {});
const data = cloneData(baseData);
const authEntry = document.querySelector(".auth-entry");
const phoneShell = document.querySelector(".phone-shell");
const hero = document.querySelector(".hero");
const homeContent = document.querySelector(".content");
const screenView = document.querySelector(".screen-view");
const animaHub = document.querySelector("#anima-hub");
const centerAction = document.querySelector(".center-action");
const filterButton = document.querySelector(".filter-button");
const homeSearchForm = document.querySelector(".search-card");
const searchInput = document.querySelector("#search-input");
const searchSuggestions = document.querySelector("[data-search-suggestions]");
const languagePill = document.querySelector(".language-pill");
const languageMenu = document.querySelector(".language-menu");
const notificationsButton = document.querySelector('.icon-button[aria-label="Notifications"]');
const PERF_LOG_ENABLED = true;
const pageBootStartedAt = typeof performance !== "undefined" ? performance.now() : 0;
const fetchMetrics = [];

const filters = ["All", "Open", "Nearby", "Saved"];
let filterIndex = 0;
let currentScreen = "home";
let previousScreen = "home";
const navigationStack = ["home"];
let currentSearchQuery = "";
let activeSearchSuggestions = [];
let activeSearchIndex = -1;
let searchDebounceTimer = null;
let searchIndexCache = [];
let searchIndexLocale = "";
let adminContentDirty = true;
let startupTasksScheduled = false;
const stayFilters = { category: "Hotels" };
const rootScreens = new Set(["home", "explore", "saved", "for-business", "profile"]);
const userSettings = {
  language: safeStorageGet("anima.language", "English"),
  currency: safeStorageGet("anima.currency", data.user.currency || "VND"),
  notifications: safeJsonParse(safeStorageGet("anima.notifications", "true"), true),
};
const storeCart = safeJsonParse(safeStorageGet("anima.store.cart", "{}"), {});
const storeFavorites = new Set(safeJsonParse(safeStorageGet("anima.store.favorites", "[]"), []));
const savedCollection = safeJsonParse(safeStorageGet("anima.saved.collection", "[]"), []);
let selectedStoreCategory = "Coffee";
const managerTelegram = {
  handle: "@sheffshady",
  url: "https://t.me/sheffshady",
};
const AUTH_SESSION_KEY = "anima.auth.session.v1";
const AUTH_PIN_UNLOCK_KEY = "anima.auth.pin.unlock.v1";
const AUTH_PERSISTENT_SESSION_KEY = "anima.auth.session.persistent.v1";
const AUTH_TRUSTED_DEVICE_KEY = "anima.auth.trusted-device.v1";
const AUTH_DEVICE_ID_KEY = "anima.auth.device-id.v1";
const authState = {
  view: "choice",
  error: "",
  pendingRegistration: null,
  pendingLogin: null,
  pendingPinReset: null,
  rememberMe: true,
  mailFallbackCode: "",
  pinPurpose: "setup",
  pinBuffer: "",
  firstPin: "",
};
let currentAuthUser = null;
let localTimeTicker = null;
let heroBackgroundTimeout = null;
let heroTransitionTimeout = null;
let activeHeroBackground = "";
let launchAnimationTimeout = null;
let launchAnimationForceTimeout = null;
let launchAnimationStartedAt = 0;
let weatherInitTimeout = null;
installFetchLogging();
bootMark("script.js:evaluated");
startLaunchAnimation();
const notificationState = {
  open: false,
  page: 1,
  selectedId: "",
  replying: false,
};
const HERO_BACKGROUND_TRANSITION_MS = 760;
const HERO_RAIN_BACKGROUND_SRC = "./assets/hero-time-rain.png";
const RAINY_WEATHER_CODES = new Set([61, 63, 65, 80, 81, 82, 95]);
const HERO_BACKGROUND_SCHEDULES = [
  {
    key: "night",
    src: "./assets/hero-time-1-night.jpg",
    startMinute: 21 * 60,
    endMinute: 24 * 60 - 1,
  },
  {
    key: "late-night",
    src: "./assets/hero-time-1-night.jpg",
    startMinute: 0,
    endMinute: 5 * 60 + 50,
  },
  {
    key: "dawn",
    src: "./assets/hero-time-2-dawn.jpg",
    startMinute: 5 * 60 + 51,
    endMinute: 7 * 60 + 29,
  },
  {
    key: "day",
    src: "./assets/hero-time-3-day.jpg",
    startMinute: 7 * 60 + 30,
    endMinute: 17 * 60,
  },
  {
    key: "sunset",
    src: "./assets/hero-time-4-sunset.jpg",
    startMinute: 17 * 60 + 1,
    endMinute: 19 * 60,
  },
  {
    key: "evening",
    src: "./assets/hero-time-5-evening.jpg",
    startMinute: 19 * 60 + 1,
    endMinute: 20 * 60 + 59,
  },
];
const HERO_GREETING_SCHEDULES = [
  {
    key: "night",
    startMinute: 21 * 60,
    endMinute: 24 * 60 - 1,
  },
  {
    key: "late-night",
    startMinute: 0,
    endMinute: 5 * 60 + 49,
  },
  {
    key: "morning",
    startMinute: 5 * 60 + 50,
    endMinute: 12 * 60,
  },
  {
    key: "afternoon",
    startMinute: 12 * 60 + 1,
    endMinute: 18 * 60,
  },
  {
    key: "evening",
    startMinute: 18 * 60 + 1,
    endMinute: 21 * 60,
  },
];
function cloneData(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

function startLaunchAnimation() {
  if (!launchScreen) return;
  bootMark("launchScreen:start");
  launchAnimationStartedAt = typeof performance !== "undefined" ? performance.now() : Date.now();
  document.body.classList.add("app-launching");
  window.clearTimeout(launchAnimationTimeout);
  window.clearTimeout(launchAnimationForceTimeout);
  launchAnimationTimeout = window.setTimeout(() => {
    finishLaunchAnimation();
  }, 1820);
  launchAnimationForceTimeout = window.setTimeout(() => {
    finishLaunchAnimation(true);
  }, 2460);
}

function finishLaunchAnimation(forceRemove = false) {
  if (!launchScreen || !document.body) return;
  const now = typeof performance !== "undefined" ? performance.now() : Date.now();
  const elapsed = launchAnimationStartedAt ? now - launchAnimationStartedAt : Infinity;
  if (!forceRemove && elapsed < 1750) {
    window.clearTimeout(launchAnimationTimeout);
    launchAnimationTimeout = window.setTimeout(() => finishLaunchAnimation(false), 1750 - elapsed);
    return;
  }
  const startedAt = typeof performance !== "undefined" ? performance.now() : 0;
  document.body.classList.add("app-ready");
  document.body.classList.remove("app-launching");
  if (forceRemove) {
    launchScreen.remove();
    perfMark("launchScreen:force-remove", startedAt);
    bootMark("launchScreen:removed");
    return;
  }
  window.setTimeout(() => {
    launchScreen.remove();
    perfMark("launchScreen:remove", startedAt);
    bootMark("launchScreen:removed");
  }, 560);
}

function perfMark(label, startedAt) {
  if (!PERF_LOG_ENABLED || typeof performance === "undefined") return;
  const duration = performance.now() - startedAt;
  console.log(`[perf] ${label}: ${duration.toFixed(1)}ms`);
}

function bootMark(label) {
  if (typeof window !== "undefined" && typeof window.__ANIMA_BOOT_MARK__ === "function") {
    window.__ANIMA_BOOT_MARK__(label);
  }
}

function perfRun(label, fn) {
  const startedAt = typeof performance !== "undefined" ? performance.now() : 0;
  const result = fn();
  perfMark(label, startedAt);
  return result;
}

async function perfRunAsync(label, fn) {
  const startedAt = typeof performance !== "undefined" ? performance.now() : 0;
  const result = await fn();
  perfMark(label, startedAt);
  return result;
}

function installFetchLogging() {
  if (typeof window === "undefined" || typeof window.fetch !== "function" || window.__ANIMA_FETCH_LOGGING_INSTALLED__) return;
  const originalFetch = window.fetch.bind(window);
  window.__ANIMA_FETCH_LOGGING_INSTALLED__ = true;
  window.fetch = async (...args) => {
    const target = typeof args[0] === "string" ? args[0] : args[0]?.url || String(args[0] || "");
    const method = String(args[1]?.method || args[0]?.method || "GET").toUpperCase();
    const startedAt = typeof performance !== "undefined" ? performance.now() : Date.now();
    console.log(`[perf][fetch] ${method} ${target} started`);
    try {
      const response = await originalFetch(...args);
      const duration = (typeof performance !== "undefined" ? performance.now() : Date.now()) - startedAt;
      fetchMetrics.push({ target, method, status: response.status, duration });
      console.log(`[perf][fetch] ${method} ${target} -> ${response.status} in ${duration.toFixed(1)}ms`);
      return response;
    } catch (error) {
      const duration = (typeof performance !== "undefined" ? performance.now() : Date.now()) - startedAt;
      console.log(`[perf][fetch] ${method} ${target} failed in ${duration.toFixed(1)}ms`, error);
      throw error;
    }
  };
}

function logResourceSummary() {
  if (typeof performance === "undefined" || typeof performance.getEntriesByType !== "function") return;
  const navigationEntries = performance.getEntriesByType("navigation");
  navigationEntries.forEach((entry) => {
    console.log(
      `[perf][nav] document=${entry.duration.toFixed(1)}ms dns=${entry.domainLookupEnd - entry.domainLookupStart}ms connect=${entry.connectEnd - entry.connectStart}ms ttfb=${entry.responseStart - entry.requestStart}ms domContentLoaded=${entry.domContentLoadedEventEnd.toFixed(1)}ms load=${entry.loadEventEnd.toFixed(1)}ms`,
    );
  });
  performance.getEntriesByType("resource")
    .filter((entry) => /script\.js|styles\.css|database\.js|weather\.js|mock-data\.js|anima-wordmark|hero-time|home-background|anima-store-card/i.test(entry.name))
    .forEach((entry) => {
      console.log(
        `[perf][resource] ${entry.initiatorType || "resource"} ${entry.name} duration=${entry.duration.toFixed(1)}ms transfer=${entry.transferSize || 0}B decoded=${entry.decodedBodySize || 0}B`,
      );
    });
}

function logUserDataLoad() {
  const startedAt = typeof performance !== "undefined" ? performance.now() : 0;
  const summary = {
    authSession: Boolean(readAuthSession()),
    guestSession: isGuestSession(),
    currentAuthUser: currentAuthUser?.id || "",
    currency: userSettings.currency,
    language: userSettings.language,
  };
  perfMark("userData.load", startedAt);
  console.log("[perf][userData] summary", summary);
}

function scheduleNonCriticalTask(task, timeout = 800) {
  if (typeof window !== "undefined" && typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(task, { timeout });
    return;
  }
  window.setTimeout(task, 0);
}

function syncAdminContent(force = false) {
  if (!force && !adminContentDirty) return;
  const startedAt = typeof performance !== "undefined" ? performance.now() : 0;
  resetAdminContent();
  const entries = readAdminEntries().filter((entry) => entry.status === "published");
  const targets = {
    feed: "feed",
    stay: "stays",
    eat: "restaurants",
    experiences: "experiences",
    jobs: "jobs",
    services: "services",
    community: "communityPosts",
    "tech-solutions": "techSolutions",
  };

  entries.forEach((entry) => {
    const fields = entry.fields || {};
    const item = normalizeAdminEntry(entry);
    const target = targets[entry.module];
    if (target && Array.isArray(data[target])) data[target].unshift(item);
    if (entry.module === "transport" && data.transport?.rentals) {
      data.transport.rentals.unshift({
        ...item,
        group: fields.category || fields.group || "Moto",
        details: fields.description || fields.meta || "",
      });
    }
    if (entry.module === "for-business" && Array.isArray(data.businessBenefits)) {
      data.businessBenefits.unshift({ title: item.title, description: item.description || item.text || item.meta });
    }
    if (entry.module === "store") {
      data.adminStoreProducts = data.adminStoreProducts || [];
      data.adminStoreProducts.unshift({
        id: item.id,
        category: fields.category || "Gift Sets",
        title: item.title,
        size: fields.size || fields.meta || "item",
        price: fields.price || "0 VND",
        priceMap: fields.priceMap || {},
        visual: "gift",
        image: fields.image || "",
        description: fields.description || "",
        origin: fields.origin || "",
        contents: splitAdminList(fields.contents),
        delivery: fields.delivery || "",
        stock: fields.stock || "",
      });
    }
    if (entry.module === "categories") {
      data.adminCategories = data.adminCategories || [];
      data.adminCategories.unshift(item);
    }
  });
  syncRealPartners();
  adminContentDirty = false;
  searchIndexCache = [];
  searchIndexLocale = "";
  perfMark("syncAdminContent", startedAt);
}

function syncRealPartners() {
  if (!window.ANIMA_DB?.listPartners) return;
  data.partners = window.ANIMA_DB.listPartners(baseData).map((partner) => ({
    id: partner.id,
    name: partner.business_name,
    category: partner.business_type || "partner",
    rating: "5.0",
    description: partner.contact_name || "ANIMA Partner",
    location: partner.address || "Dalat",
    tags: [partner.business_type || "partner", partner.email || "", partner.phone || ""].filter(Boolean).slice(0, 3),
    image: "./assets/home-background.jpg",
  }));
}

function resetAdminContent() {
  data.feed = [];
  data.stays = [];
  data.restaurants = [];
  data.experiences = [];
  data.jobs = [];
  data.services = [];
  data.communityPosts = [];
  data.techSolutions = [];
  data.transport = { rentals: [] };
  data.businessBenefits = cloneData(baseData.businessBenefits || []);
  data.partners = [];
  data.adminStoreProducts = [];
  data.adminCategories = [];
}

function readAdminEntries() {
  if (window.ANIMA_DB) return window.ANIMA_DB.listEntries(baseData);
  try {
    return JSON.parse(localStorage.getItem(ADMIN_CONTENT_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function splitAdminList(value) {
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

function normalizeAdminEntry(entry) {
  const fields = entry.fields || {};
  const tags = splitAdminList(fields.tags || fields.category);
  const gallery = splitGalleryList(fields.gallery);
  if (fields.image) gallery.unshift(fields.image);
  return {
    id: entry.id,
    slug: fields.slug || slugify(fields.title || entry.title || entry.id),
    title: fields.title || entry.title || "Admin item",
    type: fields.type || fields.category || entry.module,
    label: fields.label || fields.category || fields.type || "ANIMA",
    text: fields.text || fields.description || fields.meta || "",
    description: fields.description || fields.text || fields.meta || "",
    meta: fields.meta || fields.location || fields.price || fields.salary || "",
    image: fields.image || "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80",
    category: fields.category || fields.placement || entry.module,
    tags,
    vibe: tags,
    location: fields.location || "Dalat",
    address: fields.address || fields.location || "Dalat",
    price: fields.price || fields.salary || fields.rate || "",
    priceMap: fields.priceMap || {},
    priceType: fields.priceType || "",
    monthlyPrice: fields.monthlyPrice || "",
    monthlyPriceMap: fields.monthlyPriceMap || {},
    cleaningFee: fields.cleaningFee || "",
    cleaningFeeMap: fields.cleaningFeeMap || {},
    serviceFee: fields.serviceFee || "",
    serviceFeeMap: fields.serviceFeeMap || {},
    deposit: fields.deposit || "",
    depositMap: fields.depositMap || {},
    salary: fields.salary || fields.price || "",
    salaryMap: fields.salaryMap || fields.priceMap || {},
    company: fields.company || "ANIMA Partner",
    profession: fields.profession || fields.category || "Provider",
    cuisine: fields.cuisine || fields.category || "",
    rating: fields.rating || "",
    reviews: fields.reviews || "",
    distance: fields.distance || "",
    guests: fields.guests ? Number(fields.guests) : "",
    bedrooms: fields.bedrooms ? Number(fields.bedrooms) : "",
    beds: fields.beds ? Number(fields.beds) : "",
    baths: fields.baths ? Number(fields.baths) : "",
    size: fields.size || "",
    nights: fields.nights ? Number(fields.nights) : 1,
    hasKitchen: fields.hasKitchen === "true",
    sourceUrl: fields.sourceUrl || "#",
    gallery: gallery.length ? gallery : [fields.image || "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80"],
    highlights: splitAdminList(fields.highlights),
    amenities: splitAdminList(fields.amenities),
    rules: splitAdminList(fields.rules),
    points: Number(fields.points) || 0,
    time: fields.time || "now",
    author: fields.author || "ANIMA Team",
    badge: fields.badge || "Admin",
    stats: fields.stats || "0 likes · 0 comments",
    duration: fields.duration || fields.meta || "",
    cta: fields.cta || "View details",
    mapsUrl: fields.mapsUrl || "#",
    source: fields.source || "ANIMA",
  };
}

const languageCodes = {
  English: "EN",
  Russian: "RU",
  Vietnamese: "VN",
};

const I18N = {
  English: {
    "language.choose": "Choose language",
    "common.home": "Home",
    "common.feed": "Feed",
    "common.explore": "Explore",
    "common.saved": "Saved",
    "common.business": "Business",
    "common.profile": "Profile",
    "common.openFeed": "Open Feed",
    "home.goodMorning": "Good morning,",
    "home.welcome": "Welcome to Dalat",
    "home.subtitle": "Your digital ecosystem for exploring Dalat.",
    "home.search": "Search places, services, experiences...",
    "home.mainSections": "Main Sections",
    "home.ecosystem": "ANIMA Ecosystem",
    "home.todayUpdates": "Today's updates",
    "home.jobsTitle": "Jobs",
    "home.jobsSubtitle": "Find your next opportunity",
    "home.communityTitle": "Community",
    "home.communitySubtitle": "Local activity and posts",
    "home.businessTitle": "For Business",
    "home.businessSubtitle": "Grow your business",
    "home.digitalTitle": "Digital Solutions",
    "home.digitalSubtitle": "Web, apps & digital services",
    "home.trending": "Trending in Dalat",
    "home.feedCafeEyebrow": "New cafe",
    "home.feedCafeTitle": "Forest cafe joined ANIMA",
    "home.feedCafeSubtitle": "Partner rewards available today",
    "home.feedTonightEyebrow": "Tonight",
    "home.feedTonightTitle": "Live music near the lake",
    "home.feedTonightSubtitle": "128 people interested",
    "home.feedExperienceEyebrow": "Experience",
    "home.feedExperienceTitle": "Hidden Waterfalls Route",
    "home.feedExperienceSubtitle": "Private route revealed after booking",
    "home.feedPromoEyebrow": "Partner promo",
    "home.feedPromoTitle": "15% off at Pine Brew",
    "home.feedPromoSubtitle": "Available for ANIMA users today",
    "home.partners": "Our Partners",
    "home.partnersSubtitle": "Local places powering the ΛNIMΛ Dalat ecosystem.",
    "home.partner1Title": "La Viet Coffee",
    "home.partner1Subtitle": "Cafe · Specialty Coffee",
    "home.partner2Title": "Goldient Boutique",
    "home.partner2Subtitle": "Hotel · Boutique Stay",
    "home.partner3Title": "ANIMA Rides",
    "home.partner3Subtitle": "Transport · Verified",
    "home.social": "Connect With Us",
    "weather.label": "Current weather",
    "weather.loading": "Loading weather...",
    "weather.unavailable": "Weather temporarily unavailable",
    "weather.feelsLike": "Feels like",
    "weather.humidity": "Humidity",
    "weather.wind": "Wind",
    "weather.updated": "Updated",
    "time.city": "Dalat time",
    "profile.english": "English",
    "profile.russian": "Russian",
    "profile.language": "Language",
  },
  Russian: {
    "language.choose": "Выбрать язык",
    "common.home": "Главная",
    "common.feed": "Лента",
    "common.explore": "Обзор",
    "common.saved": "Сохранённое",
    "common.business": "Бизнес",
    "common.profile": "Профиль",
    "common.openFeed": "Открыть ленту",
    "home.goodMorning": "Доброе утро,",
    "home.welcome": "Добро пожаловать в Далат",
    "home.subtitle": "Ваша цифровая экосистема для исследования Далата.",
    "home.search": "Поиск мест, сервисов, впечатлений...",
    "home.mainSections": "Основные разделы",
    "home.ecosystem": "Экосистема ANIMA",
    "home.todayUpdates": "Сегодняшние обновления",
    "home.jobsTitle": "Работа",
    "home.jobsSubtitle": "Найдите следующую возможность",
    "home.communityTitle": "Сообщество",
    "home.communitySubtitle": "Локальная активность и посты",
    "home.businessTitle": "Для бизнеса",
    "home.businessSubtitle": "Развивайте свой бизнес",
    "home.digitalTitle": "Цифровые решения",
    "home.digitalSubtitle": "Веб, приложения и digital-сервисы",
    "home.trending": "Популярное в Далате",
    "home.feedCafeEyebrow": "Новое кафе",
    "home.feedCafeTitle": "Forest cafe присоединился к ANIMA",
    "home.feedCafeSubtitle": "Партнёрские бонусы доступны сегодня",
    "home.feedTonightEyebrow": "Сегодня вечером",
    "home.feedTonightTitle": "Живая музыка у озера",
    "home.feedTonightSubtitle": "128 человек заинтересованы",
    "home.feedExperienceEyebrow": "Впечатление",
    "home.feedExperienceTitle": "Маршрут к скрытым водопадам",
    "home.feedExperienceSubtitle": "Приватный маршрут откроется после брони",
    "home.feedPromoEyebrow": "Партнёрская акция",
    "home.feedPromoTitle": "15% скидка в Pine Brew",
    "home.feedPromoSubtitle": "Доступно для пользователей ANIMA сегодня",
    "home.partners": "Наши партнёры",
    "home.partnersSubtitle": "Локальные места, которые развивают экосистему ΛNIMΛ в Далате.",
    "home.partner1Title": "La Viet Coffee",
    "home.partner1Subtitle": "Кафе · Спешелти кофе",
    "home.partner2Title": "Goldient Boutique",
    "home.partner2Subtitle": "Отель · Бутик-проживание",
    "home.partner3Title": "ANIMA Rides",
    "home.partner3Subtitle": "Транспорт · Проверено",
    "home.social": "Мы на связи",
    "weather.label": "Текущая погода",
    "weather.loading": "Загрузка погоды...",
    "weather.unavailable": "Погода временно недоступна",
    "weather.feelsLike": "Ощущается как",
    "weather.humidity": "Влажность",
    "weather.wind": "Ветер",
    "weather.updated": "Обновлено",
    "time.city": "Время в Далате",
    "profile.english": "English",
    "profile.russian": "Русский",
    "profile.language": "Язык",
  },
};

const phraseTranslations = {
  Home: "Главная",
  Feed: "Лента",
  Saved: "Сохранённое",
  Profile: "Профиль",
  Back: "Назад",
  "See all": "Смотреть все",
  "View": "Открыть",
  "View details": "Подробнее",
  "Book now": "Забронировать",
  "Contact manager": "Связаться с менеджером",
  "Send request": "Отправить заявку",
  "Open Telegram": "Открыть Telegram",
  Done: "Готово",
  Language: "Язык",
  Currency: "Валюта",
  Preferences: "Настройки",
  "My Activity": "Моя активность",
  "Support & Ecosystem": "Поддержка и экосистема",
  "Business & Creator": "Бизнес и авторы",
  "Business Dashboard": "Бизнес-панель",
  "Future partner tools": "Инструменты партнёров",
  Settings: "Настройки приложения",
  "About ANIMA": "О ANIMA",
  "Our Partners": "Наши партнёры",
  "Contact Us": "Связаться с нами",
  Instagram: "Instagram",
  Telegram: "Telegram",
  "24/7 Support": "Поддержка 24/7",
  "Help Center": "Центр помощи",
  "Become a Partner": "Стать партнёром",
  "Invite Friends": "Пригласить друзей",
  "Privacy": "Конфиденциальность",
  "Terms & Policies": "Условия и правила",
  "App Version": "Версия приложения",
  "Log Out": "Выйти",
  "Main Sections": "Основные разделы",
  "ANIMA Ecosystem": "Экосистема ANIMA",
  "Trending in Dalat": "Популярное в Далате",
  "Connect With Us": "Мы на связи",
  Stay: "Жильё",
  "Eat & Drink": "Еда и напитки",
  Experiences: "Впечатления",
  Transport: "Транспорт",
  Exchange: "Обмен",
  Services: "Сервисы",
  Jobs: "Работа",
  Community: "Сообщество",
  "For Business": "Для бизнеса",
  "Digital Solutions": "Цифровые решения",
  Store: "Магазин",
  Coffee: "Кофе",
  "Honey & Bee Products": "Мёд и продукты пчёл",
  Strawberry: "Клубника",
  "Dairy Products": "Молочные продукты",
  Flowers: "Цветы",
  Merch: "Мерч",
  "Gift Sets": "Подарочные наборы",
  "Eco Products": "Эко-товары",
  "Digital Nature Lifestyle goods": "Товары из Далата",
  Cart: "Корзина",
  "Checkout request": "Оформить заявку",
  "Your ANIMA Store cart is empty.": "Корзина ANIMA Store пуста.",
  "Feed": "Лента",
  "For You": "Для вас",
  Today: "Сегодня",
  Events: "События",
  Promotions: "Акции",
  "New Places": "Новые места",
  Food: "Еда",
  "Digital Nomads": "Для удалённой работы",
  "For Digital Nomads": "Для удалённой работы",
  "What's happening in Dalat today.": "Что происходит в Далате сегодня.",
  "Connect. Share. Grow together in Dalat.": "Общайтесь, делитесь и развивайтесь вместе в Далате.",
  "Boutique nature living in the mountains.": "Бутик-жильё и жизнь среди горной природы.",
  "Curated coffee culture, restaurants and local flavors of Dalat.": "Кофейная культура, рестораны и локальные вкусы Далата.",
  "Discover curated journeys around Dalat.": "Откройте авторские маршруты и программы вокруг Далата.",
  "Find the best way to move around Da Lat.": "Найдите лучший способ передвигаться по Далату.",
  "Your places, stays and experiences.": "Ваши места, жильё и впечатления.",
  "Account, rewards, preferences and ANIMA Plus.": "Аккаунт, бонусы, настройки и ANIMA Plus.",
  "Access the hidden side of Dalat.": "Доступ к скрытой стороне Далата.",
  "ANIMA Points, achievements and member offers.": "ANIMA Points, достижения и предложения для участников.",
  "Find opportunities around you.": "Находите возможности рядом.",
  "Find trusted people and useful services.": "Находите проверенных специалистов и полезные сервисы.",
  "Grow your visibility with ANIMA.": "Развивайте видимость бизнеса с ANIMA.",
  "Build your digital presence.": "Создайте цифровое присутствие вашего бизнеса.",
  "Request currency exchange in Dalat.": "Оставьте заявку на обмен валюты в Далате.",
  "Explore routes, rewards and live city points.": "Исследуйте маршруты, бонусы и городские точки.",
  "Curated products from Dalat.": "Отобранные продукты из Далата.",
  "The digital ecosystem of Dalat.": "Цифровая экосистема Далата.",
  "Local brands powering the ANIMA ecosystem.": "Локальные бренды, которые развивают экосистему ANIMA.",
  "Reach the ANIMA team and manager support.": "Свяжитесь с командой ANIMA и менеджером поддержки.",
  Nearby: "Рядом",
  Trending: "Популярное",
  "Boutique Hotels": "Бутик-отели",
  Hotels: "Отели",
  "Apartments / Apart-hotels": "Апартаменты / апарт-отели",
  "Nature Stays": "Жильё на природе",
  Luxury: "Люкс",
  Homestays: "Хоумстеи",
  Apartments: "Апартаменты",
  Houses: "Дома",
  Villas: "Виллы",
  "Long-term": "Долгосрочно",
  "Romantic Escapes": "Романтический отдых",
  "Forest View": "Вид на лес",
  "Mountain View": "Вид на горы",
  "Minimal Aesthetic": "Минимализм",
  "Budget Cozy": "Уютно и доступно",
  "Dalat Coffee Culture": "Кофейная культура Далата",
  Coffee: "Кофе",
  Restaurants: "Рестораны",
  "Local Vietnamese Food": "Местная вьетнамская еда",
  Brunch: "Бранч",
  "Coffee & Bakery": "Кофе и выпечка",
  Vegetarian: "Вегетарианское",
  "Fine Dining": "Fine Dining",
  "Romantic Places": "Романтические места",
  "Sunset Spots": "Закаты",
  "Hidden Gems": "Hidden Gems",
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
  Places: "Места",
  Offers: "Предложения",
  Remote: "Удалённо",
  Local: "Локально",
  "Part-time": "Неполный день",
  "Full-time": "Полный день",
  Freelance: "Фриланс",
  "English-speaking": "Для англоязычных",
  "Digital Nomad Friendly": "Для удалённой работы",
  Creative: "Креатив",
  Business: "Бизнес",
  Repair: "Ремонт",
  Tours: "Туры",
  Fitness: "Фитнес",
  Beauty: "Красота",
  Digital: "Digital",
  "Write review": "Написать отзыв",
  Reviews: "Отзывы",
  "Be the first to share your experience": "Поделитесь первым впечатлением",
  "Weather temporarily unavailable": "Погода временно недоступна",
  "Loading weather...": "Загрузка погоды...",
  Selected: "Выбрано",
};

const reversePhraseTranslations = Object.fromEntries(Object.entries(phraseTranslations).map(([en, ru]) => [ru, en]));

const weatherConditionTranslations = {
  Clear: "Ясно",
  "Mostly clear": "Преимущественно ясно",
  "Partly cloudy": "Переменная облачность",
  Cloudy: "Облачно",
  Fog: "Туман",
  "Rime fog": "Изморозь",
  "Light drizzle": "Слабая морось",
  Drizzle: "Морось",
  "Heavy drizzle": "Сильная морось",
  "Light rain": "Небольшой дождь",
  Rain: "Дождь",
  "Heavy rain": "Сильный дождь",
  "Rain showers": "Ливневый дождь",
  "Heavy showers": "Сильные ливни",
  Thunderstorm: "Гроза",
  Weather: "Погода",
};

let latestWeather = null;

const currencySymbols = {
  VND: "VND",
  USD: "$",
  EUR: "EUR",
  RUB: "RUB",
  UAH: "UAH",
};

function safeStorageGet(key, fallback) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function safeStorageSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // File/in-app browsers can block storage. The app should keep working.
  }
}

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function safeSessionGet(key, fallback = "") {
  try {
    return sessionStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function safeSessionSet(key, value) {
  try {
    sessionStorage.setItem(key, value);
  } catch {}
}

function safeSessionRemove(key) {
  try {
    sessionStorage.removeItem(key);
  } catch {}
}

function safeLocalRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch {}
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function sha256Hex(value) {
  const input = new TextEncoder().encode(String(value || ""));
  const hash = await crypto.subtle.digest("SHA-256", input);
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function authSession() {
  return safeJsonParse(safeSessionGet(AUTH_SESSION_KEY, "null"), null)
    || safeJsonParse(safeStorageGet(AUTH_PERSISTENT_SESSION_KEY, "null"), null);
}

function isGuestSession() {
  return authSession()?.guest === true;
}

function currentDeviceId() {
  let deviceId = safeStorageGet(AUTH_DEVICE_ID_KEY, "");
  if (deviceId) return deviceId;
  deviceId = `device_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
  safeStorageSet(AUTH_DEVICE_ID_KEY, deviceId);
  return deviceId;
}

function saveTrustedDevice(user) {
  if (!user?.id) return;
  safeStorageSet(AUTH_TRUSTED_DEVICE_KEY, JSON.stringify({
    userId: user.id,
    deviceId: currentDeviceId(),
    userAgent: navigator.userAgent || "",
    savedAt: new Date().toISOString(),
  }));
}

function hasTrustedDevice(user) {
  const trusted = safeJsonParse(safeStorageGet(AUTH_TRUSTED_DEVICE_KEY, "null"), null);
  if (!trusted || !user?.id) return false;
  return trusted.userId === user.id
    && trusted.deviceId === currentDeviceId()
    && trusted.userAgent === (navigator.userAgent || "");
}

function saveAuthSession(user, options = {}) {
  const payload = {
    userId: user.id,
    createdAt: new Date().toISOString(),
    rememberMe: Boolean(options.rememberMe),
  };
  safeSessionSet(AUTH_SESSION_KEY, JSON.stringify(payload));
  safeStorageSet(AUTH_PERSISTENT_SESSION_KEY, JSON.stringify(payload));
  saveTrustedDevice(user);
  unlockPin(user);
}

function saveGuestSession() {
  safeSessionSet(AUTH_SESSION_KEY, JSON.stringify({
    guest: true,
    createdAt: new Date().toISOString(),
  }));
  safeLocalRemove(AUTH_PERSISTENT_SESSION_KEY);
  safeLocalRemove(AUTH_TRUSTED_DEVICE_KEY);
}

function clearAuthSession() {
  safeSessionRemove(AUTH_SESSION_KEY);
  safeLocalRemove(AUTH_PERSISTENT_SESSION_KEY);
  safeLocalRemove(AUTH_TRUSTED_DEVICE_KEY);
  safeSessionRemove(AUTH_PIN_UNLOCK_KEY);
  refreshNotificationDot();
}

function refreshCurrentAuthUser() {
  const startedAt = typeof performance !== "undefined" ? performance.now() : 0;
  const session = authSession();
  if (session?.guest) {
    currentAuthUser = null;
    perfMark("refreshCurrentAuthUser", startedAt);
    return null;
  }
  if (!session?.userId || !window.ANIMA_DB) return null;
  currentAuthUser = window.ANIMA_DB.getUser(session.userId, baseData);
  perfMark("refreshCurrentAuthUser", startedAt);
  return currentAuthUser;
}

function scheduleStartupTasks() {
  if (startupTasksScheduled) return;
  startupTasksScheduled = true;
  scheduleNonCriticalTask(() => {
    perfRun("startup.ensureDb", () => window.ANIMA_DB?.ensure(baseData));
    perfRun("startup.trackVisit", () => window.ANIMA_DB?.trackVisit(baseData));
    perfRun("startup.syncAdminContent", () => syncAdminContent(true));
    perfRun("startup.buildSearchIndex", () => buildSearchIndex());
  });
}

function applyCurrentAuthUser() {
  const startedAt = typeof performance !== "undefined" ? performance.now() : 0;
  const user = currentAuthUser;
  if (!user) return;
  data.user.name = user.username ? `@${String(user.username).replace(/^@+/, "")}` : (user.fullName || user.name || data.user.name);
  data.user.city = user.city || data.user.city;
  data.user.currency = user.preferredCurrency || data.user.currency;
  data.user.avatar = (user.fullName || user.name || user.username || "A").split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  userSettings.currency = user.preferredCurrency || userSettings.currency;
  refreshNotificationDot();
  perfMark("applyCurrentAuthUser", startedAt);
}

function currentNotifications() {
  if (!currentAuthUser?.id || !window.ANIMA_DB) return [];
  return window.ANIMA_DB
    .listNotifications(currentAuthUser.id, baseData)
    .filter((item) => item.audience !== "admin");
}

function sanitizeNotificationText(value = "") {
  return String(value ?? "")
    .normalize("NFC")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/\uFFFD+/g, "")
    .replace(/[^\S\r\n]*[?�]{3,}[^\S\r\n]*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isBrokenNotificationText(value = "") {
  const text = sanitizeNotificationText(value);
  return !text
    || /undefined|null|NaN/i.test(text)
    || /�/.test(String(value ?? ""))
    || /[?�]{4,}/.test(String(value ?? ""));
}

function notificationFallbackMeta(item) {
  const ru = isRussianLanguage();
  const map = {
    "booking-created": {
      title: ru ? "Запрос на бронирование отправлен" : "Booking request sent",
      message: ru
        ? "Мы отправили ваш запрос на бронирование. Следите за уведомлениями в приложении или на почте: после ответа отеля здесь появится следующий шаг."
        : "Your booking request was sent. Watch app notifications or email for the next step after the hotel replies.",
    },
    "order-review": {
      title: ru ? "Заявка в работе" : "Request in progress",
      message: ru
        ? "Мы передали ваш запрос партнёру и уже уточняем подтверждение по бронированию."
        : "We forwarded your request to the partner and are confirming the booking.",
    },
    "order-approved": {
      title: ru ? "Бронирование одобрено" : "Booking approved",
      message: ru
        ? "Ваше бронирование одобрено со стороны отеля. Следующий шаг уже подготовлен внутри приложения."
        : "Your booking has been approved by the hotel. The next step is ready inside the app.",
    },
    "order-payment_requested": {
      title: ru ? "Подтвердите бронь" : "Confirm booking",
      message: ru
        ? "Ваше бронирование одобрено со стороны отеля. Для подтверждения оплаты внесите 5% от общей стоимости брони."
        : "Your booking was approved by the hotel. To confirm it, pay 5% of the total booking amount.",
    },
    "order-paid": {
      title: ru ? "Бронь подтверждена" : "Booking confirmed",
      message: ru
        ? "Оплата получена. Бронь подтверждена, детали сохранены внутри приложения."
        : "Payment received. Your booking is confirmed and saved inside the app.",
    },
    "admin-message": {
      title: ru ? "Сообщение от администрации ANIMA" : "Message from ANIMA administration",
      message: ru
        ? "Администрация ANIMA отправила вам сообщение."
        : "ANIMA administration sent you a message.",
    },
  };
  return map[item.type] || {
    title: ru ? "Уведомление" : "Notification",
    message: ru ? "Детали уведомления обновлены." : "Notification details were updated.",
  };
}

function normalizeNotification(item) {
  const fallback = notificationFallbackMeta(item);
  const title = isBrokenNotificationText(item.title) ? fallback.title : sanitizeNotificationText(item.title);
  const message = isBrokenNotificationText(item.message) ? fallback.message : sanitizeNotificationText(item.message);
  return {
    ...item,
    title,
    message,
    senderName: sanitizeNotificationText(item.senderName || "") || "Администрация ANIMA",
    typeLabel: sanitizeNotificationText(item.type || "") || "system",
  };
}

function formatNotificationDate(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString(userSettings.language === "Russian" ? "ru-RU" : "en-US", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function refreshNotificationDot() {
  const dot = document.querySelector(".notify-dot");
  if (!dot) return;
  dot.hidden = !currentNotifications().some((item) => item.status !== "read");
}

function notificationIcon(type = "") {
  if (type.includes("payment")) return "₫";
  if (type.includes("booking")) return "✓";
  if (type.includes("message") || type.includes("admin")) return "✉";
  if (type.includes("payout")) return "↗";
  if (type.includes("warning")) return "!";
  return "A";
}

function renderNotificationPanel() {
  const ru = isRussianLanguage();
  const items = currentNotifications().map(normalizeNotification);
  const existing = document.querySelector(".notification-overlay");
  if (!notificationState.open) {
    existing?.remove();
    return;
  }
  const selected = items.find((item) => item.id === notificationState.selectedId) || null;
  const unreadItems = items.filter((item) => item.status !== "read");
  const readItems = items.filter((item) => item.status === "read");
  const renderItems = (group) => group.map((item) => `
    <button class="notification-item ${item.status === "read" ? "read" : "unread"}" type="button" data-notification-id="${escapeAttr(item.id)}">
      <span class="notification-type-icon">${escapeHtml(notificationIcon(item.type || item.typeLabel))}</span>
      <span class="notification-item-content">
        <span class="notification-item-head">
          <strong>${escapeHtml(item.title || (ru ? "Уведомление" : "Notification"))}</strong>
          <small>${escapeHtml(formatNotificationDate(item.createdAt))}</small>
        </span>
        <span class="notification-item-text">${escapeHtml(item.message || "")}</span>
      </span>
    </button>
  `).join("");
  const detailView = selected
    ? `
      <div class="notification-detail-card">
        <div class="notification-detail-head">
          <button type="button" class="notification-back" data-notification-back>${ru ? "Назад" : "Back"}</button>
          <span class="auth-kicker-text">${ru ? "Детали уведомления" : "Notification details"}</span>
          <strong>${escapeHtml(selected.title || (ru ? "Уведомление" : "Notification"))}</strong>
        </div>
        <div class="notification-detail-meta">
          <span>${ru ? "От кого" : "From"}: <b>${escapeHtml(selected.senderName || "Администрация ANIMA")}</b></span>
          <span>${ru ? "Кому" : "To"}: <b>${escapeHtml(currentAuthUser.username ? `@${currentAuthUser.username}` : (currentAuthUser.fullName || currentAuthUser.email || "ANIMA User"))}</b></span>
          <span>${ru ? "Тип" : "Type"}: <b>${escapeHtml(selected.typeLabel)}</b></span>
          <span>${ru ? "Статус" : "Status"}: <b>${escapeHtml(selected.status === "read" ? (ru ? "Прочитано" : "Read") : (ru ? "Не прочитано" : "Unread"))}</b></span>
          <span>${escapeHtml(formatNotificationDate(selected.createdAt))}</span>
        </div>
        <p class="notification-detail-text">${escapeHtml(selected.message || "")}</p>
        <div class="notification-detail-actions">
          ${["pay-deposit", "pay-booking"].includes(selected.actionType) ? `<button class="gold-button" type="button" data-notification-pay>${ru ? "Оплатить сейчас" : "Pay now"}</button>` : ""}
          ${selected.cta?.url || selected.actionUrl ? `<button class="secondary-button" type="button" data-notification-open>${escapeHtml(selected.cta?.label || (ru ? "Открыть" : "Open"))}</button>` : ""}
          ${selected.replyAllowed ? `<button class="secondary-button" type="button" data-notification-reply>${ru ? "Ответить" : "Reply"}</button>` : ""}
        </div>
        ${notificationState.replying ? `
          <form class="notification-reply-form" data-notification-reply-form>
            <textarea name="message" placeholder="${ru ? "Ответ для администрации ANIMA" : "Reply to ANIMA administration"}" required></textarea>
            <div class="guest-gate-actions">
              <button class="secondary-button" type="button" data-notification-reply-cancel>${ru ? "Отмена" : "Cancel"}</button>
              <button class="gold-button" type="submit">${ru ? "Отправить" : "Send"}</button>
            </div>
          </form>
        ` : ""}
      </div>
    `
    : (items.length
      ? `
        <div class="notification-feed">
          ${unreadItems.length ? `<div class="notification-group-title">${ru ? "Новые" : "New"}</div>${renderItems(unreadItems)}` : ""}
          ${readItems.length ? `<div class="notification-group-title">${ru ? "Ранее" : "Earlier"}</div>${renderItems(readItems)}` : ""}
        </div>
      `
      : `<div class="notification-empty">
          <strong>${ru ? "Пока пусто" : "Nothing yet"}</strong>
          <p>${ru ? "Здесь появятся статусы бронирований, подтверждения и важные обновления по вашим заказам." : "Booking updates, confirmations and important order messages will appear here."}</p>
        </div>`);
  const markup = `
    <div class="notification-overlay" role="presentation">
      <button class="notification-overlay-backdrop" type="button" aria-label="${ru ? "Закрыть уведомления" : "Close notifications"}" data-notification-close></button>
      <section class="notification-popover" role="dialog" aria-modal="true" aria-label="${ru ? "Уведомления ANIMA" : "ANIMA notifications"}">
        <div class="notification-popover-head">
          <div>
            <span class="auth-kicker-text">ANIMA</span>
            <strong>${ru ? "Уведомления" : "Notifications"}</strong>
          </div>
          <div class="notification-head-actions">
            ${items.some((item) => item.status !== "read") ? `<button type="button" data-notification-read-all>${ru ? "Прочитать всё" : "Mark all"}</button>` : ""}
            <button type="button" data-notification-close>×</button>
          </div>
        </div>
        <div class="notification-popover-body">
          ${detailView}
        </div>
      </section>
    </div>
  `;
  if (existing) existing.outerHTML = markup;
  else phoneShell.insertAdjacentHTML("beforeend", markup);
  const overlay = document.querySelector(".notification-overlay");
  const panel = overlay?.querySelector(".notification-popover");
  panel?.addEventListener("click", (event) => {
    event.stopPropagation();
  });
  overlay?.querySelectorAll("[data-notification-close]").forEach((button) => button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    closeNotificationPanel();
  }));
  panel?.querySelector("[data-notification-read-all]")?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (currentAuthUser?.id) {
      window.ANIMA_DB?.markAllNotificationsRead(currentAuthUser.id, baseData);
      refreshCurrentAuthUser();
      refreshNotificationDot();
      renderNotificationPanel();
    }
  });
  panel?.querySelectorAll("[data-notification-id]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      window.ANIMA_DB?.markNotificationRead(button.dataset.notificationId, baseData);
      refreshCurrentAuthUser();
      refreshNotificationDot();
      notificationState.selectedId = button.dataset.notificationId;
      notificationState.replying = false;
      renderNotificationPanel();
    });
  });
  panel?.querySelector("[data-notification-back]")?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    notificationState.selectedId = "";
    notificationState.replying = false;
    renderNotificationPanel();
  });
  panel?.querySelector("[data-notification-pay]")?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const bookingId = selected?.bookingId || String(selected?.actionUrl || "").split("/").filter(Boolean).pop();
    if (!bookingId || !window.ANIMA_DB?.recordPayment) {
      openInfoModal(ru ? "Бронь не найдена" : "Booking not found", ru ? "Не получилось найти связанную бронь для оплаты." : "Could not find the linked booking to pay.");
      return;
    }
    const payment = window.ANIMA_DB.recordPayment(bookingId, {
      actorUserId: currentAuthUser?.id || "",
      status: "paid",
      method: "notification_checkout",
      provider: "ANIMA demo checkout",
    }, baseData);
    if (!payment) {
      openInfoModal(ru ? "Оплата не прошла" : "Payment failed", ru ? "Не получилось создать платёж по этой брони." : "Could not create a payment for this booking.");
      return;
    }
    refreshCurrentAuthUser();
    refreshNotificationDot();
    notificationState.selectedId = "";
    renderNotificationPanel();
    openInfoModal(
      ru ? "Оплата получена" : "Payment received",
      payment.payment_method === "cash_at_hotel"
        ? (ru ? "Сервисный сбор ANIMA оплачен. Остаток вы оплатите в отеле при заселении." : "The ANIMA service fee is paid. You will pay the remaining amount at the hotel.")
        : (ru ? "Полная стоимость бронирования оплачена через ANIMA." : "The full booking amount has been paid through ANIMA.")
    );
  });
  panel?.querySelector("[data-notification-open]")?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const target = selected?.cta?.url || selected?.actionUrl || "";
    if (target && !target.startsWith("/booking/")) window.location.href = target;
  });
  panel?.querySelector("[data-notification-reply]")?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    notificationState.replying = true;
    renderNotificationPanel();
  });
  panel?.querySelector("[data-notification-reply-cancel]")?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    notificationState.replying = false;
    renderNotificationPanel();
  });
  panel?.querySelector("[data-notification-reply-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const formData = new FormData(event.currentTarget);
    const text = String(formData.get("message") || "").trim();
    if (!text) return;
    window.ANIMA_DB?.addNotification({
      userId: currentAuthUser.id,
      audience: "admin",
      senderName: currentAuthUser.username ? `@${currentAuthUser.username}` : (currentAuthUser.fullName || currentAuthUser.email || "ANIMA User"),
      senderType: "user",
      title: ru ? "Ответ для администрации ANIMA" : "Reply to ANIMA administration",
      message: text,
      replyToNotificationId: notificationState.selectedId,
    }, baseData);
    notificationState.replying = false;
    openInfoModal(ru ? "Ответ отправлен" : "Reply sent", ru ? "Сообщение для администрации ANIMA сохранено." : "Your message for ANIMA administration was saved.");
    renderNotificationPanel();
  });
}

function closeNotificationPanel() {
  notificationState.open = false;
  notificationState.selectedId = "";
  notificationState.replying = false;
  renderNotificationPanel();
}

function openUserNotifications() {
  const ru = isRussianLanguage();
  if (!currentAuthUser || isGuestSession()) {
    return openGuestRestrictionModal(ru ? "Уведомления" : "Notifications");
  }
  notificationState.open = !notificationState.open;
  if (!notificationState.open) {
    return renderNotificationPanel();
  }
  notificationState.page = 1;
  notificationState.selectedId = "";
  notificationState.replying = false;
  renderNotificationPanel();
}

function isPinUnlocked(user) {
  return safeSessionGet(AUTH_PIN_UNLOCK_KEY, "") === user?.id;
}

function unlockPin(user) {
  if (!user?.id) return;
  safeSessionSet(AUTH_PIN_UNLOCK_KEY, user.id);
}

function lockPin() {
  safeSessionRemove(AUTH_PIN_UNLOCK_KEY);
}

function showAuth(view, extra = {}) {
  Object.assign(authState, extra);
  authState.view = view;
  if (phoneShell) phoneShell.hidden = true;
  authEntry.hidden = false;
  renderAuthEntry();
}

function hideAuth() {
  authEntry.hidden = true;
}

function authTitle(view) {
  const ru = userSettings.language === "Russian";
  const titles = {
    choice: ru ? "Вход в ANIMA" : "Enter ANIMA",
    login: ru ? "Вход" : "Sign in",
    register: ru ? "Регистрация" : "Create account",
    "register-code": ru ? "Подтвердите почту" : "Verify email",
    "login-code": ru ? "Код подтверждения" : "Two-factor code",
    "pin-setup": ru ? "Код входа" : "App passcode",
    "pin-unlock": ru ? "Введите код" : "Enter passcode",
  };
  return titles[view] || "ANIMA";
}

function renderAuthEntry() {
  if (!authEntry || authEntry.hidden) return;
  const view = authState.view;
  const ru = userSettings.language === "Russian";
  const compactView = view === "choice" || view === "login" || view === "register" || view === "register-code" || view === "login-code";
  const codeBox = authState.mailFallbackCode
    ? `<div class="auth-demo-code">${ru ? "Демо-код для локального запуска" : "Demo code for local build"}: <strong>${authState.pendingRegistration?.code || authState.pendingLogin?.code}</strong></div>`
    : "";
  const panelClass = [
    view.startsWith("pin") ? "pin-panel" : "auth-panel",
    compactView ? "auth-panel-compact" : "",
    view === "choice" ? "auth-panel-choice" : "",
  ].filter(Boolean).join(" ");
  const brandHero = view === "choice"
    ? `
        <div class="auth-brand-hero">
          <div class="auth-brand-symbol" aria-hidden="true"><span></span></div>
          <div class="auth-wordmark" aria-label="ANIMA">ANIMA</div>
          <p>${ru ? "Digital Ecosystem for Dalat" : "Digital Ecosystem for Dalat"}</p>
        </div>
      `
    : (view.startsWith("pin") ? "" : `<div class="auth-wordmark" aria-label="ANIMA">ANIMA</div>`);
  authEntry.innerHTML = `
    <div class="auth-shell">
      <section class="${panelClass}">
        <div class="auth-topbar-row">
          <button class="auth-language-switch" type="button" data-auth-language>${userSettings.language === "Russian" ? "RU" : "EN"}</button>
          <button class="auth-guest-link" type="button" data-auth-guest>${ru ? "Гостевой вход" : "Guest access"}</button>
        </div>
        ${brandHero}
        ${view === "choice" ? "" : `<p class="auth-kicker-text">${ru ? "Безопасный вход" : "Secure entry"}</p><h1>${authTitle(view)}</h1>`}
        ${renderAuthBody(view, codeBox)}
        <div class="auth-error">${authState.error || ""}</div>
      </section>
    </div>
  `;
  bindAuthActions();
}

async function sendVerificationEmail(to, code, purpose = "register") {
  const ru = userSettings.language === "Russian";
  const subject = purpose === "login"
    ? (ru ? "ANIMA: код для входа" : "ANIMA: sign-in code")
    : (ru ? "ANIMA: подтвердите почту" : "ANIMA: verify your email");
  const title = purpose === "login"
    ? (ru ? "Код для входа" : "Your sign-in code")
    : (ru ? "Код подтверждения" : "Your verification code");
  const text = purpose === "login"
    ? (ru ? "Введите этот код, чтобы завершить вход в ANIMA." : "Enter this code to finish signing in to ANIMA.")
    : (ru ? "Введите этот код, чтобы завершить регистрацию в ANIMA." : "Enter this code to finish creating your ANIMA account.");
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;padding:24px;background:#041414;color:#f7f8f5">
      <div style="max-width:520px;margin:0 auto;padding:24px;border-radius:24px;background:#0d2320;border:1px solid rgba(247,231,200,.12)">
        <h1 style="margin:0 0 12px;font-size:28px;color:#f7e7c8">ANIMA</h1>
        <p style="margin:0 0 12px;font-size:20px;font-weight:700">${title}</p>
        <p style="margin:0 0 18px;color:rgba(247,248,245,.72)">${text}</p>
        <div style="display:inline-block;padding:16px 22px;border-radius:18px;background:#f7e7c8;color:#06100e;font-size:30px;font-weight:800;letter-spacing:4px">${code}</div>
        <p style="margin:18px 0 0;color:rgba(247,248,245,.58)">${ru ? "Код действует 15 минут." : "The code is valid for 15 minutes."}</p>
      </div>
    </div>
  `;
  const response = await fetch("/api/auth/send-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to, subject, html }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result?.ok) {
    throw new Error(result?.error || "SEND_FAILED");
  }
  return result;
}

function renderAuthBody(view, codeBox) {
  const ru = userSettings.language === "Russian";
  const socialButton = (provider, title, subtitle, icon) => `
    <button class="auth-social-button ${provider}" type="button" data-auth-provider="${provider}">
      <span class="auth-social-copy">
        <strong>${title}</strong>
        <span>${subtitle}</span>
      </span>
      <span class="auth-social-icon" aria-hidden="true">${icon}</span>
    </button>
  `;
  const providerTile = (provider, title, icon) => `
    <button class="auth-provider-tile ${provider}" type="button" data-auth-provider="${provider}">
      <span class="auth-provider-orb" aria-hidden="true">${icon}</span>
      <strong>${title}</strong>
    </button>
  `;
  if (view === "choice") {
    return `
      <div class="auth-choice-card">
        <h1>${ru ? "Добро пожаловать в ANIMA" : "Welcome to ANIMA"}</h1>
        <p class="auth-choice-subtitle">${ru ? "Discover. Connect. Grow.<br />All in one place." : "Discover. Connect. Grow.<br />All in one place."}</p>
        <p class="auth-choice-label">${ru ? "Продолжить как пользователь" : "Continue as a user"}</p>
        <div class="auth-provider-grid">
          ${providerTile("google", "Google", `
            <svg viewBox="0 0 24 24">
              <path fill="#4285F4" d="M21.8 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h5.5c-.2 1.2-.9 2.3-1.9 3v2.5h3.1c1.8-1.6 3.1-4 3.1-7.2Z" />
              <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.5l-3.1-2.5c-.9.6-2 .9-3.6.9-2.8 0-5.1-1.9-5.9-4.4H2.9V16c1.7 3.5 5.3 6 9.1 6Z" />
              <path fill="#FBBC05" d="M6.1 13.5c-.2-.6-.4-1.2-.4-1.9s.1-1.3.4-1.9V7.2H2.9C2.3 8.5 2 10 2 11.6s.3 3.1.9 4.4l3.2-2.5Z" />
              <path fill="#EA4335" d="M12 5.3c1.5 0 2.8.5 3.8 1.5l2.8-2.8C17 2.5 14.7 1.6 12 1.6c-3.8 0-7.4 2.5-9.1 6l3.2 2.5c.8-2.5 3.1-4.8 5.9-4.8Z" />
            </svg>
          `)}
          ${providerTile("telegram", "Telegram", `
          <svg viewBox="0 0 24 24">
            <path d="M21.2 4.4 18 19.5c-.2 1-.8 1.3-1.7.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.3-5 9.1-8.2c.4-.4-.1-.6-.6-.3L5.6 13 1 11.6c-1-.3-1-1 .2-1.5L19.3 3c.9-.3 1.6.2 1.9 1.4Z" />
          </svg>
        `)}
        </div>
        <div class="auth-divider"><span>${ru ? "или" : "or"}</span></div>
        <button class="auth-email-button" type="button" data-auth-view="login">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m4 7 8 6 8-6" />
          </svg>
          <span>${ru ? "Продолжить через Email" : "Continue with Email"}</span>
        </button>
        <p class="auth-signup-line">${ru ? "Нет аккаунта?" : "Don't have an account?"} <button type="button" data-auth-view="register">${ru ? "Зарегистрироваться" : "Sign up"}</button></p>
      </div>
      <div class="auth-portal-stack">
      <button class="auth-partner-entry auth-portal-card" type="button" data-auth-partner>
        <span class="auth-portal-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M4 10h16l-1-5H5l-1 5Z" /><path d="M5 10v8h14v-8" /><path d="M9 18v-5h6v5" /></svg>
        </span>
        <span class="auth-portal-copy">
          <strong>${ru ? "Портал партнёра" : "Partner Portal"}</strong>
          <small>${ru ? "Кабинет, бизнес, заявки и клиенты ANIMA." : "Manage your business, track performance and connect with customers."}</small>
        </span>
        <span class="auth-portal-arrow" aria-hidden="true">›</span>
      </button>
      <button class="auth-partner-entry auth-portal-card admin" type="button" data-auth-admin>
        <span class="auth-portal-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M12 3 5 6v6c0 4.5 3 7.6 7 9 4-1.4 7-4.5 7-9V6l-7-3Z" /><path d="M12 8v6" /><path d="M12 16h.01" /></svg>
        </span>
        <span class="auth-portal-copy">
          <strong>${ru ? "Портал админа" : "Admin Portal"}</strong>
          <small>${ru ? "Безопасный вход для администрации ANIMA." : "Secure access for ANIMA administrators."}</small>
        </span>
        <span class="auth-portal-arrow" aria-hidden="true">›</span>
      </button>
      </div>
      <div class="auth-benefit-row" aria-label="ANIMA principles">
        <span>${ru ? "Одна экосистема" : "One Ecosystem"}</span>
        <span>${ru ? "Комьюнити" : "Community First"}</span>
        <span>${ru ? "Рост вместе" : "Growth Together"}</span>
      </div>
    `;
  }
  if (view === "login") {
    return `
      <p class="auth-note">${ru ? "Вход по почте или @username. Если включена 2FA, дальше запросим код." : "Sign in by email or @username."}</p>
      <form class="auth-form-grid" data-auth-form="login">
        <label class="full"><span>${ru ? "Email / @username" : "Email / @username"}</span><input name="login" placeholder="${ru ? "email / @username" : "email / @username"}" required /></label>
        ${passwordField("password", ru ? "Пароль" : "Password", "", { required: true })}
        <div class="auth-inline-meta full"><label><input name="rememberMe" type="checkbox" ${authState.rememberMe ? "checked" : ""} /> <span>${ru ? "Запомнить меня" : "Remember me"}</span></label><button type="button" class="auth-text-button" data-auth-provider="reset">${ru ? "Забыли пароль?" : "Forgot password?"}</button></div>
        <div class="full auth-actions-row"><button class="gold-button auth-primary-button" type="submit">${ru ? "Войти" : "LOGIN"}</button></div>
      </form>
      <div class="auth-switch-row"><span>${ru ? "Нет аккаунта?" : "No account yet?"}</span><button type="button" class="auth-text-button" data-auth-view="register">${ru ? "Регистрация" : "Register"}</button></div>
      <div class="auth-divider"><span>${ru ? "или войти через" : "or continue with"}</span></div>
      <div class="auth-social-stack auth-social-stack-bottom">
        ${socialButton("telegram", "Telegram", ru ? "Вход через Telegram" : "Continue with Telegram", `
          <svg viewBox="0 0 24 24">
            <path d="M21.2 4.4 18 19.5c-.2 1-.8 1.3-1.7.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.3-5 9.1-8.2c.4-.4-.1-.6-.6-.3L5.6 13 1 11.6c-1-.3-1-1 .2-1.5L19.3 3c.9-.3 1.6.2 1.9 1.4Z" />
          </svg>
        `)}
        ${socialButton("google", "Google", ru ? "Вход через Google" : "Continue with Google", `
          <svg viewBox="0 0 24 24">
            <path d="M21.8 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h5.5c-.2 1.2-.9 2.3-1.9 3v2.5h3.1c1.8-1.6 3.1-4 3.1-7.2Z" />
            <path d="M12 22c2.7 0 5-.9 6.7-2.5l-3.1-2.5c-.9.6-2 .9-3.6.9-2.8 0-5.1-1.9-5.9-4.4H2.9V16c1.7 3.5 5.3 6 9.1 6Z" />
            <path d="M6.1 13.5c-.2-.6-.4-1.2-.4-1.9s.1-1.3.4-1.9V7.2H2.9C2.3 8.5 2 10 2 11.6s.3 3.1.9 4.4l3.2-2.5Z" />
            <path d="M12 5.3c1.5 0 2.8.5 3.8 1.5l2.8-2.8C17 2.5 14.7 1.6 12 1.6c-3.8 0-7.4 2.5-9.1 6l3.2 2.5c.8-2.5 3.1-4.8 5.9-4.8Z" />
          </svg>
        `)}
      </div>
    `;
  }
  if (view === "register") {
    return `
      <p class="auth-note">${ru ? "Создай аккаунт. Подтверждение первой регистрации только через email." : "Create your account. First verification uses email only."}</p>
      <form class="auth-form-grid" data-auth-form="register">
        <label class="full"><span>${ru ? "ФИО" : "Full name"}</span><input name="fullName" required /></label>
        <label><span>${ru ? "Дата рождения" : "Birth date"}</span><input name="birthDate" type="date" required /></label>
        <label><span>${ru ? "Почта" : "Email"}</span><input name="email" type="email" required /></label>
        <label><span>@username</span><input name="username" placeholder="@animauser" /></label>
        ${passwordField("password", ru ? "Пароль" : "Password", "", { required: true, minlength: 6 })}
        ${passwordField("passwordRepeat", ru ? "Повторите пароль" : "Repeat password", "", { required: true, minlength: 6 })}
        <div class="full auth-actions-row"><button class="gold-button auth-primary-button" type="submit">${ru ? "Создать аккаунт" : "CREATE ACCOUNT"}</button></div>
      </form>
      <div class="auth-switch-row"><span>${ru ? "Уже есть аккаунт?" : "Already have an account?"}</span><button type="button" class="auth-text-button" data-auth-view="login">${ru ? "Войти" : "Sign in"}</button></div>
      <div class="auth-divider"><span>${ru ? "или зарегистрироваться через" : "or continue with"}</span></div>
      <div class="auth-social-stack auth-social-stack-bottom">
        ${socialButton("telegram", "Telegram", ru ? "Регистрация через Telegram" : "Continue with Telegram", `
          <svg viewBox="0 0 24 24">
            <path d="M21.2 4.4 18 19.5c-.2 1-.8 1.3-1.7.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.3-5 9.1-8.2c.4-.4-.1-.6-.6-.3L5.6 13 1 11.6c-1-.3-1-1 .2-1.5L19.3 3c.9-.3 1.6.2 1.9 1.4Z" />
          </svg>
        `)}
        ${socialButton("google", "Google", ru ? "Регистрация через Google" : "Continue with Google", `
          <svg viewBox="0 0 24 24">
            <path d="M21.8 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h5.5c-.2 1.2-.9 2.3-1.9 3v2.5h3.1c1.8-1.6 3.1-4 3.1-7.2Z" />
            <path d="M12 22c2.7 0 5-.9 6.7-2.5l-3.1-2.5c-.9.6-2 .9-3.6.9-2.8 0-5.1-1.9-5.9-4.4H2.9V16c1.7 3.5 5.3 6 9.1 6Z" />
            <path d="M6.1 13.5c-.2-.6-.4-1.2-.4-1.9s.1-1.3.4-1.9V7.2H2.9C2.3 8.5 2 10 2 11.6s.3 3.1.9 4.4l3.2-2.5Z" />
            <path d="M12 5.3c1.5 0 2.8.5 3.8 1.5l2.8-2.8C17 2.5 14.7 1.6 12 1.6c-3.8 0-7.4 2.5-9.1 6l3.2 2.5c.8-2.5 3.1-4.8 5.9-4.8Z" />
          </svg>
        `)}
      </div>
    `;
  }
  if (view === "register-code" || view === "login-code") {
    return `
      <p class="auth-note">${ru ? "Мы отправили код на почту. Введи его, чтобы продолжить." : "We sent a code to your email. Enter it to continue."}</p>
      ${codeBox}
      <form class="auth-form-grid" data-auth-form="${view}">
        <label class="full"><span>${ru ? "Код из письма" : "Code from email"}</span><input name="code" inputmode="numeric" maxlength="6" required /></label>
        <div class="full auth-actions-row"><button class="gold-button auth-primary-button" type="submit">${ru ? "Подтвердить" : "VERIFY"}</button></div>
      </form>
      <div class="auth-switch-row"><button type="button" class="auth-text-button" data-auth-view="${view === "register-code" ? "register" : "login"}">${ru ? "Назад" : "Back"}</button></div>
    `;
  }
  return renderPinPanel();
}

function passwordField(name, label, placeholder = "", attrs = {}) {
  const extra = Object.entries(attrs)
    .map(([key, value]) => value === true ? key : `${key}="${String(value)}"`)
    .join(" ");
  return `
    <label class="full">
      <span>${label}</span>
      <span class="password-field-shell">
        <input name="${name}" type="password" placeholder="${placeholder}" ${extra} />
        <button class="password-toggle" type="button" data-password-toggle aria-label="Toggle password visibility">◉</button>
      </span>
    </label>
  `;
}

function renderPinPanel() {
  const ru = userSettings.language === "Russian";
  const digits = authState.pinBuffer.length;
  if (authState.pinPurpose === "reset-code") {
    return `
      <p class="auth-note">${ru ? "Мы отправили код на вашу почту. Введите его и задайте новый PIN." : "We sent a code to your email. Enter it and create a new PIN."}</p>
      ${authState.mailFallbackCode ? `<div class="auth-demo-code">${ru ? "Демо-код для локального запуска" : "Demo code for local build"}: <strong>${authState.mailFallbackCode}</strong></div>` : ""}
      <form class="auth-form-grid" data-auth-form="pin-reset-code">
        <label class="full"><span>${ru ? "Код из письма" : "Code from email"}</span><input name="code" inputmode="numeric" maxlength="6" required /></label>
        <div class="full auth-actions-row"><button class="gold-button auth-primary-button" type="submit">${ru ? "Проверить код" : "Verify code"}</button></div>
      </form>
      <div class="auth-switch-row"><button type="button" class="auth-text-button" data-auth-view="pin-unlock">${ru ? "Назад" : "Back"}</button></div>
    `;
  }
  return `
    <p class="auth-note">${authState.pinPurpose === "unlock" ? (ru ? "Введите 4 цифры для входа в приложение." : "Enter your 4-digit code.") : authState.firstPin ? (ru ? "Повторите код ещё раз." : "Repeat the code.") : (ru ? "Создайте 4-значный код для быстрого входа." : "Create a 4-digit app passcode.")}</p>
    <div class="pin-dots">${[0, 1, 2, 3].map((index) => `<span class="${index < digits ? "filled" : ""}"></span>`).join("")}</div>
    <div class="pin-grid">
      ${[1,2,3,4,5,6,7,8,9,"face",0,"del"].map((value) => `<button type="button" data-pin-key="${value}">${value === "del" ? "⌫" : value === "face" ? "◎" : value}</button>`).join("")}
    </div>
    <div class="auth-actions-row">
      ${authState.pinPurpose === "setup" ? `<button class="secondary-button" type="button" data-pin-skip>${ru ? "Пропустить" : "Skip"}</button>` : `<button class="secondary-button" type="button" data-auth-logout>${ru ? "Сменить аккаунт" : "Change account"}</button>`}
    </div>
    ${authState.pinPurpose === "unlock" ? `<div class="auth-switch-row"><button type="button" class="auth-text-button" data-pin-forgot>${ru ? "Забыли PIN?" : "Forgot PIN?"}</button></div>` : ""}
  `;
}

function bindAuthActions() {
  authEntry.querySelectorAll("[data-auth-view]").forEach((button) => {
    button.addEventListener("click", () => {
      authState.error = "";
      showAuth(button.dataset.authView);
    });
  });
  authEntry.querySelector("[data-auth-form='login']")?.addEventListener("submit", submitLogin);
  authEntry.querySelector("[data-auth-form='register']")?.addEventListener("submit", submitRegistration);
  authEntry.querySelector("[data-auth-form='register-code']")?.addEventListener("submit", submitRegistrationCode);
  authEntry.querySelector("[data-auth-form='login-code']")?.addEventListener("submit", submitLoginCode);
  authEntry.querySelector("[data-auth-form='pin-reset-code']")?.addEventListener("submit", submitPinResetCode);
  authEntry.querySelectorAll("[data-password-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = button.parentElement?.querySelector("input");
      if (!input) return;
      const visible = input.type === "text";
      input.type = visible ? "password" : "text";
      button.textContent = visible ? "◉" : "◎";
    });
  });
  authEntry.querySelectorAll("[data-auth-provider]").forEach((button) => {
    button.addEventListener("click", () => handleAuthProvider(button.dataset.authProvider));
  });
  authEntry.querySelector("[data-auth-language]")?.addEventListener("click", () => {
    setLanguage(userSettings.language === "Russian" ? "English" : "Russian");
    renderAuthEntry();
  });
  authEntry.querySelector("[data-auth-partner]")?.addEventListener("click", () => {
    window.location.href = "./partner.html";
  });
  authEntry.querySelector("[data-auth-admin]")?.addEventListener("click", () => {
    window.location.href = "./adminanima/";
  });
  authEntry.querySelector("[data-auth-guest]")?.addEventListener("click", () => {
    saveGuestSession();
    currentAuthUser = null;
    finishGuestMode();
  });
  authEntry.querySelectorAll("[data-pin-key]").forEach((button) => button.addEventListener("click", handlePinKey));
  authEntry.querySelector("[data-pin-skip]")?.addEventListener("click", () => finishAuthSuccess(currentAuthUser));
  authEntry.querySelector("[data-pin-forgot]")?.addEventListener("click", beginPinReset);
  authEntry.querySelector("[data-auth-logout]")?.addEventListener("click", () => {
    clearAuthSession();
    currentAuthUser = null;
    showAuth("choice", { pinBuffer: "", firstPin: "", pinPurpose: "setup" });
  });
}

function guestAccessMessage() {
  return userSettings.language === "Russian"
    ? "Для брони, оплаты, бонусной системы и полного доступа к объектам нужно авторизоваться."
    : "Sign in to book, pay, use rewards and unlock full stay details.";
}

function openGuestRestrictionModal(title = "ANIMA") {
  createSettingsModal(title, `
    <p class="settings-modal-text guest-gate-text">${guestAccessMessage()}</p>
    <div class="guest-gate-actions">
      <button class="secondary-button modal-close-button" type="button">${userSettings.language === "Russian" ? "Сделать позже" : "Later"}</button>
      <button class="gold-button" type="button" data-guest-auth>${userSettings.language === "Russian" ? "Авторизоваться" : "Sign in"}</button>
    </div>
  `, { centered: true, panelClass: "guest-gate-modal" });
}

function handleAuthProvider(provider) {
  const ru = userSettings.language === "Russian";
  if (provider === "reset") {
    authState.error = ru ? "Сброс пароля добавлю следующим шагом через email-flow." : "Password reset will be added through email flow next.";
    return renderAuthEntry();
  }
  if (provider === "telegram") {
    authState.error = ru
      ? "Для Telegram входа нужен bot token, domain и callback. UI уже готов, дальше подключу API."
      : "Telegram sign-in needs bot token, domain and callback. UI is ready; API is next.";
    return renderAuthEntry();
  }
  if (provider === "google") {
    authState.error = ru
      ? "Для Google входа нужен client id, redirect URI и callback endpoint. UI уже готов, дальше подключу API."
      : "Google sign-in needs client id, redirect URI and callback endpoint. UI is ready; API is next.";
    return renderAuthEntry();
  }
}

async function submitRegistration(event) {
  event.preventDefault();
  authState.error = "";
  const form = new FormData(event.currentTarget);
  const payload = Object.fromEntries(form.entries());
  if (payload.password !== payload.passwordRepeat) {
    authState.error = userSettings.language === "Russian" ? "Пароли не совпадают." : "Passwords do not match.";
    return renderAuthEntry();
  }
  try {
    const passwordHash = await sha256Hex(payload.password);
    const result = window.ANIMA_DB.beginRegistration({
      fullName: String(payload.fullName || "").trim(),
      birthDate: String(payload.birthDate || "").trim(),
      email: String(payload.email || "").trim(),
      username: String(payload.username || "").trim(),
      passwordHash,
      preferredCurrency: userSettings.currency,
      city: data.user.city,
    }, baseData);
    authState.pendingRegistration = { email: payload.email, code: result.code };
    authState.mailFallbackCode = "";
    try {
      await sendVerificationEmail(payload.email, result.code, "register");
    } catch {
      authState.mailFallbackCode = result.code;
    }
    showAuth("register-code");
  } catch (error) {
    authState.error = error.message === "USER_EXISTS"
      ? (userSettings.language === "Russian" ? "Такой пользователь уже существует." : "User already exists.")
      : (userSettings.language === "Russian" ? "Не удалось начать регистрацию." : "Unable to start registration.");
    renderAuthEntry();
  }
}

async function submitRegistrationCode(event) {
  event.preventDefault();
  authState.error = "";
  const code = String(new FormData(event.currentTarget).get("code") || "").trim();
  try {
    const user = window.ANIMA_DB.completeRegistration({
      email: authState.pendingRegistration.email,
      code,
    }, baseData);
    authState.pendingRegistration = null;
    authState.mailFallbackCode = "";
    saveAuthSession(user, { rememberMe: true });
    currentAuthUser = user;
    applyCurrentAuthUser();
    showAuth("pin-setup", { pinPurpose: "setup", pinBuffer: "", firstPin: "" });
  } catch (error) {
    authState.error = userSettings.language === "Russian" ? "Неверный или просроченный код." : "Invalid or expired code.";
    renderAuthEntry();
  }
}

async function submitLogin(event) {
  event.preventDefault();
  authState.error = "";
  const form = new FormData(event.currentTarget);
  try {
    authState.rememberMe = form.get("rememberMe") === "on";
    const result = window.ANIMA_DB.authenticate({
      login: String(form.get("login") || "").trim(),
      passwordHash: await sha256Hex(String(form.get("password") || "")),
    }, baseData);
    if (result.requiresTwoFactor) {
      authState.pendingLogin = { userId: result.user.id, code: result.code, rememberMe: authState.rememberMe };
      authState.mailFallbackCode = "";
      try {
        await sendVerificationEmail(result.user.email, result.code, "login");
      } catch {
        authState.mailFallbackCode = result.code;
      }
      return showAuth("login-code");
    }
    saveAuthSession(result.user, { rememberMe: authState.rememberMe });
    currentAuthUser = result.user;
    applyCurrentAuthUser();
    if (currentAuthUser.security?.pinEnabled) {
      showAuth("pin-unlock", { pinPurpose: "unlock", pinBuffer: "", firstPin: "" });
      return;
    }
    showAuth("pin-setup", { pinPurpose: "setup", pinBuffer: "", firstPin: "" });
  } catch {
    authState.error = userSettings.language === "Russian" ? "Неверный логин или пароль." : "Invalid login or password.";
    renderAuthEntry();
  }
}

function submitLoginCode(event) {
  event.preventDefault();
  authState.error = "";
  const code = String(new FormData(event.currentTarget).get("code") || "").trim();
  try {
    const rememberMe = Boolean(authState.pendingLogin?.rememberMe);
    const user = window.ANIMA_DB.verifyLoginCode({
      userId: authState.pendingLogin.userId,
      code,
    }, baseData);
    authState.pendingLogin = null;
    authState.mailFallbackCode = "";
    saveAuthSession(user, { rememberMe });
    currentAuthUser = user;
    applyCurrentAuthUser();
    if (currentAuthUser.security?.pinEnabled) {
      showAuth("pin-unlock", { pinPurpose: "unlock", pinBuffer: "", firstPin: "" });
      return;
    }
    showAuth("pin-setup", { pinPurpose: "setup", pinBuffer: "", firstPin: "" });
  } catch {
    authState.error = userSettings.language === "Russian" ? "Неверный код." : "Invalid code.";
    renderAuthEntry();
  }
}

async function beginPinReset() {
  const ru = userSettings.language === "Russian";
  if (!currentAuthUser?.email) {
    authState.error = ru ? "У аккаунта не привязана почта для сброса PIN." : "This account has no email attached for PIN reset.";
    return renderAuthEntry();
  }
  const code = String(Math.floor(Math.random() * 900000) + 100000);
  authState.pendingPinReset = {
    userId: currentAuthUser.id,
    code,
  };
  authState.mailFallbackCode = "";
  try {
    await sendVerificationEmail(currentAuthUser.email, code, "login");
  } catch {
    authState.mailFallbackCode = code;
  }
  showAuth("pin-unlock", {
    pinPurpose: "reset-code",
    pinBuffer: "",
    firstPin: "",
    error: "",
  });
}

function submitPinResetCode(event) {
  event.preventDefault();
  const ru = userSettings.language === "Russian";
  const code = String(new FormData(event.currentTarget).get("code") || "").trim();
  if (!authState.pendingPinReset?.code || code !== authState.pendingPinReset.code) {
    authState.error = ru ? "Неверный код из письма." : "Invalid code from email.";
    return renderAuthEntry();
  }
  authState.pendingPinReset = null;
  authState.mailFallbackCode = "";
  showAuth("pin-setup", {
    pinPurpose: "setup",
    pinBuffer: "",
    firstPin: "",
    error: "",
  });
}

async function handlePinKey(event) {
  const key = event.currentTarget.dataset.pinKey;
  if (key === "face") {
    authState.error = userSettings.language === "Russian" ? "Face ID подключим после device API. Пока доступен PIN." : "Face ID requires device API. Use PIN for now.";
    return renderAuthEntry();
  }
  if (key === "del") {
    authState.pinBuffer = authState.pinBuffer.slice(0, -1);
    return renderAuthEntry();
  }
  if (authState.pinBuffer.length >= 4) return;
  authState.pinBuffer += key;
  if (authState.pinBuffer.length < 4) return renderAuthEntry();
  if (authState.pinPurpose === "unlock") {
    const hash = await sha256Hex(authState.pinBuffer);
    if (hash !== currentAuthUser?.security?.pinHash) {
      authState.pinBuffer = "";
      authState.error = userSettings.language === "Russian" ? "Неверный PIN." : "Wrong PIN.";
      return renderAuthEntry();
    }
    unlockPin(currentAuthUser);
    return finishAuthSuccess(currentAuthUser);
  }
  if (!authState.firstPin) {
    authState.firstPin = authState.pinBuffer;
    authState.pinBuffer = "";
    authState.error = "";
    return renderAuthEntry();
  }
  if (authState.firstPin !== authState.pinBuffer) {
    authState.pinBuffer = "";
    authState.firstPin = "";
    authState.error = userSettings.language === "Russian" ? "PIN не совпал. Начните заново." : "PIN mismatch. Try again.";
    return renderAuthEntry();
  }
  const pinHash = await sha256Hex(authState.pinBuffer);
  currentAuthUser = window.ANIMA_DB.updateUser(currentAuthUser.id, {
    security: {
      ...(currentAuthUser.security || {}),
      pinEnabled: true,
      pinHash,
    },
  }, baseData);
  unlockPin(currentAuthUser);
  finishAuthSuccess(currentAuthUser);
}

function finishAuthSuccess(user) {
  const startedAt = typeof performance !== "undefined" ? performance.now() : 0;
  currentAuthUser = user;
  applyCurrentAuthUser();
  hideAuth();
  authState.error = "";
  authState.pinBuffer = "";
  authState.firstPin = "";
  phoneShell.hidden = false;
  if (currentScreen !== "home") navigateTo("home", { preserveHistory: false });
  applyI18n(document);
  refreshNotificationDot();
  logUserDataLoad();
  perfMark("finishAuthSuccess", startedAt);
}

function finishGuestMode() {
  const startedAt = typeof performance !== "undefined" ? performance.now() : 0;
  hideAuth();
  phoneShell.hidden = false;
  if (currentScreen !== "home") navigateTo("home", { preserveHistory: false });
  applyI18n(document);
  refreshNotificationDot();
  logUserDataLoad();
  perfMark("finishGuestMode", startedAt);
}

function startAuthFlow() {
  perfRun("startAuthFlow", () => {
    refreshCurrentAuthUser();
    if (!currentAuthUser) {
      showAuth("choice", { error: "", pinBuffer: "", firstPin: "", pinPurpose: "setup" });
      return;
    }
    applyCurrentAuthUser();
    if (currentAuthUser.security?.pinEnabled && !isPinUnlocked(currentAuthUser) && !hasTrustedDevice(currentAuthUser)) {
      phoneShell.hidden = false;
      showAuth("pin-unlock", { pinPurpose: "unlock", pinBuffer: "", firstPin: "" });
      return;
    }
    if (currentAuthUser.security?.pinEnabled && hasTrustedDevice(currentAuthUser)) {
      unlockPin(currentAuthUser);
    }
    finishAuthSuccess(currentAuthUser);
  });
}

const screenConfig = {
  explore: {
    title: "Explore",
    subtitle: "Stay, food, nature, transport and services across Dalat.",
    search: "Search ANIMA sections...",
    chips: [],
  },
  feed: {
    title: "Feed",
    subtitle: "What's happening in Dalat today.",
    search: "Search posts, places, events...",
    chips: ["For You", "Today", "Events", "Promotions", "New Places", "Community", "Digital Nomads", "Food", "Experiences"],
  },
  community: {
    title: "Community",
    subtitle: "Connect. Share. Grow together in Dalat.",
    search: "Search people, groups, posts, services...",
    chips: ["For You", "Nearby", "Trending", "Digital Nomads", "Events", "Services", "Housing"],
  },
  stay: {
    title: "Stay",
    subtitle: "Boutique nature living in the mountains.",
    search: "Search villas, apartments, hotels...",
    chips: ["Hotels", "Apartments", "Houses", "Villas"],
  },
  eat: {
    title: "Eat & Drink",
    subtitle: "Curated coffee culture, restaurants and local flavors of Dalat.",
    search: "Search cafes, restaurants, local food...",
    chips: ["Coffee", "Breakfast", "Vietnamese", "Healthy", "Vegetarian", "Bakery", "Fine Dining", "Pizza & Western", "Wellness Cafes", "Atmospheric Places"],
  },
  experiences: {
    title: "Experiences",
    subtitle: "Discover curated journeys around Dalat.",
    search: "",
    chips: ["Nature", "Romantic", "Adventure", "Coffee", "Relax", "Photography", "Wellness", "Premium"],
  },
  transport: {
    title: "Transport",
    subtitle: "Find the best way to move around Da Lat.",
    search: "Search bikes, taxis, transfers...",
    chips: ["Moto", "Bike / E-bike", "Bicycle", "Car", "Personal Driver", "Transfer", "Bus"],
  },
  saved: {
    title: "Saved",
    subtitle: "Your places, stays and experiences.",
    search: "Search your saved items...",
    chips: ["All", "Places", "Stay", "Food", "Transport", "Experiences", "Services", "Offers"],
  },
  profile: {
    title: "Profile",
    subtitle: "Account, rewards, preferences and ANIMA Plus.",
    search: "",
    chips: [],
  },
  "anima-plus": {
    title: "ANIMA Plus",
    subtitle: "Access the hidden side of Dalat.",
    search: "",
    chips: [],
  },
  rewards: {
    title: "Rewards",
    subtitle: "ANIMA Points, achievements and member offers.",
    search: "",
    chips: [],
  },
  jobs: {
    title: "Jobs",
    subtitle: "Find opportunities around you.",
    search: "Search jobs, freelance, remote work...",
    chips: ["Remote", "Local", "Part-time", "Full-time", "Freelance", "English-speaking", "Digital Nomad Friendly"],
  },
  services: {
    title: "Services",
    subtitle: "Find trusted people and useful services.",
    search: "Find local services...",
    chips: ["Creative", "Wellness", "Business", "Repair", "Tours", "Fitness", "Beauty", "Digital"],
  },
  "for-business": {
    title: "For Business",
    subtitle: "Grow your visibility with ANIMA.",
    search: "",
    chips: [],
  },
  "tech-solutions": {
    title: "Tech Solutions",
    subtitle: "Build your digital presence.",
    search: "",
    chips: [],
  },
  exchange: {
    title: "Exchange",
    subtitle: "Request currency exchange in Dalat.",
    search: "",
    chips: [],
  },
  map: {
    title: "Dalat Map",
    subtitle: "Explore routes, rewards and live city points.",
    search: "",
    chips: [],
  },
  store: {
    title: "ANIMA Store",
    subtitle: "Curated products from Dalat.",
    search: "",
    chips: [],
  },
  about: {
    title: "About ANIMA",
    subtitle: "The digital ecosystem of Dalat.",
    search: "",
    chips: [],
  },
  partners: {
    title: "Our Partners",
    subtitle: "Local brands powering the ANIMA ecosystem.",
    search: "",
    chips: [],
  },
  contact: {
    title: "Contact Us",
    subtitle: "Reach the ANIMA team and manager support.",
    search: "",
    chips: [],
  },
  assistant: {
    title: "AI Assistant",
    subtitle: "Your calm Digital Nature Lifestyle companion.",
    search: "",
    chips: [],
  },
  nearby: {
    title: "Nearby",
    subtitle: "Places and recommendations close to you.",
    search: "",
    chips: [],
  },
  emergency: {
    title: "Emergency",
    subtitle: "Vietnam emergency contacts and local help in Dalat.",
    search: "",
    chips: [],
  },
  search: {
    title: "Search",
    subtitle: "Find places, stays, food, services and more.",
    search: "",
    chips: [],
  },
};

const dataMap = {
  feed: data.feed,
  stay: data.stays,
  eat: data.restaurants,
  experiences: data.experiences,
  saved: data.savedItems,
  jobs: data.jobs,
  services: data.services,
  "tech-solutions": data.techSolutions,
};

document.querySelectorAll("[data-screen]").forEach((item) => {
  item.addEventListener("click", (event) => {
    event.preventDefault();
    navigateTo(item.dataset.screen);
  });
});

document.querySelectorAll(".category-card").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".category-card").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
  });
});

filterButton?.addEventListener("click", () => {
  if (searchInput) {
    searchInput.value = "";
    searchInput.focus();
  }
  hideSearchSuggestions();
});

document.querySelectorAll(".utility-nav a").forEach((item) => {
  item.addEventListener("click", (event) => {
    event.preventDefault();
    document.querySelectorAll(".utility-nav a").forEach((link) => link.classList.remove("active"));
    item.classList.add("active");
    if (item.dataset.screen) navigateTo(item.dataset.screen);
  });
});

syncLanguageState();
syncTopLanguage();
applyI18n(document);
startLocalTimeTicker();
refreshNotificationDot();
scheduleStartupTasks();
weatherInitTimeout = window.setTimeout(() => {
  perfRunAsync("initWeather", () => initWeather());
}, 900);

notificationsButton?.addEventListener("click", (event) => {
  event.stopPropagation();
  openUserNotifications();
});

document.addEventListener("click", (event) => {
  const overlay = document.querySelector(".notification-overlay");
  const panel = overlay?.querySelector(".notification-popover");
  if (!notificationState.open || !panel) return;
  if (panel.contains(event.target) || notificationsButton?.contains(event.target)) return;
  closeNotificationPanel();
});

languagePill?.addEventListener("click", (event) => {
  event.stopPropagation();
  const isOpen = languagePill.getAttribute("aria-expanded") === "true";
  languagePill.setAttribute("aria-expanded", String(!isOpen));
  languageMenu.hidden = isOpen;
});

languageMenu?.querySelectorAll("button").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const nextLanguage = button.dataset.lang || "English";
    if (nextLanguage !== userSettings.language) {
      setLanguage(nextLanguage);
    } else {
      renderWeather(latestWeather);
      renderLocalTime(new Date());
    }
    languagePill?.setAttribute("aria-expanded", "false");
    if (languageMenu) languageMenu.hidden = true;
  });
});

centerAction?.addEventListener("click", () => {
  const isOpen = centerAction.getAttribute("aria-expanded") === "true";
  isOpen ? closeHub() : openHub();
});

animaHub?.querySelectorAll('a[href="#"]:not([data-screen])').forEach((item) => {
  item.addEventListener("click", (event) => {
    event.preventDefault();
    const label = item.textContent.trim() || "ANIMA Hub";
    closeHub();
    if (label.includes("Scan QR")) openActionModal("Scan QR", "QR scanner is prepared for partner rewards and store checkout.");
    else if (label.includes("Emergency")) openActionModal("Emergency", "Emergency contact flow will connect to local support and manager escalation.");
    else if (label.includes("Support")) openActionModal("24/7 Support", "ANIMA support request is ready for manager contact.");
    else if (label.includes("Nearby")) openActionModal("Nearby", "Nearby recommendations will use map and location data in the next MVP stage.");
    else openActionModal(label, "This ANIMA Hub action is prepared for the next MVP stage.");
  });
});

document.addEventListener("click", (event) => {
  if (languageMenu && !languageMenu.hidden && !languageMenu.contains(event.target) && !languagePill?.contains(event.target)) {
    languageMenu.hidden = true;
    languagePill?.setAttribute("aria-expanded", "false");
  }
  if (!phoneShell?.classList.contains("hub-open")) return;
  const target = event.target;
  if (centerAction?.contains(target) || animaHub?.contains(target)) return;
  closeHub();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeHub();
});

document.addEventListener("click", (event) => {
  const detailButton = event.target.closest("[data-open-detail]");
  if (!detailButton) return;
  event.preventDefault();
  event.stopPropagation();
  openDetailScreen(detailButton.dataset.openDetail);
}, true);

document.addEventListener("click", (event) => {
  const guestDetail = event.target.closest("[data-guest-detail]");
  if (!guestDetail) return;
  event.preventDefault();
  event.stopPropagation();
  openGuestRestrictionModal(userSettings.language === "Russian" ? "Нужен вход" : "Sign in required");
}, true);

screenView?.addEventListener("click", (event) => {
  const detailButton = event.target.closest("[data-open-detail]");
  if (detailButton) {
    event.preventDefault();
    event.stopPropagation();
    openDetailScreen(detailButton.dataset.openDetail);
    return;
  }
  const detailCard = event.target.closest("[data-detail]");
  if (detailCard && !event.target.closest("button, a, input, textarea, select, label")) {
    openDetailScreen(detailCard.dataset.detail);
  }
});

searchSuggestions?.addEventListener("mousedown", (event) => {
  event.preventDefault();
});

searchSuggestions?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-search-index]");
  if (!button) return;
  const index = Number(button.dataset.searchIndex);
  handleSearchSelection(activeSearchSuggestions[index]);
});

function scheduleSearchSuggestions(query) {
  window.clearTimeout(searchDebounceTimer);
  searchDebounceTimer = window.setTimeout(() => {
    renderSearchSuggestions(query);
  }, 180);
}

window.__animaSearchInput = (value) => {
  currentSearchQuery = value;
  scheduleSearchSuggestions(value);
};

window.__animaSearchFocus = (value) => {
  buildSearchIndex();
  renderSearchSuggestions(value);
};

searchInput?.addEventListener("input", (event) => {
  currentSearchQuery = event.target.value;
  scheduleSearchSuggestions(currentSearchQuery);
});

searchInput?.addEventListener("focus", () => {
  buildSearchIndex();
  renderSearchSuggestions(searchInput.value);
});

searchInput?.addEventListener("keydown", (event) => {
  if (!activeSearchSuggestions.length && ["ArrowDown", "ArrowUp", "Enter"].includes(event.key)) {
    renderSearchSuggestions(searchInput?.value || "");
  }
  if (event.key === "ArrowDown") {
    event.preventDefault();
    if (!activeSearchSuggestions.length) return;
    activeSearchIndex = Math.min(activeSearchIndex + 1, activeSearchSuggestions.length - 1);
    syncSearchSuggestionState();
    return;
  }
  if (event.key === "ArrowUp") {
    event.preventDefault();
    if (!activeSearchSuggestions.length) return;
    activeSearchIndex = Math.max(activeSearchIndex - 1, 0);
    syncSearchSuggestionState();
    return;
  }
  if (event.key === "Enter") {
    event.preventDefault();
    if (activeSearchSuggestions[activeSearchIndex]) {
      handleSearchSelection(activeSearchSuggestions[activeSearchIndex]);
      return;
    }
    openSearchResults(searchInput.value);
    return;
  }
  if (event.key === "Escape") {
    hideSearchSuggestions();
  }
});

homeSearchForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (activeSearchSuggestions[activeSearchIndex]) {
    handleSearchSelection(activeSearchSuggestions[activeSearchIndex]);
    return;
  }
  openSearchResults(searchInput?.value || "");
});

document.addEventListener("click", (event) => {
  if (homeSearchForm?.contains(event.target) || searchSuggestions?.contains(event.target)) return;
  hideSearchSuggestions();
});

window.addEventListener("storage", (event) => {
  if (event.key === ADMIN_CONTENT_STORAGE_KEY) {
    adminContentDirty = true;
    refreshCurrentScreenFromAdmin();
  }
});

window.addEventListener("focus", () => {
  adminContentDirty = true;
  refreshCurrentScreenFromAdmin();
});

window.addEventListener("load", () => {
  logResourceSummary();
  perfMark("page.load", pageBootStartedAt);
});

function refreshCurrentScreenFromAdmin() {
  perfRun("refreshCurrentScreenFromAdmin.syncAdminContent", () => syncAdminContent(true));
  perfRun("refreshCurrentScreenFromAdmin.buildSearchIndex", () => buildSearchIndex());
  if (currentScreen === "home" || screenView.hidden) return;
  const html = perfRun(`renderScreen:${currentScreen}`, () => renderScreen(currentScreen));
  screenView.innerHTML = html;
  bindScreenActions();
  perfRun(`applyI18n:${currentScreen}`, () => applyI18n(screenView));
}

function navigateTo(screen, options = {}) {
  if (screen === "profile" && !currentAuthUser) {
    openGuestRestrictionModal(userSettings.language === "Russian" ? "Профиль" : "Profile");
    return;
  }
  syncAdminContent();
  if (!options.preserveHistory && screen !== currentScreen) {
    previousScreen = currentScreen;
    navigationStack.push(screen);
  }
  currentScreen = screen;
  closeHub();
  updateBottomNav(screen);

  if (screen === "home") {
    phoneShell.classList.remove("internal-screen");
    hero.hidden = false;
    homeContent.hidden = false;
    screenView.hidden = true;
    screenView.innerHTML = "";
    if (!options.preserveHistory) navigationStack.splice(0, navigationStack.length, "home");
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  hero.hidden = true;
  phoneShell.classList.add("internal-screen");
  homeContent.hidden = true;
  screenView.hidden = false;
  const html = perfRun(`renderScreen:${screen}`, () => renderScreen(screen));
  screenView.innerHTML = html;
  screenView.classList.remove("detail-enter");
  if (screen.startsWith("detail:")) {
    requestAnimationFrame(() => screenView.classList.add("detail-enter"));
  }
  bindScreenActions();
  applyI18n(screenView);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function goBack() {
  if (navigationStack.length > 1) navigationStack.pop();
  const target = navigationStack[navigationStack.length - 1] || previousScreen || "home";
  navigateTo(target, { preserveHistory: true });
}

function updateBottomNav(screen) {
  const exploreScreens = new Set(["explore", "stay", "eat", "experiences", "transport", "exchange", "services", "store", "jobs", "community", "tech-solutions"]);
  const businessScreens = new Set(["for-business", "partners", "contact"]);
  document.querySelectorAll(".bottom-nav a[data-screen]").forEach((link) => {
    const target = link.dataset.screen;
    const active = target === screen
      || (target === "explore" && exploreScreens.has(screen))
      || (target === "for-business" && businessScreens.has(screen));
    link.classList.toggle("active", active);
  });
}

function renderHeader(config, options = {}) {
  const showBack = options.back !== false;
  return `
    <header class="screen-header internal ${showBack ? "" : "root"}">
      <div class="screen-nav-row">
        ${
          showBack
            ? `<button class="back-button" type="button" data-back aria-label="Back">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
              </button>`
            : `<span class="nav-spacer" aria-hidden="true"></span>`
        }
        <h1>${config.title}</h1>
        <span class="nav-spacer" aria-hidden="true"></span>
      </div>
      <p>${config.subtitle}</p>
    </header>
  `;
}

function renderFilterChips(config) {
  if (!config.chips?.length) return "";
  const startedAt = typeof performance !== "undefined" ? performance.now() : 0;
  const html = `
    <div class="filter-chips">${config.chips.map((chip, index) => `<button class="${index === 0 ? "active" : ""}" type="button">${chip}</button>`).join("")}</div>
  `;
  perfMark("renderFilterChips.categories", startedAt);
  return html;
}

function renderFeature(item, fallbackTitle) {
  return `
    <article class="feature-card" style="--feature-img: url('${item.image || "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=900&q=80"}')">
      <button class="save-button ${isSavedTitle(item.title) ? "saved" : ""}" type="button" aria-label="Save ${item.title}" ${saveAttrs(item, item.category || fallbackTitle)}>♡</button>
      <div>
        <p>${item.category || fallbackTitle}</p>
        <h2>${item.title}</h2>
        <span>${formatCurrencyText(item.meta || item.price || "")}</span>
      </div>
      <div class="feature-footer">
        ${rewardBadge(item.points || 40)}
        <a class="gold-button" href="#">${item.cta || "View"}</a>
      </div>
    </article>
  `;
}

function rewardBadge(points) {
  return `<span class="reward-badge"><img src="./assets/anima-points-coin.png" alt="" aria-hidden="true" /> ${points} pts</span>`;
}

function t(key) {
  return I18N[userSettings.language]?.[key] || I18N.English[key] || key;
}

function translatePhrase(text) {
  const trimmed = text.trim();
  if (!trimmed) return text;
  const translated = userSettings.language === "Russian" ? phraseTranslations[trimmed] : reversePhraseTranslations[trimmed];
  if (!translated) return text;
  return text.replace(trimmed, translated);
}

function applyI18n(root = document) {
  const startedAt = typeof performance !== "undefined" ? performance.now() : 0;
  root.querySelectorAll("[data-i18n]").forEach((item) => {
    item.textContent = t(item.dataset.i18n);
  });
  root.querySelectorAll("[data-i18n-placeholder]").forEach((item) => {
    item.setAttribute("placeholder", t(item.dataset.i18nPlaceholder));
  });
  root.querySelectorAll("[data-i18n-aria]").forEach((item) => {
    item.setAttribute("aria-label", t(item.dataset.i18nAria));
  });

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || parent.closest("script, style, svg, [data-no-i18n]")) return NodeFilter.FILTER_REJECT;
      if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    node.nodeValue = translatePhrase(node.nodeValue);
  });
  perfMark(root === document ? "applyI18n:document" : "applyI18n:fragment", startedAt);
}

function localizeConfig(config) {
  return {
    ...config,
    title: translatePhrase(config.title || ""),
    subtitle: translatePhrase(config.subtitle || ""),
    search: translatePhrase(config.search || ""),
    chips: config.chips?.map((chip) => translatePhrase(chip)) || [],
  };
}

function syncTopLanguage() {
  const code = languageCodes[userSettings.language] || "EN";
  const label = languagePill?.querySelector("span");
  if (label) label.textContent = code;
}

function syncLanguageState() {
  const isRussian = userSettings.language === "Russian";
  document.documentElement.lang = isRussian ? "ru" : "en";
  phoneShell?.classList.toggle("language-russian", isRussian);
  phoneShell?.classList.toggle("language-english", !isRussian);
}

function setLanguage(language) {
  userSettings.language = language;
  safeStorageSet("anima.language", language);
  syncLanguageState();
  syncTopLanguage();
  applyI18n(document);
  renderWeather(latestWeather);
  renderLocalTime();
  if (currentScreen !== "home") {
    const html = perfRun(`renderScreen:${currentScreen}`, () => renderScreen(currentScreen));
    screenView.innerHTML = html;
    bindScreenActions();
    applyI18n(screenView);
  }
}

function setCurrency(currency) {
  userSettings.currency = currency;
  safeStorageSet("anima.currency", currency);
  if (currentScreen !== "home") {
    const html = perfRun(`renderScreen:${currentScreen}`, () => renderScreen(currentScreen));
    screenView.innerHTML = html;
    bindScreenActions();
    applyI18n(screenView);
  }
}

async function initWeather() {
  renderWeatherLoading();
  try {
    const weather = await window.AnimaWeatherService?.fetchCurrentWeather();
    latestWeather = weather;
    renderWeather(weather);
  } catch (error) {
    latestWeather = null;
    renderWeatherError();
  }
}

function formatLocalDate(now = new Date()) {
  const locale = userSettings.language === "Russian" ? "ru-RU" : "en-GB";
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(now);
}

function formatLocalClock(now = new Date()) {
  const locale = userSettings.language === "Russian" ? "ru-RU" : "en-GB";
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(now);
}

function getDalatTimeParts(now = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Ho_Chi_Minh",
  });
  const parts = formatter.formatToParts(now);
  const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return {
    hour: Number(values.hour || 0),
    minute: Number(values.minute || 0),
    second: Number(values.second || 0),
  };
}

function preloadHeroBackgrounds(now = new Date()) {
  const current = getHeroBackgroundForTime(now).src;
  const currentIndex = HERO_BACKGROUND_SCHEDULES.findIndex((item) => item.src === current);
  const next = HERO_BACKGROUND_SCHEDULES[(currentIndex + 1 + HERO_BACKGROUND_SCHEDULES.length) % HERO_BACKGROUND_SCHEDULES.length]?.src;
  [current, next, HERO_RAIN_BACKGROUND_SRC].filter(Boolean).forEach((src) => {
    const image = new Image();
    image.decoding = "async";
    image.src = src;
  });
}

function isRainyWeather(weather = latestWeather) {
  return Boolean(weather && RAINY_WEATHER_CODES.has(Number(weather.code)));
}

function getHeroBackgroundForTime(now = new Date()) {
  const { hour, minute } = getDalatTimeParts(now);
  const currentMinute = hour * 60 + minute;
  return HERO_BACKGROUND_SCHEDULES.find((range) => currentMinute >= range.startMinute && currentMinute <= range.endMinute) || HERO_BACKGROUND_SCHEDULES[0];
}

function getHeroGreetingForTime(now = new Date()) {
  const { hour, minute } = getDalatTimeParts(now);
  const currentMinute = hour * 60 + minute;
  const range = HERO_GREETING_SCHEDULES.find((item) => currentMinute >= item.startMinute && currentMinute <= item.endMinute) || HERO_GREETING_SCHEDULES[0];
  const greetings = userSettings.language === "Russian"
    ? {
        morning: "Доброе утро,",
        afternoon: "Добрый день,",
        evening: "Добрый вечер,",
        night: "Доброй ночи!",
        "late-night": "Доброй ночи!",
      }
    : {
        morning: "Good morning,",
        afternoon: "Good afternoon,",
        evening: "Good evening,",
        night: "Good night!",
        "late-night": "Good night!",
      };
  return greetings[range.key] || greetings.morning;
}

function getNextHeroChangeTime(now = new Date()) {
  const { second } = getDalatTimeParts(now);
  const nextTime = new Date(now);
  nextTime.setSeconds(nextTime.getSeconds() + Math.max(1, 60 - second), 50);
  return nextTime;
}

function applyHeroBackground(src) {
  const hero = document.querySelector(".hero");
  if (!hero || !src) return;
  if (!activeHeroBackground) {
    activeHeroBackground = src;
    hero.style.setProperty("--hero-background-image", `url("${src}")`);
    hero.style.setProperty("--hero-background-next-image", `url("${src}")`);
    hero.classList.remove("hero-transitioning");
    return;
  }
  if (activeHeroBackground === src) return;
  hero.style.setProperty("--hero-background-next-image", `url("${src}")`);
  hero.classList.add("hero-transitioning");
  window.clearTimeout(heroTransitionTimeout);
  heroTransitionTimeout = window.setTimeout(() => {
    hero.style.setProperty("--hero-background-image", `url("${src}")`);
    hero.classList.remove("hero-transitioning");
    activeHeroBackground = src;
  }, HERO_BACKGROUND_TRANSITION_MS);
}

function applyHeroAtmosphere(now = new Date()) {
  const greeting = document.querySelector('[data-i18n="home.goodMorning"]');
  const src = isRainyWeather() ? HERO_RAIN_BACKGROUND_SRC : getHeroBackgroundForTime(now).src;
  applyHeroBackground(src);
  if (greeting) greeting.textContent = getHeroGreetingForTime(now);
}

function scheduleHeroBackgroundUpdate(now = new Date()) {
  window.clearTimeout(heroBackgroundTimeout);
  const nextChangeTime = getNextHeroChangeTime(now);
  const delay = Math.max(1000, nextChangeTime.getTime() - now.getTime() + 50);
  heroBackgroundTimeout = window.setTimeout(() => {
    const currentNow = new Date();
    applyHeroAtmosphere(currentNow);
    scheduleHeroBackgroundUpdate(currentNow);
  }, delay);
}

function renderLocalTime(now = new Date()) {
  const card = document.querySelector("[data-time-card]");
  if (!card) return;
  card.querySelector("[data-time-current]").textContent = formatLocalClock(now);
  card.querySelector("[data-time-date]").textContent = formatLocalDate(now);
  applyHeroAtmosphere(now);
}

function startLocalTimeTicker() {
  const now = new Date();
  renderLocalTime(now);
  window.setTimeout(() => preloadHeroBackgrounds(now), 120);
  scheduleHeroBackgroundUpdate(now);
  if (localTimeTicker) window.clearInterval(localTimeTicker);
  localTimeTicker = window.setInterval(() => renderLocalTime(new Date()), 30000);
}

function renderWeatherLoading() {
  const card = document.querySelector("[data-weather-card]");
  if (!card) return;
  card.classList.add("loading");
  card.classList.remove("error");
  card.querySelector("[data-weather-condition]").textContent = t("weather.loading");
}

function renderWeatherError() {
  const card = document.querySelector("[data-weather-card]");
  if (!card) return;
  card.classList.remove("loading");
  card.classList.add("error");
  card.querySelector("[data-weather-icon]").textContent = "🌥";
  card.querySelector("[data-weather-temp]").textContent = "--°C";
  card.querySelector("[data-weather-condition]").textContent = t("weather.unavailable");
  card.querySelector("[data-weather-feels]").textContent = "--°C";
  card.querySelector("[data-weather-humidity]").textContent = "--%";
  card.querySelector("[data-weather-wind]").textContent = "-- km/h";
  card.querySelector("[data-weather-updated]").textContent = "";
  applyHeroAtmosphere();
}

function renderWeather(weather) {
  if (!weather) {
    renderWeatherError();
    return;
  }
  const card = document.querySelector("[data-weather-card]");
  if (!card) return;
  const condition = userSettings.language === "Russian"
    ? weatherConditionTranslations[weather.condition] || weather.condition
    : weather.condition;
  card.classList.remove("loading", "error");
  card.querySelector("[data-weather-icon]").textContent = weather.icon;
  card.querySelector("[data-weather-temp]").textContent = `${weather.temperature}°C`;
  card.querySelector("[data-weather-condition]").textContent = condition;
  card.querySelector("[data-weather-feels]").textContent = `${weather.feelsLike}°C`;
  card.querySelector("[data-weather-humidity]").textContent = `${weather.humidity}%`;
  card.querySelector("[data-weather-wind]").textContent = `${weather.wind} km/h`;
  card.querySelector("[data-weather-updated]").textContent = `${t("weather.updated")} ${formatWeatherTime(weather.updatedAt)}`;
  applyHeroAtmosphere();
}

function formatWeatherTime(value) {
  if (!value) return "";
  const locale = userSettings.language === "Russian" ? "ru-RU" : "en-US";
  return new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function formatCurrencyText(value) {
  if (!value) return value;
  if (userSettings.currency === "VND") {
    return String(value).replace(/\$([\d,.]+)/g, (_, amount) => {
      const usd = Number(amount.replace(/,/g, ""));
      return `${Math.round(usd * data.user.currencyRates.USD).toLocaleString("en-US")} VND`;
    });
  }
  return String(value).replace(/(?:From\s*)?\$([\d,.]+)/g, (_, amount) => {
    const usd = Number(amount.replace(/,/g, ""));
    return formatMoney(usd * data.user.currencyRates.USD, userSettings.currency, value.startsWith("From") ? "From " : "");
  }).replace(/(?:From\s*)?([\d,.]+)(?:M)?(?:-([\d,.]+)(?:M)?)?\s*VND/g, (match, first, second) => {
    const isFrom = match.startsWith("From");
    const isMillion = /M/.test(match);
    const firstVnd = Number(first.replace(/,/g, "")) * (isMillion ? 1000000 : 1);
    if (second) {
      const secondVnd = Number(second.replace(/,/g, "")) * (isMillion ? 1000000 : 1);
      return `${isFrom ? "From " : ""}${formatMoney(firstVnd, userSettings.currency)} - ${formatMoney(secondVnd, userSettings.currency)}`;
    }
    return formatMoney(firstVnd, userSettings.currency, isFrom ? "From " : "");
  });
}

function formatPriceMap(priceMap, fallback = "") {
  if (!priceMap || typeof priceMap !== "object" || !window.ANIMA_DB) return formatCurrencyText(fallback);
  return window.ANIMA_DB.formatStoredPrice(priceMap, userSettings.currency, fallback) || formatCurrencyText(fallback);
}

function displayItemPrice(item, fallback = "") {
  return formatPriceMap(item?.priceMap || item?.salaryMap, item?.price || item?.salary || fallback);
}

function isRussianLanguage() {
  return userSettings.language === "Russian";
}

function verifiedAnimaLabel() {
  return isRussianLanguage() ? "✓ Проверено ANIMA" : "✓ Verified by ANIMA";
}

function detailsLabel() {
  return isRussianLanguage() ? "Посмотреть детали" : "View details";
}

function localizeStayType(value) {
  if (!isRussianLanguage()) return value || "";
  const typeMap = {
    "Lake Hotel": "Отель у озера",
    "Lake Resort": "Курорт у озера",
    "City Hotel": "Городской отель",
    Hotel: "Отель",
    Apartment: "Апартаменты",
    Villa: "Вилла",
    House: "Дом",
    "Nature stay": "Жильё на природе",
  };
  return typeMap[value] || translatePhrase(value || "");
}

function localizeStayPlaceText(value) {
  if (!value || !isRussianLanguage()) return value || "";
  return String(value)
    .replace(/^City Center$/i, "центр")
    .replace(/^Central Dalat$/i, "центр Далата")
    .replace(/^Dalat center$/i, "центр Далата")
    .replace(/^(.+?) area$/i, "район $1")
    .replace(/(\d+(?:[.,]\d+)?)\s*km from center/gi, "$1 км от центра")
    .replace(/(\d+(?:[.,]\d+)?)\s*m from center/gi, "$1 м от центра");
}

function pluralRu(count, forms) {
  const abs = Math.abs(Number(count));
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}

function stayCapacityText(stay) {
  const guests = Number(stay.guests) || 0;
  const bedrooms = Number(stay.bedrooms) || 0;
  const baths = Number(stay.baths) || 0;
  const parts = [];
  if (!isRussianLanguage()) {
    if (guests) parts.push(`${guests} ${guests === 1 ? "guest" : "guests"}`);
    if (bedrooms) parts.push(`${bedrooms} ${bedrooms === 1 ? "bedroom" : "bedrooms"}`);
    if (baths) parts.push(`${baths} ${baths === 1 ? "bath" : "baths"}`);
    if (stay.hasKitchen) parts.push("Kitchen");
    return parts.join(" · ");
  }
  if (guests) parts.push(`${guests} ${pluralRu(guests, ["гость", "гостя", "гостей"])}`);
  if (bedrooms) parts.push(`${bedrooms} ${pluralRu(bedrooms, ["спальня", "спальни", "спален"])}`);
  if (baths) parts.push(`${baths} ${pluralRu(baths, ["ванная", "ванные", "ванных"])}`);
  if (stay.hasKitchen) parts.push("кухня");
  return parts.join(" · ");
}

function localizePriceType(value) {
  if (!value || value === "undefined") return "";
  if (!isRussianLanguage()) return value;
  return String(value)
    .replace("/ night", "/ ночь")
    .replace("/ month", "/ месяц");
}

function stayPriceText(stay) {
  const amount = formatPriceMap(stay.priceMap, stay.price || "");
  const priceType = localizePriceType(stay.priceType);
  return [amount, priceType].filter(Boolean).join(" ");
}

function stayFactLabel(label) {
  if (!isRussianLanguage()) return label;
  return {
    Guests: "Гости",
    Bedrooms: "Спальни",
    Beds: "Кровати",
    Baths: "Ванные",
    Size: "Площадь",
  }[label] || label;
}

function contactLabel() {
  return isRussianLanguage() ? "Связаться" : "Contact";
}

function formatMoney(vnd, currency, prefix = "") {
  const rate = data.user.currencyRates[currency] || 1;
  const converted = vnd / rate;
  if (currency === "USD") return `${prefix}$${Math.round(converted).toLocaleString("en-US")}`;
  return `${prefix}${Math.round(converted).toLocaleString("en-US")} ${currencySymbols[currency] || currency}`;
}

function actionAttrs(label, message = "") {
  return `data-action-title="${escapeAttr(label)}" data-action-message="${escapeAttr(message || `${label} request is ready for the next MVP stage.`)}"`;
}

function saveAttrs(item, type) {
  const payload = {
    title: item.title,
    type,
    category: item.category || type,
    image: item.image || "",
    location: item.location || item.meta || "Dalat",
    tags: item.tags || [item.category || type],
  };
  return `data-save-item="${escapeAttr(JSON.stringify(payload))}"`;
}

function isSavedTitle(title) {
  return savedCollection.some((item) => item.title === title);
}

function toggleSavedItem(item) {
  const index = savedCollection.findIndex((saved) => saved.title === item.title);
  if (index >= 0) savedCollection.splice(index, 1);
  else savedCollection.push(item);
  safeStorageSet("anima.saved.collection", JSON.stringify(savedCollection));
  return index < 0;
}

function escapeAttr(value) {
  return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeJsString(value) {
  return JSON.stringify(String(value ?? "")).slice(1, -1);
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

function listingCard(item) {
  return `
    <article class="listing-card" data-detail="${item.title}">
      <div>
        <p>${item.category}</p>
        <h3>${item.title}</h3>
        <span>${formatCurrencyText(item.meta || item.price || "")}</span>
      </div>
      <div class="listing-actions">
        ${item.points ? rewardBadge(item.points) : ""}
        <button class="save-button inline ${isSavedTitle(item.title) ? "saved" : ""}" type="button" aria-label="Save ${item.title}" ${saveAttrs(item, item.category || "Places")}>♡</button>
      </div>
    </article>
  `;
}

function horizontalCards(items) {
  return `<div class="horizontal-list">${items.map((item) => `<article><h3>${item.title}</h3><p>${item.category}</p><span>${item.meta}</span></article>`).join("")}</div>`;
}

function renderScreen(screen) {
  const config = localizeConfig(screenConfig[screen] || {});
  if (screen.startsWith("detail:")) return renderDetail(screen.slice(7));
  if (screen === "search") return renderSearchResults(config);
  if (screen === "profile") return renderProfile(config);
  if (screen === "explore") return renderExplore(config);
  if (screen === "anima-plus") return renderAnimaPlusDetails(config);
  if (screen === "rewards") return renderRewardsCenter(config);
  if (screen === "feed") return renderFeed(config);
  if (screen === "saved") return renderSaved(config);
  if (screen === "bookings") return renderBookingsScreen(config);
  if (screen === "community") return renderCommunity(config);
  if (screen === "stay") return renderStay(config);
  if (screen === "eat") return renderEat(config);
  if (screen === "experiences") return renderExperiences(config);
  if (screen === "transport") return renderTransport(config);
  if (screen === "for-business") return renderBusiness(config);
  if (screen === "tech-solutions") return renderTechSolutions(config);
  if (screen === "jobs") return renderJobs(config);
  if (screen === "services") return renderServices(config);
  if (screen === "exchange") return renderExchange(config);
  if (screen === "map") return renderMap(config);
  if (screen === "store") return renderStore(config);
  if (screen === "about") return renderAbout(config);
  if (screen === "partners") return renderPartners(config);
  if (screen === "contact") return renderContact(config);
  if (screen === "assistant") return renderAssistant(config);
  if (screen === "nearby") return renderNearby(config);
  if (screen === "emergency") return renderEmergency(config);

  const items = dataMap[screen] || [];
  const feature = items[0];
  const rest = items.slice(1);
  const extra = renderScreenExtra(screen);

  return `
    <div class="screen-inner">
      ${renderHeader(config, { back: !rootScreens.has(screen) })}
      ${renderFilterChips(config)}
      ${feature ? renderFeature(feature, config.title) : ""}
      ${extra}
      <section class="screen-section">
        <div class="section-heading compact"><h2>${sectionTitle(screen)}</h2><a href="#">See all</a></div>
        <div class="listing-stack">${rest.map(listingCard).join("")}</div>
      </section>
    </div>
  `;
}

function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function searchCardMeta(item) {
  return [
    item.location,
    item.distance,
    item.description,
    item.text,
    item.category,
    item.type,
    item.stayGroup,
    item.badge,
    item.meta,
    ...(item.tags || []),
    ...(item.highlights || []),
  ].filter(Boolean).join(" · ");
}

function searchResultEntry(item, screen, kind) {
  return {
    title: item.title,
    category: item.category || item.type || kind,
    meta: searchCardMeta(item),
    image: item.image || "",
    points: item.points || 0,
    detailTitle: item.detailTitle || item.title,
    screen,
  };
}

function uniqueSearchItems(items = []) {
  const seen = new Set();
  return items.filter((item) => {
    const key = normalizeSearchText(`${item.screen}:${item.detailTitle || item.title}`);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getSearchIndex() {
  const startedAt = typeof performance !== "undefined" ? performance.now() : 0;
  syncAdminContent();
  const adminEntries = readAdminEntries().filter((entry) => entry.status === "published");
  const moduleMap = {
    stay: ["stay", "Stay", isRussianLanguage() ? "Жильё" : "Stay"],
    eat: ["eat", "Food", isRussianLanguage() ? "Еда и напитки" : "Eat & Drink"],
    experiences: ["experiences", "Experience", isRussianLanguage() ? "Впечатления" : "Experiences"],
    services: ["services", "Service", isRussianLanguage() ? "Сервисы" : "Services"],
    jobs: ["jobs", "Job", isRussianLanguage() ? "Работа" : "Jobs"],
    feed: ["feed", "Feed", isRussianLanguage() ? "Лента" : "Feed"],
    community: ["community", "Community", isRussianLanguage() ? "Сообщество" : "Community"],
  };

  const baseItems = [
    ...data.stays.map((item) => ({ ...searchResultEntry(item, "stay", "Stay"), groupLabel: isRussianLanguage() ? "Жильё" : "Stay" })),
    ...data.restaurants.map((item) => ({ ...searchResultEntry(item, "eat", "Food"), groupLabel: isRussianLanguage() ? "Еда и напитки" : "Eat & Drink" })),
    ...data.experiences.map((item) => ({ ...searchResultEntry(item, "experiences", "Experience"), groupLabel: isRussianLanguage() ? "Впечатления" : "Experiences" })),
    ...data.services.map((item) => ({ ...searchResultEntry(item, "services", "Service"), groupLabel: isRussianLanguage() ? "Сервисы" : "Services" })),
    ...data.jobs.map((item) => ({ ...searchResultEntry(item, "jobs", "Job"), groupLabel: isRussianLanguage() ? "Работа" : "Jobs" })),
    ...data.feed.map((item) => ({ ...searchResultEntry(item, "feed", "Feed"), groupLabel: isRussianLanguage() ? "Лента" : "Feed" })),
    ...data.places.map((item) => ({ ...searchResultEntry(item, "home", "Place"), groupLabel: isRussianLanguage() ? "Места" : "Places" })),
  ];

  const adminItems = adminEntries.map((entry) => {
    const normalized = normalizeAdminEntry(entry);
    const [screen, kind, groupLabel] = moduleMap[entry.module] || [entry.module || "home", "Place", isRussianLanguage() ? "Результат" : "Result"];
    return {
      ...searchResultEntry(normalized, screen, kind),
      groupLabel,
    };
  });

  const fallbackItems = [
    {
      title: "Dalat",
      category: "City",
      meta: "Vietnam · Highlands destination",
      groupLabel: isRussianLanguage() ? "Города" : "Cities",
      detailTitle: "",
      screen: "home",
    },
    {
      title: "Da Lat",
      category: "City",
      meta: "Vietnam · Highlands destination",
      groupLabel: isRussianLanguage() ? "Города" : "Cities",
      detailTitle: "",
      screen: "home",
    },
  ];

  const items = uniqueSearchItems([...adminItems, ...baseItems, ...fallbackItems]);
  perfMark("getSearchIndex", startedAt);
  return items;
}

function buildSearchIndex() {
  const startedAt = typeof performance !== "undefined" ? performance.now() : 0;
  const locale = userSettings.language;
  if (searchIndexCache.length && searchIndexLocale === locale) return searchIndexCache;
  searchIndexCache = getSearchIndex().map((item) => ({
    ...item,
    searchableText: normalizeSearchText([
      item.title,
      item.category,
      item.meta,
      item.groupLabel,
      item.screen,
    ].join(" ")),
  }));
  searchIndexLocale = locale;
  perfMark("buildSearchIndex", startedAt);
  return searchIndexCache;
}

function ensureSearchIndex() {
  if (searchIndexCache.length) return searchIndexCache;
  return buildSearchIndex();
}

function getPopularSearchItems() {
  return ensureSearchIndex().slice(0, 5);
}

function getAutocompleteResults(query) {
  const needle = normalizeSearchText(query);
  if (!needle) return getPopularSearchItems();
  return ensureSearchIndex()
    .filter((item) => item.searchableText.includes(needle))
    .slice(0, 6);
}

function hideSearchSuggestions() {
  activeSearchSuggestions = [];
  activeSearchIndex = -1;
  if (!searchSuggestions) return;
  searchSuggestions.innerHTML = "";
  searchSuggestions.style.display = "none";
  searchInput?.setAttribute("aria-expanded", "false");
}

function syncSearchSuggestionState() {
  if (!searchSuggestions) return;
  searchSuggestions.querySelectorAll("[data-search-index]").forEach((button) => {
    const index = Number(button.dataset.searchIndex);
    const active = index === activeSearchIndex;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", active ? "true" : "false");
    if (active) button.scrollIntoView({ block: "nearest" });
  });
}

function handleSearchSelection(item) {
  if (!item) return;
  if (searchInput) searchInput.value = item.title;
  currentSearchQuery = item.title;
  hideSearchSuggestions();
  if (item.detailTitle) {
    if (currentAuthUser) {
      openDetailScreen(item.detailTitle);
    } else {
      openGuestRestrictionModal(userSettings.language === "Russian" ? "Нужен вход" : "Sign in required");
    }
    return;
  }
  navigateTo(item.screen || "home", { preserveHistory: true });
}

function findSearchItemByTitle(value) {
  const needle = normalizeSearchText(value);
  if (!needle) return null;
  return ensureSearchIndex().find((item) => normalizeSearchText(item.title) === needle) || null;
}

function renderSearchSuggestions(query) {
  if (!searchSuggestions) return;
  const normalized = String(query || "").trim();
  activeSearchSuggestions = getAutocompleteResults(normalized);
  activeSearchIndex = activeSearchSuggestions.length ? 0 : -1;
  searchSuggestions.innerHTML = activeSearchSuggestions.length
    ? activeSearchSuggestions.map((item, index) => `
        <button
          class="search-suggestion-item ${index === 0 ? "active" : ""}"
          type="button"
          role="option"
          aria-selected="${index === 0 ? "true" : "false"}"
          data-search-pick="${escapeAttr(item.detailTitle)}"
          data-search-index="${index}"
        >
          <strong>${escapeHtml(item.title)}</strong>
          <span>${escapeHtml(translatePhrase(item.groupLabel))} · ${escapeHtml(translatePhrase(item.category || ""))}</span>
        </button>
      `).join("")
    : `
      <div class="search-suggestion-item search-suggestion-empty">
        <strong>${isRussianLanguage() ? "Ничего не найдено" : "Nothing found"}</strong>
        <span>${isRussianLanguage() ? "Попробуйте другой запрос" : "Try another query"}</span>
      </div>
    `;
  searchSuggestions.style.display = "grid";
  searchInput?.setAttribute("aria-expanded", "true");
}

function getSearchResultGroups(query) {
  const needle = normalizeSearchText(query);
  if (!needle) return [];
  const buckets = new Map();
  ensureSearchIndex()
    .filter((item) => item.searchableText.includes(needle))
    .forEach((item) => {
      const key = item.groupLabel;
      if (!buckets.has(key)) buckets.set(key, []);
      if (buckets.get(key).length < 6) buckets.get(key).push(item);
    });
  return Array.from(buckets.entries()).map(([label, items]) => ({ label, items }));
}

function getBestSearchMatch(query) {
  const needle = normalizeSearchText(query);
  if (!needle) return null;
  const suggestions = getAutocompleteResults(needle);
  const exact = suggestions.find((item) => normalizeSearchText(item.title) === needle);
  return exact || suggestions[0] || null;
}

function renderSearchResults(config) {
  const groups = getSearchResultGroups(currentSearchQuery);
  const placeholder = isRussianLanguage() ? "Поиск мест, жилья, еды, сервисов..." : "Search places, stays, food, services...";
  const emptyTitle = isRussianLanguage() ? "Ничего не найдено" : "Nothing found";
  const emptyText = isRussianLanguage()
    ? "Попробуйте другой запрос: название места, район, тип жилья или категорию."
    : "Try another keyword: place name, area, stay type or category.";
  return `
    <div class="screen-inner search-screen">
      ${renderHeader({
        title: isRussianLanguage() ? "Поиск" : config.title,
        subtitle: currentSearchQuery
          ? (isRussianLanguage() ? `Результаты по запросу: ${currentSearchQuery}` : `Results for: ${currentSearchQuery}`)
          : (isRussianLanguage() ? "Ищите места, жильё, еду и сервисы." : config.subtitle),
      }, { back: true })}
      <form class="screen-search" data-search-form>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m16.5 16.5 4 4" />
        </svg>
        <input type="search" value="${escapeHtml(currentSearchQuery)}" placeholder="${escapeHtml(placeholder)}" data-search-results-input />
      </form>
      ${
        groups.length
          ? groups.map((group) => `
              <section class="screen-section">
                <div class="section-heading compact">
                  <h2>${group.label}</h2>
                  <span>${group.items.length}</span>
                </div>
                <div class="listing-stack">
                  ${group.items.map((item) => `
                    <article class="listing-card" ${currentAuthUser ? `data-open-detail="${escapeAttr(item.detailTitle)}"` : `data-guest-detail="${escapeAttr(item.detailTitle)}"`}>
                      <div>
                        <p>${escapeHtml(translatePhrase(item.category || ""))}</p>
                        <h3>${escapeHtml(item.title)}</h3>
                        <span>${escapeHtml(translatePhrase(item.meta || ""))}</span>
                      </div>
                    </article>
                  `).join("")}
                </div>
              </section>
            `).join("")
          : `
            <section class="screen-section">
              <article class="listing-card">
                <div>
                  <p>${isRussianLanguage() ? "Поиск" : "Search"}</p>
                  <h3>${emptyTitle}</h3>
                  <span>${emptyText}</span>
                </div>
              </article>
            </section>
          `
      }
    </div>
  `;
}

function renderStore(config) {
  const categories = storeCategories();
  const startedAt = typeof performance !== "undefined" ? performance.now() : 0;
  const html = `
    <div class="screen-inner store-screen">
      <header class="store-header">
        <button class="back-button store-back" type="button" data-back aria-label="Back">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <h1 class="brand-title" aria-label="ANIMA Store"><span>ΛNIMΛ</span> Store</h1>
        <button class="store-cart-button" type="button" data-store-cart aria-label="Open cart">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8h12l-1 12H7L6 8Z" /><path d="M9 8a3 3 0 0 1 6 0" /></svg>
          <span>${storeCartCount()}</span>
        </button>
      </header>

      <a class="store-welcome-card" href="#store-products" aria-label="Explore ANIMA Store products">
        <img src="./assets/anima-store-card.jpg" alt="ANIMA Store curated products from Dalat" loading="lazy" decoding="async" />
      </a>

      <nav class="store-category-row" id="store-products" aria-label="Store categories">
        ${categories.map(([label, icon], index) => `
          <button class="${label === selectedStoreCategory ? "active" : ""}" type="button" data-store-category="${label}">
            ${storeIcon(icon)}
            <span>${translatePhrase(label)}</span>
          </button>
        `).join("")}
      </nav>

      <section class="store-shelf" data-store-product-area>
        ${renderStoreProductArea()}
      </section>

      <aside class="store-cart-panel" aria-live="polite" hidden>
        ${renderStoreCart()}
      </aside>
      <div class="store-toast" aria-live="polite" hidden>Added to cart</div>
    </div>
  `;
  perfMark("renderStore.qr-module", startedAt);
  return html;
}

function storeCategories() {
  return [
    ["Coffee", "coffee"],
    ["Honey & Bee Products", "honey"],
    ["Strawberry", "strawberry"],
    ["Dairy Products", "dairy"],
    ["Flowers", "flower"],
    ["Merch", "shirt"],
    ["Gift Sets", "gift"],
    ["Eco Products", "eco"],
  ];
}

function storeProducts() {
  const adminProducts = (data.adminStoreProducts || []).map((item) => [
    item.id,
    item.category,
    item.title,
    item.size,
    item.price,
    item.priceMap || {},
    item.visual || "gift",
    item.image,
  ]);
  return adminProducts;
}

function renderStoreProductArea() {
  const products = storeProducts().filter((item) => item[1] === selectedStoreCategory);
  return `
    <div class="store-shelf-heading">
      <h2>${translatePhrase(selectedStoreCategory)}</h2>
      <span>${isRussianLanguage() ? "Товары из Далата" : "Digital Nature Lifestyle goods"}</span>
    </div>
    <div class="store-product-grid">
      ${products.map(renderStoreProduct).join("")}
    </div>
  `;
}

function storeIcon(type) {
  const icons = {
    honey: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 14c4-1 7-4 8-8 2 2 3 6 0 9-2 2-5 3-8 3Z" /><path d="M15 6l3-3" /><path d="M6 18c-1 2-1 3 1 3s2-1 1-3" /></svg>`,
    coffee: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9h11v6a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5V9Z" /><path d="M17 11h1a3 3 0 0 1 0 6h-1" /><path d="M8 5v2M12 4v3M16 5v2" /></svg>`,
    strawberry: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8c4 0 7 3 7 7 0 5-3 7-7 7s-7-2-7-7c0-4 3-7 7-7Z" /><path d="M9 4c1 2 5 2 6 0" /><path d="M12 8V3" /></svg>`,
    flower: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="2" /><path d="M12 4c2 2 2 4 0 6-2-2-2-4 0-6ZM12 20c-2-2-2-4 0-6 2 2 2 4 0 6ZM4 12c2-2 4-2 6 0-2 2-4 2-6 0ZM20 12c-2 2-4 2-6 0 2-2 4-2 6 0Z" /></svg>`,
    shirt: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4 4 7l3 4 1-1v10h8V10l1 1 3-4-4-3-2 2h-4L8 4Z" /></svg>`,
    gift: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10h16v10H4z" /><path d="M12 10v10M4 14h16" /><path d="M12 10c-4 0-5-5-2-5 2 0 2 3 2 5Zm0 0c4 0 5-5 2-5-2 0-2 3-2 5Z" /></svg>`,
    dairy: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6l1 5v12H8V8l1-5Z" /><path d="M8 9h8" /></svg>`,
    eco: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19c8 0 13-5 14-14-8 1-13 6-14 14Z" /><path d="M5 19c3-4 6-7 10-9" /></svg>`,
  };
  return icons[type] || icons.gift;
}

function renderStoreProduct([id, category, title, size, price, priceMap, visual, customImage]) {
  const isSaved = storeFavorites.has(id);
  const image = customImage || `./assets/store-products/${id}.png`;
  return `
    <article class="store-product-card">
      <button class="store-favorite ${isSaved ? "saved" : ""}" type="button" data-store-favorite="${id}" aria-label="Add ${title} to favorites">♡</button>
      <div class="store-product-visual ${visual}" aria-hidden="true">
        <img src="${image}" alt="" />
        <span>${title.includes("ANIMA") ? "ANIMA" : "ANIMA"}</span>
      </div>
      <h3>${title}</h3>
      <p>${translatePhrase(category)} · ${size}</p>
      <strong>${displayItemPrice({ price, priceMap }, price)}</strong>
      <button class="store-add" type="button" data-store-add="${id}" data-title="${title}" data-price="${price}" aria-label="Add ${title} to cart">+</button>
    </article>
  `;
}

function storeCartCount() {
  return Object.values(storeCart).reduce((sum, item) => sum + item.qty, 0);
}

function renderStoreCart() {
  const items = Object.values(storeCart);
  const total = items.reduce((sum, item) => sum + item.qty * parseVnd(item.price), 0);
  return `
    <div class="store-cart-sheet">
      <div class="store-cart-head">
        <h2>Cart</h2>
        <button type="button" data-store-cart-close aria-label="Close cart">×</button>
      </div>
      ${
        items.length
          ? `<div class="store-cart-items">${items.map((item) => `
              <article>
                <div><h3>${item.title}</h3><p>${item.price} × ${item.qty}</p></div>
                <div class="cart-qty">
                  <button type="button" data-cart-dec="${item.id}" aria-label="Decrease ${item.title}">−</button>
                  <span>${item.qty}</span>
                  <button type="button" data-cart-inc="${item.id}" aria-label="Increase ${item.title}">+</button>
                  <button type="button" data-cart-remove="${item.id}" aria-label="Remove ${item.title}">×</button>
                </div>
                <strong>${formatCurrencyText(`${item.qty * parseVnd(item.price)} VND`)}</strong>
              </article>
            `).join("")}</div>
            <div class="store-cart-total"><span>Total</span><strong>${formatCurrencyText(`${total} VND`)}</strong></div>
            <form class="store-checkout-form">
              <input name="name" placeholder="Name" />
              <input name="contact" placeholder="Telegram / WhatsApp / phone" />
              <select name="delivery"><option>Delivery</option><option>Pickup</option></select>
              <textarea name="comment" placeholder="Comment"></textarea>
              <button class="gold-button" type="submit">Submit request</button>
            </form>`
          : `<p class="store-cart-empty">Your ANIMA Store cart is empty.</p>`
      }
    </div>
  `;
}

function parseVnd(value) {
  return Number(String(value).replace(/[^\d]/g, "")) || 0;
}

function renderDetail(title) {
  const item = findItemByKey(title);
  const isExperience = data.experiences.some((experience) => experience.title === item?.title);
  const isRestaurant = data.restaurants.some((restaurant) => restaurant.title === item?.title);
  if (isRestaurant) return renderEatDetail(item);
  const isStay = data.stays.some((stay) => stay.title === item?.title);
  if (isStay) return renderStayDetail(item);
  const config = { title: item?.title || "Details", subtitle: item?.category || item?.type || "ANIMA detail view" };
  return `
    <div class="screen-inner">
      ${renderHeader(config, { back: true })}
      ${item?.image ? renderFeature({ ...item, category: item.category || item.type, cta: isExperience ? "Book experience" : "Contact manager" }, "Details") : ""}
      <article class="profile-card detail-card">
        <h2>${item?.title || "Details"}</h2>
        ${renderRatingLine(item)}
        <p>${item?.description || item?.meta || "Premium Dalat service prepared for manager contact."}</p>
        <div class="detail-grid">
          <span>Price: ${displayItemPrice(item, "Contact manager")}</span>
          <span>${isExperience ? "Duration" : "Location"}: ${item?.duration || item?.location || "Dalat"}</span>
          <span>Rating: ${item?.rating || "4.8"}</span>
          <span>Reward: ${item?.points || 40} ANIMA Points</span>
          ${item?.included ? `<span>Included: ${item.included}</span>` : ""}
        </div>
        <a class="gold-button" href="#">Contact manager</a>
        ${isExperience ? `<a class="gold-button secondary-action" href="#">Book experience</a>` : ""}
      </article>
      ${renderReviewSection(item)}
    </div>
  `;
}

function renderEatDetail(place) {
  const config = { title: place.title, subtitle: `${place.category} · ${place.distance}` };
  const gallery = place.gallery?.length ? place.gallery : [place.image];
  return `
    <div class="screen-inner eat-detail-screen">
      ${renderHeader(config, { back: true })}
      <section class="eat-detail-gallery">
        <img src="${place.image}" alt="" />
        <div>
          <span>${place.partner ? "ANIMA Partner" : "Curated place"}</span>
          <h2>${place.title}</h2>
          <p>${place.description}</p>
        </div>
      </section>
      <section class="detail-gallery-strip">
        ${gallery.map((image) => `<img src="${image}" alt="" />`).join("")}
      </section>
      <article class="profile-card detail-card">
        <h2>Place details</h2>
        ${renderRatingLine(place)}
        <div class="detail-grid">
          <span>Opening hours: ${place.hours}</span>
          <span>Menu preview: ${place.menu}</span>
          <span>Location: ${place.location || place.distance}</span>
          <span>Reward: ${place.points} ANIMA Points</span>
        </div>
        <div class="vibe-tags">${[...(place.vibe || []), ...(place.tags || [])].slice(0, 8).map((tag) => `<span>${tag}</span>`).join("")}</div>
        ${place.highlights?.length ? `<div class="detail-highlights">${place.highlights.map((item) => `<span>${item}</span>`).join("")}</div>` : ""}
        <p>Best time to visit: rainy afternoons and quiet evenings. Popular among digital nomads and slow travelers.</p>
        <div class="detail-action-row">
          <button class="mini-icon-button" type="button" ${actionAttrs(`Share ${place.title}`, "Share card will use the native share sheet in the app build.")}>↥</button>
          <button class="mini-icon-button" type="button" ${actionAttrs(`Directions: ${place.title}`, "Directions will open through maps in the app build.")}>⌖</button>
          <a class="gold-button" href="#" ${actionAttrs(`Directions: ${place.title}`, "Directions will open through maps in the app build.")}>Directions</a>
        </div>
      </article>
      <section class="screen-section">
        <div class="section-heading compact"><h2>Nearby recommendations</h2></div>
        <div class="food-shelf-scroll">
          ${data.restaurants.filter((item) => item.title !== place.title).slice(0, 4).map((item) => `
            <article data-detail="${item.title}" style="--food-img: url('${item.image}')">
              <div><span>${item.category}</span><h3>${item.title}</h3><p>★ ${item.rating} · ${displayItemPrice(item)}</p></div>
            </article>
          `).join("")}
        </div>
      </section>
      <article class="qr-reward-note">
        <img src="./assets/anima-points-coin.png" alt="" aria-hidden="true" />
        <div><h2>QR Rewards</h2><p>Scan ANIMA QR at partner locations and earn bonus points after your visit.</p></div>
      </article>
      ${renderReviewSection(place)}
    </div>
  `;
}

function renderRatingLine(item = {}) {
  const rating = item.rating || "4.8";
  const reviews = item.reviews || `${Math.max(32, Math.round(Number(rating) * 27))} reviews`;
  const fullStars = Math.max(1, Math.min(5, Math.round(Number(rating) || 5)));
  return `<div class="rating-line" aria-label="${rating} rating"><span>${"★".repeat(fullStars)}${"☆".repeat(5 - fullStars)}</span><strong>${rating}</strong><em>(${reviews})</em></div>`;
}

function renderReviewSection(item = {}) {
  const reviews = item.comments || mockReviews(item.title || "ANIMA");
  return `
    <section class="reviews-section">
      <div class="section-heading compact">
        <h2>Reviews & comments</h2>
        <a href="#" ${actionAttrs(`Review ${item.title || "ANIMA"}`, "Review composer will support text, rating, emoji and photos.")}>Write review</a>
      </div>
      ${renderRatingLine(item)}
      <form class="comment-composer">
        <span>${data.user.avatar}</span>
        <input type="text" placeholder="Share your experience..." />
        <button type="button" ${actionAttrs("Add comment", "Comment composer is ready for user-generated reviews in the next MVP stage.")}>Post</button>
      </form>
      ${
        reviews.length
          ? `<div class="comment-list">${reviews.map(reviewCard).join("")}</div>`
          : `<article class="empty-state"><h3>Be the first to share your experience</h3><p>Your review helps other ANIMA explorers discover Dalat.</p></article>`
      }
    </section>
  `;
}

function mockReviews(seed = "ANIMA") {
  const initials = seed.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "A";
  return [
    { avatar: "M", username: "Maya Tran", date: "2 days ago", text: "Beautiful atmosphere and exactly the kind of calm Dalat place I wanted to save.", likes: 18 },
    { avatar: initials, username: "ANIMA Explorer", date: "1 week ago", text: "Premium feel, good details, and the photos matched the mood very well.", likes: 11 },
  ];
}

function reviewCard(review) {
  return `
    <article class="comment-card">
      <span class="comment-avatar">${review.avatar}</span>
      <div>
        <div class="comment-head"><strong>${review.username}</strong><small>${review.date}</small></div>
        <p>${review.text}</p>
        <div class="comment-actions"><button type="button">♡ ${review.likes}</button><button type="button">Reply</button><button type="button">😊</button></div>
      </div>
    </article>
  `;
}

function findItemByKey(key) {
  return [
    data.places,
    data.stays,
    data.restaurants,
    data.experiences,
    data.feed,
    data.transport.rentals,
    data.jobs,
    data.services,
    data.techSolutions,
    data.savedItems,
  ].flat().find((item) => item.id === key || item.title === key);
}

function detailKey(item) {
  return item?.id || item?.title || "";
}

function openDetailScreen(key) {
  if (!key) return;
  if (!currentAuthUser) {
    openGuestRestrictionModal(userSettings.language === "Russian" ? "Нужен вход" : "Sign in required");
    return;
  }
  const item = findItemByKey(key);
  if (item && data.stays.some((stay) => stay.id === item.id || stay.title === item.title)) {
    const slug = item.slug || slugify(item.title);
    if (slug) {
      window.location.href = `/${slug}/detail/`;
      return;
    }
  }
  navigateTo(`detail:${key}`);
}

window.openDetailScreen = openDetailScreen;

function renderScreenExtra(screen) {
  if (screen === "stay") return `<article class="ai-card"><h2>Long-term stays for digital nomads</h2><p>Monthly homes with desks, fast Wi-Fi and quiet neighborhoods.</p></article>`;
  if (screen === "eat") return `<article class="ai-card"><h2>Scan QR at partner cafes</h2><p>Earn ANIMA Points when you visit selected cafes and restaurants.</p></article>`;
  return "";
}

function renderExplore(config) {
  const ru = isRussianLanguage();
  const mainSections = [
    ["Stay", ru ? "Отели, виллы и апартаменты" : "Hotels, villas and apartments", "stay"],
    ["Eat & Drink", ru ? "Кафе, рестораны и specialty coffee" : "Cafes, restaurants and specialty coffee", "eat"],
    ["Experiences", ru ? "Туры, активности и маршруты" : "Tours, activities and routes", "experiences"],
    ["Nature", ru ? "Водопады, фермы и viewpoints" : "Waterfalls, farms and viewpoints", "experiences"],
    ["Transport", ru ? "Байки, трансферы и аренда" : "Bikes, transfers and rentals", "transport"],
    ["Exchange", ru ? "Заявка на обмен валют" : "Currency exchange requests", "exchange"],
    ["Services", ru ? "Локальная помощь и сервисы" : "Local help and services", "services"],
    ["ANIMA Store", ru ? "Кофе, мёд, подарки и мерч" : "Coffee, honey, gifts and merch", "store"],
  ];
  const ecosystem = [
    ["Jobs", ru ? "Работа и отклики" : "Jobs and applications", "jobs"],
    ["Community", ru ? "Локальные события и люди" : "Local events and people", "community"],
    ["For Business", ru ? "Партнёрство и продвижение" : "Partnership and promotion", "for-business"],
    ["Digital Solutions", ru ? "Сайты, CRM и автоматизация" : "Websites, CRM and automation", "tech-solutions"],
  ];
  const card = ([title, text, screen]) => `
    <button class="explore-card" type="button" data-screen="${screen}">
      <span>${title}</span>
      <p>${text}</p>
    </button>
  `;
  return `
    <div class="screen-inner explore-screen">
      ${renderHeader(config, { back: false })}
      <section class="partners-intro-card release-intro-card">
        <p class="brand-kicker">ANIMA 1.0</p>
        <h2>${ru ? "Цифровая экосистема Далата для путешествий, жизни и бизнеса." : "Digital ecosystem for Dalat travel, lifestyle and business."}</h2>
        <p>${ru ? "Выберите направление и переходите к рабочим разделам платформы." : "Choose a direction and move through the platform's live sections."}</p>
      </section>
      <section class="screen-section">
        <div class="section-heading compact"><h2>${ru ? "Основные разделы" : "Main Sections"}</h2></div>
        <div class="explore-grid">${mainSections.map(card).join("")}</div>
      </section>
      <section class="screen-section">
        <div class="section-heading compact"><h2>ANIMA Ecosystem</h2></div>
        <div class="explore-grid ecosystem">${ecosystem.map(card).join("")}</div>
      </section>
    </div>
  `;
}

function renderSaved(config) {
  const categories = ["All", "Stay", "Places", "Store", "Routes", "Experiences", "Services"];
  const savedCards = savedCollection;
  return `
    <div class="screen-inner saved-screen immersive-root">
      <nav class="saved-tabs" aria-label="Saved categories">
        ${categories.map((category, index) => `<button class="${index === 0 ? "active" : ""}" type="button" data-saved-filter="${category}">${category}</button>`).join("")}
      </nav>
      <section class="saved-hero">
        <h1>Your Dalat Collection</h1>
        <p>Curated places, stays and experiences saved for your next ANIMA day.</p>
      </section>
      <section class="saved-grid" aria-live="polite">
        ${savedCards.length ? savedCards.map(savedCard).join("") : renderSavedEmptyState()}
      </section>
    </div>
  `;
}

function renderSavedEmptyState() {
  return `<article class="empty-state saved-empty"><h3>Your saved ANIMA lifestyle collection will appear here.</h3><p>Save stays, places, products, experiences and routes as you explore the Digital Nature Lifestyle ecosystem.</p></article>`;
}

function savedCard(item) {
  const group = item.type || item.group || item.category || "Places";
  return `
    <article class="saved-card" data-saved-group="${escapeAttr(group)}" data-detail="${item.title}" style="--saved-img: url('${item.image || "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=82"}')">
      <button class="save-button inline saved" type="button" aria-label="Saved ${item.title}">♡</button>
      <div>
        <span>${group}</span>
        <h2>${item.title}</h2>
        <p>${item.location || item.distance || item.meta || "Dalat"}</p>
        <div class="place-tags">${(item.tags || item.vibe || [item.category]).slice(0, 3).map((tag) => `<span>${tag}</span>`).join("")}</div>
      </div>
    </article>
  `;
}

function renderJobs(config) {
  const [feature, ...jobs] = data.jobs;
  return `
    <div class="screen-inner">
      ${renderHeader(config, { back: true })}
      ${renderFilterChips(config)}
      <article class="feature-card economy-feature">
        <button class="save-button" type="button" aria-label="Save ${feature.title}">♡</button>
        <div><p>Most popular jobs this week</p><h2>${feature.title}</h2><span>${feature.company} · ${feature.location}</span></div>
        <div class="feature-footer">${rewardBadge(feature.points)}<a class="gold-button" href="#" ${actionAttrs(feature.cta, "Send an express application request to the ANIMA manager.")}>${feature.cta}</a></div>
      </article>
      <article class="ai-card"><h2>Create your ANIMA Resume</h2><p>Build a simple profile and apply faster.</p><a class="gold-button" href="#" ${actionAttrs("Create profile", "Resume builder will connect to your ANIMA profile and job applications.")}>Create profile</a></article>
      <section class="screen-section"><div class="section-heading compact"><h2>Opportunities</h2><a href="#" ${actionAttrs("All jobs", "Full filters and sorted job lists are prepared for the next MVP stage.")}>See all</a></div><div class="listing-stack">${jobs.map(jobCard).join("")}</div></section>
    </div>
  `;
}

function jobCard(job) {
  return `
    <article class="listing-card economy-card" data-detail="${job.title}">
      <div class="listing-logo">${job.company.split(" ").map((n) => n[0]).slice(0, 2).join("")}</div>
      <div><p>${job.company} · ${job.category}</p><h3>${job.title}</h3><span>${job.location} · ${formatCurrencyText(job.salary)}</span><small>${job.description}</small></div>
      <div class="listing-actions">${rewardBadge(job.points)}<button class="save-button inline" type="button">♡</button><a class="mini-cta" href="#" ${actionAttrs(`Apply: ${job.title}`, "Your job application request has been prepared for ANIMA manager contact.")}>Apply</a></div>
    </article>
  `;
}

function renderServices(config) {
  return `
    <div class="screen-inner">
      ${renderHeader(config, { back: true })}
      ${renderFilterChips(config)}
      <article class="ai-card"><h2>Verified providers</h2><p>Premium local specialists reviewed for quality, reliability and service.</p></article>
      <section class="screen-section"><div class="listing-stack">${data.services.map(providerCard).join("")}</div></section>
      <article class="ai-card"><h2>Offer your service</h2><p>Join ANIMA as a local provider.</p><a class="gold-button" href="#" ${actionAttrs("Create service", "Provider onboarding will connect to your ANIMA profile.")}>Create service</a></article>
    </div>
  `;
}

function providerCard(provider) {
  return `
    <article class="listing-card economy-card" data-detail="${provider.title}">
      <div class="listing-logo">${provider.title.split(" ").map((n) => n[0]).join("")}</div>
      <div><p>${provider.profession} · ${provider.category}</p><h3>${provider.title}</h3><span>${provider.rating} ★ · ${provider.location} · ${formatCurrencyText(provider.price)}</span><small>${provider.description}</small><em>${verifiedAnimaLabel()}</em></div>
      <div class="listing-actions">${rewardBadge(provider.points)}<button class="save-button inline" type="button">♡</button><a class="mini-cta" href="#" ${actionAttrs(`${contactLabel()}: ${provider.title}`, "ANIMA manager contact flow will open here.")}>${translatePhrase("View")}</a></div>
    </article>
  `;
}

function renderBusiness(config) {
  const ru = isRussianLanguage();
  return `
    <div class="screen-inner business-screen">
      ${renderHeader(config, { back: true })}
      <article class="feature-card economy-feature">
        <div><p>${ru ? "Для бизнеса" : "For business"}</p><h2>${ru ? "Больше клиентов, больше возможностей, больше роста" : "More customers, more opportunities, more growth"}</h2><span>${ru ? "Подключайте свой бизнес к экосистеме ANIMA и получайте реальные заявки, видимость и поддержку." : "Connect your business to ANIMA and get real leads, visibility and support."}</span></div>
        <div class="feature-footer"><span></span><a class="gold-button" href="#partner-application">${ru ? "Стать партнёром" : "Become a partner"}</a></div>
      </article>
      <section class="stats-grid">${[
        ru ? ["Прямые заявки", "Получайте обращения и бронирования в одном месте"] : ["Direct leads", "Receive inquiries and bookings in one place"],
        ru ? ["Поддержка ANIMA", "Менеджер помогает с запуском и модерацией"] : ["ANIMA support", "Manager helps with launch and moderation"],
        ru ? ["Прозрачная аналитика", "Статусы заявок, броней и активности"] : ["Clear analytics", "Track requests, bookings and activity"],
        ru ? ["Живой профиль", "Карточка бизнеса внутри приложения"] : ["Live profile", "Business card inside the app"],
      ].map(([title, text]) => `<article><strong>${title}</strong><span>${text}</span></article>`).join("")}</section>
      <section class="screen-section"><div class="section-heading compact"><h2>${ru ? "Наши привилегии" : "Benefits"}</h2></div><div class="benefit-grid">${[
        { title: ru ? "Увеличение видимости" : "Visibility", description: ru ? "Ваш бизнес увидят пользователи ANIMA." : "Your business is visible to ANIMA users." },
        { title: ru ? "Новые клиенты" : "New clients", description: ru ? "Получайте больше обращений и броней." : "Get more inquiries and bookings." },
        { title: ru ? "Рост и аналитика" : "Growth & analytics", description: ru ? "Следите за результатом в кабинете." : "Track performance inside the dashboard." },
        { title: ru ? "Доверие и бренд" : "Trust & brand", description: ru ? "Партнёрская отметка ANIMA повышает доверие." : "ANIMA partner mark improves trust." },
        { title: ru ? "Маркетинг и акции" : "Marketing", description: ru ? "Запускайте акции и спецпредложения." : "Run offers and campaigns." },
        { title: ru ? "Бонусы и награды" : "Rewards", description: ru ? "Подключайте бонусы и спецусловия для гостей." : "Offer perks and rewards to guests." },
      ].map(benefitCard).join("")}</div></section>
      <section class="screen-section"><div class="section-heading compact"><h2>${ru ? "Кому подходит" : "Best for"}</h2></div>${horizontalCards((ru ? ["Отели", "Рестораны", "Кафе", "Байк-аренда", "Магазины"] : ["Hotels", "Restaurants", "Cafes", "Bike rental", "Shops"]).map((title) => ({ title, category: ru ? "Партнёрская экосистема" : "Partner ecosystem", meta: ru ? "Видимость · заявки · поддержка" : "Visibility · leads · support" })))}</section>
      <section id="partner-application" class="stay-detail-card">
        <h2>${ru ? "Стать партнёром" : "Become a partner"}</h2>
        <p>${ru ? "Заявка сразу попадёт в админку ANIMA." : "This application goes directly to ANIMA admin."}</p>
        <form class="booking-form" data-partner-application-form>
          <div class="booking-form-grid">
            <label><span>${ru ? "ФИО" : "Full name"}</span><input name="fullName" required /></label>
            <label><span>Email</span><input name="email" type="email" required /></label>
            <label><span>${ru ? "Должность" : "Position"}</span><input name="position" /></label>
            <label><span>${ru ? "Название бизнеса" : "Business name"}</span><input name="businessName" required /></label>
            <label><span>${ru ? "Категория бизнеса" : "Business type"}</span><input name="businessType" required /></label>
            <label class="full"><span>${ru ? "Описание бизнеса" : "Business description"}</span><textarea name="description" required></textarea></label>
            <label class="full"><span>${ru ? "Адрес" : "Address"}</span><input name="address" required /></label>
            <label><span>${ru ? "Телефон" : "Phone"}</span><input name="phone" required /></label>
            <label><span>Telegram</span><input name="telegram" /></label>
            <label><span>WhatsApp</span><input name="whatsapp" /></label>
            <label><span>Zalo</span><input name="zalo" /></label>
            <label><span>${ru ? "Способ связи" : "Preferred contact"}</span><input name="preferredContact" /></label>
            <label class="full"><span>${ru ? "Сайт или соцсеть" : "Website or social"}</span><input name="website" /></label>
            <label class="full"><span>${ru ? "Комментарий" : "Comment"}</span><textarea name="comment"></textarea></label>
          </div>
          <button class="gold-button" type="submit">${ru ? "Отправить заявку" : "Submit application"}</button>
        </form>
      </section>
    </div>
  `;
}

function benefitCard(item) {
  return `<article><span>✦</span><h3>${item.title}</h3><p>${item.description}</p></article>`;
}

function renderTechSolutions(config) {
  return `
    <div class="screen-inner">
      ${renderHeader(config, { back: true })}
      <article class="feature-card economy-feature tech">
        <div><p>Digital transformation</p><h2>Turn your business into a digital experience</h2><span>We help local businesses create websites, apps, automation and booking systems.</span></div>
        <div class="feature-footer"><span></span><a class="gold-button" href="#" ${actionAttrs("Request consultation", "Tell ANIMA what you want to build and a manager will contact you.")}>Request consultation</a></div>
      </article>
      <section class="screen-section"><div class="section-heading compact"><h2>Services</h2></div><div class="tech-grid">${data.techSolutions.map(techCard).join("")}</div></section>
      <section class="screen-section"><div class="section-heading compact"><h2>Case studies</h2></div><div class="listing-stack">${data.caseStudies.map((item) => `<article class="listing-card"><div><p>Case study</p><h3>${item.title}</h3><span>${item.meta}</span></div><a class="mini-cta" href="#" ${actionAttrs(item.title, "Case study details will be available in the next MVP stage.")}>View</a></article>`).join("")}</div></section>
      <article class="ai-card"><h2>Build with ANIMA</h2><p>Launch a cleaner digital presence for your local business.</p><a class="gold-button" href="#" ${actionAttrs("Start project", "A digital solutions project request will be prepared for ANIMA.")}>Start project</a></article>
    </div>
  `;
}

function techCard(item) {
  return `<article><span>⌁</span><h3>${item.title}</h3><p>${item.description}</p><small>${displayItemPrice(item)}</small><a class="mini-cta" href="#" ${actionAttrs(item.title, "Service details and consultation flow will open here.")}>Learn more</a></article>`;
}

function renderExchange(config) {
  const currencies = [...data.exchangeRates.fiat, ...data.exchangeRates.crypto];
  return `
    <div class="screen-inner">
      ${renderHeader(config, { back: true })}
      <article class="exchange-card">
        <h2>Exchange request</h2>
        <p>Submit a request and contact the ANIMA manager on Telegram: ${managerTelegram.handle}.</p>
        <form class="exchange-form">
          <label>From currency<select name="from">${currencies.map((item) => `<option>${item}</option>`).join("")}</select></label>
          <label>Amount<input name="amount" inputmode="decimal" placeholder="1,000" /></label>
          <label>To currency<select name="to">${currencies.map((item) => `<option ${item === "VND" ? "selected" : ""}>${item}</option>`).join("")}</select></label>
          <label>Receive type<select name="receive">${data.exchangeRates.receiveTypes.map((item) => `<option>${item}</option>`).join("")}</select></label>
          <label>Contact<input name="contact" placeholder="${managerTelegram.handle}" value="${managerTelegram.handle}" /></label>
          <label>Comment<textarea name="comment" rows="3" placeholder="Preferred time, address, notes..."></textarea></label>
          <button class="gold-button" type="submit">Send request</button>
        </form>
        <div class="exchange-success" hidden>
          <h3>Your exchange request has been sent.</h3>
          <p>Contact the manager on Telegram: ${managerTelegram.handle}</p>
          <a class="gold-button" href="${managerTelegram.url}" target="_blank" rel="noopener">Open Telegram</a>
        </div>
      </article>
    </div>
  `;
}

function renderTransport(config, activeCategory = "Moto") {
  return `
    <div class="screen-inner transport-screen">
      ${renderHeader(config, { back: true })}
      <div class="transport-tabs" aria-label="Transport categories">
        ${config.chips.map((chip) => `
          <button class="${chip === activeCategory ? "active" : ""}" type="button" data-transport-category="${chip}">
            <span>${chip}</span>
          </button>
        `).join("")}
      </div>
      <article class="transport-recommended">
        <div>
          <p>Recommended</p>
          <h2>Ride more, pay less</h2>
          <span>Get special offers on motorbike rentals this week.</span>
        </div>
        <a class="gold-button" href="#">Book now</a>
      </article>
      <section class="transport-content" aria-live="polite">
        ${renderTransportContent(activeCategory)}
      </section>
    </div>
  `;
}

function renderTransportContent(category) {
  if (["Moto", "Bike / E-bike", "Bicycle", "Car"].includes(category)) {
    const rentals = data.transport.rentals.filter((item) => item.group === category);
    return `<div class="transport-list">${rentals.map(transportRentalCard).join("")}</div>`;
  }
  if (category === "Personal Driver") return renderPersonalDriver();
  if (category === "Transfer") return renderTransfer();
  if (category === "Bus") return renderBusSchedule();
  return "";
}

function transportRentalCard(item) {
  return `
    <article class="transport-card" data-detail="${item.title}">
      <img src="${item.image}" alt="" />
      <div class="transport-card-body">
        <div class="transport-card-top">
          <p>${item.type}</p>
          <button class="save-button inline" type="button" aria-label="Save ${item.title}">♡</button>
        </div>
        <h2>${item.title}</h2>
        <span>★ ${item.rating} · ${displayItemPrice(item)}</span>
        <small>${item.specs}</small>
        <a class="gold-button" href="#">View details</a>
      </div>
    </article>
  `;
}

function renderPersonalDriver() {
  return `
    <article class="transport-service-panel">
      <p>Manager service</p>
      <h2>Personal Driver</h2>
      <h3>Private driver service for comfortable trips around Da Lat and nearby areas.</h3>
      <span>Need a trusted local driver for a day trip, airport pickup, sightseeing route or custom plan? Send a request and our manager will help you choose the best option, confirm price, timing and route details.</span>
      <div class="transport-scenario-grid">
        ${data.transport.driverScenarios.map((item) => `<article>${item}</article>`).join("")}
      </div>
      <div class="transport-actions">
        <a class="gold-button" href="#">Contact manager</a>
        <a class="mini-cta" href="#">Send request</a>
      </div>
    </article>
  `;
}

function renderTransfer() {
  return `
    <article class="transport-service-panel">
      <p>Manager service</p>
      <h2>Transfer</h2>
      <h3>Easy transfers between Da Lat, airport and nearby cities.</h3>
      <span>Book a transfer from or to Da Lat. Tell us your route, date, number of people and luggage — our manager will offer available options and price.</span>
      <div class="route-list">
        ${data.transport.transferRoutes.map((route) => `
          <article>
            <div><h4>${route.route}</h4><span>${route.duration} · ${formatCurrencyText(route.price)}</span></div>
            <a class="mini-cta" href="#">Request transfer</a>
          </article>
        `).join("")}
      </div>
      <a class="gold-button" href="#">Contact manager</a>
    </article>
  `;
}

function renderBusSchedule() {
  return `
    <article class="transport-service-panel">
      <p>Information</p>
      <h2>Bus Schedule</h2>
      <h3>Popular bus routes from Da Lat.</h3>
      <div class="route-list bus-list">
        ${data.transport.busRoutes.map((route) => `
          <article>
            <div>
              <h4>${route.route}</h4>
              <span>Departure: ${route.departure}</span>
              <small>${route.duration} · ${route.type}<br />${route.notes}</small>
            </div>
            <a class="mini-cta" href="#">Contact manager</a>
          </article>
        `).join("")}
      </div>
    </article>
  `;
}

function renderMap(config) {
  const points = data.mapPoints;
  const startedAt = typeof performance !== "undefined" ? performance.now() : 0;
  const html = `
    <div class="screen-inner map-screen">
      ${renderHeader(config, { back: true })}
      <div class="map-toolbar">
        ${["All", "Rewards", "Food", "Stay", "Nature", "Transport"].map((item, index) => `<button class="${index === 0 ? "active" : ""}" type="button">${item}</button>`).join("")}
      </div>
      <section class="game-map" aria-label="Interactive Dalat map">
        <svg class="map-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d="M5 38 C21 18 38 30 50 18 S80 13 95 28" />
          <path d="M8 62 C28 48 42 72 58 55 S78 44 94 60" />
          <path d="M18 84 C35 70 50 90 70 76 S84 68 96 82" />
          <path d="M28 8 C24 28 34 44 26 63 S26 82 39 96" />
          <path d="M70 5 C62 22 70 37 62 52 S58 79 72 96" />
        </svg>
        <div class="map-grid" aria-hidden="true"></div>
        ${points.map((point, index) => `
          <button class="map-marker ${index === 0 ? "active" : ""}" type="button" style="left:${point.x}%; top:${point.y}%;" data-map-index="${index}" aria-label="${point.title}">
            <span></span>
          </button>
        `).join("")}
      </section>
      <article class="map-info">
        <div>
          <p id="map-type">${points[0].type}</p>
          <h2 id="map-title">${points[0].title}</h2>
          <span id="map-status">${points[0].status}</span>
        </div>
        ${rewardBadge(points[0].points)}
        <a class="gold-button" href="#">Set route</a>
      </article>
      <section class="screen-section">
        <div class="section-heading compact"><h2>Nearby discoveries</h2></div>
        <div class="listing-stack">${points.slice(1, 5).map((point) => listingCard({ title: point.title, category: point.type, meta: point.status, points: point.points })).join("")}</div>
      </section>
    </div>
  `;
  perfMark("renderMap", startedAt);
  return html;
}

function renderFeed(config) {
  return `
    <div class="screen-inner feed-screen immersive-root">
      <nav class="feed-tabs" aria-label="Feed categories">
        ${config.chips.filter((chip) => chip !== "Digital Nomads").map((chip, index) => `<button class="${index === 0 ? "active" : ""}" type="button" data-feed-filter="${chip}">${translatePhrase(chip)}</button>`).join("")}
      </nav>
      <section class="feed-list" aria-live="polite">
        ${data.feed.map(feedCard).join("")}
      </section>
    </div>
  `;
}

function feedCard(item) {
  const cta = {
    event: "View event",
    promotion: "Claim",
    community: "Comment",
    place: "Open location",
    experience: "View experience",
  }[item.type] || "View";
  return `
    <article class="city-feed-card ${item.type}" ${item.detailTitle ? `data-detail="${item.detailTitle}"` : ""}>
      ${item.image ? `<img src="${item.image}" alt="" />` : ""}
      <div class="city-feed-body">
        <div class="feed-kicker">
          <span>${item.label}</span>
          <button class="save-button inline" type="button" aria-label="Save ${item.title}">♡</button>
        </div>
        ${
          item.type === "community"
            ? `<div class="feed-mini-author"><span>${item.author.split(" ").map((name) => name[0]).join("")}</span><div><strong>${item.author}</strong><small>${item.badge}</small></div></div>`
            : ""
        }
        <h2>${item.title}</h2>
        <p>${item.text}</p>
        <div class="feed-tags">
          <span>${item.type}</span>
          <span>${item.label}</span>
        </div>
        <div class="feed-card-meta">
          <span>${item.meta}</span>
          ${item.points ? rewardBadge(item.points) : ""}
        </div>
        <div class="feed-social-actions">
          <button type="button" class="feed-action-button">♡ Like</button>
          <button type="button" class="feed-action-button">💬 Comment</button>
          <button type="button" class="feed-action-button">↥ Share</button>
          <a class="gold-button" href="#">${cta}</a>
        </div>
      </div>
    </article>
  `;
}

function renderFilteredFeed(filter) {
  const normalized = String(filter || "For You").toLowerCase();
  const items = normalized === "for you"
    ? data.feed
    : data.feed.filter((item) => {
        const haystack = `${item.type} ${item.label} ${item.title} ${item.text} ${item.meta}`.toLowerCase();
        return haystack.includes(normalized.replace("new places", "place")) || haystack.includes(normalized.replace("promotions", "promotion"));
      });
  return (items.length ? items : data.feed).map(feedCard).join("");
}

function renderCommunity(config) {
  return `
    <div class="screen-inner">
      ${renderHeader(config, { back: true })}
      ${renderFilterChips(config)}
      <article class="welcome-card">
        <div><h2>New in Dalat?</h2><p>Introduce yourself to the community.</p><span>24 new members this week</span></div>
        <a class="gold-button" href="#">Say hello</a>
      </article>
      <section class="screen-section"><div class="section-heading compact"><h2>Pinned</h2></div>${horizontalCards(data.communityPosts)}</section>
      <section class="screen-section feed-stack">
        ${data.communityPosts.map((post) => `
          <article class="feed-card">
            <div class="feed-head"><span>${post.author.split(" ").map((n) => n[0]).join("")}</span><div><h3>${post.author}</h3><p>${post.badge} · ${post.time} · ${post.location}</p></div><button class="save-button inline" type="button">♡</button></div>
            <h2>${post.title}</h2><p>${post.text}</p><div class="feed-meta"><span>${post.stats}</span>${rewardBadge(post.points)}</div>
          </article>
        `).join("")}
      </section>
      <button class="post-fab" type="button">Post</button>
    </div>
  `;
}

function renderEat(config, activeCategory = "Coffee") {
  return `
    <div class="screen-inner eat-screen">
      ${renderHeader(config, { back: true })}
      <p class="ambient-line">Digital Nature Lifestyle · Food culture of Dalat</p>
      <div class="eat-chips">${config.chips.map((chip) => `<button class="${chip === activeCategory ? "active" : ""}" type="button" data-eat-category="${chip}">${chip}</button>`).join("")}</div>
      <section class="eat-map-sync" aria-label="Food and drink map markers">${renderEatMap(activeCategory)}</section>
      <section class="eat-list-section">
        <div class="section-heading compact"><h2>${activeCategory}</h2><span>${renderEatListingsCount(activeCategory)} places</span></div>
        <div class="eat-list" aria-live="polite">${renderEatListings(activeCategory)}</div>
      </section>
      <article class="qr-reward-note">
        <img src="./assets/anima-points-coin.png" alt="" aria-hidden="true" />
        <div><h2>Scan ANIMA QR</h2><p>Earn bonus points at selected partner cafes and restaurants.</p></div>
      </article>
    </div>
  `;
}

function renderEatListingsCount(category) {
  return data.restaurants.filter((item) => matchCategory(item, category)).length;
}

function renderEatMap(category) {
  const places = data.restaurants.filter((item) => matchCategory(item, category));
  return `
    <div class="eat-map-card">
      <div class="eat-map-grid" aria-hidden="true"></div>
      ${places.map((place, index) => `
        <button class="eat-map-marker ${index === 0 ? "active" : ""}" type="button" data-detail="${place.title}" style="left:${18 + (index * 17) % 66}%; top:${24 + (index * 23) % 52}%;" aria-label="${place.title}">
          <span></span>
        </button>
      `).join("")}
      <div class="eat-map-caption">
        <strong>${places.length} places</strong>
        <span>Markers sync with ${category}</span>
      </div>
    </div>
  `;
}

function renderEatListings(category) {
  const items = data.restaurants.filter((item) => matchCategory(item, category));
  return items.length ? items.map(eatPlaceCard).join("") : `<article class="empty-state"><h3>No places yet</h3><p>This category is ready for Google Places sync.</p></article>`;
}

function matchCategory(item, category) {
  return item.category === category || item.tags?.includes(category) || item.vibe?.includes(category);
}

function eatPlaceCard(place) {
  return `
    <article class="eat-place-card" data-detail="${place.title}">
      <img src="${place.image}" alt="${place.title}" loading="lazy" />
      <div>
        <div class="eat-place-top">
          <p>${place.category} · ${place.cuisine || "Food & Drinks"}</p>
          <button class="save-button inline ${isSavedTitle(place.title) ? "saved" : ""}" type="button" aria-label="Save ${place.title}" ${saveAttrs(place, "Places")}>♡</button>
        </div>
        <h2>${place.title}</h2>
        <span class="verified-anima food">${verifiedAnimaLabel()}</span>
        <span>${place.description}</span>
        <small>★ ${place.rating} · ${place.priceLevel || "$$"} · ${formatCurrencyText(place.price)} · ${place.address || place.distance}</small>
        <div class="place-tags">${(place.tags || place.vibe || []).slice(0, 3).map((tag) => `<span>${tag}</span>`).join("")}</div>
        <div class="eat-place-actions">
          ${rewardBadge(place.points)}
          <a class="mini-icon-button" href="${place.mapsUrl}" target="_blank" rel="noopener" aria-label="Route to ${place.title}">⌖</a>
          <button class="mini-icon-button" type="button" ${actionAttrs(`Share ${place.title}`, "Share card will use the native share sheet in the app build.")}>↥</button>
          <a class="gold-button" href="${place.mapsUrl}" target="_blank" rel="noopener">Open in Maps</a>
        </div>
      </div>
    </article>
  `;
}

function renderStay(config) {
  const stayChips = screenConfig.stay.chips;
  stayFilters.category = stayFilters.category || stayChips[0];
  if (!stayChips.includes(stayFilters.category)) stayFilters.category = stayChips[0];
  return `
    <div class="screen-inner stay-screen">
      ${renderHeader(config, { back: true })}
      <div class="stay-chips">${stayChips.map((chip) => `<button class="${chip === stayFilters.category ? "active" : ""}" type="button" data-stay-category="${chip}">${translatePhrase(chip)}</button>`).join("")}</div>
      <section class="stay-list" aria-live="polite">${renderStayListings()}</section>
    </div>
  `;
}

function renderStayListings() {
  const items = data.stays.filter((stay) => {
    const categoryMatch = stay.category === stayFilters.category || stay.tags?.includes(stayFilters.category);
    return categoryMatch;
  });
  const emptyTitle = isRussianLanguage() ? "Жильё не найдено" : "No stays found";
  const emptyText = isRussianLanguage() ? "Добавьте карточку жилья в админке или выберите другой тип жилья." : "Add a stay card in admin or choose another stay category.";
  return items.length ? items.map(stayCard).join("") : `<article class="empty-state"><h3>${emptyTitle}</h3><p>${emptyText}</p></article>`;
}

function stayCard(stay) {
  const ratingText = [stay.rating ? `★ ${stay.rating}` : "", stay.reviews ? `(${stay.reviews})` : "", stay.source ? `· ${stay.source}` : ""].filter(Boolean).join(" ");
  const locationText = [localizeStayPlaceText(stay.location), localizeStayPlaceText(stay.distance)].filter(Boolean).join(" · ");
  const capacityText = stayCapacityText(stay);
  const stayKey = escapeAttr(detailKey(stay));
  const staySlug = escapeAttr(stay.slug || slugify(stay.title));
  return `
    <article class="stay-card" data-detail="${stayKey}">
      <img src="${stay.image}" alt="" />
      <div class="stay-info">
        <div class="stay-topline">
          <p>${localizeStayType(stay.type || stay.category)}</p>
          <span class="verified-anima">${verifiedAnimaLabel()}</span>
        <button class="save-button inline ${isSavedTitle(stay.title) ? "saved" : ""}" type="button" aria-label="Save ${stay.title}" ${saveAttrs(stay, "Stay")}>♡</button>
        </div>
        <h2>${stay.title}</h2>
        ${ratingText ? `<span class="stay-rating">${ratingText}</span>` : ""}
        ${locationText || capacityText ? `<span class="stay-location">${locationText ? `⌖ ${locationText}` : ""}${locationText && capacityText ? "<br />" : ""}${capacityText}</span>` : ""}
        <div class="place-tags">${(stay.tags || []).slice(0, 3).map((tag) => `<span>${tag}</span>`).join("")}</div>
        <div class="stay-bottom">
          <strong>${stayPriceText(stay)}</strong>
          <span class="stay-card-open-hint">${isRussianLanguage() ? "Нажмите карточку" : "Tap card"}</span>
        </div>
      </div>
    </article>
  `;
}

function renderStayDetail(stay) {
  const nightlyRate = parsePriceNumber(stay.price);
  const defaultNights = Number(stay.nights) || 1;
  const subtotal = nightlyRate * defaultNights;
  const cleaning = parsePriceNumber(stay.cleaningFee);
  const service = parsePriceNumber(stay.serviceFee);
  const total = subtotal + cleaning + service;
  const config = { title: stay.title, subtitle: `${localizeStayType(stay.type || stay.category)} · ${localizeStayPlaceText(stay.location)}` };
  const ratingText = [stay.rating ? `★ ${stay.rating}` : "", stay.reviews ? `(${stay.reviews})` : "", stay.source ? `· ${stay.source}` : ""].filter(Boolean).join(" ");
  const facts = [
    [stay.guests, "Guests"],
    [stay.bedrooms, "Bedrooms"],
    [stay.beds, "Beds"],
    [stay.baths, "Baths"],
    [stay.size, "Size"],
  ].filter(([value]) => value);
  return `
    <div class="screen-inner stay-detail-screen">
      ${renderHeader(config, { back: true })}
      <section class="stay-hero-detail">
        <img src="${stay.image}" alt="" />
        <button class="save-button" type="button" aria-label="Save ${stay.title}">♡</button>
        <div class="stay-share">↥</div>
        <span class="gallery-count">1 / ${stay.gallery?.length || 1}</span>
        <div>
          <h2>${stay.title}</h2>
          <p>${localizeStayType(stay.type || stay.category)} · ${localizeStayPlaceText(stay.location)}</p>
          ${ratingText ? `<span>${ratingText}</span>` : ""}
          <em class="verified-anima detail">${verifiedAnimaLabel()}</em>
        </div>
      </section>

      ${facts.length ? `<section class="stay-facts">${facts.map(([value, label]) => `<article><strong>${value}</strong><span>${stayFactLabel(label)}</span></article>`).join("")}</section>` : ""}

      <section class="stay-gallery-strip">
        ${(stay.gallery || [stay.image]).map((image, index) => `<img src="${image}" alt="" />${index === 2 ? "<span>+20</span>" : ""}`).join("")}
      </section>

      <article class="stay-detail-card">
        <h2>${isRussianLanguage() ? "Об этом месте" : "About this place"}</h2>
        <p>${stay.description}</p>
        <div class="vibe-tags">${(stay.tags || []).slice(0, 8).map((tag) => `<span>${tag}</span>`).join("")}</div>
        ${stay.highlights?.length ? `<div class="detail-highlights">${stay.highlights.map((item) => `<span>${item}</span>`).join("")}</div>` : ""}
        <a href="#">${isRussianLanguage() ? "Читать дальше" : "Read more"}⌄</a>
      </article>

      <article class="stay-detail-card stay-location-card">
        <div>
          <h2>${isRussianLanguage() ? "Локация" : "Location"}</h2>
          <p>⌖ ${localizeStayPlaceText(stay.location)}, ${isRussianLanguage() ? "Далат" : "Dalat"}</p>
          <span>${localizeStayPlaceText(stay.distance)} · ${isRussianLanguage() ? "7 мин до Tuyen Lam Lake" : "7 min to Tuyen Lam Lake"}</span>
          <div class="detail-action-row">
            <button class="mini-icon-button" type="button" ${actionAttrs(`Share ${stay.title}`, "Share stay card will use the native share sheet in the app build.")}>↥</button>
            <button class="mini-icon-button" type="button" ${actionAttrs(`Directions: ${stay.title}`, "Directions will open through maps in the app build.")}>⌖</button>
          </div>
          <a class="gold-button location-button" href="${stay.mapsUrl || stay.sourceUrl || "https://maps.google.com"}" target="_blank" rel="noopener">${isRussianLanguage() ? "Открыть в Google Maps" : "Open in Google Maps"}</a>
        </div>
        <div class="mini-map-pin">●</div>
      </article>

      <section class="stay-booking-panel">
        <h2>${isRussianLanguage() ? "Бронирование" : "Booking"}</h2>
        <div class="rate-grid">
          <article class="active"><span>${isRussianLanguage() ? "Цена за ночь" : "Nightly rate"}</span><small>${isRussianLanguage() ? "От" : "From"}</small><strong>${formatPriceMap(stay.priceMap, stay.price)}</strong><em>${localizePriceType(stay.priceType)}</em></article>
          ${stay.monthlyPrice ? `<article><span>${isRussianLanguage() ? "Цена за месяц" : "Monthly rate"}</span><small>${isRussianLanguage() ? "От" : "From"}</small><strong>${formatPriceMap(stay.monthlyPriceMap, stay.monthlyPrice)}</strong><em>${localizePriceType("/ month")}</em></article>` : ""}
        </div>
        <form class="booking-form" data-booking-form="${escapeAttr(stay.title)}" data-nightly-rate="${nightlyRate}" data-cleaning-fee="${cleaning}" data-service-fee="${service}">
          <div class="booking-form-grid">
            <label><span>${isRussianLanguage() ? "Заезд" : "Check-in"}</span><input name="checkin" type="date" required /></label>
            <label><span>${isRussianLanguage() ? "Выезд" : "Check-out"}</span><input name="checkout" type="date" required /></label>
            <label><span>${isRussianLanguage() ? "Гостей" : "Guests"}</span><input name="guests" type="number" min="1" value="${stay.guests || 1}" required /></label>
            <label><span>${isRussianLanguage() ? "Номер телефона" : "Phone"}</span><input name="phone" type="tel" placeholder="+7 ..." required /></label>
            <label class="full"><span>${isRussianLanguage() ? "ФИО" : "Full name"}</span><input name="fullName" type="text" required /></label>
            <label><span>${isRussianLanguage() ? "Дата рождения" : "Birth date"}</span><input name="birthDate" type="date" required /></label>
            <label><span>${isRussianLanguage() ? "Номер паспорта" : "Passport number"}</span><input name="passportNumber" type="text" required /></label>
            <label class="full"><span>${isRussianLanguage() ? "Почта" : "Email"}</span><input name="email" type="email" placeholder="name@email.com" required /></label>
            <label class="full"><span>${isRussianLanguage() ? "Комментарий к брони" : "Booking note"}</span><textarea name="note" placeholder="${isRussianLanguage() ? "Пожелания по номеру, поздний заезд и т.д." : "Special requests, late arrival, etc."}"></textarea></label>
          </div>
          <div class="booking-summary" data-booking-summary>
            <div><span>${isRussianLanguage() ? "Ночей" : "Nights"}</span><b>${defaultNights}</b></div>
            <div><span>${isRussianLanguage() ? "Проживание" : "Stay"}</span><b>${formatMoney(subtotal, userSettings.currency)}</b></div>
            ${cleaning ? `<div><span>${isRussianLanguage() ? "Уборка" : "Cleaning fee"}</span><b>${formatPriceMap(stay.cleaningFeeMap, stay.cleaningFee)}</b></div>` : ""}
            ${service ? `<div><span>${isRussianLanguage() ? "Сервисный сбор" : "Service fee"}</span><b>${formatPriceMap(stay.serviceFeeMap, stay.serviceFee)}</b></div>` : ""}
            <strong><span>${isRussianLanguage() ? "Итого" : "Total"}</span><b>${formatMoney(total, userSettings.currency)}</b></strong>
          </div>
          <button class="gold-button booking-submit" type="submit">${isRussianLanguage() ? "Бронь" : "Book now"}</button>
        </form>
      </section>

      <section class="stay-detail-card price-details">
        <h2>${isRussianLanguage() ? "Детали цены" : "Price details"}</h2>
        <div><span>${formatPriceMap(stay.priceMap, stay.price)} × ${stay.nights} ${isRussianLanguage() ? pluralRu(stay.nights, ["ночь", "ночи", "ночей"]) : "nights"}</span><b>${formatMoney(subtotal, userSettings.currency)}</b></div>
        ${stay.cleaningFee ? `<div><span>${isRussianLanguage() ? "Уборка" : "Cleaning fee"}</span><b>${formatPriceMap(stay.cleaningFeeMap, stay.cleaningFee)}</b></div>` : ""}
        ${stay.serviceFee ? `<div><span>${isRussianLanguage() ? "Сервисный сбор" : "Service fee"}</span><b>${formatPriceMap(stay.serviceFeeMap, stay.serviceFee)}</b></div>` : ""}
        <strong><span>${isRussianLanguage() ? "Итого" : "Total"} (${stay.nights} ${isRussianLanguage() ? pluralRu(stay.nights, ["ночь", "ночи", "ночей"]) : "nights"})</span><b>${formatMoney(total, userSettings.currency)}</b></strong>
      </section>

      <article class="stay-detail-card">
        <h2>${isRussianLanguage() ? "Депозит и оплата" : "Deposit & Payment"}</h2>
        <p>${stay.deposit ? (isRussianLanguage() ? `Возвратный депозит: ${formatPriceMap(stay.depositMap, stay.deposit)}. Депозит возвращается в течение 24-48 часов после выезда, если нет повреждений.` : `Security deposit (refundable): ${formatPriceMap(stay.depositMap, stay.deposit)}. The deposit will be refunded within 24-48 hours after check-out if there is no damage.`) : (isRussianLanguage() ? "Депозит не указан." : "Deposit is not specified.")}</p>
        <p>${isRussianLanguage() ? "Полная оплата нужна для подтверждения бронирования." : "Full payment required to confirm booking."}</p>
      </article>

      <section class="stay-detail-card house-rules">
        <h2>${isRussianLanguage() ? "Правила проживания" : "House rules"}</h2>
        ${stay.rules.map((rule) => `<div><span>⌁</span><p>${rule}</p><b>›</b></div>`).join("")}
      </section>

      <section class="stay-detail-card amenities-card">
        <h2>${isRussianLanguage() ? "Удобства" : "Amenities"}</h2>
        <div>${stay.amenities.map((item) => `<span>${item}</span>`).join("")}</div>
      </section>

      ${renderReviewSection(stay)}

    </div>
  `;
}

function parsePriceNumber(value) {
  const text = String(value || "");
  if (text.includes("$")) {
    const usd = Number(text.replace(/[^\d.]/g, ""));
    return Math.round(usd * data.user.currencyRates.USD);
  }
  return Number(text.replace(/[^\d]/g, "")) || 0;
}

function experienceCard(item) {
  return `
    <article class="experience-card" data-detail="${item.title}">
      <img src="${item.image}" alt="" />
      <div>
        <p>${item.category}</p>
        <h2>${item.title}</h2>
        <span>${item.duration} · ${displayItemPrice(item)}</span>
        <small>${item.included}</small>
      </div>
      <div class="experience-actions">
        ${rewardBadge(item.points)}
        <button class="save-button inline" type="button" aria-label="Save ${item.title}">♡</button>
        <a class="gold-button" href="#">View experience</a>
      </div>
    </article>
  `;
}

function renderExperiences(config) {
  return `
    <div class="screen-inner experiences-screen">
      ${renderHeader(config, { back: true })}
      ${renderFilterChips(config)}
      <section class="experience-list">
        ${data.experiences.map(experienceCard).join("")}
      </section>
    </div>
  `;
}

function renderProfile(config) {
  const ru = isRussianLanguage();
  const authSubtitle = currentAuthUser?.email || currentAuthUser?.username || currentAuthUser?.telegram || "ANIMA";
  const hasPremium = Boolean(currentAuthUser?.premium?.active || currentAuthUser?.membership === "plus" || currentAuthUser?.subscription === "plus");
  const startedAt = typeof performance !== "undefined" ? performance.now() : 0;
  const html = `
    <div class="screen-inner profile-screen">
      ${renderHeader(config, { back: false })}
      <section class="profile-control-card">
        <div class="avatar">${data.user.avatar}</div>
        <div>
          <h2>${data.user.name}${hasPremium ? ` <img class="profile-plus-mini" src="./assets/anima-plus-mark.png" alt="ANIMA Plus" />` : ""}</h2>
          <p>${authSubtitle}</p>
          <span>${data.user.points.toLocaleString("en-US")} ANIMA Points</span>
          <div class="progress wide"><span style="width:${Math.round((data.user.points / data.user.nextLevel) * 100)}%"></span></div>
        </div>
        <button class="mini-cta" type="button" data-profile-action="edit-profile">${ru ? "Редактировать" : "Edit"}</button>
      </section>

      ${settingsSection(ru ? "Настройки" : "Preferences", [
        settingsRow("◉", ru ? "Язык" : "Language", ru ? `${userSettings.language === "Russian" ? "Русский" : "English"} / Русский` : `${userSettings.language} / Russian`, null, "language"),
        settingsRow("¤", ru ? "Валюта" : "Currency", `${userSettings.currency} / USD`, null, "currency"),
        settingsRow("◌", ru ? "Уведомления" : "Notifications", userSettings.notifications ? (ru ? "Все уведомления включены" : "All notifications enabled") : (ru ? "Уведомления выключены" : "Notifications disabled"), null, "notifications"),
        settingsRow("✦", ru ? "Подписка и награды" : "Membership & Rewards", ru ? "ANIMA Points, уровни и ANIMA Plus" : "ANIMA Points, levels and ANIMA Plus", "rewards"),
      ])}

      ${settingsSection(ru ? "Моя активность" : "My Activity", [
        settingsRow("♡", ru ? "Сохранённые места" : "Saved Places", ru ? "Места, кафе и жильё" : "Places, cafes and stays", "saved"),
        settingsRow("◇", ru ? "Сохранённые впечатления" : "Saved Experiences", ru ? "Маршруты и программы" : "Curated routes and programs", "saved"),
        settingsRow("⌁", ru ? "Заявки на бронирование" : "Booking Requests", ru ? "Впечатления, жильё и транспорт" : "Experiences, stay and transport", null, "bookings"),
        settingsRow("⇄", ru ? "Заявки на обмен" : "Exchange Requests", ru ? "История обмена валют" : "Currency exchange history", "exchange"),
        settingsRow("◷", ru ? "Просмотренные места" : "Viewed Places", ru ? "Недавно открытые места" : "Recently opened places", null, "viewed"),
      ])}

      ${settingsSection(ru ? "Поддержка и экосистема" : "Support & Ecosystem", [
        settingsRow("◌", ru ? "Поддержка 24/7" : "24/7 Support", ru ? "Быстрая помощь от команды ANIMA" : "Fast help from ANIMA team", null, "support"),
        settingsRow("?", ru ? "Центр помощи" : "Help Center", ru ? "Инструкции и частые вопросы" : "Guides and common questions", null, "help"),
        settingsRow("✉", ru ? "Связаться с нами" : "Contact Us", ru ? "Контакт менеджера и поддержки" : "Manager and support contact", "contact"),
        settingsRow("A", ru ? "О платформе ANIMA" : "About ANIMA", ru ? "Цифровая экосистема Далата" : "Dalat digital ecosystem", "about"),
        settingsRow("◇", ru ? "Наши партнёры" : "Our Partners", ru ? "Кафе, отели, транспорт и локальные бренды" : "Cafes, hotels, transport and local brands", "partners"),
        settingsRow("◎", "Instagram", "Stories, places and partner updates", null, "instagram"),
        settingsRow("⌁", "Telegram", ru ? `Менеджер: ${managerTelegram.handle}` : `Direct manager: ${managerTelegram.handle}`, null, "telegram"),
        settingsRow("+", ru ? "Пригласить друзей" : "Invite Friends", ru ? "Поделиться ANIMA с близкими" : "Share ANIMA with people you trust", null, "invite"),
      ])}

      ${settingsSection(ru ? "Бизнес и авторы" : "Business & Creator", [
        settingsRow("✦", ru ? "Стать партнёром" : "Become a Partner", ru ? "Присоединиться к экосистеме ANIMA" : "Join the ANIMA ecosystem", "for-business"),
        settingsRow("◍", ru ? "Предложить сервис" : "Offer a Service", ru ? "Создать профиль локального провайдера" : "Create your local provider profile", "services"),
        settingsRow("↗", ru ? "Продвигать бизнес" : "Promote Your Business", ru ? "Партнёрские кампании и видимость" : "Partner campaigns and visibility", "for-business"),
        settingsRow("⌁", ru ? "Цифровые решения" : "Digital Solutions", ru ? "Сайты, приложения и автоматизация" : "Websites, apps and automation", "tech-solutions"),
        settingsRow("▣", ru ? "Бизнес-панель" : "Business Dashboard", ru ? "Будущие инструменты партнёра" : "Future partner tools", null, "business-dashboard"),
      ])}

      ${settingsSection(ru ? "Параметры аккаунта" : "Settings", [
        settingsRow("⌘", ru ? "Двухфакторная защита" : "Two-Factor Auth", currentAuthUser?.security?.twoFactorEnabled ? (ru ? "Включена" : "Enabled") : (ru ? "Выключена" : "Disabled"), null, "two-factor"),
        settingsRow("#", ru ? "PIN приложения" : "App PIN", currentAuthUser?.security?.pinEnabled ? (ru ? "Включён" : "Enabled") : (ru ? "Выключен" : "Disabled"), null, "app-pin"),
        settingsRow("◎", "Face ID", currentAuthUser?.security?.faceIdEnabled ? (ru ? "Включён" : "Enabled") : (ru ? "Выключен" : "Disabled"), null, "face-id"),
        settingsRow("◎", ru ? "Приватность" : "Privacy", ru ? "Данные и разрешения" : "Data and permissions", null, "privacy"),
        settingsRow("§", ru ? "Условия и правила" : "Terms & Policies", ru ? "Юридическая информация и правила" : "Legal and platform rules", null, "terms"),
        settingsRow("i", ru ? "Версия приложения" : "App Version", "ANIMA 0.1 MVP", null, "version"),
        settingsRow("↩", ru ? "Выйти" : "Log Out", ru ? "Завершить текущую сессию" : "End current session", null, "logout"),
      ])}
    </div>
  `;
  perfMark("renderProfile.user-data", startedAt);
  return html;
}

function settingsSection(title, rows) {
  return `<section class="settings-section"><h2>${title}</h2><div class="settings-list">${rows.join("")}</div></section>`;
}

function settingsRow(icon, title, subtitle, screen, action) {
  const attrs = screen ? `data-screen="${screen}"` : action ? `data-profile-action="${action}"` : "";
  return `
    <a class="settings-row" href="#" ${attrs}>
      <span class="settings-icon">${icon}</span>
      <span class="settings-copy"><strong>${title}</strong><small>${subtitle}</small></span>
      <span class="settings-chevron">›</span>
    </a>
  `;
}

function renderRewardsCenter(config) {
  const progress = Math.round((data.user.points / data.user.nextLevel) * 100);
  const remaining = data.user.nextLevel - data.user.points;
  return `
    <div class="screen-inner rewards-center-screen">
      ${renderHeader(config, { back: true })}
      ${renderProfileRewardsCard(progress, remaining)}
      <section class="settings-section">
        <h2>Rewards Center</h2>
        <div class="settings-list">
          ${settingsRow("◌", "Rewards History", "Recent QR scans and partner bonuses", null, "history")}
          ${settingsRow("◇", "Achievements", "Dalat Starter, Cafe Explorer, First QR Scan", null, "achievements")}
          ${settingsRow("◎", "Rewards Marketplace", "Offers, perks and partner bonuses", null, "marketplace")}
        </div>
      </section>
      <section class="profile-card">
        <h2>Member Offers</h2>
        <div class="achievement-grid">
          ${["Cafe bonus +20%", "Transport reward", "Experience cashback", "Partner drink"].map((item) => `<span>${item}</span>`).join("")}
        </div>
      </section>
    </div>
  `;
}

function renderProfileRewardsCard(progress, remaining) {
  return `
    <article class="rewards-card profile-rewards-card">
      <div class="coin-orbit" aria-hidden="true">
        <img src="./assets/anima-points-coin.png" alt="" />
      </div>
      <div class="reward-copy">
        <h2>You earn with ANIMA <span aria-hidden="true">✦</span></h2>
        <p>Use ANIMA Points and get amazing rewards.</p>
        <a class="cream-button" href="#">
          <span>View rewards</span>
          <span aria-hidden="true">→</span>
        </a>
      </div>
      <div class="points-panel">
        <p>ANIMA Points</p>
        <div class="points-total">
          <strong>${data.user.points.toLocaleString("en-US")}</strong>
          <img src="./assets/anima-points-coin.png" alt="" aria-hidden="true" />
        </div>
        <p>Until next level<br />${remaining} pts needed</p>
        <div class="progress"><span style="width:${progress}%"></span></div>
        <span class="level-badge">Level 2</span>
      </div>
    </article>
  `;
}

function renderProfilePlusCard() {
  return `
    <article class="plus-card profile-plus-card" id="anima-plus">
      <div class="plus-main">
        <div class="plus-brand">
          <img class="plus-mark" src="./assets/anima-plus-mark.png" alt="" aria-hidden="true" />
          <div>
            <h2>
              <img src="./assets/anima-wordmark.png" alt="ANIMA" />
              <span>PLUS</span>
            </h2>
            <p>Unlock premium benefits and elevate your journey.</p>
          </div>
        </div>
        <div class="plus-benefits" aria-label="ANIMA Plus benefits">
          <span class="benefit-item">
            <img class="benefit-icon" src="./assets/plus-benefit-discounts.png" alt="" aria-hidden="true" />
            <span>Exclusive<br />discounts</span>
          </span>
          <span class="benefit-item">
            <img class="benefit-icon" src="./assets/plus-benefit-vip.png" alt="" aria-hidden="true" />
            <span>VIP<br />access</span>
          </span>
          <span class="benefit-item">
            <img class="benefit-icon" src="./assets/plus-benefit-support.png" alt="" aria-hidden="true" />
            <span>Priority<br />support</span>
          </span>
          <span class="benefit-item">
            <img class="benefit-icon" src="./assets/plus-benefit-rewards.png" alt="" aria-hidden="true" />
            <span>Special<br />rewards</span>
          </span>
        </div>
        <a class="plus-learn" href="#" data-screen="anima-plus" aria-label="Learn more about ANIMA Plus">
          Learn more about ANIMA Plus <span aria-hidden="true">→</span>
        </a>
      </div>
      <div class="plus-price">
        <p>ANIMA Plus</p>
        ${membershipPriceRow()}
        <small>Cancel anytime</small>
        <a class="plus-cta" href="#" data-screen="anima-plus">Join ANIMA Plus <span aria-hidden="true">→</span></a>
        <div class="plus-note">
          <span aria-hidden="true">✦</span>
          <p>Save more. Experience more.<br />Only with ANIMA Plus.</p>
        </div>
      </div>
    </article>
  `;
}

function membershipPriceRow() {
  const price = formatCurrencyText("149,000 VND").replace(" VND", "");
  const suffix = userSettings.currency === "VND" ? "VND" : userSettings.currency;
  return `<div class="plus-price-row"><strong>${price}</strong><span>${suffix}</span><small>/ month</small></div>`;
}

function renderAnimaPlusDetails(config) {
  const benefits = [
    ["⌁", "Hidden Places", "Discover carefully selected hidden spots, scenic routes and unique places beyond public travel guides."],
    ["☘", "Private Farms", "Access selected private farms and unique local experiences unavailable to regular visitors."],
    ["◇", "Curated Experiences", "Join premium routes, forest adventures, coffee farm journeys and unique Dalat programs created by ANIMA."],
    ["✦", "Premium Rewards", "Earn enhanced ANIMA Points, exclusive offers and special member-only partner bonuses."],
    ["↯", "Priority Booking", "Get priority access to experiences, reservations and premium partner offers."],
    ["◌", "24/7 Concierge Support", "Receive fast support and personalized assistance from the ANIMA team."],
  ];
  const hiddenAccess = [
    ["Hidden waterfalls", "Private water routes revealed only after booking.", "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=82"],
    ["Private coffee farms", "Selected farms, tastings and quiet local hosts.", "https://images.unsplash.com/photo-1511537190424-bbbab87ac5eb?auto=format&fit=crop&w=900&q=82"],
    ["Forest cabins", "Slow mornings, pine air and secluded stays.", "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=900&q=82"],
    ["Secret viewpoints", "Cinematic sunrise routes without public coordinates.", "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=82"],
  ];
  const privileges = ["Selected cafe discounts", "Premium restaurant offers", "Transport bonuses", "Free welcome drinks", "Exclusive menus", "Member-only experiences"];
  const premiumExperiences = data.experiences.map((item) => `
    <article class="plus-experience-card">
      <img src="${item.image}" alt="" />
      <div>
        <span>PLUS</span>
        <h3>${item.title}</h3>
        <p>${item.duration} · ${displayItemPrice(item)}</p>
        <a class="mini-cta" href="#">Book experience</a>
      </div>
    </article>
  `).join("");
  return `
    <div class="screen-inner plus-details-screen">
      ${renderHeader(config, { back: true })}

      <section class="plus-detail-hero">
        <div>
          <p>Exclusive membership</p>
          <h2>ANIMA Plus</h2>
          <span>Access the hidden side of Dalat.</span>
          <small>Curated places. Private experiences. Exclusive access.</small>
          <div class="plus-detail-actions">
            <a class="gold-button" href="#">Join ANIMA Plus</a>
            <strong>${formatCurrencyText("149,000 VND / month")}</strong>
          </div>
        </div>
      </section>

      <section class="plus-copy-block">
        <h2>What is ANIMA Plus?</h2>
        <p>ANIMA Plus is a premium membership designed for travelers, explorers and digital nomads who want to experience a deeper side of Dalat.</p>
        <p>Unlock curated experiences, hidden places, private farms, exclusive routes and premium partner privileges inside the ANIMA ecosystem.</p>
      </section>

      <section class="plus-detail-section">
        <h2>Exclusive Benefits</h2>
        <div class="plus-benefit-grid">
          ${benefits.map(([icon, title, text]) => `<article><span>${icon}</span><h3>${title}</h3><p>${text}</p></article>`).join("")}
        </div>
      </section>

      <section class="plus-hidden-section">
        <h2>More than a travel app.</h2>
        <p>ANIMA Plus gives access to a carefully curated ecosystem of places, experiences and local connections designed for a deeper Dalat lifestyle experience.</p>
        <div class="hidden-access-scroll">
          ${hiddenAccess.map(([title, text, image]) => `
            <article style="--hidden-img: url('${image}')">
              <div><h3>${title}</h3><span>${text}</span></div>
            </article>
          `).join("")}
        </div>
      </section>

      <section class="plus-detail-section">
        <h2>Partner Privileges</h2>
        <div class="partner-privileges-grid">
          ${privileges.map((item) => `<article><span>✦</span><p>${item}</p></article>`).join("")}
        </div>
      </section>

      <section class="plus-detail-section">
        <h2>Exclusive Experiences</h2>
        <div class="plus-experience-list">${premiumExperiences}</div>
      </section>

      <section class="plus-rewards-block">
        <div>
          <h2>Earn More with ANIMA</h2>
          <p>Enhanced cashback, bonus ANIMA Points, member-only offers, partner rewards and priority promotions.</p>
        </div>
        <div class="plus-reward-visual">
          <img src="./assets/anima-points-coin.png" alt="" aria-hidden="true" />
          <span>2x partner bonus</span>
        </div>
      </section>

      <section class="plus-final-cta">
        <h2>Unlock the hidden side of Dalat.</h2>
        <p>Join ANIMA Plus and access curated experiences, private places and premium benefits.</p>
        <div>
          <a class="gold-button" href="#">Join ANIMA Plus</a>
          <a class="mini-cta" href="#">Learn more</a>
        </div>
      </section>
    </div>
  `;
}

function renderAbout(config) {
  const sections = [
    ["What is ANIMA", "ANIMA is a modern lifestyle and travel ecosystem connecting Dalat's best places, services, experiences and community in one calm digital space."],
    ["Our Mission", "We are building more than a location app: ANIMA is a digital layer for living, exploring, working, meeting people and discovering the local culture of Dalat."],
    ["Community", "Travelers, locals, expats and digital nomads can save places, share experiences, discover events and become part of a living city network."],
    ["For Travelers", "Find curated cafes, restaurants, stays, hidden gems, transport and premium experiences without losing the atmosphere of the city."],
    ["For Digital Nomads", "Use ANIMA as a soft entry point into work-friendly cafes, long stays, services, community meetups and local opportunities."],
    ["For Businesses & Partners", "Partners can reach a high-intent audience, promote services, join QR rewards and grow through the ANIMA ecosystem."],
    ["Ecosystem Vision", "ANIMA unites travel, lifestyle, community, local business, digital services and immersive city experience into one premium platform."],
  ];
  return `
    <div class="screen-inner about-screen">
      ${renderHeader(config, { back: true })}
      <section class="about-hero">
        <p class="brand-kicker">ΛNIMΛ Dalat</p>
        <h2>A city ecosystem inspired by nature, movement and digital lifestyle.</h2>
        <p>Curated places. Local partners. Community energy. Premium tools for a deeper Dalat experience.</p>
      </section>
      <section class="about-grid">
        ${sections.map(([title, text]) => `<article><span>✦</span><h3>${title}</h3><p>${text}</p></article>`).join("")}
      </section>
      <section class="about-cta">
        <h2>Build Dalat with ANIMA.</h2>
        <p>Join the community, become a partner, or follow the platform as the ecosystem grows.</p>
        <div>
          <a class="gold-button" href="#" data-screen="for-business">Become a Partner</a>
          <a class="mini-cta" href="#" data-screen="community">Join Community</a>
          <a class="mini-cta" href="https://www.instagram.com/anima.dalat/" target="_blank" rel="noopener">Follow ANIMA</a>
        </div>
      </section>
    </div>
  `;
}

function renderPartners(config) {
  const ru = isRussianLanguage();
  return `
    <div class="screen-inner partners-screen">
      ${renderHeader(config, { back: true })}
      <section class="partners-intro-card">
        <p class="brand-kicker">${ru ? "Наши партнёры" : "Our partners"}</p>
        <h2>${ru ? "Только реальные партнёры из вашей базы." : "Only real partners from your database."}</h2>
        <p>${ru ? "Без демо-кафе и тестовых мест. Здесь показываются только подключённые бизнесы." : "No demo cafes or placeholder locations. Only connected businesses are shown here."}</p>
      </section>
      <section class="partner-list">
        ${data.partners.map((partner) => `
          <article class="partner-card" style="--partner-img: url('${partner.image}')">
            <div class="partner-logo">${partner.name.split(" ").map((word) => word[0]).slice(0, 2).join("")}</div>
            <div>
              <p>${partner.category} · ${partner.rating} ★</p>
              <h3>${partner.name}</h3>
              <span>${partner.description}</span>
              <small>${partner.location}</small>
              <div class="tag-row">${partner.tags.map((tag) => `<em>${tag}</em>`).join("")}</div>
            </div>
            <a class="mini-cta" href="#" ${actionAttrs(`Partner: ${partner.name}`, `Open partner contact request for ${partner.name}.`)}>View partner</a>
          </article>
        `).join("")}
      </section>
    </div>
  `;
}

function userBookings() {
  if (!currentAuthUser?.id || !window.ANIMA_DB?.getState) return [];
  const state = window.ANIMA_DB.getState(baseData);
  return [...(state.tables.partnerBookings || [])]
    .filter((booking) => booking.client_id === currentAuthUser.id)
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

function bookingChats(bookingId) {
  if (!window.ANIMA_DB?.getState) return [];
  const state = window.ANIMA_DB.getState(baseData);
  return (state.tables.chats || []).filter((chat) => chat.booking_id === bookingId);
}

function chatMessages(chatId) {
  if (!window.ANIMA_DB?.getState) return [];
  const state = window.ANIMA_DB.getState(baseData);
  return (state.tables.messages || [])
    .filter((message) => message.chat_id === chatId)
    .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
}

function openBookingChat(bookingId) {
  const booking = userBookings().find((item) => item.id === bookingId);
  if (!booking) return;
  const chat = bookingChats(bookingId).find((item) => item.type === "client_hotel");
  if (!chat) {
    openInfoModal(isRussianLanguage() ? "Чат пока не готов" : "Chat unavailable", isRussianLanguage() ? "Для этой брони чат ещё не создан." : "This booking chat is not created yet.");
    return;
  }
  const messages = chatMessages(chat.id);
  const ru = isRussianLanguage();
  const modal = createSettingsModal(ru ? "Связь с объектом" : "Contact property", `
    <div class="ops-list">
      ${messages.length ? messages.map((message) => `
        <div>
          <strong>${escapeHtml(message.sender_role === "client" ? (ru ? "Вы" : "You") : message.sender_role === "partner" ? (ru ? "Объект" : "Property") : "ANIMA")}</strong>
          <span>${escapeHtml(message.text)} · ${escapeHtml(new Date(message.createdAt || Date.now()).toLocaleString(ru ? "ru-RU" : "en-US"))}</span>
        </div>
      `).join("") : `<div><strong>${ru ? "Пока пусто" : "No messages yet"}</strong><span>${ru ? "Можно написать первым" : "You can send the first message"}</span></div>`}
    </div>
    <form data-client-chat-form>
      <textarea name="text" required placeholder="${ru ? "Напишите сообщение объекту" : "Write a message to the property"}"></textarea>
      <button class="gold-button" type="submit">${ru ? "Отправить" : "Send"}</button>
    </form>
  `, { centered: true });
  modal.querySelector("[data-client-chat-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = String(new FormData(event.currentTarget).get("text") || "").trim();
    if (!text) return;
    window.ANIMA_DB?.addMessage({
      chatId: chat.id,
      bookingId,
      partnerId: booking.partner_id,
      senderId: currentAuthUser?.id || "",
      senderRole: "client",
      text,
    }, baseData);
    modal.remove();
    openBookingChat(bookingId);
  });
}

function renderBookingsScreen(config) {
  const ru = isRussianLanguage();
  const bookings = userBookings();
  return `
    <div class="screen-inner bookings-screen">
      ${renderHeader(config, { back: true })}
      <section class="partners-intro-card">
        <p class="brand-kicker">${ru ? "Мои бронирования" : "My bookings"}</p>
        <h2>${ru ? "Ваши заявки, оплаты и детали проживания" : "Your requests, payments and stay details"}</h2>
        <p>${ru ? "Здесь можно посмотреть статусы брони и быстро связаться с объектом или поддержкой." : "Check booking statuses and quickly contact the property or support."}</p>
      </section>
      <section class="listing-stack">
        ${bookings.length ? bookings.map((booking) => `
          <article class="listing-card economy-card">
            <div>
              <p>${escapeHtml(booking.start_date || "")} - ${escapeHtml(booking.end_date || "")}</p>
              <h3>${escapeHtml(booking.customer_name || "")}</h3>
              <span>${escapeHtml(booking.booking_status || "")} · ${formatMoney(Number(booking.total_amount || 0), userSettings.currency)}</span>
              <small>${ru ? "Гостей" : "Guests"}: ${Number(booking.guests_count || 1)} · ${ru ? "Телефон объекта через чат" : "Contact property through chat"}</small>
            </div>
            <div class="listing-actions">
              <a class="mini-cta" href="#" data-booking-contact="${escapeAttr(booking.id)}">${ru ? "Связаться с объектом" : "Contact property"}</a>
              <a class="mini-cta" href="#" data-booking-support="${escapeAttr(booking.id)}">${ru ? "Тех-поддержка" : "Support"}</a>
            </div>
          </article>
        `).join("") : `<article class="empty-state"><h3>${ru ? "Пока нет бронирований" : "No bookings yet"}</h3><p>${ru ? "После отправки заявки она появится здесь." : "Your booking will appear here after submission."}</p></article>`}
      </section>
    </div>
  `;
}

function renderContact(config) {
  return `
    <div class="screen-inner contact-screen">
      ${renderHeader(config, { back: true })}
      <section class="contact-card">
        <p class="brand-kicker">Contact ΛNIMΛ</p>
        <h2>Need help, partnership details or manager support?</h2>
        <p>Use Telegram for direct manager contact. Instagram is prepared for public updates, partner stories and ecosystem announcements.</p>
        <div class="contact-actions">
          <a class="gold-button" href="${managerTelegram.url}" target="_blank" rel="noopener">Telegram ${managerTelegram.handle}</a>
          <a class="mini-cta" href="https://www.instagram.com/anima.dalat/" target="_blank" rel="noopener">Instagram</a>
        </div>
      </section>
    </div>
  `;
}

function sectionTitle(screen) {
  return {
    stay: "Stay listings",
    eat: "Restaurant cards",
    experiences: "Curated programs",
    transport: "Transport listings",
    saved: "Saved places",
    jobs: "Job cards",
    services: "Provider cards",
    "tech-solutions": "Digital services",
  }[screen] || "Listings";
}

function openSearchResults(query) {
  const normalized = String(query || "").trim();
  if (!normalized) return;
  const bestMatch = getBestSearchMatch(normalized);
  if (bestMatch?.detailTitle) {
    hideSearchSuggestions();
    if (currentAuthUser) {
      openDetailScreen(bestMatch.detailTitle);
    } else {
      openGuestRestrictionModal(userSettings.language === "Russian" ? "Нужен вход" : "Sign in required");
    }
    return;
  }
  currentSearchQuery = normalized;
  navigateTo("search");
}

function bindScreenActions() {
  screenView.querySelectorAll("[data-screen]").forEach((item) => {
    item.addEventListener("click", (event) => {
      event.preventDefault();
      navigateTo(item.dataset.screen);
    });
  });
  screenView.querySelectorAll(".filter-chips button").forEach((button) => {
    button.addEventListener("click", () => {
      button.parentElement.querySelectorAll("button").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
    });
  });
  screenView.querySelectorAll("[data-saved-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      const filter = String(button.dataset.savedFilter || "All").toLowerCase();
      button.parentElement?.querySelectorAll("button").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      screenView.querySelectorAll(".saved-card").forEach((card) => {
        const group = String(card.dataset.savedGroup || "").toLowerCase();
        card.hidden = filter !== "all" && !group.includes(filter);
      });
    });
  });
  const searchForm = screenView.querySelector("[data-search-form]");
  const searchResultsInput = screenView.querySelector("[data-search-results-input]");
  searchForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    openSearchResults(searchResultsInput?.value || "");
  });
  searchResultsInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      openSearchResults(searchResultsInput.value);
    }
  });
  screenView.querySelectorAll("[data-transport-category]").forEach((button) => {
    button.addEventListener("click", () => {
      button.parentElement.querySelectorAll("button").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      const content = screenView.querySelector(".transport-content");
      if (content) content.innerHTML = renderTransportContent(button.dataset.transportCategory);
      bindTransportDynamicActions();
    });
  });
  screenView.querySelectorAll("[data-eat-category]").forEach((button) => {
    button.addEventListener("click", () => {
      button.parentElement.querySelectorAll("button").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      const list = screenView.querySelector(".eat-list");
      if (list) list.innerHTML = renderEatListings(button.dataset.eatCategory);
      const map = screenView.querySelector(".eat-map-sync");
      if (map) map.innerHTML = renderEatMap(button.dataset.eatCategory);
      const heading = screenView.querySelector(".eat-list-section .section-heading");
      if (heading) heading.innerHTML = `<h2>${button.dataset.eatCategory}</h2><span>${renderEatListingsCount(button.dataset.eatCategory)} places</span>`;
      bindEatDynamicActions();
    });
  });
  screenView.querySelectorAll("[data-stay-category]").forEach((button) => {
    button.addEventListener("click", () => {
      button.parentElement.querySelectorAll("button").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      stayFilters.category = button.dataset.stayCategory;
      const list = screenView.querySelector(".stay-list");
      if (list) list.innerHTML = renderStayListings();
      bindStayDynamicActions();
    });
  });
  bindStoreActions();
  screenView.querySelectorAll("[data-profile-action]").forEach((item) => {
    item.addEventListener("click", (event) => {
      event.preventDefault();
      handleProfileAction(item.dataset.profileAction);
    });
  });
  bindActionTriggers(screenView);
  screenView.querySelectorAll(".save-button").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.saveItem) {
        const saved = toggleSavedItem(JSON.parse(button.dataset.saveItem));
        button.classList.toggle("saved", saved);
      } else {
        button.classList.toggle("saved");
      }
    });
  });
  screenView.querySelectorAll(".map-marker").forEach((marker) => {
    marker.addEventListener("click", () => {
      const point = data.mapPoints[Number(marker.dataset.mapIndex)];
      screenView.querySelectorAll(".map-marker").forEach((item) => item.classList.remove("active"));
      marker.classList.add("active");
      screenView.querySelector("#map-type").textContent = point.type;
      screenView.querySelector("#map-title").textContent = point.title;
      screenView.querySelector("#map-status").textContent = point.status;
      screenView.querySelector(".map-info .reward-badge").innerHTML = `<img src="./assets/anima-points-coin.png" alt="" aria-hidden="true" /> ${point.points} pts`;
    });
  });
  screenView.querySelectorAll(".map-toolbar button").forEach((button) => {
    button.addEventListener("click", () => {
      button.parentElement.querySelectorAll("button").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
    });
  });
  screenView.querySelectorAll("[data-back]").forEach((button) => {
    button.addEventListener("click", goBack);
  });
  screenView.querySelectorAll("form").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (form.hasAttribute("data-booking-form") || form.hasAttribute("data-partner-application-form")) return;
      if (form.classList.contains("exchange-form")) {
        form.hidden = true;
        form.nextElementSibling.hidden = false;
      }
    });
  });
  bindBookingForms();
  bindBusinessForms();
}

function bindActionTriggers(root) {
  root.querySelectorAll("[data-action-title]").forEach((item) => {
    item.addEventListener("click", (event) => {
      event.preventDefault();
      registerActionOrder(item.dataset.actionTitle);
      openActionModal(item.dataset.actionTitle, item.dataset.actionMessage);
    });
  });
  root.querySelectorAll("[data-booking-contact]").forEach((item) => {
    item.addEventListener("click", (event) => {
      event.preventDefault();
      openBookingChat(item.dataset.bookingContact);
    });
  });
  root.querySelectorAll("[data-booking-support]").forEach((item) => {
    item.addEventListener("click", (event) => {
      event.preventDefault();
      openActionModal(isRussianLanguage() ? "Тех-поддержка" : "Support", isRussianLanguage() ? "Для срочного вопроса по этой брони используйте менеджера ANIMA. Следующим этапом вынесу это в отдельный чат с поддержкой." : "Use ANIMA manager contact for urgent issues on this booking. Next step is moving this into a dedicated support chat.");
    });
  });
  root.querySelectorAll('a[href="#"]:not([data-screen]):not([data-profile-action]):not([data-action-title]):not([data-detail])').forEach((item) => {
    item.addEventListener("click", (event) => {
      event.preventDefault();
      const label = item.textContent.trim() || "ANIMA action";
      openActionModal(label, "This action is prepared for the next MVP stage.");
    });
  });
}

function registerActionOrder(title = "") {
  if (!window.ANIMA_DB) return;
  const text = String(title || "");
  if (!/Reserve:|ANIMA Store request|Contact \/ Book|Связаться \/ Бронь|Book experience/i.test(text)) return;
  window.ANIMA_DB.addOrder({
    title: text,
    source: currentScreen,
    client: data.user?.name || "ANIMA User",
  }, baseData);
}

function currentUserProfileData() {
  return {
    fullName: currentAuthUser?.fullName || currentAuthUser?.name || "",
    birthDate: currentAuthUser?.birthDate || "",
    email: currentAuthUser?.email || "",
    phone: currentAuthUser?.phone || "",
  };
}

function bindBookingForms() {
  screenView.querySelectorAll("[data-booking-form]").forEach((form) => {
    const profile = currentUserProfileData();
    const fullNameInput = form.querySelector('[name="fullName"]');
    const birthDateInput = form.querySelector('[name="birthDate"]');
    const phoneInput = form.querySelector('[name="phone"]');
    const emailInput = form.querySelector('[name="email"]');
    const passportInput = form.querySelector('[name="passportNumber"], [name="passport"]');
    if (fullNameInput && !fullNameInput.value && profile.fullName) fullNameInput.value = profile.fullName;
    if (birthDateInput && !birthDateInput.value && profile.birthDate) birthDateInput.value = profile.birthDate;
    if (phoneInput && !phoneInput.value && profile.phone) phoneInput.value = profile.phone;
    if (emailInput && !emailInput.value && profile.email) emailInput.value = profile.email;
    if (passportInput && !passportInput.value) {
      const parts = [profile.fullName, profile.birthDate].filter(Boolean);
      if (parts.length) passportInput.value = parts.join(" · ");
    }
    const updateSummary = () => refreshBookingSummary(form);
    form.querySelectorAll('input[name="checkin"], input[name="checkout"], input[name="guests"]').forEach((input) => {
      input.addEventListener("input", updateSummary);
      input.addEventListener("change", updateSummary);
    });
    refreshBookingSummary(form);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const booking = bookingTotals(form);
      const createdOrder = window.ANIMA_DB?.addOrder({
        title: `Stay booking: ${form.dataset.bookingForm}`,
        type: "stay-booking",
        source: "stay-detail",
        client: data.user?.name || "ANIMA User",
        userId: currentAuthUser?.id || "",
        stayTitle: form.dataset.bookingForm,
        guestName: String(formData.get("fullName") || "").trim(),
        fullName: String(formData.get("fullName") || "").trim(),
        birthDate: String(formData.get("birthDate") || "").trim(),
        phone: String(formData.get("phone") || "").trim(),
        email: String(formData.get("email") || "").trim(),
        passportNumber: String(formData.get("passportNumber") || "").trim(),
        guests: Number(formData.get("guests") || 1),
        checkin: String(formData.get("checkin") || ""),
        checkout: String(formData.get("checkout") || ""),
        note: String(formData.get("note") || "").trim(),
        totalVnd: booking.totalVnd,
        totalLabel: formatMoney(booking.totalVnd, userSettings.currency),
      }, baseData);
      if (createdOrder?.userId) {
        window.ANIMA_DB?.addNotification({
          userId: createdOrder.userId,
          orderId: createdOrder.id,
          type: "booking-created",
          title: isRussianLanguage() ? "Запрос на бронирование отправлен" : "Booking request sent",
          message: isRussianLanguage()
            ? "Мы отправили ваш запрос на бронирование. Следите за уведомлениями в приложении или на почте: после ответа отеля здесь появится следующий шаг."
            : "Your booking request was sent. Watch app notifications or email for the next step after the hotel replies.",
        }, baseData);
      }
      refreshNotificationDot();
      openInfoModal(
        isRussianLanguage() ? "Бронь отправлена" : "Booking sent",
        isRussianLanguage()
          ? `Запрос на бронирование ${form.dataset.bookingForm} отправлен. Итоговая сумма: ${formatMoney(booking.totalVnd, userSettings.currency)}. Следите за уведомлениями в приложении или на почте: после ответа отеля мы покажем следующий шаг для подтверждения.`
          : `Your booking request for ${form.dataset.bookingForm} was sent. Total: ${formatMoney(booking.totalVnd, userSettings.currency)}. Watch app notifications or email for the next approval step.`
      );
    });
  });
}

function bindBusinessForms() {
  screenView.querySelector("[data-partner-application-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    try {
      window.ANIMA_DB?.createPartnerApplication({
        userId: currentAuthUser?.id || "",
        fullName: String(formData.get("fullName") || "").trim(),
        email: String(formData.get("email") || "").trim(),
        position: String(formData.get("position") || "").trim(),
        businessName: String(formData.get("businessName") || "").trim(),
        businessType: String(formData.get("businessType") || "").trim(),
        description: String(formData.get("description") || "").trim(),
        address: String(formData.get("address") || "").trim(),
        phone: String(formData.get("phone") || "").trim(),
        telegram: String(formData.get("telegram") || "").trim(),
        whatsapp: String(formData.get("whatsapp") || "").trim(),
        zalo: String(formData.get("zalo") || "").trim(),
        preferredContact: String(formData.get("preferredContact") || "").trim(),
        website: String(formData.get("website") || "").trim(),
        comment: String(formData.get("comment") || "").trim(),
      }, baseData);
      form.reset();
      openInfoModal(isRussianLanguage() ? "Заявка отправлена" : "Application sent", isRussianLanguage() ? "Заявка уже доступна в админке ANIMA." : "Your application is now available in ANIMA admin.");
    } catch {
      openInfoModal(isRussianLanguage() ? "Не удалось отправить" : "Could not submit", isRussianLanguage() ? "Проверьте поля и попробуйте снова." : "Check the fields and try again.");
    }
  });
}

function bookingTotals(form) {
  const nightlyRate = Number(form.dataset.nightlyRate || 0);
  const cleaningFee = Number(form.dataset.cleaningFee || 0);
  const serviceFee = Number(form.dataset.serviceFee || 0);
  const checkin = form.querySelector('[name="checkin"]')?.value;
  const checkout = form.querySelector('[name="checkout"]')?.value;
  const oneDay = 1000 * 60 * 60 * 24;
  const diff = checkin && checkout ? Math.round((new Date(checkout) - new Date(checkin)) / oneDay) : 0;
  const nights = Math.max(1, diff || 1);
  const subtotal = nightlyRate * nights;
  return {
    nights,
    subtotal,
    totalVnd: subtotal + cleaningFee + serviceFee,
  };
}

function refreshBookingSummary(form) {
  const summary = form.querySelector("[data-booking-summary]");
  if (!summary) return;
  const booking = bookingTotals(form);
  const cleaningFee = Number(form.dataset.cleaningFee || 0);
  const serviceFee = Number(form.dataset.serviceFee || 0);
  summary.innerHTML = `
    <div><span>${isRussianLanguage() ? "Ночей" : "Nights"}</span><b>${booking.nights}</b></div>
    <div><span>${isRussianLanguage() ? "Проживание" : "Stay"}</span><b>${formatMoney(booking.subtotal, userSettings.currency)}</b></div>
    ${cleaningFee ? `<div><span>${isRussianLanguage() ? "Уборка" : "Cleaning fee"}</span><b>${formatMoney(cleaningFee, userSettings.currency)}</b></div>` : ""}
    ${serviceFee ? `<div><span>${isRussianLanguage() ? "Сервисный сбор" : "Service fee"}</span><b>${formatMoney(serviceFee, userSettings.currency)}</b></div>` : ""}
    <strong><span>${isRussianLanguage() ? "Итого" : "Total"}</span><b>${formatMoney(booking.totalVnd, userSettings.currency)}</b></strong>
  `;
}

function bindStoreActions() {
  screenView.querySelectorAll("[data-store-category]").forEach((button) => {
    button.addEventListener("click", () => {
      button.parentElement.querySelectorAll("button").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      selectedStoreCategory = button.dataset.storeCategory;
      const area = screenView.querySelector("[data-store-product-area]");
      if (area) area.innerHTML = renderStoreProductArea();
      bindStoreProductActions();
    });
  });
  bindStoreProductActions();
  screenView.querySelector("[data-store-cart]")?.addEventListener("click", () => showStoreCart(true));
  screenView.querySelector("[data-store-cart-close]")?.addEventListener("click", () => showStoreCart(false));
  bindStoreCartControls();
}

function bindStoreProductActions() {
  screenView.querySelectorAll("[data-store-favorite]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.storeFavorite;
      if (storeFavorites.has(id)) storeFavorites.delete(id);
      else storeFavorites.add(id);
      button.classList.toggle("saved", storeFavorites.has(id));
      safeStorageSet("anima.store.favorites", JSON.stringify([...storeFavorites]));
      const card = button.closest(".store-product-card");
      if (card) toggleSavedItem({ title: card.querySelector("h3")?.textContent || id, type: "Store", category: selectedStoreCategory });
    });
  });
  screenView.querySelectorAll("[data-store-add]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.storeAdd;
      const item = storeCart[id] || { id, title: button.dataset.title, price: button.dataset.price, qty: 0 };
      item.qty += 1;
      storeCart[id] = item;
      safeStorageSet("anima.store.cart", JSON.stringify(storeCart));
      refreshStoreCart();
      showStoreToast("Added to cart");
    });
  });
}

function refreshStoreCart() {
  const counter = screenView.querySelector("[data-store-cart] span");
  if (counter) counter.textContent = storeCartCount();
  const panel = screenView.querySelector(".store-cart-panel");
  if (panel) panel.innerHTML = renderStoreCart();
  screenView.querySelector("[data-store-cart-close]")?.addEventListener("click", () => showStoreCart(false));
  bindStoreCartControls();
}

function showStoreCart(open) {
  const panel = screenView.querySelector(".store-cart-panel");
  if (!panel) return;
  panel.hidden = false;
  panel.classList.toggle("open", open);
  panel.setAttribute("aria-hidden", String(!open));
  if (!open) {
    window.setTimeout(() => {
      if (!panel.classList.contains("open")) panel.hidden = true;
    }, 220);
  }
}

function bindStoreCartControls() {
  screenView.querySelectorAll("[data-cart-inc]").forEach((button) => {
    button.addEventListener("click", () => updateCartQty(button.dataset.cartInc, 1));
  });
  screenView.querySelectorAll("[data-cart-dec]").forEach((button) => {
    button.addEventListener("click", () => updateCartQty(button.dataset.cartDec, -1));
  });
  screenView.querySelectorAll("[data-cart-remove]").forEach((button) => {
    button.addEventListener("click", () => {
      delete storeCart[button.dataset.cartRemove];
      safeStorageSet("anima.store.cart", JSON.stringify(storeCart));
      refreshStoreCart();
    });
  });
  screenView.querySelector(".store-checkout-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    registerActionOrder("ANIMA Store request");
    openActionModal("ANIMA Store request", `Store request is ready. Manager contact: ${managerTelegram.handle}.`);
  });
}

function updateCartQty(id, delta) {
  if (!storeCart[id]) return;
  storeCart[id].qty += delta;
  if (storeCart[id].qty <= 0) delete storeCart[id];
  safeStorageSet("anima.store.cart", JSON.stringify(storeCart));
  refreshStoreCart();
}

function showStoreToast(text) {
  const toast = screenView.querySelector(".store-toast");
  if (!toast) return;
  toast.textContent = text;
  toast.hidden = false;
  toast.classList.add("show");
  window.setTimeout(() => {
    toast.classList.remove("show");
    toast.hidden = true;
  }, 1400);
}

function handleProfileAction(action) {
  if (action === "logout") {
    clearAuthSession();
    currentAuthUser = null;
    lockPin();
    showAuth("choice", { error: "", pinBuffer: "", firstPin: "" });
    return;
  }
  if (action === "language") {
    openChoiceModal(t("profile.language"), ["English", "Russian"], userSettings.language, setLanguage);
    return;
  }
  if (action === "currency") {
    openChoiceModal("Currency", ["VND", "USD", "EUR", "RUB", "UAH"], userSettings.currency, setCurrency);
    return;
  }
  if (action === "notifications") {
    openUserNotifications();
    return;
  }
  if (action === "bookings") {
    navigateTo("bookings");
    return;
  }
  if (action === "support") {
    openInfoModal(isRussianLanguage() ? "Поддержка ANIMA" : "ANIMA support", isRussianLanguage() ? "Для каждой брони используйте кнопку тех-поддержки внутри раздела «Мои бронирования»." : "Use the support action inside My bookings for each reservation.");
    return;
  }
  if (action === "edit-profile") {
    if (!currentAuthUser) return;
    const ru = isRussianLanguage();
    const modal = createSettingsModal(ru ? "Редактировать профиль" : "Edit profile", `
      <form class="profile-edit-form" data-profile-edit-form>
        <label><span>${ru ? "ФИО" : "Full name"}</span><input name="fullName" value="${escapeHtml(currentAuthUser.fullName || currentAuthUser.name || "")}" required /></label>
        <label><span>Email</span><input name="email" type="email" value="${escapeHtml(currentAuthUser.email || "")}" required /></label>
        <label><span>@username</span><input name="username" value="${escapeHtml(currentAuthUser.username || "")}" /></label>
        <label><span>${ru ? "Дата рождения" : "Birth date"}</span><input name="birthDate" type="date" value="${escapeHtml(currentAuthUser.birthDate || "")}" /></label>
        <div class="profile-edit-actions">
          <button class="secondary-button modal-close-button" type="button">${ru ? "Отмена" : "Cancel"}</button>
          <button class="gold-button" type="submit">${ru ? "Сохранить" : "Save"}</button>
        </div>
      </form>
    `, { centered: true });
    modal.querySelector("[data-profile-edit-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      currentAuthUser = window.ANIMA_DB.updateUser(currentAuthUser.id, {
        fullName: String(formData.get("fullName") || "").trim(),
        email: String(formData.get("email") || "").trim(),
        username: String(formData.get("username") || "").trim(),
        birthDate: String(formData.get("birthDate") || "").trim(),
      }, baseData);
      applyCurrentAuthUser();
      modal.remove();
      navigateTo("profile", { preserveHistory: true });
      showToast(ru ? "Профиль обновлён." : "Profile updated.");
    });
    return;
  }
  if (action === "rewards" || action === "marketplace") {
    openInfoModal("Rewards Center", "Rewards marketplace and rewards history will connect to your ANIMA Points activity.");
    return;
  }
  if (action === "telegram") {
    createSettingsModal("Telegram", `
      <p class="settings-modal-text">Contact the ANIMA manager directly on Telegram.</p>
      <div class="request-preview"><span>Manager Telegram</span><strong>${managerTelegram.handle}</strong></div>
      <a class="gold-button telegram-button" href="${managerTelegram.url}" target="_blank" rel="noopener">Open Telegram</a>
      <button class="gold-button modal-close-button" type="button">Done</button>
    `);
    return;
  }
  if (action === "instagram") {
    createSettingsModal("Instagram", `
      <p class="settings-modal-text">Follow ANIMA updates, partner stories and Dalat ecosystem news.</p>
      <a class="gold-button telegram-button" href="https://www.instagram.com/anima.dalat/" target="_blank" rel="noopener">Open Instagram</a>
      <button class="gold-button modal-close-button" type="button">Done</button>
    `);
    return;
  }
  if (action === "two-factor") {
    if (!currentAuthUser) return;
    currentAuthUser = window.ANIMA_DB.updateUser(currentAuthUser.id, {
      security: {
        ...(currentAuthUser.security || {}),
        twoFactorEnabled: !currentAuthUser.security?.twoFactorEnabled,
      },
    }, baseData);
    applyCurrentAuthUser();
    navigateTo("profile", { preserveHistory: true });
    showToast(userSettings.language === "Russian"
      ? `Двухфакторная защита ${currentAuthUser.security?.twoFactorEnabled ? "включена" : "выключена"}.`
      : `Two-factor auth ${currentAuthUser.security?.twoFactorEnabled ? "enabled" : "disabled"}.`);
    return;
  }
  if (action === "app-pin") {
    if (!currentAuthUser) return;
    if (currentAuthUser.security?.pinEnabled) {
      currentAuthUser = window.ANIMA_DB.updateUser(currentAuthUser.id, {
        security: {
          ...(currentAuthUser.security || {}),
          pinEnabled: false,
          pinHash: "",
        },
      }, baseData);
      lockPin();
      navigateTo("profile", { preserveHistory: true });
      showToast(userSettings.language === "Russian" ? "PIN выключен." : "PIN disabled.");
      return;
    }
    return showAuth("pin-setup", { pinPurpose: "setup", pinBuffer: "", firstPin: "", error: "" });
  }
  if (action === "face-id") {
    if (!currentAuthUser) return;
    currentAuthUser = window.ANIMA_DB.updateUser(currentAuthUser.id, {
      security: {
        ...(currentAuthUser.security || {}),
        faceIdEnabled: !currentAuthUser.security?.faceIdEnabled,
      },
    }, baseData);
    navigateTo("profile", { preserveHistory: true });
    showToast(userSettings.language === "Russian"
      ? `Face ID ${currentAuthUser.security?.faceIdEnabled ? "включён" : "выключен"}.`
      : `Face ID ${currentAuthUser.security?.faceIdEnabled ? "enabled" : "disabled"}.`);
    return;
  }
  openInfoModal("ANIMA", "This section is prepared for the next MVP stage.");
}

function openChoiceModal(title, options, currentValue, onSelect) {
  const modal = createSettingsModal(title, options.map((option) => `
    <button class="${option === currentValue ? "selected" : ""}" type="button" data-choice="${option}">
      <span>${option === "Russian" ? t("profile.russian") : option}</span><strong>${option === currentValue ? translatePhrase("Selected") : ""}</strong>
    </button>
  `).join(""));
  modal.querySelectorAll("[data-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      onSelect(button.dataset.choice);
      modal.remove();
    });
  });
}

function openNotificationModal() {
  openUserNotifications();
}

function openInfoModal(title, text) {
  createSettingsModal(title, `<p class="settings-modal-text">${text}</p><button class="gold-button modal-close-button" type="button">Done</button>`);
}

function openActionModal(title, text) {
  createSettingsModal(title || "ANIMA", `
    <p class="settings-modal-text">${text || "This action is prepared for the next MVP stage."}</p>
    <div class="request-preview">
      <span>Manager Telegram</span>
      <strong>${managerTelegram.handle}</strong>
    </div>
    <a class="gold-button telegram-button" href="${managerTelegram.url}" target="_blank" rel="noopener">Open Telegram</a>
    <button class="gold-button modal-close-button" type="button">Done</button>
  `);
}

function createSettingsModal(title, body, options = {}) {
  const modalRoot = screenView.hidden ? phoneShell : screenView;
  modalRoot.querySelector(".settings-modal")?.remove();
  const modal = document.createElement("div");
  modal.className = `settings-modal ${options.centered ? "centered" : ""}`.trim();
  modal.innerHTML = `
    <div class="settings-modal-backdrop" data-close-modal></div>
    <section class="settings-modal-panel ${options.panelClass || ""}">
      <div class="settings-modal-head"><h2>${title}</h2><button type="button" data-close-modal>×</button></div>
      <div class="settings-modal-body">${body}</div>
    </section>
  `;
  modalRoot.appendChild(modal);
  modal.querySelectorAll("[data-close-modal], .modal-close-button").forEach((button) => {
    button.addEventListener("click", () => modal.remove());
  });
  modal.querySelector("[data-guest-auth]")?.addEventListener("click", () => {
    modal.remove();
    clearAuthSession();
    lockPin();
    showAuth("login", { error: "", pinBuffer: "", firstPin: "" });
  });
  return modal;
}

function bindTransportDynamicActions() {
  screenView.querySelectorAll(".transport-content .save-button").forEach((button) => {
    button.addEventListener("click", () => button.classList.toggle("saved"));
  });
  screenView.querySelectorAll(".transport-content [data-detail]").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      if (event.target.closest("a")) event.preventDefault();
      navigateTo(`detail:${card.dataset.detail}`);
    });
  });
}

function bindEatDynamicActions() {
  bindActionTriggers(screenView.querySelector(".eat-list") || screenView);
  screenView.querySelectorAll(".eat-map-marker").forEach((marker) => {
    marker.addEventListener("click", (event) => {
      event.preventDefault();
      navigateTo(`detail:${marker.dataset.detail}`);
    });
  });
  screenView.querySelectorAll(".eat-list .save-button").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.saveItem) toggleSavedItem(JSON.parse(button.dataset.saveItem));
      button.classList.toggle("saved");
    });
  });
  screenView.querySelectorAll(".eat-list [data-detail]").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      if (event.target.closest("a")) event.preventDefault();
      navigateTo(`detail:${card.dataset.detail}`);
    });
  });
}

function bindStayDynamicActions() {
  bindActionTriggers(screenView.querySelector(".stay-list") || screenView);
  screenView.querySelectorAll(".stay-list .save-button").forEach((button) => {
    button.addEventListener("click", () => button.classList.toggle("saved"));
  });
  screenView.querySelectorAll(".stay-list .stay-card").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest(".save-button, .mini-icon-button")) return;
      if (!currentAuthUser) {
        openGuestRestrictionModal(userSettings.language === "Russian" ? "Нужен вход" : "Sign in required");
        return;
      }
      openDetailScreen(card.dataset.detail);
    });
  });
  screenView.querySelectorAll(".stay-list [data-open-detail]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openDetailScreen(button.dataset.openDetail);
    });
  });
}

function openHub() {
  phoneShell?.classList.add("hub-open");
  animaHub?.removeAttribute("hidden");
  animaHub?.removeAttribute("inert");
  animaHub?.setAttribute("aria-hidden", "false");
  centerAction?.setAttribute("aria-expanded", "true");
  centerAction?.setAttribute("aria-label", "Close ANIMA Hub");
}

function closeHub() {
  phoneShell?.classList.remove("hub-open");
  animaHub?.setAttribute("hidden", "");
  animaHub?.setAttribute("inert", "");
  animaHub?.setAttribute("aria-hidden", "true");
  centerAction?.setAttribute("aria-expanded", "false");
  centerAction?.setAttribute("aria-label", "Open ANIMA Hub");
}

if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
  window.requestAnimationFrame(() => startAuthFlow());
} else {
  window.setTimeout(() => startAuthFlow(), 0);
}
