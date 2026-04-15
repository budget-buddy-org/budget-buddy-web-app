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

Two layout routes act as auth guards:
- `_app.tsx` — requires authentication (`isAuthenticated()`); redirects to `/login` if not. Wraps pages in `AppShell` and mounts `useTabVisibilityRefresh`.
- `_auth.tsx` — redirects already-authenticated users to `/`.

Child routes are nested under these layouts by naming convention (`_app/`, `_auth/`).

**Code splitting:** Page components live in `.lazy.tsx` siblings (e.g. `_app/index.lazy.tsx`) using `createLazyFileRoute`. The plain `.tsx` file keeps only the `createFileRoute` stub (for loaders/beforeLoad). Actual page implementations are moved to `src/components/{page}/` to resolve React Fast Refresh warnings and keep route files clean. The Vite plugin handles the dynamic import automatically. Add new pages with the same split — never put a component in the route definition file.

**Test colocation in routes:** The router plugin is configured with `routeFileIgnorePattern: '\\.test\\.tsx?$'`, so test files (`*.test.tsx`) placed inside `src/routes/` are excluded from the generated route tree. This allows tests to live next to the route file they test.

### API Client

`src/lib/api.ts` configures the OpenAPI Fetch-based client from `@budget-buddy-org/budget-buddy-contracts`. It:
- Uses `client.setConfig` only in `src/main.tsx` after the configuration is loaded. The `src/lib/api.ts` module only registers interceptors to ensure the global client is correctly configured before first use.
- Attaches the access token from Zustand to every request via interceptors
- On 401: queues concurrent requests, attempts a token refresh via `refreshToken()`, then replays queued requests; on refresh failure, clears auth and redirects to `/login`

The application uses standalone functional API calls (e.g. `listTransactions`, `createCategory`) exported directly from the contracts package, which share the configured global client.

### Server State

TanStack Query v5. All query/mutation logic lives in hooks under `src/hooks/`. Each domain hook file (e.g. `useTransactions.ts`, `useCategories.ts`) exports a `KEYS` object for consistent cache key management, plus hooks for list, detail, create, update, and delete. Delete mutations use optimistic updates with rollback via `onMutate`/`onError`.

- **Client-Side Search:** Since the current API version does not support filtering by search term, search functionality for transactions and categories is implemented on the client side. The `useTransactions` and `useCategories` hooks fetch larger datasets and filter them locally based on the search state.

Global error logging is wired into `QueryCache` and `MutationCache` in `src/lib/query-client.ts` — don't add duplicate error reporting inside individual hooks.

Default query `staleTime` is 1 minute; `retry` is 1.

### Auth State

Two Zustand stores:
- `src/stores/auth.store.ts` — persists `refreshToken` + `refreshTokenObtainedAt` to `localStorage` (`budget-buddy-auth`). `accessToken` and `accessTokenExpiresAt` are memory-only. The store tracks expiration via the `expires_in` field from the API.
- `src/stores/theme.store.ts` — persists `theme` (`light`|`dark`|`system`), `primaryHue` (0-360), and `fontSize` (12-24) to `localStorage` (`budget-buddy-theme`). Applies CSS variables to `:root` on rehydration.

`useTabVisibilityRefresh` (mounted in `_app.tsx`) proactively refreshes the auth token on tab focus when the refresh token is older than 6 days, preventing expiry mid-session.

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
- **Logging:** All errors caught by boundaries or route components are logged via `src/lib/error-logger.ts`. Global Query/Mutation errors are handled in `src/lib/query-client.ts`.

### UI Components

shadcn/ui pattern: Radix UI primitives + Tailwind v4. Shared primitives live in `src/components/ui/`. Layout components (`AppShell`, `Header`, `MobileNav`) are in `src/components/layout/`. Charts use `recharts`. The `@` alias maps to `src/`.

### Data Conventions

Currency amounts are stored and sent as **minor units** (integers). `1299` = €12.99. Use `src/lib/formatters.ts` for display formatting.

### Pagination

We use page-based pagination for transactions and categories.
- UI: Reusable `Pagination` component in `src/components/ui/pagination.tsx`.
- API: Consumes `meta.total` for correct item count and page calculation.
- State: Managed at the page level via `useState` and passed to domain hooks.

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