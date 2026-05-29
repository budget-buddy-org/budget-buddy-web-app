import type {
  ClientSettings,
  ClientSettingsPayload,
} from '@budget-buddy-org/budget-buddy-contracts';
import {
  deleteCurrentUserClientSettings,
  getCurrentUserClientSettings,
  upsertCurrentUserClientSettings,
} from '@budget-buddy-org/budget-buddy-contracts';
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { WEB_CLIENT_ID } from '@/lib/clientSettings';

export const USER_SETTINGS_KEYS = {
  all: ['user-settings'] as const,
  detail: (clientId: string) => ['user-settings', clientId] as const,
};

/**
 * Fetches the per-client settings row for a single client. A 404 (no settings
 * stored yet) is treated as `null` rather than an error — a fresh account
 * legitimately has no row until the first upsert.
 */
export const userSettingsQueryOptions = (clientId = WEB_CLIENT_ID) =>
  queryOptions<ClientSettings | null>({
    queryKey: USER_SETTINGS_KEYS.detail(clientId),
    queryFn: async () => {
      const { data, error, response } = await getCurrentUserClientSettings({
        path: { clientId },
      });
      if (response?.status === 404) return null;
      if (error) throw error;
      return data ?? null;
    },
  });

export function useUserSettings(clientId = WEB_CLIENT_ID) {
  return useQuery(userSettingsQueryOptions(clientId));
}

export function useUpsertUserSettings(clientId = WEB_CLIENT_ID) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (settings: ClientSettingsPayload) => {
      const { data, error } = await upsertCurrentUserClientSettings({
        path: { clientId },
        body: { settings },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.setQueryData(USER_SETTINGS_KEYS.detail(clientId), data ?? null);
    },
  });
}

export function useDeleteUserSettings(clientId = WEB_CLIENT_ID) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await deleteCurrentUserClientSettings({
        path: { clientId },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.setQueryData(USER_SETTINGS_KEYS.detail(clientId), null);
    },
  });
}
