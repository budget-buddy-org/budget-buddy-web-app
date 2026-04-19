import { useMutation } from '@tanstack/react-query';
import { useAuth } from 'react-oidc-context';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/query-client';
import { useAuthStore } from '@/stores/auth.store';

export function useLogout() {
  const auth = useAuth();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => auth.signoutRedirect(),
    onError: () => {
      toast({
        title: 'Sign out failed',
        description: 'Could not complete sign out redirect. You have been signed out locally.',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      clearAuth();
      queryClient.clear();
    },
  });
}
