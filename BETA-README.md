# ANIMA Costa Brava beta

## Run

```bash
npm start
```

Open `http://localhost:8000/`. Run `npm run sync:web` before Capacitor work.

## Public architecture

- `/` discovery home
- `/about/`, `/banya/`, `/rituals/`, `/products/`, `/events/`, `/journal/`
- `/products/:slug/` product information (no checkout)
- `/journal/:slug/` reusable article view
- `/contacts/` validated contact request
- `/booking/` seven-state booking request flow, including success
- unknown routes render the branded `404.html`

`website.js` owns the shared header, footer, menu, language fallback, modal, reveals, transitions, tracking hooks and contact form state. `content-pages.js` renders centralized collections and detail views. `booking/booking.js` owns only booking state and validation.

## Content and configuration

`data/site-data.js` contains:

- site configuration and feature flags
- navigation and shell translations
- rituals, products, events and Journal articles

To add an item, add one object with a unique `slug` to the relevant array. Product and article detail routes resolve automatically. Keep unknown prices, dates, capacities, address and coordinates as `null` or omit them.

Exact location is configured in `ANIMA.config.address` and `coordinates`. Until confirmed, the UI deliberately shows Costa Brava, Catalunya without a map pin.

## Assets

Consumer photography lives in `assets/anima/<section>/`. Use semantic names and imagery from the same ANIMA property. Add dimensions and lazy loading to non-hero images. Hero images are preloaded only where needed.

## Booking and forms

Booking drafts use `sessionStorage` so Back keeps answers within the tab. A submitted beta request is stored locally under `anima.website.bookingRequests.v3` with status `request_received`; it is never described as confirmed. Contact requests use `anima.website.contactRequests.v2`.

To connect a backend, replace the final persistence call in `booking/booking.js` and the contact submission block in `website.js` with service adapters. Preserve the current loading, error and request-received states.

## Languages and analytics

RU is the beta default. Shell copy is centralized for RU/ES/EN; ES/EN currently use an explicit coming-soon fallback rather than a partial mixed-language page. Interaction hooks emit `anima:interaction` events such as `book_click`, `video_open`, `product_view`, `journal_open` and form submission events. No third-party analytics is installed.

## Legacy boundary

The old Dalat marketplace/app files remain isolated for Partner/Admin compatibility. Public pages do not import `script.js`, `styles.css`, `mock-data.js`, old store assets or Vietnam services.
