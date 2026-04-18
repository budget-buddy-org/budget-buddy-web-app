import type { Problem } from '@budget-buddy-org/budget-buddy-contracts';

/**
 * Casts an unknown mutation/query error to Problem (RFC 7807).
 * API errors are thrown as plain objects that match the Problem shape —
 * they are not `Error` instances. Returns undefined for non-object values
 * (e.g. network-level errors) or Error instances that lack Problem fields.
 */
export function getApiError(error: unknown): Problem | undefined {
  if (error !== null && typeof error === 'object' && !('stack' in error && 'message' in error)) {
    return error as Problem;
  }
  // Also check if an Error-like object has Problem fields (status/title)
  if (error !== null && typeof error === 'object' && ('status' in error || 'title' in error)) {
    return error as Problem;
  }
  return undefined;
}
