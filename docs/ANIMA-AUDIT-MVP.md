# ANIMA MVP Audit — Full Platform vs Current Codebase

> **Date:** 2026-06-19 · **Rule:** incremental improvement only — preserve dark green glass ANIMA aesthetic.

---

## Executive Summary

The ANIMA.CEO web app (`index.html`, `script.js`, `styles.css`, `mock-data.js`) is a **mobile-first super-app shell** with working navigation, glass UI, local JSON/Supabase-lite data (`services/database.js`), and partial admin (`adminanima/`). Most **core section renderers exist**; many are **placeholders or mock-driven**. This audit maps spec → code, assigns P0/P1/P2, and documents what was fixed in this pass vs deferred.

---

## Screen Map (Spec → Screen Key)

| Spec section | Screen key | Status | Notes |
|-------------|------------|--------|-------|
| **Home** | `home` (index.html) | **IMPROVED** | Hero, categories, ecosystem cards, partners row, need-today chips |
| **Navigation** | bottom-nav, `navigateTo` | **IMPROVED** | Compact scroll nav (`is-compact`), back-stack, Saved tab |
| **Explore** | `explore`, `map` | **IMPROVED** | Explore hub + category chips; map is lightweight placeholder |
| **Stay** | `stay`, `detail:*` | **STAY** | Listings, gallery grid, booking modal (no sticky bar) |
| **Eat** | `eat` | **PLACEHOLDER** | Clean section stub |
| **Tours / Experiences** | `experiences` | **STAY** | Renders when mock data present |
| **Nature** | `nature` | **PLACEHOLDER** | Clean section stub |
| **Transport** | `transport` | **STAY** | Bike / Moto / Auto minimal cards + detail |
| **Exchange** | `exchange` | **STAY** | Request form flow |
| **Services** | `services` | **STAY** | List when data present |
| **Store** | `store` | **STAY** | Products + cart UI; via Hub, not bottom nav |
| **Marketplace** | `feed` (Classifieds), `marketplace` | **STAY** | Feed tab primary; standalone screen exists |
| **Feed / Community** | `feed` | **STAY** | Today · Events · Forum · Classifieds |
| **Jobs** | `jobs` | **STAY** | Full render when data present |
| **Rewards** | `rewards` | **STAY** | Points center |
| **Saved** | `saved` | **STAY** | Bottom nav + empty state |
| **Profile** | `profile` | **STAY** | Settings, bookings link, auth |
| **Notifications** | `notifications` | **P1 STUB** | Center UI + mock list; real DB when authed |
| **Messenger** | `messages` | **P1 STUB** | Placeholder screen |
| **Ecosystem portal** | `ecosystem` | **STAY** | Deduped: Marketplace, Digital Solutions, Opportunities, Rewards, About |
| **Digital Solutions** | `digital-solutions`, `tech-solutions` | **STAY** | Same renderer |
| **Partner cabinet** | `for-business`, `partner.html` | **PARTIAL** | Entry + partner.js CRM shell |
| **Admin** | `adminanima/` | **PARTIAL** | Dashboard, bookings, objects, requests |
| **Supabase types** | — | **FUTURE** | Local JSON MVP only |
| **Payments / checkout** | — | **FUTURE** | Document only |
| **Real-time messenger** | — | **FUTURE** | Document only |
| **Wellness standalone** | — | **FUTURE** | Not in MVP |

---

## Current State vs Spec

### What works
- Dark glass design system, hero weather/time, i18n (EN/RU/VN)
- Bottom nav with center **A → Ecosystem** portal
- Feed tabs with compose (Forum) and classifieds gate
- Stay booking via modal; transport minimal detail
- Rewards, Store cart, Saved collection (localStorage)
- Notification popover for authenticated users (DB-backed)
- Admin partial panel for ops

### Placeholders / stubs
- Eat, Nature — clean section messages
- Map — static hub, no map engine
- Messenger — “coming soon” structure
- Notifications — mock list for guests + authed merge
- Partner CRM analytics, full admin rebuild

### Known duplicates (resolved)
| Duplicate | Resolution |
|-----------|------------|
| Home ecosystem cards vs Ecosystem portal | Portal = Marketplace, Rewards, About, Digital, Opportunities only |
| Trending section vs Feed Today | Trending removed from home (Feed owns daily content) |
| `community` screen | Routes to Feed / Forum |
| `marketplace` vs Feed Classifieds | Ecosystem card → Feed Classifieds |

### Navigation issues (addressed)
- `ROOT_NAV_TABS` includes `saved`; bottom nav **Saved** replaces Store (Store via Hub)
- Ecosystem opened from Feed preserves back target → Feed
- Compact bottom nav on scroll (`bottom-nav.is-compact`, commit `58b6ae5`)

### Dead CTAs (addressed)
- Transport “Book now” → scroll to listings
- Detail `href="#"` contact buttons → request modal
- Experience “View experience” → detail navigation

---

## Priority Matrix

### P0 — Shipped this pass
1. Home: need-today chips, partners row (label + IG/TG same line), spacing polish
2. Navigation: compact nav verified, back-stack + Saved tab
3. Ecosystem deduped portal
4. Stay: modal booking only, gallery grid
5. Transport: minimal Bike/Moto/Auto
6. Feed: clear tab labels (Today / Events / Forum / Classifieds)
7. Explore: header + category chips hub
8. Reusable `renderEmptyState()` for saved, bookings, feed
9. Remove/fix dead CTAs

### P1 — Light stubs this pass
- Notifications center screen (`notifications`) with mock items
- Messenger placeholder (`messages`)
- Explore enhanced header

### P2 — Document only (do not build now)
- Full Supabase migrations + generated types
- Real-time messenger + push
- Partner CRM analytics dashboard
- Complete admin panel rebuild
- Full checkout / payment integration
- Wellness standalone section
- Full map engine / geolocation backend

---

## Key Files

| File | Role |
|------|------|
| `script.js` | `screenConfig`, `render*`, `navigateTo`, empty states |
| `index.html` | Home layout, bottom nav, cache-bust query params |
| `styles.css` | Glass tokens, `--nav-clearance`, `.bottom-nav.is-compact` |
| `mock-data.js` | Seed feed, stays, jobs, partners, transport |
| `services/database.js` | Local persistence MVP |
| `adminanima/` | Partial admin |
| `www/` | Synced deploy bundle (`node scripts/sync-web.js`) |
| `docs/ANIMA-PLATFORM-ARCHITECTURE.md` | Long-form architecture reference |

---

## Testing Checklist (localhost:8000)

- [ ] Home scroll → bottom nav compacts then expands at rest
- [ ] Home need-today chips → correct sections
- [ ] Partners row: “Our Partners” + Instagram/Telegram on one line
- [ ] Feed → detail → back returns to Feed (not Home)
- [ ] Ecosystem → Marketplace → Feed Classifieds
- [ ] Stay detail → Book opens modal only (no sticky bar)
- [ ] Transport Bike/Moto/Auto tabs + minimal detail
- [ ] Saved / Bookings empty states render
- [ ] Bell → Notifications center (mock if guest)
- [ ] Profile → Messages placeholder

---

## Deploy

```bash
node scripts/sync-web.js   # copies to www/
# Bump ?v= cache keys in index.html when CSS/JS change
git add -A && git commit && git push origin main
```

Vercel serves static output from project root / `www/` per `vercel.json`.
