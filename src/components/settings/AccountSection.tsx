import { useQueryClient } from '@tanstack/react-query';
import { LogOut, User } from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SectionHeader } from '@/components/ui/section-header';
import { getConfig } from '@/lib/config';

export function AccountSection() {
  const { user, signoutRedirect } = useAuth();
  const queryClient = useQueryClient();
  const config = getConfig();

  const profileUrl = user?.profile?.profile || config.VITE_OIDC_USER_MANAGEMENT_URL;

  const handleSignOut = () => {
    // Drop cached server state before redirecting so a different user signing
    // in next won't briefly see the previous account's data.
    queryClient.clear();
    void signoutRedirect();
  };

  return (
    <section className="space-y-3">
      <SectionHeader title="Account" icon={User} />
      <Card className="p-4 space-y-4">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">
            {user?.profile.name || user?.profile.preferred_username || 'Authenticated User'}
          </p>
          <p className="text-xs text-muted-foreground">{user?.profile.email}</p>
        </div>
        <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:flex-wrap">
          {profileUrl && (
            <Button asChild variant="outline" className="w-full cursor-pointer sm:w-auto">
              <a href={profileUrl} target="_blank" rel="noopener noreferrer">
                <User className="size-4" />
                Manage Profile
              </a>
            </Button>
          )}
          <Button
            variant="outline"
            className="w-full cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive sm:w-auto"
            onClick={handleSignOut}
          >
            <LogOut className="size-4" />
            Sign out
          </Button>
        </div>
        {profileUrl ? (
          <p className="text-xs text-muted-foreground mt-2">
            You will be redirected to your identity provider to manage your account.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            External profile management is not provided by your identity provider.
          </p>
        )}
      </Card>
    </section>
  );
}
