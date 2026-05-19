# UI / UX Audit — Budget Buddy Web App

_Audit date: 2026-05-19 · Branch: `main` @ `2b1b819` · Stack: React 19, Vite, Tailwind v4, shadcn-style primitives, Radix UI, TanStack Router/Query_

---

## 1. Executive Summary

**Overall:** the codebase is in genuinely good shape. There is a real design system here (semantic colour tokens, dynamic primary hue, locked control height, four-step radius scale, custom easing, full dark-mode coverage) and the team has clearly followed mobile-first discipline. The Settings refactor landed a clean `SectionHeader + Card` pattern that should now be the template for any page with grouped content. Most of the issues below are _consistency drift_ at the seams between components — not architectural problems.

**Highlights — keep doing these**
- React 19 ref-as-prop is fully adopted; zero `forwardRef` left.
- `@theme` tokens drive radii, control height, easing, animations.
- `prefers-reduced-motion` is respected at the right places (sheets, shimmer, transitions).
- `env(safe-area-inset-*)` and `dvh` units handle notches and iOS chrome correctly.
- `tabular-nums` globally for financial alignment.
- Modern flourishes: `@starting-style` (`starting:scale-75`) on the FAB; `linear()` spring easing; `color-mix()` in skeleton shimmer.

**Top 5 things to fix first**
1. Standardise focus strategy — three different conventions live in the codebase right now.
2. Promote the focus-ring/control-padding/list-row patterns to `@utility` so primitives stop redeclaring them.
3. Add a skip-to-main link + landmark labels (`<main aria-label="…">`).
4. Replace the four ad-hoc z-index values (`z-50`, `z-50`, `z-[100]`, `z-[100]`) with a tokenised scale.
5. Mobile nav label is `text-[10px]` — below the readable-floor and unmoored from the type scale.

### Scorecard

| Dimension | Rating | One-liner |
|---|---|---|
| Consistency | **4 / 5** | Tokens are excellent; drift is at the leaf-level (focus, scale, ad-hoc paddings). |
| 2026 best practices | **4 / 5** | Modern CSS used well; missing skip link, `@container`, view transitions. |
| Framework utilisation | **3.5 / 5** | Tailwind v4 `@theme`/`@utility` are used but underused — many `@utility` candidates still hand-typed. |
| UX (mobile-first) | **4.5 / 5** | Bottom-sheet dialogs, dvh, safe-area, tap targets ≥44px. Tiny nits only. |

---

## 2. Foundation — Tokens & Theming

`src/index.css` is the source of truth and is well-structured. Inventory:

| Concern | Tokens defined | Notes |
|---|---|---|
| Colour | 18 semantic tokens, full `.dark` parity, `--color-income` / `--color-expense` for domain | Excellent. Driven off `--primary-hue` at runtime. |
| Radius | `sm 8 · md 12 · lg 16 · pill 9999` | Documented inline; usage matches intent across the app. |
| Control sizing | `--spacing-control`, `--spacing-control-inner`, `--leading-control`, `h-field`, `size-field` (utilities) | Locks 36px field height across `<input>` / `<select>` / `<button>`. Smart. |
| Typography | `--text-xs (13px)`, `--text-sm (15px)` only | **Gap:** no `--text-base/lg/xl/2xl` tokens — relies on Tailwind defaults. |
| Easing/anim | `--easing-spring` (linear() spline), 5 `--animate-*` tokens | Well-scoped, reduced-motion aware. |
| Spacing | Only control-related | **Gap:** no list-row, section, or surface-padding tokens. |
| Shadow | None | **Gap:** `shadow-sm` / `shadow-lg` used raw — no `--shadow-*` scale. |
| Z-index | None | **Gap:** `z-50`, `z-50`, `z-[100]` all live in different files. |

### Findings

> **[L] No type scale tokens past `--text-sm`** — `src/index.css:56-62`. Means any deliberate adjustment to base/lg/xl/2xl across the app requires hunting raw `text-*` utilities. Add `--text-base`, `--text-lg`, `--text-xl`, `--text-2xl` (with matching `--text-*--line-height`) and migrate `text-2xl font-semibold` page titles to the token.

> **[L] No shadow scale** — Cards use `shadow-sm`, toasts/dialogs use `shadow-lg`, mobile nav uses `shadow-xl` + `shadow-black/10` / `shadow-black/40`. Three intents (resting card, elevated surface, floating overlay) are visible but not named. Add `--shadow-card`, `--shadow-overlay`, `--shadow-floating` and reference via Tailwind `shadow-card` etc.

> **[L] No z-index tokens** — Header `z-50` (`Header.tsx`), MobileNav `z-50` (`MobileNav.tsx:32`), Toast viewport `z-[100]` (`toast.tsx:21`), Dialog Radix-internal (un-numbered). Mobile-nav and header are both `z-50` — works today only because they never overlap. Define `--z-header: 40`, `--z-overlay: 50`, `--z-toast: 60` (`@theme` exposes them as `z-header` utilities in v4).

> **[L] PWA `theme_color` is hard-coded `#2563eb`** — `vite.config.ts:38`. Does not track `--primary-hue` nor dark mode. Acceptable as a known trade-off (the manifest is a build-time blob), but worth either (a) noting the divergence in `CLAUDE.md`, or (b) syncing the in-app `<meta name="theme-color">` at runtime to mask the discrepancy on Android Chrome.

> **[S] Global scrollbar hiding** — `src/index.css:106-108, 143-145` hides every scrollbar (`scrollbar-width: none`, `::-webkit-scrollbar { display: none }`). Looks slick on touch devices but removes a discoverability cue on desktop — long lists no longer indicate they're scrollable. Consider scoping the hide to specific containers (e.g. the mobile shell) instead of universally.

---

## 3. UI Primitives (`src/components/ui/`)

### 3.1 Focus strategy — pick one

Three conventions live in the codebase:

| Strategy | Where | Verdict |
|---|---|---|
| `focus-visible:` + `ring-*` (the project default) | `Button`, `Input`, `Select`, `ListItem`, `Dialog`, `TransactionTypeToggle` | ✅ Standard — keep |
| `focus-within:` + `ring-*` on the wrapping `<label>` | `Switch` (`switch.tsx:18`) | ⚠️ Triggers ring on _any_ child focus and on mouse-driven clicks bubbling through; not equivalent to `focus-visible` |
| `:focus:` + `ring-*` (no `-visible`) | `ToastAction` (`toast.tsx:74`), `ToastClose` (`toast.tsx:93`) | ⚠️ Shows ring on mouse click too — visual noise |
| `focus-visible:` + `outline-*` | `MobileNav` link (`MobileNav.tsx:46`) | ⚠️ Different look from rest of app |
| _(none)_ | `SidebarNav` link (`MobileNav.tsx:92`) | ⚠️ Keyboard users get no indicator at all |

> **[M] Standardise focus** — Plan:
> 1. Add `@utility focus-ring { @apply outline-none ring-2 ring-ring; }` and `@utility focus-ring-offset { @apply ring-offset-2 ring-offset-background; }` to `src/index.css`.
> 2. Replace seven hand-typed `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring` blocks with `focus-visible:focus-ring`.
> 3. `Switch`: move focus to the `<input>` (`peer-focus-visible:` on the `<span>` ring, or apply ring directly to the label via `:has(:focus-visible)`).
> 4. `ToastAction`/`ToastClose`: change `focus:` → `focus-visible:`.
> 5. `MobileNav`: switch from `outline-*` to `ring-*` for visual consistency.
> 6. `SidebarNav`: add `focus-visible:focus-ring focus-visible:ring-offset-2`.

### 3.2 `active:scale` drift

Three values for the same press-feedback intent:

| Component | Value | File |
|---|---|---|
| `Button` (base) | `active:scale-[0.98]` | `button-variants.ts:4` |
| `ToastAction` | `active:scale-[0.97]` | `toast.tsx:74` |
| `ToastClose` | `active:scale-90` | `toast.tsx:93` |
| `MobileNav` link | `active:scale-95` | `MobileNav.tsx:46` |
| FAB button | `active:scale-90 active:rotate-45` | `MobileNav.tsx:68` |

> **[L] Normalise tap feedback** — Pick one tap scale (recommend `0.97` for everything that isn't an explicit "destroy/dismiss"), keep `0.90` reserved for the FAB and ToastClose since both are deliberate "go-away" actions where the bigger squish is intentional. Document the rule in `CLAUDE.md` under "Component conventions".

### 3.3 `h-N w-N` instead of `size-N`

> **[L] Button icon variant** — `button-variants.ts:20` — `icon: 'h-10 w-10'` should be `size-10`. Convention is set in `CLAUDE.md` ("`size-N` shorthand: Use Tailwind v4's `size-4` instead of `h-4 w-4`"). One-line fix.

### 3.4 Repeated patterns — promote to `@utility`

The single biggest opportunity in the codebase. Each row below is duplicated ≥3 times verbatim:

| Repeated pattern | Occurrences | Suggested utility |
|---|---|---|
| `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring` | 7+ files | `@utility focus-ring` |
| `ring-offset-2 ring-offset-background` | 3 (Input, Select, Switch) | bundled into `focus-ring-offset` |
| `px-4 py-3` for list rows | `ListItem`, `ListSkeleton`, `ListSkeletonItem` | `@utility list-row` or `--spacing-list: 0.75rem 1rem` |
| `motion-reduce:transition-none` | 8+ files | `@utility motion-safe-transition` (or accept the verbosity — it's clear) |
| `disabled:pointer-events-none disabled:opacity-50` | 4+ files | `@utility is-disabled` |

> **[M] Extract `@utility focus-ring`, `list-row`, and a `--spacing-list` token.** High ROI: one CSS edit, six file simplifications.

### 3.5 Switch label focus & accessibility

`switch.tsx:23-30` — the real `<input type="checkbox">` is `sr-only` and only the `<label>` is interactive visually. Combined with `focus-within:`, that means:
- Tab order is correct (focuses the input).
- Ring appears via `focus-within` on the label — fine in practice.
- But `focus-within` _also_ matches when a non-checkbox descendant is focused. There aren't any today, but it is technically broader than intended.

> **[S] Switch focus refactor** — Either:
> - swap to `:has(:focus-visible)` on the label (true equivalent of `focus-visible`), or
> - put the ring on the `<input>` via `peer-focus-visible:` and make the visual `<span>` the rendered switch.
>
> Both fix the semantic. The `:has` version is the smaller diff.

---

## 4. Layout & Mobile-First

### 4.1 What's working

- `AppShell` uses `min-h-dvh` + `flex-col` with the floating mobile nav adding `pb-[calc(env(safe-area-inset-bottom)+5rem)]` to `main`. Notches and iOS chrome handled.
- One breakpoint (`md`) gates the sidebar vs. mobile-nav switch. Cognitively cheap.
- Glass effect is opt-in via the theme store, and degrades cleanly (`bg-background/80` + `backdrop-blur-md`).
- `linear()` spring easing for the FAB feels native-quality.

### 4.2 Findings

> **[L] No skip-to-main link** — Keyboard users have to tab through the entire header on every page. Add an `<a href="#main" class="sr-only focus:not-sr-only ...">Skip to content</a>` as the very first child of `AppShell` and give `<main id="main" aria-label="Main content">` the id.

> **[L] Landmarks unlabelled** — `<aside>`, `<main>`, `<nav>` lack `aria-label`. A screen reader currently announces "navigation, navigation, navigation". Add `aria-label="Primary"` to `SidebarNav`, `aria-label="Mobile primary"` to `MobileNav`, `aria-label="Main content"` to `<main>`.

> **[L] Mobile nav label `text-[10px]`** — `MobileNav.tsx:54`. Below the 12px floor most teams enforce, and disconnected from the type scale. Options: bump to `text-xs` (13px in this project), or hide labels altogether at the smallest breakpoint and rely on icons + `aria-label`.

> **[S] Two `z-50` layers + one `z-[100]`** — covered in §2.

> **[S] Sidebar visual rhythm** — `SidebarNav` items use `rounded-md` (12px) while pretty much every other interactive surface uses `rounded-pill` for primary actions. Defensible (sidebar items are list-like, not buttons) but worth a one-line rule in `CLAUDE.md`: "sidebar/menu rows = `rounded-md`, primary CTAs = `rounded-pill`."

---

## 5. Per-Feature Review

### Dashboard (`src/components/dashboard/`)
- Card grid `grid-cols-2 gap-3 md:grid-cols-3` with Balance spanning `col-span-2 md:col-span-1` — works at 360px width (tested mentally; the 2-up split is 152px per card after gap & padding — tight but OK for sparklines).
- `MonthSelector` mobile sheet vs desktop popover split is correct.
- **Nit [S]:** `MonthSelector` month buttons are `h-12` mobile and `sm:h-10` desktop — the only place in the app with `h-12`. Consider whether the larger touch target on mobile is intentional (probably yes; keep) or accidental (align to `h-field`).

### Transactions (`src/components/transactions/`)
- `TransactionList` groups by date with a sticky `bg-muted px-4 py-1.5 text-xs font-semibold` header — clean.
- Form: `grid grid-cols-1 gap-4 sm:grid-cols-2` with Type/Currency/Amount spanning `sm:col-span-2`. Mobile-first, good.
- **Nit [S]:** `TransactionFilters` internal `space-y-4` is more spacious than `TransactionForm`'s sections. Pick one section rhythm.
- **Nit [S]:** Pagination shows icon-only buttons on mobile, with text + icon on `sm:`. If a user dials font-size up via Settings, icon-only buttons stay 40px but the surrounding text reflows — visually jarring at the breakpoint edge.

### Categories (`src/components/categories/`)
- `CategoryRow` is markedly sparser than `TransactionRow` — just a name in a `ListItem`. Visually thin.
- **[S]** Consider showing budget summary inline (e.g. `€120 / €500` on the right) so the row carries weight. The data is already fetched for the dashboard via `useCategoriesSummary`.

### Settings (`src/components/settings/`)
- The 7 split sections now share an identical scaffold: `<section className="space-y-3"><SectionHeader … /><Card className="p-4 space-y-4">…</Card></section>`. ✅ Excellent.
- **[S]** This pattern should be lifted into a `SettingsSection` (or generic `Section`) component so future sections can't drift.
- **[S]** Settings page has no `max-w` constraint beyond the global `md:max-w-4xl`. On very wide screens, single-column toggles stretch awkwardly. Consider `max-w-2xl mx-auto` for the settings grid.

---

## 6. 2026 Best-Practice Checklist

| ✓ | Item | Where / Why |
|---|---|---|
| ✅ | React 19 ref-as-prop everywhere | No `forwardRef` in `src/components/ui/` |
| ✅ | Tailwind v4 `@theme` + `@utility` | `src/index.css` — but under-leveraged (see §3.4) |
| ✅ | `dvh` / `svh` viewport units | `AppShell`, sidebar `h-[calc(100dvh-3.5rem)]` |
| ✅ | `light-dark()` CSS function | `src/lib/categoryColor.ts` |
| ✅ | `prefers-reduced-motion` | Sheet animations, skeleton shimmer, all transitions |
| ✅ | `env(safe-area-inset-*)` | Header pt, main pb, mobile nav bottom, toast viewport |
| ✅ | `tabular-nums` for finance | Body-level `font-variant-numeric` |
| ✅ | `@starting-style` for entrance anims | FAB (`MobileNav.tsx:68`) — modern touch |
| ✅ | `linear()` spring easing | `--easing-spring`, very current |
| ✅ | `color-mix(in oklab, …)` | Skeleton shimmer |
| ⚠️ | Skip-to-main link / landmark labels | **Missing** — §4.2 |
| ⚠️ | `@container` queries | Not used. Card grids could become container-driven so they don't depend on global breakpoints. |
| ⚠️ | View Transitions API | Not wired. Modest opportunity for route transitions, gated on `prefers-reduced-motion`. |
| ⚠️ | First-paint `color-scheme` | Set in JS only; pre-hydration paint can flash. Consider inlining `<script>` to set `.dark` before first paint (FOUC mitigation). |
| ⚠️ | `@property` declarations | Not used. Useful if any `--*` variables become animatable. Skip until needed. |

---

## 7. Ranked Fix List

Sorted by impact ÷ effort. Severity: **M**edium, **L**ow, **S**mall-polish.

| # | Sev | Theme | Fix | Files | Effort |
|---|---|---|---|---|---|
| 1 | M | A11y | Standardise focus strategy (`:focus` → `:focus-visible`, `outline` → `ring`, add to SidebarNav) | `switch.tsx`, `toast.tsx`, `MobileNav.tsx` | S |
| 2 | M | Tokens | Promote `focus-ring`, `list-row` to `@utility`; replace 10+ call sites | `index.css`, `button-variants.ts`, `input.tsx`, `select.tsx`, `switch.tsx`, `list-item.tsx`, `list-skeleton.tsx` | S |
| 3 | L | A11y | Skip-to-main link + landmark `aria-label`s | `AppShell.tsx`, `MobileNav.tsx`, `SidebarNav` | XS |
| 4 | L | Tokens | Z-index scale (`--z-header`, `--z-overlay`, `--z-toast`) | `index.css`, `Header.tsx`, `MobileNav.tsx`, `toast.tsx` | XS |
| 5 | L | A11y | Lift Settings scaffold into a `Section` component | new `src/components/settings/Section.tsx`, all 7 section files | S |
| 6 | L | Polish | `MobileNav` label `text-[10px]` → `text-xs` or icon-only | `MobileNav.tsx:54` | XS |
| 7 | L | Polish | `Button` icon variant `h-10 w-10` → `size-10` | `button-variants.ts:20` | XS |
| 8 | L | Polish | Normalise `active:scale` to one value (keep 0.90 for FAB/Close) | `button-variants.ts`, `toast.tsx`, `MobileNav.tsx` | XS |
| 9 | L | UX | `CategoryRow` shows budget summary inline | `categories/CategoryRow.tsx`, depends on `useCategoriesSummary` | M |
| 10 | S | Tokens | Type scale tokens `--text-base/lg/xl/2xl` | `index.css` + migrate page titles | S |
| 11 | S | Tokens | Shadow scale tokens (`shadow-card`, `shadow-overlay`, `shadow-floating`) | `index.css`, `card.tsx`, `dialog.tsx`, `toast.tsx`, `MobileNav.tsx` | S |
| 12 | S | A11y | Scope global scrollbar-hiding to mobile shell only | `index.css` | XS |
| 13 | S | UX | Settings grid `max-w-2xl mx-auto` | `SettingsPage.tsx` | XS |
| 14 | S | UX | `TransactionFilters` rhythm align to `TransactionForm` | `TransactionFilters.tsx` | XS |
| 15 | S | Modern | PWA `theme_color` drift — document or runtime-sync `<meta>` | `vite.config.ts`, `index.html`, theme store | S |
| 16 | S | Modern | First-paint theme inline script (avoid dark-mode FOUC) | `index.html`, `main.tsx` | S |
| 17 | S | Modern | View Transitions on route change (reduced-motion gated) | `router.ts`, root layout | M |
| 18 | S | Modern | `@container` queries for dashboard card grids | `dashboard/*Card.tsx`, `index.css` | M |

A reasonable first PR bundles #1, #2, #3, #4, #7, #8 — all small, low-risk, mostly mechanical, and they punch above their weight on consistency. #5 is the highest-value architectural follow-up.

---

## 8. Appendix

<details>
<summary>A. Every <code>@theme</code> token in <code>src/index.css</code></summary>

**Colour (light)**
- `--color-background`, `--color-foreground`
- `--color-card`, `--color-card-foreground`
- `--color-popover`, `--color-popover-foreground`
- `--color-primary`, `--color-primary-foreground`
- `--color-secondary`, `--color-secondary-foreground`
- `--color-muted`, `--color-muted-foreground`
- `--color-accent`, `--color-accent-foreground`
- `--color-destructive`, `--color-destructive-foreground`
- `--color-income`, `--color-expense`
- `--color-border`, `--color-input`, `--color-ring`

**Radius:** `--radius-sm 0.5rem` · `--radius-md 0.75rem` · `--radius-lg 1rem` · `--radius-pill 9999px`

**Control sizing:** `--spacing-control 0.75rem` · `--spacing-control-inner 0.625rem` · `--leading-control 1.5`

**Typography:** `--font-sans` (system stack) · `--text-xs 0.8125rem` (+ line-height 1.125rem) · `--text-sm 0.9375rem` (+ line-height 1.375rem). **Nothing beyond `sm`.**

**Easing/anim:** `--easing-spring` (custom `linear()`) · `--animate-fade-in/out` · `--animate-in/out-bottom-sheet` · `--animate-dot-pulse`

**Custom utilities defined:** `h-field`, `size-field`, `transition-spring`, `privacy-blur`, `skeleton-shimmer`

</details>

<details>
<summary>B. UI primitives — class fingerprint per component</summary>

| Component | Root classes (verbatim) |
|---|---|
| `Button` (base) | `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-pill text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.98] motion-reduce:transition-none` |
| `Input` | `flex h-field w-full rounded-md border border-input bg-background px-3 py-control text-[max(var(--font-size-base),16px)] ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50` |
| `Card` | `rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden` (+ glass branch) |
| `Switch` (label) | `relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-pill transition-colors focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background` |
| `Dialog` (mobile) | `bottom-0 left-0 max-w-none rounded-t-lg border-x-0 border-b-0 translate-y-0 max-h-[90dvh] overflow-y-auto p-6 data-[state=open]:animate-in-bottom-sheet data-[state=closed]:animate-out-bottom-sheet` |
| `Toast` root | `… rounded-lg border bg-background p-4 pr-10 text-foreground shadow-lg …` |
| `ToastAction` | `… rounded-md … focus:outline-none focus:ring-2 focus:ring-ring …` ⚠️ |
| `ToastClose` | `… rounded-pill … focus:outline-none focus:ring-2 focus:ring-ring …` ⚠️ |
| `ListItem` | `flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30 active:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset cursor-pointer touch-manipulation` |
| `MobileNav` link | `… focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2` ⚠️ |
| `SidebarNav` link | `flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent …` _(no focus-visible)_ ⚠️ |

</details>

<details>
<summary>C. Per-feature card pattern check (all match)</summary>

Dashboard, Transactions, Categories, Settings all wrap content in `<Card>` with `CardHeader` (`p-4 space-y-1.5`) + `CardContent` (`p-4 pt-0`). Settings adds a `space-y-4` inside the card for vertical rhythm between toggle rows. No divergence found across pages.
</details>

---

_End of audit. See §7 for an actionable backlog._
