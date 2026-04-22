import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildOidcSettings, onOidcSigninCallback } from './oidc';

describe('buildOidcSettings', () => {
  it('builds settings from issuer and clientId', () => {
    const settings = buildOidcSettings('https://issuer.example.com', 'web-client');

    expect(settings.authority).toBe('https://issuer.example.com');
    expect(settings.client_id).toBe('web-client');
    expect(settings.redirect_uri).toBe(`${window.location.origin}/auth/callback`);
    expect(settings.post_logout_redirect_uri).toBe(`${window.location.origin}/`);
    expect(settings.response_type).toBe('code');
    // silent_redirect_uri should be present to support silent renew flows
    expect(settings.silent_redirect_uri).toBe(`${window.location.origin}/auth/silent-renew`);
  });

  it('includes audience in extraQueryParams when provided', () => {
    const settings = buildOidcSettings('https://issuer.example.com', 'web-client', 'my-audience');

    // extraQueryParams is optional; when provided it should contain the audience
    // The typings are loose on the exact shape, so check presence via index access.
    // @ts-expect-error - test-time access
    expect(settings.extraQueryParams).toBeDefined();
    // @ts-expect-error - runtime property added by buildOidcSettings
    expect(settings.extraQueryParams?.audience).toBe('my-audience');
  });

  it('uses sessionStorage for PKCE state store', () => {
    const settings = buildOidcSettings('https://issuer.example.com', 'web-client');

    expect(settings.stateStore).toBeDefined();
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
    const mgr = freshInit('https://issuer.example.com', 'web-client', 'my-audience');

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
