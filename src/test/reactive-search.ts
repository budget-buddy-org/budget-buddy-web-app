import React from 'react';
import { vi } from 'vitest';

/**
 * Creates a reactive mock of TanStack Router's `useSearch` + `useNavigate` for tests.
 * `useSearch` re-renders consuming components when `navigate({ search })` runs, so
 * tests can assert on URL-driven UI updates without spinning up the real router.
 */
export function createReactiveSearchMock<
  S extends Record<string, unknown> = Record<string, unknown>,
>() {
  let current: S = {} as S;
  const listeners = new Set<() => void>();
  const notify = () => {
    for (const fn of listeners) fn();
  };

  const useSearch = (): S => {
    const [, force] = React.useReducer((n: number) => n + 1, 0);
    React.useEffect(() => {
      listeners.add(force);
      return () => {
        listeners.delete(force);
      };
    }, []);
    return current;
  };

  const navigate = vi.fn((opts: { search?: unknown; replace?: boolean }) => {
    const next =
      typeof opts.search === 'function'
        ? (opts.search as (prev: S) => S)({ ...current })
        : ((opts.search as S) ?? ({} as S));
    current = next;
    notify();
  });

  const setSearch = (next: S) => {
    current = next;
    notify();
  };

  const reset = () => {
    current = {} as S;
    navigate.mockClear();
  };

  const getSearch = () => current;

  return { useSearch, navigate, setSearch, reset, getSearch };
}
