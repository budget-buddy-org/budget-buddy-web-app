# syntax=docker/dockerfile:1.7
#
# Build (BuildKit required — enabled by default in Docker 23+):
#
#   docker build \
#     --secret id=github_token,env=GITHUB_TOKEN \
#     -t budget-buddy-web-app .
#
# The VITE_API_URL is no longer injected at build time. Pass it as a runtime
# environment variable to the container instead:
#
#   docker run -e VITE_API_URL=https://api.example.com -p 8080:80 budget-buddy-web-app

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
    echo "//npm.pkg.github.com/:_authToken=$(cat /run/secrets/github_token)" >> ~/.npmrc \
    && pnpm fetch \
    && pnpm install --frozen-lockfile --offline \
    && sed -i '/npm\.pkg\.github\.com/d' ~/.npmrc

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — builder: compile the Vite SPA
# ─────────────────────────────────────────────────────────────────────────────
FROM base AS builder

WORKDIR /app

# Reuse the fully-populated node_modules from the deps stage.
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 3 — production: serve the static bundle with Nginx
# ─────────────────────────────────────────────────────────────────────────────
FROM nginx:1.29-alpine AS production

LABEL org.opencontainers.image.source="https://github.com/budget-buddy-org/budget-buddy-web-app"

# Create the snippets directory and copy the security-headers template.
# docker-entrypoint.sh runs envsubst at startup to produce the final
# security-headers.conf with the runtime OIDC issuer baked into the CSP.
RUN mkdir -p /etc/nginx/snippets
COPY --link nginx.security-headers.conf.template /etc/nginx/snippets/security-headers.conf.template

# Replace default config with our SPA-aware configuration.
COPY --link nginx.conf /etc/nginx/conf.d/default.conf

# Copy the compiled assets. --link decouples this layer from the builder stage
# so it can be cached independently.
COPY --link --from=builder /app/dist /usr/share/nginx/html

# Install gettext for envsubst
RUN apk add --no-cache gettext

# Copy and set the entrypoint for runtime configuration injection
COPY --link docker/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]

# Lightweight liveness check — wget is already included in nginx:alpine.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q --spider http://localhost/ || exit 1
