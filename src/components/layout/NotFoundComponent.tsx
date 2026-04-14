import { Link } from '@tanstack/react-router'

export function NotFoundComponent() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-xl font-semibold">Page not found</h1>
      <Link to="/" className="text-sm underline">
        Go home
      </Link>
    </div>
  )
}
