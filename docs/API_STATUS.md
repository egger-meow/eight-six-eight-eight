# API Status

Last updated: 2026-06-19

Source of truth:

- Spec: `apps/api/openapi.yaml`
- Runtime routes: `apps/api/src/routes/`
- Database schema: `packages/db/prisma/schema.prisma`

## Current Implementation

| Area | Status | Notes |
|---|---|---|
| Health | Complete | `GET /api/v1/health` checks database and Redis readiness. |
| Auth | Complete | Login, logout, current user, CSRF token, password change. |
| Rooms | Complete | Public list/detail and admin create/update/delete. |
| Bookings | Complete | CRUD, notes, and calendar endpoint. |
| Blocked dates | Complete | Owner busy/unavailable periods; `room_id: null` means all rooms. |
| Holiday periods | Complete | Editable festival pricing periods used by shared pricing logic; pricing-only, not availability blocking. |
| Media | Complete | Upload, list by target, update metadata/order, delete, target list. |
| Pages | Implemented | CMS page CRUD exists in API; admin UI coverage still needs richer editor flow. |
| News | Complete | Announcement list/create/update/delete with `visible`, `pinned`, `published_at`. |
| Dashboard | Complete | Stats and overview used by admin dashboard. |
| Webhooks | Implemented | Ingress endpoint and event storage exist; OTA provider mapping needs production validation. |
| System | Complete | System info endpoint used by admin settings page. |

## Important Contracts For Admin

### Authentication

- Login endpoint returns a CSRF token; admin stores it in memory.
- Mutating requests must include `X-CSRF-Token`.
- Requests must use credentials/cookies.
- Production cookie is host-only and HttpOnly, so Next middleware cannot reliably check it from `admin.8688bnb.com`.
- Admin should check `/auth/me` before requesting a CSRF token during session bootstrap to avoid unnecessary auth limiter hits on recognized devices.

### Bookings

List endpoint:

```text
GET /api/v1/bookings?page=1&per_page=100
```

Calendar endpoint:

```text
GET /api/v1/bookings/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD
```

Calendar response is room-centric:

```text
rooms[]
  room_id
  room_slug
  room_name_zh
  days[]
    date
    status
    booking?
    blocked_info?
```

Admin list sorting and search are currently handled client-side because the API list endpoint only supports pagination.

Booking creation validates overlapping bookings and blocked dates. Overlapping bookings make a room unavailable regardless of booking status, including pending/unconfirmed test records.

### Rooms

Room JSON uses:

- `available`
- `price_weekday`
- `price_weekend`
- `price_holiday`
- `sort_order`

Avoid older or frontend-only names such as `is_available` or `base_price_weekday`.

Availability endpoint:

```text
GET /api/v1/rooms/{slug}/availability?from=YYYY-MM-DD&to=YYYY-MM-DD
```

The response includes availability and, when possible, an estimated total using the same pricing helper as booking creation.

Pricing precedence per stay night:

1. Matching holiday/festival period -> `price_holiday`
2. Friday or Saturday -> `price_weekend`
3. Other nights -> `price_weekday`

### Holiday Periods

Holiday/festival pricing endpoints:

```text
GET /api/v1/holiday-periods
POST /api/v1/holiday-periods
PUT /api/v1/holiday-periods/{id}
DELETE /api/v1/holiday-periods/{id}
```

JSON uses:

- `name`
- `start_date`
- `end_date`

If the deployed database has not received the `HolidayPeriod` schema yet, `GET` returns an empty list with `meta.setup_required: true`; mutating endpoints return `409 SETUP_REQUIRED`.

### News

News JSON uses:

- `visible`
- `pinned`
- `published_at`

Avoid older names such as `is_visible` or `is_pinned`.

### Media

Media uses:

- `target` for grouping.
- `url` for the served file URL.
- `size_bytes` for file size.

Uploaded files are served by the API from `/uploads`. Admin should prefix relative media URLs with the API origin.

Bundled fallback website images are stored as DB media records with `/images/...` URLs. Website/admin image rendering should prefix `/images/...` with the website origin and `/uploads/...` with the API origin.

Known empty targets are bootstrapped on media and room reads. The bootstrap creates only missing `target + url` pairs.

### Blocked Dates

`room_id: null` means all rooms are unavailable for the selected date range. This is the owner busy mode.

## Verification

Most recent successful checks:

```bash
npm run build --workspace @8688bnb/api
npm exec -- tsc --project apps/admin/tsconfig.json --noEmit
npm exec -- tsc --project apps/website/tsconfig.json --noEmit
docker compose -f infra/docker-compose.yml build api admin website
```

Known warning:

- Docker Prisma generate may warn that OpenSSL could not be detected and defaults to `openssl-1.1.x`. Build still completes. If runtime Prisma engine issues appear, install the expected OpenSSL package in the API image.

## Known Gaps

- No automated integration test suite currently verifies every admin/API workflow.
- Webhook provider behavior needs real OTA/channel-manager payload validation.
- Pages CMS exists at API level, but admin editor experience should be improved before relying on it for full website content management.
- The public website still keeps bundled fallback content/images for API outages.
