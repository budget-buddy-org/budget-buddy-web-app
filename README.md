# Budget Buddy — Web App

React 19 frontend for the Budget Buddy personal finance app. Tracks transactions and categories with a typed API client generated from the OpenAPI spec.

## Prerequisites

- Node.js 20+
- pnpm
- A running [budget-buddy-api](../budget-buddy-api/) instance (or `VITE_API_URL` pointed elsewhere)
- GitHub Packages read access for `@glebremniov/budget-buddy-contracts`

## Setup

```bash
# One-time: add your GitHub token to ~/.npmrc
echo "//npm.pkg.github.com/:_authToken=ghp_<your-token>" >> ~/.npmrc

pnpm install
cp .env.example .env.local   # set VITE_API_URL if needed
pnpm dev                      # http://localhost:5173
```

## Commands

```bash
pnpm dev          # Vite dev server
pnpm build        # type-check + production build
pnpm lint         # Biome lint
pnpm format       # Biome auto-format
pnpm test         # Vitest (run once)
pnpm test:watch   # Vitest (watch mode)
pnpm type-check   # tsc --noEmit
```

## Stack

- **Vite** + **React 19** + **TypeScript** (strict)
- **TanStack Router v1** — file-based routing
- **TanStack Query v5** — server state, caching, mutations
- **Zustand v5** — auth tokens + theme preference
- **shadcn/ui** (Radix UI + Tailwind v4)
- **Biome** — lint + format
- **Vitest** + **Testing Library** — unit tests

## Docker

Multi-stage build: `base` → `deps` (pnpm install with BuildKit secret + pnpm store cache) → `builder` (Vite build) → `production` (nginx:1.29-alpine).

```bash
# Build image — GITHUB_TOKEN passed as a BuildKit secret (never stored in any layer)
docker build \
  --secret id=github_token,env=GITHUB_TOKEN \
  --build-arg VITE_API_URL=https://api.example.com \
  -t budget-buddy-web-app .

# Run locally with Docker Compose (app available at http://localhost:3000)
GITHUB_TOKEN=$(gh auth token) VITE_API_URL=http://localhost:8080 docker compose up --build
```

`VITE_API_URL` is baked into the bundle at build time — rebuild the image when the API URL changes.

Pre-built images are published to `ghcr.io/glebremniov/budget-buddy-web-app` on every merge to `main` and every GitHub Release.

## Deployment

See [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) for production deployment instructions and environment setup.

## Architecture notes

See [CLAUDE.md](./CLAUDE.md) for detailed guidance on the project structure, auth flow, adding features, and conventions.

The app consumes `@glebremniov/budget-buddy-contracts` for typed API clients and model types. Currency amounts are stored as **minor units** (`1299` = €12.99).
