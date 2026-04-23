# Authentication Architecture

Budget Buddy uses **OpenID Connect (OIDC)** for authentication. All authentication is handled by an external identity provider (IdP) — the frontend never manages credentials or issues tokens.

## Flow

```
User visits /                   ProtectedAppLayout checks auth state
  → not authenticated           calls auth.signinRedirect()
  → browser redirects to IdP    Authorization Code Flow + PKCE
  → user authenticates
  → IdP redirects to /auth/callback   AuthCallbackPage shown briefly
  → react-oidc-context exchanges code  tokens stored in sessionStorage
  → onOidcSigninCallback() clears URL  app renders normally
```

**Authorization Code Flow with PKCE** is enforced via `response_type: 'code'`. `oidc-client-ts` generates the PKCE code verifier and challenge using the WebCrypto API — no explicit configuration is required.

## Token Storage

Tokens are stored in **`sessionStorage`** by `oidc-client-ts` (the library default). `sessionStorage` is tab-scoped and cleared when the tab is closed, limiting the blast radius of XSS compared to `localStorage`. A Backend-for-Frontend (BFF) with HttpOnly cookies would further reduce exposure but requires server infrastructure.

## Background Token Renewal

`automaticSilentRenew: true` instructs `oidc-client-ts` to refresh tokens in the background before they expire. The library creates a hidden iframe pointing to the IdP's authorization endpoint and redirects to the configured silent redirect URI. The app uses `/auth/silent-renew` as the silent redirect callback; configure your IdP's silent redirect URI accordingly (see IdP setup below). The callback returns the response to the parent frame via `postMessage` so the React bundle is not loaded in the iframe.

In addition, `getAuthToken()` in `src/lib/api.ts` performs a **proactive refresh** via `signinSilent()` if the token expires within 60 seconds. This prevents mid-request token expiry in the window between `automaticSilentRenew` cycles.

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
- **Silent renew URI:** `https://your-app.example.com/auth/silent-renew`
- **Scopes:** `openid profile email offline_access`

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
| `src/routes/auth/silent-renew` | Silent renew callback route used by the OIDC SDK |
| `nginx.security-headers.conf.template` | CSP + security headers template |
| `docker/docker-entrypoint.sh` | `envsubst` injection at container startup |
