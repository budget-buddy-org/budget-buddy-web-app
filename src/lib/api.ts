import { client } from '@budget-buddy-org/budget-buddy-contracts/client.gen';
import type { User } from 'oidc-client-ts';
import { getUserManager } from '@/lib/oidc';

// Only proactively refresh when the token is basically gone. In the normal case
// the SDK's automaticSilentRenew (which fires ~60s before expiry) handles
// renewal; this safety net only kicks in when that setTimeout was throttled or
// killed in a backgrounded tab. Duplicate redemptions of a rotating refresh
// token (which IdPs treat as theft and revoke the whole family) are prevented
// globally by coalesceSilentRenew() in oidc.ts, which funnels every
// signinSilent() — this module's, the SDK's, and the route guard's — through a
// single in-flight redemption.
const REFRESH_THRESHOLD_SECONDS = 10;

// On tab re-focus, refresh within the same ~60s window the SDK targets so the
// token is fresh before the first API call fires.
const VISIBILITY_REFRESH_THRESHOLD_SECONDS = 60;

// Dedupe this module's own concurrent refreshes onto one signinSilent() call.
// (coalesceSilentRenew() in oidc.ts additionally dedupes across the SDK and the
// route guard.)
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
// have been throttled by the browser, leaving an expired token in storage. This
// visibilitychange listener proactively refreshes within the same ~60s window the
// SDK targets, before any API call fires, so requests never go out with a stale
// token. Going through refreshSilently() (and ultimately coalesceSilentRenew() in
// oidc.ts) guarantees this never races the SDK's delayed timer or getAuthToken()
// into a duplicate refresh-token redemption.
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
