# =============================================================================
# 86.88 B&B — Next.js Production Dockerfile (Monorepo)
# =============================================================================
# Multi-stage build optimized for Turborepo and npm workspaces.
#
# Build:  docker compose build website (from infra/docker-compose.yml)
# Run:    docker compose up -d website
# =============================================================================

# ── Stage 1: Prune ───────────────────────────────────────────────────────────
FROM node:22-alpine AS pruner
RUN apk add --no-cache libc6-compat
RUN npm install -g turbo@^2.1.2
WORKDIR /app
COPY . .
# This extracts only the necessary files to build the "website" app
RUN turbo prune website --docker

# ── Stage 2: Build the application ──────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat

# Copy package.json files for dependencies
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
# Install dependencies
RUN npm ci

# Copy the actual source files
COPY --from=pruner /app/out/full/ .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the website
RUN npx turbo run build --filter=website

# ── Stage 3: Production runner ──────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy static assets
COPY --from=builder /app/apps/website/public ./apps/website/public

# Setup Next cache directory
RUN mkdir -p apps/website/.next && \
    chown nextjs:nodejs apps/website/.next

# Copy the standalone server
# Note: Next.js standalone mode mirrors the monorepo structure
COPY --from=builder --chown=nextjs:nodejs /app/apps/website/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/website/.next/static ./apps/website/.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start the standalone server from the correct apps/website path
CMD ["node", "apps/website/server.js"]
