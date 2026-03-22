# Honor The Hunt

## Overview
Honor The Hunt is a virtual trophy room application for hunters. It allows users to track hunting achievements, manage weapons, customize their trophy room aesthetics, and engage with a community of fellow hunters. The project aims to provide a comprehensive platform for hunters to document and share their experiences, leveraging AI and 3D technologies to enhance the trophy display. Key capabilities include AI-powered trophy analysis, 3D model generation for augmented reality viewing, and an Instagram-style community feed. The business vision focuses on creating a premium, engaging experience for hunters, offering tiered access with advanced features for paid and professional users, and building a vibrant community around shared passion.

## User Preferences
- Communication Style: I prefer simple language and direct answers.
- Workflow: I prefer iterative development with regular, small updates rather than large, infrequent ones.
- Interaction: Ask for confirmation before making any significant architectural changes or adding new external dependencies.
- Codebase Changes: Do not make changes to folder `client/replit_integrations/audio/` and file `server/replit_integrations/image/routes/index.js`.

## System Architecture
Honor The Hunt is built with a modern web stack. The **frontend** uses React with Vite for fast development, Wouter for routing, TanStack Query for data fetching, Tailwind CSS for styling, Framer Motion for animations, and shadcn/ui for UI components. The **backend** is powered by Express.js, using Drizzle ORM for PostgreSQL database interactions.

**Key Technical Implementations & Design Choices:**
- **Trophy Pipeline**: An advanced four-step pipeline for trophy processing:
    1.  Background removal using fal.ai's BiRefNet.
    2.  OpenAI GPT-4o Vision for detailed AI analysis (species identification, gender, horn details, scoring, etc.) and structured data extraction (e.g., `visibility` object).
    3.  GPT-image-1 (via OpenAI's `images.edit`) transforms the background-removed photo into a front-facing shoulder mount with a theme-appropriate background, saving it as `renderImageUrl`.
    4.  3D model generation using fal.ai's Tripo image-to-3D, producing Draco-compressed GLB models.
- **3D/AR Viewer**: Integrated Google `<model-viewer>` for interactive 3D viewing and augmented reality (AR) wall placement of trophies.
- **Data Persistence**: All file uploads (trophy images, renders, 3D models, weapon images, profile images) are stored in Replit Object Storage (Google Cloud Storage) for reliability and scalability.
- **Authentication**: A multi-provider authentication system supporting Email/Password (bcrypt), Replit OIDC (Passport.js), Google OAuth, and Apple Sign-In. Session management uses `connect-pg-simple` for PostgreSQL persistence and an `X-Auth-Token` fallback for Replit iframe compatibility.
- **User Tiers & Monetization**: Implemented a Free/Paid/Pro tier system with backend enforcement of usage limits for AI/3D calls. Usage is tracked via a `usageLedger` table.
- **Community Features**: An Instagram-style "Legacy Feed" with global and following modes, species/region search, and sorting. Includes user following and trophy applauding functionalities.
- **Proof of Hunt**: A canvas-rendered downloadable branded PNG image for proof of hunt, replacing older PDF certificates.
- **Location & Mapping**: Google Maps JavaScript API and Google Places Autocomplete are used for all location search and interactive trophy maps, replacing previous Leaflet/OpenStreetMap implementations.
- **UI/UX**:
    -   **Themes**: Three distinct themes: `lodge` (Timber Ridge), `manor` (Safari Manor), and `minimal` (Alpine Gallery), dynamically controlled via CSS variables.
    -   **Typography**: Cinzel for headings and DM Sans for body text.
    -   **Branding**: Copper/bronze (#b87333) is the primary brand color, featured in the logo and UI elements.
    -   **Responsive Design**: Mobile-first design for key pages like onboarding and the dashboard.
    -   **Dashboard**: Features a customizable hero section, 6 stat cards, a trophy timeline grouped by year, and a featured trophy section.
    -   **Trophy Room**: Denser grid layout with 2-5 columns, displaying 3D renders or original photos with minimal overlays.

## External Dependencies
- **Database**: PostgreSQL (Neon-backed)
- **AI/ML Services**:
    -   OpenAI (GPT-4o for vision analysis, GPT-image-1 for image transformations)
    -   fal.ai (BiRefNet for background removal, Tripo for image-to-3D conversion)
    -   Gemini (available for integration)
- **Storage**: Replit Object Storage (built on Google Cloud Storage)
- **Mapping**: Google Maps JavaScript API, Google Places Autocomplete API
- **Analytics**: PostHog (for production analytics and user behavior tracking)
- **Image Processing**:
    -   `exifr` (for EXIF metadata extraction from images)
    -   `gltf-transform` and `draco3dgltf` (for GLB model compression)
- **UI Libraries**: shadcn/ui, Framer Motion
- **Payment Gateway**: Placeholder for future integration (not yet implemented)

## Robustness & Production Readiness
- **Error Boundary**: Top-level React ErrorBoundary in App.tsx catches rendering crashes and shows a recovery UI with reload button.
- **Auth Token Consistency**: All frontend code uses the canonical `getAuthToken()` helper from `lib/auth-token.ts` — community feed, trophy detail, and all API calls use the same token source.
- **Date Safety**: Trophy timeline uses a `safeDate()` utility that returns `null` for invalid dates, displaying "Unknown" instead of crashing or showing 1970.
- **Canvas Safety**: `getCroppedBlob` in AddTrophyDialog checks for null canvas context instead of using non-null assertion.
- **Background Task Cleanup**: `trophy-3d.ts` wraps temp file deletion in try/catch with warn-level logging to prevent background pipeline crashes from orphaned file handles.
- **Loading States**: ProDashboard shows loading spinner while profile data loads, preventing flash of "no profile" state.