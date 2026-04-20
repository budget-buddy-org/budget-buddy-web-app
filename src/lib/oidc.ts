import { UserManager, type UserManagerSettings } from 'oidc-client-ts';

let _userManager: UserManager | null = null;

export function buildOidcSettings(issuer: string, clientId: string): UserManagerSettings {
  return {
    authority: issuer,
    client_id: clientId,
    redirect_uri: `${window.location.origin}/auth/callback`,
    post_logout_redirect_uri: `${window.location.origin}/`,
    // Dedicated minimal page for background token renewal via hidden iframe.
    // Using a separate page avoids loading the full React bundle inside the iframe.
    silent_redirect_uri: `${window.location.origin}/silent-renew.html`,
    response_type: 'code', // Authorization Code Flow with PKCE (oidc-client-ts default)
    scope: 'openid profile email offline_access',
    automaticSilentRenew: true,
    filterProtocolClaims: true,
    loadUserInfo: true,
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
