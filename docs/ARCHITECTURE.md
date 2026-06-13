# Architecture

Last updated: 2026-06-13

## Runtime Topology

```text
Internet
  -> Cloudflare
  -> Cloudflare Tunnel container
  -> Nginx Proxy Manager
     -> website:3000  for 8688bnb.com
     -> admin:3001    for admin.8688bnb.com
     -> api:3333      for api.8688bnb.com

api:3333
  -> postgres:5432
  -> redis:6379
  -> local uploads directory for media files
```

The API is served under `/api/v1`. Admin browser requests use `NEXT_PUBLIC_API_URL`, which must be browser-reachable. In production this should be `https://api.8688bnb.com/api/v1`, not Docker DNS such as `http://api:3333/api/v1`.

## Docker Services

Defined in `infra/docker-compose.yml`:

| Service | Container | Purpose |
|---|---|---|
| `website` | `8688bnb-website` | Public Next.js app on internal port 3000 |
| `admin` | `8688bnb-admin` | Admin Next.js app on internal port 3001 |
| `api` | `8688bnb-api` | Express API on internal port 3333 |
| `postgres` | `8688bnb-postgres` | PostgreSQL database, host port 5433 |
| `redis` | `8688bnb-redis` | Cache and rate limit backend |
| `nginx-proxy-manager` | `8688bnb-npm` | Reverse proxy UI and internal routing |
| `cloudflared` | `8688bnb-tunnel` | Cloudflare Tunnel client |
| `seed` | `8688bnb-seed` | Profile-only database seed helper |

Useful commands from repo root:

```bash
docker compose -f infra/docker-compose.yml build api admin
docker compose -f infra/docker-compose.yml up -d api admin
docker compose -f infra/docker-compose.yml ps
docker compose -f infra/docker-compose.yml logs -f api admin
```

## Nginx Proxy Manager Routing

Create or verify these Proxy Hosts:

| Domain | Scheme | Forward Hostname | Forward Port |
|---|---|---|---|
| `8688bnb.com` | `http` | `website` | `3000` |
| `admin.8688bnb.com` | `http` | `admin` | `3001` |
| `api.8688bnb.com` | `http` | `api` | `3333` |

Recommended options:

- Enable Websockets Support.
- Enable Block Common Exploits.
- Let Cloudflare handle public TLS unless the tunnel/proxy setup changes.
- Keep NPM GUI on LAN only at `http://192.168.1.128:81`.

Cloudflare Tunnel public hostnames should all target the NPM container over HTTP, for example `http://8688bnb-npm:80`.

## API Architecture

`apps/api/src/index.ts` wires:

- Helmet security headers.
- CORS with credentials from `CORS_ORIGIN`.
- JSON and form body parsing.
- Cookie parsing.
- Static uploads at `/uploads`.
- Redis-backed rate limiting where available.
- Route groups under `/api/v1`.
- Central 404 and error handlers.

Authentication:

- Login sets a JWT session cookie.
- Production cookie name is hardened as `__Host-8688_session`.
- Development also supports `8688_session`.
- Mutating admin requests require `X-CSRF-Token`.
- CSRF token is returned by login and can also be fetched after login.

Rate limit groups:

- `/api/v1/auth`: stricter auth limiter.
- `/api/v1/rooms`, `/pages`, `/news`, `/media`: public limiter.
- `/api/v1/bookings`, `/blocked-dates`, `/dashboard`, `/webhooks`, `/system`: general limiter.

## Database Architecture

Prisma schema: `packages/db/prisma/schema.prisma`.

Core relationships:

- `Room` has many `Booking` and `BlockedDate`.
- `Booking` belongs to one `Room` and has many `BookingNote`.
- `BlockedDate` may target one room or all rooms when `roomId` is null.
- `Media` is grouped by string `target`, such as page or section.
- `Page` stores CMS HTML content by unique `slug`.
- `News` stores announcements with visibility and pinned state.
- `WebhookEvent` stores incoming OTA/channel-manager event payloads.

Naming conversion:

- Prisma fields use camelCase, for example `priceWeekday`.
- API JSON uses snake_case, for example `price_weekday`.
- Admin code should follow API JSON contracts, not Prisma field names.

## Admin Architecture

`apps/admin` is a Next.js App Router application with client-side API calls. It uses:

- `src/lib/api.ts` for base URL and API helpers.
- `src/context/AuthContext.tsx` for login/session/CSRF state.
- `src/components/BookingCalendar.tsx` for custom room/date grid view.
- `src/components/BookingList.tsx` for list view sorted by closest upcoming bookings.

The admin app cannot inspect the API HttpOnly session cookie from middleware when API and admin are on different hostnames. Auth gating is therefore handled in the app context and API responses.

## Local Development

API:

```bash
npm run dev --workspace @8688bnb/api
```

Admin:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3333/api/v1 npm run dev --workspace @8688bnb/admin
```

Website:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3333/api/v1 npm run dev --workspace @8688bnb/website
```

Use port 3001 for admin and 3000 for website. `NEXT_PUBLIC_API_URL` must be browser-reachable, for example `https://api.8688bnb.com/api/v1` in production.
