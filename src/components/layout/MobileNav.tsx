import { Link, useRouterState } from '@tanstack/react-router';
import { ArrowLeftRight, LayoutDashboard, Plus, Settings, Tag } from 'lucide-react';
import { useCallback } from 'react';
import { useFABContext } from '@/hooks/use-fab';
import { cn } from '@/lib/cn';
import { haptic } from '@/lib/haptics';
import { scrollToTop } from '@/lib/scroll';
import { useThemeStore } from '@/stores/theme.store';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/categories', label: 'Categories', icon: Tag },
] as const;

export function MobileNav() {
  const { fab } = useFABContext();
  const showNavLabels = useThemeStore((s) => s.showNavLabels);
  const glassEffect = useThemeStore((s) => s.glassEffect);
  const currentPath = useRouterState({ select: (s) => s.location.pathname });
  const handleTap = useCallback(
    (to: string) => {
      if (to === currentPath) {
        scrollToTop();
      } else {
        haptic('tap');
      }
    },
    [currentPath],
  );

  return (
    <div className="fixed left-1/2 z-overlay flex -translate-x-1/2 items-center gap-3 md:hidden bottom-[env(safe-area-inset-bottom)]">
      <nav
        aria-label="Primary mobile"
        className={cn(
          'flex items-center gap-0.5 rounded-pill border border-border/40 px-1.5 py-1.5 shadow-floating',
          glassEffect
            ? 'bg-background/80 shadow-black/10 backdrop-blur-md dark:bg-background/70 dark:shadow-black/40'
            : 'bg-background shadow-black/5',
        )}
      >
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={cn(
              'relative flex flex-col items-center justify-center gap-0.5 rounded-pill px-3 text-muted-foreground transition-spring hover:text-foreground active:scale-[0.97] active:bg-muted/50 motion-reduce:transition-none focus-visible:focus-ring focus-visible:focus-ring-offset',
              showNavLabels ? 'h-12 min-w-[3.25rem]' : 'size-10',
            )}
            activeProps={{ className: 'text-primary bg-primary/10 ring-1 ring-primary/20' }}
            activeOptions={{ exact: to === '/', includeSearch: false }}
            onClick={() => handleTap(to)}
          >
            <Icon className="size-5 shrink-0" />
            {showNavLabels && <span className="text-2xs leading-none font-medium">{label}</span>}
          </Link>
        ))}
      </nav>

      {fab && (
        <button
          type="button"
          onClick={() => {
            haptic('select');
            fab.onClick();
          }}
          aria-label={fab.label}
          className={cn(
            'flex shrink-0 items-center justify-center rounded-pill bg-primary text-primary-foreground shadow-floating shadow-primary/20 transition-spring hover:brightness-110 active:scale-90 active:rotate-45 motion-reduce:transition-none starting:scale-75 starting:opacity-0 focus-visible:focus-ring focus-visible:focus-ring-offset',
            showNavLabels ? 'size-12' : 'size-10',
            glassEffect && 'bg-primary/90 backdrop-blur-sm',
          )}
        >
          {fab.icon ?? <Plus className={showNavLabels ? 'size-6' : 'size-5'} />}
        </button>
      )}
    </div>
  );
}

const SIDEBAR_ITEMS = [
  ...NAV_ITEMS,
  { to: '/settings', label: 'Settings', icon: Settings },
] as const;

export function SidebarNav({ className }: Readonly<{ className?: string }>) {
  return (
    <nav aria-label="Primary" className={cn('flex flex-col gap-1', className)}>
      {SIDEBAR_ITEMS.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground active:bg-accent/80 motion-reduce:transition-none focus-visible:focus-ring focus-visible:focus-ring-offset"
          activeProps={{
            className: 'bg-primary/10 text-primary font-medium ring-1 ring-primary/20',
          }}
          activeOptions={{ exact: to === '/', includeSearch: false }}
        >
          <Icon className="size-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
