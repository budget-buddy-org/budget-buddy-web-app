import { UserManager, type UserManagerSettings } from 'oidc-client-ts';

function requiredEnv(name: 'VITE_OIDC_ISSUER' | 'VITE_OIDC_CLIENT_ID'): string {
  const value = import.meta.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export function getOidcConfig(): UserManagerSettings {
  return {
    authority: requiredEnv('VITE_OIDC_ISSUER'),
    client_id: requiredEnv('VITE_OIDC_CLIENT_ID'),
    redirect_uri: `${window.location.origin}/auth/callback`,
    post_logout_redirect_uri: `${window.location.origin}/`,
    response_type: 'code',
    scope: 'openid profile email offline_access',
    // Enable background token refresh
    automaticSilentRenew: true,
    // Helps with 401s if the server returns extra claims Zitadel adds
    filterProtocolClaims: true,
    loadUserInfo: true,
  };
}

export const userManager = new UserManager(getOidcConfig());

export function onOidcSigninCallback(): void {
  window.history.replaceState({}, document.title, '/');
}
