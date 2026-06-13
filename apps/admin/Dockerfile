# =============================================================================
# 86.88 B&B — Next.js Admin Dashboard Dockerfile (Monorepo)
# =============================================================================
# Multi-stage build optimized for Turborepo and npm workspaces.
# Uses `turbo prune` to extract only the files needed for @8688bnb/admin.
#
# Build:  docker compose build admin        (from infra/)
# Run:    docker compose up -d admin
# =============================================================================

# ── Stage 1: Prune ───────────────────────────────────────────────────────────
FROM node:22-alpine AS pruner
RUN apk add --no-cache libc6-compat
RUN npm install -g turbo@^2.1.2
WORKDIR /app
COPY . .
RUN turbo prune @8688bnb/admin --docker

# ── Stage 2: Build the application ──────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat

# Copy pruned package.json files first (better layer caching)
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json

# Install dependencies (frozen lockfile for reproducibility)
# Use --ignore-scripts if bcrypt fails in the api workspace during install
RUN npm ci --ignore-scripts

# Copy the actual source files
COPY --from=pruner /app/out/full/ .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build only the admin app and its internal dependencies
RUN npx turbo run build --filter=@8688bnb/admin

# ── Stage 3: Production runner (minimal image) ─────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Security: run as non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy static assets (if any, typically from public)
COPY --from=builder /app/apps/admin/public ./apps/admin/public

# Setup Next.js cache directory
RUN mkdir -p apps/admin/.next && \
    chown nextjs:nodejs apps/admin/.next

# Copy the standalone server (Next.js mirrors the monorepo structure)
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin/.next/static ./apps/admin/.next/static

USER nextjs

EXPOSE 3001
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/login || exit 1

# Start the standalone server from the correct monorepo path
CMD ["node", "apps/admin/server.js"]
