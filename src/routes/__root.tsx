import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Link, Outlet, createRootRoute, useRouter } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { useState } from 'react'
import { Toaster } from '@/components/ui/toaster'
import { VersionCheck } from '@/components/VersionCheck'

export const Route = createRootRoute({
  component: RootComponent,
  errorComponent: ErrorComponent,
  notFoundComponent: NotFoundComponent,
})

function RootComponent() {
  return (
    <>
      <VersionCheck />
      <Outlet />
      <Toaster />
      {import.meta.env.DEV && (
        <>
          <TanStackRouterDevtools position="bottom-right" />
          <ReactQueryDevtools initialIsOpen={false} />
        </>
      )}
    </>
  )
}

function ErrorComponent({ error }: { error: Error }) {
  const router = useRouter()
  const [showDetails, setShowDetails] = useState(false)

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        An unexpected error occurred. Please try again later.
      </p>

      <div className="flex flex-col gap-2">
        <div className="flex justify-center gap-4">
          <button type="button" className="text-sm underline cursor-pointer" onClick={() => router.invalidate()}>
            Try again
          </button>
          <button
            type="button"
            className="text-sm underline cursor-pointer"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Hide details' : 'Show details'}
          </button>
        </div>

        {showDetails && (
          <div className="mt-4 text-left">
            <p className="mb-1 text-sm font-medium text-destructive">{error.message}</p>
            {error.stack && (
              <pre className="max-h-40 overflow-auto rounded bg-muted p-4 text-xs text-muted-foreground">
                {error.stack}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-xl font-semibold">Page not found</h1>
      <Link to="/" className="text-sm underline">
        Go home
      </Link>
    </div>
  )
}
