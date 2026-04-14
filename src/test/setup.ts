import '@testing-library/jest-dom';
import 'vitest-axe/extend-expect';
import { expect } from 'vitest';
import * as axeMatchers from 'vitest-axe/matchers';

expect.extend(axeMatchers);

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
