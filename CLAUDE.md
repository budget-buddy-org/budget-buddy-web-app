# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # start Vite dev server (http://localhost:5173)
pnpm build        # type-check + production build
pnpm lint         # Biome lint check
pnpm format       # Biome auto-format
pnpm test         # Vitest (run once)
pnpm test:watch   # Vitest (watch mode)
pnpm type-check   # tsc --noEmit

# Run a single test file
pnpm test src/hooks/useTransactions.test.ts
# Run tests matching a name pattern
pnpm test -- -t "should return transactions"
```

## GitHub Packages setup

The app consumes `@glebremniov/budget-buddy-contracts` (TypeScript types + generated API clients from the OpenAPI spec), published to `npm.pkg.github.com`.

**Local dev:** export your GitHub token so pnpm can read it via the `.npmrc` `${GITHUB_TOKEN}` interpolation:

```bash
export GITHUB_TOKEN=$(gh auth token)   # or paste your token directly
pnpm install
```

**CI:** GitHub Actions sets `GITHUB_TOKEN` automatically — no extra configuration needed.

### Contracts package — types and API clients

`@glebremniov/budget-buddy-contracts` exports both model types and fully-typed axios API client classes generated from the OpenAPI spec.

**Import API client instances** (from `src/lib/api.ts`):

```typescript
import { authApi, categoriesApi, transactionsApi } from '@/lib/api'

// Usage — typed, no URL strings
const { data } = await transactionsApi.listTransactions({ limit: 20, sort: 'desc' })
const { data } = await categoriesApi.createCategory({ categoryWrite: body })
const { data } = await authApi.loginUser({ loginRequest: { username, password } })
```

**Import types directly** when needed:

```typescript
import type {
  Transaction, TransactionWrite, TransactionUpdate,
  Category, CategoryWrite, CategoryUpdate,
  AuthToken, LoginRequest, RegisterRequest,
  PaginatedTransactions, PaginatedCategories
} from '@glebremniov/budget-buddy-contracts'
```

**Looking up available API methods:** the top-level `dist/api.d.ts` is a re-export barrel and does not list method signatures. Read the per-resource files instead:

```
node_modules/@glebremniov/budget-buddy-contracts/dist/api/auth-api.d.ts
node_modules/@glebremniov/budget-buddy-contracts/dist/api/categories-api.d.ts
node_modules/@glebremniov/budget-buddy-contracts/dist/api/transactions-api.d.ts
```

Model types live under `dist/model/<name>.d.ts` (e.g. `dist/model/auth-token.d.ts`).

To regenerate after an OpenAPI spec change:
```bash
# In the contracts repo
pnpm run generate:ts
# Then publish a new version and update the dep here:
pnpm add @glebremniov/budget-buddy-contracts@new-version
```

## Stack

- **Vite** + **React 19** + **TypeScript** (strict)
- **TanStack Router v1** — file-based routing in `src/routes/`
- **TanStack Query v5** — all server state (caching, mutations)
- **Zustand v5** — auth token (in-memory) + theme preference (localStorage)
- **shadcn/ui** (Radix UI + Tailwind v4) — copy-paste components in `src/components/ui/`
- **Biome** — replaces ESLint + Prettier
- **Vitest** + **Testing Library** — unit/component tests

## Project structure

```
src/
  routes/           # TanStack Router file-based routes (auto-generates routeTree.gen.ts)
    __root.tsx      # Root layout — mounts QueryClient devtools
    _auth.tsx       # Pathless layout: redirect to / if authenticated
    _auth/login.tsx, register.tsx
    _app.tsx        # Pathless layout: redirect to /login if not authenticated + AppShell
    _app/index.tsx  # Dashboard (/)
    _app/transactions/index.tsx
    _app/categories/index.tsx
  components/
    ui/             # shadcn/ui primitives (Button, Input, Card, Badge, Separator, Select, Skeleton)
    layout/         # AppShell, Header, MobileNav + SidebarNav
    ErrorBoundary.tsx  # React class error boundary — wraps subtrees; logs via error-logger; accepts optional `fallback` prop
  hooks/
    useTransactions.ts        # TanStack Query hooks for /v1/transactions
    useCategories.ts          # TanStack Query hooks for /v1/categories
    useLogout.ts              # Logout mutation: calls authApi.logoutUser(), clears auth + query cache, redirects
    useTabVisibilityRefresh.ts  # Proactively refreshes auth token on tab visibility if token is ≥6 days old
  stores/
    auth.store.ts   # Zustand: accessToken (memory) + refreshToken + refreshTokenObtainedAt (localStorage)
    theme.store.ts  # Zustand: light/dark/system preference (localStorage)
  lib/
    api.ts          # Axios instance + authApi / categoriesApi / transactionsApi instances
    query-client.ts # TanStack QueryClient singleton — logs query/mutation errors via error-logger
    formatters.ts   # formatCurrency (minor units), formatDate, toMinorUnits, todayIso
    cn.ts           # clsx + tailwind-merge utility
    error-logger.ts # logError(error, context?) — structured console logging; extend for remote reporting
  test/
    setup.ts        # Vitest setup: @testing-library/jest-dom + localStorage mock for Zustand persist
```

## Auth flow

1. **Access token** — stored in Zustand (in-memory only, cleared on page refresh)
2. **Refresh token** — persisted to `localStorage` (API requires it in request body)
3. On 401: `api.ts` interceptor calls `POST /v1/auth/refresh` automatically, retries the original request, queues concurrent 401s
4. On refresh failure: clears auth store, redirects to `/login`
5. Route guard in `_app.tsx` (`beforeLoad`) redirects unauthenticated users to `/login`

## Hook patterns

TanStack Query hooks follow a consistent `KEYS` object pattern for cache key management:
```typescript
const KEYS = {
  all: ['resource'] as const,
  list: (filters) => ['resource', 'list', filters] as const,
  detail: (id) => ['resource', id] as const,
}
```
Invalidate `KEYS.all` on mutations to refresh all related queries. `useDeleteTransaction` is the only hook using optimistic updates — it rolls back on error using `onMutate`/`onError`.

## Adding a new feature

1. Add types + API endpoints to `@glebremniov/budget-buddy-contracts` (in contracts repo), regenerate TS, publish new version
2. Update web-app: `pnpm add @glebremniov/budget-buddy-contracts@new-version`
3. Add a new API instance to `src/lib/api.ts` (e.g. `export const budgetApi = new BudgetApi(config, BASE_URL, apiClient)`)
4. Create `src/hooks/use<Feature>.ts` — call the typed API instance methods, wrap with TanStack Query
5. Add route file(s) under `src/routes/_app/<feature>/`
6. Add nav link to `MobileNav.tsx`

## Theming

Tailwind v4 uses CSS custom properties defined in `src/index.css` under `@theme`. The `dark` class on `<html>` switches all tokens. `theme.store.ts` manages the toggle and persists to localStorage.

## Docker

Multi-stage build: `deps` (pnpm install) → `builder` (Vite build) → `production` (nginx:alpine).

**Build the image:**
```bash
# GITHUB_TOKEN must be set — passed as a BuildKit secret, never stored in any image layer
docker build \
  --secret id=github_token,env=GITHUB_TOKEN \
  --build-arg VITE_API_URL=https://api.example.com \
  -t budget-buddy-web-app .
```

**Run locally with Docker Compose:**
```bash
GITHUB_TOKEN=$(gh auth token) VITE_API_URL=http://localhost:8080 docker compose up --build
# App available at http://localhost:3000
```

`VITE_API_URL` is baked into the bundle at build time (Vite limitation) — rebuild the image when the API URL changes.

## API

Proxied to `VITE_API_URL` (default: `http://localhost:8080`). Copy `.env.example` to `.env.local` to configure. The Budget Buddy API requires `spring.profiles.active=dev` to auto-start PostgreSQL.

Currency amounts are **minor units** (integer): `1299` = €12.99. Use `formatCurrency(minorUnits)` to display and `toMinorUnits(decimal)` when writing.
