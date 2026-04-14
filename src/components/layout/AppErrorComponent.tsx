import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'

export function AppErrorComponent({ error }: { error: Error }) {
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
