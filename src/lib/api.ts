import { client } from '@budget-buddy-org/budget-buddy-contracts/client.gen';
import type { User } from 'oidc-client-ts';
import { getUserManager } from '@/lib/oidc';

// Only proactively refresh when the token is basically gone. The SDK's
// automaticSilentRenew already fires 60s before expiry; overlapping with it
// causes duplicate refresh-token redemptions which Zitadel (with rotation on)
// treats as theft and invalidates the session. This safety net only kicks in
// when the SDK's setTimeout was throttled/killed in a backgrounded tab.
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
 * Returns a fresh signed-in User for the current session.
 * Proactively triggers a silent refresh only when the token is within
 * REFRESH_THRESHOLD_SECONDS of expiry (safety net for throttled background tabs).
 */
export async function getAuthUser(): Promise<User | null> {
  const user = await getUserManager().getUser();
  if (!user) return null;

  const now = Date.now() / 1000;
  if (user.expires_at !== undefined && user.expires_at - now < REFRESH_THRESHOLD_SECONDS) {
    return await refreshSilently();
  }

  return user;
}

/**
 * @deprecated Prefer `getAuthUser()`. Kept for call sites that only need the raw token.
 */
export async function getAuthToken(): Promise<string | undefined> {
  return (await getAuthUser())?.access_token ?? undefined;
}

// Attach the access token to every outgoing request, using `user.token_type`
// as the auth scheme. When DPoP is enabled on the IdP, `token_type` comes back
// as "DPoP" and we also attach a freshly signed proof JWT bound to the request
// URL + method. With plain Bearer tokens the DPoP branch is a no-op.
client.interceptors.request.use(async (request) => {
  const user = await getAuthUser();
  if (!user?.access_token) return request;

  const scheme = user.token_type || 'Bearer';
  request.headers.set('Authorization', `${scheme} ${user.access_token}`);

  if (scheme.toLowerCase() === 'dpop') {
    const proof = await getUserManager().dpopProof(request.url, user, request.method);
    if (proof) {
      request.headers.set('DPoP', proof);
    }
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
