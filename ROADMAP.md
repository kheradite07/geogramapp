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
Status: CRITICAL

### Map Experience
- Fullscreen interactive map
- Auto-center on user location at launch
- Smooth pan & zoom
- Marker clustering for dense areas

### Message Input (Key Feature)
- Persistent input bar fixed at bottom of screen
- Chat-style design similar to WhatsApp / Messenger
- Always visible on main map screen
- One-tap text input
- Send button with instant feedback

### Input Bar Behavior
- On input focus:
  - Map automatically recenters to user’s current location
- Message is posted at live GPS coordinates
- Keyboard interaction does not break layout

### Message Display
- Text markers rendered at message coordinates
- Marker style optimized for readability
- Tap marker → expanded text view
- Radius-based message loading

### Backend
- Geo-indexed text message storage
- Real-time message updates
- Radius-based querying
- Automatic expiration cleanup

Deliverables:
- Fully usable map + text posting loop
- Stable real-time message rendering

---

## Phase 2 — UX Refinement
Status: HIGH PRIORITY

- Smooth animations for markers
- Subtle haptic feedback on send
- Input bar micro-interactions
- Keyboard-safe layout adjustments
- Loading & empty-state handling

Deliverables:
- Polished and intuitive UX
- Zero friction posting experience

---

## Phase 3 — Performance & Responsiveness
Status: REQUIRED

- Marker virtualization
- Viewport-based loading
- Efficient redraw on map movement
- Responsive layout across:
  - Small phones
  - Large phones
  - Tablets

Deliverables:
- Consistent performance in dense areas
- Fully responsive UI

---

## Phase 4 — Safety & Control
Status: REQUIRED

- Report message option
- Rate limiting per user
- Spam detection
- Basic abuse prevention
- Shadow banning capability

Deliverables:
- Safe anonymous environment

---

## Phase 5 — Visual Polish
Status: OPTIONAL BUT RECOMMENDED

- Refined purple/white theme
- Custom marker styles
- Light/Dark mode compatibility
- Micro-animations
- Typography tuning

Deliverables:
- Visually distinctive product
- Strong brand feel

---

## Phase 6 — Future Expansion (Out of MVP Scope)
Status: FUTURE

- Time filters
- Heatmaps
- Event mode
- AR view
- Media support (if ever needed)

Deliverables:
- Scalable feature roadmap
