(() => {
  'use strict';

  const app = window.ANIMA;
  if (!app) return;

  const body = document.body;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const currentPath = window.location.pathname.replace(/index\.html$/, '');
  const storage = {
    get(key, fallback) {
      try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
    }
  };

  const emit = (name, detail = {}) => {
    window.dispatchEvent(new CustomEvent('anima:interaction', { detail: { name, ...detail } }));
  };
  const getLocale = () => {
    const saved = storage.get('anima.locale', app.config.defaultLanguage);
    return app.config.languages.includes(saved) ? saved : app.config.defaultLanguage;
  };
  let locale = getLocale();
  const copy = () => app.ui[locale] || app.ui[app.config.defaultLanguage];

  const renderShell = () => {
    const header = document.querySelector('[data-site-header]');
    const footer = document.querySelector('.site-footer');
    if (header) {
      const links = app.navigation.map((item) => `<a href="${item.href}" data-nav-key="${item.key}">${copy()[item.key]}</a>`).join('');
      header.innerHTML = `
        <a class="brand" href="/" aria-label="ANIMA Costa Brava">
          <img class="brand-tree-image" src="/assets/anima-tree.svg" alt="" aria-hidden="true">
          <span class="brand-lockup"><img src="/assets/anima-wordmark.png" alt="ANIMA"><small>Costa Brava</small></span>
        </a>
        <button class="menu-button" type="button" data-site-menu aria-label="${copy().menu}" aria-expanded="false"><span></span><span></span></button>
        <button class="menu-scrim" type="button" data-menu-close aria-label="${copy().closeMenu}" aria-hidden="true" tabindex="-1"></button>
        <nav class="site-nav" data-site-nav aria-label="Основная навигация">${links}<a class="mobile-nav-booking" href="/booking/">${copy().booking} →</a><div class="mobile-nav-languages" data-language-list></div></nav>
        <div class="header-actions"><div class="lang" data-language-list></div><a class="button button-small" href="/booking/" data-track="book_click">${copy().booking} →</a></div>`;
    }
    if (footer) {
      footer.innerHTML = `
        <a class="brand brand-footer" href="/" aria-label="ANIMA Costa Brava"><img class="brand-tree-image" src="/assets/anima-tree.svg" alt="" aria-hidden="true"><span class="brand-lockup"><img src="/assets/anima-wordmark.png" alt="ANIMA"><small>Costa Brava</small></span></a>
        <div class="footer-meta"><p>${copy().location}</p><span>${app.config.address || 'Точная локация будет объявлена позже'}</span><small>${copy().legal}</small></div>
        <nav aria-label="Навигация в подвале"><a href="/about/">${copy().about}</a><a href="/journal/">${copy().journal}</a><a href="/contacts/">${copy().contacts}</a><a href="/booking/">${copy().booking}</a></nav>`;
    }
    document.querySelectorAll('[data-language-list]').forEach((container) => {
      container.innerHTML = app.config.languages.map((language) => `<button type="button" data-language="${language}" class="${language === locale ? 'active' : ''}" aria-pressed="${language === locale}">${language.toUpperCase()}</button>`).join('');
    });
  };

  renderShell();

  const header = document.querySelector('[data-site-header]');
  const menuButton = document.querySelector('[data-site-menu]');
  const menuScrim = document.querySelector('[data-menu-close]');
  const nav = document.querySelector('[data-site-nav]');
  const headerActions = header?.querySelector('.header-actions');
  const toast = document.querySelector('[data-toast]');
  const modal = document.querySelector('[data-video-modal]');
  const mobileMenuQuery = window.matchMedia('(max-width: 1050px)');
  let lastFocused = null;
  let menuReturnFocus = null;

  const syncMenuAccessibility = () => {
    if (!nav) return;
    const hidden = mobileMenuQuery.matches && !body.classList.contains('menu-open');
    nav.toggleAttribute('inert', hidden);
    if (mobileMenuQuery.matches) nav.setAttribute('aria-hidden', String(hidden));
    else nav.removeAttribute('aria-hidden');
    const actionsHidden = mobileMenuQuery.matches && body.classList.contains('menu-open');
    headerActions?.toggleAttribute('inert', actionsHidden);
    if (actionsHidden) headerActions?.setAttribute('aria-hidden', 'true');
    else headerActions?.removeAttribute('aria-hidden');
  };

  const showToast = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove('is-visible'), 3600);
  };
  const closeMenu = () => {
    const wasOpen = body.classList.contains('menu-open');
    body.classList.remove('menu-open');
    menuButton?.setAttribute('aria-expanded', 'false');
    menuButton?.setAttribute('aria-label', copy().menu);
    syncMenuAccessibility();
    if (wasOpen && nav?.contains(document.activeElement)) menuReturnFocus?.focus();
  };

  menuButton?.addEventListener('click', () => {
    const open = body.classList.toggle('menu-open');
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? copy().closeMenu : copy().menu);
    syncMenuAccessibility();
    if (open) {
      menuReturnFocus = menuButton;
      requestAnimationFrame(() => nav?.querySelector('a')?.focus());
    }
  });
  syncMenuAccessibility();
  mobileMenuQuery.addEventListener('change', () => {
    if (!mobileMenuQuery.matches) closeMenu();
    syncMenuAccessibility();
  });
  menuScrim?.addEventListener('click', closeMenu);
  nav?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
    if (link.pathname === currentPath || (link.pathname !== '/' && currentPath.startsWith(link.pathname))) link.setAttribute('aria-current', 'page');
  });

  const updateHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 24);
  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  const focusable = (root) => [...root.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')].filter((item) => !item.hidden);
  const hideModal = () => {
    if (!modal || modal.hidden) return;
    modal.classList.remove('is-open');
    body.classList.remove('modal-open');
    window.setTimeout(() => {
      modal.hidden = true;
      lastFocused?.focus();
    }, reducedMotion ? 0 : 220);
  };
  document.querySelectorAll('[data-video-open]').forEach((button) => button.addEventListener('click', () => {
    if (!modal) return;
    lastFocused = document.activeElement;
    modal.hidden = false;
    body.classList.add('modal-open');
    emit('video_open');
    requestAnimationFrame(() => {
      modal.classList.add('is-open');
      focusable(modal)[0]?.focus();
    });
  }));
  modal?.querySelectorAll('[data-video-close]').forEach((button) => button.addEventListener('click', hideModal));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      hideModal();
      closeMenu();
    }
    if (event.key === 'Tab' && modal && !modal.hidden) {
      const items = focusable(modal);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    if (event.key === 'Tab' && body.classList.contains('menu-open') && nav) {
      const items = [...focusable(nav), menuButton].filter(Boolean);
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

  document.querySelectorAll('[data-language]').forEach((button) => {
    button.addEventListener('click', () => {
      const requested = button.dataset.language;
      if (requested === 'ru') return;
      storage.set('anima.locale', 'ru');
      showToast(requested === 'es' ? 'Versión completa en español: próximamente. Сейчас показана русская beta.' : 'Full English version is coming soon. Russian beta remains active.');
    });
  });

  document.querySelectorAll('[data-contact-form]').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const button = form.querySelector('button[type="submit"]');
      const status = form.querySelector('[data-form-status]');
      const data = Object.fromEntries(new FormData(form).entries());
      button.disabled = true;
      button.dataset.label = button.textContent;
      button.textContent = 'Отправляем…';
      form.setAttribute('aria-busy', 'true');
      window.setTimeout(() => {
        const requests = storage.get('anima.website.contactRequests.v2', []);
        const saved = storage.set('anima.website.contactRequests.v2', [...requests, { ...data, createdAt: new Date().toISOString(), status: 'request_received' }]);
        button.disabled = false;
        button.textContent = button.dataset.label;
        form.removeAttribute('aria-busy');
        if (!saved) {
          status.textContent = 'Не удалось сохранить запрос. Напишите на hello@anima.ceo.';
          status.dataset.state = 'error';
          return;
        }
        form.reset();
        status.textContent = 'Запрос получен. Это не автоматическое подтверждение: команда ANIMA свяжется с вами лично.';
        status.dataset.state = 'success';
        emit('contact_submit', { topic: data.topic });
      }, reducedMotion ? 0 : 450);
    });
  });

  document.querySelectorAll('[data-track]').forEach((element) => element.addEventListener('click', () => emit(element.dataset.track, { href: element.getAttribute('href') })));

  const revealTargets = document.querySelectorAll('[data-reveal], .home-world, .home-place > *, .home-sensory > *, .home-ecosystem > header, .ecosystem-grid > a, .home-community > div, .experience-section .experience-inner, .experience-next > *, .page-section > *, .booking-section > *, .article-layout > *, .site-footer > *');
  let previousScrollY = window.scrollY;
  let scrollDirection = 'down';
  let directionTicking = false;
  const updateScrollDirection = () => {
    if (directionTicking) return;
    directionTicking = true;
    requestAnimationFrame(() => {
      const nextScrollY = window.scrollY;
      if (Math.abs(nextScrollY - previousScrollY) > 4) {
        scrollDirection = nextScrollY > previousScrollY ? 'down' : 'up';
        body.dataset.scrollDirection = scrollDirection;
        previousScrollY = nextScrollY;
      }
      directionTicking = false;
    });
  };
  window.addEventListener('scroll', updateScrollDirection, { passive: true });
  body.dataset.scrollDirection = scrollDirection;
  if (reducedMotion || !('IntersectionObserver' in window)) {
    revealTargets.forEach((item) => item.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.toggle('reveal-from-top', scrollDirection === 'up');
          requestAnimationFrame(() => entry.target.classList.add('is-visible'));
          return;
        }
        const isFarOutside = entry.boundingClientRect.bottom < -100 || entry.boundingClientRect.top > window.innerHeight + 100;
        if (isFarOutside) {
          entry.target.classList.remove('is-visible');
          entry.target.classList.toggle('reveal-from-top', scrollDirection === 'up');
        }
      });
    }, { threshold: [0, 0.12], rootMargin: '6% 0px -6% 0px' });
    revealTargets.forEach((item) => { item.setAttribute('data-reveal', ''); observer.observe(item); });
  }

  requestAnimationFrame(() => document.documentElement.classList.add('is-ready'));
  const heroMedia = document.querySelector('.experience-hero-media');
  const homeHeroMedia = document.querySelector('.hero-photo');
  if ((heroMedia || homeHeroMedia) && !reducedMotion) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        heroMedia?.style.setProperty('--hero-shift', `${Math.min(window.scrollY * 0.04, 24)}px`);
        homeHeroMedia?.style.setProperty('--home-hero-shift', `${Math.min(window.scrollY * 0.035, 20)}px`);
        ticking = false;
      });
    }, { passive: true });
  }

  const transition = document.createElement('div');
  transition.className = 'route-transition';
  transition.setAttribute('aria-hidden', 'true');
  body.appendChild(transition);
  document.querySelectorAll('a[href]').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (reducedMotion || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.hash || link.target === '_blank' || url.pathname === currentPath) return;
      event.preventDefault();
      transition.classList.add('is-active');
      window.setTimeout(() => { window.location.href = url.href; }, 180);
    });
  });

  window.AnimaSite = { app, emit, showToast, storage };
})();
