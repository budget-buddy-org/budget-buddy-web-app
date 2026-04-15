import { createFileRoute, redirect } from '@tanstack/react-router';
import { AppErrorComponent } from '@/components/layout/AppErrorComponent';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuthStore } from '@/stores/auth.store';

export const Route = createFileRoute('/_app')({
  beforeLoad: () => {
    if (!useAuthStore.getState().accessToken) {
      throw redirect({ to: '/login' });
    }
  },
  component: AppLayout,
  errorComponent: AppErrorComponent,
});
