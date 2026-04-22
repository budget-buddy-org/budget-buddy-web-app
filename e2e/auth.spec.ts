import { test as base, expect } from '@playwright/test';
import { mockOidc, TEST_OIDC_ISSUER, TEST_API_URL } from './fixtures';

// Uses the base Playwright test (no auth injection) to test redirect behaviour
const test = base;

test.describe('Authentication', () => {
  test('redirects unauthenticated users toward the OIDC provider', async ({ page }) => {
    await mockOidc(page);

    // Prevent the real navigation away from the app by aborting the authorize request
    let authorizationUrl = '';
    await page.route(`${TEST_OIDC_ISSUER}/oauth/authorize*`, (route) => {
      authorizationUrl = route.request().url();
      void route.abort();
    });

    await page.goto('/');

    // The app should attempt to navigate to the OIDC provider
    await expect
      .poll(() => authorizationUrl, { timeout: 10_000 })
      .toContain('response_type=code');

    expect(authorizationUrl).toContain('code_challenge_method=S256');
    expect(authorizationUrl).toContain(TEST_OIDC_ISSUER);
  });

  test('shows loading state while OIDC redirect is in flight', async ({ page }) => {
    await mockOidc(page);

    // Hold the authorize request so the loading state is visible
    await page.route(`${TEST_OIDC_ISSUER}/oauth/authorize*`, (_route) => {
      // Never fulfill — keeps the loading state visible
    });

    await page.goto('/');

    await expect(page.getByText('Redirecting to sign-in')).toBeVisible({ timeout: 8_000 });
  });

  test('renders the app after OIDC user is present in session storage', async ({ page }) => {
    await mockOidc(page);

    // Mock minimal API responses so the dashboard can render
    await page.route(`${TEST_API_URL}/v1/categories*`, (route) =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ items: [], meta: { page: 0, size: 200, total: 0 } }),
      }),
    );
    await page.route(`${TEST_API_URL}/v1/transactions*`, (route) =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ items: [], meta: { page: 0, size: 200, total: 0 } }),
      }),
    );

    // Inject a valid OIDC user directly into sessionStorage
    const fakeJwt = [
      Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'),
      Buffer.from(
        JSON.stringify({
          sub: 'auth-test-user',
          iss: 'http://oidc.example.test',
          aud: 'budget-buddy-test',
          exp: 9999999999,
          iat: 1700000000,
        }),
      ).toString('base64url'),
      'sig',
    ].join('.');

    await page.addInitScript(
      ({ key, value }: { key: string; value: string }) => {
        sessionStorage.setItem(key, value);
      },
      {
        key: 'oidc.user:http://oidc.example.test:budget-buddy-test',
        value: JSON.stringify({
          id_token: fakeJwt,
          access_token: fakeJwt,
          refresh_token: 'r',
          token_type: 'Bearer',
          scope: 'openid profile email offline_access',
          profile: { sub: 'auth-test-user', iss: 'http://oidc.example.test', aud: 'budget-buddy-test', iat: 1700000000, exp: 9999999999 },
          expires_at: 9999999999,
          session_state: null,
        }),
      },
    );

    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 10_000 });
  });
});
