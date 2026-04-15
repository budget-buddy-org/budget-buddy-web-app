import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  primaryHue: number;
  fontSize: number;
  setTheme: (theme: Theme) => void;
  setPrimaryHue: (hue: number) => void;
  setFontSize: (size: number) => void;
  resolvedTheme: () => 'light' | 'dark';
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme, primaryHue: number, fontSize: number) {
  const resolved = theme === 'system' ? getSystemTheme() : theme;
  document.documentElement.classList.toggle('dark', resolved === 'dark');
  document.documentElement.style.setProperty('--primary-hue', primaryHue.toString());
  document.documentElement.style.setProperty('--font-size-base', `${fontSize}px`);
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      primaryHue: 240, // Default indigo/blue
      fontSize: 16, // Default 16px
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
      resolvedTheme: () => {
        const { theme } = get();
        return theme === 'system' ? getSystemTheme() : theme;
      },
    }),
    {
      name: 'budget-buddy-theme',
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme, state.primaryHue, state.fontSize);
      },
    },
  ),
);
