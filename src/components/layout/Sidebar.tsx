import { useQueryClient } from '@tanstack/react-query';
import { LogOut } from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import { SidebarNav } from './MobileNav';

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
        <button
          type="button"
          title="Sign out"
          aria-label="Sign out"
          className="flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground active:bg-accent/80 motion-reduce:transition-none focus-visible:focus-ring focus-visible:focus-ring-offset"
          onClick={() => {
            queryClient.clear();
            signoutRedirect();
          }}
        >
          <LogOut className="size-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
