import { Outlet, createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/AppShell'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useWindowFocusRefresh } from '@/hooks/useWindowFocusRefresh'
import { useAuthStore } from '@/stores/auth.store'

export const Route = createFileRoute('/_app')({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated()) {
      throw redirect({ to: '/login' })
    }
  },
  component: AppLayout,
  errorComponent: AppErrorComponent,
})

function AppLayout() {
  useWindowFocusRefresh()
  return (
    <AppShell>
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
    </AppShell>
  )
}

function AppErrorComponent({ error }: { error: Error }) {
  const router = useRouter()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="max-w-sm text-sm text-muted-foreground">{error.message}</p>
      <button type="button" className="text-sm underline" onClick={() => router.invalidate()}>
        Try again
      </button>
    </div>
  )
}
