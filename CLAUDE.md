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
```

## GitHub Packages setup

The app consumes `@glebremniov/budget-buddy-contracts` (TypeScript types from OpenAPI spec). To install locally:

```bash
export GITHUB_TOKEN=your-personal-access-token  # needs read:packages scope
pnpm install
```

The `.npmrc` routes `@glebremniov:*` to `npm.pkg.github.com`. In GitHub Actions, the `GITHUB_TOKEN` secret is automatically available.

### Schema Types

All TypeScript types come from `@glebremniov/budget-buddy-contracts/models`:

```typescript
import type { 
  Transaction, TransactionWrite, TransactionUpdate,
  Category, CategoryWrite, CategoryUpdate,
  AuthToken, LoginRequest, RegisterRequest,
  PaginatedTransactions, PaginatedCategories
} from '@glebremniov/budget-buddy-contracts/models'
```

Types are generated from the OpenAPI spec and published to GitHub Packages. To regenerate:
```bash
# In the contracts repo
pnpm run generate:ts
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
    ui/             # shadcn/ui primitives (Button, Input, Card, Badge, Separator)
    layout/         # AppShell, Header, MobileNav + SidebarNav
  hooks/
    useTransactions.ts   # TanStack Query hooks for /v1/transactions
    useCategories.ts     # TanStack Query hooks for /v1/categories
  stores/
    auth.store.ts   # Zustand: accessToken (memory) + refreshToken (localStorage)
    theme.store.ts  # Zustand: light/dark/system preference (localStorage)
  lib/
    api.ts          # Axios instance with auth interceptor + automatic token refresh
    query-client.ts # TanStack QueryClient singleton
    formatters.ts   # formatCurrency (minor units), formatDate, toMinorUnits, todayIso
    cn.ts           # clsx + tailwind-merge utility
```

## Auth flow

1. **Access token** — stored in Zustand (in-memory only, cleared on page refresh)
2. **Refresh token** — persisted to `localStorage` (API requires it in request body)
3. On 401: `api.ts` interceptor calls `POST /v1/auth/refresh` automatically, retries the original request, queues concurrent 401s
4. On refresh failure: clears auth store, redirects to `/login`
5. Route guard in `_app.tsx` (`beforeLoad`) redirects unauthenticated users to `/login`

## Adding a new feature

1. Add types to `@glebremniov/budget-buddy-contracts` (in contracts repo)
2. Publish new version to GitHub Packages
3. Update web-app: `pnpm add @glebremniov/budget-buddy-contracts@new-version`
4. Create `src/hooks/use<Feature>.ts` with TanStack Query hooks (import types from contracts)
5. Add route file(s) under `src/routes/_app/<feature>/`
6. Add nav link to `MobileNav.tsx`

## Theming

Tailwind v4 uses CSS custom properties defined in `src/index.css` under `@theme`. The `dark` class on `<html>` switches all tokens. `theme.store.ts` manages the toggle and persists to localStorage.

## API

Proxied to `VITE_API_URL` (default: `http://localhost:8080`). Copy `.env.example` to `.env.local` to configure. The Budget Buddy API requires `spring.profiles.active=dev` to auto-start PostgreSQL.

Currency amounts are **minor units** (integer): `1299` = €12.99. Use `formatCurrency(minorUnits)` to display and `toMinorUnits(decimal)` when writing.
