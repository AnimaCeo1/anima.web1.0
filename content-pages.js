(() => {
  'use strict';

  const app = window.ANIMA;
  if (!app) return;
  const escape = (value) => String(value || '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
  const slug = () => window.location.pathname.split('/').filter(Boolean).pop();
  const setMeta = ({ title, description, image }) => {
    const ensure = (selector, tag, attributes) => {
      let node = document.head.querySelector(selector);
      if (!node) { node = document.createElement(tag); document.head.appendChild(node); }
      Object.entries(attributes).forEach(([name, value]) => node.setAttribute(name, value));
    };
    ensure('link[rel="canonical"]', 'link', { rel: 'canonical', href: `${window.location.origin}${window.location.pathname}` });
    ensure('meta[name="description"]', 'meta', { name: 'description', content: description });
    ensure('meta[property="og:title"]', 'meta', { property: 'og:title', content: title });
    ensure('meta[property="og:description"]', 'meta', { property: 'og:description', content: description });
    if (image) ensure('meta[property="og:image"]', 'meta', { property: 'og:image', content: image });
  };

  const experience = app.experienceConfig;
  const accessLabel = experience.accessType === 'day' ? `€${experience.priceEUR} / ${experience.accessLabel}` : `€${experience.priceEUR}`;
  document.querySelectorAll('[data-pass-summary]').forEach((node) => {
    node.innerHTML = `<span>${escape(experience.name)}</span><strong>${accessLabel}</strong><small>Рабочая beta-цена</small>`;
  });
  document.querySelectorAll('[data-included-list]').forEach((node) => {
    node.innerHTML = experience.included.map((item, index) => `<article><span>${String(index + 1).padStart(2, '0')}</span><h3>${escape(item.title)}</h3><p>${escape(item.description)}</p></article>`).join('');
  });
  document.querySelectorAll('[data-eco-principles]').forEach((node) => {
    node.innerHTML = app.ecoPrinciples.map((principle) => `<span>${escape(principle)}</span>`).join('');
  });

  const renderPrice = (service) => service.price === null ? service.priceLabel : `${service.pricePrefix || ''}€${service.price}${service.priceSuffix ? ` ${service.priceSuffix}` : ''}`;
  document.querySelectorAll('[data-services-list]').forEach((node) => {
    node.innerHTML = app.services.map((service) => `<a class="service-row" href="/booking/?service=${service.slug}"><div><h3>${escape(service.name)}</h3><p>${escape(service.description)}</p></div><strong>${escape(renderPrice(service))}</strong><span aria-hidden="true">→</span></a>`).join('');
  });
  document.querySelectorAll('[data-home-services]').forEach((node) => {
    const featuredServices = ['entry', 'banya-ceremony', 'massage-60', 'tea-ceremony', 'private']
      .map((serviceSlug) => app.services.find((service) => service.slug === serviceSlug))
      .filter(Boolean);
    node.innerHTML = featuredServices.map((service) => `<a class="home-price-row" href="/booking/?service=${service.slug}"><div><h3>${escape(service.name)}</h3><p>${escape(service.description)}</p></div><strong>${escape(renderPrice(service))}</strong><span aria-hidden="true">→</span></a>`).join('');
  });
  document.querySelectorAll('[data-home-products]').forEach((node) => {
    const featured = [app.products.find((item) => item.featured), ...app.products.filter((item) => !item.featured).slice(0, 3)].filter(Boolean);
    node.innerHTML = featured.map((product) => `<a href="/products/${product.slug}/"><img src="${product.image}" alt="${escape(product.name)}" loading="lazy" width="720" height="720"><span>${escape(product.category)}</span><h3>${escape(product.name)}</h3></a>`).join('');
  });
  document.querySelectorAll('[data-home-journal]').forEach((node) => {
    const featuredSlugs = ['what-is-slavic-banya', 'banya-cycle', 'how-honey-is-made', 'rest-and-recovery'];
    node.innerHTML = featuredSlugs.map((item) => app.articles.find((article) => article.slug === item)).filter(Boolean).map((article) => `<a href="/journal/${article.slug}/"><img src="${article.heroImage}" alt="" loading="lazy" width="900" height="620"><span>${escape(article.category)}</span><h3>${escape(article.title)}</h3></a>`).join('');
  });

  const products = document.querySelector('[data-products-list]');
  if (products) {
    const orderedProducts = [...app.products].sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
    products.innerHTML = orderedProducts.map((product, index) => `
      <a class="catalog-item" href="/products/${product.slug}/" data-track="product_view" data-reveal>
        <span>${String(index + 1).padStart(2, '0')} · ${escape(product.category)}</span>
        <img src="${product.image}" alt="${escape(product.name)}" loading="lazy" width="720" height="720">
        <div><h3>${escape(product.name)}</h3><p>${escape(product.description)}</p><b>${escape(product.availability)} →</b></div>
      </a>`).join('');
  }

  const rituals = document.querySelector('[data-rituals-list]');
  if (rituals) {
    rituals.innerHTML = app.rituals.map((ritual, index) => `
      <article class="story-step" data-reveal><span>${String(index + 1).padStart(2, '0')}</span><h3>${escape(ritual.name)}</h3><p>${escape(ritual.description)} <b class="availability-label">${ritual.availability === 'scheduled_only' ? 'Только по программе' : 'По запросу'}</b> <a class="inline-action" href="${ritual.href || `/booking/?ritual=${ritual.slug}`}" data-track="ritual_view">Подробнее →</a></p></article>`).join('');
  }

  const events = document.querySelector('[data-events-list]');
  if (events) {
    events.innerHTML = app.events.map((event, index) => `
      <article class="story-step" data-reveal><span>${String(index + 1).padStart(2, '0')}</span><h3>${escape(event.title)}</h3><p>${escape(event.description)} <b class="availability-label">Программа скоро</b></p></article>`).join('');
  }

  const journal = document.querySelector('[data-journal-list]');
  if (journal) {
    journal.innerHTML = app.articles.map((article) => `
      <a class="journal-card" href="/journal/${article.slug}/" data-track="journal_open" data-reveal>
        <img src="${article.heroImage}" alt="" loading="lazy" width="900" height="620">
        <span class="editorial-kicker">${escape(article.category)} · ${escape(article.readingTime)}</span>
        <h3>${escape(article.title)}</h3><p>${escape(article.excerpt)}</p><b>Читать →</b>
      </a>`).join('');
  }

  const categories = document.querySelector('[data-journal-categories]');
  if (categories) categories.innerHTML = app.journalCategories.map((category) => `<span>${escape(category)}</span>`).join('');
  const editorialPipeline = document.querySelector('[data-editorial-pipeline]');
  if (editorialPipeline) editorialPipeline.innerHTML = app.editorialPipeline.map((group) => `<article><span class="editorial-kicker">${escape(group.category)}</span><h3>${group.topics.map(escape).join('<br>')}</h3><p>В редакционном плане</p></article>`).join('');

  const productDetail = document.querySelector('[data-product-detail]');
  if (productDetail) {
    const product = app.products.find((item) => item.slug === slug());
    if (!product) {
      document.title = 'Продукт не найден — ANIMA';
      productDetail.innerHTML = '<div class="not-found-inline"><p class="eyebrow">404</p><h1>Продукт не найден</h1><p>Возможно, позиция была переименована или ещё не опубликована.</p><a class="button button-primary" href="/products/">К продуктам →</a></div>';
    } else {
      document.title = `${product.name} — ANIMA Costa Brava`;
      setMeta({ title: document.title, description: product.description, image: product.image });
      productDetail.innerHTML = `
        <figure><img src="${product.image}" alt="${escape(product.name)}" width="960" height="960"></figure>
        <div class="detail-copy"><p class="eyebrow">${escape(product.category)}</p><h1>${escape(product.name)}</h1><p class="detail-lede">${escape(product.description)}</p>
        <dl><div><dt>Доступность</dt><dd>${escape(product.availability)}</dd></div>${product.materials ? `<div><dt>Материалы</dt><dd>${escape(product.materials)}</dd></div>` : ''}${product.ingredients ? `<div><dt>Состав</dt><dd>${escape(product.ingredients)}</dd></div>` : ''}<div><dt>Стоимость</dt><dd>${product.price ? escape(product.price) : 'Будет подтверждена позже'}</dd></div></dl>
        <a class="button button-primary" href="/contacts/?topic=product&item=${product.slug}" data-track="product_interest">Узнать о продукте →</a><p class="request-note">Онлайн-покупка пока не запущена. Это запрос информации, не заказ.</p>
        ${product.relatedArticles?.length ? `<aside class="product-education"><p class="eyebrow">Узнать больше</p>${product.relatedArticles.map((href) => { const article = app.articles.find((item) => href.includes(`/${item.slug}/`)); return article ? `<a href="${href}">${escape(article.title)} →</a>` : ''; }).join('')}</aside>` : ''}</div>`;
    }
  }

  const articleDetail = document.querySelector('[data-article-detail]');
  if (articleDetail) {
    const article = app.articles.find((item) => item.slug === slug());
    if (!article) {
      document.title = 'Материал не найден — ANIMA';
      articleDetail.innerHTML = '<div class="not-found-inline"><p class="eyebrow">404</p><h1>Материал не найден</h1><p>Вернитесь в Journal, чтобы выбрать другую историю.</p><a class="button button-primary" href="/journal/">В Journal →</a></div>';
    } else {
      document.title = `${article.title} — ANIMA Journal`;
      setMeta({ title: document.title, description: article.excerpt, image: article.heroImage });
      articleDetail.innerHTML = `
        <header class="article-heading"><p class="eyebrow">${escape(article.category)} · ${escape(article.readingTime)}</p><h1>${escape(article.title)}</h1><p>${escape(article.excerpt)}</p></header>
        <figure class="article-hero"><img src="${article.heroImage}" alt="" width="1600" height="1000"></figure>
        <div class="article-body">${article.sections ? article.sections.map((section) => `<section><span class="editorial-kicker">${escape(section.label)}</span><p>${escape(section.text)}</p></section>`).join('') : (article.content || []).map((paragraph) => `<p>${escape(paragraph)}</p>`).join('')}</div>
        <aside class="related-links"><p class="eyebrow">Продолжить путь</p>${article.relatedExperience ? `<a href="${article.relatedExperience}">Связанный опыт →</a>` : ''}${article.relatedProduct ? `<a href="${article.relatedProduct}">Связанный продукт →</a>` : ''}<a href="/booking/" data-track="book_click">Запросить визит →</a></aside>`;
    }
  }
})();
