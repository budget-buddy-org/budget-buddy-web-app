import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="assertive"
      className="flex items-center justify-center gap-2 bg-destructive px-4 py-2 text-xs font-medium text-destructive-foreground"
    >
      <WifiOff className="size-3.5" />
      You are offline. Some features may be unavailable.
    </div>
  );
}
