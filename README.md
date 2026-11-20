# Budget Buddy — Web App

[![CI](https://github.com/budget-buddy-org/budget-buddy-web-app/actions/workflows/ci.yml/badge.svg)](https://github.com/budget-buddy-org/budget-buddy-web-app/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/budget-buddy-org/budget-buddy-web-app)](https://github.com/budget-buddy-org/budget-buddy-web-app/releases)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=budget-buddy-org_budget-buddy-web-app&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=budget-buddy-org_budget-buddy-web-app)

React 19 frontend for the Budget Buddy personal finance app. Features transaction and category management, a monthly spending dashboard with expenses by category, and real-time feedback with a global notification system.

## Prerequisites

- Node.js version from `.node-version` (also satisfies the `package.json` engine)
- pnpm version pinned in `package.json`
- A running [budget-buddy-api](../budget-buddy-api/) instance (or `VITE_API_URL` pointed elsewhere)
- GitHub Packages read access for `@budget-buddy-org/budget-buddy-contracts`

## Setup

```bash
# One-time: add your GitHub token to ~/.npmrc
echo "//npm.pkg.github.com/:_authToken=ghp_<your-token>" >> ~/.npmrc

pnpm install
cp .env.example .env.local   # set VITE_API_URL and OIDC vars
pnpm dev                      # http://localhost:5173
```

Required OIDC environment variables:

- `VITE_OIDC_ISSUER` — OIDC issuer URL (e.g. your Keycloak or Zitadel issuer)
- `VITE_OIDC_CLIENT_ID` — frontend SPA client ID
- `VITE_OIDC_SCOPES` — (optional) space-separated **extra** scopes appended to the OIDC protocol defaults (`openid profile email offline_access`). The defaults are always requested and cannot be disabled — use this only for IdP-specific audience or API resource scopes (e.g. `urn:zitadel:iam:org:project:id:my-api:aud`).
- `VITE_OIDC_USER_MANAGEMENT_URL` — (optional) URL for the identity provider's user management page (e.g. Account Center or Console).

## Commands

```bash
pnpm dev          # Vite dev server
pnpm build        # type-check + production build
pnpm lint         # ESLint + Biome lint
pnpm format       # Biome auto-format
pnpm test         # Vitest (run once)
pnpm test:watch   # Vitest (watch mode)
pnpm test:a11y    # Run accessibility tests
pnpm test:coverage # HTML coverage report in coverage/
pnpm type-check   # tsc --noEmit
pnpm preview      # Preview production build locally
```

## Stack

- **Vite** + **React 19** + **TypeScript** (strict)
- **TanStack Router v1** — file-based routing
- **TanStack Query v5** — server state, caching, mutations
- **react-oidc-context** — OIDC authentication
- **Zustand v5** — theme and appearance preferences
- **shadcn/ui** (Radix UI + Tailwind v4)
- **ESLint** + **Biome** — lint + format
- **Vitest** + **Testing Library** — unit tests

## Docker

Multi-stage build: Chainguard Node `latest-dev` builds the Vite bundle, then Chainguard nginx `latest-dev` serves it. The nginx development variant is used at runtime because it provides the shell, `envsubst`, and `wget` needed for runtime configuration injection and the container health check; nginx runs as its built-in non-root user on port `8080`.

Dependencies are installed with the pnpm store cache and a BuildKit secret for GitHub Packages. Runtime configuration is injected by `docker/docker-entrypoint.sh` using `envsubst`.

```bash
# Build image — GITHUB_TOKEN passed as a BuildKit secret (never stored in any layer)
docker build \
  --secret id=github_token,env=GITHUB_TOKEN \
  -t budget-buddy-web-app .

# Run locally (app available at http://localhost:3000)
docker run --rm -p 3000:8080 \
  -e VITE_API_URL=http://localhost:8081 \
  -e VITE_OIDC_ISSUER=https://issuer.example.com \
  -e VITE_OIDC_CLIENT_ID=web-client \
  -e VITE_OIDC_USER_MANAGEMENT_URL=https://issuer.example.com/ui/console/users/me \
  budget-buddy-web-app
```

`VITE_API_URL`, `VITE_OIDC_ISSUER`, `VITE_OIDC_CLIENT_ID`, `VITE_OIDC_SCOPES`, and `VITE_OIDC_USER_MANAGEMENT_URL` can be set at runtime — no image rebuild is needed when these values change.

Pre-built images are published to `ghcr.io/budget-buddy-org/budget-buddy-web-app` when a GitHub Release is published.

## Deployment targets

The app supports two deployment targets in parallel — neither path blocks the other.

### Cloudflare Pages (managed)

Static `dist/` is served from Cloudflare's edge. Runtime configuration is served by a Pages Function ([functions/config.json.ts](./functions/config.json.ts)) that reads CF environment variables — same shape as the Docker `envsubst` model, no rebuild needed when env values change.

- Required CF Pages env vars (set per Production / Preview environment in the dashboard): `VITE_API_URL`, `VITE_OIDC_ISSUER`, `VITE_OIDC_CLIENT_ID`, `VITE_OIDC_SCOPES`, `VITE_OIDC_USER_MANAGEMENT_URL`.
- HTTP headers and SPA fallback come from [public/_headers](./public/_headers) and [public/_redirects](./public/_redirects).
- The Pages Function is exercised on CF preview deployments; locally, `loadConfig()` falls back to `import.meta.env`, so the Function isn't run during `vite dev` / `vite preview`.

### Self-hosted (Docker on Raspberry Pi)

The multi-platform Docker image is published to `ghcr.io/budget-buddy-org/budget-buddy-web-app`. It is served by Chainguard nginx, with runtime configuration injected by `docker/docker-entrypoint.sh`.

## Architecture notes

See [AGENTS.md](./AGENTS.md) for repository conventions and development guidance.

The app consumes `@budget-buddy-org/budget-buddy-contracts` for typed API clients and model types. Currency amounts are stored as **minor units** (`1299` = €12.99).
