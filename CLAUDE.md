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

Coverage report:
```bash
pnpm test:coverage   # HTML report in coverage/
```

## Architecture

### Routing

TanStack Router v1 with file-based routing. Routes live in `src/routes/`. The route tree is auto-generated into `src/routeTree.gen.ts` by the Vite plugin — never edit that file by hand.

Two layout routes act as auth guards:
- `_app.tsx` — requires authentication (`isAuthenticated()`); redirects to `/login` if not. Wraps pages in `AppShell` and mounts `useTabVisibilityRefresh`.
- `_auth.tsx` — redirects already-authenticated users to `/`.

Child routes are nested under these layouts by naming convention (`_app/`, `_auth/`).

**Code splitting:** Page components live in `.lazy.tsx` siblings (e.g. `_app/index.lazy.tsx`) using `createLazyFileRoute`. The plain `.tsx` file keeps only the `createFileRoute` stub (for loaders/beforeLoad). The Vite plugin handles the dynamic import automatically. Add new pages with the same split — never put a component in the route definition file.

### API Client

`src/lib/api.ts` configures the OpenAPI Fetch-based client from `@budget-buddy-org/budget-buddy-contracts`. It:
- Attaches the access token from Zustand to every request via interceptors
- On 401: queues concurrent requests, attempts a token refresh via `refreshToken()`, then replays queued requests; on refresh failure, clears auth and redirects to `/login`

The application uses standalone functional API calls (e.g. `listTransactions`, `createCategory`) exported directly from the contracts package, which share the configured global client.

### Server State

TanStack Query v5. All query/mutation logic lives in hooks under `src/hooks/`. Each domain hook file (e.g. `useTransactions.ts`, `useCategories.ts`) exports a `KEYS` object for consistent cache key management, plus hooks for list, detail, create, update, and delete. Delete mutations use optimistic updates with rollback via `onMutate`/`onError`.

Global error logging is wired into `QueryCache` and `MutationCache` in `src/lib/query-client.ts` — don't add duplicate error reporting inside individual hooks.

Default query `staleTime` is 1 minute; `retry` is 1.

### Auth State

Two Zustand stores:
- `src/stores/auth.store.ts` — persists `refreshToken` + `refreshTokenObtainedAt` to `localStorage` (`budget-buddy-auth`). `accessToken` is memory-only; re-obtained via refresh on page load.
- `src/stores/theme.store.ts` — persists `theme` (`light`|`dark`|`system`) to `localStorage` (`budget-buddy-theme`). Applies `dark` class to `<html>` on rehydration.

`useTabVisibilityRefresh` (mounted in `_app.tsx`) proactively refreshes the auth token on tab focus when the refresh token is older than 6 days, preventing expiry mid-session.

### UI Components

shadcn/ui pattern: Radix UI primitives + Tailwind v4. Shared primitives live in `src/components/ui/`. Layout components (`AppShell`, `Header`, `MobileNav`) are in `src/components/layout/`. Charts use `recharts`. The `@` alias maps to `src/`.

### Data Conventions

Currency amounts are stored and sent as **minor units** (integers). `1299` = €12.99. Use `src/lib/formatters.ts` for display formatting.

### Tests

Vitest + Testing Library, jsdom environment. Setup file at `src/test/setup.ts` provides a `localStorage` mock for Zustand persist. Tests are colocated with their source files (e.g. `useTransactions.test.ts` next to `useTransactions.ts`).

### Linting / Formatting

Biome handles both lint and format (single quotes, 2-space indent, 100 char line width). ESLint is also present for React-specific rules. Run `pnpm lint` before committing.

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