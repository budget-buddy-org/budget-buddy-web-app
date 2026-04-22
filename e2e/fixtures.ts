import { test as base, expect, type Page, type Route } from '@playwright/test';

export const TEST_API_URL = 'http://localhost:8080';
export const TEST_OIDC_ISSUER = 'http://oidc.example.test';
export const TEST_CLIENT_ID = 'budget-buddy-test';

const TEST_CONFIG = {
  VITE_API_URL: TEST_API_URL,
  VITE_OIDC_ISSUER: TEST_OIDC_ISSUER,
  VITE_OIDC_CLIENT_ID: TEST_CLIENT_ID,
};

const OIDC_DISCOVERY = {
  issuer: TEST_OIDC_ISSUER,
  authorization_endpoint: `${TEST_OIDC_ISSUER}/oauth/authorize`,
  token_endpoint: `${TEST_OIDC_ISSUER}/oauth/token`,
  jwks_uri: `${TEST_OIDC_ISSUER}/.well-known/jwks.json`,
  userinfo_endpoint: `${TEST_OIDC_ISSUER}/oauth/userinfo`,
  response_types_supported: ['code'],
  grant_types_supported: ['authorization_code', 'refresh_token'],
  subject_types_supported: ['public'],
  id_token_signing_alg_values_supported: ['RS256'],
  scopes_supported: ['openid', 'profile', 'email', 'offline_access'],
  claims_supported: ['sub', 'iss', 'aud', 'exp', 'iat', 'email', 'name'],
};

function buildFakeJwt(): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      sub: 'test-user-id',
      iss: TEST_OIDC_ISSUER,
      aud: TEST_CLIENT_ID,
      exp: 9999999999,
      iat: 1700000000,
      email: 'test@example.com',
      name: 'Test User',
    }),
  ).toString('base64url');
  return `${header}.${payload}.fakesignature`;
}

const FAKE_JWT = buildFakeJwt();

// Stored oidc-client-ts user object (matches User.fromStorageString() format)
const FAKE_OIDC_USER = {
  id_token: FAKE_JWT,
  access_token: FAKE_JWT,
  refresh_token: 'fake-refresh-token',
  token_type: 'Bearer',
  scope: 'openid profile email offline_access',
  profile: {
    sub: 'test-user-id',
    iss: TEST_OIDC_ISSUER,
    aud: TEST_CLIENT_ID,
    iat: 1700000000,
    exp: 9999999999,
    email: 'test@example.com',
    name: 'Test User',
  },
  expires_at: 9999999999,
  session_state: null,
};

export const MOCK_CATEGORIES = [
  { id: 'cat-00000000-0000-0000-0001', name: 'Groceries' },
  { id: 'cat-00000000-0000-0000-0002', name: 'Transport' },
];

export const MOCK_TRANSACTIONS = [
  {
    id: 'tx-000000000-0000-0000-0001',
    description: 'Weekly groceries',
    amount: 4523,
    type: 'EXPENSE',
    currency: 'EUR',
    date: '2026-04-15',
    categoryId: 'cat-00000000-0000-0000-0001',
  },
  {
    id: 'tx-000000000-0000-0000-0002',
    description: 'Monthly salary',
    amount: 300000,
    type: 'INCOME',
    currency: 'EUR',
    date: '2026-04-01',
    categoryId: null,
  },
];

async function mockOidc(page: Page): Promise<void> {
  await page.route('**/config.json', (route: Route) =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(TEST_CONFIG) }),
  );
  await page.route(
    `${TEST_OIDC_ISSUER}/.well-known/openid-configuration`,
    (route: Route) =>
      route.fulfill({ contentType: 'application/json', body: JSON.stringify(OIDC_DISCOVERY) }),
  );
  // Prevent real network calls to mock OIDC endpoints
  await page.route(`${TEST_OIDC_ISSUER}/**`, (route: Route) =>
    route.fulfill({ contentType: 'application/json', body: '{}' }),
  );
}

async function injectOidcUser(page: Page): Promise<void> {
  const storageKey = `oidc.user:${TEST_OIDC_ISSUER}:${TEST_CLIENT_ID}`;
  const userJson = JSON.stringify(FAKE_OIDC_USER);
  await page.addInitScript(
    ({ key, value }: { key: string; value: string }) => {
      sessionStorage.setItem(key, value);
    },
    { key: storageKey, value: userJson },
  );
}

async function mockApi(page: Page): Promise<void> {
  const categoriesResponse = {
    items: MOCK_CATEGORIES,
    meta: { page: 0, size: 200, total: MOCK_CATEGORIES.length },
  };
  const transactionsResponse = {
    items: MOCK_TRANSACTIONS,
    meta: { page: 0, size: 20, total: MOCK_TRANSACTIONS.length },
  };

  await page.route(`${TEST_API_URL}/v1/categories*`, (route: Route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify(categoriesResponse) });
    }
    return route.continue();
  });

  await page.route(`${TEST_API_URL}/v1/transactions*`, (route: Route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify(transactionsResponse) });
    }
    return route.continue();
  });
}

// Extended test fixture: mocks OIDC, injects session, mocks API
export const test = base.extend<{
  withApiMock: typeof mockApi;
}>({
  page: async ({ page }, use) => {
    await mockOidc(page);
    await injectOidcUser(page);
    await mockApi(page);
    await use(page);
  },
  // Expose mockApi so individual tests can override specific routes before it
  withApiMock: async ({ page }, use) => {
    await use((p) => mockApi(p ?? page));
  },
});

export { expect, mockApi, mockOidc, injectOidcUser };
export type { Page, Route };
