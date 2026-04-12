import { Moon, Sun, Monitor, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLogout } from '@/hooks/useLogout'
import { type Theme, useThemeStore } from '@/stores/theme.store'

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
    <header className="flex h-14 items-center justify-between border-b px-4 md:px-6">
      <span className="font-semibold tracking-tight">Budget Buddy</span>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(NEXT_THEME[theme])}
          title={`Switch theme (current: ${theme})`}
          aria-label={`Switch theme (current: ${theme})`}
        >
          <ThemeIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => logout.mutate()}
          title="Log out"
          aria-label="Log out"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
