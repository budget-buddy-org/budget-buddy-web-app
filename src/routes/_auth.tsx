import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth.store'
import { AuthLayout } from '@/components/layout/AuthLayout'

export const Route = createFileRoute('/_auth')({
  beforeLoad: () => {
    if (useAuthStore.getState().isAuthenticated()) {
      throw redirect({ to: '/' })
    }
  },
  component: AuthLayout,
})
