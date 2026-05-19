# Codebase Health Audit — budget-buddy-web-app (May 2026)

## Context

The goal is a top-to-bottom review of the web app to surface bugs, antipatterns, and modernization opportunities. The bar is: clean, fast, simple, great on mobile, modern stack, no dead code, clear UI/business-logic separation, and adequate test coverage. This plan groups findings by severity and proposes a sequenced remediation.

**Headline:** the codebase is in good shape — React 19 idiomatic (no `forwardRef`), modern stack (Vite 8, Tailwind 4, TanStack Router/Query 5, Zustand 5), clean separation of hooks vs components, no unused deps. The main weaknesses are a handful of oversized page components, a few re-render and prefetch antipatterns, ~35% test coverage with critical gaps, and minor mobile polish issues.

---

## Findings by area

### 1. Architecture & antipatterns (medium impact)

- **Oversized page components** mixing concerns:
  - `src/components/transactions/TransactionForm.tsx` (383 lines) — form validation + API + nested category creation + change tracking + undo toast all inline.
  - `src/components/settings/SettingsPage.tsx` (381 lines) — 6 theme settings + 3 user prefs + version check + PWA install + sign-out, and creates **12 separate Zustand selector subscriptions** (lines 55-73). Each re-renders independently; should batch into 2 grouped selector hooks.
  - `src/components/categories/CategoriesPage.tsx` (345 lines) — contains a nested `EditCategoryDialogBody` component that belongs in its own file.
- **Duplicated `MONTH_NAMES` constant** in both `DashboardPage.tsx` and `MonthSelector.tsx:14-27`. Move to `src/lib/constants.ts`.
- **Imperative TanStack Query prefetch in `MonthSelector.tsx`** (uses `useQueryClient().prefetchQuery` on hover, lines 72/145-152). Acceptable for hover-prefetch UX but undocumented — add a one-line CLAUDE.md note or wrap in a custom hook.
- **Double-state form pattern in `TransactionFilters.tsx:31-41`** — compares `prevFilters` object identity per render to sync external state into local draft. Replace with `useEffect` on filter key dependencies.
- **Dead code in `TransactionFilters.tsx:77`** — `hasActiveFilters` calculated, never used.

### 2. Mobile UX & performance (low-medium impact)

- **Inline arrow functions defeat memoization:** `MobileNav.tsx:51` wraps a `useCallback`'d `handleTap` in a fresh closure each render. Same antipattern in `TransactionFilters.tsx:95,110` (inline `setDraft({ ...draft, ... })`).
- **Dashboard cards not memoized** — `SummaryCard`, `CategoriesCard`, `RecentTransactionsCard` re-render on any parent state change. Wrap with `memo`.
- **TransactionList not virtualized.** Fine for typical monthly volumes; only worth fixing if profiling shows jank on long scrolls.
- **No `autocomplete` attrs** on `TransactionForm` text inputs — small mobile keyboard win.
- **AppShell `max-w-2xl` fixed** (AppShell.tsx:23) — acceptable, mentioned only as a potential design refinement.
- **Strengths confirmed:** tap targets ≥44px, safe-area insets applied to header/mobile-nav/toasts, bottom-sheet animations respect `prefers-reduced-motion`, `inputMode="decimal"` + ≥16px font on inputs (prevents iOS zoom), `touch-manipulation` set globally.

### 3. Stack modernity (no critical issues)

Verified actual `package.json`:
- React 19.2, Tailwind 4.3, TanStack Router 1.169 / Query 5.100, Vite 8.0.5, Vitest 4.1, Biome 2.4, ESLint 9.39, TypeScript 5.9, Zustand 5.0, Node 24. All current for May 2026.
- **Real nit:** `vite` is pinned to exact `8.0.5` (no `^`) while everything else uses caret ranges. Either intentional pinning (document why) or align with the rest.
- **Real nit:** `@tanstack/react-router-devtools` (`^1.166.13`) lags `@tanstack/react-router` (`^1.169.2`) — bump for consistency.
- **No unused dependencies.** No legacy polyfills. No `forwardRef` anywhere (React 19 idiomatic ✓).
- ESLint flat config has `ecmaVersion: 2020` — bump to `2024`.

> A subagent suggested downgrading Vite 8 → 6 — that was wrong; Vite 8 is current for the May 2026 timeframe.

### 4. Test coverage (the biggest gap)

- **Ratio:** 38 test files vs ~109 source files ≈ **35%**. No coverage threshold configured in `vitest.config.ts`.
- **Untested hooks (8/15):** `use-fab`, `use-toast`, `useDashboardPeriod`, `useDebouncedValue`, `useInstallPrompt`, `useLatchedValue`, `useMonthlySummariesRange`, `useOnlineStatus`.
- **Untested critical lib:** `src/lib/api-error.ts` (discriminant logic), `src/lib/config.ts`, `src/lib/query-client.ts`, `src/lib/categoryColor.ts`, `src/lib/haptics.ts`.
- **Untested form:** `src/components/categories/CategoryForm.tsx`.
- **Untested pages:** Dashboard, Categories, Transactions, Settings page-level components.
- **A11y tests (4):** Dashboard, Categories, Transactions routes + ApiUnavailableBanner. **Settings route lacks an a11y test** despite many interactive controls — direct violation of the CLAUDE.md "critical routes" mandate.
- **Quality nit:** several component tests mock all child UI components, making them brittle and low-signal. Prefer testing at the smallest unit that exercises real DOM.

---

## Recommended plan (sequenced)

Three phases, smallest blast radius first. Each phase is independently shippable.

### Phase A — quick wins & hygiene (≈1 PR)

1. Bump `@tanstack/react-router-devtools` to `^1.169.2`; align `vite` pin to `^8.0.5` (or document the exact pin).
2. ESLint `ecmaVersion: 2020` → `2024` in `eslint.config.js`.
3. Extract `MONTH_NAMES` / `FULL_MONTH_NAMES` to `src/lib/constants.ts`; import in `DashboardPage.tsx` and `MonthSelector.tsx`.
4. Delete unused `hasActiveFilters` in `TransactionFilters.tsx:77`.
5. Fix inline closures: `MobileNav.tsx:51`, `TransactionFilters.tsx:95,110`.
6. Add `autocomplete` attrs to `TransactionForm` text inputs.
7. Enable coverage reporter in `vitest.config.ts` (`coverage: { provider: 'v8', reporter: ['html','text'], thresholds: { lines: 50 } }`).

### Phase B — split & decouple (≈2–3 PRs)

1. **SettingsPage refactor** (`src/components/settings/SettingsPage.tsx`):
   - Split into `ThemeSettingsSection`, `PreferencesSection`, `AppInfoSection`, `AccountSection`.
   - Create `src/hooks/useThemeSettings.ts` and `src/hooks/useUserPreferences.ts` that each return a stable object selected from the store — replaces the 12 individual subscriptions.
2. **TransactionForm refactor** (`src/components/transactions/TransactionForm.tsx`):
   - Move inline "create new category" flow into a dedicated `QuickAddCategoryDialog` component.
   - Extract change-detection into a `useFormDirty(initial, current)` hook.
3. **CategoriesPage refactor:** move `EditCategoryDialogBody` to `src/components/categories/EditCategoryDialog.tsx`.
4. **TransactionFilters:** replace the prev-props comparison pattern (lines 31-41) with a `useEffect` keyed on the relevant filter values.
5. Memoize `SummaryCard`, `CategoriesCard`, `RecentTransactionsCard` with `React.memo`.

### Phase C — test coverage to ~60% (≈3–4 PRs)

Top 10 tests to add, in order:
1. `src/lib/api-error.ts` — discriminant for Problem vs Error.
2. `src/lib/config.ts` — runtime config load + dev fallback.
3. `src/lib/query-client.ts` — global QueryCache/MutationCache error handlers.
4. `src/hooks/useDebouncedValue.ts` — timing semantics.
5. `src/hooks/useDashboardPeriod.ts` — month/range state.
6. `src/hooks/useMonthlySummariesRange.ts` — range aggregation.
7. `src/components/categories/CategoryForm.tsx` — validation + submit.
8. `src/routes/_app/settings.a11y.test.tsx` — a11y on settings (CLAUDE.md mandate).
9. `src/components/dashboard/DashboardPage.tsx` — composition + loading/error states.
10. `src/components/settings/SettingsPage.tsx` — preference persistence end-to-end.

---

## Critical files (concentrated edit surface)

- `src/components/settings/SettingsPage.tsx`
- `src/components/transactions/TransactionForm.tsx`
- `src/components/transactions/TransactionFilters.tsx`
- `src/components/categories/CategoriesPage.tsx`
- `src/components/dashboard/{DashboardPage,MonthSelector,SummaryCard,CategoriesCard,RecentTransactionsCard}.tsx`
- `src/components/layout/MobileNav.tsx`
- `src/lib/constants.ts` (new)
- `src/hooks/{useThemeSettings,useUserPreferences,useFormDirty}.ts` (new)
- `vitest.config.ts`, `eslint.config.js`, `package.json`

## Verification

- `pnpm lint && pnpm type-check && pnpm test` after each PR.
- `pnpm test:a11y` after Phase C step 8.
- `pnpm test:coverage` after Phase C — confirm ≥50% line coverage threshold passes.
- `pnpm build && pnpm preview` then exercise mobile UI in a 375px viewport (DevTools): create/edit/delete a transaction, switch month, change theme + currency + date format in settings, sign out. Confirm no console errors and no re-render flashes.
- React DevTools Profiler before/after Phase B to confirm `SettingsPage` re-render count drops from ~12/keystroke to 1–2.

## Out of scope

- Major UI redesign or visual changes.
- Migrating away from current libs (Zustand, TanStack, Radix) — they are the right choices.
- Backend / contracts changes.
- Adding virtualization to `TransactionList` (defer until profiling justifies it).
