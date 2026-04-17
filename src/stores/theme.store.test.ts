import { beforeEach, describe, expect, it, vi } from 'vitest';

type ThemeChangeListener = (event: MediaQueryListEvent) => void;

let mediaQueryMatches = false;
let changeListener: ThemeChangeListener | null = null;

vi.mock('zustand/middleware', async () => {
  const actual = await vi.importActual<typeof import('zustand/middleware')>('zustand/middleware');
  return {
    ...actual,
    persist: ((initializer: Parameters<typeof actual.persist>[0]) =>
      initializer) as typeof actual.persist,
  };
});

describe('useThemeStore', () => {
  beforeEach(() => {
    vi.resetModules();
    mediaQueryMatches = false;
    changeListener = null;

    document.documentElement.classList.remove('dark');
    document.documentElement.style.removeProperty('--primary-hue');
    document.documentElement.style.removeProperty('--font-size-base');

    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: mediaQueryMatches,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addEventListener: (_event: string, listener: ThemeChangeListener) => {
          changeListener = listener;
        },
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('applies the current system theme when theme is set to system', async () => {
    const { useThemeStore } = await import('./theme.store');

    useThemeStore.getState().setTheme('system');

    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe('light');
  });

  it('updates the document theme when the system theme changes', async () => {
    const { useThemeStore } = await import('./theme.store');

    useThemeStore.getState().setTheme('system');
    mediaQueryMatches = true;
    changeListener?.({ matches: true } as MediaQueryListEvent);

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  it('sets explicit light theme even when OS is dark', async () => {
    mediaQueryMatches = true; // simulate OS dark
    const { useThemeStore } = await import('./theme.store');

    useThemeStore.getState().setTheme('light');

    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe('light');
  });

  it('sets explicit dark theme even when OS is light', async () => {
    mediaQueryMatches = false; // simulate OS light
    const { useThemeStore } = await import('./theme.store');

    useThemeStore.getState().setTheme('dark');

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  it('switching from dark OS system to explicit light removes .dark class', async () => {
    mediaQueryMatches = true; // OS dark
    const { useThemeStore } = await import('./theme.store');

    useThemeStore.getState().setTheme('system'); // dark applied
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    useThemeStore.getState().setTheme('light'); // explicit override
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe('light');
  });

  it('toggles showNavLabels', async () => {
    const { useThemeStore } = await import('./theme.store');

    expect(useThemeStore.getState().showNavLabels).toBe(true);
    useThemeStore.getState().setShowNavLabels(false);
    expect(useThemeStore.getState().showNavLabels).toBe(false);
  });

  it('toggles glassEffect', async () => {
    const { useThemeStore } = await import('./theme.store');

    expect(useThemeStore.getState().glassEffect).toBe(true);
    useThemeStore.getState().setGlassEffect(false);
    expect(useThemeStore.getState().glassEffect).toBe(false);
  });
});
