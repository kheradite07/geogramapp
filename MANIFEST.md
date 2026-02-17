# PROJECT MANIFEST
## Project Name
GeoPulse (working title)

## Core Vision
A minimal, map-first, text-based location chat application where users can instantly share short messages tied to their real-world position.

The map is the interface.
Text is the content.
Location is the context.

## Problem Statement
People lack a fast and simple way to communicate what is happening *right now* at a specific physical location without complex feeds, profiles, or media noise.

## Solution
A fullscreen world map application with a persistent chat-style input bar that allows users to instantly post text messages bound to their current geographic position.

Messages appear on the map at the exact location they were sent from.

## Core Principles
- Map-first experience
- Text-only communication (no media)
- Minimal UI with maximum clarity
- Instant posting with zero friction
- Hyperlocal relevance
- Time-decaying content
- Fully responsive layout

## Primary Interaction Model
- User opens the app → Map loads fullscreen
- User sees nearby text posts on the map
- A persistent input bar is visible at the bottom of the screen
- User types a message and sends it instantly
- Message is posted at the user’s current location
- When the input bar is focused, the map automatically recenters to the user’s live location

## UI / UX Philosophy
- Minimalist design
- Clean typography
- No visual clutter
- High readability
- Smooth transitions
- Touch-friendly and thumb-friendly
- Fully responsive across screen sizes

## Color System
- **Deep Purple** (Backgrounds/Dark Mode): `#10002b`, `#240046`
- **Primary Purple** (Brand/Buttons): `#3c096c`, `#5a189a`, `#7b2cbf`
- **Light Purple** (Accents/Highlights): `#9d4edd`, `#c77dff`, `#e0aaff`
- **Neutral**: White `#ffffff` for text on dark backgrounds.

## Supported Content Types
- Text only
- Emoji allowed
- No images
- No video
- No links preview (plain text only)

## User Identity
## User Identity
- Authenticated via Google or Apple
- Public profiles available
- Users have a display name and avatar
- Messages are linked to user profiles

## Content Behavior
- Messages are tied to geographic coordinates
- Messages are visible within a defined radius
- Messages expire automatically

## Message Lifespan
- Default expiration: 24 hours
- Auto-removal required
- No manual delete needed in MVP

## Non-Goals
- No media sharing
- No global feed
- No long-term message history
- No global feed
- No long-term message history
- No social graph

## Success Metrics
- Time to first message < 20 seconds
- Messages sent per active user
- Map interaction frequency
- Retention in dense locations

## Technical Constraints
- Mobile-first
- Real-time updates
- Efficient geo-querying
- Low-latency posting
- GDPR-compliant data handling

## Tech Stack
- **Modules:** Next.js (App Router), React, TypeScript.
- **Bundler:** Turbopack (Dev), Webpack (Prod).
- **Map Provider:** Mapbox GL JS (via react-map-gl).
- **Backend:** Custom Node.js (Next.js API Routes).
- **Database:** PostgreSQL (Supabase).
- **ORM:** Prisma (Type-safe database access).
- **Styling:** Tailwind CSS (or custom CSS modules as per preference).

## Project Structure
- `src/app`: Next.js App Router pages and layouts.
- `src/components`: Reusable UI components (Map, Input, etc.).
- `src/lib`: Utilities, helper functions, and API clients.
- `src/hooks`: Custom React hooks (e.g., `useLocation`, `useMessages`).
- `src/styles`: Global styles and CSS variables.
- `src/types`: TypeScript type definitions and interfaces.
- `public`: Static assets (images, icons).

## Deployment & Infrastructure

### Database (Supabase + Prisma)
- **Provider:** PostgreSQL (Supabase)
- **Connection Pooling:** We use Supabase Transaction Pooler (Port 6543) for serverless compatibility.
- **Critical Configuration:**
    - `DATABASE_URL` (in Vercel/Env) **MUST** end with `?pgbouncer=true`.
    - `DIRECT_URL` (in Vercel/Env) points to Session Pooler (Port 5432) for migrations.
    - **Why?** Vercel Serverless functions exhaust connections quickly. The transaction pooler manages this but requires `?pgbouncer=true` to support prepared statements properly with Prisma.

### Mobile Build (Capacitor)
- **Framework:** Capacitor (iOS & Android).
- **Build Command:** `npm run mobile:build`
    - **Note:** This script temporarily hides `src/app/api` to allow `next build` (Static Export) to succeed, as API routes are not supported in static exports.
- **Routing:** All mobile routes must use **Query Parameters** (e.g., `/profile?id=123`) instead of Dynamic Routes (`/profile/123`), as dynamic routes require server-side generation which is unavailable in static export.
- **Authentication:** Mobile requests explicitly include `credentials: 'include'` to share session cookies with the backend.

## Known Issues & Best Practices

### Mapbox Marker Animations ("Flying Dots")
**Problem:** Markers (dots/bubbles) appear to "fly" from the top-left corner (0,0) or incorrect positions when they are first added to the map.
**Cause:** Global CSS transitions targeting `.mapboxgl-marker` (e.g., in `globals.css`) cause the initial position assignment to be animated.
**Solution:** 
- **DO NOT** apply global transitions to `.mapboxgl-marker`. 
- Use specific classes for hover effects (e.g., `transition-transform` on an inner div).
- Ensure new markers are added with stable keys to prevent React from reusing DOM elements for distant locations.

## Engineering & UX Standards (Established Rules)

### 1. Map Interaction Rules
- **Initialization:** The map **MUST** always start with a "FlyTo" animation from a zoomed-out world view to the user's current location.
- **State Restoration:** Do **NOT** restore the previous map center from local storage on app load. Always prioritize the user's *current* real-world context.
- **Focus Logic:** Tapping "My Location" or the input bar must center the map on the user. If a message detail window is open, it should be closed, and the map padding reset before centering.
- **Marker Alignment:** All map markers (bubbles, message details, share cards) utilizing a "tail" or "triangle" pointer **MUST** have the tip of that pointer aligned **exactly** with the geographic coordinates of the post. Visual gaps or offsets are unacceptable.

### 2. UI/UX Design System
- **Glassmorphism:** Use `backdrop-blur-3xl` and semi-transparent backgrounds (e.g., `bg-[#051a0d]/95`) for all overlays to maintain context with the map.
- **Message Details Window:**
    - **Pointer:** The triangular pointer must be visually "attached" to the window with zero gap. Use `padding-bottom` on the container to include the pointer in the element's flow.
    - **Comments:** Must use a compact, single-line layout (Instagram style). Avatar, name, message, and time must be inline and vertically centered.
    - **Typography:** Use strict text overflow rules (`break-all`, `whitespace-normal`) to prevent layout breakage from long words.
    - **Scrollbars:** Always hide scrollbars (`scrollbar-width: none`) in overlay lists for a cleaner look.

### 3. Mobile & Native Handling
- **Sharing:**
    - Detect the platform using `Capacitor.isNativePlatform()`.
    - On Android/iOS, prioritize **Native Instagram Stories** and **WhatsApp** sharing via intent plugins.
    - Generate images internally using `html-to-image` before passing to native share sheets.
- **Input Handling:**
    - Explicitly stop propagation (`e.stopPropagation()`) on all interactive inputs overlaid on the map to prevent touch conflicts.
    - Restore native input events (`onClick`, `onFocus`) manually if the map library intercepts them.

### 4. Performance
- **Image Generation:** Pre-generate shareable images in the background when the menu opens to reduce perceived lag.
- **Mapbox Migration:** Use `react-map-gl` with Mapbox GL JS for superior performance over Google Maps. Use strict typing for all geo-interfaces.

