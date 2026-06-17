const data = window.ANIMA_DATA;
const phoneShell = document.querySelector(".phone-shell");
const hero = document.querySelector(".hero");
const homeContent = document.querySelector(".content");
const screenView = document.querySelector(".screen-view");
const animaHub = document.querySelector("#anima-hub");
const centerAction = document.querySelector(".center-action");
const filterButton = document.querySelector(".filter-button");
const searchInput = document.querySelector("#search-input");
const languagePill = document.querySelector(".language-pill");
const languageMenu = document.querySelector(".language-menu");

const filters = ["All", "Open", "Nearby", "Saved"];
let filterIndex = 0;
let currentScreen = "home";
let previousScreen = "home";
const navigationStack = ["home"];
const stayFilters = { category: "Hotels", budget: "All budgets", area: "All areas" };
const rootScreens = new Set(["home", "feed", "saved", "profile"]);
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

const languageCodes = {
  English: "EN",
  Russian: "RU",
};

const I18N = {
  English: {
    "language.choose": "Choose language",
    "common.home": "Home",
    "common.feed": "Feed",
    "common.saved": "Saved",
    "common.profile": "Profile",
    "common.openFeed": "Open Feed",
    "home.goodMorning": "Good morning,",
    "home.welcome": "Welcome to Dalat",
    "home.subtitle": "Your digital ecosystem for exploring Dalat.",
    "home.search": "Search places, services, experiences...",
    "home.mainSections": "Main Sections",
    "home.ecosystem": "ANIMA Ecosystem",
    "home.trending": "Trending in Dalat",
    "home.partners": "Our Partners",
    "home.social": "Connect With Us",
    "weather.label": "Current weather",
    "weather.loading": "Loading weather...",
    "weather.unavailable": "Weather temporarily unavailable",
    "weather.feelsLike": "Feels like",
    "weather.humidity": "Humidity",
    "weather.wind": "Wind",
    "weather.updated": "Updated",
    "profile.english": "English",
    "profile.russian": "Russian",
    "profile.language": "Language",
  },
  Russian: {
    "language.choose": "Выбрать язык",
    "common.home": "Главная",
    "common.feed": "Лента",
    "common.saved": "Сохранённое",
    "common.profile": "Профиль",
    "common.openFeed": "Открыть ленту",
    "home.goodMorning": "Доброе утро,",
    "home.welcome": "Добро пожаловать в Далат",
    "home.subtitle": "Ваша цифровая экосистема для исследования Далата.",
    "home.search": "Поиск мест, сервисов, впечатлений...",
    "home.mainSections": "Основные разделы",
    "home.ecosystem": "Экосистема ANIMA",
    "home.trending": "Популярное в Далате",
    "home.partners": "Наши партнёры",
    "home.social": "Мы на связи",
    "weather.label": "Текущая погода",
    "weather.loading": "Загрузка погоды...",
    "weather.unavailable": "Погода временно недоступна",
    "weather.feelsLike": "Ощущается как",
    "weather.humidity": "Влажность",
    "weather.wind": "Ветер",
    "weather.updated": "Обновлено",
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
  "Digital Solutions": "Digital-решения",
  Store: "Магазин",
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
  "Digital Nomads": "Digital nomads",
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
  Wellness: "Wellness",
  Premium: "Премиум",
  Moto: "Мото",
  "Bike / E-bike": "Байк / E-bike",
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
  "English-speaking": "Англоязычное",
  "Digital Nomad Friendly": "Для digital nomads",
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

const screenConfig = {
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
    chips: ["Hotels", "Apartments", "Houses", "Villas", "Long-term"],
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
  filterIndex = (filterIndex + 1) % filters.length;
  filterButton.setAttribute("aria-label", `Filter results: ${filters[filterIndex]}`);
});

document.querySelectorAll(".utility-nav a").forEach((item) => {
  item.addEventListener("click", (event) => {
    event.preventDefault();
    document.querySelectorAll(".utility-nav a").forEach((link) => link.classList.remove("active"));
    item.classList.add("active");
    if (item.dataset.screen) navigateTo(item.dataset.screen);
  });
});

syncTopLanguage();
applyI18n(document);
initWeather();

languagePill?.addEventListener("click", (event) => {
  event.stopPropagation();
  const isOpen = languagePill.getAttribute("aria-expanded") === "true";
  languagePill.setAttribute("aria-expanded", String(!isOpen));
  languageMenu.hidden = isOpen;
});

languageMenu?.querySelectorAll("button").forEach((button) => {
  button.addEventListener("click", () => {
    setLanguage(button.dataset.lang || "English");
    languagePill.setAttribute("aria-expanded", "false");
    languageMenu.hidden = true;
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

searchInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    searchInput.blur();
  }
});

function navigateTo(screen, options = {}) {
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
  screenView.innerHTML = renderScreen(screen);
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
  document.querySelectorAll(".bottom-nav a[data-screen]").forEach((link) => {
    link.classList.toggle("active", link.dataset.screen === screen);
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
  return `
    <div class="filter-chips">${config.chips.map((chip, index) => `<button class="${index === 0 ? "active" : ""}" type="button">${chip}</button>`).join("")}</div>
  `;
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

function setLanguage(language) {
  userSettings.language = language;
  safeStorageSet("anima.language", language);
  syncTopLanguage();
  applyI18n(document);
  renderWeather(latestWeather);
  if (currentScreen !== "home") {
    screenView.innerHTML = renderScreen(currentScreen);
    bindScreenActions();
    applyI18n(screenView);
  }
}

function setCurrency(currency) {
  userSettings.currency = currency;
  safeStorageSet("anima.currency", currency);
  if (currentScreen !== "home") {
    screenView.innerHTML = renderScreen(currentScreen);
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
  if (screen === "profile") return renderProfile(config);
  if (screen === "anima-plus") return renderAnimaPlusDetails(config);
  if (screen === "rewards") return renderRewardsCenter(config);
  if (screen === "feed") return renderFeed(config);
  if (screen === "saved") return renderSaved(config);
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

function renderStore(config) {
  const categories = storeCategories();

  return `
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
        <img src="./assets/anima-store-card.png" alt="ANIMA Store curated products from Dalat" />
      </a>

      <nav class="store-category-row" id="store-products" aria-label="Store categories">
        ${categories.map(([label, icon], index) => `
          <button class="${label === selectedStoreCategory ? "active" : ""}" type="button" data-store-category="${label}">
            ${storeIcon(icon)}
            <span>${label}</span>
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
  return [
    ["specialty-coffee", "Coffee", "Specialty Coffee", "250g", "240,000 VND", "coffee-bag"],
    ["espresso-blend", "Coffee", "Espresso Blend", "250g", "240,000 VND", "coffee-bag"],
    ["drip-bag", "Coffee", "Drip Bag Coffee", "10 bags", "160,000 VND", "coffee-bag"],
    ["forest-honey", "Honey & Bee Products", "Forest Honey", "500ml", "280,000 VND", "honey-jar"],
    ["raw-honey", "Honey & Bee Products", "Raw Honey with Comb", "400g", "320,000 VND", "honey-jar"],
    ["bee-pollen", "Honey & Bee Products", "Bee Pollen", "150g", "180,000 VND", "pollen"],
    ["propolis", "Honey & Bee Products", "Propolis Extract", "30ml", "250,000 VND", "dropper"],
    ["dalat-strawberries", "Strawberry", "Dalat Strawberries", "1kg", "180,000 VND", "strawberry-box"],
    ["premium-strawberries", "Strawberry", "Premium Strawberries", "500g", "100,000 VND", "strawberry-box"],
    ["strawberry-jam", "Strawberry", "Strawberry Jam", "250g", "120,000 VND", "jam"],
    ["freeze-dried-strawberries", "Strawberry", "Freeze Dried Strawberries", "50g", "120,000 VND", "berry-bag"],
    ["anima-mug", "Merch", "ANIMA Mug", "350ml", "250,000 VND", "mug"],
    ["forest-honey", "Gift Sets", "Dalat Forest Gift Box", "3 items", "520,000 VND", "honey-jar"],
    ["strawberry-jam", "Dairy Products", "Dalat Yogurt & Jam Set", "4 jars", "180,000 VND", "jam"],
    ["premium-strawberries", "Flowers", "Dalat Flower Box", "seasonal", "220,000 VND", "strawberry-box"],
    ["drip-bag", "Eco Products", "Reusable Coffee Travel Kit", "eco set", "360,000 VND", "coffee-bag"],
  ];
}

function renderStoreProductArea() {
  const products = storeProducts().filter((item) => item[1] === selectedStoreCategory);
  return `
    <div class="store-shelf-heading">
      <h2>${selectedStoreCategory}</h2>
      <span>Digital Nature Lifestyle goods</span>
    </div>
    <div class="store-product-grid">
      ${products.map(([, ...item]) => renderStoreProduct(item)).join("")}
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

function renderStoreProduct([id, title, size, price, visual]) {
  const isSaved = storeFavorites.has(id);
  return `
    <article class="store-product-card">
      <button class="store-favorite ${isSaved ? "saved" : ""}" type="button" data-store-favorite="${id}" aria-label="Add ${title} to favorites">♡</button>
      <div class="store-product-visual ${visual}" aria-hidden="true">
        <img src="./assets/store-products/${id}.png" alt="" />
        <span>${title.includes("ANIMA") ? "ANIMA" : "ANIMA"}</span>
      </div>
      <h3>${title}</h3>
      <p>${size}</p>
      <strong>${formatCurrencyText(price)}</strong>
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
  const item = findItemByTitle(title);
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
          <span>Price: ${formatCurrencyText(item?.price || item?.salary || "Contact manager")}</span>
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
              <div><span>${item.category}</span><h3>${item.title}</h3><p>★ ${item.rating} · ${formatCurrencyText(item.price)}</p></div>
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

function findItemByTitle(title) {
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
  ].flat().find((item) => item.title === title);
}

function renderScreenExtra(screen) {
  if (screen === "stay") return `<article class="ai-card"><h2>Long-term stays for digital nomads</h2><p>Monthly homes with desks, fast Wi-Fi and quiet neighborhoods.</p></article>`;
  if (screen === "eat") return `<article class="ai-card"><h2>Scan QR at partner cafes</h2><p>Earn ANIMA Points when you visit selected cafes and restaurants.</p></article>`;
  return "";
}

function renderSaved(config) {
  const categories = ["Stay", "Places", "Store", "Routes", "Experiences"];
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
  return `
    <article class="saved-card" data-saved-group="${item.type || item.group || item.category}" data-detail="${item.title}" style="--saved-img: url('${item.image || "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=82"}')">
      <button class="save-button inline saved" type="button" aria-label="Saved ${item.title}">♡</button>
      <div>
        <span>${item.type || item.group || item.category}</span>
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
      <div><p>${provider.profession} · ${provider.category}</p><h3>${provider.title}</h3><span>${provider.rating} ★ · ${provider.location} · ${formatCurrencyText(provider.price)}</span><small>${provider.description}</small><em>Verified by ANIMA</em></div>
      <div class="listing-actions">${rewardBadge(provider.points)}<button class="save-button inline" type="button">♡</button><a class="mini-cta" href="#" ${actionAttrs(`Contact: ${provider.title}`, "ANIMA manager contact flow will open here.")}>View</a></div>
    </article>
  `;
}

function renderBusiness(config) {
  return `
    <div class="screen-inner">
      ${renderHeader(config, { back: true })}
      <article class="feature-card economy-feature">
        <div><p>Partner growth portal</p><h2>Bring more customers to your business</h2><span>Join the ANIMA ecosystem and reach travelers, locals and digital nomads around your city.</span></div>
        <div class="feature-footer"><span></span><a class="gold-button" href="#" ${actionAttrs("Become a partner", "Partner application request has been prepared.")}>Become a partner</a></div>
      </article>
      <section class="stats-grid">${data.businessStats.map((stat) => `<article><strong>${stat.split(" ")[0]}</strong><span>${stat.split(" ").slice(1).join(" ")}</span></article>`).join("")}</section>
      <section class="screen-section"><div class="section-heading compact"><h2>Partner benefits</h2></div><div class="benefit-grid">${data.businessBenefits.map(benefitCard).join("")}</div></section>
      <section class="screen-section"><div class="section-heading compact"><h2>Use cases</h2></div>${horizontalCards(["Restaurant", "Bike rental", "Hotel", "Tour agency", "Coworking"].map((title) => ({ title, category: "Partner flow", meta: "Visibility · rewards · analytics" })))}</section>
      <article class="ai-card"><h2>Start growing with ANIMA</h2><p>Apply as a partner and prepare your business for the city ecosystem.</p><a class="gold-button" href="#" ${actionAttrs("Apply as partner", "A partner onboarding request will be sent to ANIMA.")}>Apply as partner</a></article>
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
  return `<article><span>⌁</span><h3>${item.title}</h3><p>${item.description}</p><small>${formatCurrencyText(item.price)}</small><a class="mini-cta" href="#" ${actionAttrs(item.title, "Service details and consultation flow will open here.")}>Learn more</a></article>`;
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
        <span>★ ${item.rating} · ${formatCurrencyText(item.price)}</span>
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
  return `
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
}

function renderFeed(config) {
  return `
    <div class="screen-inner feed-screen immersive-root">
      <nav class="feed-tabs" aria-label="Feed categories">
        ${config.chips.filter((chip) => chip !== "Digital Nomads").map((chip, index) => `<button class="${index === 0 ? "active" : ""}" type="button" data-feed-filter="${chip}">${chip}</button>`).join("")}
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
        <span class="verified-anima food">✓ Verified by ANIMA</span>
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
  stayFilters.category = stayFilters.category || config.chips[0];
  return `
    <div class="screen-inner stay-screen">
      ${renderHeader(config, { back: true })}
      <div class="stay-chips">${config.chips.map((chip) => `<button class="${chip === stayFilters.category ? "active" : ""}" type="button" data-stay-category="${chip}">${chip}</button>`).join("")}</div>
      <div class="stay-filter-row">
        ${["All budgets", "Budget", "Mid", "Premium"].map((item) => `<button class="${item === stayFilters.budget ? "active" : ""}" type="button" data-stay-budget="${item}">${item}</button>`).join("")}
      </div>
      <div class="stay-filter-row compact">
        ${["All areas", "Center", "Quiet"].map((item) => `<button class="${item === stayFilters.area ? "active" : ""}" type="button" data-stay-area="${item}">${item === "Quiet" ? "Quiet place" : item}</button>`).join("")}
      </div>
      <section class="stay-list" aria-live="polite">${renderStayListings()}</section>
    </div>
  `;
}

function renderStayListings() {
  const items = data.stays.filter((stay) => {
    const categoryMatch = stay.category === stayFilters.category || stay.tags?.includes(stayFilters.category);
    const budgetMatch = stayFilters.budget === "All budgets" || stay.budget === stayFilters.budget;
    const areaMatch = stayFilters.area === "All areas" || stay.areaType === stayFilters.area;
    return categoryMatch && budgetMatch && areaMatch;
  });
  return items.length ? items.map(stayCard).join("") : `<article class="empty-state"><h3>No stays found</h3><p>Try another budget or area filter.</p></article>`;
}

function stayCard(stay) {
  return `
    <article class="stay-card" data-detail="${stay.title}">
      <img src="${stay.image}" alt="" />
      <div class="stay-info">
        <div class="stay-topline">
          <p>${stay.type || stay.category}</p>
          <span class="verified-anima">✓ Verified by ANIMA</span>
        <button class="save-button inline ${isSavedTitle(stay.title) ? "saved" : ""}" type="button" aria-label="Save ${stay.title}" ${saveAttrs(stay, "Stay")}>♡</button>
        </div>
        <h2>${stay.title}</h2>
        <span class="stay-rating">★ ${stay.rating} (${stay.reviews}) · ${stay.source}</span>
        <span class="stay-location">⌖ ${stay.location} · ${stay.distance}<br />${stay.guests} guests · ${stay.bedrooms} bedrooms · ${stay.baths} baths · ${stay.hasKitchen ? "Kitchen" : "No kitchen"}</span>
        <div class="place-tags">${(stay.tags || []).slice(0, 3).map((tag) => `<span>${tag}</span>`).join("")}</div>
        <div class="stay-bottom">
          <strong>${formatCurrencyText(`${stay.price} ${stay.priceType}`)}</strong>
          <button class="mini-icon-button" type="button" ${actionAttrs(`Share ${stay.title}`, "Share card will use the native share sheet in the app build.")}>↥</button>
          <button class="mini-icon-button" type="button" data-screen="map">⌖</button>
          <a class="gold-button" href="#" ${actionAttrs(`Contact / Book: ${stay.title}`, `Send a booking request to ${managerTelegram.handle}.`)}>Contact / Book</a>
        </div>
      </div>
    </article>
  `;
}

function renderStayDetail(stay) {
  const subtotal = parsePriceNumber(stay.price) * stay.nights;
  const cleaning = parsePriceNumber(stay.cleaningFee);
  const service = parsePriceNumber(stay.serviceFee);
  const total = subtotal + cleaning + service;
  const config = { title: stay.title, subtitle: `${stay.type || stay.category} · ${stay.location}` };
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
          <p>${stay.type || stay.category} · ${stay.location}</p>
          <span>★ ${stay.rating} (${stay.reviews}) · ${stay.source}</span>
          <em class="verified-anima detail">✓ Verified by ANIMA</em>
        </div>
      </section>

      <section class="stay-facts">
        ${[
          [`${stay.guests}`, "Guests"],
          [`${stay.bedrooms}`, "Bedrooms"],
          [`${stay.beds}`, "Beds"],
          [`${stay.baths}`, "Baths"],
          [stay.size, "Size"],
        ].map(([value, label]) => `<article><strong>${value}</strong><span>${label}</span></article>`).join("")}
      </section>

      <section class="stay-gallery-strip">
        ${(stay.gallery || [stay.image]).map((image, index) => `<img src="${image}" alt="" />${index === 2 ? "<span>+20</span>" : ""}`).join("")}
      </section>

      <article class="stay-detail-card">
        <h2>About this place</h2>
        <p>${stay.description}</p>
        <div class="vibe-tags">${(stay.tags || []).slice(0, 8).map((tag) => `<span>${tag}</span>`).join("")}</div>
        ${stay.highlights?.length ? `<div class="detail-highlights">${stay.highlights.map((item) => `<span>${item}</span>`).join("")}</div>` : ""}
        <a href="#">Read more⌄</a>
      </article>

      <article class="stay-detail-card stay-location-card">
        <div>
          <h2>Location</h2>
          <p>⌖ ${stay.location}, Dalat</p>
          <span>${stay.distance} · 7 min to Tuyen Lam Lake</span>
          <div class="detail-action-row">
            <button class="mini-icon-button" type="button" ${actionAttrs(`Share ${stay.title}`, "Share stay card will use the native share sheet in the app build.")}>↥</button>
            <button class="mini-icon-button" type="button" ${actionAttrs(`Directions: ${stay.title}`, "Directions will open through maps in the app build.")}>⌖</button>
          </div>
        </div>
        <div class="mini-map-pin">●</div>
      </article>

      <section class="stay-booking-panel">
        <h2>Choose your stay</h2>
        <div class="stay-type-grid">
          <article class="active"><strong>Short-term stay</strong><span>From 1 night</span><b>✓</b></article>
          <article><strong>Long-term stay</strong><span>From 1 month</span></article>
        </div>
        <div class="rate-grid">
          <article class="active"><span>Nightly rate</span><small>From</small><strong>${formatCurrencyText(stay.price)}</strong><em>${stay.priceType}</em></article>
          <article><span>Monthly rate</span><small>From</small><strong>${formatCurrencyText(stay.monthlyPrice)}</strong><em>/ month</em></article>
        </div>
        <div class="booking-row"><span>▣ 12 May 2025 - 16 May 2025</span><b>${stay.nights} nights</b></div>
        <div class="booking-row"><span>Guests</span><b>${stay.guests} Adults · 0 Children ›</b></div>
      </section>

      <section class="stay-detail-card price-details">
        <h2>Price details</h2>
        <div><span>${formatCurrencyText(stay.price)} × ${stay.nights} nights</span><b>${formatMoney(subtotal, userSettings.currency)}</b></div>
        <div><span>Cleaning fee</span><b>${formatCurrencyText(stay.cleaningFee)}</b></div>
        <div><span>Service fee</span><b>${formatCurrencyText(stay.serviceFee)}</b></div>
        <strong><span>Total (${stay.nights} nights)</span><b>${formatMoney(total, userSettings.currency)}</b></strong>
      </section>

      <article class="stay-detail-card">
        <h2>Deposit & Payment</h2>
        <p>Security deposit (refundable): ${formatCurrencyText(stay.deposit)}. The deposit will be refunded within 24-48 hours after check-out if there is no damage.</p>
        <p>Full payment required to confirm booking.</p>
      </article>

      <section class="stay-detail-card house-rules">
        <h2>House rules</h2>
        ${stay.rules.map((rule) => `<div><span>⌁</span><p>${rule}</p><b>›</b></div>`).join("")}
      </section>

      <section class="stay-detail-card amenities-card">
        <h2>Amenities</h2>
        <div>${stay.amenities.map((item) => `<span>${item}</span>`).join("")}</div>
      </section>

      ${renderReviewSection(stay)}

      <section class="stay-reserve-bar">
        <div><span>Total (${stay.nights} nights)</span><strong>${formatMoney(total, userSettings.currency)}</strong></div>
        <a class="gold-button" href="#" ${actionAttrs(`Reserve: ${stay.title}`, "A stay request will be prepared for ANIMA manager confirmation.")}>Reserve now<small>You won't be charged yet</small></a>
      </section>
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
        <span>${item.duration} · ${formatCurrencyText(item.price)}</span>
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
  const progress = Math.round((data.user.points / data.user.nextLevel) * 100);
  const remaining = data.user.nextLevel - data.user.points;
  return `
    <div class="screen-inner profile-screen">
      ${renderHeader(config, { back: false })}
      <section class="profile-control-card">
        <div class="avatar">${data.user.avatar}</div>
        <div>
          <h2>${data.user.name} <img class="profile-plus-mini" src="./assets/anima-plus-mark.png" alt="ANIMA Plus" /></h2>
          <p>${data.user.level} ✨</p>
          <span>${data.user.points.toLocaleString("en-US")} ANIMA Points</span>
          <div class="progress wide"><span style="width:${progress}%"></span></div>
        </div>
        <a class="mini-cta" href="#profile-rewards">View Rewards</a>
      </section>

      <section class="profile-membership-section">
        <h2 id="profile-rewards">Membership & Rewards</h2>
        ${renderProfileRewardsCard(progress, remaining)}
        ${renderProfilePlusCard()}
      </section>

      ${settingsSection("Preferences", [
        settingsRow("◉", "Language", `${userSettings.language} / Russian`, null, "language"),
        settingsRow("¤", "Currency", `${userSettings.currency} / USD`, null, "currency"),
        settingsRow("◌", "Notifications", userSettings.notifications ? "All notifications enabled" : "Notifications disabled", null, "notifications"),
        settingsRow("☾", "Appearance", "Dark Mode", null, "appearance"),
      ])}

      ${settingsSection("My Activity", [
        settingsRow("♡", "Saved Places", "Places, cafes and stays", "saved"),
        settingsRow("◇", "Saved Experiences", "Curated routes and programs", "saved"),
        settingsRow("⌁", "Booking Requests", "Experiences, stay and transport", null, "bookings"),
        settingsRow("⇄", "Exchange Requests", "Currency exchange history", "exchange"),
        settingsRow("◷", "Viewed Places", "Recently opened places", null, "viewed"),
      ])}

      ${settingsSection("Support & Ecosystem", [
        settingsRow("◌", "24/7 Support", "Fast help from ANIMA team", null, "support"),
        settingsRow("?", "Help Center", "Guides and common questions", null, "help"),
        settingsRow("✉", "Contact Us", "Manager and support contact", "contact"),
        settingsRow("A", "About ANIMA", "Dalat digital ecosystem", "about"),
        settingsRow("◇", "Our Partners", "Cafes, hotels, transport and local brands", "partners"),
        settingsRow("◎", "Instagram", "Stories, places and partner updates", null, "instagram"),
        settingsRow("⌁", "Telegram", `Direct manager: ${managerTelegram.handle}`, null, "telegram"),
        settingsRow("+", "Invite Friends", "Share ANIMA with people you trust", null, "invite"),
      ])}

      ${settingsSection("Business & Creator", [
        settingsRow("✦", "Become a Partner", "Join the ANIMA ecosystem", "for-business"),
        settingsRow("◍", "Offer a Service", "Create your local provider profile", "services"),
        settingsRow("↗", "Promote Your Business", "Partner campaigns and visibility", "for-business"),
        settingsRow("⌁", "Digital Solutions", "Websites, apps and automation", "tech-solutions"),
        settingsRow("▣", "Business Dashboard", "Future partner tools", null, "business-dashboard"),
      ])}

      ${settingsSection("Settings", [
        settingsRow("◎", "Privacy", "Data and permissions", null, "privacy"),
        settingsRow("§", "Terms & Policies", "Legal and platform rules", null, "terms"),
        settingsRow("i", "App Version", "ANIMA 0.1 MVP", null, "version"),
        settingsRow("↩", "Log Out", "End current session", null, "logout"),
      ])}
    </div>
  `;
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
        <p>${item.duration} · ${formatCurrencyText(item.price)}</p>
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
  return `
    <div class="screen-inner partners-screen">
      ${renderHeader(config, { back: true })}
      <section class="partners-intro-card">
        <p class="brand-kicker">Partner Ecosystem</p>
        <h2>Trusted local places, services and experiences inside ΛNIMΛ.</h2>
        <p>Partners make the ecosystem useful: cafes, stays, transport, wellness, restaurants and local services that shape the Dalat lifestyle.</p>
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
  screenView.querySelectorAll("[data-stay-budget]").forEach((button) => {
    button.addEventListener("click", () => {
      button.parentElement.querySelectorAll("button").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      stayFilters.budget = button.dataset.stayBudget;
      const list = screenView.querySelector(".stay-list");
      if (list) list.innerHTML = renderStayListings();
      bindStayDynamicActions();
    });
  });
  screenView.querySelectorAll("[data-stay-area]").forEach((button) => {
    button.addEventListener("click", () => {
      button.parentElement.querySelectorAll("button").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      stayFilters.area = button.dataset.stayArea;
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
  screenView.querySelectorAll("[data-detail]").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      if (event.target.closest("a")) event.preventDefault();
      navigateTo(`detail:${card.dataset.detail}`);
    });
  });
  screenView.querySelectorAll("[data-back]").forEach((button) => {
    button.addEventListener("click", goBack);
  });
  screenView.querySelectorAll("form").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (form.classList.contains("exchange-form")) {
        form.hidden = true;
        form.nextElementSibling.hidden = false;
      }
    });
  });
}

function bindActionTriggers(root) {
  root.querySelectorAll("[data-action-title]").forEach((item) => {
    item.addEventListener("click", (event) => {
      event.preventDefault();
      openActionModal(item.dataset.actionTitle, item.dataset.actionMessage);
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
  if (action === "language") {
    openChoiceModal(t("profile.language"), ["English", "Russian"], userSettings.language, setLanguage);
    return;
  }
  if (action === "currency") {
    openChoiceModal("Currency", ["VND", "USD", "EUR", "RUB", "UAH"], userSettings.currency, setCurrency);
    return;
  }
  if (action === "notifications") {
    openNotificationModal();
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
  const items = ["Events", "Promotions", "Rewards", "Feed updates", "Partner offers", "Experiences"];
  const modal = createSettingsModal("Notifications", items.map((item) => `
    <label class="toggle-row"><span>${item}</span><input type="checkbox" checked /><i></i></label>
  `).join(""));
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

function createSettingsModal(title, body) {
  const modalRoot = screenView.hidden ? phoneShell : screenView;
  modalRoot.querySelector(".settings-modal")?.remove();
  const modal = document.createElement("div");
  modal.className = "settings-modal";
  modal.innerHTML = `
    <div class="settings-modal-backdrop" data-close-modal></div>
    <section class="settings-modal-panel">
      <div class="settings-modal-head"><h2>${title}</h2><button type="button" data-close-modal>×</button></div>
      <div class="settings-modal-body">${body}</div>
    </section>
  `;
  modalRoot.appendChild(modal);
  modal.querySelectorAll("[data-close-modal], .modal-close-button").forEach((button) => {
    button.addEventListener("click", () => modal.remove());
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
  screenView.querySelectorAll(".stay-list [data-detail]").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      if (event.target.closest("a")) event.preventDefault();
      navigateTo(`detail:${card.dataset.detail}`);
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
