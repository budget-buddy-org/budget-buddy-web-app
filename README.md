# Budget Buddy — Web App

React 19 frontend for the Budget Buddy personal finance app. Features transaction and category management, a monthly spending dashboard with expenses by category, and real-time feedback with a global notification system.

## Prerequisites

- Node.js 20+
- pnpm
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

- `VITE_OIDC_ISSUER` — OIDC issuer URL (e.g. your Zitadel issuer)
- `VITE_OIDC_CLIENT_ID` — frontend SPA client ID

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

Multi-stage build: `base` → `deps` (pnpm install with BuildKit secret + pnpm store cache) → `builder` (Vite build) → `production` (nginx:1.29-alpine).

Runtime configuration is injected via `docker-entrypoint.sh` from environment variables using `envsubst`.

```bash
# Build image — GITHUB_TOKEN passed as a BuildKit secret (never stored in any layer)
docker build \
  --secret id=github_token,env=GITHUB_TOKEN \
  -t budget-buddy-web-app .

# Run locally with Docker Compose (app available at http://localhost:3000)
# VITE_API_URL and OIDC vars are injected into the container at runtime
GITHUB_TOKEN=$(gh auth token) \
VITE_API_URL=http://localhost:8080 \
VITE_OIDC_ISSUER=https://issuer.example.com \
VITE_OIDC_CLIENT_ID=web-client \
docker compose up --build
```

`VITE_API_URL`, `VITE_OIDC_ISSUER`, and `VITE_OIDC_CLIENT_ID` are injected into the container at runtime — no need to rebuild the image when these values change.

Pre-built images are published to `ghcr.io/budget-buddy-org/budget-buddy-web-app` on every merge to `main` and every GitHub Release.

## Deployment

See [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) for production deployment instructions and environment setup.

## Architecture notes

See [CLAUDE.md](./CLAUDE.md) for detailed guidance on the project structure, auth flow, adding features, and conventions.

The app consumes `@budget-buddy-org/budget-buddy-contracts` for typed API clients and model types. Currency amounts are stored as **minor units** (`1299` = €12.99).
