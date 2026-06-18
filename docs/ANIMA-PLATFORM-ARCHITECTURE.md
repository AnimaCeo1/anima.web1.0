# ANIMA Platform Architecture

> Reference for Cursor and future development. **Rule:** add what is not there; improve existing sections only where needed — do not rebuild working areas.

## Project Overview

**ANIMA — Digital Nature Lifestyle Ecosystem.**

ANIMA is not just a place catalog or marketplace. The platform unites:

- Travel and exploration
- Accommodation (Stay)
- Restaurants and cafes (Food & Drink)
- Activities and experiences
- Community and social feed
- Jobs and opportunities
- Business and partner tools
- Marketplace (classifieds)
- Services
- Partner CRM (future)
- Rewards (ANIMA Points)
- Digital ecosystem hub

### Design Language

- Dark background, natural tones
- Glassmorphism (glass panels, soft borders)
- Smooth animations, rounded cards
- Mobile-first, responsive desktop
- Premium, minimal, calm UX

---

## Universal Section Pattern

Every ANIMA section should include:

| Element | Purpose |
|--------|---------|
| **Header** | Title, search, filter, notifications, profile |
| **Hero banner** | Image, description, recommendations, offers |
| **Categories** | Horizontal chip/filter list |
| **Search** | By name, category, tags, location |
| **Filters** | Price, rating, distance, category, availability |
| **Cards** | Photo, title, description, rating, category, CTA |
| **Detail page** | Gallery, description, map, reviews, contacts, actions |

Not all sections implement the full pattern in MVP — add missing pieces incrementally.

---

## Section Specifications

### STAY

**Types:** Hotel, Apartment, Villa, House, Hostel  
**Actions:** Book Now, Contact Host, Add to Favorites  
**Monetization:** Booking commission, premium placement  
**Future:** Availability calendar, instant booking, online payment

### FOOD & DRINK

**Actions:** View Menu, Get Directions, Call, Book Table  
**Monetization:** Venue promotion, ads, special offers

### ACTIVITIES (Experiences / Tours)

**Categories:** Waterfalls, Karting, Zipline, Hiking, Tours, Nature  
**Actions:** Book, Contact, Save  
**Monetization:** Commission, partner programs

### WELLNESS (future standalone)

**Categories:** Spa, Massage, Osteopathy, Yoga, Retreats  
**Actions:** Book Session, Contact

### TRANSPORT

**Categories:** Bike Rental, Moto Rental, Auto Rental (minimal MVP: Bike / Moto / Auto)  
**Actions:** Rent, Contact manager  
**Monetization:** Commission

### MARKETPLACE

User and partner classifieds (real estate, products, services, local goods).  
**Primary UI:** Feed → **Classifieds** tab (Ecosystem card links here).  
**Actions:** Publish listing, contact seller  
**Future:** Seller cabinet, cart, payments, delivery

### STORE

Official ANIMA shop (coffee, tea, honey, eco, lifestyle, gifts, merch).  
**Actions:** Add to Cart, Buy Now, Checkout  
**Future:** Full checkout and payment flow

### COMMUNITY

Social layer lives in **Feed**, not Ecosystem portal.  
**Primary UI:** Feed → **Forum** tab  
**Actions:** Create post, comment, follow  
**Future:** Premium community

### JOBS / OPPORTUNITIES

**Actions:** Apply, Contact employer  
**Monetization:** Paid job listings  
**Ecosystem card:** Opportunities → jobs screen

### EVENTS

**Primary UI:** Feed → **Events** tab; **Today** for daily city updates  
**Actions:** Register, Add to calendar  
**Future:** Ticket sales

### REWARDS

ANIMA Points, QR scan, history, redeem  
**Monetization:** Premium membership

### PROFILE

Personal info, favorites, bookings, orders, rewards, settings

### PARTNER CABINET (future)

Dashboard, listings, orders, customers, analytics, promotions, CRM  
**Current MVP:** `for-business` screen + `partner.html`

### ADMIN PANEL (future)

Full platform control: users, partners, listings, orders, reviews, rewards, analytics, CMS  
**Current MVP:** `adminanima/` (partial: dashboard, bookings, objects-partners, requests)

---

## Navigation Model

```
Home
├── Main sections (Stay, Eat, Experiences, Nature, Transport, Exchange, Services, Store)
├── Ecosystem quick cards (Jobs, Community→Feed, For Business, Digital Solutions)
└── Partners / Rewards

Center A button → Ecosystem Portal (no duplicate of home quick cards)
├── Marketplace → Feed / Classifieds
├── Digital Solutions → digital-solutions
├── Opportunities → jobs
├── Rewards → rewards
└── About ANIMA → about

Bottom nav
├── Home
├── Feed (Today | Events | Forum | Classifieds)
├── A → Ecosystem
├── Saved
└── Profile

Social / Socium → Feed only (Forum, Events, Classifieds, Today)
```

---

## Implementation Audit (current codebase)

| Spec section | Screen key | Status | Notes |
|-------------|------------|--------|-------|
| STAY | `stay` | **STAY** | Full UI: chips, listings, booking flow |
| FOOD | `eat` | **STAY** | Placeholder; screenConfig + chips ready |
| ACTIVITIES | `experiences` | **STAY** | Tours render when mock data present |
| NATURE | `nature` | **STAY** | Placeholder |
| TRANSPORT | `transport` | **STAY** | Minimal Bike/Moto/Auto |
| MARKETPLACE | `feed` (Classifieds), `marketplace` | **STAY** | Feed tab + standalone screen |
| STORE | `store` | **STAY** | Products + cart UI |
| COMMUNITY | `feed` (Forum) | **IMPROVED** | `community` routes to Feed/Forum |
| JOBS | `jobs` | **STAY** | Full render when data present |
| EVENTS | `feed` (Events, Today) | **STAY** | Feed tabs |
| REWARDS | `rewards` | **STAY** | Rewards center |
| PROFILE | `profile` | **STAY** | Settings, bookings, auth |
| PARTNER | `for-business`, `partner.html` | **STAY** | MVP partner entry |
| ECOSYSTEM | `ecosystem` | **STAY** | Central portal (A button) |
| ADMIN | `adminanima/` | **PARTIAL** | Not full spec panel |
| WELLNESS | — | **FUTURE** | Not implemented |
| PARTNER CABINET | — | **FUTURE** | Document only |
| SUPABASE / API | `services/database.js` | **PARTIAL** | Local JSON MVP |
| PAYMENTS | — | **FUTURE** | Document only |

### Key files

- `script.js` — `screenConfig`, renderers, navigation
- `index.html` — home layout, quick cards, bottom nav
- `mock-data.js` — feed, stays, jobs, experiences, partners, transport
- `locales/ru.json`, `locales/en.json` — i18n strings
- `www/` — synced web build (`node scripts/sync-web.js`)

---

## Development Principles

Before building a new section, define:

1. Who is the user?
2. What job does the section solve?
3. What actions are available?
4. How is it monetized?
5. What data lives in Supabase (future)?
6. What are planned follow-up releases?

Then implement incrementally: mobile UI → data layer → partner logic → admin → analytics.

---

## Future Work (do not build in MVP pass)

- Full Admin Panel per spec
- Partner Cabinet (CRM, analytics, promotions)
- Supabase schemas and real API
- Payment flows (store checkout, booking payments)
- Wellness standalone section
- Instant booking calendar
- Marketplace seller cabinet and delivery
