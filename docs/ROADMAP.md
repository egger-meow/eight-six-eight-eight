# Roadmap

Last updated: 2026-06-19

## Completed

- Public website migrated to Next.js with responsive pages for home, rooms, room detail, about, booking, booking info, and location.
- Website uses API-backed rooms, news, and media when available, with bundled fallback data/images.
- Website reservation test flow includes date-based room availability checks, unavailable room disabling, API-backed price estimates, confirmation modal, LINE confirmation modal, and an explicit test-only warning.
- Docker Compose stack includes website, admin, API, PostgreSQL, Redis, Nginx Proxy Manager, Cloudflare Tunnel, and seed profile.
- Express API implemented for auth, rooms, bookings, blocked dates, media, pages, news, dashboard, webhooks, and system info.
- Prisma schema established for users, rooms, bookings, booking notes, blocked dates, holiday/festival pricing periods, media, CMS pages, news, and webhook events.
- Admin dashboard built in Traditional Chinese with:
  - Login and session handling.
  - Dashboard stats.
  - Booking list and custom calendar grid.
  - Booking create/edit/delete and notes.
  - Blocked dates for all rooms or a specific room.
  - News/announcement management.
  - Media target upload/list/delete.
  - Room pricing/content/availability editing.
  - Dedicated room price and festival pricing period management.
  - System status and password change.
- API, admin, and website Docker images build successfully.

## Near-Term Priorities

1. Deploy and smoke test running containers.
   - Start `api` and `admin` through compose.
   - Confirm `GET https://api.8688bnb.com/api/v1/health`.
   - Confirm login and CSRF-protected admin mutations.

2. Finish Nginx/Cloudflare routing.
   - Add NPM proxy host for `admin.8688bnb.com -> admin:3001`.
   - Add NPM proxy host for `api.8688bnb.com -> api:3333`.
   - Add Cloudflare Tunnel public hostnames for admin and API.
   - Confirm `CORS_ORIGIN` includes `https://admin.8688bnb.com`.

3. Seed and verify production data.
   - Confirm the five real room records exist.
   - Confirm the admin user password is known and immediately changed.
   - Confirm uploaded media persists in the intended Docker volume or bind mount.
   - Apply the current Prisma schema so the `HolidayPeriod` table exists, then seed/verify editable festival pricing periods.

4. Add workflow tests.
   - API auth and CSRF.
   - Booking create/update/delete/calendar.
   - Room availability estimates and booking creation pricing parity across weekday, weekend, and festival periods.
   - Blocked date all-room behavior.
   - Media upload/delete.
   - Room update.
   - Holiday/festival period CRUD.

## Product Gaps

- Pages CMS needs a better lightweight editor flow in admin.
- Calendar UX can be improved with drag selection, clearer occupancy density, and print/export if owner needs it.
- Booking conflict handling should be covered by automated tests for overlapping bookings, pending/unconfirmed bookings, and blocked dates.
- Festival pricing has a copy-to-next-year workflow, but lunar-calendar holidays and government-adjusted long weekends still need owner review each year.
- OTA/channel-manager webhook mapping is not production-proven.
- No explicit audit trail for admin changes except booking notes and webhook events.

## Technical Debt

- Some generated `apps/api/dist` files are tracked; decide whether this repo should keep build output committed.
- OpenAPI docs mention production cookie names, while development uses non-`__Host` fallback cookies. Keep this explicit when updating auth docs.
- Host-local Next build on the NAS has previously exited silently, while Docker build succeeds. Prefer Docker build as the deployment validation path.
- Docker comments and older docs may still contain Phase 2 wording for admin/API even though services now exist.
- The seed service runs `npm install` dynamically; this is convenient but slower and less reproducible than a dedicated seed image.

## Later Enhancements

- Move more public website content to API-backed CMS records.
- Add more media ordering and alt-text editing polish in admin.
- Add stronger room photo assignment previews per room and website section.
- Add iCal export or channel manager integration if OTA bookings become a requirement.
- Add backup/restore runbook for PostgreSQL, uploads, and NPM config.
- Add monitoring checks for website/admin/API health endpoints.
