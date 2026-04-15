import { logoutUser } from '@budget-buddy-org/budget-buddy-contracts';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/query-client';
import { useAuthStore } from '@/stores/auth.store';

export function useLogout() {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => logoutUser(),
    onError: () => {
      toast({
        title: 'Sign out failed',
        description: 'Could not reach the server. You have been signed out locally.',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      clearAuth();
      queryClient.clear();
      navigate({ to: '/login' });
    },
  });
}
