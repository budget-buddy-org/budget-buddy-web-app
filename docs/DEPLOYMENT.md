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

### Dockerfile

```dockerfile
# Build stage
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json pnpm-lock.yaml .npmrc ./
RUN corepack enable && pnpm install --frozen-lockfile

COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm build

# Serve stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### nginx.conf (SPA fallback)

```nginx
server {
    listen 80;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Build and run

```bash
# GitHub token needed at build time to install the contracts package
docker build \
  --build-arg VITE_API_URL=https://api.yourdomain.com \
  --secret id=npm_token,src=<(echo "//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}") \
  -t budget-buddy-web-app .

docker run -p 8080:80 budget-buddy-web-app
```

For production, push the image to a registry and deploy from there.

---

## CI

GitHub Actions runs on every PR and push to `main`. See [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) for the full pipeline:

- Lint (Biome)
- Type-check (tsc)
- Build (Vite)
- Tests (Vitest)
