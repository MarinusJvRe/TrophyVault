# Honor The Hunt

## Overview
"Honor The Hunt" is a virtual trophy room application designed for hunters. It allows users to meticulously track their hunting achievements, manage their weapon inventory, personalize the aesthetic of their digital trophy room, and engage with a community of fellow hunters. The project aims to provide a comprehensive platform for hunters to document their passion, share experiences, and connect with others in a modern, interactive environment. Key capabilities include AI-powered trophy analysis, 3D AR trophy viewing, interactive maps, and community features like leaderboards.

## User Preferences
- **Communication Style**: Clear and concise.
- **Explanation Style**: Detailed explanations when necessary, but prioritize actionable information.
- **Working Methodology**: Iterative development with regular updates.
- **Interaction Style**: Ask before making major architectural changes or introducing new dependencies.
- **Coding Style**: Maintain consistent code style and use modern JavaScript/TypeScript practices.
- **Unit Preferences**: Users can toggle between Imperial and Metric units for various measurements (shot distance, score/size).
- **Scoring Systems**: Support for SCI, Boone & Crockett, and Rowland Ward scoring systems, selectable by the user.
- **Hunting Methods**: Use a predefined dropdown for hunting methods.
- **Location Input**: Auto-extraction of EXIF GPS data and "Use current location" option for convenience.

## System Architecture
The application features a modern full-stack architecture.

**Frontend**:
- Built with React + Vite, utilizing Wouter for routing, TanStack Query for data fetching, Tailwind CSS for styling, Framer Motion for animations, and shadcn/ui for UI components.
- **UI/UX**: Features a premium landing page for unauthenticated users and a rich dashboard for authenticated users. Three distinct themes are available: Lodge (Timber Ridge), Manor (Safari Manor), and Minimal (Alpine Gallery), with dynamic CSS variable updates. Typography uses Cinzel for headings and DM Sans for body text. Brand color is copper/bronze (#b87333).
- **Key Pages**: Includes a landing page (`/`), authentication (`/login`), pricing (`/pricing`), legal pages (`/terms`, `/privacy`), contact (`/contact`), trophy room (`/trophies`), individual trophy details (`/trophies/:id`), map view (`/trophies/map`), weapon management (`/safe`), community features (`/community`), profile/settings (`/profile`), and an onboarding flow (`/onboarding`).
- **Mobile Responsiveness**: Designed with mobile-first principles, including responsive layouts for dashboard and onboarding screens.

**Backend**:
- Powered by Express.js, using Drizzle ORM to interact with a PostgreSQL database (Neon-backed).
- **Authentication**: A multi-provider system supporting Email/Password (bcrypt), Replit OIDC (via Passport.js), Google OAuth, and Apple Sign-In. Session management uses `connect-pg-simple` for PostgreSQL storage. An auth token fallback mechanism is implemented for Replit webview compatibility.
- **AI Integration**: Leverages OpenAI GPT-4o Vision for detailed trophy analysis (species ID, gender, quality, mount recommendations, horn details, qualification estimates) and gpt-image-1 for generating 3D trophy renders.
- **3D/AR Functionality**: Incorporates a fal.ai pipeline for 3D model generation (BiRefNet for background removal, Tripo for image-to-3D conversion), `gltf-transform` and `draco3dgltf` for GLB compression, and Google's `<model-viewer>` for 3D viewing and AR wall placement.
- **Mapping**: Integrated with Google Maps JavaScript API and Google Places Autocomplete for location search and interactive trophy maps.

**Database**:
- PostgreSQL is the primary database, managed with Drizzle ORM.
- **Core Tables**:
    - `users`: Stores user credentials, profile information, and authentication details.
    - `sessions`: Manages user session data.
    - `trophies`: Stores detailed trophy information, including species, location, score, images, 3D model URLs, and hunt details.
    - `weapons`: Manages weapon inventory details.
    - `user_preferences`: Stores user-specific settings like theme, pursuit, scoring system, and units.
    - `room_ratings`: Records community ratings for trophy rooms.

## External Dependencies
- **PostgreSQL**: Primary database for all application data (Neon-backed).
- **OpenAI API**: Used for GPT-4o Vision for trophy analysis and gpt-image-1 for 3D render generation.
- **fal.ai**: Provides the pipeline for 3D model generation from images (BiRefNet and Tripo services).
- **Google Maps Platform**:
    - **Google Maps JavaScript API**: For displaying interactive maps and trophy locations.
    - **Google Places Autocomplete**: For location search functionality.
- **Google OAuth**: For user authentication.
- **Apple Sign-In**: For user authentication.
- **`exifr`**: Library for extracting EXIF metadata from uploaded images (photo date, GPS).
- **Nominatim**: Used for reverse geocoding device GPS coordinates to human-readable locations.
- **jsPDF**: For generating printable trophy certificates.
- **`gltf-transform` / `draco3dgltf`**: For optimizing and compressing GLB 3D models.
- **`connect-pg-simple`**: PostgreSQL-based session store for Express.js.
- **Passport.js**: Authentication middleware, specifically for Replit OIDC.