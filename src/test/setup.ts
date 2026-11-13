import 'vitest-axe/extend-expect';
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';
import * as domMatchers from '@testing-library/jest-dom/matchers';
import { expect, vi } from 'vitest';
import * as axeMatchers from 'vitest-axe/matchers';

expect.extend(domMatchers);
expect.extend(axeMatchers);

// Mock OIDC environment variables for tests
vi.stubEnv('VITE_OIDC_ISSUER', 'https://auth.example.com');
vi.stubEnv('VITE_OIDC_CLIENT_ID', 'test-client-id');
vi.stubEnv('VITE_OIDC_SCOPES', 'openid profile email offline_access');

// __APP_VERSION__ is injected by Vite's `define` at build time. Provide a
// default for jsdom tests; individual suites can vi.stubGlobal to override.
vi.stubGlobal('__APP_VERSION__', '0.0.0-test');

declare module 'vitest' {
  interface Assertion<R extends void | Promise<void> = void, T = unknown>
    extends TestingLibraryMatchers<R, T>,
      axeMatchers.AxeMatchers {}
}

// Provide localStorage for Zustand persist middleware in jsdom
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

// Mock scrollTo since it's not implemented in JSDOM
if (globalThis.window !== undefined) {
  Element.prototype.scrollTo = vi.fn();
}
