import { UserPlus } from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import { Button } from '@/components/ui/button';

export function RegisterPage() {
  const auth = useAuth();

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-lg font-medium">Create account</h2>
        <p className="text-sm text-muted-foreground">
          Log in with your identity provider to continue
        </p>
      </div>

      <Button onClick={() => void auth.signinRedirect()} className="w-full" size="lg">
        <UserPlus className="size-4 mr-2" />
        Create account with Zitadel
      </Button>

      <p className="text-center text-xs text-muted-foreground pt-4">
        Account registration and password management are handled by your identity provider.
      </p>
    </div>
  );
}
