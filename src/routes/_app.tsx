import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth.store'
import { AppLayout } from '@/components/layout/AppLayout'
import { AppErrorComponent } from '@/components/layout/AppErrorComponent'

export const Route = createFileRoute('/_app')({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated()) {
      throw redirect({ to: '/login' })
    }
  },
  component: AppLayout,
  errorComponent: AppErrorComponent,
})
