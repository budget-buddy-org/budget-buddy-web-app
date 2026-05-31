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

// Match the SDK's automaticSilentRenew window so both paths share pendingSilentRenew
// and only one refresh-token redemption occurs per expiry cycle.
const VISIBILITY_REFRESH_THRESHOLD_SECONDS = 60;

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

// Hard 401: the SDK's automaticSilentRenew timer may have been killed in a
// background tab, so try a silent refresh first before redirecting the user.
// If the silent refresh succeeds, the current request still fails (the API
// client returns a 401 response tuple rather than throwing, so TanStack Query
// does not auto-retry it), but all subsequent requests will use the fresh token.
// Only redirect to the IdP when the refresh also fails.
client.interceptors.response.use(async (response, request) => {
  if (response.status === 401) {
    const url = request.url ?? '';
    // Exclude all /auth/* paths to avoid redirect loops on the callback route.
    if (!url.includes('/auth/')) {
      const refreshed = await refreshSilently();
      if (!refreshed) {
        await getUserManager().signinRedirect({
          url_state: globalThis.location.pathname + globalThis.location.search,
        });
      }
    }
  }
  return response;
});

// When a background tab is re-focused, the SDK's automaticSilentRenew timer may
// have been throttled by the browser, leaving an expired token in storage. Both
// the SDK's delayed timer and the first API request's getAuthToken() safety net
// then call signinSilent() concurrently — redeeming the same refresh token twice.
// IdPs with refresh-token rotation treat duplicate redemptions as token theft and
// invalidate the entire session.
//
// A visibilitychange listener proactively refreshes within the same 60-second
// window the SDK targets, before any API calls fire. Because it goes through
// refreshSilently(), it shares pendingSilentRenew with both getAuthToken() and the
// SDK's delayed timer, ensuring only one token redemption ever occurs.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    void Promise.resolve()
      .then(() => getUserManager().getUser())
      .then((user) => {
        if (!user) return;
        const now = Date.now() / 1000;
        if (
          user.expires_at === undefined ||
          user.expires_at - now < VISIBILITY_REFRESH_THRESHOLD_SECONDS
        ) {
          void refreshSilently();
        }
      })
      .catch(() => {}); // getUserManager() throws before initUserManager() — skip
  });
}

export { client } from '@budget-buddy-org/budget-buddy-contracts/client.gen';
