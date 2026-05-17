# 86.88 B&B Website Modernization - Project Status

## Project Overview
This project involves migrating the legacy PHP platform of the 86.88 B&B website to a high-fidelity, production-ready Next.js architecture. The goal is to deliver a premium UI/UX experience with performance-optimized components, a fully responsive design, and an elegant aesthetic matching the reference site.

**Stack:** Next.js (App Router), React, CSS Modules, TypeScript.

## Current State (As of May 2026)

### ✅ Completed Work

#### 1. Architecture & Asset Management
- **Next.js Migration:** Project successfully initialized and migrated to Next.js (App Router).
- **Asset Reorganization:** Image folder structure (`public/images/`) cleaned up and categorized (Public Spaces, Rooms, Scenery, Exterior).
- **Data Layer Fixes:** Resolved all 404 image path errors in `src/data/rooms.json` by mapping entries to validated file paths (`main.jpg`, `roomXX.jpg`).

#### 2. Design System & Global UI
- **Typography:** Integrated premium Google Fonts (`Cormorant Garamond`, `Noto Serif TC`, `Inter`) via `next/font`.
- **Styling:** Established a robust CSS token system (`globals.css`) using an elegant warm neutral/gold color palette.
- **Components Built:**
  - **Header:** Scroll-triggered state transition (transparent on hero, frosted white on scroll/subpages), animated mobile drawer hamburger menu.
  - **SideBox:** Fixed desktop navigation and social links panel.
  - **MobileBotBar:** Fixed bottom navigation bar for mobile devices (Socials, Phone, Reserve).
  - **GoTop:** Scroll-to-top button.
  - **Footer:** Elegant footer with social links and copyright info.

#### 3. Internationalization (i18n)
- **Engine:** Built a custom React Context (`src/context/LanguageContext.tsx`) for managing EN/ZH state with `localStorage` persistence.
- **Content Hub:** Centralized all site text strings in `src/data/content.ts`.
- **UI Integration:** Added a sleek 中/EN toggle button to the Header (both desktop and mobile). All pages dynamically pull content from `content.ts`.

#### 4. Page Implementations
- **Home (`/`)**: 
  - Full-screen auto-fading Hero Slider with animated text.
  - Scroll-reveal animations (`IntersectionObserver`) across all sections.
  - News Gallery (grid layout with hover reveals).
  - About summary section.
  - Parallax image dividers.
  - Mosaic "Stay" layout for room previews.
  - Features grid and Map/Contact section.
- **About (`/about`)**: Premium split-grid layout with feature list and framed imagery. Dark text on light background.
- **Rooms List (`/rooms`)**: Elegant grid of room cards with pricing and hover overlays.
- **Room Detail (`/rooms/[slug]`)**: Client component displaying a mosaic photo gallery, detailed room specs, and a sticky pricing/booking sidebar.
- **Booking Info (`/booking-info`)**: Structured information cards with reveal animations.
- **Location (`/location`)**: Split layout with detailed contact info, driving directions, and an embedded Google Map.

### 🎨 Aesthetic Rules Established
- **Home Page:** Immersive, photo-heavy backgrounds. White text over dark/transparent overlays.
- **Subpages:** "Dark-on-light" theme. Headers default to the solid white background state. Page titles and main content text use dark ink colors (`--color-ink`) for maximum legibility against off-white backgrounds.

## 🔜 Next Steps / Future Work

1. **Booking System Integration:** Currently, "Reserve" buttons link to the LINE official account. If a formal booking engine/API is needed in the future, integrate it here.
2. **SEO Optimization:** 
   - Enhance the metadata exported in `layout.tsx` and individual `page.tsx` files.
   - Generate a dynamic `sitemap.xml` and `robots.txt`.
3. **Performance Tuning:** Run Lighthouse audits. Ensure all Next.js `<Image>` components have optimal `sizes` props and lazy loading behavior for images below the fold.
4. **Deployment:** Prepare the application for deployment (e.g., via Cloudflare Tunnel on a local NAS, or a platform like Vercel).

## 📁 Key File Locations for Developers
- **Text/Translation Edits:** `src/data/content.ts`
- **Room Data Edits:** `src/data/rooms.json`
- **Global Styles & CSS Variables:** `src/app/globals.css`
- **Language Logic:** `src/context/LanguageContext.tsx`
