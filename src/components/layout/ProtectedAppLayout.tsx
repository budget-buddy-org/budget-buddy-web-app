import { useEffect, useRef } from 'react';
import { useAuth } from 'react-oidc-context';
import { AppLayout } from '@/components/layout/AppLayout';

export function ProtectedAppLayout() {
  const auth = useAuth();
  // Guards the one-shot silent-renew attempt below so a rejected refresh token
  // can't loop: signinSilent fails → re-render → signinSilent → …
  const triedSilentRenew = useRef(false);

  useEffect(() => {
    if (auth.isLoading || auth.activeNavigator || auth.isAuthenticated) return;

    void (async () => {
      // Cold start with an expired access token — the norm on iOS PWAs, which
      // suspend JS timers in the background, so automaticSilentRenew never runs
      // before the token expires. Redeem the still-valid refresh token first:
      // it restores the session in place, with no jarring redirect to the IdP
      // and no dependency on the IdP's SSO cookie surviving Safari ITP. Only a
      // genuinely expired/rejected refresh token falls through to interactive
      // sign-in. signinSilent is deduped in oidc.ts, so this can't race the
      // request interceptor or visibility listener into a double redemption.
      if (auth.user?.refresh_token && !triedSilentRenew.current) {
        triedSilentRenew.current = true;
        try {
          await auth.signinSilent();
          return; // success fires USER_LOADED → isAuthenticated flips → app renders
        } catch {
          // refresh token rejected/expired — fall through to interactive sign-in
        }
      }

      await auth.signinRedirect({
        // Preserve the current URL so onOidcSigninCallback can restore it after
        // the IdP redirect, instead of always landing on "/".
        url_state: globalThis.location.pathname + globalThis.location.search,
      });
    })();
  }, [auth]);

  if (auth.isLoading || auth.activeNavigator) {
    // A silent refresh-token renewal restores the session in place; only the
    // interactive paths actually leave for the IdP.
    const message =
      auth.activeNavigator === 'signinSilent'
        ? 'Restoring your session…'
        : 'Redirecting to sign-in…';
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    );
  }

  // A silent renew or signinRedirect() is in-flight — show a loading state so
  // the user never sees a blank screen between the unauthenticated render and
  // the redirect.
  if (!auth.isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <p className="text-sm text-muted-foreground">Redirecting to sign-in…</p>
      </div>
    );
  }

  return <AppLayout />;
}
