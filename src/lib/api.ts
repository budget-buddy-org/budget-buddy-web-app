import { client } from '@budget-buddy-org/budget-buddy-contracts/client.gen';
import { userManager } from '@/lib/oidc';

// Inject the access token into every request
client.interceptors.request.use(async (request) => {
  const user = await userManager.getUser();
  if (user?.access_token) {
    request.headers.set('Authorization', `Bearer ${user.access_token}`);
  }
  return request;
});

// Handle "hard" 401s: if a token is rejected even after internal SDK refresh attempts,
// the session is truly invalid, so we redirect the user to log in again.
client.interceptors.response.use(async (response, request) => {
  if (response.status === 401) {
    // Avoid redirect loops for auth-related endpoints
    const url = request.url || '';
    if (!url.includes('/auth/login') && !url.includes('/auth/register')) {
      await userManager.signinRedirect();
    }
  }
  return response;
});

export { client } from '@budget-buddy-org/budget-buddy-contracts/client.gen';
