# Code Review - Budget Buddy Web App

**Date:** 2026-04-18
**Reviewer:** Claude Code
**Codebase:** React 19 + Tailwind v4 + TanStack Router/Query + Zustand

---

## P0 - Critical

### 1. `forwardRef` is deprecated in React 19
**Files:** `button.tsx`, `input.tsx`, `card.tsx`, `dialog.tsx`, `toast.tsx`, `amount-input.tsx`, `date-picker.tsx`, `select.tsx`, `switch.tsx`

React 19 passes `ref` as a regular prop. `forwardRef` still works but is deprecated and adds wrapper overhead.

**Fix:** Replace `React.forwardRef<Ref, Props>((props, ref) => ...)` with direct `function Component({ ref, ...props }: Props & { ref?: React.Ref<...> })`.

---

### 2. `useToast` uses a hand-rolled pub/sub store
**File:** `src/hooks/use-toast.ts`

The custom `listeners[]` + `memoryState` + `dispatch()` pattern reimplements what Zustand already does. Not using `useSyncExternalStore` (the correct React 18+ primitive), which can cause tearing in concurrent mode.

**Fix:** Migrate to a Zustand store or use `useSyncExternalStore`.

---

### 3. No service worker for PWA
**Files:** `public/manifest.json`, `index.html`

The manifest declares `"display": "standalone"` but there's no service worker. The app won't work offline and the install prompt may not appear on Android.

**Fix:** Add a service worker via `vite-plugin-pwa` or Workbox.

---

## P1 - High Priority

### 4. `Button` / `Badge` / `TransactionTypeToggle` subscribe to entire theme store
**Files:** `button.tsx`, `badge.tsx`, `transaction-type-toggle.tsx`

Every instance calls `useThemeStore()` without a selector, subscribing to all theme changes and causing unnecessary re-renders.

**Fix:** Use `useThemeStore((s) => s.glassEffect)` or move glass effect to CSS custom properties.

---

### 5. `DashboardPage` recalculates dates on every render
**File:** `src/components/dashboard/DashboardPage.tsx:40-43`

`new Date()`, `getFullYear()`, `getMonth()` run on every render outside any hook/memo.

**Fix:** Wrap in `useMemo(() => ..., [])` or `useState(() => ...)`.

---

### 6. Custom CSS animations instead of Tailwind v4 built-in
**File:** `src/index.css:109-180`

Custom `@keyframes` and utility classes (`.animate-fade-in`, `.animate-out-bottom-sheet`, `.no-scrollbar`, `.transition-spring`) when Tailwind v4 has native support.

**Fix:** Register animations via `@theme` tokens and `@utility` directives.

---

### 7. `h-4 w-4` instead of `size-4`
**Files:** Nearly all components

Tailwind v4 supports `size-4` shorthand for simultaneous width + height.

**Fix:** Replace `h-N w-N` with `size-N` throughout.

---

### 8. `AmountInput` decimal keyboard confusion
**File:** `src/components/ui/amount-input.tsx`

`inputMode="decimal"` shows a decimal keyboard but the handler strips all non-digits. The auto-formatting (divide by 100) isn't discoverable.

**Fix:** Add a visible hint or placeholder showing the expected format.

---

## P2 - Medium Priority

### 9. Missing ARIA roles on segmented controls
**Files:** `transaction-type-toggle.tsx`, `DashboardPage.tsx` (month selector)

Type toggle and month selector use plain `<button>` without `role="tablist"` / `role="tab"` / `aria-selected`.

**Fix:** Add proper ARIA roles for segmented controls.

---

### 10. `SummaryCard` uses string interpolation instead of `cn()`
**File:** `src/components/dashboard/SummaryCard.tsx:49`

`className={\`text-xl font-bold ${className}\`}` bypasses `tailwind-merge`.

**Fix:** Use `cn('text-xl font-bold', className)`.

---

### 11. `CardDescription` in `SummaryCard.tsx` shadows the one from `card.tsx`
**File:** `src/components/dashboard/SummaryCard.tsx:7-19`

Local component shadows the shared import. Confusing for maintainers.

**Fix:** Rename to `SummaryCardDescription` or inline.

---

### 12. Dialog swipe-to-dismiss uses `setTimeout` for animation sequencing
**File:** `src/components/ui/dialog.tsx:56-59, 85`

Magic-number timeouts are fragile if CSS animation durations change.

**Fix:** Use `animationend` event listeners instead of `setTimeout`.

---

### 13. `MobileNav` safe-area uses inline style instead of Tailwind
**File:** `src/components/layout/MobileNav.tsx:30`

`style={{ bottom: 'env(safe-area-inset-bottom)' }}` could use `bottom-[env(safe-area-inset-bottom)]`.

**Fix:** Use Tailwind arbitrary value syntax.

---

### 14. `transition-spring` custom class instead of `@utility`
**File:** `src/index.css:177-180`

Custom class should use Tailwind v4's `@utility` directive.

**Fix:** Define via `@utility transition-spring { ... }`.

---

### 15. Runtime dependencies in `devDependencies`
**File:** `package.json`

`lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge` are used in production code but listed as devDependencies.

**Fix:** Move to `dependencies`.

---

### 16. Missing `<meta name="description">` in `index.html`
**File:** `index.html`

No meta description tag for SEO/social sharing.

**Fix:** Add meta description.

---

## P3 - Low Priority / Polish

### 17. Double space in `RouteLoader` className
**File:** `src/components/layout/RouteLoader.tsx:3`

### 18. Duplicated error input class pattern across all forms
**Files:** `LoginPage.tsx`, `RegisterPage.tsx`, `TransactionForm.tsx`, `CategoriesPage.tsx`

`border-destructive ring-destructive focus-visible:ring-destructive` repeated 10+ times.

**Fix:** Create an `error` variant on the `Input` component.

---

### 19. `getApiError()` does an unsafe cast
**File:** `src/lib/api-error.ts:10`

Any non-null object passes the check, including `Error` instances.

**Fix:** Add discriminant check (`'status' in error || 'title' in error`).

---

### 20. Category colors don't adapt to dark mode
**File:** `src/lib/categoryColor.ts:19`

Fixed `hsl(${hue} 65% 52%)` has poor contrast in dark mode.

**Fix:** Return a CSS custom property or adjust lightness per theme.

---

### 21. `manifest.json` uses same image for `any` and `maskable` purpose
**File:** `public/manifest.json`

Maskable icons need extra safe-zone padding.

**Fix:** Create dedicated maskable icons.

---

### 22. Sheet animations don't respect `prefers-reduced-motion`
**File:** `src/index.css`, `dialog.tsx`

`motion-reduce:transition-none` is used on some elements but sheet animations are unaffected.

**Fix:** Add `@media (prefers-reduced-motion: reduce)` overrides.

---

### 23. Redundant `h-14 md:h-14` in Header
**File:** `src/components/layout/Header.tsx:28`

Same value at both breakpoints.

**Fix:** Remove the redundant `md:h-14`.

---

### 24. Global error listeners not cleaned up in dev (HMR)
**File:** `src/main.tsx:15-21`

`window.addEventListener` at module level duplicates on every HMR reload.

**Fix:** Guard with `if (import.meta.hot)` cleanup or use a module-scoped flag.

---

## Progress Tracker

- [x] P0-1: Remove `forwardRef` from all UI components
- [x] P0-2: Migrate toast store to `useSyncExternalStore`
- [ ] P0-3: Add service worker (vite-plugin-pwa)
- [x] P1-4: Add Zustand selectors for `glassEffect`
- [x] P1-5: Memoize dashboard date calculations
- [x] P1-6: Convert custom CSS to Tailwind v4 `@theme` / `@utility`
- [x] P1-7: Replace `h-N w-N` with `size-N`
- [x] P1-8: Improve AmountInput UX (added default placeholder)
- [x] P2-9: Add ARIA roles to segmented controls
- [x] P2-10: Fix `cn()` usage in SummaryCard
- [x] P2-11: Rename shadowed CardDescription → SummaryCardDescription
- [x] P2-12: Replace setTimeout with animationend in Dialog
- [x] P2-13: Use Tailwind for MobileNav safe-area
- [x] P2-14: Convert transition-spring to @utility
- [x] P2-15: Fix dependency placement in package.json
- [x] P2-16: Add meta description
- [x] P3-17: Fix double space in RouteLoader
- [x] P3-19: Safer cast in getApiError
- [x] P3-22: Sheet animations respect prefers-reduced-motion
- [x] P3-23: Remove redundant md:h-14 from Header
- [x] P3-18: Extract duplicated error input class pattern
- [x] P3-20: Category colors adapt to dark mode
- [ ] P3-21: Separate maskable icons
- [x] P3-24: Guard global error listeners for HMR
