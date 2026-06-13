# Roadmap

Last updated: 2026-06-13

## Completed

- Public website migrated to Next.js with responsive pages for home, rooms, room detail, about, booking info, and location.
- Docker Compose stack includes website, admin, API, PostgreSQL, Redis, Nginx Proxy Manager, Cloudflare Tunnel, and seed profile.
- Express API implemented for auth, rooms, bookings, blocked dates, media, pages, news, dashboard, webhooks, and system info.
- Prisma schema established for users, rooms, bookings, booking notes, blocked dates, media, CMS pages, news, and webhook events.
- Admin dashboard built in Traditional Chinese with:
  - Login and session handling.
  - Dashboard stats.
  - Booking list and custom calendar grid.
  - Booking create/edit/delete and notes.
  - Blocked dates for all rooms or a specific room.
  - News/announcement management.
  - Media target upload/list/delete.
  - Room pricing/content/availability editing.
  - System status and password change.
- API and admin Docker images build successfully.

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

4. Add workflow tests.
   - API auth and CSRF.
   - Booking create/update/delete/calendar.
   - Blocked date all-room behavior.
   - Media upload/delete.
   - Room update.

## Product Gaps

- Website is not fully connected to the API CMS/media records.
- Pages CMS needs a better lightweight editor flow in admin.
- Calendar UX can be improved with drag selection, clearer occupancy density, and print/export if owner needs it.
- Booking conflict handling should be verified against overlapping bookings and blocked dates.
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
- Add media ordering and alt-text editing polish in admin.
- Add room photo assignment previews per room and website section.
- Add iCal export or channel manager integration if OTA bookings become a requirement.
- Add backup/restore runbook for PostgreSQL, uploads, and NPM config.
- Add monitoring checks for website/admin/API health endpoints.
