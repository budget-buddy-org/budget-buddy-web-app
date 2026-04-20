import { client } from '@budget-buddy-org/budget-buddy-contracts/client.gen';
import { getUserManager } from '@/lib/oidc';

const REFRESH_THRESHOLD_SECONDS = 60;

/**
 * Returns a fresh access token for the current user.
 * Proactively triggers a silent refresh if the token expires within 60 seconds,
 * preventing mid-request expiry between automaticSilentRenew cycles.
 */
export async function getAuthToken(): Promise<string | undefined> {
  const user = await getUserManager().getUser();
  if (!user) return undefined;

  const now = Date.now() / 1000;
  if (user.expires_at !== undefined && user.expires_at - now < REFRESH_THRESHOLD_SECONDS) {
    const refreshed = await getUserManager()
      .signinSilent()
      .catch(() => null);
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
      await getUserManager().signinRedirect();
    }
  }
  return response;
});

export { client } from '@budget-buddy-org/budget-buddy-contracts/client.gen';
