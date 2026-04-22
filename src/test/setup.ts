import '@testing-library/jest-dom';
import 'vitest-axe/extend-expect';
import { expect, vi } from 'vitest';
import * as axeMatchers from 'vitest-axe/matchers';

expect.extend(axeMatchers);

// Mock OIDC environment variables for tests
vi.stubEnv('VITE_OIDC_ISSUER', 'https://auth.example.com');
vi.stubEnv('VITE_OIDC_CLIENT_ID', 'test-client-id');
vi.stubEnv('VITE_OIDC_SCOPES', 'openid profile email offline_access');

declare module 'vitest' {
  export interface Assertion<T> extends axeMatchers.AxeMatchers {
    _branded?: T;
  }
  export interface AsymmetricMatchersContaining extends axeMatchers.AxeMatchers {
    _branded?: boolean;
  }
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

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock scrollTo since it's not implemented in JSDOM
if (typeof window !== 'undefined') {
  Element.prototype.scrollTo = vi.fn();
}
