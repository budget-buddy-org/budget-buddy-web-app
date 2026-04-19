import { Link } from '@tanstack/react-router';
import { LogOut, Monitor, Moon, Settings, Sun } from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { type Theme, useThemeStore } from '@/stores/theme.store';

const THEME_ICONS: Record<Theme, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

const NEXT_THEME: Record<Theme, Theme> = {
  light: 'dark',
  dark: 'system',
  system: 'light',
};

export function Header() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const glassEffect = useThemeStore((s) => s.glassEffect);
  const ThemeIcon = THEME_ICONS[theme];
  const auth = useAuth();

  return (
    <header
      className={cn(
        'flex h-14 items-center justify-between border-b px-4 md:px-6 pt-[env(safe-area-inset-top)] box-content sticky top-0 z-50 transition-colors',
        glassEffect ? 'bg-background/80 backdrop-blur' : 'bg-background',
      )}
    >
      <Link to="/" className="font-semibold tracking-tight hover:opacity-80 transition-opacity">
        Budget Buddy
        <span className="ml-1.5 text-xs font-normal text-muted-foreground">v{__APP_VERSION__}</span>
      </Link>
      <div className="flex items-center gap-1 sm:gap-2">
        <Link to="/settings" className="inline-flex">
          <Button
            variant="ghost"
            size="icon"
            title="Settings"
            aria-label="Settings"
            className="cursor-pointer"
          >
            <Settings className="size-4" />
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(NEXT_THEME[theme])}
          title={`Switch theme (current: ${theme})`}
          aria-label={`Switch theme (current: ${theme})`}
          className="cursor-pointer hidden md:inline-flex"
        >
          <ThemeIcon className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => void auth.signoutRedirect()}
          title="Log out"
          aria-label="Log out"
          className="cursor-pointer"
        >
          <LogOut className="size-4" />
        </Button>
      </div>
    </header>
  );
}
