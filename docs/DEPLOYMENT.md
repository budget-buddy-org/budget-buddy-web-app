# Deployment Guide

This guide covers deploying the Budget Buddy web app to production. The app is a static single-page application (SPA) built with Vite — any static hosting service works.

## Environment variables

Set these before building or in your hosting platform's dashboard:

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_URL` | Yes | `http://localhost:8080` | Base URL of the Budget Buddy API |

Vite only embeds variables prefixed with `VITE_` into the build. All other env vars are ignored at build time.

For local development: copy `.env.example` to `.env.local` and set `VITE_API_URL` to your API server.

## Build

```bash
pnpm install
pnpm build       # outputs to dist/
```

The `dist/` directory is a fully self-contained static bundle. Serve it from any static host.

**Important:** configure your host to serve `index.html` for all routes (SPA fallback) — otherwise direct navigation to `/transactions` or `/categories` will return 404.

---

## Option 1 — Vercel

The simplest zero-config option.

1. Push the repo to GitHub (already done).
2. Go to [vercel.com](https://vercel.com), click **Add New Project**, and import the repo.
3. Vercel auto-detects Vite. Confirm:
   - **Framework preset:** Vite
   - **Build command:** `pnpm build`
   - **Output directory:** `dist`
   - **Install command:** `pnpm install`
4. Under **Environment Variables**, add `VITE_API_URL` pointing to your production API.
5. Click **Deploy**.

Vercel handles SPA routing automatically. Every push to `main` triggers a new deployment.

### GitHub Packages token

The build installs `@glebremniov/budget-buddy-contracts` from `npm.pkg.github.com`, which requires authentication. Add a GitHub token with `read:packages` scope as an environment variable named `GITHUB_TOKEN` in the Vercel project settings. The `.npmrc` file in the repo already configures the registry; Vercel will pick up the token automatically.

---

## Option 2 — Netlify

1. Push the repo to GitHub.
2. Go to [netlify.com](https://netlify.com), click **Add new site → Import an existing project**.
3. Connect GitHub and select the repo.
4. Configure:
   - **Build command:** `pnpm build`
   - **Publish directory:** `dist`
5. Under **Site settings → Environment variables**, add `VITE_API_URL` and `GITHUB_TOKEN` (same token as above).
6. Click **Deploy site**.

Add a `netlify.toml` at the repo root for SPA routing:

```toml
[[redirects]]
  from = "/*"
  to   = "/index.html"
  status = 200
```

---

## Option 3 — Docker

Use this option when you need a containerised deployment (Kubernetes, self-hosted VPS, etc.).

The repo includes a production-ready `Dockerfile` and `docker-compose.yml`. The build uses four stages:

| Stage | Base | Purpose |
|---|---|---|
| `base` | node:22-alpine | Shared pnpm setup |
| `deps` | base | Install packages (BuildKit secret + pnpm store cache) |
| `builder` | base | `pnpm build` — Vite SPA bundle |
| `production` | nginx:1.27-alpine | Serve static assets; includes security headers and SPA fallback |

`GITHUB_TOKEN` is passed as a [BuildKit secret](https://docs.docker.com/build/secrets/) — it is mounted at build time only and never written to any image layer or visible in `docker history`.

### Build and run

**Standalone:**

```bash
docker build \
  --secret id=github_token,env=GITHUB_TOKEN \
  --build-arg VITE_API_URL=https://api.yourdomain.com \
  -t budget-buddy-web-app .

docker run -p 3000:80 budget-buddy-web-app
```

**Docker Compose (recommended for local testing):**

```bash
GITHUB_TOKEN=$(gh auth token) VITE_API_URL=http://localhost:8080 docker compose up --build
# App available at http://localhost:3000
```

`WEB_PORT` overrides the host port (default: `3000`):

```bash
WEB_PORT=8081 GITHUB_TOKEN=$(gh auth token) VITE_API_URL=http://localhost:8080 docker compose up --build
```

For production, push the image to a registry and deploy from there.

---

## CI

GitHub Actions runs on every PR and push to `main`. See [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) for the full pipeline:

- Lint (Biome)
- Type-check (tsc)
- Build (Vite)
- Tests (Vitest)
