import { useRegisterSW } from 'virtual:pwa-register/react';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { ToastAction } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';

const CHECK_INTERVAL = 1000 * 60 * 5; // 5 minutes

export function VersionCheck() {
  const { toast } = useToast();
  const lastCheckedVersion = useRef<string>(__APP_VERSION__);
  const isToastActive = useRef(false);

  const showUpdateToast = useCallback(
    (description: string, onReload?: () => void) => {
      if (isToastActive.current) return;
      isToastActive.current = true;

      toast({
        title: 'Update Available',
        description,
        action: (
          <ToastAction
            altText="Reload app to update"
            onClick={() => {
              onReload?.();
              window.location.reload();
            }}
          >
            Reload
          </ToastAction>
        ),
        duration: Number.POSITIVE_INFINITY,
        onOpenChange: (open) => {
          if (!open) isToastActive.current = false;
        },
      });
    },
    [toast],
  );

  // Service worker registration — prompts the user when a new precache is ready
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      // Trigger SW update check periodically
      setInterval(() => registration.update(), CHECK_INTERVAL);
    },
  });

  // version.json polling — using TanStack Query for robust focus and interval refetching
  const { data: latestVersion } = useQuery({
    queryKey: ['app-version'],
    queryFn: async ({ signal }) => {
      const response = await fetch(`/version.json?t=${Date.now()}`, {
        cache: 'no-store',
        signal,
      });

      if (!response.ok) return null;

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) return null;

      const data = await response.json();
      return data.version as string;
    },
    refetchInterval: CHECK_INTERVAL,
    refetchOnWindowFocus: true,
    staleTime: 0, // Always check fresh
    gcTime: 0,
  });

  // Handle updates from version.json
  useEffect(() => {
    if (
      latestVersion &&
      latestVersion !== __APP_VERSION__ &&
      latestVersion !== lastCheckedVersion.current
    ) {
      lastCheckedVersion.current = latestVersion;
      showUpdateToast(`A new version (${latestVersion}) is available. Please reload to update.`);
    }
  }, [latestVersion, showUpdateToast]);

  // Handle updates from Service Worker
  useEffect(() => {
    if (needRefresh) {
      showUpdateToast('A new version is ready. Please reload to update.', () =>
        updateServiceWorker(true),
      );
    }
  }, [needRefresh, showUpdateToast, updateServiceWorker]);

  return null;
}
