# 86.88 B&B Project Overview

Last updated: 2026-06-19

## Purpose

86.88 B&B is a monorepo for the public inn website, owner/admin CMS, REST API, and shared database layer.

The current product goals are:

- Public website for rooms, photos, location, booking information, and announcements.
- Admin backend for the owner to manage bookings, room availability, room pricing, festival pricing periods, news, images, room content, and password.
- API service that centralizes booking/calendar/CMS data in PostgreSQL.
- NAS deployment behind Nginx Proxy Manager and Cloudflare Tunnel.

## Repository Layout

```text
apps/
  website/       Public Next.js website, served on port 3000.
  admin/         Owner admin dashboard, served on port 3001.
  api/           Express REST API, served on port 3333.
packages/
  db/            Prisma schema, client export, seed logic.
  config-ts/     Shared TypeScript config.
  config-eslint/ Shared ESLint config.
  shared-ui/     Reserved shared UI package.
  utils/         Reserved utility package.
infra/
  docker-compose.yml  Production-style NAS compose stack.
docs/
  PROJECT_OVERVIEW.md This file.
  ARCHITECTURE.md     Runtime and code architecture.
  API_STATUS.md       API implementation status.
  ROADMAP.md          Remaining work and maintenance plan.
```

## Technology Stack

| Area | Stack |
|---|---|
| Monorepo | npm workspaces, Turborepo |
| Website | Next.js 16, React 19, TypeScript, CSS Modules |
| Admin | Next.js 16, React 19, TypeScript, CSS Modules, lucide-react |
| API | Node.js, Express, TypeScript, Zod, Helmet, CORS, rate limiting |
| Auth | JWT in HttpOnly cookie, CSRF token header for state-changing admin requests |
| Database | PostgreSQL 16, Prisma 5 |
| Cache / rate limit store | Redis 7 |
| Media | API media records for bundled `/images/...` and uploaded `/uploads/...` files |
| Deployment | Docker Compose, Nginx Proxy Manager, Cloudflare Tunnel |

## Main Apps

### `apps/website`

Public-facing website for guests. It is mostly static/content-driven today and uses local data/images under `apps/website/src`.

Current completed areas include:

- Home, rooms list, room detail, about, booking, booking info, and location pages.
- Responsive header, footer, mobile navigation, language context, and image-heavy visual design.
- API-backed rooms, news, and media when available, with bundled content/images as emergency fallback.
- Test-phase reservation flow with API availability checks, room disabling by selected date range, confirmation modals, LINE message confirmation, and explicit invalid-booking warning.

### `apps/admin`

Owner-facing CMS/dashboard in Traditional Chinese. It calls the REST API through `NEXT_PUBLIC_API_URL`.

Current pages:

- `/login` admin login.
- `/` dashboard overview.
- `/bookings` booking list and custom calendar grid.
- `/blocked-dates` owner busy/unavailable dates.
- `/news` announcements.
- `/media` image management.
- `/rooms` room content/pricing/availability.
- `/pricing` room price and festival pricing period management.
- `/settings` system status and password change.

### `apps/api`

Express API mounted under `/api/v1`. The OpenAPI source of truth is `apps/api/openapi.yaml`.

Main route groups:

- Auth
- Rooms
- Bookings
- Blocked dates
- Holiday/festival pricing periods
- Media
- Pages
- News
- Dashboard
- Webhooks
- System

### `packages/db`

Owns the Prisma schema and generated client usage. Database models include:

- `User`
- `Room`
- `Booking`
- `BookingNote`
- `BlockedDate`
- `HolidayPeriod`
- `Media`
- `Page`
- `News`
- `WebhookEvent`

## Verification Snapshot

The most recent successful verification was:

```bash
npm run build --workspace @8688bnb/api
npm exec -- tsc --project apps/admin/tsconfig.json --noEmit
npm exec -- tsc --project apps/website/tsconfig.json --noEmit
docker compose -f infra/docker-compose.yml build api admin website
```

The Docker build completed for API, admin, and website images. Host-local `next build` has previously exited silently on the NAS environment, while the Docker build completed successfully.

## Maintenance Rules

- Treat `apps/api/openapi.yaml` and `packages/db/prisma/schema.prisma` as the source of truth before changing admin API calls.
- Keep admin UI text in Traditional Chinese for owner workflows.
- Keep admin package usage close to the website app unless a feature clearly requires a dependency.
- Prefer Docker build verification for production confidence.
- Do not expose the Nginx Proxy Manager admin UI through Cloudflare Tunnel.
