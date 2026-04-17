import { Link } from '@tanstack/react-router';
import { ArrowLeftRight, LayoutDashboard, Plus, Settings, Tag } from 'lucide-react';
import { useCallback, useRef } from 'react';
import { useFABContext } from '@/contexts/fab-context';
import { cn } from '@/lib/cn';
import { useThemeStore } from '@/stores/theme.store';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/categories', label: 'Categories', icon: Tag },
  { to: '/settings', label: 'Settings', icon: Settings },
] as const;

export function MobileNav() {
  const { fab } = useFABContext();
  const { showNavLabels, glassEffect } = useThemeStore();
  const lastTapRef = useRef<{ [key: string]: number }>({});

  const handleTap = useCallback((to: string, timeStamp: number) => {
    const last = lastTapRef.current[to] || 0;
    if (timeStamp - last < 300) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    lastTapRef.current[to] = timeStamp;
  }, []);

  return (
    <>
      {fab && (
        <button
          type="button"
          onClick={fab.onClick}
          aria-label={fab.label}
          className="fixed right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/25 transition-colors hover:bg-primary/90 active:scale-95 md:hidden"
          style={{ bottom: '6rem' }}
        >
          {fab.icon ?? <Plus className="h-6 w-6" />}
        </button>
      )}

      <nav
        className="fixed left-1/2 z-50 -translate-x-1/2 md:hidden"
        style={{ bottom: 'env(safe-area-inset-bottom)' }}
      >
        <div
          className={cn(
            'flex items-center gap-0.5 rounded-full border border-border/40 px-1.5 py-1.5 shadow-xl transition-colors',
            glassEffect
              ? 'bg-background/80 shadow-black/10 backdrop-blur-2xl dark:bg-background/70 dark:shadow-black/40'
              : 'bg-background shadow-black/5',
          )}
        >
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 rounded-full px-3 text-muted-foreground transition-colors hover:text-foreground',
                showNavLabels ? 'h-12 min-w-[3.25rem]' : 'h-10 w-10',
              )}
              activeProps={{ className: 'bg-primary/10 text-primary' }}
              activeOptions={{ exact: to === '/' }}
              onClick={(e) => handleTap(to, e.timeStamp)}
            >
              <Icon className="h-[1.125rem] w-[1.125rem] shrink-0" />
              {showNavLabels && <span className="text-[10px] leading-none">{label}</span>}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}

export function SidebarNav({ className }: { className?: string }) {
  return (
    <nav className={cn('flex flex-col gap-1', className)}>
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          activeProps={{ className: 'bg-accent text-foreground font-medium' }}
          activeOptions={{ exact: to === '/' }}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
