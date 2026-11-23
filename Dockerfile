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
FROM cgr.dev/chainguard/node:latest-dev@sha256:8e8d45dd674724ccc71aed270223c3e2efc74edde6c841158d618d2baaaf5527 AS base

USER root
ARG NODE_VERSION
RUN test "$(node --version)" = "v${NODE_VERSION}"

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
# CI supplies both versions from the shared policy; local builds use packageManager.
ARG PNPM_VERSION
RUN --mount=type=bind,source=package.json,target=/tmp/package.json \
    version="${PNPM_VERSION:-$(node -p "require('/tmp/package.json').packageManager.split('@')[1].split('+')[0]")}" \
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
RUN --mount=type=secret,id=github_token,required=true \
    --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    --mount=type=tmpfs,target=/tmp/npm-auth \
    printf '//npm.pkg.github.com/:_authToken=%s\n' "$(cat /run/secrets/github_token)" > /tmp/npm-auth/npmrc \
    && NPM_CONFIG_USERCONFIG=/tmp/npm-auth/npmrc pnpm fetch \
    && NPM_CONFIG_USERCONFIG=/tmp/npm-auth/npmrc pnpm install --frozen-lockfile --offline

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
FROM --platform=$BUILDPLATFORM cgr.dev/chainguard/go:latest@sha256:b42c64f7559093cf20910fc6fe750884dd55c74057a16cbeedbba42c4f9b31f8 AS runtime-builder
USER root
WORKDIR /src
COPY docker/runtime*.go ./
RUN GO111MODULE=off go test .
ARG TARGETOS
ARG TARGETARCH
RUN CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH go build -trimpath -ldflags="-s -w" -o /runtime runtime.go

FROM cgr.dev/chainguard/nginx:latest@sha256:c1642395cc75f39c931d66d939f7e78cbdf671d6cfd821616632b0639c3c6d63 AS production
LABEL org.opencontainers.image.source="https://github.com/budget-buddy-org/budget-buddy-web-app"
COPY --from=runtime-builder /runtime /usr/local/bin/runtime
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx.security-headers.conf.template /etc/nginx/security-headers.conf.template
COPY --from=builder /app/dist /usr/share/nginx/html
USER 65532:65532
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/runtime"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD ["/usr/local/bin/runtime", "healthcheck"]
