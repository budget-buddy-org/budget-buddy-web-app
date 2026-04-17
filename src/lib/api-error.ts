import type { Problem } from '@budget-buddy-org/budget-buddy-contracts';

/**
 * Casts an unknown mutation/query error to Problem (RFC 7807).
 * API errors are thrown as plain objects that match the Problem shape —
 * they are not `Error` instances. Returns undefined for non-object values
 * (e.g. network-level errors).
 */
export function getApiError(error: unknown): Problem | undefined {
  if (error !== null && typeof error === 'object') {
    return error as Problem;
  }
  return undefined;
}
