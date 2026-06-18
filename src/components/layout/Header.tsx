import { Link } from '@tanstack/react-router';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { haptic } from '@/lib/haptics';
import { useThemeStore } from '@/stores/theme.store';

export function Header() {
  const glassEffect = useThemeStore((s) => s.glassEffect);

  return (
    <header
      className={cn(
        'flex h-14 items-center justify-between border-b px-4 md:px-6 pt-[env(safe-area-inset-top)] box-content sticky top-0 z-header transition-colors',
        glassEffect ? 'bg-background/80 backdrop-blur' : 'bg-background',
      )}
    >
      <Link
        to="/"
        className="font-semibold tracking-tight hover:opacity-80 active:opacity-60 transition-opacity motion-reduce:transition-none"
      >
        <span>Budget Buddy</span>
        <span className="ml-1.5 text-xs font-normal text-muted-foreground">v{__APP_VERSION__}</span>
      </Link>
      {/* Sign out lives in the desktop sidebar footer; on mobile the settings
          link below is the only header action (nav is the floating bottom bar). */}
      <Link to="/settings" className="inline-flex md:hidden">
        {({ isActive }) => (
          <Button
            variant="ghost"
            size="icon"
            title="Settings"
            aria-label="Settings"
            className={cn('cursor-pointer', isActive && 'bg-primary/10 text-primary')}
            onClick={() => haptic('tap')}
          >
            <Settings className="size-4" />
          </Button>
        )}
      </Link>
    </header>
  );
}
