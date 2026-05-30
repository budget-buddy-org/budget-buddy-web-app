import { UserManager, type UserManagerSettings, WebStorageStateStore } from 'oidc-client-ts';

let _userManager: UserManager | null = null;

// Protocol-required scopes. `openid` is mandatory for OIDC; `offline_access`
// is required for the IdP to issue a refresh token (without one, silent renew
// falls back to an iframe with prompt=none and dies with the IdP session
// cookie). These are not configurable — extras are appended on top.
export const DEFAULT_OIDC_SCOPES = ['openid', 'profile', 'email', 'offline_access'] as const;

function mergeScopes(extraScopes?: string): string {
  const extras = (extraScopes ?? '').split(/\s+/).filter(Boolean);
  const overlap = extras.filter((s) => (DEFAULT_OIDC_SCOPES as readonly string[]).includes(s));
  if (overlap.length > 0) {
    console.warn(
      `[oidc] VITE_OIDC_SCOPES contains protocol defaults that are always requested: ${overlap.join(', ')}. Remove them from runtime config.`,
    );
  }
  const seen = new Set<string>();
  return [...DEFAULT_OIDC_SCOPES, ...extras].filter((s) => !seen.has(s) && seen.add(s)).join(' ');
}

export function buildOidcSettings(
  issuer: string,
  clientId: string,
  extraScopes?: string,
): UserManagerSettings {
  const scopeValue = mergeScopes(extraScopes);

  return {
    authority: issuer,
    client_id: clientId,
    redirect_uri: `${globalThis.location.origin}/auth/callback`,
    post_logout_redirect_uri: `${globalThis.location.origin}/`,
    // Enable silent renew with a dedicated callback route so the SDK can
    // refresh tokens without navigating the top-level application.
    silent_redirect_uri: `${globalThis.location.origin}/auth/silent-renew.html`,
    response_type: 'code',
    scope: scopeValue,
    automaticSilentRenew: true,
    filterProtocolClaims: true,
    loadUserInfo: true,
    stateStore: new WebStorageStateStore({ store: globalThis.sessionStorage }),
    // Persist the signed-in user (access token + refresh token) in localStorage
    // so the session survives tab close and browser restart. The SDK default is
    // sessionStorage, which logs the user out on every new tab / cold start.
    // Exposure to XSS is mitigated by the strict CSP enforced by the proxy.
    userStore: new WebStorageStateStore({ store: globalThis.localStorage }),
  };
}

/**
 * Initializes the shared UserManager with runtime-loaded OIDC config.
 * Must be called once in main.tsx after loadConfig() resolves, before rendering.
 */
export function initUserManager(
  issuer: string,
  clientId: string,
  extraScopes?: string,
): UserManager {
  _userManager = new UserManager(buildOidcSettings(issuer, clientId, extraScopes));
  return _userManager;
}

/**
 * Returns the shared UserManager instance.
 * Throws if called before initUserManager() — enforces correct boot order.
 */
export function getUserManager(): UserManager {
  if (!_userManager) {
    throw new Error('UserManager not initialised. Call initUserManager() in main.tsx first.');
  }
  return _userManager;
}

/**
 * Called by react-oidc-context after signinCallback completes.
 * Restores the original URL that was saved in url_state before the IdP
 * redirect, so deep links survive the authentication round-trip.
 */
export function onOidcSigninCallback(user: unknown): void {
  const returnUrl =
    user && typeof user === 'object' && 'url_state' in user && typeof user.url_state === 'string'
      ? user.url_state
      : '/';

  window.history.replaceState({}, document.title, returnUrl);
}
