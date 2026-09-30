(() => {
  'use strict';

  const form = document.querySelector('[data-simple-booking]');
  const app = window.ANIMA;
  if (!form || !app || !window.AnimaSite) return;

  const select = form.querySelector('[data-service-select]');
  const status = form.querySelector('[data-booking-status]');
  const success = document.querySelector('[data-booking-success]');
  const price = document.querySelector('[data-booking-price]');
  const requested = new URLSearchParams(window.location.search).get('service') || new URLSearchParams(window.location.search).get('ritual');
  const requestKey = 'anima.website.bookingRequests.v4';
  const optionPrice = (service) => service.price === null ? service.priceLabel : `${service.pricePrefix || ''}€${service.price}${service.priceSuffix ? ` ${service.priceSuffix}` : ''}`;

  select.innerHTML = `<option value="">Выберите услугу</option>${app.services.map((service) => `<option value="${service.slug}">${service.name} — ${optionPrice(service)}</option>`).join('')}`;
  if (requested) {
    const aliases = { massage: 'massage-60', venik: 'banya-ceremony', tea: 'tea-ceremony', 'banya-ceremony': 'banya-ceremony' };
    select.value = app.services.some((service) => service.slug === requested) ? requested : (aliases[requested] || '');
  }
  price.innerHTML = `<span>${app.experienceConfig.name}</span><strong>€${app.experienceConfig.priceEUR} / ${app.experienceConfig.accessLabel}</strong>`;
  const date = form.querySelector('[name="date"]');
  date.min = new Date().toISOString().slice(0, 10);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const contact = String(data.phone || data.email || '').trim();
    if (!form.reportValidity()) return;
    if (!contact) {
      status.textContent = 'Укажите телефон или email.';
      status.dataset.state = 'error';
      return;
    }
    const button = form.querySelector('[type="submit"]');
    button.disabled = true;
    button.textContent = 'Отправляем…';
    const service = app.services.find((item) => item.slug === data.service);
    const request = { ...data, serviceName: service?.name || data.service, id: `ANIMA-${Date.now().toString(36).toUpperCase()}`, createdAt: new Date().toISOString(), status: 'request_received' };
    const requests = window.AnimaSite.storage.get(requestKey, []);
    const saved = window.AnimaSite.storage.set(requestKey, [...requests, request]);
    if (!saved) {
      button.disabled = false;
      button.textContent = 'Отправить запрос';
      status.textContent = 'Не удалось сохранить запрос. Напишите на hello@anima.ceo.';
      status.dataset.state = 'error';
      return;
    }
    form.hidden = true;
    success.hidden = false;
    success.querySelector('[data-request-id]').textContent = request.id;
    success.focus();
    window.AnimaSite.emit('booking_request_submitted', { service: data.service });
  });
})();
