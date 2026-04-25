# Authentication Architecture

Budget Buddy uses **OpenID Connect (OIDC)** for authentication. All authentication is handled by an external identity provider (IdP) — the frontend never manages credentials or issues tokens.

## Flow

```
User visits /                   ProtectedAppLayout checks auth state
  → not authenticated           calls auth.signinRedirect()
  → browser redirects to IdP    Authorization Code Flow + PKCE
  → user authenticates
  → IdP redirects to /auth/callback   AuthCallbackPage shown briefly
  → react-oidc-context exchanges code  tokens stored in localStorage
  → onOidcSigninCallback() clears URL  app renders normally
```

**Authorization Code Flow with PKCE** is enforced via `response_type: 'code'`. `oidc-client-ts` generates the PKCE code verifier and challenge using the WebCrypto API — no explicit configuration is required.

## Token Storage

The signed-in user (access token + refresh token) is stored in **`localStorage`** via an explicit `userStore: new WebStorageStateStore({ store: localStorage })` in `src/lib/oidc.ts`. `localStorage` persists across tab close and browser restart — without this override `oidc-client-ts` defaults to `sessionStorage`, which wipes the session every time the last tab closes and forces a full round-trip to the IdP on next visit.

Short-lived PKCE state (`state`, `code_verifier`) is kept in `sessionStorage` (`stateStore`). It only needs to survive the redirect round-trip, so the tighter scope is appropriate.

The XSS blast-radius tradeoff is mitigated by the strict CSP (see below) — any script not in `script-src` will not execute and therefore cannot read `localStorage`.

## Background Token Renewal

`automaticSilentRenew: true` instructs `oidc-client-ts` to refresh tokens in the background before they expire. When a refresh token is present (from `offline_access` scope), the SDK uses it directly; otherwise it falls back to a hidden iframe pointing at the IdP's authorization endpoint. The iframe is redirected to `/auth/silent-renew.html`, which posts the resulting URL back to the parent window via `postMessage` so the React bundle is not re-loaded inside the iframe. Configure the matching silent redirect URI in your IdP (see IdP setup below).

### Safety-net refresh

`getAuthToken()` in `src/lib/api.ts` performs a **safety-net refresh** via `signinSilent()` only when the token is within **10 seconds** of expiry. The threshold is deliberately well below the SDK's 60-second `automaticSilentRenew` trigger so the two paths don't race — overlapping refreshes both redeem the same refresh token, which IdPs that enable refresh-token rotation treat as token theft and invalidate the session.

Concurrent calls to `getAuthToken()` are **deduped** onto a single in-flight `signinSilent()` promise (`pendingSilentRenew`). Without dedupe, a burst of API requests firing simultaneously would each trigger their own refresh and invalidate the session.

## Session Expiry

If a request returns HTTP 401, the response interceptor in `src/lib/api.ts` calls `signinRedirect()` to re-authenticate. All `/auth/*` paths are excluded from this redirect to prevent loops on the callback route.

## Runtime Configuration

All settings are injected at container startup via `envsubst` — **no image rebuild** is required when they change.

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Backend API base URL |
| `VITE_OIDC_ISSUER` | OIDC issuer URL (e.g. `https://auth.example.com`) |
| `VITE_OIDC_CLIENT_ID` | SPA client ID registered in the IdP |
| `VITE_OIDC_SCOPES` | (optional) space-separated scopes string to request from the IdP; when set it overrides the default scopes |
| `VITE_OIDC_USER_MANAGEMENT_URL` | (optional) fallback URL for the identity provider's user management page |

In Docker, the entrypoint substitutes these into `config.json` (served at `/config.json`) and into the nginx Content-Security-Policy header. `src/lib/config.ts` reads `config.json` at startup before the app renders.

For local development, set these in `.env.local`:

```
VITE_API_URL=http://localhost:8080
VITE_OIDC_ISSUER=https://auth.example.com
VITE_OIDC_CLIENT_ID=your-client-id
VITE_OIDC_USER_MANAGEMENT_URL=https://auth.example.com/account
```

## OIDC Client Setup

Register a **SPA** application in your IdP with:

- **Grant type:** Authorization Code
- **Auth method:** None (PKCE only — no client secret)
- **Redirect URI:** `https://your-app.example.com/auth/callback`
- **Post-logout redirect URI:** `https://your-app.example.com/`
- **Silent renew URI:** `https://your-app.example.com/auth/silent-renew.html`
- **Scopes:** `openid profile email offline_access` — `offline_access` is **required** to receive a refresh token. Without it, the session ends when the short-lived access token expires (~1 hour on most providers).

### IdP settings to verify if users are logged out more often than expected

Names vary across providers, but most IdPs expose equivalents of the following. Check each in your IdP's admin console under the SPA app's configuration:

1. **Refresh Token issuance**: must be enabled on the application. Without it, the IdP will not issue a refresh token even when `offline_access` is requested in the scope, and the session ends as soon as the access token expires.
2. **Refresh Token idle / absolute expiration**: governs how long a session can stay alive across idle periods and total elapsed time. If users are forced to re-sign-in more often than expected, these are the levers.
3. **Access Token type / format**: must be **JWT** so the API can validate it locally against the issuer's JWKS without an introspection round-trip.

## Content Security Policy

The nginx security headers include a `Content-Security-Policy` built from the runtime env vars:

```
connect-src 'self' <VITE_API_URL> <VITE_OIDC_ISSUER>
frame-src <VITE_OIDC_ISSUER>
```

This prevents credentials from being exfiltrated to unexpected origins even if an XSS vulnerability is present. The `frame-src` directive is required for the silent-renew iframe.

> **Note:** `script-src` currently includes `'unsafe-inline'` to support the theme-initialisation inline script in `index.html`. Replace it with a SHA-256 hash once that script is stable.

## Key Files

| File | Purpose |
|---|---|
| `src/lib/oidc.ts` | `buildOidcSettings`, `initUserManager`, `getUserManager` |
| `src/lib/api.ts` | `getAuthToken` (proactive refresh), request/response interceptors |
| `src/lib/config.ts` | Runtime config loader (reads `/config.json`) |
| `src/components/layout/ProtectedAppLayout.tsx` | Auth guard for all `_app/` routes |
| `src/routes/auth/callback.tsx` | OIDC callback landing page |
| `public/auth/silent-renew.html` | Static page loaded in the silent-renew iframe; posts the response URL back to the parent window |
| `nginx.security-headers.conf.template` | CSP + security headers template |
| `docker/docker-entrypoint.sh` | `envsubst` injection at container startup |
