# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# One-time setup: add GitHub token to ~/.npmrc for private package access
echo "//npm.pkg.github.com/:_authToken=ghp_<your-token>" >> ~/.npmrc

pnpm install
cp .env.example .env.local   # set VITE_API_URL if needed

pnpm dev           # Vite dev server at http://localhost:5173
pnpm build         # type-check + production build
pnpm lint          # Biome lint
pnpm format        # Biome auto-format (writes files)
pnpm test          # Vitest run once
pnpm test:watch    # Vitest watch mode
pnpm type-check    # tsc --noEmit
```

Run a single test file:
```bash
pnpm vitest run src/hooks/useTransactions.test.ts
```

## Architecture

### Routing

TanStack Router v1 with file-based routing. Routes live in `src/routes/`. The route tree is auto-generated into `src/routeTree.gen.ts` by the Vite plugin — never edit that file by hand.

Two layout routes act as auth guards:
- `_app.tsx` — requires authentication (`isAuthenticated()`); redirects to `/login` if not. Wraps pages in `AppShell`.
- `_auth.tsx` — redirects already-authenticated users to `/`.

Child routes are nested under these layouts by naming convention (`_app/`, `_auth/`).

### API Client

`src/lib/api.ts` creates a single Axios instance (`apiClient`) used by all API calls. It:
- Attaches the access token from Zustand to every request
- On 401: queues concurrent requests, attempts a token refresh via `/v1/auth/refresh`, then replays queued requests; on refresh failure, clears auth and redirects to `/login`

Typed API clients (`authApi`, `categoriesApi`, `transactionsApi`) are instantiated from `@budget-buddy-org/budget-buddy-contracts` and share the same Axios instance.

### Server State

TanStack Query v5. All query/mutation logic lives in hooks under `src/hooks/`. Each domain hook file (e.g. `useTransactions.ts`, `useCategories.ts`) exports a `KEYS` object for consistent cache key management, plus hooks for list, detail, create, update, and delete. Delete mutations use optimistic updates with rollback via `onMutate`/`onError`.

Global error logging is wired into `QueryCache` and `MutationCache` in `src/lib/query-client.ts` — don't add duplicate error reporting inside individual hooks.

Default query `staleTime` is 1 minute; `retry` is 1.

### Auth State

Zustand store in `src/stores/auth.store.ts` with `persist` middleware. Only `refreshToken` and `refreshTokenObtainedAt` are persisted to `localStorage` under the key `budget-buddy-auth`. The `accessToken` lives in memory only and is re-obtained via refresh on page load.

### UI Components

shadcn/ui pattern: Radix UI primitives + Tailwind v4. Shared primitives live in `src/components/ui/`. Layout components (`AppShell`, `Header`, `MobileNav`) are in `src/components/layout/`. The `@` alias maps to `src/`.

### Data Conventions

Currency amounts are stored and sent as **minor units** (integers). `1299` = €12.99. Use `src/lib/formatters.ts` for display formatting.

### Tests

Vitest + Testing Library, jsdom environment. Setup file at `src/test/setup.ts` provides a `localStorage` mock for Zustand persist. Tests are colocated with their source files (e.g. `useTransactions.test.ts` next to `useTransactions.ts`).

### Linting / Formatting

Biome handles both lint and format (single quotes, 2-space indent, 100 char line width). ESLint is also present for React-specific rules. Run `pnpm lint` before committing.