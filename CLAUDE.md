# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# One-time setup: add GitHub token to ~/.npmrc for private package access
echo "//npm.pkg.github.com/:_authToken=ghp_<your-token>" >> ~/.npmrc

pnpm install
cp .env.example .env.local   # set VITE_API_URL if needed

pnpm dev           # Vite dev server at http://localhost:5173
pnpm build         # production build + tsc -b type check
pnpm preview       # preview the production build locally
pnpm lint          # Biome lint
pnpm format        # Biome auto-format (writes files)
pnpm test          # Vitest run once
pnpm test:watch    # Vitest watch mode
pnpm type-check    # tsc --noEmit (tsconfig.app.json)
```

Run a single test file:
```bash
pnpm vitest run src/hooks/useTransactions.test.ts
```

Coverage report:
```bash
pnpm test:coverage   # HTML report in coverage/
pnpm test:a11y       # Run accessibility tests
```

## Architecture

### Routing

TanStack Router v1 with file-based routing. Routes live in `src/routes/`. The route tree is auto-generated into `src/routeTree.gen.ts` by the Vite plugin — never edit that file by hand.

One layout route acts as an auth guard:
- `_app.tsx` — requires authentication; delegates to `ProtectedAppLayout` which calls `useAuth()` from `react-oidc-context` and triggers `signinRedirect()` if the user is not authenticated.

Child routes are nested under these layouts by naming convention (`_app/`, `_auth/`).

**Code splitting:** Page components live in `.lazy.tsx` siblings (e.g. `_app/index.lazy.tsx`) using `createLazyFileRoute`. The plain `.tsx` file keeps only the `createFileRoute` stub (for loaders/beforeLoad). Actual page implementations are moved to `src/components/{page}/` to resolve React Fast Refresh warnings and keep route files clean. The Vite plugin handles the dynamic import automatically. Add new pages with the same split — never put a component in the route definition file.

**Test colocation in routes:** The router plugin is configured with `routeFileIgnorePattern: '\\.test\\.tsx?$'`, so test files (`*.test.tsx`) placed inside `src/routes/` are excluded from the generated route tree. This allows tests to live next to the route file they test.

**Search parameter validation:** `validateSearch` uses explicit `typeof` checks rather than a Zod schema. This is intentional — Zod is not a project dependency, and the schemas are small enough that manual guards are clearer and have zero overhead. Do not add Zod just for URL param validation.

### API Client

`src/lib/api.ts` configures the OpenAPI Fetch-based client from `@budget-buddy-org/budget-buddy-contracts`. It:
- Uses `client.setConfig` in `src/main.tsx` after `loadConfig()` resolves, setting only `baseUrl`.
- Exports `getAuthToken()` — a request interceptor helper that reads the current OIDC user via `getUserManager().getUser()` and proactively calls `signinSilent()` when the token expires within 60 seconds.
- On 401: triggers `getUserManager().signinRedirect()` to re-authenticate. All `/auth/*` paths are excluded from this behaviour to prevent redirect loops on the callback route.
- Auth-related redirects (`signinRedirect`, `signoutRedirect`) are handled by the OIDC SDK; no manual router navigation is needed.

The application uses standalone functional API calls (e.g. `listTransactions`, `createCategory`) exported directly from the contracts package, which share the configured global client.

**Router module:** The router is created in `src/lib/router.ts` (not `main.tsx`) so that `api.ts` can import it for programmatic navigation without creating a circular dependency. `main.tsx` imports the router from there too.

### Server State

TanStack Query v5. All query/mutation logic lives in hooks under `src/hooks/`. Each domain hook file (e.g. `useTransactions.ts`, `useCategories.ts`) exports a `KEYS` object for consistent cache key management, plus hooks for list, detail, create, update, and delete. Delete mutations use optimistic updates with rollback via `onMutate`/`onError`.

- **Dashboard aggregation fetch:** The API has no aggregation endpoint, so `useAllTransactions` fetches up to 2,000 transactions in batches of 200 to calculate monthly totals and chart data client-side. This is intentional and scoped to the Dashboard. The standard paginated `useTransactions` (size=20) is used everywhere else. Text search is server-side via the contracts `query` param — never filter locally.

Global error logging is wired into `QueryCache` and `MutationCache` in `src/lib/query-client.ts` — don't add duplicate error reporting inside individual hooks.

Default query `staleTime` is 1 minute; `retry` is 1.

### Auth State

The application uses `react-oidc-context` and `oidc-client-ts` for authentication.
- **Authentication:** Manages tokens internally with memory storage and silent renewal via OIDC.
- **UserManager:** Shared instance exported from `src/lib/oidc.ts` for accessing auth state outside of React components.
- **ProtectedAppLayout:** Component that guards routes and handles OIDC login redirection.

- `src/stores/theme.store.ts` — persists `theme` (`light`|`dark`|`system`), `primaryHue` (0-360), and `fontSize` (12-24) to `localStorage` (`budget-buddy-theme`). Applies CSS variables to `:root` on rehydration.

**Zustand selectors:** Always use selectors when subscribing to stores (e.g. `useThemeStore((s) => s.glassEffect)` instead of `useThemeStore()`). Subscribing to the entire store causes unnecessary re-renders in every consuming component.

### Version Updates

`VersionCheck` (mounted in `RootComponent`, renders null) polls `/version.json` every 5 minutes and on tab focus. When the fetched version differs from `__APP_VERSION__` (a global injected at build time from `package.json`), it shows a persistent toast prompting a reload.

The build emits `/dist/version.json` via a Vite plugin in `vite.config.ts`. In production, the running app compares its baked-in version against the freshly served `version.json`, enabling zero-downtime update notifications.

### Runtime Configuration

The application uses a runtime configuration pattern to allow environment-specific settings (like `VITE_API_URL`) to be changed without rebuilding the Docker image.

- **Storage:** `public/config.json.template` defines the available settings with placeholders.
- **Injection:** In Docker, `docker/docker-entrypoint.sh` uses `envsubst` to replace placeholders with environment variables and writes the result to `/usr/share/nginx/html/config.json`.
- **Loading:** `src/lib/config.ts` fetches `/config.json` at runtime. During development, it falls back to `import.meta.env` values.
- **Bootstrap:** `src/main.tsx` awaits `loadConfig()` before initializing the API client and rendering the app.

### Error Handling

- **Error Boundaries:** Use `src/components/ErrorBoundary.tsx` to wrap UI components. The default fallback shows a generic message and a toggle for technical details (`error.message` and `error.stack`).
- **Route Errors:** Use the `errorComponent` property in TanStack Router route definitions (e.g., `src/routes/_app.tsx`). Similar to the Error Boundary, it should provide a generic message with toggleable details.
- **Logging:** All errors caught by boundaries or route components are logged via `src/lib/error-logger.ts`. Global Query/Mutation errors are handled in `src/lib/query-client.ts`. Global `error` and `unhandledrejection` listeners in `src/main.tsx` are guarded with `import.meta.hot.dispose()` to prevent duplicate handlers during HMR.
- **`getApiError()`** in `src/lib/api-error.ts` uses discriminant checks (`'status' in error || 'title' in error`) to safely distinguish API Problem objects from plain `Error` instances.

### UI Components

shadcn/ui pattern: Radix UI primitives + Tailwind v4. Shared primitives live in `src/components/ui/`. Layout components (`AppShell`, `Header`, `MobileNav`) are in `src/components/layout/`. The `@` alias maps to `src/`.

**Component conventions:**
- **No `forwardRef`:** React 19 passes `ref` as a regular prop. All UI components accept `ref` directly in their props type (e.g. `ref?: React.Ref<HTMLInputElement>`). Do not use `React.forwardRef`.
- **`error` prop:** `Input`, `Select`, `AmountInput`, and `DatePicker` accept an `error?: boolean` prop that applies destructive border/ring styles. Use `error={!!fieldError}` instead of conditional classNames.
- **`size-N` shorthand:** Use Tailwind v4's `size-4` instead of `h-4 w-4` for simultaneous width + height.
- **Custom animations:** Defined as `@theme` tokens (`--animate-fade-in`, `--animate-in-bottom-sheet`, etc.) in `src/index.css`. Custom utilities use the `@utility` directive. Do not add raw `@keyframes` or `.animate-*` classes.
- **Accessibility:** Segmented controls use `role="tablist"` / `role="tab"` / `aria-selected`. Sheet animations respect `prefers-reduced-motion`.
- **Dark mode colors:** `getCategoryColor()` in `src/lib/categoryColor.ts` uses CSS `light-dark()` for automatic theme adaptation.

### Data Conventions

Currency amounts are stored and sent as **minor units** (integers). `1299` = €12.99. Use `src/lib/formatters.ts` for display formatting.

### Pagination

We use page-based pagination for transactions and categories.
- UI: Reusable `Pagination` component in `src/components/ui/pagination.tsx`.
- API: Consumes `meta.total` for correct item count and page calculation.
- State: Managed at the page level via `useState` and passed to domain hooks.

### Transaction filters

URL search params are the source of truth for transactions list filters. Validation lives in [src/routes/_app/transactions/index.tsx](src/routes/_app/transactions/index.tsx) (`validateSearch`) — keep it `typeof`-based, no Zod. Supported params: `page`, `categoryId`, `start`, `end`, `sort`, `type`, `query`, `amountMin`, `amountMax`. **Amount params are stored in minor units** (integers ≥1) — convert in/out via `toMinorUnits` / `/100` from [src/lib/formatters.ts](src/lib/formatters.ts). Empty inputs must be omitted (`undefined`) — never send empty strings or `0`.

The free-text search box debounces input via [src/hooks/useDebouncedValue.ts](src/hooks/useDebouncedValue.ts) (default 300 ms) so each keystroke does not refetch. The hook is generic — reuse it whenever you need debounced state.

### Accessibility Testing

We use `vitest-axe` for automated accessibility checks.
- Add `.a11y.test.tsx` for critical routes and complex components.
- Run a11y tests specifically with `pnpm test:a11y`.
- Ensure all icon-only buttons have an `aria-label`.
- Maintain progressive heading levels (h1 -> h2 -> h3).

### Tests

Vitest + Testing Library, jsdom environment. Setup file at `src/test/setup.ts` provides a `localStorage` mock for Zustand persist. Tests are colocated with their source files (e.g. `useTransactions.test.ts` next to `useTransactions.ts`).

### Linting / Formatting

Biome handles both lint and format (single quotes, 2-space indent, 100 char line width). ESLint is used for React-specific rules (purity, hooks, Fast Refresh). The `pnpm lint` command runs both tools. Run it before committing.

**`import type` convention:** When a module only uses React for type annotations (e.g. `React.Ref`, `React.HTMLAttributes`), use `import type * as React from 'react'` instead of `import * as React from 'react'`. Biome enforces this.

### Deployment targets

Two parallel targets, both shipped from the same release:

- **Cloudflare Pages** — static `dist/` on the edge. Runtime config served by [functions/config.json.ts](./functions/config.json.ts) (a Pages Function reading CF env vars). Headers in [public/_headers](./public/_headers); SPA fallback in [public/_redirects](./public/_redirects).
- **Self-hosted (Pi)** — Docker image published to GHCR, served by nginx with runtime config injected by `docker/docker-entrypoint.sh`. Deployed via `../budget-buddy-deployment/deploy.sh`.

When changing runtime config shape (the keys in `AppConfig`), update **both** [functions/config.json.ts](./functions/config.json.ts) and [public/config.json.template](./public/config.json.template) so neither target drifts.

### Commits and Releases

Commit messages must follow [Conventional Commits](https://www.conventionalcommits.org/). A `commit-msg` husky hook enforces this locally via commitlint.

Required format: `type(scope): subject` — scope is optional.

| Type | When to use | Release bump |
|---|---|---|
| `feat` | new user-facing feature | minor |
| `fix` | bug fix | patch |
| `perf` | performance improvement | patch |
| `revert` | reverts a previous commit | patch |
| `feat!` / `BREAKING CHANGE:` footer | breaking API change | major |
| `chore`, `docs`, `test`, `refactor`, `style`, `build`, `ci`, `ops` | everything else | none |

**Releases are fully automated.** Merging to `main` triggers semantic-release in CI, which analyzes commits since the last release, bumps the version, writes `CHANGELOG.md`, and publishes a GitHub release. That release event then triggers the Docker image build and push to GHCR with proper semver tags.