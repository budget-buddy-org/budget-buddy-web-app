import { describe, expect, it } from 'vitest';
import { resolveAppVersion } from './app-version';

describe('resolveAppVersion', () => {
  it('prefers the version supplied by the production build', () => {
    expect(resolveAppVersion('5.0.0', '4.19.2')).toBe('5.0.0');
  });

  it('falls back to the package version for local and candidate builds', () => {
    expect(resolveAppVersion(undefined, '4.19.2')).toBe('4.19.2');
  });
});
