import { ServerOff } from 'lucide-react';
import type * as React from 'react';
import { useApiHealth } from '@/hooks/useApiHealth';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export function ApiUnavailableBanner(): React.ReactNode {
  const isOnline = useOnlineStatus();
  const isApiHealthy = useApiHealth();

  if (!isOnline || isApiHealthy) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-xs font-medium text-white"
    >
      <ServerOff className="size-3.5" aria-hidden="true" />
      API unavailable. Data may be stale.
    </div>
  );
}
