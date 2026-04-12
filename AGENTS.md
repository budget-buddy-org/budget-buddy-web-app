### Configuration Conventions

#### Runtime Configuration
- Pattern: The application uses a runtime configuration injection pattern via `/config.json`.
- Environment Variables: All frontend environment variables (starting with `VITE_`) must be injected at runtime using `envsubst` within the Docker entrypoint.
- Fallback: The `src/lib/config.ts` module handles both runtime loading and local development fallbacks.
- Initialization: Configuration must be loaded during the application bootstrap in `src/main.tsx` before the UI is rendered. The `src/lib/api.ts` module must not initialize the API client itself; it should only register interceptors.

### Error Handling Conventions

#### Error Fallbacks
- Generic Message: All default error fallbacks must show a generic "Something went wrong" message and "An unexpected error occurred. Please try again later."
- Error Details: Provide a "Show details" toggle that reveals `error.message` and `error.stack` (if available) for troubleshooting.
- Consistency: Use consistent UI patterns for error boundaries and route-level error components.

### Accessibility (a11y) Conventions

#### Testing
- Tooling: Use `vitest-axe` and `@axe-core/react` for automated accessibility testing.
- Test Files: Create `.a11y.test.tsx` files for critical routes (e.g., login, dashboard, transactions).
- Execution: Run a11y tests using `pnpm test:a11y`.

#### Implementation
- Headings: Ensure heading levels are progressive (e.g., `h1` must be followed by `h2`, not `h3`).
- Interactive Elements: All icon-only buttons must include a descriptive `aria-label`.
- Semantics: Use semantic HTML elements wherever possible.
- Mobile Compatibility: Input/Select components must use `text-base` (16px) to prevent iOS auto-zoom. Hide scrollbars globally via `src/index.css` for a cleaner app-like experience.
- Form Indicators: Mark required fields with `*` using `<span className="text-destructive">*</span>` inside labels.
- iOS Safety: Use `viewport-fit=cover` in `index.html` and safe area insets (e.g., `pb-[env(safe-area-inset-bottom)]`) for mobile-only sticky elements. The tab bar (MobileNav) should have a content height of 50px to match standard iOS height (total 83px-84px with safe area).
- Desktop UX: Ensure all interactive elements (buttons, selects, clickable list items) use `cursor-pointer` to provide clear feedback on hover.

### Component Organization
- **Page-Specific Components**: Move sub-components for specific pages out of `src/routes/` and into `src/components/{page-name}/` to prevent TanStack Router from scanning them as potential routes.
- **Shared UI**: Keep generic primitives in `src/components/ui/`.

### Versioning
- App version: Injected at build time via Vite `define` as `__APP_VERSION__`. Display in the `Header` component.

### Notification Conventions
#### Success/Error Feedback
- Hook: Use `useToast` hook from `@/hooks/use-toast` for actionable feedback.
- Placement: The `Toaster` component is globally integrated in `src/routes/__root.tsx`.
- Best Practice: Provide clear, concise messages for successful actions (e.g., "Category created") and helpful error messages for failures.

### Destructive Action Conventions
#### Confirmation
- Component: Use `ConfirmationDialog` for all destructive actions like deleting data.
- Styling: The confirm button should use `variant="destructive"` to provide visual warning.
- Content: Always clearly state what is being deleted and that the action cannot be undone.

### Authentication Conventions
#### Token Lifecycle
- Proactive Refresh: Re-authenticate during the bootstrap phase in `src/main.tsx` if a `refreshToken` exists but an `accessToken` is missing. This maintains session continuity across page reloads.
- Centralized Refresh: Use the `refreshAuth` function in `src/lib/api.ts` for both the `401` response interceptor and manual/proactive refresh calls.
