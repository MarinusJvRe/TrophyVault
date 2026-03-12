# Honor The Hunt

## Overview
Honor The Hunt is a virtual trophy room application for hunters. Users can track hunting achievements, manage weapons, customize trophy room aesthetics, and participate in community features.

## Recent Changes
- **2026-03-12**: User tiers & monetization system (Free/Paid/Pro): Extended schema with `proProfiles`, `referrals`, `usageLedger` tables; added `accountTier`, `userType`, `leaderboardVerified`, `onboardingCompleted`, `firstTrophyUploaded`, `credits`, `upgradePromptShown` to userPreferences; added `isAiAnalyzed`, `taggedProUserId` to trophies. Backend tier enforcement middleware (`checkTierLimit`), usage tracking on AI/3D calls. New endpoints: `/api/usage`, `/api/pro/profile`, `/api/pro/search`, `/api/pro/referrals`, `/api/referral/*`, `/api/pro/tags`, `/api/verify-leaderboard`. Redesigned onboarding with Hunter vs Industry Professional fork. New components: UpgradePrompt, UsageBanner, ProTagSearch, ProDashboard page (`/pro`). Profile page shows tier badge, leaderboard verification, Pro dashboard link. Trophy room shows usage banner and first-trophy upgrade prompt. AddTrophyDialog has Pro tag search field. Referral code tracking on registration. Payment integration NOT implemented — upgrade buttons show placeholder.
- **2026-03-11**: Marketing landing & info pages: unauthenticated visitors now see a premium landing page at `/` with hero, feature highlights, theme showcase, cross-device messaging, social proof stats, pricing summary, and CTA sections. Dedicated `/pricing` page with three-tier comparison table (Free/Paid/Pro). Legal pages at `/terms` and `/privacy`. Contact page at `/contact` with form. Shared `MarketingLayout` component with nav bar (logo, Pricing, Contact, Login/Sign Up) and footer (Terms, Privacy, Contact, copyright). Auth page moved to `/login` route. Authenticated users still see the dashboard at `/`. All public pages accessible to everyone.
- **2026-03-11**: Renamed app from TrophyVault to "Honor The Hunt" throughout codebase. Updated all user-facing text ("the vault" → "the trophy room"), splash screen now displays "Honor the Hunt" below logo. Trophy room title changed to "The Trophy Room". Certificate generation updated to reflect new branding.

- **2026-03-10**: 3D AR trophy viewer: fal.ai pipeline (BiRefNet bg removal → Tripo image-to-3D → Draco-compressed GLB), Google `<model-viewer>` AR viewer with wall placement, background 3D generation with polling
- **2026-03-10**: Schema: added `glbUrl`, `glbPreviewUrl`, `mountType` columns to trophies table
- **2026-03-10**: New endpoint: `GET /api/trophies/model-status` for 3D model generation status polling
- **2026-03-10**: Trophy room cards show "3D" badge (clickable to open AR viewer) or spinning indicator while generating
- **2026-03-10**: Trophy detail page "View in 3D / AR" button opens full-screen model viewer with wall AR placement
- **2026-03-10**: New files: `server/trophy-3d.ts` (pipeline), `client/src/components/TrophyARViewer.tsx` (viewer), `client/src/types/model-viewer.d.ts` (types)
- **2026-03-09**: AI prompt optimised: stripped `animal_pose`, `visibility`, `exif_hints`, `additional_animals`, `mount_recommendation.viable`, `photo_quality.suggestion`; reduced max_tokens from 2500→1500
- **2026-03-09**: Background render generation: AI vision analysis (species, horns, score) blocks until complete, then form shows; 3D render generation runs in background with polling + server auto-patches trophy when done
- **2026-03-09**: Shot distance unit toggle: Meters/Yards toggle next to input, stored as `"200 yards"` or `"180 m"`; defaults from user prefs
- **2026-03-09**: Score/size unit toggle: cm/inches/Score 3-option toggle, stored as `"52"`, `"132 cm"`, or `"100 Score"`; defaults from user prefs
- **2026-03-09**: Hunting method dropdown: replaced free-text with Select dropdown (Walk and stalk, Ground blind/Hide, Tree stand/Elevated, Vehicle, Driven hunt, Other)
- **2026-03-09**: All unit toggles and method dropdown also added to trophy-detail edit form
- **2026-03-09**: `HUNTING_METHODS` constant and `TrophyAnalysis` interface exported from `AddTrophyDialog.tsx`
- **2026-03-09**: EXIF metadata extraction: photo date & GPS auto-extracted from trophy images using `exifr`, pre-populates date and location fields with "From photo" indicator
- **2026-03-12**: Object Storage migration: all file uploads (trophy images, renders, 3D models, weapon images, profile images) now persist to Replit Object Storage instead of ephemeral local filesystem. Fixes production issue where images disappeared after container restarts (e.g., sign-out/in). Legacy `/uploads` route retained for backward compat; new files served via `/objects/uploads/uuid` paths.
- **2026-03-12**: Google Maps integration restored: replaced Leaflet/OpenStreetMap/Nominatim with Google Maps JavaScript API + Google Places Autocomplete for all maps and location search. Trophy map has Road/Terrain/Satellite/Hybrid toggle. Maps-config API endpoint serves key securely. Leaflet dependency removed.
- **2026-03-09**: "Use current location" button: added to LocationSearch component (available on add trophy + edit trophy), requests device GPS, reverse geocodes via Google Maps Geocoder
- **2026-03-09**: `reverseGeocode()` helper exported from LocationSearch for reuse (EXIF GPS → place name)
- **2026-03-08**: Dashboard refactored: mobile hero layout fix (shorter 45vh on mobile, responsive text), 6 stat cards in 2x3/3x2 grid (Hunts, Qualifying Trophies, Species, Room Rating, Weapons in Safe, Furthest Shot)
- **2026-03-08**: Qualifying trophies: compares trophy score vs species threshold from user's scoring system (SCI/RW/B&C) using `parseScoreNumeric()` for fraction support
- **2026-03-08**: Room rating: private rooms show "Unrated · Private", public rooms show community rating or "Unrated · No ratings yet" — removed auto-completeness score
- **2026-03-08**: Trophy timeline: replaces "Recent Harvests" section, grouped by year, chronological entries with thumbnails
- **2026-03-08**: Featured trophy: star button on trophy detail page toggles `featured` status (only one at a time), featured trophy section on dashboard
- **2026-03-08**: Star endpoint: `POST /api/trophies/:id/star` — toggles featured, un-stars any other featured trophy
- **2026-03-08**: `parseScoreNumeric()` added to `shared/scoring-thresholds.ts` — handles fractions like `53 1/2"`, parenthetical notes, inch marks
- **2026-03-07**: Location search: Nominatim geocoding autocomplete replaces text input, stores lat/lng in DB, shows Leaflet/OSM map on trophy detail
- **2026-03-07**: Map view: `/trophies/map` page with all trophies plotted on interactive Leaflet map, clickable pins with trophy info
- **2026-03-07**: Scoring thresholds: `shared/scoring-thresholds.ts` with SCI/Rowland Ward/B&C minimum scores for ~90 species, displayed on trophy detail and add dialog
- **2026-03-07**: Certificate PDF: jsPDF-based dark-themed certificate with trophy image, details, scoring thresholds, notes; downloads on "Generate Certificate" click
- **2026-03-07**: Weapon image upload: camera/gallery picker with crop replaces text URL input in The Safe
- **2026-03-07**: Removed 3D badge from trophy room cards, stopped pre-populating location from AI
- **2026-03-07**: Schema: added `latitude`, `longitude` columns to trophies table
- **2026-03-07**: 3D render generation switched from broken DALL-E 3 to working gpt-image-1 model
- **2026-03-07**: Trophy room redesigned: wall-mount layout with denser grid (2-5 cols), cards show 3D render image or fallback to original photo, minimal overlay with species/score/date
- **2026-03-07**: Trophy detail: single-column scrollable layout, clear "Back to Vault" button at top, photo smaller with padding, shot distance shown, "TrophyVault Score" label (replaces "Symmetry Score"), no "Estimated Age"
- **2026-03-07**: AI prompt updated: removed Estimated Age, added `trophy_vault_score` (1-10 impressiveness), added `render_prompt` for DALL-E 3D taxidermy render generation
- **2026-03-07**: Schema: added `shotDistance`, `renderImageUrl` columns to trophies table
- **2026-03-07**: Analyze endpoint generates DALL-E 3D render image after AI analysis, stores as separate file, returns `renderImageUrl`
- **2026-03-07**: Trophy form: name field kept with greyed placeholder example (e.g. "Kudu bull Work trip 2026"), added shot distance field, score uses midpoint of AI estimated range
- **2026-02-24**: AI prompt enhanced: gender identification, horn length in user's units (metric/imperial), trophy qualification estimate per scoring system (SCI/Rowland Ward/B&C)
- **2026-02-24**: Trophy form: Weapon dropdown from Safe (+ "Other" fallback), score auto-filled with mid-range horn estimate, Trophy Notes + Hunt Notes (separate fields), method/location now optional
- **2026-02-24**: Schema: added `huntNotes`, `gender` columns to trophies; `method`/`location` now nullable
- **2026-02-24**: AI-powered trophy upload: photo upload → OpenAI vision analysis (species ID, gender, quality score, mount recommendation, horn details, trophy qualification) → pre-filled form
- **2026-02-24**: New user flow: Sign up → Onboarding → Trophy Room; Existing user: Sign in → Dashboard
- **2026-02-24**: Dashboard logo moved to top center with fade-in animation
- **2026-02-24**: Session cookie fixed: SameSite=None + Secure + Partitioned (CHIPS) for Replit webview iframe compatibility
- **2026-02-24**: Onboarding screens redesigned for mobile responsiveness (compact cards, scrollable layout, dvh)
- **2026-02-24**: New transparent-background logo (copper/bronze antlers + "TROPHY VAULT" text) replaces square block everywhere
- **2026-02-24**: Added splash screen with logo + spinner on app cold load (1.8s)
- **2026-02-24**: New auth system: email+password sign-up/sign-in, Google OAuth button, Apple Sign-In button
- **2026-02-24**: Auth page with toggle between Sign In and Sign Up modes, dark theme matching brand
- **2026-02-24**: Updated users table with passwordHash, authProvider, authProviderId fields
- **2026-02-21**: Integrated user-designed logo into landing page and dashboard hero
- **2026-02-18**: Redesigned Safari Manor to dark warm tones; fixed text readability across all themes
- **2026-02-18**: Profile page: photo upload, Premium/Free badge, sharing toggle, locations
- **2026-02-18**: Backend fully wired with PostgreSQL, Drizzle ORM, Replit Auth (OIDC)
- **2026-02-17**: Converted frontend from mock data to real API calls

## Architecture
- **Frontend**: React + Vite, Wouter routing, TanStack Query, Tailwind CSS, Framer Motion, shadcn/ui
- **Backend**: Express.js, Drizzle ORM, PostgreSQL (Neon-backed)
- **Auth**: Multi-provider — Email/Password (bcrypt) + auth token fallback, Replit OIDC (Passport.js), Google OAuth (planned), Apple Sign-In (planned)
- **Storage**: Replit Object Storage (Google Cloud Storage) for persistent file uploads (images, renders, 3D models); served via `/objects/uploads/` route
- **AI**: OpenAI GPT-4o vision for trophy analysis + gpt-image-1 for 3D trophy render generation (via Replit AI Integrations); Gemini integration also available
- **3D/AR**: fal.ai (BiRefNet bg removal + Tripo image-to-3D), gltf-transform + draco3dgltf for GLB compression, Google model-viewer for 3D viewing + AR wall placement

## Key Pages
- `/` - Landing page (unauthenticated) or Dashboard (authenticated: hero + stats + featured trophies)
- `/login` - Auth page (Sign In / Sign Up with email, Google, Apple)
- `/pricing` - Pricing page (three-tier comparison: Free/Paid/Pro)
- `/terms` - Terms & Conditions
- `/privacy` - Privacy Policy
- `/contact` - Contact page with form
- `/trophies` - Trophy Room (grid view, search/filter, add new)
- `/trophies/:id` - Trophy Detail (image viewer, hunt details, WhatsApp share, certificate PDF)
- `/trophies/map` - Map View (interactive Google Maps with trophy pins, terrain/satellite toggle)
- `/safe` - The Safe (weapon management)
- `/community` - Community (leaderboards, rate rooms)
- `/profile` - Profile & Settings (theme, about, locations, sharing, tier badge, leaderboard verification)
- `/onboarding` - First-time setup (Hunter vs Pro fork → theme → preferences → locations)
- `/pro` - Pro Dashboard (referral stats, tag stats, copy referral link)

## API Routes
- `GET/POST /api/trophies`, `GET/PATCH/DELETE /api/trophies/:id`
- `POST /api/trophies/upload-image` (file upload, returns imageUrl)
- `POST /api/trophies/analyze` (file upload → OpenAI vision → species + quality + mount analysis + DALL-E 3D render generation)
- `GET/POST /api/weapons`, `GET/PATCH/DELETE /api/weapons/:id`
- `GET/PUT /api/preferences`
- `GET /api/stats`
- `GET /api/community/rooms`, `GET /api/community/room/:userId`, `POST /api/community/rate`
- `GET /api/my-room-rating`
- `GET /api/maps-config` (returns Google Maps API key for authenticated users)
- Tiers: `GET /api/usage` (usage stats), `POST /api/verify-leaderboard`
- Pro: `POST /api/pro/profile`, `GET /api/pro/search?q=`, `GET /api/pro/referrals`, `GET /api/pro/tags`
- Referrals: `POST /api/referral/apply`, `GET /api/referral/validate/:code`
- Auth: `/api/login`, `/api/logout`, `/api/callback`, `/api/auth/user`
- Email Auth: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/email-logout`
- OAuth: `GET /api/auth/google`, `GET /api/auth/apple` (pending credential setup)

## Database Tables
- `users` (id, email, firstName, lastName, profileImageUrl, passwordHash, authProvider, authProviderId, createdAt, updatedAt)
- `sessions` (sid, sess, expire)
- `trophies` (species, name, date, location?, score, method?, weaponId, gender?, shotDistance?, notes, huntNotes, imageUrl, renderImageUrl?, glbUrl?, glbPreviewUrl?, mountType?, featured, isAiAnalyzed?, taggedProUserId?)
- `weapons` (name, type, caliber, make, model, optic, notes, imageUrl)
- `user_preferences` (theme, pursuit, scoringSystem, units, roomVisibility, huntingLocations[], accountTier, userType, leaderboardVerified, onboardingCompleted, firstTrophyUploaded, upgradePromptShown, credits)
- `pro_profiles` (userId, entityType, businessName, handle, location, referralCode, createdAt)
- `referrals` (proUserId, referralCode, referredUserId, convertedToTier?, createdAt)
- `usage_ledger` (userId, actionType, cost, metadata?, createdAt)
- `room_ratings` (roomOwnerId, raterId, score)

## Logo
- Transparent background logo: `attached_assets/trophy_vault_logo_transparent.png`
- Imported via `@assets/trophy_vault_logo_transparent.png` alias
- Copper/bronze antlers (deer + kudu) with horizontal line and "TROPHY VAULT" text
- Used in: splash screen, auth page, sidebar, dashboard hero

## Splash Screen
- `SplashScreen.tsx` component wraps app in App.tsx
- Shows logo centered + copper spinner for 1.8s
- Framer Motion fade-out transition
- Dark background (#1a1a1a)

## Auth System
- **Email/Password**: bcrypt hash (12 rounds), session-based auth, stored in users table
- **Auth Token Fallback**: In-memory token map (server/auth.ts) returned on login/register, sent via `X-Auth-Token` header; solves Replit webview iframe cookie issues
- **Replit OIDC**: Existing integration via Passport.js (still functional as fallback)
- **Google OAuth**: UI button ready, backend route placeholder (needs GOOGLE_CLIENT_ID/SECRET)
- **Apple Sign-In**: UI button ready, backend route placeholder (needs Apple credentials)
- Session stored in PostgreSQL via connect-pg-simple
- `isAuthenticated` middleware checks: 1) email session, 2) X-Auth-Token header, 3) Replit OIDC tokens
- Client stores auth token in sessionStorage (`client/src/lib/auth-token.ts`)

## Theme System
Three themes: `lodge` (Timber Ridge), `manor` (Safari Manor), `minimal` (Alpine Gallery)
CSS variables update dynamically via ThemeProvider context. HSL format without hsl() wrapper for Tailwind v4 compatibility.

## User Preferences
- Primary Pursuit: Big Game, Plains Game, Waterfowl, Alpine
- Scoring System: SCI, Boone & Crockett, Rowland Ward
- Units: Imperial, Metric
- Hunting Locations: Multi-select
- Room Visibility: Public/Private
- Account Tier: free / paid / pro (default: free)
- User Type: hunter / professional (default: hunter)
- Leaderboard Verified: boolean (verified via identity proof for leaderboard participation)
- Credits: numeric balance for future payment integration

## Tier System
- **Free**: 3 AI analyses (lifetime), 1 3D model (lifetime), 25 manual trophies, $0 budget cap
- **Paid**: Unlimited AI/3D/manual, $10/month budget cap
- **Pro**: Unlimited AI/3D/manual, $20/month budget cap, referral system, Pro dashboard, business profile
- AI costs: analysis=$0.10, 3D model=$0.15, AI render=$0.05
- Payment integration NOT implemented — upgrade buttons show placeholder message

## Design Notes
- Typography: Cinzel (serif headings), DM Sans (body)
- Dark forest tones for lodge theme
- Brand color: copper/bronze (#b87333)
- Trophy images must be imported as JS variables in Vite, not accessed via URL paths
- `data-testid` attributes on all interactive elements
