import { useRegisterSW } from 'virtual:pwa-register/react';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { ToastAction } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';

const CHECK_INTERVAL = 1000 * 60 * 5; // 5 minutes
const SW_UPDATE_TIMEOUT = 4000; // ms to wait for a waiting SW before falling back to a hard reload

async function hardReload() {
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } finally {
    window.location.reload();
  }
}

// Resolve once a freshly-installed service worker is waiting, or after a timeout.
function waitForWaitingWorker(registration: ServiceWorkerRegistration): Promise<void> {
  return new Promise<void>((resolve) => {
    const timeout = setTimeout(resolve, SW_UPDATE_TIMEOUT);
    const onUpdateFound = () => {
      const installing = registration.installing;
      if (!installing) return;
      installing.addEventListener('statechange', () => {
        if (installing.state === 'installed' && registration.waiting) {
          clearTimeout(timeout);
          resolve();
        }
      });
    };
    registration.addEventListener('updatefound', onUpdateFound);
  });
}

export function VersionCheck() {
  const { toast } = useToast();
  const lastCheckedVersion = useRef<string>(__APP_VERSION__);
  const isToastActive = useRef(false);
  const swCheckInterval = useRef<ReturnType<typeof setInterval>>(undefined);
  const swRegistration = useRef<ServiceWorkerRegistration | undefined>(undefined);

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
              if (onReload) onReload();
              else window.location.reload();
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
      swRegistration.current = registration;
      // Trigger SW update check periodically
      swCheckInterval.current = setInterval(() => registration.update(), CHECK_INTERVAL);
    },
  });

  // Clean up the SW update-check interval on unmount
  useEffect(() => {
    return () => clearInterval(swCheckInterval.current);
  }, []);

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

  // Handle updates from version.json. The SW may still be serving the old precache,
  // so a plain window.location.reload() can come back as the same version. Nudge the
  // SW to update; if a waiting worker shows up, skip-waiting + reload via
  // updateServiceWorker(true). Otherwise fall back to a hard reload that unregisters
  // the SW and clears caches.
  useEffect(() => {
    if (
      latestVersion &&
      latestVersion !== __APP_VERSION__ &&
      latestVersion !== lastCheckedVersion.current
    ) {
      lastCheckedVersion.current = latestVersion;
      showUpdateToast(
        `A new version (${latestVersion}) is available. Please reload to update.`,
        async () => {
          const registration = swRegistration.current;
          if (!registration) {
            await hardReload();
            return;
          }

          try {
            await registration.update();
          } catch {
            // ignore — fall through to wait/fallback
          }

          if (registration.waiting) {
            updateServiceWorker(true);
            return;
          }

          await waitForWaitingWorker(registration);

          if (registration.waiting) {
            updateServiceWorker(true);
          } else {
            await hardReload();
          }
        },
      );
    }
  }, [latestVersion, showUpdateToast, updateServiceWorker]);

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
