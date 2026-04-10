# syntax=docker/dockerfile:1.7
#
# Build (BuildKit required — enabled by default in Docker 23+):
#
#   docker build \
#     --secret id=github_token,env=GITHUB_TOKEN \
#     --build-arg VITE_API_URL=https://api.example.com \
#     -t budget-buddy-web-app .
#
# The GITHUB_TOKEN secret is mounted at build time only and never written
# to any image layer or appears in `docker history`.

# ─────────────────────────────────────────────────────────────────────────────
# Base — shared pnpm setup reused by deps and builder
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable pnpm

# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — deps: resolve and install npm packages
# ─────────────────────────────────────────────────────────────────────────────
FROM base AS deps

WORKDIR /app

# Copy registry config and lockfile first so the cache layer below is only
# invalidated when these two files change.
COPY .npmrc package.json pnpm-lock.yaml ./

# 1. Mount the GitHub token as a BuildKit secret (never stored in any layer).
# 2. Mount the pnpm content-addressable store as a persistent cache so that
#    packages already fetched on a previous build are reused without a network
#    round-trip, even across `docker build --no-cache` runs.
# 3. pnpm fetch downloads every package listed in the lockfile into the store
#    without touching node_modules — this is the network-heavy step.
# 4. pnpm install --offline creates node_modules purely from the local store.
RUN --mount=type=secret,id=github_token \
    --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    export GITHUB_TOKEN="$(cat /run/secrets/github_token)" \
    && pnpm fetch \
    && pnpm install --frozen-lockfile --offline

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — builder: compile the Vite SPA
# ─────────────────────────────────────────────────────────────────────────────
FROM base AS builder

WORKDIR /app

# Reuse the fully-populated node_modules from the deps stage.
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# VITE_API_URL is injected at build time because Vite replaces import.meta.env.*
# references during bundling — there is no runtime configuration for these values.
# Pass the target API base URL when building for each environment, e.g.:
#   --build-arg VITE_API_URL=https://api.production.example.com
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 3 — production: serve the static bundle with Nginx
# ─────────────────────────────────────────────────────────────────────────────
FROM nginx:1.29-alpine AS production

LABEL org.opencontainers.image.source="https://github.com/budget-buddy-org/budget-buddy-web-app"

# Create the snippets directory and copy the shared security-headers snippet.
# nginx's add_header is not inherited by child location blocks that define their
# own add_header, so the snippet is included explicitly inside each location.
RUN mkdir -p /etc/nginx/snippets
COPY --link nginx.security-headers.conf /etc/nginx/snippets/security-headers.conf

# Replace default config with our SPA-aware configuration.
COPY --link nginx.conf /etc/nginx/conf.d/default.conf

# Copy the compiled assets. --link decouples this layer from the builder stage
# so it can be cached independently.
COPY --link --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# Lightweight liveness check — wget is already included in nginx:alpine.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q --spider http://localhost/ || exit 1
