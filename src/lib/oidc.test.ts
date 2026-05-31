import type { UserManager } from 'oidc-client-ts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildOidcSettings, coalesceSilentRenew, onOidcSigninCallback } from './oidc';

describe('buildOidcSettings', () => {
  it('builds settings from issuer and clientId with default scopes', () => {
    const settings = buildOidcSettings('https://issuer.example.com', 'web-client');

    expect(settings.authority).toBe('https://issuer.example.com');
    expect(settings.client_id).toBe('web-client');
    expect(settings.redirect_uri).toBe(`${globalThis.location.origin}/auth/callback`);
    expect(settings.post_logout_redirect_uri).toBe(`${globalThis.location.origin}/`);
    expect(settings.response_type).toBe('code');
    // default scopes include openid and offline_access
    expect(settings.scope).toBe('openid profile email offline_access');
  });

  it('appends extra scopes to the protocol defaults', () => {
    const settings = buildOidcSettings(
      'https://issuer.example.com',
      'web-client',
      'api:read aud:foo',
    );

    expect(settings.scope).toBe('openid profile email offline_access api:read aud:foo');
  });

  it('dedupes when extras overlap defaults', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const settings = buildOidcSettings(
      'https://issuer.example.com',
      'web-client',
      'openid offline_access api:read',
    );

    expect(settings.scope).toBe('openid profile email offline_access api:read');
    warnSpy.mockRestore();
  });

  it('warns when extras include a default scope', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    buildOidcSettings('https://issuer.example.com', 'web-client', 'openid api:read');

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('openid'));
    warnSpy.mockRestore();
  });

  it('falls back to defaults for empty / whitespace-only extras', () => {
    expect(buildOidcSettings('https://issuer.example.com', 'web-client', '').scope).toBe(
      'openid profile email offline_access',
    );
    expect(buildOidcSettings('https://issuer.example.com', 'web-client', '   ').scope).toBe(
      'openid profile email offline_access',
    );
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
    globalThis.history.replaceState({}, '', '/');
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

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('coalesceSilentRenew', () => {
  it('merges overlapping calls into a single underlying redemption', async () => {
    const d = deferred<{ access_token: string }>();
    const original = vi.fn(() => d.promise);
    const um = { signinSilent: original } as unknown as UserManager;

    coalesceSilentRenew(um);

    const calls = [um.signinSilent(), um.signinSilent(), um.signinSilent()];
    expect(original).toHaveBeenCalledTimes(1);

    d.resolve({ access_token: 'fresh' });
    const results = await Promise.all(calls);
    expect(results).toEqual([
      { access_token: 'fresh' },
      { access_token: 'fresh' },
      { access_token: 'fresh' },
    ]);
  });

  it('allows a fresh redemption once the previous one settles', async () => {
    const first = deferred<{ access_token: string }>();
    const second = deferred<{ access_token: string }>();
    const original = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const um = { signinSilent: original } as unknown as UserManager;

    coalesceSilentRenew(um);

    const p1 = um.signinSilent();
    first.resolve({ access_token: 'one' });
    await p1;

    const p2 = um.signinSilent();
    second.resolve({ access_token: 'two' });
    await p2;

    expect(original).toHaveBeenCalledTimes(2);
  });

  it('clears the in-flight promise after a rejection so renews can be retried', async () => {
    const failing = deferred<{ access_token: string }>();
    const succeeding = deferred<{ access_token: string }>();
    const original = vi
      .fn()
      .mockReturnValueOnce(failing.promise)
      .mockReturnValueOnce(succeeding.promise);
    const um = { signinSilent: original } as unknown as UserManager;

    coalesceSilentRenew(um);

    const p1 = um.signinSilent();
    failing.reject(new Error('rotation reuse'));
    await expect(p1).rejects.toThrow('rotation reuse');

    const p2 = um.signinSilent();
    succeeding.resolve({ access_token: 'recovered' });
    await expect(p2).resolves.toEqual({ access_token: 'recovered' });
    expect(original).toHaveBeenCalledTimes(2);
  });
});

describe('onOidcSigninCallback', () => {
  afterEach(() => {
    globalThis.history.replaceState({}, '', '/');
  });

  it('strips OIDC params from the URL after signin', () => {
    globalThis.history.replaceState({}, '', '/auth/callback?code=test&state=test');

    onOidcSigninCallback(undefined);

    expect(globalThis.location.pathname).toBe('/');
    expect(globalThis.location.search).toBe('');
  });

  it('restores the original deep-link URL from url_state', () => {
    globalThis.history.replaceState({}, '', '/auth/callback?code=test&state=test');

    onOidcSigninCallback({ url_state: '/transactions?page=2' });

    expect(globalThis.location.pathname).toBe('/transactions');
    expect(globalThis.location.search).toBe('?page=2');
  });

  it('falls back to "/" when url_state is not a string', () => {
    globalThis.history.replaceState({}, '', '/auth/callback?code=test&state=test');

    onOidcSigninCallback({ url_state: 42 });

    expect(globalThis.location.pathname).toBe('/');
  });
});
