import { afterEach, describe, expect, it, vi } from 'vitest';
import { scrollToTop } from './scroll';

describe('scrollToTop', () => {
  const originalMatchMedia = globalThis.matchMedia;

  afterEach(() => {
    globalThis.matchMedia = originalMatchMedia;
    vi.restoreAllMocks();
  });

  function mockReducedMotion(matches: boolean) {
    globalThis.matchMedia = vi
      .fn()
      .mockReturnValue({ matches }) as unknown as typeof globalThis.matchMedia;
  }

  it('scrolls to the top smoothly by default', () => {
    mockReducedMotion(false);
    const scrollSpy = vi.spyOn(globalThis, 'scrollTo').mockImplementation(() => {});

    scrollToTop();

    expect(scrollSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('jumps instantly when the user prefers reduced motion', () => {
    mockReducedMotion(true);
    const scrollSpy = vi.spyOn(globalThis, 'scrollTo').mockImplementation(() => {});

    scrollToTop();

    expect(scrollSpy).toHaveBeenCalledWith({ top: 0, behavior: 'auto' });
  });

  it('falls back to smooth when matchMedia is unavailable', () => {
    // @ts-expect-error simulate an environment without matchMedia
    globalThis.matchMedia = undefined;
    const scrollSpy = vi.spyOn(globalThis, 'scrollTo').mockImplementation(() => {});

    scrollToTop();

    expect(scrollSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });
});
