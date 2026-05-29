import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Eraser, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from 'react-oidc-context';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { Button } from '@/components/ui/button';
import { Section } from '@/components/ui/section';
import { useToast } from '@/hooks/use-toast';
import { useClearUserData, useDeleteAccount } from '@/hooks/useUserAccount';

export function DangerZoneSection() {
  const { toast } = useToast();
  const { removeUser, signoutRedirect } = useAuth();
  const queryClient = useQueryClient();

  const clearData = useClearUserData();
  const deleteAccount = useDeleteAccount();

  const [clearOpen, setClearOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleClearData = () => {
    clearData.mutate(undefined, {
      onSuccess: () => {
        setClearOpen(false);
        toast({ title: 'All financial data cleared', variant: 'success' });
      },
      onError: () => {
        toast({ title: "Couldn't clear your data", variant: 'destructive' });
      },
    });
  };

  const handleDeleteAccount = () => {
    deleteAccount.mutate(undefined, {
      onSuccess: async () => {
        // The account is gone at the identity provider; drop all cached server
        // state and local credentials, then end the session.
        queryClient.clear();
        try {
          await signoutRedirect();
        } catch {
          // The IdP end-session may reject a deleted account — clear the local
          // session and reload so the app falls back to the sign-in flow.
          await removeUser();
          window.location.href = '/';
        }
      },
      onError: () => {
        setDeleteOpen(false);
        toast({
          title: "Couldn't delete your account",
          description: 'Please try again in a moment.',
          variant: 'destructive',
        });
      },
    });
  };

  return (
    <Section
      title="Danger Zone"
      icon={AlertTriangle}
      cardClassName="p-4 space-y-4 border-destructive/40"
    >
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">Clear all data</p>
        <p className="text-xs text-muted-foreground">
          Permanently delete every category and transaction. Your account and settings stay intact.
        </p>
      </div>
      <Button
        variant="outline"
        className="w-full cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive sm:w-auto"
        onClick={() => setClearOpen(true)}
      >
        <Eraser className="size-4" />
        Clear all data
      </Button>

      <div className="flex flex-col gap-1 border-t border-border pt-4">
        <p className="text-sm font-medium">Delete account</p>
        <p className="text-xs text-muted-foreground">
          Permanently delete your account and all associated data. This cannot be undone.
        </p>
      </div>
      <Button
        variant="destructive"
        className="w-full cursor-pointer sm:w-auto"
        onClick={() => setDeleteOpen(true)}
      >
        <Trash2 className="size-4" />
        Delete account
      </Button>

      <ConfirmationDialog
        isOpen={clearOpen}
        onOpenChange={setClearOpen}
        onConfirm={handleClearData}
        title="Clear all data?"
        description="This permanently deletes all your categories and transactions. Your account and settings are kept. This action cannot be undone."
        confirmText="Clear data"
        variant="destructive"
        isLoading={clearData.isPending}
      />
      <ConfirmationDialog
        isOpen={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDeleteAccount}
        title="Delete your account?"
        description="This permanently deletes your account and all associated data, and signs you out. This action cannot be undone."
        confirmText="Delete account"
        variant="destructive"
        isLoading={deleteAccount.isPending}
      />
    </Section>
  );
}
