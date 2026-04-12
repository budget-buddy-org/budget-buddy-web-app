# UI Polish: Typography, Form Clarity, and Mobile Experience

## Summary

A collection of UI issues spanning general typography/accessibility and mobile-specific layout problems. These are independent but related improvements that should be addressed together for a consistent polish pass.

---

## Issues

### 1. Required fields are not visually marked

**Affected files:**
- `src/routes/_auth/login.lazy.tsx` — Username, Password
- `src/routes/_auth/register.lazy.tsx` — Username, Password
- `src/routes/_app/transactions/index.lazy.tsx` — Amount, Date (create & edit forms)

**Problem:**  
Mandatory fields have no visual indicator. Users have no way to distinguish required from optional fields before submitting.

**Fix:**  
Add a red asterisk (`*`) after each required field label. Convention: `<span aria-hidden="true" class="text-destructive ml-0.5">*</span>` — keep `aria-hidden` since the `required` HTML attribute already communicates this to screen readers.

---

### 2. Base font size is too small

**Affected files:**
- `src/index.css` — base `body` styles
- `src/components/ui/input.tsx` — `text-sm` (14px)
- Form labels throughout `transactions/index.lazy.tsx`, `categories/index.lazy.tsx`

**Problem:**  
The app uses `text-sm` (14px) as the default for inputs and form labels. This is below comfortable reading size and also triggers the iOS auto-zoom issue described below.

**Fix:**  
- Set a base font size of 16px in `body` (or via `html { font-size: 16px }`).
- Update `Input` component (`src/components/ui/input.tsx`) to use `text-base` instead of `text-sm`.
- Review form label sizes — `text-xs` filter labels in the transactions page may need to bump to `text-sm`.

---

### 3. Active navigation item is visually indistinguishable from inactive

**Affected files:**
- `src/components/layout/MobileNav.tsx`
- `src/components/layout/MobileNav.tsx` (`SidebarNav`)
- `src/index.css` — `--color-foreground` vs `--color-muted-foreground`

**Problem:**  
Active nav items use `text-foreground` (`hsl(240 10% 3.9%)`) while inactive items use `text-muted-foreground` (`hsl(240 3.8% 46.1%)`). The contrast difference is subtle — especially in dark mode where the active item is `hsl(0 0% 98%)` vs inactive `hsl(240 5% 64.9%)`. A glance at the bottom bar doesn't make it obvious which tab is selected.

**Fix (options — pick one):**
- Add a colored indicator (e.g. a 2px top border or a small dot above the icon) on the active tab in `MobileNav`.
- Use `text-primary` for the active state instead of `text-foreground`, or add `font-semibold` + a distinct accent color.
- In `SidebarNav`, the `bg-accent` background helps but a left border accent (`border-l-2 border-primary`) would make the selection unmistakable.

---

### 4. Mobile bottom nav does not respect iOS safe area

**Affected files:**
- `src/components/layout/MobileNav.tsx`
- `src/components/layout/AppShell.tsx`

**Problem:**  
`MobileNav` is positioned `fixed bottom-0` without accounting for the iOS home indicator safe area (`env(safe-area-inset-bottom)`). On iPhones with a home indicator the nav bar overlaps the system UI, and its content sits too close to the bottom edge.

`AppShell` compensates for the nav height with `pb-20`, but this does not scale with the variable safe area inset.

**Fix:**  
```tsx
// MobileNav.tsx — add padding-bottom for safe area
<nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden pb-[env(safe-area-inset-bottom)]">
  <div className="flex">
    ...
  </div>
</nav>
```

```html
<!-- index.html — enable viewport safe area -->
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

Also update `AppShell` main padding to account for both nav height and safe area:
```tsx
<main className="flex-1 overflow-y-auto pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
```

---

### 5. Form inputs overflow and misalign on small screens

**Affected files:**
- `src/routes/_app/transactions/index.lazy.tsx` — create form and `TransactionEditRow` use `grid grid-cols-2 gap-3`
- `src/routes/_app/transactions/index.lazy.tsx` — filter bar uses `grid grid-cols-2 gap-3 md:grid-cols-4`

**Problem:**  
The 2-column grid in the transaction create/edit forms and the filter bar causes inputs to be too narrow on small viewports (e.g. iPhone SE, ~375px). Fields clip or squeeze together and don't align consistently, especially when validation error messages appear underneath and shift adjacent columns.

**Fix:**  
- For the create/edit form, use `grid-cols-1` as the base and `grid-cols-2` only from `sm:` breakpoint:
  ```tsx
  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
  ```
- For the filter bar, similarly fall back to a single column on mobile:
  ```tsx
  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
  ```

---

### 6. iOS zooms in when focusing inputs

**Affected files:**
- `src/components/ui/input.tsx`
- `src/components/ui/select.tsx`

**Problem:**  
iOS Safari automatically zooms in when the user taps an input with `font-size` below 16px. The `Input` component currently uses `text-sm` (14px), which triggers this behaviour on every form in the app. The zoom is jarring, disrupts the layout, and users must manually zoom back out.

**Fix:**  
Set `font-size: 16px` (or `text-base`) on the `Input` and `Select` components. This is the single most impactful change to prevent the zoom — no `touch-action` or `user-scalable=no` hacks needed or desired (those harm accessibility).

```tsx
// src/components/ui/input.tsx
'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ...'
//                                                                            ^^^^^^^^^^
```

> Note: this overlaps with issue #2 (font size). Fixing the `Input` and `Select` base font size resolves both.

---

### 7. App version is not visible

**Affected files:**
- `vite.config.ts`
- `src/components/layout/Header.tsx`

**Problem:**  
There is no way for users (or support) to know which version of the app is running. Current version is `2.2.0` in `package.json` but it is never surfaced in the UI.

**Fix:**  
Inject the version at build time via Vite's `define` (reads `package.json` with `readFileSync` — no JSON import config changes needed), then display it as a small muted label in the `Header` next to the app name.

**Step 1** — `vite.config.ts`:
```ts
import { readFileSync } from 'node:fs';
const { version } = JSON.parse(readFileSync('./package.json', 'utf-8')) as { version: string };

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  // ...
})
```

**Step 2** — `src/vite-env.d.ts` (new file):
```ts
declare const __APP_VERSION__: string;
```

**Step 3** — `src/components/layout/Header.tsx`:
```tsx
<span className="font-semibold tracking-tight">
  Budget Buddy
  <span className="ml-1.5 text-xs font-normal text-muted-foreground">v{__APP_VERSION__}</span>
</span>
```

---

## Files to change (consolidated)

| File | Changes needed |
|---|---|
| `src/index.css` | Bump base body font size |
| `src/components/ui/input.tsx` | `text-sm` → `text-base` |
| `src/components/ui/select.tsx` | `text-sm` → `text-base` (check current size) |
| `src/components/layout/MobileNav.tsx` | Add `pb-[env(safe-area-inset-bottom)]` to nav; improve active state contrast |
| `src/components/layout/AppShell.tsx` | Update `pb-20` to include safe area inset |
| `index.html` | Add `viewport-fit=cover` to viewport meta |
| `src/routes/_auth/login.lazy.tsx` | Add `*` to required field labels |
| `src/routes/_auth/register.lazy.tsx` | Add `*` to required field labels |
| `src/routes/_app/transactions/index.lazy.tsx` | Add `*` to required labels; fix grid cols for mobile |
| `vite.config.ts` | Inject `__APP_VERSION__` via `define` |
| `src/vite-env.d.ts` | Declare `__APP_VERSION__` global |
| `src/components/layout/Header.tsx` | Display version next to app name |

## Labels

`bug`, `ux`, `mobile`, `accessibility`
