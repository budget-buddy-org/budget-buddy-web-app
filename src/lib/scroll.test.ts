import { afterEach, describe, expect, it, vi } from 'vitest';
import { scrollToTop } from './scroll';

describe('scrollToTop', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function mockReducedMotion(matches: boolean) {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches })),
    );
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
    vi.stubGlobal('matchMedia', undefined);
    const scrollSpy = vi.spyOn(globalThis, 'scrollTo').mockImplementation(() => {});

    scrollToTop();

    expect(scrollSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });
});
