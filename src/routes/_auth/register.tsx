import { useMutation } from '@tanstack/react-query'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authApi } from '@/lib/api'
import type { RegisterRequest } from '@budget-buddy-org/budget-buddy-contracts'

export const Route = createFileRoute('/_auth/register')({
  component: RegisterPage,
})

function RegisterPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const register = useMutation({
    mutationFn: async (body: RegisterRequest) => {
      await authApi.registerUser({ registerRequest: body })
    },
    onSuccess: () => {
      navigate({ to: '/login' })
    },
  })

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-medium">Create account</h2>
        <p className="text-sm text-muted-foreground">Choose a username and password</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          register.mutate({ username, password })
        }}
        className="space-y-3"
      >
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="username">
            Username
          </label>
          <Input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            minLength={3}
            maxLength={50}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="password">
            Password
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>

        {register.isError && (
          <p className="text-sm text-destructive">
            Registration failed. The username may already be taken.
          </p>
        )}

        {register.isSuccess && (
          <p className="text-sm text-income">Account created! Redirecting to login…</p>
        )}

        <Button type="submit" className="w-full" disabled={register.isPending}>
          {register.isPending ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
