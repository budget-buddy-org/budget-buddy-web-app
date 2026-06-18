import { useQueryClient } from '@tanstack/react-query';
import { LogOut } from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import { Button } from '@/components/ui/button';
import { SidebarNav } from './MobileNav';

/**
 * Desktop navigation rail (md+). A sticky column with the primary nav at the
 * top and account actions pinned to a footer at the bottom — the sign-out that
 * used to be a stray icon in the header now lives here, next to the nav it
 * belongs with. Hidden on mobile, where {@link MobileNav} takes over.
 */
export function Sidebar() {
  const { signoutRedirect } = useAuth();
  const queryClient = useQueryClient();

  return (
    <aside
      aria-label="Sidebar navigation"
      className="hidden w-56 shrink-0 flex-col border-r md:flex sticky top-14 self-start h-[calc(100dvh-3.5rem)] overflow-y-auto"
    >
      <SidebarNav className="flex-1 p-4" />
      <div className="border-t p-3">
        <Button
          variant="ghost"
          title="Sign out"
          aria-label="Sign out"
          className="w-full cursor-pointer justify-start gap-3 px-3 text-muted-foreground hover:text-foreground"
          onClick={() => {
            queryClient.clear();
            signoutRedirect();
          }}
        >
          <LogOut className="size-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
