import { useSyncExternalStore } from 'react';

function subscribe(callback: () => void) {
  globalThis.addEventListener('online', callback);
  globalThis.addEventListener('offline', callback);
  return () => {
    globalThis.removeEventListener('online', callback);
    globalThis.removeEventListener('offline', callback);
  };
}

function getSnapshot() {
  return navigator.onLine;
}

/**
 * Subscribes to the browser's online/offline events and returns the current
 * network status.  Uses useSyncExternalStore for tear-free reads during
 * concurrent rendering.
 */
export function useOnlineStatus(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => true);
}
