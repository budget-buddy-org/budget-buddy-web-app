import { Link } from '@tanstack/react-router';
import { ArrowLeftRight, LayoutDashboard, Plus, Tag } from 'lucide-react';
import { useCallback, useRef } from 'react';
import { useFABContext } from '@/contexts/fab-context';
import { cn } from '@/lib/cn';
import { useThemeStore } from '@/stores/theme.store';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/categories', label: 'Categories', icon: Tag },
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
    <div
      className="fixed left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 md:hidden"
      style={{ bottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
    >
      <nav
        className={cn(
          'flex items-center gap-0.5 rounded-full border border-border/40 px-1.5 py-1.5 shadow-xl',
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
              'relative flex flex-col items-center justify-center gap-0.5 rounded-full px-3 text-muted-foreground transition-spring hover:text-foreground active:scale-95 active:bg-muted/50 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2',
              showNavLabels ? 'h-12 min-w-[3.25rem]' : 'h-10 w-10',
            )}
            activeProps={{ className: 'text-primary bg-primary/10 ring-1 ring-primary/20' }}
            activeOptions={{ exact: to === '/' }}
            onClick={(e) => handleTap(to, e.timeStamp)}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {showNavLabels && <span className="text-[10px] leading-none font-medium">{label}</span>}
          </Link>
        ))}
      </nav>

      {fab && (
        <button
          type="button"
          onClick={fab.onClick}
          aria-label={fab.label}
          className={cn(
            'flex shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/20 transition-spring hover:brightness-110 active:scale-90 active:rotate-45 motion-reduce:transition-none starting:scale-75 starting:opacity-0',
            showNavLabels ? 'h-12 w-12' : 'h-10 w-10',
            glassEffect && 'bg-primary/90 backdrop-blur-sm',
          )}
        >
          {fab.icon ?? <Plus className={showNavLabels ? 'h-6 w-6' : 'h-5 w-5'} />}
        </button>
      )}
    </div>
  );
}

export function SidebarNav({ className }: Readonly<{ className?: string }>) {
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
