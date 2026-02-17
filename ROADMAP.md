# PROJECT ROADMAP

## Phase 0 — Foundation
Status: REQUIRED

- Finalize project name
- Lock text-only scope
- Define message expiration rules
- Select map provider (Mapbox)
- Select backend stack (Custom Node.js)
- Define UI color system (purple & white)

Deliverables:
- Manifest finalized
- Tech stack locked
- Repository initialized

---

## Phase 1 — Core MVP (Text Map Chat)
Status: COMPLETED (Mapbox Migration Done)

### Map Experience
- [x] Fullscreen interactive map (Mapbox GL JS)
- [x] Auto-center on user location at launch (FlyTo Animation)
- [x] Smooth pan & zoom
- [x] Marker clustering for dense areas

### Message Input (Key Feature)
- [x] Persistent input bar fixed at bottom of screen
- [x] Chat-style design similar to WhatsApp / Messenger
- [x] Always visible on main map screen
- [x] One-tap text input
- [x] Send button with instant feedback

### Input Bar Behavior
- [x] On input focus:
  - Map automatically recenters to user’s current location
- [x] Message is posted at live GPS coordinates
- [x] Keyboard interaction does not break layout

### Message Display
- [x] Text markers rendered at message coordinates
- [x] Marker style optimized for readability
- [x] Tap marker → expanded text view (Glassmorphism UI)
- [x] Radius-based message loading

### Backend
- [x] Geo-indexed text message storage (PostGIS/Supabase)
- [x] Real-time message updates
- [x] Radius-based querying
- [x] Automatic expiration cleanup

Deliverables:
- Fully usable map + text posting loop
- Stable real-time message rendering

---

## Phase 1.5 — Database Architecture
Status: COMPLETED

- [x] Migrate from in-memory store to Postgres (Supabase)
- [x] Implement Prisma ORM
- [x] User identity persistence (NextAuth + Prisma Adapter)
- [x] Message persistence and voting logic

Deliverables:
- Persistent data across restarts
- Type-safe database interactions

---

## Phase 2 — UX Refinement & Mobile Polish
Status: IN PROGRESS

- [x] Smooth animations for markers (Framer Motion)
- [x] "My Location" button with intelligent re-centering
- [x] Message Details: Pointer attachment and compact comments
- [ ] Subtle haptic feedback on send
- [ ] Loading & empty-state handling refinement

### Mobile Specifics
- [x] Native Share Sheet integration (Instagram Stories, WhatsApp)
- [x] Capacitor Keyboard handling
- [ ] Push Notifications for near-by posts
- [ ] Deep linking support

Deliverables:
- Polished and intuitive UX
- Native-feeling mobile experience

---

## Phase 3 — Performance & Responsiveness
Status: PLANNED

- [ ] Marker virtualization (for 1000+ nodes)
- [ ] Viewport-based loading optimization
- [ ] Efficient redraw on map movement
- [ ] Responsive layout across:
  - Small phones
  - Large phones
  - Tablets

Deliverables:
- Consistent performance in dense areas
- Fully responsive UI

---

## Phase 4 — Safety & Control
Status: PLANNED

- [ ] Report message option
- [ ] Rate limiting per user
- [ ] Spam detection
- [ ] Basic abuse prevention
- [ ] Shadow banning capability

Deliverables:
- Safe anonymous environment

---

## Phase 5 — Visual Polish
Status: CONTINUOUS

- [x] Refined purple/white theme (Dark Mode default)
- [x] Glassmorphism overlays
- [ ] Custom marker styles (Animated variations)
- [ ] Micro-animations for interactions
- [ ] Typography tuning (Inter/Geist fonts)

Deliverables:
- Visually distinctive product
- Strong brand feel

---

## Phase 6 — Future Expansion (Out of MVP Scope)
Status: FUTURE

- [ ] Time filters
- [ ] Heatmaps
- [ ] Event mode
- [ ] AR view
- [ ] Media support (if ever needed)

Deliverables:
- Scalable feature roadmap
