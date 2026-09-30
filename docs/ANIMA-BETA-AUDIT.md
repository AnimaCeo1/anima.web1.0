# ANIMA consumer beta audit

## Classification

### Keep

- Approved ANIMA visual direction, generated Costa Brava property imagery and tree mark.
- Vanilla multi-page architecture and lightweight Node static server.
- Partner/Admin implementation and its existing data contracts.

### Refactor

- Public header, footer, navigation and language controls into the shared shell in `website.js`.
- Public content into `data/site-data.js`.
- Forms into explicit loading, error and request-received states.
- Product and Journal indexes into reusable renderers and detail templates.

### Replace

- One-screen booking form with validated step flow and persistent tab draft.
- Ambiguous product rows with full-card links and honest availability.
- Implied event program with a deliberate Coming Soon state.
- Raw static 404 response with branded error UI.

### Isolate

- `script.js`, `styles.css`, `mock-data.js`, legacy store/stay assets and Vietnam services.
- `adminanima/`, Partner and old app-shell behavior remain outside the consumer imports.

### Remove from public behavior

- Fake checkout, prices, event dates, exact address, map coordinates and automatic booking confirmation.
- External font dependency and unfinished language switching presented as complete.

## Target map

`/` → discovery → `/about/`, `/banya/`, `/rituals/`, `/products/`, `/events/`, `/journal/` → detail/interest routes → `/contacts/` or `/booking/`.

Shared public layers:

- `data/site-data.js`: config, flags and content models
- `website.js`: shell and global interactions
- `content-pages.js`: collection/detail rendering
- `booking/booking.js`: booking state machine
- `experience.css`: public design system and responsive components
- `server.js`: clean routes, redirects and branded 404

## Known production gaps

- Booking and contact requests are local beta persistence, not remote delivery.
- ES/EN full page content is not translated; the selector exposes a clear fallback.
- Product detail crops are only 204×341 and require high-resolution photography.
- Final video, exact location, opening date, prices, event dates, capacity and legal pages are not confirmed.
