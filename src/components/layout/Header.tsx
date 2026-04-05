import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Moon, Sun, Monitor, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/api'
import { useAuthStore } from '@/stores/auth.store'
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
  const navigate = useNavigate()
  const { theme, setTheme } = useThemeStore()
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const ThemeIcon = THEME_ICONS[theme]

  const logout = useMutation({
    mutationFn: () => apiClient.post('/v1/auth/logout'),
    onSettled: () => {
      clearAuth()
      navigate({ to: '/login' })
    },
  })

  return (
    <header className="flex h-14 items-center justify-between border-b px-4 md:px-6">
      <span className="font-semibold tracking-tight">Budget Buddy</span>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(NEXT_THEME[theme])}
          title={`Switch theme (current: ${theme})`}
        >
          <ThemeIcon className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => logout.mutate()} title="Log out">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
