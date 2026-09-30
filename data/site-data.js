window.ANIMA = Object.freeze({
  config: {
    brandName: 'ANIMA', region: 'Costa Brava, Catalunya', address: null, coordinates: null,
    email: 'hello@anima.ceo', phone: null, instagram: null,
    languages: ['ru', 'es', 'en'], defaultLanguage: 'ru'
  },
  features: { booking: true, products: true, checkout: false, eventsCalendar: false, video: true },
  experienceConfig: {
    name: 'Вход в ANIMA', accessType: 'day', accessLabel: 'день', accessDuration: null, priceEUR: 30, scheduleStatus: 'proposed',
    futureSessionOptions: [
      { id: 'morning', label: 'Утро', time: '10:00–13:00', capacity: null, availability: 'request' },
      { id: 'afternoon', label: 'День', time: '14:00–17:00', capacity: null, availability: 'request' },
      { id: 'evening', label: 'Вечер', time: '18:00–21:00', capacity: null, availability: 'request' }
    ],
    included: [
      { key: 'heat', title: 'Баня', description: 'Доступ к традиционно прогретой парной.' },
      { key: 'cold', title: 'Холод', description: 'Купель или прохладный душ между заходами.' },
      { key: 'rest', title: 'Отдых', description: 'Терраса и спокойная зона восстановления.' },
      { key: 'tea', title: 'Чай и вода', description: 'Вода и базовый травяной чай.' },
      { key: 'nature', title: 'Природа', description: 'Время в природной среде ANIMA.' }
    ],
    targetConditions: { temperatureC: null, humidityPercent: null },
    operatingSchedule: {
      monday: 'private_or_maintenance', tuesday: 'private_or_maintenance',
      wednesday: '14:00–21:00', thursday: '14:00–21:00', friday: '10:00–21:00',
      saturday: '10:00–21:00', sunday: '10:00–21:00'
    }
  },
  navigation: [
    { key: 'services', href: '/banya/' }, { key: 'shop', href: '/products/' },
    { key: 'journal', href: '/journal/' }, { key: 'about', href: '/about/' },
    { key: 'contacts', href: '/contacts/' }
  ],
  ui: {
    ru: { services: 'Услуги', shop: 'Лавка', journal: 'Journal', about: 'О нас', contacts: 'Контакты', booking: 'Забронировать', menu: 'Открыть меню', closeMenu: 'Закрыть меню', location: 'Costa Brava · Catalunya · Spain', legal: 'Beta · Правовая информация готовится' },
    es: { services: 'Servicios', shop: 'Tienda', journal: 'Journal', about: 'Nosotros', contacts: 'Contacto', booking: 'Reservar', menu: 'Abrir menú', closeMenu: 'Cerrar menú', location: 'Costa Brava · Catalunya · España', legal: 'Beta · Información legal en preparación' },
    en: { services: 'Services', shop: 'Shop', journal: 'Journal', about: 'About', contacts: 'Contact', booking: 'Book', menu: 'Open menu', closeMenu: 'Close menu', location: 'Costa Brava · Catalunya · Spain', legal: 'Beta · Legal information in preparation' }
  },
  services: [
    { slug: 'entry', name: 'Вход в ANIMA', description: 'Парная, купель или холодный душ, территория отдыха, вода и базовый травяной чай.', price: 30, pricePrefix: '', priceSuffix: '/ день', primary: true },
    { slug: 'banya-ceremony', name: 'Банная церемония', description: 'Традиционное парение с веником, паром и ароматическими травами.', price: 30, pricePrefix: 'от ' },
    { slug: 'massage-30', name: 'Массаж · 30 мин', description: 'Короткая телесная практика после бани или отдельным визитом.', price: 35, pricePrefix: 'от ' },
    { slug: 'massage-60', name: 'Массаж · 60 мин', description: 'Полная спокойная сессия bodywork.', price: 60, pricePrefix: 'от ' },
    { slug: 'tea-ceremony', name: 'Чайная церемония', description: 'Травяной чай, тишина и внимательное завершение отдыха.', price: 15, pricePrefix: 'от ' },
    { slug: 'samovar', name: 'Самовар · мёд · пряники', description: 'Тёплая традиция для небольшой компании.', price: 15, pricePrefix: 'от ' },
    { slug: 'private', name: 'Private Banya', description: 'Приватный формат для своей компании.', price: null, priceLabel: 'по запросу' },
    { slug: 'program', name: 'Yoga · Breathwork · Events', description: 'Движение и специальные форматы только по опубликованной программе.', price: null, priceLabel: 'по программе' }
  ],
  rituals: [
    { slug: 'venik', name: 'Guided Venik Ritual', description: 'Работа веником и паром под вниманием банщика.', duration: null, price: null, availability: 'on_request', relatedArticle: '/journal/what-is-venik/' },
    { slug: 'banya-ceremony', name: 'Банная церемония', kind: 'featured', description: 'Полный путь через прогрев, парение, контраст, отдых и чай.', image: '/assets/anima/rituals/rituals-hero-v3.jpg', duration: null, price: null, availability: 'on_request', relatedArticle: '/journal/banya-cycle/' },
    { slug: 'massage', name: 'Массаж', description: 'Спокойная телесная практика после бани или как отдельный визит.', duration: null, price: null, availability: 'on_request', href: '/massage/', relatedArticle: '/journal/rest-and-recovery/' },
    { slug: 'tea', name: 'Tea after Heat', description: 'Самовар, травяной чай, мёд, сезонное угощение и тихий разговор.', duration: null, price: null, availability: 'on_request', relatedArticle: '/journal/tea-after-heat/' },
    { slug: 'private', name: 'Private Experience', description: 'Индивидуальный формат и ритм для небольшой компании.', duration: null, price: null, availability: 'on_request' },
    { slug: 'seasonal', name: 'Seasonal Ritual', description: 'Практика, связанная с растениями и временем года.', duration: null, price: null, availability: 'scheduled_only' }
  ],
  products: [
    { slug: 'mountain-honey', name: 'Натуральный мёд', category: 'Пчёлы', image: '/assets/anima/products/panels/honey.jpg', description: 'Сезонный мёд с прозрачным происхождением.', ingredients: 'Натуральный мёд', price: null, availability: 'Скоро', relatedArticles: ['/journal/how-honey-is-made/', '/journal/life-of-apiary/'] },
    { slug: 'bee-pollen', name: 'Пчелиная пыльца', category: 'Пчёлы', image: '/assets/anima/products/panels/bee-pollen.jpg', description: 'Сезонный продукт ответственного пчеловодства.', price: null, availability: 'Скоро', relatedArticles: ['/journal/life-of-apiary/'] },
    { slug: 'propolis', name: 'Прополис', category: 'Пчёлы', image: '/assets/anima/products/panels/propolis.jpg', description: 'Продукт улья с понятным происхождением и составом.', price: null, availability: 'Скоро', relatedArticles: ['/journal/life-of-apiary/'] },
    { slug: 'perga', name: 'Перга', category: 'Пчёлы', image: '/assets/anima/products/panels/perga.jpg', description: 'Пчелиный хлеб; происхождение и доступность будут подтверждены.', price: null, availability: 'Скоро', relatedArticles: ['/journal/life-of-apiary/'] },
    { slug: 'herbal-tea', name: 'Травяные чаи', category: 'Чай', image: '/assets/anima/products/panels/herbal-tea.jpg', description: 'Травяной сбор для спокойной паузы после жара.', price: null, availability: 'Скоро', relatedArticles: ['/journal/tea-after-heat/'] },
    { slug: 'gift-set', name: 'Подарочные боксы', category: 'Подарки', image: '/assets/anima/products/panels/gift-set.jpg', description: 'Концептуальные сочетания мёда, чая и предметов для бани. Составы будут подтверждены.', price: null, availability: 'Скоро', featured: true },
    { slug: 'anima-robe', name: 'ANIMA халат', category: 'Баня', image: '/assets/anima/products/panels/robe.jpg', description: 'Натуральный халат спокойного силуэта для бани и медленных утр.', materials: null, size: null, price: null, availability: 'Запросить информацию' },
    { slug: 'towels', name: 'Полотенца', category: 'Баня', image: '/assets/anima/products/panels/robe.jpg', description: 'Тактильный текстиль для бани и дома.', price: null, availability: 'Скоро' },
    { slug: 'beeswax-candle', name: 'Свечи из пчелиного воска', category: 'Пчёлы', image: '/assets/anima/products/panels/honey.jpg', description: 'Будущее направление предметов из воска с подтверждённым происхождением.', price: null, availability: 'Скоро' },
    { slug: 'venik', name: 'Веники', category: 'Баня', image: '/assets/anima/products/panels/venik.jpg', description: 'Веник для живого пара и традиционной церемонии.', price: null, availability: 'Запросить информацию', relatedArticles: ['/journal/what-is-venik/'] },
    { slug: 'banya-kit', name: 'Банный набор', category: 'Подарки', image: '/assets/anima/products/panels/banya-kit.jpg', description: 'Набор для продолжения ритуала дома.', price: null, availability: 'Скоро' },
    { slug: 'body-care', name: 'Натуральный уход', category: 'Уход', image: '/assets/anima/products/panels/body-care.jpg', description: 'Натуральный уход без неподтверждённых обещаний.', price: null, availability: 'Скоро' }
  ],
  events: [
    { slug: 'banya-club', title: 'Banya Club', category: 'Community', description: 'Общий банный ритм и знакомство с традицией.' },
    { slug: 'sunset-banya', title: 'Sunset Banya', category: 'Banya', description: 'Вечерняя сессия в мягком свете Costa Brava.' },
    { slug: 'tea-fire', title: 'Tea & Fire', category: 'Food & Tea', description: 'Самовар, огонь и неторопливый разговор.' },
    { slug: 'honey-tasting', title: 'Honey Tasting', category: 'Bees', description: 'Знакомство с сезонным мёдом и его происхождением.' },
    { slug: 'yoga-banya', title: 'Yoga + Banya', category: 'Movement', description: 'Движение, дыхание и банный цикл, когда формат появится в программе.' },
    { slug: 'recovery-sunday', title: 'Recovery Sunday', category: 'Recovery', description: 'Спокойный день тепла, движения и отдыха.' },
    { slug: 'seasonal-ritual', title: 'Seasonal Ritual', category: 'Rituals', description: 'Практика, связанная с сезоном и местными растениями.' },
    { slug: 'private-anima', title: 'Private ANIMA', category: 'Private', description: 'Камерный формат для своей компании.' }
  ],
  journalCategories: ['Баня', 'Пчёлы', 'Ритуалы', 'Восстановление', 'Природа'],
  editorialPipeline: [
    { category: 'Баня', topics: ['Славянская баня и финская сауна', 'Температура и влажность', 'Банная этика', 'Баня после спорта'] },
    { category: 'Ритуалы', topics: ['Работа банщика', 'Herbal steam', 'Контрастный ритуал', 'Самоварная традиция'] },
    { category: 'Тело и движение', topics: ['Mobility', 'Stretching', 'Breathwork', 'Сон и отдых'] },
    { category: 'Пчёлы', topics: ['Опыление', 'Catalan honey', 'Perga', 'Beeswax', 'Пчёлы и биоразнообразие'] },
    { category: 'Еда и чай', topics: ['Как хранить мёд', 'Как выбирать мёд', 'Сезонные травы'] }
  ],
  articles: [
    { slug: 'what-is-slavic-banya', title: 'Что такое славянская баня', category: 'Баня', excerpt: 'Чем живая работа с паром отличается от простого пребывания в горячем помещении.', heroImage: '/assets/anima/banya/banya-hero-v3.jpg', readingTime: '6 мин', sections: [{ label: 'Традиция', text: 'Славянская баня строится вокруг пара, воды, веника и человеческого внимания. Температура важна, но она не является единственной целью.' }, { label: 'Опыт', text: 'Гость проходит несколько коротких циклов: мягкий прогрев, охлаждение, вода и отдых. Дневной доступ не означает непрерывное нахождение в парной.' }, { label: 'Безопасность', text: 'Интенсивность выбирают по самочувствию. При дискомфорте нужно выйти из парной и отдохнуть.' }], relatedExperience: '/banya/' },
    { slug: 'banya-cycle', title: 'Что такое банный цикл', category: 'Баня', excerpt: 'Зачем чередовать тепло, охлаждение, воду и паузу.', heroImage: '/assets/anima/banya/03-cold.jpg', readingTime: '5 мин', sections: [{ label: 'Опыт', text: 'Один цикл состоит из короткого прогрева, выхода из жара, мягкого охлаждения, воды и отдыха.' }, { label: 'Практика', text: 'Повторение не обязано быть одинаковым: следующий заход может быть короче или мягче.' }, { label: 'Безопасность', text: 'Не оставайтесь в жаре непрерывно и не превращайте контраст в испытание.' }], relatedExperience: '/banya/' },
    { slug: 'first-banya', title: 'Первый раз в бане', category: 'Баня', excerpt: 'Что взять с собой и как пройти первый цикл без спешки.', heroImage: '/assets/anima/banya/01-parnaya.jpg', readingTime: '4 мин', sections: [{ label: 'До визита', text: 'Возьмите купальный костюм, удобные сандалии и личные средства, если они нужны. Полотенце и детали комплектации будут подтверждены при бронировании.' }, { label: 'Во время', text: 'Пейте воду, делайте паузы и сообщайте мастеру о своём самочувствии.' }, { label: 'Здоровье', text: 'При беременности, сердечно-сосудистых или серьёзных хронических состояниях и любых сомнениях заранее проконсультируйтесь с подходящим медицинским специалистом.' }], relatedExperience: '/banya/' },
    { slug: 'what-is-venik', title: 'Что такое веник', category: 'Ритуалы', excerpt: 'Лист, аромат и движение как инструменты банщика.', heroImage: '/assets/anima/banya/venik-steam-v2.jpg', readingTime: '5 мин', sections: [{ label: 'Традиция', text: 'Веник связывают из ветвей и используют для управления паром, аромата и тактильной работы.' }, { label: 'Опыт', text: 'Хороший ритуал не должен быть болезненным. Сила и темп подбираются в разговоре с гостем.' }], relatedExperience: '/rituals/', relatedProduct: '/products/venik/' },
    { slug: 'tea-after-heat', title: 'Tea after Heat', category: 'Еда и чай', excerpt: 'Почему чай после жара — это пауза, а не кафе-меню.', heroImage: '/assets/anima/products/ritual-still-life-v2.jpg', readingTime: '4 мин', sections: [{ label: 'Традиция', text: 'Самовар собирает людей вокруг общего ритма: налить чай, добавить немного мёда, помолчать или поговорить.' }, { label: 'ANIMA', text: 'Tea after Heat может объединить травяной чай, ANIMA Honey и небольшое сезонное угощение. Точный состав подтверждается вместе с визитом.' }], relatedExperience: '/rituals/', relatedProduct: '/products/herbal-tea/' },
    { slug: 'rest-and-recovery', title: 'Отдых как часть восстановления', category: 'Восстановление', excerpt: 'Пауза, дыхание и спокойное движение без медицинских обещаний.', heroImage: '/assets/anima/banya/05-rest.jpg', readingTime: '5 мин', sections: [{ label: 'Опыт', text: 'После тепла телу нужно время, вода и спокойный темп. Отдых является частью ритуала, а не ожиданием следующего этапа.' }, { label: 'Практика', text: 'Массаж, мягкая мобильность или дыхательная практика могут дополнять визит, когда они доступны в программе.' }, { label: 'Границы', text: 'ANIMA говорит о самочувствии и отдыхе, но не обещает лечение или гарантированный терапевтический результат.' }], relatedExperience: '/massage/' },
    { slug: 'how-honey-is-made', title: 'Как появляется мёд', category: 'Пчёлы', excerpt: 'От цветения и работы пчёл до сезонного продукта с понятным происхождением.', heroImage: '/assets/anima/products/panels/honey.jpg', readingTime: '6 мин', sections: [{ label: 'Улей', text: 'Пчёлы собирают нектар, перерабатывают его и уменьшают содержание влаги внутри сот.' }, { label: 'Сезонность', text: 'Вкус и аромат зависят от растений, погоды и времени сбора. Поэтому честный мёд не обязан быть одинаковым круглый год.' }, { label: 'ANIMA Eco Apiary', text: 'Собственная пасека остаётся направлением развития ANIMA. До её запуска продукты будут сопровождаться проверяемой информацией о происхождении.' }], relatedExperience: '/apiary/', relatedProduct: '/products/mountain-honey/' },
    { slug: 'life-of-apiary', title: 'Мёд и жизнь пасеки', category: 'Пчёлы', excerpt: 'Почему происхождение важнее громких обещаний на этикетке.', heroImage: '/assets/anima/products/panels/bee-pollen.jpg', readingTime: '5 мин', sections: [{ label: 'Ответственность', text: 'Пчеловодство начинается с состояния пчёл и местного ландшафта, а не с максимального объёма продукта.' }, { label: 'Доверие', text: 'ANIMA будет публиковать происхождение, сезон и доступность только после подтверждения этих данных.' }], relatedExperience: '/apiary/', relatedProduct: '/products/mountain-honey/' },
    { slug: 'costa-brava-light', title: 'Свет Costa Brava', category: 'Природа', excerpt: 'Сезонность, лес, камень и растения вокруг будущего места ANIMA.', heroImage: '/assets/anima/home/home-costa-brava-v3.jpg', readingTime: '4 мин', sections: [{ label: 'Место', text: 'Costa Brava задаёт ANIMA не декорацию, а ритм. Камень держит тепло дня, а деревья дают тень.' }, { label: 'Честность', text: 'Точные координаты пространства будут объявлены после подтверждения места.' }], relatedExperience: '/about/' }
  ],
  ecoPrinciples: ['Местное', 'Сезонное', 'Меньше отходов', 'Повторное использование', 'Прослеживаемость', 'Ответственный выбор', 'Биоразнообразие', 'Долговечные материалы']
});
