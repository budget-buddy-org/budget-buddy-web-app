import { useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { LogOut, Settings } from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { haptic } from '@/lib/haptics';
import { useThemeStore } from '@/stores/theme.store';

export function Header() {
  const glassEffect = useThemeStore((s) => s.glassEffect);
  const { signoutRedirect } = useAuth();
  const queryClient = useQueryClient();

  return (
    <header
      className={cn(
        'flex h-14 items-center justify-between border-b px-4 md:px-6 pt-[env(safe-area-inset-top)] box-content sticky top-0 z-50 transition-colors',
        glassEffect ? 'bg-background/80 backdrop-blur' : 'bg-background',
      )}
    >
      <Link
        to="/"
        className="font-semibold tracking-tight hover:opacity-80 active:opacity-60 transition-opacity motion-reduce:transition-none"
      >
        Budget Buddy
        <span className="ml-1.5 text-xs font-normal text-muted-foreground">v{__APP_VERSION__}</span>
      </Link>
      <div className="flex items-center gap-1 sm:gap-2">
        <Link to="/settings" className="inline-flex md:hidden">
          {({ isActive }) => (
            <Button
              variant="ghost"
              size="icon"
              title="Settings"
              aria-label="Settings"
              className={cn(
                'cursor-pointer active:scale-[0.98]',
                isActive && 'bg-primary/10 text-primary',
              )}
              onClick={() => haptic('tap')}
            >
              <Settings className="size-4" />
            </Button>
          )}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          title="Sign out"
          aria-label="Sign out"
          className="hidden cursor-pointer md:inline-flex"
          onClick={() => {
            queryClient.clear();
            void signoutRedirect();
          }}
        >
          <LogOut className="size-4" />
        </Button>
      </div>
    </header>
  );
}
