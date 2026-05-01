import { onlineManager, useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { getConfig } from '@/lib/config';

const HEALTHY_INTERVAL = 30_000;
const UNHEALTHY_INTERVAL = 10_000;

export function useApiHealth(): boolean {
  const isOnline = useOnlineStatus();

  const { data: isHealthy = true } = useQuery({
    queryKey: ['api-health'],
    queryFn: async ({ signal }) => {
      const { VITE_API_URL } = getConfig();
      const response = await fetch(`${VITE_API_URL}/actuator/health`, {
        signal,
        cache: 'no-store',
      });
      return response.ok;
    },
    enabled: isOnline,
    // Must be 'always' so this query keeps running even when onlineManager is
    // false — otherwise API-down → onlineManager offline → this query pauses →
    // recovery never detected (deadlock).
    networkMode: 'always',
    refetchInterval: (query) =>
      query.state.data === false ? UNHEALTHY_INTERVAL : HEALTHY_INTERVAL,
    refetchIntervalInBackground: false,
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
    refetchOnWindowFocus: false,
    throwOnError: false,
  });

  // Propagate combined health into TanStack Query's online manager.
  // When false, all other queries pause automatically (no redundant calls).
  // When true again, they resume and refetch without any per-hook changes.
  useEffect(() => {
    onlineManager.setOnline(isOnline && isHealthy);
  }, [isOnline, isHealthy]);

  return isHealthy;
}
