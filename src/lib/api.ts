import { client } from '@budget-buddy-org/budget-buddy-contracts/client.gen';
import type { User } from 'oidc-client-ts';
import { getUserManager } from '@/lib/oidc';

// Only proactively refresh when the token is basically gone. The SDK's
// automaticSilentRenew already fires 60s before expiry; overlapping with it
// causes duplicate refresh-token redemptions, which IdPs that enable
// refresh-token rotation treat as token theft and invalidate the session.
// This safety net only kicks in when the SDK's setTimeout was throttled or
// killed in a backgrounded tab.
const REFRESH_THRESHOLD_SECONDS = 10;

// Dedupe concurrent refreshes. Multiple in-flight API requests must share a
// single signinSilent() call; otherwise we redeem the same refresh token N
// times in parallel and get rotated out.
let pendingSilentRenew: Promise<User | null> | null = null;

function refreshSilently(): Promise<User | null> {
  pendingSilentRenew ??= getUserManager()
    .signinSilent()
    .catch(() => null)
    .finally(() => {
      pendingSilentRenew = null;
    });
  return pendingSilentRenew;
}

/**
 * Returns a fresh access token for the current user.
 * Proactively triggers a silent refresh only when the token is within
 * REFRESH_THRESHOLD_SECONDS of expiry (safety net for throttled background tabs).
 */
export async function getAuthToken(): Promise<string | undefined> {
  const user = await getUserManager().getUser();
  if (!user) return undefined;

  const now = Date.now() / 1000;
  if (user.expires_at !== undefined && user.expires_at - now < REFRESH_THRESHOLD_SECONDS) {
    const refreshed = await refreshSilently();
    return refreshed?.access_token ?? undefined;
  }

  return user.access_token ?? undefined;
}

// Attach a fresh Bearer token to every outgoing request.
client.interceptors.request.use(async (request) => {
  const token = await getAuthToken();
  if (token) {
    request.headers.set('Authorization', `Bearer ${token}`);
  }
  return request;
});

// Hard 401: the OIDC SDK has already attempted a silent refresh internally.
// Redirect to the IdP so the user can re-authenticate.
client.interceptors.response.use(async (response, request) => {
  if (response.status === 401) {
    const url = request.url ?? '';
    // Exclude all /auth/* paths to avoid redirect loops on the callback route.
    if (!url.includes('/auth/')) {
      await getUserManager().signinRedirect({
        url_state: window.location.pathname + window.location.search,
      });
    }
  }
  return response;
});

export { client } from '@budget-buddy-org/budget-buddy-contracts/client.gen';
