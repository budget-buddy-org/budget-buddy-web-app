# Agent Conventions & Guidance

This file provides guidance for AI agents (Claude Code, Junie, etc.) when working with this repository.

---

## Quick Start

**Stack:** React 19, Vite, TypeScript, TanStack Router + Query v5, Zustand, Tailwind v4 + shadcn/ui, `react-oidc-context`.

**Prerequisites:** the `@budget-buddy-org/budget-buddy-contracts` package is fetched from GitHub Packages — add a token to `~/.npmrc` once:

```bash
echo "//npm.pkg.github.com/:_authToken=ghp_<your-token>" >> ~/.npmrc
pnpm install
cp .env.example .env.local   # set VITE_API_URL if needed
pnpm dev                      # Vite dev server at http://localhost:5173
```

**Commands:**

```bash
pnpm lint            # ESLint (React rules) + Biome (lint + format check)
pnpm format          # Biome auto-format (writes files)
pnpm test            # Vitest run once
pnpm test:watch      # Vitest watch mode
pnpm test:a11y       # accessibility tests (vitest-axe)
pnpm test:coverage   # HTML coverage report in coverage/
pnpm build           # production build + tsc -b type check
pnpm type-check      # tsc --noEmit (tsconfig.app.json)
pnpm vitest run src/hooks/useTransactions.test.ts   # single test file
```

---

## Verification — run before a change is done

Run these in order and resolve everything they surface before declaring work complete:

```bash
pnpm lint     # ESLint + Biome
pnpm test     # Vitest (add pnpm test:a11y when touching routes/complex UI)
pnpm build    # production build + type check
```

Then **Sonar**, the same way: SonarCloud runs Automatic Analysis on every push/PR for project
`budget-buddy-org_budget-buddy-web-app`. Locally, use **SonarQube for IDE** (SonarLint) to catch issues before pushing;
agents with the SonarQube MCP should query the project's **quality gate status** and **new issues / security hotspots**
on the branch (or PR) and fix any that the change introduced. A change isn't done until the quality gate is green.

---

## Conventions

### Routing

TanStack Router v1, file-based, routes in `src/routes/`. The route tree auto-generates into `src/routeTree.gen.ts` — **never edit it by hand**.

- **Auth guard:** `_app.tsx` requires authentication; `ProtectedAppLayout` calls `useAuth()` and triggers `signinRedirect()` when unauthenticated. Child routes nest by naming convention (`_app/`, `_auth/`).
- **Code splitting:** page components live in `.lazy.tsx` siblings (`createLazyFileRoute`); the plain `.tsx` keeps only the `createFileRoute` stub (loaders/`beforeLoad`). Move implementations to `src/components/{page}/`. **Never put a component in the route definition file.**
- **Test colocation:** the router plugin ignores `*.test.tsx?` (`routeFileIgnorePattern`), so tests can sit next to route files.
- **Search params:** `validateSearch` uses explicit `typeof` checks, **not Zod** — Zod is not a dependency; don't add it just for URL params.

### API Client

`src/lib/api.ts` configures the OpenAPI-Fetch client from the contracts package:

- `client.setConfig` (in `src/main.tsx`, after `loadConfig()`) sets only `baseUrl`.
- `getAuthToken()` reads the current OIDC user and proactively calls `signinSilent()` when the token expires within 60s.
- On **401** it triggers `signinRedirect()` — except `/auth/*` paths, which are excluded to avoid callback redirect loops.
- Call the API via the standalone functional exports (`listTransactions`, `createCategory`, …) that share the global client.
- The router is created in `src/lib/router.ts` (not `main.tsx`) so `api.ts` can import it for navigation without a circular dependency.

### Server State

TanStack Query v5. All query/mutation logic lives in `src/hooks/`. Each domain hook file exports a `KEYS` object for cache keys plus list/detail/create/update/delete hooks. Delete mutations use optimistic updates with `onMutate`/`onError` rollback.

- **Create and update share one body type.** As of contracts `6.1.0` there are no partial `*Update` types: both mutations take the full `*Write` type and updates are **`PUT` (full replacement, not `PATCH`)**. Forms must submit a complete body, resending unchanged fields. To clear an optional field, send `null` (`description: null`, `monthlyBudget: null`) — **never omit it**.
- **Dashboard** composes three parallel fetches: `useCategoriesSummary` (per-category aggregation — source of truth for "Expenses by category"), `useMonthlySummary` (monthly income/expense/balance — source of truth for the summary cards), and `useTransactions({ size: 5 })`. Text search is server-side via the contracts `query` param — **never filter locally**.
- Global error logging is wired into `QueryCache`/`MutationCache` in `src/lib/query-client.ts` — don't duplicate it in hooks. Default `staleTime` 1 min, `retry` 1.

### Auth & Stores

- Auth via `react-oidc-context` + `oidc-client-ts`: in-memory tokens, silent renewal. The shared `UserManager` is exported from `src/lib/oidc.ts` for use outside React. `ProtectedAppLayout` guards routes and handles login redirects.
- `src/stores/theme.store.ts` — persists `theme`, `primaryHue` (0–360), `fontSize` (12–24) to `localStorage`; applies CSS variables to `:root` on rehydration.
- `src/stores/user-preferences.store.ts` — persists `currency` (ISO 4217 or `null` = auto), `dateFormat` (`'short'|'medium'|'long'`, default `'medium'`), `numberLocale` (BCP 47 or `null` = auto). `null` falls back to `localeCurrency()`/`browserLocale()` at call sites — the store never writes derived defaults.
- **Always subscribe with selectors** (`useThemeStore((s) => s.glassEffect)`), never the whole store, to avoid needless re-renders.

### UI Components

shadcn/ui pattern: Radix primitives + Tailwind v4. Shared primitives in `src/components/ui/`, layout in `src/components/layout/`. `@` aliases `src/`.

- **No `forwardRef`** — React 19 passes `ref` as a normal prop; type it directly (`ref?: React.Ref<HTMLInputElement>`).
- **`error` prop:** `Input`, `Select`, `AmountInput`, `DatePicker` accept `error?: boolean` for destructive styling — use `error={!!fieldError}`, not conditional classNames.
- Use Tailwind v4 **`size-N`** (`size-4`) over `h-4 w-4`.
- **Animations:** `@theme` tokens (`--animate-*`) and `@utility` directives in `src/index.css` — no raw `@keyframes` or `.animate-*`.
- **Radius tokens** (`@theme` in `src/index.css`): `rounded-pill` (buttons/FAB/nav/segmented/switch), `rounded-lg` 16px (cards/dialogs/sheets/toasts), `rounded-md` 12px (inputs/selects/dropdown surfaces), `rounded-sm` 8px (dropdown items/chips). `rounded-full` only for true circles.
- **Dark mode:** `getCategoryColor()` in `src/lib/categoryColor.ts` uses CSS `light-dark()`.
- **a11y:** icon-only buttons need `aria-label`; segmented controls use `role="tablist"/"tab"` + `aria-selected`; keep heading levels progressive; sheets respect `prefers-reduced-motion`.

### Data & Formatting

- Currency amounts are **minor units** (integers): `1299` = €12.99.
- In components, always use **`useFormatters()`** (`src/hooks/useFormatters.ts`) → `{ fmtCurrency, fmtDate }`, bound to the user's `numberLocale`/`dateFormat`. The pure functions in `src/lib/formatters.ts` take optional locale/style params for use outside React. `formatDate`'s third `style` param maps to `Intl.DateTimeFormat` `dateStyle` (default `'medium'`).

### Pagination

Infinite scroll for transactions (`InfiniteScrollSentinel` → `fetchNextPage` from `useInfiniteTransactions`); page-based for categories (reusable `Pagination` in `src/components/ui/pagination.tsx`, auto-hides when `totalPages <= 1`). Both read `meta.total` from the API.

### Transaction Filters

URL search params are the source of truth. Validation lives in `src/routes/_app/transactions/index.tsx` (`validateSearch`, `typeof`-based, no Zod). Params: `page`, `categoryId`, `start`, `end`, `sort`, `type`, `query`, `amountMin`, `amountMax`. **Amount params are minor units** (integers ≥1) — convert via `toMinorUnits` / `/100`. Empty inputs must be `undefined`, never `''` or `0`. The search box debounces via `useDebouncedValue` (300ms default; generic, reuse it).

### Error Handling

- Wrap UI in `src/components/ErrorBoundary.tsx`; use `errorComponent` for route-level errors. Both show a generic message with toggleable technical details.
- All boundary/route errors log via `src/lib/error-logger.ts`; global query/mutation errors via `src/lib/query-client.ts`. Global `error`/`unhandledrejection` listeners in `main.tsx` are guarded with `import.meta.hot.dispose()` against HMR duplication.
- `getApiError()` (`src/lib/api-error.ts`) discriminates API Problem objects from plain `Error` via `'status' in error || 'title' in error`.

### Runtime Config & Deployment

Runtime config lets `VITE_API_URL` etc. change without rebuilding. `src/lib/config.ts` fetches `/config.json` at runtime (falling back to `import.meta.env` in dev); `main.tsx` awaits `loadConfig()` before init.

Two deployment targets ship from the same release:
- **Cloudflare Pages** — static `dist/`; runtime config served by `functions/config.json.ts`. Headers in `public/_headers`, SPA fallback in `public/_redirects`.
- **Self-hosted (Pi)** — Docker image to GHCR, nginx + `docker/docker-entrypoint.sh` injecting config via `envsubst` from `public/config.json.template`.

When changing the `AppConfig` shape, update **both** `functions/config.json.ts` and `public/config.json.template` so the targets don't drift.

### Version Updates

`VersionCheck` (mounted in `RootComponent`, renders null) polls `/version.json` every 5 min and on tab focus; when it differs from `__APP_VERSION__` (injected at build from `package.json`) it shows a persistent reload toast. The build emits `dist/version.json` via a Vite plugin.

### Testing

Vitest + Testing Library, jsdom. Setup in `src/test/setup.ts` mocks `localStorage` for Zustand persist. Tests are colocated with sources. Add `.a11y.test.tsx` for critical routes/complex components.

### Linting / Formatting

Biome (single quotes, 2-space indent, 100-char width) for lint + format; ESLint for React rules (purity, hooks, Fast Refresh). `pnpm lint` runs both. **`import type` convention:** when a module uses React only for types, write `import type * as React from 'react'` (Biome enforces this).

### Commits & Releases

[Conventional Commits](https://www.conventionalcommits.org/), enforced by a `commit-msg` husky hook (commitlint). Format `type(scope): subject` (scope optional).

| Type | When | Bump |
|---|---|---|
| `feat` | new user-facing feature | minor |
| `fix` | bug fix | patch |
| `perf` | performance improvement | patch |
| `revert` | reverts a commit | patch |
| `feat!` / `BREAKING CHANGE:` footer | breaking change | major |
| `chore`, `docs`, `test`, `refactor`, `style`, `build`, `ci`, `ops` | everything else | none |

Releases are automated: merging to `main` runs semantic-release (version bump, `CHANGELOG.md`, GitHub release), which triggers the Docker build + GHCR push.
