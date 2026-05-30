import type { Me } from '@budget-buddy-org/budget-buddy-contracts';
import {
  clearCurrentUserData,
  deleteCurrentUser,
  getCurrentUser,
} from '@budget-buddy-org/budget-buddy-contracts';
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CATEGORIES_KEYS } from '@/hooks/useCategories';
import { CATEGORIES_SUMMARY_KEYS } from '@/hooks/useCategoriesSummary';
import { TRANSACTIONS_SUMMARY_KEYS } from '@/hooks/useMonthlySummary';
import { TRANSACTIONS_KEYS } from '@/hooks/useTransactions';

export const CURRENT_USER_KEYS = {
  all: ['current-user'] as const,
};

export const currentUserQueryOptions = () =>
  queryOptions<Me>({
    queryKey: CURRENT_USER_KEYS.all,
    queryFn: async () => {
      const { data, error } = await getCurrentUser();
      if (error) throw error;
      return data;
    },
  });

export function useCurrentUser() {
  return useQuery(currentUserQueryOptions());
}

/**
 * "Start over" — wipes the user's categories and transactions while keeping the
 * account, preferences, and per-client settings intact. After success the
 * financial-data caches are invalidated so the UI reflects the empty state.
 */
export function useClearUserData() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await clearCurrentUserData();
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TRANSACTIONS_KEYS.all });
      qc.invalidateQueries({ queryKey: CATEGORIES_KEYS.all });
      qc.invalidateQueries({ queryKey: CATEGORIES_SUMMARY_KEYS.all });
      qc.invalidateQueries({ queryKey: TRANSACTIONS_SUMMARY_KEYS.all });
    },
  });
}

/**
 * Permanently deletes the account at the identity provider and cascade-deletes
 * all local data. The bearer token may remain valid until expiry, so callers
 * must clear local credentials and end the session after this resolves.
 */
export function useDeleteAccount() {
  return useMutation({
    mutationFn: async () => {
      const { error } = await deleteCurrentUser();
      if (error) throw error;
    },
  });
}
