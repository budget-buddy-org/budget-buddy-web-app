import { UserManager, WebStorageStateStore, type UserManagerSettings } from 'oidc-client-ts';

let _userManager: UserManager | null = null;

export function buildOidcSettings(issuer: string, clientId: string): UserManagerSettings {
  return {
    authority: issuer,
    client_id: clientId,
    redirect_uri: `${window.location.origin}/auth/callback`,
    post_logout_redirect_uri: `${window.location.origin}/`,
    response_type: 'code',
    scope: 'openid profile email offline_access',
    automaticSilentRenew: true,
    filterProtocolClaims: true,
    loadUserInfo: true,
    // Keep PKCE verifier/state/nonce in sessionStorage (tab-scoped, clears on close),
    // consistent with where oidc-client-ts stores the tokens themselves.
    stateStore: new WebStorageStateStore({ store: window.sessionStorage }),
  };
}

/**
 * Initialises the shared UserManager with runtime-loaded OIDC config.
 * Must be called once in main.tsx after loadConfig() resolves, before rendering.
 */
export function initUserManager(issuer: string, clientId: string): UserManager {
  _userManager = new UserManager(buildOidcSettings(issuer, clientId));
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

export function onOidcSigninCallback(): void {
  window.history.replaceState({}, document.title, '/');
}
