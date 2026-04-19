import { useEffect } from 'react';
import { useAuth } from 'react-oidc-context';
import { AppLayout } from '@/components/layout/AppLayout';

export function ProtectedAppLayout() {
  const auth = useAuth();

  useEffect(() => {
    if (auth.isLoading || auth.activeNavigator || auth.isAuthenticated) return;

    void auth.signinRedirect();
  }, [auth]);

  if (auth.isLoading || auth.activeNavigator) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <p className="text-sm text-muted-foreground">Redirecting to sign-in…</p>
      </div>
    );
  }

  if (!auth.isAuthenticated) return null;

  return <AppLayout />;
}
