# AGENTS.md

## Project Context

This repo is the 86.88 B&B monorepo. Read these docs before larger changes:

- `docs/PROJECT_OVERVIEW.md`
- `docs/ARCHITECTURE.md`
- `docs/API_STATUS.md`
- `docs/ROADMAP.md`
- `docs/DEPLOY.md`

## Stack

- npm workspaces + Turborepo.
- `apps/website`: Next.js 16, React 19, TypeScript, CSS Modules.
- `apps/admin`: Next.js 16, React 19, TypeScript, CSS Modules, Traditional Chinese owner UI.
- `apps/api`: Express, TypeScript, Prisma, Redis, PostgreSQL.
- `packages/db`: Prisma schema and database client package.
- Deployment: Docker Compose, Nginx Proxy Manager, Cloudflare Tunnel.

## Development Notes

- Treat `apps/api/openapi.yaml` and `packages/db/prisma/schema.prisma` as source of truth for API/admin contracts.
- Admin API calls must use API JSON field names, usually snake_case.
- Admin production API URL must be browser-reachable, for example `https://api.8688bnb.com/api/v1`.
- Keep owner-facing admin text in Traditional Chinese.
- Prefer package choices already used by `apps/website` and `apps/admin`; add dependencies only when clearly useful.
- Use Docker builds for production confidence on the NAS.
- Use Conventional Commit prefixes for commits, for example `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`.

## Useful Checks

```bash
npm run build --workspace @8688bnb/api
npm exec -- tsc --project apps/admin/tsconfig.json --noEmit
docker compose -f infra/docker-compose.yml build api admin
```

## Safety

- Do not commit `.env`.
- Do not expose Nginx Proxy Manager port 81 through Cloudflare Tunnel.
- Do not revert unrelated worktree changes.
