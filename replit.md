# TrophyVault

## Overview
TrophyVault is a virtual trophy room application for hunters. Users can track hunting achievements, manage weapons, customize trophy room aesthetics, and participate in community features.

## Recent Changes
- **2026-02-21**: Integrated user-designed logo into landing page and dashboard hero; created simplified SVG antler icon component
- **2026-02-18**: Redesigned Safari Manor to dark warm tones (thatch, khaki, leather, dark wood); fixed text readability across all themes
- **2026-02-18**: Profile page: added photo upload, Premium/Free badge, moved sharing toggle below name, locations below pursuit
- **2026-02-18**: Renamed themes: "Modern Lodge" → "Timber Ridge", "Classic Manor" → "Safari Manor"
- **2026-02-18**: Added Profile/Settings page with theme selection, hunting preferences, favourite locations, room sharing toggle
- **2026-02-18**: Added mobile bottom tab navigation for small screens
- **2026-02-18**: Reordered sidebar navigation (Dashboard first), removed "Start New Expedition" button
- **2026-02-18**: Added huntingLocations array field to user_preferences schema
- **2026-02-18**: Backend fully wired with PostgreSQL, Drizzle ORM, Replit Auth (OIDC)
- **2026-02-17**: Converted frontend from mock data to real API calls

## Architecture
- **Frontend**: React + Vite, Wouter routing, TanStack Query, Tailwind CSS, Framer Motion, shadcn/ui
- **Backend**: Express.js, Drizzle ORM, PostgreSQL (Neon-backed)
- **Auth**: Replit Auth via OpenID Connect (Passport.js)

## Key Pages
- `/` - Dashboard (hero + stats + featured trophies)
- `/trophies` - Trophy Room (grid view, search/filter, add new)
- `/trophies/:id` - Trophy Detail (image viewer, hunt details, WhatsApp share)
- `/safe` - The Safe (weapon management)
- `/community` - Community (leaderboards, rate rooms)
- `/profile` - Profile & Settings (theme, about, locations, sharing)
- `/onboarding` - First-time setup (theme + preferences + locations)

## API Routes
- `GET/POST /api/trophies`, `GET/PATCH/DELETE /api/trophies/:id`
- `GET/POST /api/weapons`, `GET/PATCH/DELETE /api/weapons/:id`
- `GET/PUT /api/preferences`
- `GET /api/stats`
- `GET /api/community/rooms`, `GET /api/community/room/:userId`, `POST /api/community/rate`
- `GET /api/my-room-rating`
- Auth: `/api/login`, `/api/logout`, `/api/callback`, `/api/auth/user`

## Database Tables
- `users` (Replit Auth managed)
- `sessions` (Replit Auth managed)
- `trophies` (species, name, date, location, score, method, weaponId, notes, imageUrl, featured)
- `weapons` (name, type, caliber, make, model, optic, notes, imageUrl)
- `user_preferences` (theme, pursuit, scoringSystem, units, roomVisibility, huntingLocations[])
- `room_ratings` (roomOwnerId, raterId, score)

## Theme System
Three themes: `lodge` (Timber Ridge), `manor` (Safari Manor), `minimal` (Alpine Gallery)
CSS variables update dynamically via ThemeProvider context. HSL format without hsl() wrapper for Tailwind v4 compatibility.

## User Preferences
- Primary Pursuit: Big Game, Plains Game, Waterfowl, Alpine
- Scoring System: SCI, Boone & Crockett, Rowland Ward
- Units: Imperial, Metric
- Hunting Locations: Multi-select (Southern Africa Bushveld/Plains, Africa Other, North America High Country/Midwest/Deep Woods/Plains, Europe Alpine/Nordic, Other)
- Room Visibility: Public/Private

## Design Notes
- Typography: Cinzel (serif headings), DM Sans (body)
- Dark forest tones for lodge theme
- Trophy images must be imported as JS variables in Vite, not accessed via URL paths
- `data-testid` attributes on all interactive elements
