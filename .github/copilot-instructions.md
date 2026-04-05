# Copilot Instructions

This document provides context for AI assistants (Copilot, Claude, etc.) working in this repository.

## Quick Commands

```bash
# Development
pnpm dev           # Start Vite dev server (http://localhost:5173)
pnpm build         # Type-check + production build
pnpm lint          # Biome lint check
pnpm format        # Biome auto-format

# Testing
pnpm test          # Run tests once
pnpm test:watch    # Run tests in watch mode
pnpm test:coverage # Run tests with coverage

# Type checking
pnpm type-check    # Type-check without emitting
```

## GitHub Packages Setup

This app consumes `@budget-buddy/contracts` from GitHub Packages. Before running `pnpm install`:

```bash
export GITHUB_TOKEN=your-personal-access-token  # needs read:packages scope
```

The `.npmrc` routes `@budget-buddy:*` to `npm.pkg.github.com` automatically.

## Architecture Overview

### Tech Stack
- **Vite** + **React 19** + **TypeScript** (strict mode)
- **TanStack Router v1** — file-based routing (auto-generates `routeTree.gen.ts`)
- **TanStack Query v5** — server state management, caching, mutations
- **Zustand v5** — client state (auth token in-memory, theme in localStorage)
- **Radix UI + Tailwind v4** — component library (shadcn/ui pattern)
- **Biome** — linting and formatting (replaces ESLint + Prettier)
- **Vitest + Testing Library** — unit and component tests

### Directory Structure

```
src/
  routes/           # TanStack Router file-based routes
    __root.tsx      # Root layout, mounts QueryClient devtools
    _auth.tsx       # Layout: redirects to / if authenticated
    _auth/login.tsx, register.tsx
    _app.tsx        # Layout: redirects to /login if unauthenticated, AppShell
    _app/index.tsx  # Dashboard (/)
    _app/transactions/index.tsx
    _app/categories/index.tsx
  components/
    ui/             # shadcn/ui primitives (Button, Input, Card, Badge, Separator)
    layout/         # AppShell, Header, MobileNav, SidebarNav
  hooks/
    useTransactions.ts   # TanStack Query hooks for /v1/transactions
    useCategories.ts     # TanStack Query hooks for /v1/categories
  stores/
    auth.store.ts   # Zustand: accessToken (memory) + refreshToken (localStorage)
    theme.store.ts  # Zustand: light/dark/system preference (localStorage)
  lib/
    api.ts          # Axios instance with auth interceptor + auto token refresh
    query-client.ts # TanStack QueryClient singleton
    formatters.ts   # formatCurrency, formatDate, toMinorUnits, todayIso
    cn.ts           # clsx + tailwind-merge utility
  types/
    api.ts          # TypeScript types derived from openapi.yaml
```

### Key Patterns

#### Authentication Flow
1. **Access token** stored in Zustand (in-memory, cleared on refresh)
2. **Refresh token** persisted to `localStorage` (included in API request body)
3. On 401: `api.ts` interceptor calls `POST /v1/auth/refresh` automatically, retries request, queues concurrent 401s
4. On refresh failure: clears auth store, redirects to `/login`
5. Route guard in `_app.tsx` (`beforeLoad`) redirects unauthenticated users to `/login`

#### Data Fetching
- All server state goes through TanStack Query hooks in `src/hooks/`
- Cache invalidation and mutations happen in hooks, not components
- Components import from hooks, never directly from API

#### Theming
- Tailwind v4 uses CSS custom properties in `src/index.css` under `@theme`
- `dark` class on `<html>` switches all tokens
- `theme.store.ts` manages toggle, persists to localStorage

#### Currency Handling
- **All amounts are minor units (integers)**: `1299` = €12.99
- Use `formatCurrency(minorUnits)` to display, `toMinorUnits(decimal)` when writing

### API Configuration
- Proxied to `VITE_API_URL` environment variable (default: `http://localhost:8080`)
- Copy `.env.example` to `.env.local` to configure
- The Budget Buddy API requires `spring.profiles.active=dev` to auto-start PostgreSQL

## Adding a New Feature

1. Add TypeScript types to `src/types/api.ts`
2. Create `src/hooks/use<Feature>.ts` with TanStack Query hooks
3. Add route file(s) under `src/routes/_app/<feature>/`
4. Add navigation link to `src/components/layout/MobileNav.tsx`

## Code Conventions

### Component Organization
- shadcn/ui components are copy-pasted into `src/components/ui/` and modified as needed
- Keep logic in hooks, presentation in components
- Use TypeScript strict mode throughout

### Import Aliases
- `@/` points to `src/` (configured in `vite.config.ts`)

### Linting & Formatting
- Biome handles all formatting (100-char line width, 2-space indent, single quotes)
- `src/routeTree.gen.ts` is auto-generated and ignored by Biome
- Always run `pnpm format` before committing

### Testing
- Use Vitest with jsdom environment
- Use Testing Library for component tests
- Test setup defined in `src/test/setup.ts` (imports `@testing-library/jest-dom`)

## Building & Deployment

```bash
pnpm build
```

This command:
1. Runs `tsc -b` for type-checking
2. Runs `vite build` for production bundling
3. Outputs to `dist/` directory
