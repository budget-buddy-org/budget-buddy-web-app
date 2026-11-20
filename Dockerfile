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
#   docker run -e VITE_API_URL=https://api.example.com -p 8080:8080 budget-buddy-web-app

# ─────────────────────────────────────────────────────────────────────────────
# Base — shared pnpm setup reused by deps and builder
# ─────────────────────────────────────────────────────────────────────────────
ARG NODE_VERSION=26.13.1
FROM cgr.dev/chainguard/node:latest-dev AS base
ARG NODE_VERSION

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
# CI supplies both versions from the shared policy; local builds use packageManager.
ARG PNPM_VERSION
USER root
RUN --mount=type=bind,source=package.json,target=/tmp/package.json \
    test "$(node --version)" = "v${NODE_VERSION}" \
    && version="${PNPM_VERSION:-$(node -p "require('/tmp/package.json').packageManager.split('@')[1].split('+')[0]")}" \
    && npm install --global "pnpm@$version"

# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — deps: resolve and install npm packages
# ─────────────────────────────────────────────────────────────────────────────
FROM base AS deps

WORKDIR /app

# Copy registry config and lockfile first so the cache layer below is only
# invalidated when these two files change.
COPY .npmrc package.json pnpm-lock.yaml pnpm-workspace.yaml ./

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
ARG APP_VERSION

# Reuse the fully-populated node_modules from the deps stage.
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 3 — production: serve the static bundle with Nginx
# ─────────────────────────────────────────────────────────────────────────────
FROM cgr.dev/chainguard/nginx:latest-dev AS production

LABEL org.opencontainers.image.source="https://github.com/budget-buddy-org/budget-buddy-web-app"

# The development variant provides envsubst, a shell, and su-exec. The entrypoint
# renders runtime config as root, then drops to UID 65532 before starting nginx.
USER root
RUN apk add --no-cache gettext-envsubst su-exec \
    && mkdir -p /etc/nginx/snippets \
    && sed -i '/^user[[:space:]]/d; s|^[[:space:]]*error_log .*;|error_log stderr notice;|; s|^[[:space:]]*access_log .*;|access_log off;|' /etc/nginx/nginx.conf \
    && chown 0:0 /etc/nginx/snippets /usr/share/nginx/html \
    && chmod 0555 /etc/nginx/snippets /usr/share/nginx/html

COPY --link --chown=0:0 --chmod=0444 nginx.security-headers.conf.template /etc/nginx/snippets/security-headers.conf.template

# Replace default config with our SPA-aware configuration.
COPY --link --chown=0:0 --chmod=0444 nginx.conf /etc/nginx/conf.d/default.conf

# Copy the compiled assets. --link decouples this layer from the builder stage
# so it can be cached independently.
COPY --link --chown=0:0 --from=builder /app/dist /usr/share/nginx/html
RUN find /usr/share/nginx/html -type d -exec chmod 0555 {} + \
    && find /usr/share/nginx/html -type f -exec chmod 0444 {} + \
    && touch /usr/share/nginx/html/config.json \
    && chown 65532:65532 /usr/share/nginx/html/config.json \
    && chmod 0644 /usr/share/nginx/html/config.json

# Copy and set the entrypoint for runtime configuration injection
COPY --link --chown=0:0 --chmod=0555 docker/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["nginx", "-c", "/etc/nginx/nginx.conf", "-g", "daemon off;"]

# wget is available in the Chainguard nginx development variant.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD su-exec 65532:65532 wget -q --spider http://localhost:8080/ || exit 1
