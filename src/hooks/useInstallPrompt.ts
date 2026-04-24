import { useCallback, useRef, useSyncExternalStore } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function emitChange() {
  for (const fn of listeners) fn();
}

// Capture the event globally (fires once per page load, before any React
// component may have mounted).
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    emitChange();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    emitChange();
  });
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot() {
  return deferredPrompt !== null;
}

/**
 * Returns whether the app can be installed and a function to trigger the
 * native install prompt.  Uses useSyncExternalStore so every consumer stays
 * in sync when the event fires or the user installs/dismisses the prompt.
 */
export function useInstallPrompt() {
  const canInstall = useSyncExternalStore(subscribe, getSnapshot, () => false);
  const isPrompting = useRef(false);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt || isPrompting.current) return;
    isPrompting.current = true;

    const { outcome } = await deferredPrompt.prompt();
    if (outcome === 'accepted') {
      deferredPrompt = null;
      emitChange();
    }
    isPrompting.current = false;
  }, []);

  return { canInstall, promptInstall };
}
