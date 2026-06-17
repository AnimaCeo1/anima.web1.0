(() => {
  const SESSION_KEY = "anima.partner.session.v1";
  const PERF_LOG_ENABLED = true;
  const seedData = window.ANIMA_DATA || {};
  const app = document.querySelector("#partner-app");
  const navItems = [
    ["dashboard", "Главная", "home"],
    ["properties", "Объект / Отель", "building"],
    ["drafts", "Мои черновики", "file"],
    ["rooms", "Комнаты и цены", "house"],
    ["calendar", "Календарь занятости", "calendar"],
    ["requests", "Заявки на бронирование", "briefcase"],
    ["confirmed", "Бронирования", "calendar-check"],
    ["finance", "Финансы и баланс", "coin"],
    ["withdrawals", "Вывод средств", "coin-dollar"],
    ["messages", "Сообщения", "message"],
    ["reviews", "Отзывы и рейтинг", "star"],
    ["documents", "Документы", "file"],
    ["settings", "Настройки объекта", "settings"],
    ["staff", "Сотрудники", "users"],
    ["help", "Поддержка ANIMA", "help"],
  ];
  const bookingLabels = {
    new_request: "Новая заявка",
    pending_partner_confirmation: "Ожидает подтверждения",
    confirmed: "Подтверждено",
    waiting_payment: "Ожидает оплаты",
    commission_paid: "Сбор ANIMA оплачен",
    paid: "Оплачена",
    active: "Бронь активна",
    checked_in: "Клиент заселился",
    funds_available: "Деньги доступны",
    payout_requested: "Выплата запрошена",
    payout_sent: "Выплата отправлена",
    closed: "Завершено",
    rejected: "Отклонено",
    cancelled_by_client: "Отменено клиентом",
    cancelled_by_anima: "Отменено ANIMA",
    cancelled_by_partner: "Отменено партнёром",
    completed: "Завершено",
    no_show: "Клиент не приехал",
    dispute: "Спор",
  };
  const paymentLabels = {
    unpaid: "Не оплачено",
    waiting_payment: "Ожидает оплату",
    paid: "Оплачено",
    partially_paid: "Частично оплачено",
    refunded: "Возврат",
    failed: "Ошибка оплаты",
  };
  const payoutLabels = {
    not_due: "Ещё не к выплате",
    pending_payout: "К выплате",
    paid_to_partner: "Выплачено",
    held: "Удержано",
    disputed: "Спорная сумма",
  };
  let route = "dashboard";
  let workspace = null;
  let dashboardPeriod = localStorage.getItem("anima.partner.dashboard.period") || "month";
  let calendarCursor = new Date();
  let profileMenuOpen = false;
  let partnerNotificationsOpen = false;
  let partnerCurrency = localStorage.getItem("anima.partner.currency") || "VND";
  let sidebarCollapsed = localStorage.getItem("anima.partner.sidebar.collapsed") === "true";
  const requestStatuses = ["new_request", "waiting_payment", "commission_paid", "pending_partner_confirmation"];
  const actionableRequestStatuses = ["new_request", "commission_paid", "pending_partner_confirmation", "paid"];

  boot();

  function perfMark(label, startedAt) {
    if (!PERF_LOG_ENABLED || typeof performance === "undefined") return;
    const duration = performance.now() - startedAt;
    console.log(`[perf][partner] ${label}: ${duration.toFixed(1)}ms`);
  }

  function perfRun(label, fn) {
    const startedAt = typeof performance !== "undefined" ? performance.now() : 0;
    const result = fn();
    perfMark(label, startedAt);
    return result;
  }

  function isRequestBooking(booking) {
    return requestStatuses.includes(booking?.booking_status);
  }

  function isActionableRequest(booking) {
    return actionableRequestStatuses.includes(booking?.booking_status);
  }

  function boot() {
    showPartnerSplash();
    renderLoading();
    window.ANIMA_DB?.ensure(seedData);
    const session = readSession();
    if (!session) return renderLogin();
    try {
      workspace = perfRun("getPartnerWorkspace", () => window.ANIMA_DB.getPartnerWorkspace(session.partnerId, seedData));
      renderShell();
    } catch (error) {
      renderError(error);
    }
  }

  function showPartnerSplash() {
    document.querySelector(".partner-launch-splash")?.remove();
    const splash = document.createElement("div");
    splash.className = "partner-launch-splash";
    splash.innerHTML = `
      <div class="partner-launch-logo">ANIMA</div>
      <p>Кабинет владельца и управление бронированиями</p>
    `;
    document.body.appendChild(splash);
    requestAnimationFrame(() => splash.classList.add("visible"));
    window.setTimeout(() => splash.classList.add("fade-out"), 1100);
    window.setTimeout(() => splash.remove(), 1680);
  }

  function renderLoading() {
    app.innerHTML = `
      <main class="partner-loading">
        <section>
          <div class="skeleton-line wide"></div>
          <div class="skeleton-grid">${Array.from({ length: 5 }, () => `<div class="skeleton-card"></div>`).join("")}</div>
          <div class="skeleton-panel"></div>
        </section>
      </main>
    `;
  }

  function renderError(error) {
    app.innerHTML = `
      <main class="partner-login">
        <section class="partner-login-card">
          <img class="partner-logo" src="./assets/anima-wordmark.png" alt="ANIMA" />
          <p class="partner-kicker">Ошибка загрузки</p>
          <h1>Не удалось открыть кабинет</h1>
          <p>${escapeHtml(humanError(error) || "Проверьте соединение с базой и повторите попытку.")}</p>
          <button class="primary-btn" type="button" data-retry-load>Повторить</button>
        </section>
      </main>
    `;
    app.querySelector("[data-retry-load]")?.addEventListener("click", boot);
  }

  function readSession() {
    try {
      const session = JSON.parse(sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY) || "null");
      if (!session || session.expiresAt < Date.now()) return null;
      return session;
    } catch {
      return null;
    }
  }

  function writeSession(payload, remember = true) {
    const session = { ...payload, expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 14 };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    if (remember) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
  }

  async function sha256(value) {
    const bytes = new TextEncoder().encode(value);
    const hash = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  function renderLogin(error = "") {
    app.innerHTML = `
      <main class="partner-login">
        <section class="partner-login-card">
          <img class="partner-logo" src="./assets/anima-wordmark.png" alt="ANIMA" />
          <p class="partner-kicker">Кабинет владельца</p>
          <h1>Управление объектом и бронями</h1>
          <p>Доступ выдаёт администратор ANIMA. Первый вход требует смены временного пароля.</p>
          <form class="partner-form" data-login-form>
            <label>
              Логин / email / Telegram
              <input name="login" autocomplete="username" placeholder="ibis_partner" required />
            </label>
            <label>
              Пароль
              <input name="password" type="password" autocomplete="current-password" placeholder="Anima2026" required />
            </label>
            <button class="primary-btn" type="submit">Войти</button>
            <p class="form-error">${escapeHtml(error)}</p>
          </form>
          <p class="muted">Тестовый партнёр: <b>ibis_partner</b> / <b>Anima2026</b></p>
        </section>
      </main>
    `;
    app.querySelector("[data-login-form]")?.addEventListener("submit", submitLogin);
  }

  async function submitLogin(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const login = String(new FormData(form).get("login") || "").trim();
    const password = String(new FormData(form).get("password") || "");
    try {
      const result = window.ANIMA_DB.authenticatePartner({ login, passwordHash: await sha256(password) }, seedData);
      writeSession({
        partnerId: result.partner.id,
        userId: result.user.id,
        role: result.user.role || "partner_owner",
        businessName: result.partner.business_name,
      });
      if (result.mustChangePassword) {
        renderPasswordChange(result.partner, result.user);
        return;
      }
      workspace = window.ANIMA_DB.getPartnerWorkspace(result.partner.id, seedData);
      renderShell();
    } catch {
      renderLogin("Неверный логин или пароль, либо партнёр заблокирован.");
    }
  }

  function renderPasswordChange(partner, user, error = "") {
    app.innerHTML = `
      <main class="partner-login">
        <section class="partner-login-card">
          <img class="partner-logo" src="./assets/anima-wordmark.png" alt="ANIMA" />
          <p class="partner-kicker">Первый вход</p>
          <h1>Создайте новый пароль</h1>
          <p>${escapeHtml(partner.business_name)} будет использовать этот пароль для дальнейшего входа.</p>
          <form class="partner-form" data-password-form>
            <label>
              Новый пароль
              <input name="password" type="password" minlength="8" required />
            </label>
            <label>
              Повторите пароль
              <input name="repeat" type="password" minlength="8" required />
            </label>
            <button class="primary-btn" type="submit">Сохранить пароль</button>
            <p class="form-error">${escapeHtml(error)}</p>
          </form>
        </section>
      </main>
    `;
    app.querySelector("[data-password-form]")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const password = String(data.get("password") || "");
      const repeat = String(data.get("repeat") || "");
      if (password !== repeat) {
        renderPasswordChange(partner, user, "Пароли не совпадают.");
        return;
      }
      window.ANIMA_DB.changePartnerPassword({
        partnerId: partner.id,
        userId: user.id,
        passwordHash: await sha256(password),
      }, seedData);
      workspace = window.ANIMA_DB.getPartnerWorkspace(partner.id, seedData);
      renderShell();
    });
  }

  function renderShell() {
    perfRun(`renderShell:${route}`, () => {
      const session = readSession();
      workspace = window.ANIMA_DB.getPartnerWorkspace(session.partnerId, seedData);
      const unreadNotifications = workspace.notifications.filter((item) => !item.read_at).length;
      const partnerName = partnerDisplayName();
      const businessName = workspace.partner.business_name || "ANIMA Partner";
      app.innerHTML = `
      <main class="partner-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}">
        <aside class="partner-sidebar">
          <div class="partner-brand partner-brand-text"><strong>ANIMA</strong><span>PARTNER</span></div>
          <nav class="sidebar-nav">
            ${navItems.map(([id, label, icon]) => {
              const badge = navBadge(id);
              return `
              <button class="sidebar-link ${route === id ? "active" : ""}" type="button" data-route="${id}" title="${escapeAttribute(label)}">
                <span class="sidebar-icon">${iconSvg(icon)}</span><strong>${label}</strong>${badge ? `<em>${badge}</em>` : ""}
              </button>
            `;}).join("")}
          </nav>
          <div class="partner-manager-card">
            <strong>Персональный менеджер</strong>
            <span>Есть вопросы? Мы всегда на связи.</span>
            <button class="support-btn" type="button" data-open-support>Написать в поддержку</button>
          </div>
          <button class="collapse-menu-btn" type="button" data-toggle-sidebar>${iconSvg(sidebarCollapsed ? "chevron-right" : "chevron-left")} <span>${sidebarCollapsed ? "Развернуть меню" : "Свернуть меню"}</span></button>
        </aside>
        <section class="partner-main">
          <header class="partner-topbar">
            <button class="topbar-menu-btn" type="button" data-toggle-sidebar>${iconSvg("menu")}</button>
            <div class="partner-topbar-right">
              <button class="topbar-icon-btn" type="button" data-route="notifications">${iconSvg("bell")}${unreadNotifications ? `<em>${unreadNotifications}</em>` : ""}</button>
              <button class="topbar-icon-btn" type="button" data-route="messages">${iconSvg("mail")}</button>
              <label class="partner-currency-switch">
                <select data-partner-currency>
                  ${["VND", "USD", "EUR", "RUB", "UAH"].map((currency) => `<option value="${currency}" ${partnerCurrency === currency ? "selected" : ""}>${currency}</option>`).join("")}
                </select>
              </label>
              <button class="partner-profile-mini" type="button" data-profile-menu-toggle>
                <span>${escapeHtml(profileInitials())}</span>
                <div><strong>${escapeHtml(partnerName)}</strong><small>${escapeHtml(businessName)}</small></div>
                <b>⌄</b>
              </button>
              ${partnerNotificationsOpen ? partnerNotificationsPopover() : ""}
              ${profileMenuOpen ? profileMenu() : ""}
            </div>
          </header>
          <section data-view></section>
        </section>
      </main>
      `;
      app.querySelectorAll("[data-route]").forEach((button) => {
        button.addEventListener("click", () => {
          if (button.dataset.route === "notifications") {
            partnerNotificationsOpen = !partnerNotificationsOpen;
            profileMenuOpen = false;
            renderShell();
            return;
          }
          route = button.dataset.route;
          profileMenuOpen = false;
          partnerNotificationsOpen = false;
          renderShell();
        });
      });
      app.querySelector("[data-partner-currency]")?.addEventListener("change", (event) => {
        partnerCurrency = event.currentTarget.value;
        localStorage.setItem("anima.partner.currency", partnerCurrency);
        renderShell();
      });
      app.querySelectorAll("[data-toggle-sidebar]").forEach((button) => {
        button.addEventListener("click", () => {
          sidebarCollapsed = !sidebarCollapsed;
          localStorage.setItem("anima.partner.sidebar.collapsed", String(sidebarCollapsed));
          renderShell();
        });
      });
    });
    app.querySelector("[data-open-support]")?.addEventListener("click", openSupportModal);
    app.querySelector("[data-profile-menu-toggle]")?.addEventListener("click", (event) => {
      event.stopPropagation();
      profileMenuOpen = !profileMenuOpen;
      renderShell();
    });
    app.querySelectorAll("[data-profile-action]").forEach((button) => button.addEventListener("click", () => runProfileAction(button.dataset.profileAction)));
    app.querySelector("[data-close-partner-notifications]")?.addEventListener("click", () => {
      partnerNotificationsOpen = false;
      renderShell();
    });
    app.querySelectorAll("[data-open-partner-notification]").forEach((button) => {
      button.addEventListener("click", () => {
        window.ANIMA_DB.markPartnerNotificationRead(button.dataset.openPartnerNotification, seedData);
        route = "notifications";
        partnerNotificationsOpen = false;
        renderShell();
      });
    });
    document.addEventListener("click", closeProfileMenuOnce, { once: true });
    app.querySelector("[data-logout]")?.addEventListener("click", () => {
      clearSession();
      renderLogin();
    });
    renderView();
  }

  function renderView() {
    const view = app.querySelector("[data-view]");
    if (route === "dashboard") renderDashboard(view);
    if (route === "properties") renderProperties(view);
    if (route === "drafts") renderDrafts(view);
    if (route === "rooms") renderRooms(view);
    if (route === "calendar") renderCalendar(view);
    if (route === "requests") renderBookings(view, "requests");
    if (route === "confirmed") renderBookings(view, "confirmed");
    if (route === "finance") renderFinance(view);
    if (route === "withdrawals") renderWithdrawals(view);
    if (route === "messages") renderMessages(view);
    if (route === "admin-chat") renderAdminChat(view);
    if (route === "notifications") renderNotifications(view);
    if (route === "reviews") renderReviews(view);
    if (route === "staff") renderStaff(view);
    if (route === "settings") renderSettings(view);
    if (route === "documents") renderDocuments(view);
    if (route === "help") renderHelp(view);
  }

  function renderDashboard(view) {
    const stats = workspace.stats;
    const bookings = sortLatest(workspace.bookings);
    const period = periodRange(dashboardPeriod);
    const periodBookings = bookings.filter((booking) => inPeriod(booking, period));
    const previousBookings = bookings.filter((booking) => inPeriod(booking, previousPeriodRange(dashboardPeriod)));
    const latest = bookings.filter(isRequestBooking).slice(0, 5);
    const revenue = sumMoney(periodBookings, "total_amount");
    const hasPeriodBookings = periodBookings.length > 0;
    const occupancy = occupancyToday();
    view.innerHTML = `
      <section class="partner-dashboard-v2">
        <header class="dashboard-hero-row">
          <div>
            <h2>Добро пожаловать, ${escapeHtml(partnerDisplayName())}!</h2>
            <p>${escapeHtml(workspace.partner.business_name || "ANIMA Partner")} · ${escapeHtml(primaryLocation())}</p>
          </div>
          <label class="period-select-label">Период
            <select class="period-select-btn" data-dashboard-period>
              ${periodOptions().map((item) => `<option value="${item.value}" ${dashboardPeriod === item.value ? "selected" : ""}>${item.label}</option>`).join("")}
            </select>
          </label>
        </header>

        <section class="dashboard-metric-grid">
          ${dashboardMetric("Новые заявки", stats.newRequests, stats.newRequests ? "Требуют вашего внимания" : "Заявок пока нет", "file-check", "blue", "requests")}
          ${dashboardMetric("Ближайшие заезды", stats.upcoming, stats.upcoming ? "Активные и будущие" : "Заездов пока нет", "calendar-check", "green", "calendar")}
          ${dashboardMetric(`Доход за период`, hasPeriodBookings ? moneyCompact(revenue) : "Нет данных", trendText(periodBookings.length, previousBookings.length), "calendar-money", "purple", "finance", hasPeriodBookings)}
          ${dashboardMetric("Доступно к выводу", hasAnyMoneyData() ? moneyCompact(stats.availableBalance) : "Нет данных", "После завершения проживаний", "briefcase", "orange", "withdrawals")}
          ${dashboardMetric("Занятость сегодня", occupancy.label, occupancy.hint, "square", "teal", "calendar")}
          ${dashboardMetric("Рейтинг объекта", stats.rating ? stats.rating.toFixed(1) : "Нет данных", stats.reviewsCount ? `На основе ${stats.reviewsCount} отзывов` : "Отзывов пока нет", "star", "teal", "reviews")}
        </section>

        <section class="dashboard-content-grid">
          <article class="dash-card booking-overview-card">
            <div class="dash-card-head">
              <h3>Обзор бронирований</h3>
              <span class="small-select-btn">${escapeHtml(periodLabel(dashboardPeriod))}</span>
            </div>
            <div class="booking-overview-stats">
              ${overviewItem("Всего заявок", periodBookings.length, trendText(periodBookings.length, previousBookings.length), "neutral")}
              ${overviewItem("Подтверждено", countStatus(periodBookings, ["confirmed", "paid", "active", "checked_in", "completed", "funds_available"]), "", "neutral")}
              ${overviewItem("Ожидают оплаты", countStatus(periodBookings, ["waiting_payment"]), "", "neutral")}
              ${overviewItem("Отменено", countStatus(periodBookings, ["cancelled_by_client", "cancelled_by_partner", "cancelled_by_anima", "rejected"]), "", "neutral")}
            </div>
            ${bookingChart(periodBookings, dashboardPeriod)}
          </article>

          <article class="dash-card latest-bookings-card">
            <div class="dash-card-head">
              <h3>Последние заявки</h3>
              <button class="link-btn" type="button" data-go-bookings>Смотреть все</button>
            </div>
            <div class="latest-booking-list">
              ${latest.length ? latest.map(latestBookingRow).join("") : empty("У вас пока нет заявок")}
            </div>
          </article>

          <article class="dash-card occupancy-card">
            <div class="dash-card-head">
              <h3>Занятость на ${escapeHtml(monthTitle(calendarCursor))}</h3>
              <div class="calendar-actions"><button type="button" data-calendar-prev>←</button><button type="button" data-calendar-next>→</button><button type="button" data-calendar-today>Сегодня</button></div>
            </div>
            ${dashboardCalendar()}
          </article>

          <article class="dash-card balance-card">
            <div class="dash-card-head">
              <h3>Ваш баланс</h3>
              <button class="link-btn" type="button" data-go-finance>Смотреть все</button>
            </div>
            <div class="balance-layout">
              <div class="balance-lines">
                ${balanceLine("Общий заработок", hasAnyMoneyData() ? moneyCompact(stats.partnerAmount) : "Нет данных")}
                ${balanceLine("Ожидает завершения", hasAnyMoneyData() ? moneyCompact(stats.pendingCompletion) : "Нет данных")}
                ${balanceLine("Доступно к выводу", hasAnyMoneyData() ? moneyCompact(stats.availableBalance) : "Нет данных", "green")}
                ${balanceLine("Запрошено на вывод", hasAnyMoneyData() || workspace.withdrawalRequests.length ? moneyCompact(stats.requestedPayout || 0) : "Нет данных")}
                ${balanceLine("Уже выведено", hasAnyMoneyData() || workspace.withdrawalRequests.length ? moneyCompact(stats.paidOut) : "Нет данных")}
                <button class="withdraw-main-btn" type="button" data-go-withdrawals>Запросить вывод средств</button>
              </div>
              ${incomeBreakdown(periodBookings)}
            </div>
          </article>

          <article class="dash-card messages-card">
            <div class="dash-card-head">
              <h3>Последние сообщения</h3>
              <button class="small-select-btn" type="button" data-go-messages>Открыть все сообщения</button>
            </div>
            <div class="message-preview-grid">
              ${latestMessagesPreview()}
            </div>
          </article>

          <article class="dash-card reviews-card">
            <div class="dash-card-head">
              <h3>Последние отзывы</h3>
              <button class="small-select-btn" type="button" data-go-reviews>Открыть отзывы</button>
            </div>
            <div class="message-preview-grid">
              ${latestReviewsPreview()}
            </div>
          </article>
        </section>
      </section>
    `;
    view.querySelector("[data-dashboard-period]")?.addEventListener("change", (event) => {
      dashboardPeriod = event.currentTarget.value;
      localStorage.setItem("anima.partner.dashboard.period", dashboardPeriod);
      renderDashboard(view);
    });
    view.querySelector("[data-go-bookings]")?.addEventListener("click", () => {
      route = "requests";
      renderShell();
    });
    view.querySelector("[data-go-finance]")?.addEventListener("click", () => {
      route = "finance";
      renderShell();
    });
    view.querySelector("[data-go-withdrawals]")?.addEventListener("click", () => {
      route = "withdrawals";
      renderShell();
    });
    view.querySelector("[data-go-messages]")?.addEventListener("click", () => {
      route = "messages";
      renderShell();
    });
    view.querySelector("[data-go-reviews]")?.addEventListener("click", () => {
      route = "reviews";
      renderShell();
    });
    view.querySelector("[data-calendar-prev]")?.addEventListener("click", () => {
      calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() - 1, 1);
      renderDashboard(view);
    });
    view.querySelector("[data-calendar-next]")?.addEventListener("click", () => {
      calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + 1, 1);
      renderDashboard(view);
    });
    view.querySelector("[data-calendar-today]")?.addEventListener("click", () => {
      calendarCursor = new Date();
      renderDashboard(view);
    });
    view.querySelectorAll("[data-open-support]").forEach((button) => button.addEventListener("click", openSupportModal));
    view.querySelectorAll("[data-dashboard-route]").forEach((card) => {
      card.addEventListener("click", () => {
        route = card.dataset.dashboardRoute;
        renderShell();
      });
    });
    bindBookingButtons(view);
  }

  function renderProperties(view) {
    const categories = window.ANIMA_DB?.categoryCatalog?.() || [];
    view.innerHTML = `
      <article class="panel">
        <div class="panel-heading">
          <div><p>Управление объектами</p><h2>Редактирование с модерацией</h2></div>
          <div class="row-actions">
            <button class="primary-btn" type="button" data-add-property>Создать объект</button>
            <button class="secondary-btn" type="button" data-partner-apply>Стать партнёром</button>
          </div>
        </div>
        <div class="object-list">
          ${workspace.properties.map((property) => {
            const units = workspace.units.filter((unit) => unit.property_id === property.id);
            return `
              <article class="object-row">
                <div>
                  <h3>${escapeHtml(property.title)}</h3>
                  <p>${escapeHtml(categories.find((item) => item.id === property.content_category)?.label || propertyTypeLabel(property.type))} · ${escapeHtml(property.address)} · ${property.type === "hotel" ? `${units.length} типов номеров` : "бронируется целиком"} · ${escapeHtml(property.amenities.slice(0, 4).join(", ") || "удобства не указаны")}</p>
                </div>
                <div class="row-actions">
                  ${status(property.status)}
                  ${status(property.moderation_status)}
                  <button class="secondary-btn" type="button" data-edit-property="${escapeAttribute(property.id)}">Изменить</button>
                </div>
              </article>
            `;
          }).join("") || empty("У партнёра пока нет объектов.")}
        </div>
      </article>
    `;
    view.querySelectorAll("[data-edit-property]").forEach((button) => {
      button.addEventListener("click", () => openPropertyModal(button.dataset.editProperty));
    });
    view.querySelector("[data-add-property]")?.addEventListener("click", openCreatePropertyModal);
    view.querySelector("[data-partner-apply]")?.addEventListener("click", () => {
      openSimpleModal("Публичная заявка партнёра", `
        <p class="muted">Заявка заложена как будущий сценарий: пользователь оставляет данные, админ проверяет бизнес и вручную выдаёт доступ. Самостоятельный вход без проверки отключён.</p>
      `);
    });
  }

  function renderDrafts(view) {
    const drafts = workspace.properties.filter((item) => item.status === "draft" || item.moderation_status === "draft");
    view.innerHTML = `
      <article class="panel">
        <div class="panel-heading">
          <div><p>Черновики партнёра</p><h2>Мои черновики</h2></div>
          <button class="primary-btn" type="button" data-add-property>Создать объект</button>
        </div>
        <div class="object-list">
          ${drafts.map((property) => `
            <article class="object-row">
              <div>
                <h3>${escapeHtml(property.title)}</h3>
                <p>${escapeHtml(property.address || "Адрес не указан")} · ${escapeHtml(property.description || "Описание не заполнено")}</p>
              </div>
              <div class="row-actions">
                ${status("draft")}
                <button class="secondary-btn" type="button" data-edit-property="${escapeAttribute(property.id)}">Продолжить</button>
              </div>
            </article>
          `).join("") || empty("Черновиков пока нет.")}
        </div>
      </article>
    `;
    view.querySelector("[data-add-property]")?.addEventListener("click", openCreatePropertyModal);
    view.querySelectorAll("[data-edit-property]").forEach((button) => button.addEventListener("click", () => openPropertyModal(button.dataset.editProperty)));
  }

  function renderRooms(view) {
    const hotelProperties = workspace.properties.filter((property) => property.type === "hotel" || property.booking_model === "room_type");
    view.innerHTML = `
      <article class="panel">
        <div class="panel-heading">
          <div><p>Категории номеров</p><h2>Комнаты и инвентарь</h2></div>
          <button class="primary-btn" type="button" data-add-room>Добавить комнату</button>
        </div>
        ${hotelProperties.length ? `<p class="muted">Типы номеров обязательны для отелей. Вилла, дом или апартамент могут бронироваться целиком без room types.</p>` : `<p class="muted">Сначала создайте объект типа “отель”, потом добавьте категории номеров.</p>`}
        <div class="object-list">
          ${workspace.units.map((room) => `
            <article class="object-row">
              <div>
                <h3>${escapeHtml(room.name)}</h3>
                <p>${escapeHtml(roomTypeLabel(room.type))} · ${room.quantity || 1} ед. · до ${room.capacity || 1} гостей · ${room.beds_count || room.capacity || 1} кроватей · ${money(room.base_price)}/ночь</p>
                <p>${escapeHtml(room.description || "Описание пока не заполнено")}</p>
              </div>
              <div class="row-actions">
                ${status(room.status || "active")}
                ${status(room.moderation_status || "approved")}
                <button class="secondary-btn" type="button" data-edit-room="${escapeAttribute(room.id)}">Изменить</button>
              </div>
            </article>
          `).join("") || empty("Комнат пока нет. Добавьте категорию номера, например Deluxe Mountain View — 5 комнат.")}
        </div>
      </article>
    `;
    view.querySelector("[data-add-room]")?.addEventListener("click", () => openRoomModal());
    view.querySelectorAll("[data-edit-room]").forEach((button) => button.addEventListener("click", () => openRoomModal(button.dataset.editRoom)));
  }

  function renderBookings(view, mode = "requests") {
    const title = mode === "requests" ? "Заявки на бронирование" : "Подтверждённые брони";
    const subtitle = mode === "requests" ? "Новые и ожидающие ответа отеля" : "Оплаченные, активные и завершённые брони";
    view.innerHTML = `
      <article class="panel">
        <div class="panel-heading"><div><p>${escapeHtml(subtitle)}</p><h2>${escapeHtml(title)}</h2></div></div>
        <div class="table-tools">
          <input class="table-filter" data-booking-search placeholder="Поиск по клиенту, объекту, телефону" />
          <select class="table-filter" data-booking-status>
            <option value="">Все статусы</option>
            ${Object.entries(bookingLabels).map(([key, label]) => `<option value="${key}">${label}</option>`).join("")}
          </select>
          <select class="table-filter" data-booking-property>
            <option value="">Все объекты</option>
            ${workspace.properties.map((property) => `<option value="${escapeAttribute(property.id)}">${escapeHtml(property.title)}</option>`).join("")}
          </select>
        </div>
        <div class="booking-list" data-booking-list></div>
      </article>
    `;
    const redraw = () => {
      const query = normalize(view.querySelector("[data-booking-search]").value);
      const statusValue = view.querySelector("[data-booking-status]").value;
      const propertyValue = view.querySelector("[data-booking-property]").value;
      const items = workspace.bookings.filter((booking) => {
        if (mode === "requests" && !isRequestBooking(booking)) return false;
        if (mode === "confirmed" && (isRequestBooking(booking) || booking.booking_status === "rejected")) return false;
        const haystack = normalize([booking.customer_name, booking.customer_phone, booking.customer_email, booking.start_date, booking.end_date, propertyTitle(booking.property_id)].join(" "));
        if (query && !haystack.includes(query)) return false;
        if (statusValue && booking.booking_status !== statusValue) return false;
        if (propertyValue && booking.property_id !== propertyValue) return false;
        return true;
      });
      view.querySelector("[data-booking-list]").innerHTML = items.map(bookingRow).join("") || empty("Ничего не найдено.");
      bindBookingButtons(view);
    };
    view.querySelectorAll(".table-filter").forEach((input) => input.addEventListener("input", redraw));
    redraw();
  }

  function renderCalendar(view) {
    const property = workspace.properties[0];
    const selectedRoomId = sessionStorage.getItem("anima.partner.calendar.room") || workspace.units.find((item) => item.property_id === property?.id)?.id || "";
    const unit = workspace.units.find((item) => item.id === selectedRoomId) || workspace.units.find((item) => item.property_id === property?.id);
    const days = Array.from({ length: 28 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() + index);
      return date.toISOString().slice(0, 10);
    });
    view.innerHTML = `
      <article class="panel">
        <div class="panel-heading">
          <div><p>Календарь доступности</p><h2>${escapeHtml(property?.title || "Объект")}</h2></div>
          <select class="table-filter" data-calendar-room>
            ${workspace.units.map((room) => `<option value="${escapeAttribute(room.id)}" ${room.id === unit?.id ? "selected" : ""}>${escapeHtml(room.name)} · ${room.quantity || 1} ед.</option>`).join("")}
          </select>
        </div>
        <div class="calendar-grid">
          ${days.map((date) => {
            const day = workspace.availability.find((item) => item.property_id === property?.id && item.unit_id === unit?.id && item.date === date) || {};
            const booked = bookedCount(unit?.id, date);
            const available = Math.max(0, Number(unit?.quantity || 1) - booked);
            return `
              <div class="calendar-day">
                <strong>${formatDate(date)}</strong>
                ${status(day.status || "available")}
                <small>${available} из ${unit?.quantity || 1} свободно</small>
                <input inputmode="numeric" value="${escapeAttribute(day.price || unit?.base_price || 0)}" data-price="${escapeAttribute(date)}" />
                <select data-availability="${escapeAttribute(date)}">
                  ${["available", "occupied", "pending", "closed", "admin_closed", "technical"].map((item) => `<option value="${item}" ${(day.status || "available") === item ? "selected" : ""}>${availabilityLabel(item)}</option>`).join("")}
                </select>
              </div>
            `;
          }).join("")}
        </div>
      </article>
    `;
    view.querySelector("[data-calendar-room]")?.addEventListener("change", (event) => {
      sessionStorage.setItem("anima.partner.calendar.room", event.currentTarget.value);
      renderCalendar(view);
    });
    view.querySelectorAll("[data-availability]").forEach((select) => {
      select.addEventListener("change", () => {
        try {
          const date = select.dataset.availability;
          const price = Number(view.querySelector(`[data-price="${CSS.escape(date)}"]`)?.value || 0);
          window.ANIMA_DB.updateAvailability(readSession().partnerId, {
            userId: readSession().userId,
            propertyId: property.id,
            unitId: unit?.id || "",
            date,
            status: select.value,
            price,
            reason: select.value === "closed" ? "Закрыто владельцем" : "",
          }, seedData);
          refresh();
        } catch (error) {
          alert(humanError(error));
          refresh();
        }
      });
    });
  }

  function renderFinance(view) {
    const stats = workspace.stats;
    view.innerHTML = `
      <section class="stats-grid">
        ${stat("Ваша чистая прибыль", money(stats.partnerAmount), "все брони")}
        ${stat("Доступно к выводу", money(stats.availableBalance), "после завершения проживания")}
        ${stat("Ожидает завершения", money(stats.pendingCompletion), "ещё не доступно")}
        ${stat("Остаток в отеле", money(stats.cashToCollect), "к получению наличными")}
      </section>
      <article class="panel" style="margin-top:16px">
        <div class="panel-heading"><div><p>Финансовый журнал</p><h2>Операции</h2></div></div>
        <div class="finance-list">
          ${workspace.bookings.map((booking) => `
            <article class="finance-row">
              <div>
                <h3>${escapeHtml(booking.customer_name)} · ${money(booking.total_amount)}</h3>
                <p>${booking.payment_method === "cash_at_hotel"
                  ? `Стоимость бронирования: ${money(booking.total_amount)} · сервисный сбор ANIMA: ${money(booking.commission_amount)} · остаток к получению в отеле: ${money(booking.pay_at_hotel_amount || booking.partner_amount)}`
                  : `Стоимость бронирования: ${money(booking.total_amount)} · сервисный сбор ANIMA: ${money(booking.commission_amount)} · ваша чистая прибыль: ${money(booking.partner_balance_amount || booking.partner_amount)}`}</p>
              </div>
              <div class="row-actions">${status(booking.payment_status)} ${status(booking.payout_status)}</div>
            </article>
          `).join("") || empty("Финансовых операций пока нет.")}
        </div>
      </article>
    `;
  }

  function renderWithdrawals(view) {
    view.innerHTML = `
      <section class="stats-grid">
        ${stat("Доступно к выводу", money(workspace.stats.availableBalance), "можно запросить сейчас")}
        ${stat("Ожидает завершения", money(workspace.stats.pendingCompletion), "после проживания")}
        ${stat("Удержано", money(workspace.stats.held), "на проверке")}
        ${stat("Выведено", money(workspace.stats.paidOut), "история выплат")}
      </section>
      <section class="dashboard-grid">
        <article class="panel">
          <div class="panel-heading"><div><p>Новая заявка</p><h2>Запросить вывод</h2></div></div>
          <form class="partner-form" data-withdrawal-form>
            <label>Сумма<input name="amount" inputmode="numeric" value="${Math.round(workspace.stats.availableBalance || 0)}" required /></label>
            <label>Получатель<input name="recipient_name" value="${escapeAttribute(workspace.partner.contact_name || "")}" required /></label>
            <label>Банк<input name="bank" placeholder="Название банка" /></label>
            <label>Счёт / карта<input name="account_number" placeholder="Номер счёта или карты" /></label>
            <label>Телефон<input name="phone" value="${escapeAttribute(workspace.partner.phone || "")}" /></label>
            <label>Валюта<select name="currency"><option value="VND">VND</option><option value="USD">USD</option></select></label>
            <label>Комментарий<textarea name="comment" placeholder="Детали перевода"></textarea></label>
            <button class="primary-btn" type="submit">Запросить вывод</button>
          </form>
        </article>
        <article class="panel">
          <div class="panel-heading"><div><p>История</p><h2>Заявки на выплату</h2></div></div>
          <div class="finance-list">
            ${workspace.withdrawalRequests.map((request) => `
              <article class="finance-row">
                <div><h3>${money(request.amount)} · ${escapeHtml(request.recipient_name)}</h3><p>${escapeHtml(request.bank || "банк не указан")} · ${escapeHtml(request.account_number || request.phone || "реквизиты не указаны")}</p></div>
                <div class="row-actions">${status(request.status)}</div>
              </article>
            `).join("") || empty("Заявок на вывод пока нет.")}
          </div>
        </article>
      </section>
    `;
    view.querySelector("[data-withdrawal-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      try {
        window.ANIMA_DB.requestWithdrawal(readSession().partnerId, {
          userId: readSession().userId,
          ...Object.fromEntries(new FormData(event.currentTarget).entries()),
        }, seedData);
        refresh();
      } catch (error) {
        alert(humanError(error));
      }
    });
  }

  function renderMessages(view) {
    const chats = workspace.chats.filter((chat) => ["client_hotel", "partner_admin"].includes(chat.type));
    const realChats = chats.filter((chat) => workspace.messages.some((message) => message.chat_id === chat.id));
    const autoChats = chats.filter((chat) => !workspace.messages.some((message) => message.chat_id === chat.id));
    view.innerHTML = `
      <article class="panel">
        <div class="panel-heading"><div><p>Клиенты, отель и ANIMA</p><h2>Реальные чаты</h2></div></div>
        <div class="notification-list">
          ${realChats.map((chat) => `
            <article class="notification-row">
              <div><h3>${escapeHtml(chat.title)}</h3><p>${escapeHtml(chat.type === "partner_admin" ? "Внутренний чат с ANIMA" : "Клиент ↔ отель")} · ${escapeHtml(chat.lastMessage || "Сообщений пока нет")}</p></div>
              <button class="secondary-btn" type="button" data-open-chat="${escapeAttribute(chat.id)}">Открыть</button>
            </article>
          `).join("") || empty("Ручных сообщений пока нет.")}
        </div>
      </article>
      <article class="panel">
        <div class="panel-heading"><div><p>Системные уведомления</p><h2>Автоматические чаты</h2></div></div>
        <div class="notification-list">
          ${autoChats.map((chat) => `
            <article class="notification-row">
              <div><h3>${escapeHtml(chat.title)}</h3><p>${escapeHtml(chat.type === "partner_admin" ? "Внутренний системный канал" : "Авточат по брони")} · ${escapeHtml(chat.lastMessage || "Пока только автоматические события")}</p></div>
              <button class="secondary-btn" type="button" data-open-chat="${escapeAttribute(chat.id)}">Открыть</button>
            </article>
          `).join("") || empty("Автоматических чатов пока нет.")}
        </div>
      </article>
    `;
    view.querySelectorAll("[data-open-chat]").forEach((button) => button.addEventListener("click", () => openChatModal(button.dataset.openChat)));
  }

  function renderAdminChat(view) {
    const adminChats = workspace.chats.filter((chat) => chat.type === "partner_admin");
    view.innerHTML = `
      <article class="panel">
        <div class="panel-heading"><div><p>Партнёр ↔ ANIMA</p><h2>Внутренний чат</h2></div></div>
        <div class="notification-list">
          ${adminChats.map((chat) => `
            <article class="notification-row">
              <div><h3>${escapeHtml(chat.title)}</h3><p>${escapeHtml(chat.lastMessage || "Напишите ANIMA по этой заявке")}</p></div>
              <button class="secondary-btn" type="button" data-open-chat="${escapeAttribute(chat.id)}">Открыть</button>
            </article>
          `).join("") || empty("Внутренних чатов пока нет.")}
        </div>
      </article>
    `;
    view.querySelectorAll("[data-open-chat]").forEach((button) => button.addEventListener("click", () => openChatModal(button.dataset.openChat)));
  }

  function renderNotifications(view) {
    view.innerHTML = `
      <article class="panel">
        <div class="panel-heading"><div><p>Уведомления</p><h2>Внутренние события</h2></div></div>
        <div class="notification-list">
          ${workspace.notifications.map((item) => `
            <article class="notification-row">
              <div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.message)}</p></div>
              <div class="row-actions"><span>${formatDate(item.createdAt)}</span>${item.read_at ? "" : `<button class="secondary-btn" data-read-notification="${escapeAttribute(item.id)}">Прочитано</button>`}</div>
            </article>
          `).join("") || empty("Уведомлений пока нет.")}
        </div>
      </article>
    `;
    view.querySelectorAll("[data-read-notification]").forEach((button) => {
      button.addEventListener("click", () => {
        window.ANIMA_DB.markPartnerNotificationRead(button.dataset.readNotification, seedData);
        refresh();
      });
    });
  }

  function renderReviews(view) {
    const reviews = sortLatest(workspace.reviews);
    view.innerHTML = `
      <article class="panel">
        <div class="panel-heading"><div><p>Отзывы гостей</p><h2>Отзывы и рейтинг</h2></div></div>
        <div class="detail-grid">
          ${detail("Рейтинг объекта", workspace.stats.rating ? workspace.stats.rating.toFixed(1) : "Нет данных")}
          ${detail("Отзывы", workspace.stats.reviewsCount || "Нет данных")}
          ${detail("Новые отзывы", reviews.filter((review) => !review.read_at).length || "Нет данных")}
          ${detail("Источник", reviews.length ? "Реальные отзывы из базы" : "Отзывов в базе пока нет")}
        </div>
        <div class="notification-list" style="margin-top:16px">
          ${reviews.map((review) => `
            <article class="notification-row">
              <div><h3>${escapeHtml(review.customer_name || "Гость")} · ${"★".repeat(Math.max(1, Math.round(Number(review.rating || 0))))}</h3><p>${escapeHtml(review.text || review.comment || "Без текста")}</p></div>
              <span>${formatDate(review.createdAt)}</span>
            </article>
          `).join("") || empty("Пока нет отзывов")}
        </div>
      </article>
    `;
  }

  function renderStaff(view) {
    const state = window.ANIMA_DB.getState(seedData);
    const staff = state.tables.partnerStaff.filter((item) => item.partner_id === workspace.partner.id);
    const users = state.tables.users;
    view.innerHTML = `
      <article class="panel">
        <div class="panel-heading"><div><p>Команда объекта</p><h2>Сотрудники</h2></div><button class="primary-btn" type="button" data-add-staff>Добавить сотрудника</button></div>
        <div class="notification-list">
          ${staff.map((member) => {
            const user = users.find((item) => item.id === member.user_id) || {};
            return `<article class="notification-row"><div><h3>${escapeHtml(user.name || user.login || member.role || "Сотрудник")}</h3><p>${escapeHtml(staffRoleLabel(member.role))} · ${escapeHtml((member.permissions || []).map(staffPermissionLabel).join(", ") || "права не указаны")}</p></div><div class="row-actions">${status(member.status || "active")}<button class="secondary-btn" type="button" data-edit-staff="${escapeAttribute(member.id)}">Права</button><button class="danger-btn" type="button" data-block-staff="${escapeAttribute(member.id)}">Заблокировать</button></div></article>`;
          }).join("") || empty("Сотрудников в базе пока нет.")}
        </div>
      </article>
    `;
    view.querySelector("[data-add-staff]")?.addEventListener("click", () => openStaffModal());
    view.querySelectorAll("[data-edit-staff]").forEach((button) => button.addEventListener("click", () => openStaffModal(button.dataset.editStaff)));
    view.querySelectorAll("[data-block-staff]").forEach((button) => {
      button.addEventListener("click", () => {
        window.ANIMA_DB.removePartnerStaff(readSession().partnerId, button.dataset.blockStaff, { userId: readSession().userId }, seedData);
        refresh();
      });
    });
  }

  function renderSettings(view) {
    const property = workspace.properties[0] || {};
    const paymentSettings = property.payment_settings || {};
    view.innerHTML = `
      <article class="panel">
        <div class="panel-heading"><div><p>Настройки</p><h2>Данные партнёра</h2></div></div>
        <form class="partner-form" data-partner-settings>
          <label>Название бизнеса<input name="business_name" value="${escapeAttribute(workspace.partner.business_name)}" required /></label>
          <label>Контактное лицо<input name="contact_name" value="${escapeAttribute(workspace.partner.contact_name || "")}" /></label>
          <label>Email<input name="email" value="${escapeAttribute(workspace.partner.email || "")}" /></label>
          <label>Телефон<input name="phone" value="${escapeAttribute(workspace.partner.phone || "")}" /></label>
          <label>Telegram<input name="telegram" value="${escapeAttribute(workspace.partner.telegram || "")}" /></label>
          <p class="muted">Сервисный сбор ANIMA считается автоматически по правилам договора и не редактируется партнёром.</p>
          <button class="primary-btn" type="submit">Отправить изменения</button>
        </form>
      </article>
      <article class="panel" style="margin-top:16px">
        <div class="panel-heading"><div><p>Оплата</p><h2>Способ оплаты объекта</h2></div></div>
        <form class="partner-form" data-payment-settings>
          <label>Способ оплаты
            <select name="method" ${paymentSettings.force_anima_online ? "disabled" : ""}>
              <option value="cash_at_hotel" ${paymentSettings.method === "cash_at_hotel" ? "selected" : ""} ${paymentSettings.cash_allowed === false ? "disabled" : ""}>Оплата наличными в отеле</option>
              <option value="anima_online" ${paymentSettings.method === "anima_online" ? "selected" : ""}>Оплата сразу через ANIMA</option>
            </select>
          </label>
          <p class="muted">${paymentSettings.force_anima_online ? "ANIMA принудительно включила оплату только через ANIMA для этого объекта." : "При оплате наличными клиент онлайн оплачивает только сервисный сбор ANIMA, остаток платит вам в отеле."}</p>
          <button class="primary-btn" type="submit">Сохранить способ оплаты</button>
        </form>
      </article>
      <article class="panel" style="margin-top:16px">
        <div class="panel-heading"><div><p>Аудит</p><h2>История действий</h2></div></div>
        <div class="audit-list">
          ${workspace.auditLogs.slice(0, 20).map((item) => `
            <article class="audit-row">
              <div><h3>${escapeHtml(item.action)}</h3><p>${escapeHtml(item.entity_type)} · ${escapeHtml(item.entity_id)}</p></div>
              <span>${formatDate(item.createdAt)}</span>
            </article>
          `).join("") || empty("История появится после действий партнёра.")}
        </div>
      </article>
    `;
    view.querySelector("[data-partner-settings]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.currentTarget).entries());
      window.ANIMA_DB.updatePartner(readSession().partnerId, { ...data, actorUserId: readSession().userId }, seedData);
      refresh();
    });
    view.querySelector("[data-payment-settings]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.currentTarget).entries());
      window.ANIMA_DB.updatePropertyPaymentSettings(property.id, {
        actorUserId: readSession().userId,
        method: data.method || paymentSettings.method || "anima_online",
        cash_allowed: paymentSettings.cash_allowed !== false,
        force_anima_online: Boolean(paymentSettings.force_anima_online),
        payout_provider: paymentSettings.payout_provider || "manual",
      }, seedData);
      refresh();
    });
  }

  function renderDocuments(view) {
    view.innerHTML = `
      <article class="panel">
        <div class="panel-heading"><div><p>Документы</p><h2>Условия партнёрства</h2></div></div>
        <div class="detail-grid">
          ${detail("Статус партнёра", partnerStatusLabel(workspace.partner.status))}
          ${detail("Модель работы", "ANIMA принимает заявки, партнёр подтверждает, выплаты проходят после завершения проживания.")}
          ${detail("Финансы", "Стоимость бронирования минус сервисный сбор ANIMA = чистая прибыль владельца.")}
          ${detail("Модерация", "Название, адрес, цены, фото и реквизиты могут уходить на проверку администратору.")}
        </div>
      </article>
    `;
  }

  function renderHelp(view) {
    view.innerHTML = `
      <article class="panel">
        <div class="panel-heading">
          <div><p>Помощь</p><h2>Поддержка ANIMA</h2></div>
          <button class="primary-btn" type="button" data-open-support>Написать нам</button>
        </div>
        <div class="detail-grid">
          ${helpItem("Новая бронь", "Клиент оставляет заявку, система временно блокирует даты и отправляет её партнёру.")}
          ${helpItem("Подтверждение", "После подтверждения даты становятся занятыми, клиент получает уведомление, комиссия считается автоматически.")}
          ${helpItem("Отклонение", "Партнёр обязан выбрать причину. Админ видит статистику отказов и историю действий.")}
          ${helpItem("Безопасность", "Бронь нельзя удалить без следа, менять комиссию и открывать занятые даты поверх подтверждённых броней.")}
        </div>
        <div class="notification-list" style="margin-top:16px">
          ${workspace.supportTickets.map((ticket) => `
            <article class="notification-row">
              <div><h3>${escapeHtml(ticket.title)}</h3><p>${escapeHtml(supportTopicLabel(ticket.topic))} · ${escapeHtml(ticket.message)}</p></div>
              <div class="row-actions"><span class="status-pill status-${escapeAttribute(ticket.status)}">${escapeHtml(supportStatusLabel(ticket.status))}</span><span>${formatDate(ticket.createdAt)}</span></div>
            </article>
          `).join("") || empty("Тикетов поддержки пока нет.")}
        </div>
      </article>
    `;
    view.querySelector("[data-open-support]")?.addEventListener("click", openSupportModal);
  }

  function bookingRow(booking) {
    return `
      <article class="booking-row">
        <div>
          <h3>${escapeHtml(booking.customer_name)} · ${escapeHtml(roomTitle(booking.unit_id))}</h3>
          <p>${escapeHtml(propertyTitle(booking.property_id))} · ${escapeHtml(booking.start_date)} - ${escapeHtml(booking.end_date)} · ${booking.guests_count} гостей</p>
          <p>${booking.payment_method === "cash_at_hotel"
            ? `Клиент оплатил сервисный сбор ANIMA: ${money(booking.commission_amount)} · остаток к получению в отеле: ${money(booking.pay_at_hotel_amount || booking.partner_amount)} · ваша чистая прибыль: ${money(booking.partner_amount)}`
            : `Бронь оплачивается через ANIMA · ваша чистая прибыль: ${money(booking.partner_balance_amount || booking.partner_amount)} · статус средств: ${payoutLabels[booking.payout_status] || booking.payout_status}`}</p>
        </div>
        <div class="row-actions">
          ${status(booking.booking_status)}
          <button class="secondary-btn" type="button" data-booking-detail="${escapeAttribute(booking.id)}">Детали</button>
          ${isActionableRequest(booking) ? `
            <button class="primary-btn" type="button" data-booking-confirm="${escapeAttribute(booking.id)}">Подтвердить</button>
            <button class="danger-btn" type="button" data-booking-reject="${escapeAttribute(booking.id)}">Отклонить</button>
          ` : ""}
        </div>
      </article>
    `;
  }

  function bindBookingButtons(root) {
    root.querySelectorAll("[data-booking-detail]").forEach((button) => {
      button.addEventListener("click", () => openBookingModal(button.dataset.bookingDetail));
    });
    root.querySelectorAll("[data-booking-confirm]").forEach((button) => {
      button.addEventListener("click", () => confirmBooking(button.dataset.bookingConfirm));
    });
    root.querySelectorAll("[data-booking-reject]").forEach((button) => {
      button.addEventListener("click", () => openRejectModal(button.dataset.bookingReject));
    });
  }

  function openBookingModal(bookingId) {
    const booking = workspace.bookings.find((item) => item.id === bookingId);
    if (!booking) return;
    openSimpleModal("Детали брони", `
      <div class="detail-grid">
        ${detail("Клиент", booking.customer_name)}
        ${detail("Комната", roomTitle(booking.unit_id))}
        ${detail("Телефон", booking.customer_phone || "не указан")}
        ${detail("Email", booking.customer_email || "не указан")}
        ${detail("Гражданство", booking.citizenship || booking.guests_details?.[0]?.citizenship || "не указано")}
        ${detail("Гости", guestDetailsText(booking))}
        ${detail("Даты", `${booking.start_date} - ${booking.end_date}`)}
        ${detail("Гости", booking.guests_count)}
        ${detail("Стоимость бронирования", money(booking.total_amount))}
        ${detail("Сервисный сбор ANIMA", money(booking.commission_amount))}
        ${detail("Ваша чистая прибыль", money(booking.partner_amount))}
        ${detail("Способ оплаты", booking.payment_method === "cash_at_hotel" ? "Наличными в отеле" : "Онлайн через ANIMA")}
        ${booking.payment_method === "cash_at_hotel" ? detail("Остаток к получению в отеле", money(booking.pay_at_hotel_amount || booking.partner_amount)) : detail("Статус средств", payoutLabels[booking.payout_status] || booking.payout_status)}
        ${detail("Оплата", paymentLabels[booking.payment_status] || booking.payment_status)}
        ${detail("Выплата", payoutLabels[booking.payout_status] || booking.payout_status)}
        ${detail("Пожелания", wishesText(booking.wishes))}
        ${detail("Комментарий партнёра", booking.partner_response?.comment || "пока нет")}
      </div>
      <form class="partner-form" data-comment-form>
        <label>Ответ / комментарий
          <textarea name="text" placeholder="Например: ранний заезд возможен за доплату"></textarea>
        </label>
        <select name="visibility">
          <option value="partner_admin">Партнёр + админ</option>
          <option value="client_partner_admin">Клиент + партнёр + админ</option>
          <option value="admin_only">Только админ</option>
        </select>
        <button class="primary-btn" type="submit">Сохранить комментарий</button>
      </form>
      <div class="split-actions">
        ${isActionableRequest(booking) ? `<button class="primary-btn" data-modal-confirm="${escapeAttribute(booking.id)}">Подтвердить</button><button class="danger-btn" data-modal-reject="${escapeAttribute(booking.id)}">Отклонить</button>` : ""}
      </div>
    `);
    document.querySelector("[data-comment-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.currentTarget).entries());
      if (!String(data.text || "").trim()) return;
      window.ANIMA_DB.addBookingComment(readSession().partnerId, {
        userId: readSession().userId,
        bookingId,
        text: data.text,
        visibility: data.visibility,
      }, seedData);
      closeModal();
      refresh();
    });
    document.querySelector("[data-modal-confirm]")?.addEventListener("click", () => confirmBooking(bookingId));
    document.querySelector("[data-modal-reject]")?.addEventListener("click", () => openRejectModal(bookingId));
  }

  function confirmBooking(bookingId) {
    try {
      window.ANIMA_DB.confirmPartnerBooking(readSession().partnerId, bookingId, {
        userId: readSession().userId,
        comment: "Партнёр подтвердил бронь",
      }, seedData);
      closeModal();
      refresh();
    } catch (error) {
      alert(humanError(error));
    }
  }

  function openRejectModal(bookingId) {
    closeModal();
    openSimpleModal("Отклонить бронь", `
      <form class="partner-form" data-reject-form>
        <label>Причина отказа
          <select name="reason" required>
            <option value="нет мест">Нет мест</option>
            <option value="неверная цена">Неверная цена</option>
            <option value="объект недоступен">Объект недоступен</option>
            <option value="техническая причина">Техническая причина</option>
            <option value="другое">Другое</option>
          </select>
        </label>
        <label>Комментарий
          <textarea name="comment" placeholder="Можно предложить другие даты или объяснить ситуацию"></textarea>
        </label>
        <button class="danger-btn" type="submit">Отклонить</button>
      </form>
    `);
    document.querySelector("[data-reject-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.currentTarget).entries());
      try {
        window.ANIMA_DB.rejectPartnerBooking(readSession().partnerId, bookingId, {
          userId: readSession().userId,
          reason: data.reason,
          comment: data.comment,
        }, seedData);
        closeModal();
        refresh();
      } catch (error) {
        alert(humanError(error));
      }
    });
  }

  function openPropertyModal(propertyId) {
    const property = workspace.properties.find((item) => item.id === propertyId);
    if (!property) return;
    const categories = window.ANIMA_DB?.categoryCatalog?.() || [];
    openSimpleModal("Редактировать объект", `
      <form class="partner-form" data-property-form>
        <label>Категория
          <select name="category" required>
            ${categories.map((item) => `<option value="${escapeAttribute(item.id)}" ${item.id === property.content_category ? "selected" : ""}>${escapeHtml(item.emoji || "")} ${escapeHtml(item.label)}</option>`).join("")}
          </select>
        </label>
        <label>Название<input name="title" value="${escapeAttribute(property.title)}" required /></label>
        <label>Тип объекта
          <select name="type">
            ${["hotel", "villa", "house", "apartment", "other"].map((type) => `<option value="${type}" ${property.type === type ? "selected" : ""}>${propertyTypeLabel(type)}</option>`).join("")}
          </select>
        </label>
        <label>Описание<textarea name="description">${escapeHtml(property.description || "")}</textarea></label>
        <label>Адрес<input name="address" value="${escapeAttribute(property.address || "")}" required /></label>
        <label>Локация<input name="location" value="${escapeAttribute(property.location || "")}" /></label>
        <label>Загрузка фото
          <input name="photosUpload" type="file" accept="image/*" multiple />
        </label>
        <label>Фото объекта<textarea name="photos" placeholder="Фасад, ресепшен, бассейн, территория. Каждое фото с новой строки">${escapeHtml((property.photos || []).join("\n"))}</textarea></label>
        <label>Заезд<input name="checkin" value="${escapeAttribute(property.checkin || "14:00")}" /></label>
        <label>Выезд<input name="checkout" value="${escapeAttribute(property.checkout || "12:00")}" /></label>
        <label>Удобства через запятую<textarea name="amenities">${escapeHtml((property.amenities || []).join(", "))}</textarea></label>
        <label>Правила через запятую<textarea name="rules">${escapeHtml((property.rules || []).join(", "))}</textarea></label>
        <button class="primary-btn" type="submit">Сохранить</button>
      </form>
      <p class="muted">Название, адрес и фото отправляются на модерацию администратору.</p>
    `);
    document.querySelector("[data-property-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      partnerFilesToDataUrls(formData.getAll("photosUpload")).then((uploadedPhotos) => {
        const data = Object.fromEntries(formData.entries());
        window.ANIMA_DB.updatePartnerProperty(readSession().partnerId, propertyId, {
        userId: readSession().userId,
        ...data,
        photos: [...String(data.photos || "").split("\n").map((item) => item.trim()).filter(Boolean), ...uploadedPhotos],
        amenities: String(data.amenities || "").split(",").map((item) => item.trim()).filter(Boolean),
        rules: String(data.rules || "").split(",").map((item) => item.trim()).filter(Boolean),
      }, seedData);
        closeModal();
        refresh();
      });
    });
  }

  function openCreatePropertyModal() {
    const categories = window.ANIMA_DB?.categoryCatalog?.() || [];
    openSimpleModal("Создать объект", `
      <form class="partner-form" data-create-property-form>
        <label>Категория
          <select name="category" required>
            <option value="">Сначала выберите категорию</option>
            ${categories.map((item) => `<option value="${escapeAttribute(item.id)}">${escapeHtml(item.emoji || "")} ${escapeHtml(item.label)}</option>`).join("")}
          </select>
        </label>
        <label>Тип объекта
          <select name="type">
            ${["hotel", "villa", "house", "apartment", "other"].map((type) => `<option value="${type}">${propertyTypeLabel(type)}</option>`).join("")}
          </select>
        </label>
        <label>Название<input name="title" placeholder="Goldient Boutique Hotel" required /></label>
        <label>Описание<textarea name="description" placeholder="Описание объекта, атмосферы и преимуществ"></textarea></label>
        <label>Адрес<input name="address" placeholder="Dalat, Vietnam" required /></label>
        <label>Локация<input name="location" placeholder="Tuyen Lam Lake" /></label>
        <label>Загрузка фото
          <input name="photosUpload" type="file" accept="image/*" multiple />
        </label>
        <label>Фото объекта<textarea name="photos" placeholder="Фасад, ресепшен, территория, бассейн. Каждое фото с новой строки"></textarea></label>
        <label>Удобства<textarea name="amenities" placeholder="Бассейн, ресторан, парковка, Wi-Fi"></textarea></label>
        <label>Правила<textarea name="rules" placeholder="Заезд после 14:00, выезд до 12:00"></textarea></label>
        <button class="primary-btn" type="submit">Отправить на модерацию</button>
      </form>
      <p class="muted">До одобрения ANIMA объект не будет публично отображаться клиентам.</p>
    `);
    document.querySelector("[data-create-property-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      if (!String(formData.get("category") || "").trim()) {
        alert("Категория обязательна.");
        return;
      }
      partnerFilesToDataUrls(formData.getAll("photosUpload")).then((uploadedPhotos) => {
        const data = Object.fromEntries(formData.entries());
        window.ANIMA_DB.createPartnerProperty(readSession().partnerId, {
        userId: readSession().userId,
        ...data,
        photos: [...String(data.photos || "").split("\n").map((item) => item.trim()).filter(Boolean), ...uploadedPhotos],
        amenities: String(data.amenities || "").split(",").map((item) => item.trim()).filter(Boolean),
        rules: String(data.rules || "").split(",").map((item) => item.trim()).filter(Boolean),
      }, seedData);
        closeModal();
        refresh();
      });
    });
  }

  function openRoomModal(roomId = "") {
    const room = workspace.units.find((item) => item.id === roomId) || {};
    const hotelProperties = workspace.properties.filter((item) => item.type === "hotel" || item.booking_model === "room_type");
    const property = workspace.properties.find((item) => item.id === room.property_id) || hotelProperties[0] || workspace.properties[0];
    openSimpleModal(roomId ? "Изменить комнату" : "Добавить комнату", `
      <form class="partner-form" data-room-form>
        <label>Отель
          <select name="propertyId" ${roomId ? "disabled" : ""}>
            ${hotelProperties.map((item) => `<option value="${escapeAttribute(item.id)}" ${item.id === property?.id ? "selected" : ""}>${escapeHtml(item.title)}</option>`).join("")}
          </select>
        </label>
        <label>Название категории<input name="name" value="${escapeAttribute(room.name || "")}" placeholder="Deluxe Mountain View" required /></label>
        <label>Тип номера
          <select name="type">
            ${["standard", "deluxe", "villa", "apartment", "bungalow", "suite"].map((type) => `<option value="${type}" ${room.type === type ? "selected" : ""}>${roomTypeLabel(type)}</option>`).join("")}
          </select>
        </label>
        <label>Количество таких комнат<input name="quantity" inputmode="numeric" value="${escapeAttribute(room.quantity || 1)}" required /></label>
        <label>Вместимость<input name="capacity" inputmode="numeric" value="${escapeAttribute(room.capacity || 2)}" required /></label>
        <label>Кроватей<input name="beds_count" inputmode="numeric" value="${escapeAttribute(room.beds_count || 1)}" required /></label>
        <label>Ванных<input name="baths_count" inputmode="numeric" value="${escapeAttribute(room.baths_count || 1)}" required /></label>
        <label>Площадь<input name="size" value="${escapeAttribute(room.size || "")}" placeholder="36 м²" /></label>
        <label>Цена за ночь<input name="base_price" inputmode="numeric" value="${escapeAttribute(room.base_price || 0)}" required /></label>
        <label>Цена за выходные<input name="weekend_price" inputmode="numeric" value="${escapeAttribute(room.weekend_price || room.base_price || 0)}" /></label>
        <label>Сезонная цена<input name="seasonal_price" inputmode="numeric" value="${escapeAttribute(room.seasonal_price || 0)}" /></label>
        <label>Минимум ночей<input name="min_nights" inputmode="numeric" value="${escapeAttribute(room.min_nights || 1)}" /></label>
        <label>Загрузка фото<input name="photosUpload" type="file" accept="image/*" multiple /></label>
        <label>Фото<textarea name="photos" placeholder="Ссылки или data:image, каждая с новой строки">${escapeHtml((room.photos || []).join("\n"))}</textarea></label>
        <label>Описание<textarea name="description">${escapeHtml(room.description || "")}</textarea></label>
        <label>Удобства<textarea name="amenities" placeholder="Wi-Fi, балкон, вид на горы">${escapeHtml((room.amenities || []).join(", "))}</textarea></label>
        <label>Правила<textarea name="rules" placeholder="Не курить, тихие часы">${escapeHtml((room.rules || []).join(", "))}</textarea></label>
        <label>Статус
          <select name="status">
            ${["active", "hidden", "moderation", "blocked"].map((item) => `<option value="${item}" ${(room.status || "moderation") === item ? "selected" : ""}>${partnerStatusLabel(item)}</option>`).join("")}
          </select>
        </label>
        <button class="primary-btn" type="submit">${roomId ? "Сохранить" : "Добавить комнату"}</button>
      </form>
    `);
    document.querySelector("[data-room-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      partnerFilesToDataUrls(formData.getAll("photosUpload")).then((uploadedPhotos) => {
      const data = Object.fromEntries(formData.entries());
      try {
        const payload = {
          ...data,
          userId: readSession().userId,
          propertyId: roomId ? property.id : (data.propertyId || property.id),
          photos: [...String(data.photos || "").split("\n").map((item) => item.trim()).filter(Boolean), ...uploadedPhotos],
          amenities: String(data.amenities || "").split(",").map((item) => item.trim()).filter(Boolean),
          rules: String(data.rules || "").split(",").map((item) => item.trim()).filter(Boolean),
        };
        if (roomId) window.ANIMA_DB.updateRoomType(readSession().partnerId, roomId, payload, seedData);
        else window.ANIMA_DB.createRoomType(readSession().partnerId, payload, seedData);
        closeModal();
        refresh();
      } catch (error) {
        alert(humanError(error));
      }
      });
    });
  }

  function openChatModal(chatId) {
    const chat = workspace.chats.find((item) => item.id === chatId);
    if (!chat) return;
    const messages = workspace.messages.filter((item) => item.chat_id === chatId);
    openSimpleModal(chat.title, `
      <div class="notification-list">
        ${messages.map((message) => `
          <article class="notification-row">
            <div><h3>${escapeHtml(senderRoleLabel(message.sender_role))}</h3><p>${escapeHtml(message.text)}</p></div>
            <span>${formatDate(message.createdAt)}</span>
          </article>
        `).join("") || empty("Сообщений пока нет.")}
      </div>
      <form class="partner-form" data-message-form>
        <label>Сообщение<textarea name="text" required placeholder="${chat.type === "partner_admin" ? "Написать администрации ANIMA" : "Ответить клиенту"}"></textarea></label>
        <button class="primary-btn" type="submit">Отправить</button>
      </form>
    `);
    document.querySelector("[data-message-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const text = String(new FormData(event.currentTarget).get("text") || "").trim();
      if (!text) return;
      window.ANIMA_DB.addMessage({
        chatId,
        senderId: readSession().userId,
        senderRole: "partner",
        text,
      }, seedData);
      closeModal();
      refresh();
    });
  }

  function openSupportModal() {
    openSimpleModal("Написать в поддержку ANIMA", `
      <form class="partner-form" data-support-form>
        <label>Тема
          <select name="topic" required>
            <option value="booking">Бронирование</option>
            <option value="payouts">Выплаты</option>
            <option value="system_error">Ошибка системы</option>
            <option value="property_onboarding">Подключение объекта</option>
            <option value="other">Другое</option>
          </select>
        </label>
        <label>Заголовок<input name="title" placeholder="Коротко опишите вопрос" /></label>
        <label>Сообщение<textarea name="message" required placeholder="Напишите, что нужно проверить или исправить"></textarea></label>
        <label>Файл<input name="files" type="file" multiple /></label>
        <button class="primary-btn" type="submit">Отправить тикет</button>
      </form>
    `);
    document.querySelector("[data-support-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      try {
        window.ANIMA_DB.createSupportTicket({
          partnerId: readSession().partnerId,
          userId: readSession().userId,
          topic: data.get("topic"),
          title: data.get("title"),
          message: data.get("message"),
          files: Array.from(event.currentTarget.elements.files.files || []).map((file) => ({
            name: file.name,
            size: file.size,
            type: file.type,
          })),
        }, seedData);
        closeModal();
        refresh();
      } catch (error) {
        alert(humanError(error));
      }
    });
  }

  function openPasswordModal() {
    openSimpleModal("Сменить пароль", `
      <form class="partner-form" data-change-password-form>
        <label>Новый пароль<input name="password" type="password" minlength="8" required /></label>
        <label>Повторите пароль<input name="repeat" type="password" minlength="8" required /></label>
        <button class="primary-btn" type="submit">Сохранить пароль</button>
      </form>
    `);
    document.querySelector("[data-change-password-form]")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const password = String(data.get("password") || "");
      const repeat = String(data.get("repeat") || "");
      if (password !== repeat) {
        alert("Пароли не совпадают.");
        return;
      }
      window.ANIMA_DB.changePartnerPassword({
        partnerId: readSession().partnerId,
        userId: readSession().userId,
        passwordHash: await sha256(password),
      }, seedData);
      closeModal();
      refresh();
    });
  }

  function openStaffModal(staffId = "") {
    const state = window.ANIMA_DB.getState(seedData);
    const staff = state.tables.partnerStaff.find((item) => item.id === staffId && item.partner_id === workspace.partner.id) || {};
    const user = state.tables.users.find((item) => item.id === staff.user_id) || {};
    const permissions = staff.permissions || [];
    const permissionOptions = ["bookings", "calendar", "messages", "rooms", "finance"];
    openSimpleModal(staffId ? "Права сотрудника" : "Добавить сотрудника", `
      <form class="partner-form" data-staff-form>
        ${staffId ? "" : `
          <label>ФИО<input name="name" value="${escapeAttribute(user.name || "")}" required /></label>
          <label>Логин / email<input name="login" value="${escapeAttribute(user.login || user.email || "")}" required /></label>
          <label>Телефон<input name="phone" value="${escapeAttribute(user.phone || "")}" /></label>
        `}
        <label>Роль
          <select name="role">
            <option value="partner_staff" ${staff.role === "partner_staff" ? "selected" : ""}>Сотрудник отеля</option>
            <option value="manager" ${staff.role === "manager" ? "selected" : ""}>Менеджер</option>
            <option value="finance" ${staff.role === "finance" ? "selected" : ""}>Финансы</option>
          </select>
        </label>
        <fieldset class="staff-permissions">
          <legend>Права доступа</legend>
          ${permissionOptions.map((permission) => `
            <label><input type="checkbox" name="permissions" value="${permission}" ${permissions.includes(permission) ? "checked" : ""} /> ${staffPermissionLabel(permission)}</label>
          `).join("")}
        </fieldset>
        <button class="primary-btn" type="submit">${staffId ? "Сохранить права" : "Добавить сотрудника"}</button>
      </form>
    `);
    document.querySelector("[data-staff-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const payload = {
        userId: readSession().userId,
        name: data.get("name"),
        login: data.get("login"),
        phone: data.get("phone"),
        role: data.get("role"),
        permissions: data.getAll("permissions"),
      };
      try {
        if (staffId) window.ANIMA_DB.updatePartnerStaff(readSession().partnerId, staffId, payload, seedData);
        else window.ANIMA_DB.createPartnerStaff(readSession().partnerId, payload, seedData);
        closeModal();
        refresh();
      } catch (error) {
        alert(humanError(error));
      }
    });
  }

  function openSimpleModal(title, body) {
    closeModal();
    document.body.insertAdjacentHTML("beforeend", `
      <div class="modal-backdrop" data-modal>
        <section class="modal-panel">
          <header>
            <h2>${escapeHtml(title)}</h2>
            <button class="ghost-btn" type="button" data-close-modal>Закрыть</button>
          </header>
          ${body}
        </section>
      </div>
    `);
    document.querySelector("[data-close-modal]")?.addEventListener("click", closeModal);
    document.querySelector("[data-modal]")?.addEventListener("click", (event) => {
      if (event.target.matches("[data-modal]")) closeModal();
    });
  }

  function closeModal() {
    document.querySelector("[data-modal]")?.remove();
  }

  function refresh() {
    workspace = window.ANIMA_DB.getPartnerWorkspace(readSession().partnerId, seedData);
    renderShell();
  }

  function stat(label, value, hint) {
    return `<article class="stat-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value))}</strong><small>${escapeHtml(hint)}</small></article>`;
  }

  function iconSvg(name) {
    const icons = {
      home: `<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9.5 20v-6h5v6"/>`,
      building: `<path d="M4 21V5.5C4 4.7 4.7 4 5.5 4h13c.8 0 1.5.7 1.5 1.5V21"/><path d="M8 8h2M14 8h2M8 12h2M14 12h2M8 16h2M14 16h2"/><path d="M3 21h18"/>`,
      house: `<path d="M4 11.5 12 5l8 6.5"/><path d="M6.5 10.5V20h11v-9.5"/><path d="M9 20v-5h6v5"/>`,
      calendar: `<path d="M7 3v4M17 3v4"/><rect x="4" y="6" width="16" height="15" rx="2"/><path d="M4 11h16"/>`,
      "calendar-check": `<path d="M7 3v4M17 3v4"/><rect x="4" y="6" width="16" height="15" rx="2"/><path d="M4 11h16"/><path d="m8.5 16 2 2 5-5"/>`,
      "calendar-money": `<path d="M7 3v4M17 3v4"/><rect x="4" y="6" width="16" height="15" rx="2"/><path d="M4 11h16"/><path d="M12 18v-5M10 14.2c.5-.7 3.5-.7 4 0 .5.8-.3 1.3-2 1.4-1.7.1-2.5.6-2 1.4.5.7 3.5.7 4 0"/>`,
      briefcase: `<rect x="4" y="8" width="16" height="11" rx="2"/><path d="M9 8V6.5C9 5.7 9.7 5 10.5 5h3c.8 0 1.5.7 1.5 1.5V8"/><path d="M4 13h16"/><path d="M10 13v2h4v-2"/>`,
      coin: `<circle cx="12" cy="12" r="8"/><path d="M12 8v8M9.8 9.8c.7-1 3.7-1 4.4 0 .8 1.2-.4 1.8-2.2 2-1.8.2-3 .8-2.2 2 .7 1 3.7 1 4.4 0"/>`,
      "coin-dollar": `<circle cx="12" cy="12" r="8"/><path d="M12 7v10"/><path d="M9.6 9.3c.7-.9 4-.9 4.8.1.8 1.1-.5 1.8-2.4 1.9-1.9.2-3.2.8-2.4 2 .8 1 4.1 1 4.8 0"/>`,
      message: `<path d="M5 6.5h14c.8 0 1.5.7 1.5 1.5v8c0 .8-.7 1.5-1.5 1.5H9l-4.5 3v-12C4.5 7.2 4.2 6.5 5 6.5Z"/><path d="M8 10.5h8M8 14h5"/>`,
      mail: `<rect x="4" y="6" width="16" height="12" rx="2"/><path d="m5 7 7 6 7-6"/>`,
      star: `<path d="m12 4 2.4 5 5.4.8-3.9 3.8.9 5.4-4.8-2.6L7.2 19l.9-5.4-3.9-3.8 5.4-.8L12 4Z"/>`,
      file: `<path d="M7 3.5h7l4 4V20.5H7z"/><path d="M14 3.5V8h4"/><path d="M9.5 12h5M9.5 15.5h5"/>`,
      settings: `<path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z"/><path d="M19 12a7 7 0 0 0-.1-1.1l2-1.5-2-3.4-2.4 1a7.8 7.8 0 0 0-1.9-1.1L14.3 3h-4.6l-.3 2.9A7.8 7.8 0 0 0 7.5 7l-2.4-1-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.1l-2 1.5 2 3.4 2.4-1a7.8 7.8 0 0 0 1.9 1.1l.3 2.9h4.6l.3-2.9a7.8 7.8 0 0 0 1.9-1.1l2.4 1 2-3.4-2-1.5c.1-.3.1-.7.1-1.1Z"/>`,
      users: `<path d="M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><path d="M16 11a3 3 0 1 0 0-6"/><path d="M15.5 15.2A5 5 0 0 1 20.5 20"/>`,
      help: `<circle cx="12" cy="12" r="9"/><path d="M9.7 9.2A2.6 2.6 0 0 1 12.2 7c1.5 0 2.7 1 2.7 2.4 0 1.2-.7 1.8-1.7 2.4-.8.5-1.2 1-1.2 2.2"/><path d="M12 17h.01"/>`,
      bell: `<path d="M18 9a6 6 0 0 0-12 0c0 7-2.5 7-2.5 7h17S18 16 18 9Z"/><path d="M10 20a2.2 2.2 0 0 0 4 0"/>`,
      "file-check": `<path d="M7 3.5h7l4 4V20.5H7z"/><path d="M14 3.5V8h4"/><path d="m9.5 14.5 1.8 1.8 4-4"/>`,
      square: `<rect x="6" y="6" width="12" height="12" rx="2"/>`,
      menu: `<path d="M5 7h14M5 12h14M5 17h14"/>`,
      "chevron-left": `<path d="m15 6-6 6 6 6"/>`,
      "chevron-right": `<path d="m9 6 6 6-6 6"/>`,
    };
    return `<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.square}</svg>`;
  }

  function dashboardMetric(label, value, hint, icon, tone, targetRoute, trend = false) {
    return `
      <article class="dashboard-metric-card" data-dashboard-route="${escapeAttribute(targetRoute)}">
        <span class="metric-icon ${tone}">${iconSvg(icon)}</span>
        <div>
          <p>${escapeHtml(label)}</p>
          <strong>${escapeHtml(String(value))}</strong>
          <small class="${trend ? "positive" : ""}">${escapeHtml(hint)}</small>
        </div>
        <b>${iconSvg("chevron-right")}</b>
      </article>
    `;
  }

  function overviewItem(label, value, delta, tone) {
    return `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value))}</strong><small class="${tone}">${escapeHtml(delta || "")}</small></div>`;
  }

  function bookingChart(bookings = [], period = "month") {
    const buckets = chartBuckets(period);
    bookings.forEach((booking) => {
      const date = new Date(booking.createdAt || booking.created_at || booking.start_date || "");
      const index = chartBucketIndex(date, period, buckets.length);
      if (index >= 0 && buckets[index]) buckets[index].value += 1;
    });
    const total = buckets.reduce((sum, item) => sum + item.value, 0);
    if (!total) {
      return `
        <div class="booking-chart chart-empty">
          <div class="empty-state">За выбранный период данных пока нет</div>
        </div>
      `;
    }
    const max = Math.max(...buckets.map((item) => item.value), 1);
    const width = 570;
    const height = 152;
    const points = buckets.map((bucket, index) => {
      const x = buckets.length === 1 ? 0 : Math.round((index / (buckets.length - 1)) * width);
      const y = Math.round(height - (bucket.value / max) * (height - 18) - 8);
      return `${x},${y}`;
    }).join(" ");
    const labels = chartLabels(buckets, period);
    return `
      <div class="booking-chart">
        <div class="chart-scale"><span>${max}</span><span>${Math.round(max * 0.8)}</span><span>${Math.round(max * 0.6)}</span><span>${Math.round(max * 0.4)}</span><span>${Math.round(max * 0.2)}</span><span>0</span></div>
        <svg viewBox="0 0 570 152" role="img" aria-label="График бронирований">
          <defs>
            <linearGradient id="partner-chart-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stop-color="#7b61ff" stop-opacity="0.26" />
              <stop offset="100%" stop-color="#7b61ff" stop-opacity="0" />
            </linearGradient>
          </defs>
          <path d="M ${points} L 570 152 L 0 152 Z" fill="url(#partner-chart-fill)" />
          <polyline points="${points}" fill="none" stroke="#765dff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <div class="chart-labels">${labels.map((label) => `<span>${escapeHtml(label)}</span>`).join("")}</div>
      </div>
    `;
  }

  function latestBookingRow(booking, index = 0) {
    const person = booking.customer_name || "Клиент";
    return `
      <button class="latest-booking-row" type="button" data-booking-detail="${escapeAttribute(booking.id || "")}">
        <span class="avatar-bubble">${escapeHtml(initials(person))}</span>
        <span><strong>${escapeHtml(person)}</strong><small>${escapeHtml(dateRangeLabel(booking))}</small></span>
        <em>${escapeHtml(roomTitle(booking.unit_id))}</em>
        <b>${escapeHtml(moneyCompact(booking.total_amount))}</b>
        <i class="${booking.booking_status === "waiting_payment" ? "waiting" : ""}">${escapeHtml(bookingLabels[booking.booking_status] || "Заявка")}</i>
        <small>${escapeHtml(relativeTime(booking.createdAt || booking.created_at))}</small>
      </button>
    `;
  }

  function dashboardCalendar() {
    const days = calendarDays(calendarCursor);
    return `
      <div class="calendar-legend"><span class="free">Свободно</span><span class="busy">Занято</span><span class="pending">Ожидает</span><span class="closed">Закрыто</span></div>
      <div class="mini-calendar">
        ${["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day) => `<b>${day}</b>`).join("")}
        ${days.map((day) => `<span class="${escapeAttribute(day.className)}">${day.label}</span>`).join("")}
      </div>
    `;
  }

  function balanceLine(label, value, tone = "") {
    return `<div class="balance-line ${tone}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
  }

  function legendItem(label, value, tone) {
    return `<div class="legend-item"><span class="${tone}"></span><div><strong>${escapeHtml(label)}</strong><small>${escapeHtml(value)}</small></div></div>`;
  }

  function dashboardMessage(name, text, time, badge = "", tone = "") {
    return `
      <article class="dashboard-message">
        <span class="avatar-bubble ${tone}">${tone === "support" ? "△" : escapeHtml(initials(name))}</span>
        <div><strong>${escapeHtml(name)}</strong><p>${escapeHtml(text)}</p></div>
        <small>${escapeHtml(time)}</small>
        ${badge ? `<em>${escapeHtml(badge)}</em>` : ""}
      </article>
    `;
  }

  function profileMenu() {
    const items = [
      ["profile", "Профиль"],
      ["account", "Настройки аккаунта"],
      ["payouts", "Реквизиты для выплат"],
      ["notifications", "Уведомления"],
      ["security", "Безопасность"],
      ["password", "Сменить пароль"],
      ["logout", "Выйти"],
    ];
    return `<div class="profile-menu" data-profile-menu>${items.map(([id, label]) => `<button type="button" data-profile-action="${id}">${escapeHtml(label)}</button>`).join("")}</div>`;
  }

  function partnerNotificationsPopover() {
    const items = workspace.notifications.slice(0, 8);
    return `
      <div class="partner-notification-popover" data-partner-notification-popover>
        <div class="partner-popover-head"><strong>Уведомления</strong><button type="button" data-close-partner-notifications>×</button></div>
        <div class="partner-popover-list">
          ${items.map((item) => `
            <button class="${item.read_at ? "" : "unread"}" type="button" data-open-partner-notification="${escapeAttribute(item.id)}">
              <span>${escapeHtml(item.title || "Уведомление")}</span>
              <small>${escapeHtml(item.message || "")}</small>
            </button>
          `).join("") || `<div class="empty-state">Уведомлений пока нет</div>`}
        </div>
      </div>
    `;
  }

  function runProfileAction(action) {
    profileMenuOpen = false;
    if (action === "logout") {
      clearSession();
      renderLogin();
      return;
    }
    if (action === "password" || action === "security") {
      openPasswordModal();
      return;
    }
    const routes = {
      profile: "settings",
      account: "settings",
      payouts: "withdrawals",
      notifications: "notifications",
    };
    route = routes[action] || "settings";
    renderShell();
  }

  function closeProfileMenuOnce(event) {
    if (!profileMenuOpen) return;
    if (event.target.closest("[data-profile-menu], [data-profile-menu-toggle]")) return;
    profileMenuOpen = false;
    renderShell();
  }

  function navBadge(id) {
    if (id === "requests") return workspace?.stats?.newRequests || "";
    if (id === "messages") return unreadMessageCount() || "";
    if (id === "notifications") return workspace?.notifications?.filter((item) => !item.read_at).length || "";
    return "";
  }

  function unreadMessageCount() {
    return workspace.messages.filter((item) => !item.read_at && item.sender_role !== "partner").length;
  }

  function partnerDisplayName() {
    return workspace.partner.contact_name || workspace.partner.business_name || "Партнёр ANIMA";
  }

  function primaryLocation() {
    const property = workspace.properties[0] || {};
    return property.location || property.address || "Локация не указана";
  }

  function periodOptions() {
    return [
      { value: "today", label: "Сегодня" },
      { value: "week", label: "Неделя" },
      { value: "month", label: "Месяц" },
      { value: "year", label: "Год" },
    ];
  }

  function periodLabel(value) {
    return periodOptions().find((item) => item.value === value)?.label || "Месяц";
  }

  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function periodRange(value) {
    const today = startOfDay(new Date());
    if (value === "today") return { start: today, end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1) };
    if (value === "week") {
      const day = today.getDay() || 7;
      const start = new Date(today);
      start.setDate(today.getDate() - day + 1);
      return { start, end: new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7) };
    }
    if (value === "year") return { start: new Date(today.getFullYear(), 0, 1), end: new Date(today.getFullYear() + 1, 0, 1) };
    return { start: new Date(today.getFullYear(), today.getMonth(), 1), end: new Date(today.getFullYear(), today.getMonth() + 1, 1) };
  }

  function previousPeriodRange(value) {
    const current = periodRange(value);
    const length = current.end.getTime() - current.start.getTime();
    return { start: new Date(current.start.getTime() - length), end: current.start };
  }

  function inPeriod(booking, range) {
    const date = new Date(booking.createdAt || booking.created_at || booking.start_date || "");
    return !Number.isNaN(date.getTime()) && date >= range.start && date < range.end;
  }

  function sortLatest(items = []) {
    return [...items].sort((a, b) => new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0));
  }

  function sumMoney(items, key) {
    return items.reduce((sum, item) => sum + Number(item[key] || 0), 0);
  }

  function countStatus(items, statuses) {
    return items.filter((item) => statuses.includes(item.booking_status)).length;
  }

  function trendText(current, previous) {
    if (!previous && !current) return "Нет данных";
    if (!previous) return current ? "Новый период" : "Нет данных";
    const percent = Math.round(((current - previous) / previous) * 100);
    return `${percent > 0 ? "+" : ""}${percent}% к прошлому периоду`;
  }

  function hasAnyMoneyData() {
    return workspace.bookings.length > 0 || workspace.payments.length > 0 || workspace.withdrawalRequests.length > 0;
  }

  function occupancyToday() {
    const total = workspace.units.reduce((sum, unit) => sum + Number(unit.quantity || 1), 0);
    if (!total) return { label: "Нет данных", hint: "Нет комнат в базе" };
    const today = new Date().toISOString().slice(0, 10);
    const occupied = workspace.bookings.filter((booking) => ["confirmed", "paid", "active", "checked_in"].includes(booking.booking_status) && booking.start_date <= today && booking.end_date > today).length;
    return { label: `${occupied}/${total}`, hint: occupied ? "Номера заняты сегодня" : "Сегодня свободно" };
  }

  function chartBuckets(period) {
    const range = periodRange(period);
    if (period === "today") return Array.from({ length: 24 }, (_, index) => ({ label: `${String(index).padStart(2, "0")}:00`, value: 0 }));
    if (period === "week") return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(range.start);
      date.setDate(range.start.getDate() + index);
      return { label: date.toLocaleDateString("ru-RU", { weekday: "short" }), date, value: 0 };
    });
    if (period === "year") return Array.from({ length: 12 }, (_, index) => ({ label: new Date(range.start.getFullYear(), index, 1).toLocaleDateString("ru-RU", { month: "short" }), value: 0 }));
    const days = new Date(range.start.getFullYear(), range.start.getMonth() + 1, 0).getDate();
    return Array.from({ length: days }, (_, index) => ({ label: String(index + 1), value: 0 }));
  }

  function chartBucketIndex(date, period, length) {
    if (Number.isNaN(date.getTime())) return -1;
    const range = periodRange(period);
    if (date < range.start || date >= range.end) return -1;
    if (period === "today") return date.getHours();
    if (period === "week") return Math.floor((startOfDay(date) - range.start) / 86400000);
    if (period === "year") return date.getMonth();
    return date.getDate() - 1 < length ? date.getDate() - 1 : -1;
  }

  function chartLabels(buckets, period) {
    if (period === "today") return ["00:00", "06:00", "12:00", "18:00", "23:00"];
    if (period === "week") return buckets.map((item) => item.label);
    if (period === "year") return buckets.filter((_, index) => index % 2 === 0 || index === 11).map((item) => item.label);
    const last = buckets.length;
    return [`1`, `${Math.max(1, Math.round(last / 4))}`, `${Math.max(1, Math.round(last / 2))}`, `${Math.max(1, Math.round(last * 0.75))}`, `${last}`].map((day) => `${day}`);
  }

  function calendarDays(cursor) {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = new Date(first);
    start.setDate(first.getDate() - ((first.getDay() || 7) - 1));
    const today = new Date().toISOString().slice(0, 10);
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const dateKey = date.toISOString().slice(0, 10);
      const statuses = dayStatuses(dateKey);
      const muted = date.getMonth() !== cursor.getMonth() ? "muted" : "";
      const selected = dateKey === today ? "selected" : "";
      const statusClass = statuses.includes("busy") ? "busy" : statuses.includes("pending") ? "pending" : statuses.includes("closed") ? "closed" : "free";
      return { label: date.getDate(), className: [muted, selected || statusClass].filter(Boolean).join(" ") };
    });
  }

  function dayStatuses(dateKey) {
    const statusList = [];
    if (workspace.bookings.some((booking) => ["confirmed", "paid", "active", "checked_in"].includes(booking.booking_status) && booking.start_date <= dateKey && booking.end_date > dateKey)) statusList.push("busy");
    if (workspace.bookings.some((booking) => isRequestBooking(booking) && booking.start_date <= dateKey && booking.end_date > dateKey)) statusList.push("pending");
    if (workspace.availability.some((item) => item.date === dateKey && ["closed", "admin_closed", "technical"].includes(item.status))) statusList.push("closed");
    return statusList;
  }

  function monthTitle(date) {
    return date.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
  }

  function incomeBreakdown(bookings = []) {
    const total = sumMoney(bookings, "total_amount");
    if (!bookings.length || !total) {
      return `<div class="income-donut-wrap">${empty("За выбранный период финансовых данных пока нет")}</div>`;
    }
    const byRoom = new Map();
    bookings.forEach((booking) => {
      const title = roomTitle(booking.unit_id);
      byRoom.set(title, (byRoom.get(title) || 0) + Number(booking.total_amount || 0));
    });
    const tones = ["purple", "green", "yellow"];
    return `
      <div class="income-donut-wrap">
        <div class="income-donut"><span>${moneyCompact(total)}</span><small>Всего</small></div>
        <div class="income-legend">
          ${Array.from(byRoom.entries()).slice(0, 3).map(([label, amount], index) => legendItem(label, `${moneyCompact(amount)} (${Math.round((amount / total) * 100)}%)`, tones[index] || "purple")).join("")}
        </div>
      </div>
    `;
  }

  function latestMessagesPreview() {
    const items = sortLatest(workspace.messages).slice(0, 3);
    if (!items.length) {
      return `<div class="dashboard-empty-action"><div class="empty-state">Пока нет сообщений</div><button class="secondary-btn" type="button" data-open-support>Открыть чат поддержки</button></div>`;
    }
    return items.map((message) => dashboardMessage(senderRoleLabel(message.sender_role), message.text, relativeTime(message.createdAt), message.read_at ? "" : "•", message.sender_role === "admin" ? "support" : "")).join("");
  }

  function latestReviewsPreview() {
    const items = sortLatest(workspace.reviews).slice(0, 3);
    if (!items.length) return `<div class="dashboard-empty-action"><div class="empty-state">Пока нет отзывов</div></div>`;
    return items.map((review) => dashboardMessage(review.customer_name || "Гость", `${"★".repeat(Math.max(1, Math.round(Number(review.rating || 0))))} ${review.text || review.comment || ""}`, relativeTime(review.createdAt), "", "")).join("");
  }

  function dateRangeLabel(booking) {
    return [booking.start_date, booking.end_date].filter(Boolean).join(" - ") || "Даты не указаны";
  }

  function guestDetailsText(booking = {}) {
    const guests = Array.isArray(booking.guests_details) ? booking.guests_details : booking.wishes?.guests_details || [];
    if (!guests.length) return `${booking.guests_count || 1} гостей`;
    return guests.map((guest, index) => {
      const parts = [guest.fullName, guest.birthDate, guest.passportNumber, guest.citizenship].filter(Boolean);
      return `${index + 1}. ${parts.join(" · ") || "данные не указаны"}`;
    }).join("; ");
  }

  function relativeTime(value) {
    const date = new Date(value || "");
    if (Number.isNaN(date.getTime())) return "";
    const diff = Date.now() - date.getTime();
    const minutes = Math.max(1, Math.round(diff / 60000));
    if (minutes < 60) return `${minutes} мин назад`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} ч назад`;
    return formatDate(value);
  }

  function moneyCompact(value) {
    const amount = convertFromVnd(Number(value || 0), partnerCurrency);
    if (partnerCurrency === "USD") return `$${Math.round(amount).toLocaleString("en-US")}`;
    return `${Math.round(amount).toLocaleString("ru-RU")} ${partnerCurrency === "VND" ? "₫" : partnerCurrency}`;
  }

  function convertFromVnd(value, currency) {
    const rates = window.ANIMA_DB?.getState(seedData)?.settings?.currencyRates || {};
    if (currency === "VND") return value;
    return value / Number(rates[currency] || 1);
  }

  function initials(value = "") {
    const parts = String(value || "AN").trim().split(/\s+/).filter(Boolean);
    return (parts[0]?.[0] || "A") + (parts[1]?.[0] || "");
  }

  function profileInitials() {
    return initials(workspace.partner.contact_name || workspace.partner.business_name || "ANIMA");
  }

  function status(value = "") {
    const label = bookingLabels[value] || paymentLabels[value] || payoutLabels[value] || availabilityLabel(value) || partnerStatusLabel(value) || value || "не указано";
    return `<span class="status-pill status-${escapeAttribute(value)}">${escapeHtml(label)}</span>`;
  }

  function detail(label, value) {
    return `<div class="detail-item"><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value || "не указано"))}</strong></div>`;
  }

  function helpItem(label, value) {
    return `<div class="detail-item"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
  }

  function empty(text) {
    return `<div class="empty-state">${escapeHtml(text)}</div>`;
  }

  function propertyTitle(propertyId) {
    return workspace.properties.find((item) => item.id === propertyId)?.title || "Объект ANIMA";
  }

  function partnerFilesToDataUrls(files = []) {
    return Promise.all((files || []).filter((file) => file instanceof File && file.size).map((file) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    })));
  }

  function roomTitle(roomId) {
    return workspace.units.find((item) => item.id === roomId)?.name || "Категория номера";
  }

  function propertyTypeLabel(value = "") {
    return {
      hotel: "Отель",
      villa: "Вилла",
      house: "Дом",
      apartment: "Апартамент",
      other: "Другое жильё",
      cafe: "Кафе",
    }[value] || value || "Объект";
  }

  function bookedCount(roomId, date) {
    return workspace.bookings.reduce((sum, booking) => {
      if (booking.unit_id !== roomId) return sum;
      if (!["confirmed", "waiting_payment", "paid", "active", "checked_in", "completed", "funds_available", "payout_requested"].includes(booking.booking_status)) return sum;
      const start = new Date(`${booking.start_date}T00:00:00`).getTime();
      const end = new Date(`${booking.end_date}T00:00:00`).getTime();
      const day = new Date(`${date}T00:00:00`).getTime();
      return day >= start && day < end ? sum + Number(booking.units_count || 1) : sum;
    }, 0);
  }

  function topbarTitle(id) {
    return {
      dashboard: "Главная",
      properties: "Мои объекты",
      bookings: "Брони",
      rooms: "Комнаты",
      requests: "Заявки",
      confirmed: "Подтверждённые брони",
      calendar: "Календарь",
      finance: "Финансы",
      withdrawals: "Вывод средств",
      messages: "Сообщения",
      "admin-chat": "Чат с ANIMA",
      notifications: "Уведомления",
      settings: "Настройки",
      documents: "Документы",
      help: "Помощь",
    }[id] || "Кабинет";
  }

  function topbarKicker(id) {
    return {
      dashboard: "Операционный обзор",
      properties: "Данные и модерация",
      bookings: "Подтверждение клиентов",
      rooms: "Категории номеров и цены",
      requests: "Новые заявки клиентов",
      confirmed: "Операционные брони",
      calendar: "Доступность и цены",
      finance: "Оборот, комиссия и выплаты",
      withdrawals: "Баланс и заявки на выплату",
      messages: "Комментарии по броням",
      "admin-chat": "Внутренняя коммуникация",
      notifications: "События системы",
      settings: "Профиль партнёра",
      documents: "Договорённости и правила",
      help: "Правила работы",
    }[id] || "ANIMA";
  }

  function businessTypeLabel(value) {
    return { hotel: "Отель", apartment: "Апартаменты", cafe: "Кафе", tour: "Тур", other: "Бизнес" }[value] || value;
  }

  function partnerStatusLabel(value) {
    return { active: "Активна", pending: "На проверке", pending_review: "На модерации", blocked: "Заблокирована", draft: "Черновик", hidden: "Скрыта", moderation: "На модерации", approved: "Одобрено", rejected: "Отклонено", archived: "Архив", paid: "Выплачено", new: "Новый", in_progress: "В работе", closed: "Закрыт" }[value] || "";
  }

  function availabilityLabel(value) {
    return { available: "Свободно", occupied: "Занято", pending: "Ожидает подтверждения", closed: "Закрыто владельцем", admin_closed: "Закрыто ANIMA", technical: "Технически недоступно" }[value] || "";
  }

  function roomTypeLabel(value) {
    return { standard: "Стандарт", deluxe: "Делюкс", villa: "Вилла", apartment: "Апартаменты", bungalow: "Бунгало", suite: "Люкс", Hotels: "Отель" }[value] || value || "Стандарт";
  }

  function senderRoleLabel(value) {
    return { partner: "Отель", client: "Клиент", admin: "ANIMA", system: "Система" }[value] || value || "Сообщение";
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

  function staffRoleLabel(value = "") {
    return {
      partner_owner: "Владелец",
      partner_staff: "Сотрудник",
      manager: "Менеджер",
      finance: "Финансы",
    }[value] || value || "Сотрудник";
  }

  function staffPermissionLabel(value = "") {
    return {
      bookings: "Брони",
      calendar: "Календарь",
      messages: "Сообщения",
      rooms: "Комнаты",
      finance: "Финансы",
    }[value] || value;
  }

  function wishesText(wishes = {}) {
    const labels = [
      ["early_checkin", "ранний заезд"],
      ["late_checkout", "поздний выезд"],
      ["transfer", "трансфер"],
      ["room_decoration", "украшение номера"],
      ["window_view", "вид из окна"],
      ["pets", "животные"],
      ["children", "дети"],
    ];
    return [...labels.filter(([key]) => wishes[key]).map(([, label]) => label), wishes.floor ? `этаж: ${wishes.floor}` : "", wishes.comment || ""].filter(Boolean).join(", ") || "без пожеланий";
  }

  function money(value) {
    return `${Math.round(Number(value || 0)).toLocaleString("ru-RU")} VND`;
  }

  function formatDate(value) {
    if (!value) return "не указано";
    return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "short" }).format(new Date(value));
  }

  function normalize(value = "") {
    return String(value).toLocaleLowerCase("ru-RU").normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  }

  function humanError(error) {
    const code = error?.message || "";
    return {
      DATE_ALREADY_BOOKED: "На эти даты уже есть подтверждённая бронь.",
      DATE_HAS_CONFIRMED_BOOKING: "Нельзя открыть или закрыть дату поверх подтверждённой брони.",
      PRICE_NEGATIVE: "Цена не может быть отрицательной.",
      REJECTION_REASON_REQUIRED: "Нужно выбрать причину отказа.",
      PROPERTY_TITLE_REQUIRED: "Нельзя сохранить объект без названия.",
      ROOM_NAME_REQUIRED: "Нельзя сохранить комнату без названия.",
      WITHDRAWAL_AMOUNT_REQUIRED: "Введите сумму вывода.",
      WITHDRAWAL_AMOUNT_TOO_HIGH: "Сумма вывода больше доступного баланса.",
    }[code] || "Не удалось выполнить действие. Проверьте данные и попробуйте ещё раз.";
  }

  function escapeHtml(value = "") {
    return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
  }

  function escapeAttribute(value = "") {
    return escapeHtml(value);
  }
})();
