import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

const SYSTEM_THEME_MEDIA = '(prefers-color-scheme: dark)';

interface ThemeState {
  theme: Theme;
  primaryHue: number;
  fontSize: number;
  showNavLabels: boolean;
  glassEffect: boolean;
  setTheme: (theme: Theme) => void;
  setPrimaryHue: (hue: number) => void;
  setFontSize: (size: number) => void;
  setShowNavLabels: (show: boolean) => void;
  setGlassEffect: (show: boolean) => void;
  resolvedTheme: () => 'light' | 'dark';
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia(SYSTEM_THEME_MEDIA).matches ? 'dark' : 'light';
}

export function applyTheme(theme: Theme, primaryHue: number, fontSize: number) {
  const resolved = theme === 'system' ? getSystemTheme() : theme;
  document.documentElement.classList.toggle('dark', resolved === 'dark');
  // Always set the resolved value so browser-native UI (scrollbars, inputs)
  // matches the actual visible theme, even when explicit light/dark overrides the OS.
  document.documentElement.style.colorScheme = resolved;
  document.documentElement.style.setProperty('--primary-hue', primaryHue.toString());
  document.documentElement.style.setProperty('--font-size-base', `${fontSize}px`);
}

let systemThemeCleanup: (() => void) | null = null;

function attachSystemThemeListener(getState: () => ThemeState) {
  if (systemThemeCleanup || typeof window === 'undefined' || !window.matchMedia) return;

  const mediaQuery = window.matchMedia(SYSTEM_THEME_MEDIA);
  const handleSystemThemeChange = () => {
    const { theme, primaryHue, fontSize } = getState();
    if (theme === 'system') {
      applyTheme(theme, primaryHue, fontSize);
    }
  };

  mediaQuery.addEventListener('change', handleSystemThemeChange);
  systemThemeCleanup = () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
}

export function detachSystemThemeListener() {
  systemThemeCleanup?.();
  systemThemeCleanup = null;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      primaryHue: 240, // Default indigo/blue
      fontSize: 16, // Default 16px
      showNavLabels: true,
      glassEffect: true,
      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme, get().primaryHue, get().fontSize);
      },
      setPrimaryHue: (primaryHue) => {
        set({ primaryHue });
        applyTheme(get().theme, primaryHue, get().fontSize);
      },
      setFontSize: (fontSize) => {
        set({ fontSize });
        applyTheme(get().theme, get().primaryHue, fontSize);
      },
      setShowNavLabels: (showNavLabels) => set({ showNavLabels }),
      setGlassEffect: (glassEffect) => set({ glassEffect }),
      resolvedTheme: () => {
        const { theme } = get();
        return theme === 'system' ? getSystemTheme() : theme;
      },
    }),
    {
      name: 'budget-buddy-theme',
      onRehydrateStorage: () => (state) => {
        attachSystemThemeListener(useThemeStore.getState);
        if (state) applyTheme(state.theme, state.primaryHue, state.fontSize);
      },
    },
  ),
);

attachSystemThemeListener(useThemeStore.getState);
