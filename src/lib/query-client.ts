import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { logError } from './error-logger'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
  // Global catch-all: fires once per query/mutation after all retries are exhausted.
  // If you add a per-query onError option elsewhere, the same error will also be logged here — avoid duplicating toast/reporting logic in both places.
  queryCache: new QueryCache({
    onError: (error) => logError(error, { source: 'QueryCache' }),
  }),
  mutationCache: new MutationCache({
    onError: (error) => logError(error, { source: 'MutationCache' }),
  }),
})
