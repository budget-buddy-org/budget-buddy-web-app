import { useRegisterSW } from 'virtual:pwa-register/react';
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
      // Periodically check for SW updates (same cadence as version.json)
      setInterval(() => registration.update(), CHECK_INTERVAL);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      showUpdateToast('A new version is ready. Please reload to update.', () =>
        updateServiceWorker(true),
      );
    }
  }, [needRefresh, showUpdateToast, updateServiceWorker]);

  // version.json polling — catches updates even if the SW precache hasn't changed
  const checkForUpdate = useCallback(async () => {
    try {
      const response = await fetch(`/version.json?t=${Date.now()}`, {
        cache: 'no-store',
      });

      if (!response.ok) return;

      const data = await response.json();
      const latestVersion = data.version;

      if (
        latestVersion &&
        latestVersion !== __APP_VERSION__ &&
        latestVersion !== lastCheckedVersion.current
      ) {
        lastCheckedVersion.current = latestVersion;
        showUpdateToast(`A new version (${latestVersion}) is available. Please reload to update.`);
      }
    } catch (error) {
      console.debug('[VersionCheck] Update check failed', error);
    }
  }, [showUpdateToast]);

  useEffect(() => {
    checkForUpdate();

    const interval = setInterval(checkForUpdate, CHECK_INTERVAL);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdate();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkForUpdate]);

  return null;
}
