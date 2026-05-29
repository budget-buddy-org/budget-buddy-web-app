import type { ClientSettingsPayload } from '@budget-buddy-org/budget-buddy-contracts';
import { useEffect, useRef } from 'react';
import { useUpsertUserSettings, useUserSettings } from '@/hooks/useUserSettings';
import {
  applyWebSettings,
  collectWebSettings,
  parseWebSettings,
  type WebClientSettings,
} from '@/lib/clientSettings';
import { useThemeStore } from '@/stores/theme.store';
import { useUserPreferencesStore } from '@/stores/user-preferences.store';

const PUSH_DEBOUNCE_MS = 1000;

/** Widen the structured settings to the opaque payload the contracts expect. */
const toPayload = (s: WebClientSettings): ClientSettingsPayload =>
  s as unknown as ClientSettingsPayload;

/**
 * Two-way sync of the appearance + preference stores with the server's per-client
 * settings row, so a user's customisations follow them across devices.
 *
 * - **Pull (once):** on the first successful fetch, server settings are merged
 *   onto the local stores. If the server has no row yet, the current local
 *   settings are pushed to seed it.
 * - **Push (debounced):** subsequent local changes are written back to the
 *   server. A snapshot of the last-synced JSON suppresses the echo from the
 *   pull and avoids redundant writes when nothing actually changed.
 *
 * Mount once inside the authenticated layout. A background refetch never
 * re-hydrates mid-session, so it can't clobber unsynced local edits.
 */
export function useSettingsSync() {
  const { data, isSuccess } = useUserSettings();
  const upsert = useUpsertUserSettings();

  const hydratedRef = useRef(false);
  const lastSyncedRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Keep a stable reference so the subscribe effect can run once on mount while
  // always calling the latest mutation instance.
  const upsertRef = useRef(upsert);
  useEffect(() => {
    upsertRef.current = upsert;
  });

  // Pull: merge server settings into local stores exactly once.
  useEffect(() => {
    if (!isSuccess || hydratedRef.current) return;
    hydratedRef.current = true;

    const merged = parseWebSettings(data?.settings);
    // Record before applying so the resulting store updates are recognised as
    // an echo of the pull, not a local change to push back.
    lastSyncedRef.current = JSON.stringify(merged);
    applyWebSettings(merged);

    // No server row yet — seed it so other clients inherit these settings.
    if (data === null) {
      upsertRef.current.mutate(toPayload(merged));
    }
  }, [isSuccess, data]);

  // Push: debounce-write local changes back to the server.
  useEffect(() => {
    const maybePush = () => {
      if (!hydratedRef.current) return;
      const current = collectWebSettings();
      const json = JSON.stringify(current);
      if (json === lastSyncedRef.current) return;

      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        lastSyncedRef.current = json;
        upsertRef.current.mutate(toPayload(current));
      }, PUSH_DEBOUNCE_MS);
    };

    const unsubTheme = useThemeStore.subscribe(maybePush);
    const unsubPrefs = useUserPreferencesStore.subscribe(maybePush);
    return () => {
      unsubTheme();
      unsubPrefs();
      clearTimeout(timerRef.current);
    };
  }, []);
}
