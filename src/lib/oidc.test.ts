import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildOidcSettings, onOidcSigninCallback } from './oidc';

describe('buildOidcSettings', () => {
  it('builds settings from issuer and clientId with default scopes', () => {
    const settings = buildOidcSettings('https://issuer.example.com', 'web-client');

    expect(settings.authority).toBe('https://issuer.example.com');
    expect(settings.client_id).toBe('web-client');
    expect(settings.redirect_uri).toBe(`${window.location.origin}/auth/callback`);
    expect(settings.post_logout_redirect_uri).toBe(`${window.location.origin}/`);
    expect(settings.response_type).toBe('code');
    // default scopes include openid and offline_access
    expect(settings.scope).toBe('openid profile email offline_access');
  });

  it('uses custom scopes when provided', () => {
    const settings = buildOidcSettings(
      'https://issuer.example.com',
      'web-client',
      'openid profile email api:read',
    );

    expect(settings.scope).toBe('openid profile email api:read');
  });

  it('uses sessionStorage for PKCE state store', () => {
    const settings = buildOidcSettings('https://issuer.example.com', 'web-client');

    expect(settings.stateStore).toBeDefined();
  });

  it('configures a persistent user store so the session survives tab close', () => {
    const settings = buildOidcSettings('https://issuer.example.com', 'web-client');

    expect(settings.userStore).toBeDefined();
  });
});

describe('getUserManager / initUserManager', () => {
  // Reset the module-level singleton between tests
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    window.history.replaceState({}, '', '/');
  });

  it('throws before initUserManager is called', async () => {
    // Fresh module import so the singleton is null
    const { getUserManager: freshGet } = await import('./oidc');
    expect(() => freshGet()).toThrow('UserManager not initialised');
  });

  it('returns the same UserManager instance after initialisation', async () => {
    const { initUserManager: freshInit, getUserManager: freshGet } = await import('./oidc');
    const mgr = freshInit(
      'https://issuer.example.com',
      'web-client',
      'openid profile email api:read',
    );

    expect(freshGet()).toBe(mgr);
  });
});

describe('onOidcSigninCallback', () => {
  afterEach(() => {
    window.history.replaceState({}, '', '/');
  });

  it('strips OIDC params from the URL after signin', () => {
    window.history.replaceState({}, '', '/auth/callback?code=test&state=test');

    onOidcSigninCallback(undefined);

    expect(window.location.pathname).toBe('/');
    expect(window.location.search).toBe('');
  });

  it('restores the original deep-link URL from url_state', () => {
    window.history.replaceState({}, '', '/auth/callback?code=test&state=test');

    onOidcSigninCallback({ url_state: '/transactions?page=2' });

    expect(window.location.pathname).toBe('/transactions');
    expect(window.location.search).toBe('?page=2');
  });

  it('falls back to "/" when url_state is not a string', () => {
    window.history.replaceState({}, '', '/auth/callback?code=test&state=test');

    onOidcSigninCallback({ url_state: 42 });

    expect(window.location.pathname).toBe('/');
  });
});
