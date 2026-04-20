import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildOidcSettings, onOidcSigninCallback } from './oidc';

describe('buildOidcSettings', () => {
  it('builds settings from issuer and clientId', () => {
    const settings = buildOidcSettings('https://issuer.example.com', 'web-client');

    expect(settings.authority).toBe('https://issuer.example.com');
    expect(settings.client_id).toBe('web-client');
    expect(settings.redirect_uri).toBe(`${window.location.origin}/auth/callback`);
    expect(settings.post_logout_redirect_uri).toBe(`${window.location.origin}/`);
    expect(settings.silent_redirect_uri).toBe(`${window.location.origin}/silent-renew.html`);
    expect(settings.response_type).toBe('code');
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
    const mgr = freshInit('https://issuer.example.com', 'web-client');

    expect(freshGet()).toBe(mgr);
  });
});

describe('onOidcSigninCallback', () => {
  afterEach(() => {
    window.history.replaceState({}, '', '/');
  });

  it('strips OIDC params from the URL after signin', () => {
    window.history.replaceState({}, '', '/auth/callback?code=test&state=test');

    onOidcSigninCallback();

    expect(window.location.pathname).toBe('/');
    expect(window.location.search).toBe('');
  });
});
