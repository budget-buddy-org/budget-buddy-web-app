import { Link } from '@tanstack/react-router';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { useThemeStore } from '@/stores/theme.store';

export function Header() {
  const glassEffect = useThemeStore((s) => s.glassEffect);

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
      </div>
    </header>
  );
}
