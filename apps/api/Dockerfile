# =============================================================================
# 86.88 B&B — Express API Production Dockerfile (Monorepo)
# =============================================================================
# Multi-stage build optimized for Turborepo and npm workspaces.
# Uses `turbo prune` to extract only the files needed for @8688bnb/api.
#
# Build:  docker compose build api       (from infra/)
# Run:    docker compose up -d api
# =============================================================================

# ── Stage 1: Prune ───────────────────────────────────────────────────────────
# Extracts only the workspace files needed to build @8688bnb/api + @8688bnb/db.
FROM node:22-alpine AS pruner
RUN apk add --no-cache libc6-compat
RUN npm install -g turbo@^2.1.2
WORKDIR /app
COPY . .
RUN turbo prune @8688bnb/api --docker

# ── Stage 2: Install & Build ────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat python3 make g++

# Copy pruned package.json files first (better layer caching)
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json

# Install ALL dependencies (including devDeps needed for tsc + prisma generate)
RUN npm install --no-audit --no-fund --ignore-scripts

# Copy the actual source files
COPY --from=pruner /app/out/full/ .

ENV NODE_ENV=production

# Generate the Prisma client from the @8688bnb/db schema
RUN ./packages/db/node_modules/.bin/prisma generate --schema=packages/db/prisma/schema.prisma

# Build the db package first (api depends on it), then the api
RUN npx turbo run build --filter=@8688bnb/api

# ── Stage 3: Production dependencies only ───────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat python3 make g++

COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json

# Install dependencies needed by Prisma postinstall/generate in the pruned workspace.
RUN npm install --no-audit --no-fund --ignore-scripts

# Re-generate Prisma client in the prod node_modules
COPY --from=pruner /app/out/full/packages/db/prisma ./packages/db/prisma
RUN ./packages/db/node_modules/.bin/prisma generate --schema=packages/db/prisma/schema.prisma

# ── Stage 4: Production runner (minimal image) ─────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Security: run as non-root user
RUN addgroup --system --gid 1001 apigroup && \
    adduser --system --uid 1001 apiuser

# Copy production node_modules (with Prisma client generated)
COPY --from=deps /app/node_modules ./node_modules

# Copy compiled API output
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

# Copy compiled db package output
COPY --from=builder /app/packages/db/dist ./packages/db/dist
COPY --from=builder /app/packages/db/package.json ./packages/db/package.json

# Copy root package.json for workspace resolution
COPY --from=builder /app/package.json ./package.json

# Create uploads directory for media
RUN mkdir -p /app/uploads/images && chown -R apiuser:apigroup /app/uploads

USER apiuser

EXPOSE 3333
ENV API_PORT=3333

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3333/api/v1/health || exit 1

# Start the compiled API server
CMD ["node", "apps/api/dist/index.js"]
