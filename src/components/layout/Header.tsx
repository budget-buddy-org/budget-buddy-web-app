import { Moon, Sun, Monitor, LogOut, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLogout } from '@/hooks/useLogout'
import { type Theme, useThemeStore } from '@/stores/theme.store'
import { Link } from '@tanstack/react-router'

const THEME_ICONS: Record<Theme, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
}

const NEXT_THEME: Record<Theme, Theme> = {
  light: 'dark',
  dark: 'system',
  system: 'light',
}

export function Header() {
  const { theme, setTheme } = useThemeStore()
  const ThemeIcon = THEME_ICONS[theme]
  const logout = useLogout()

  return (
    <header className="flex h-14 md:h-14 items-center justify-between border-b px-4 md:px-6 pt-[env(safe-area-inset-top)] box-content sticky top-0 bg-background/95 backdrop-blur z-50">
      <Link to="/" className="font-semibold tracking-tight hover:opacity-80 transition-opacity">
        Budget Buddy
        <span className="ml-1.5 text-xs font-normal text-muted-foreground">v{__APP_VERSION__}</span>
      </Link>
      <div className="flex items-center gap-1 sm:gap-2">
        <Link to="/settings">
          <Button
            variant="ghost"
            size="icon"
            title="Settings"
            aria-label="Settings"
            className="cursor-pointer"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(NEXT_THEME[theme])}
          title={`Switch theme (current: ${theme})`}
          aria-label={`Switch theme (current: ${theme})`}
          className="cursor-pointer"
        >
          <ThemeIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => logout.mutate()}
          title="Log out"
          aria-label="Log out"
          className="cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
