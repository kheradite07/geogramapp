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
- **Backend:** Custom Node.js (Express/Fastify).
- **Styling:** Tailwind CSS (or custom CSS modules as per preference).

## Project Structure
- `src/app`: Next.js App Router pages and layouts.
- `src/components`: Reusable UI components (Map, Input, etc.).
- `src/lib`: Utilities, helper functions, and API clients.
- `src/hooks`: Custom React hooks (e.g., `useLocation`, `useMessages`).
- `src/styles`: Global styles and CSS variables.
- `src/types`: TypeScript type definitions and interfaces.
- `public`: Static assets (images, icons).
