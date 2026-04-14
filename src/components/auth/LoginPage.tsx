import type { AuthToken, LoginRequest, Problem } from '@budget-buddy-org/budget-buddy-contracts';
import { loginUser } from '@budget-buddy-org/budget-buddy-contracts';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { LogIn } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/auth.store';

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const login = useMutation({
    mutationFn: async (body: LoginRequest) => {
      const { data, error } = await loginUser({ body });
      if (error) throw error;
      return data as AuthToken;
    },
    onSuccess: (data) => {
      setAuth(data.access_token, data.refresh_token, data.expires_in);
      navigate({ to: '/' });
    },
  });

  const fieldErrors = (login.error as unknown as Problem)?.errors;
  const getFieldError = (field: string) => fieldErrors?.find((e) => e.field === field)?.message;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-medium">Sign in</h2>
        <p className="text-sm text-muted-foreground">Enter your credentials to continue</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          login.mutate({ username, password });
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
            placeholder="john_doe"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
            className={
              getFieldError('username')
                ? 'border-destructive ring-destructive focus-visible:ring-destructive'
                : ''
            }
          />
          {getFieldError('username') && (
            <p className="text-sm font-medium text-destructive">{getFieldError('username')}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="password">
            Password
          </label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            className={
              getFieldError('password')
                ? 'border-destructive ring-destructive focus-visible:ring-destructive'
                : ''
            }
          />
          {getFieldError('password') && (
            <p className="text-sm font-medium text-destructive">{getFieldError('password')}</p>
          )}
        </div>

        {login.isError && !fieldErrors?.length && (
          <p className="text-sm text-destructive">Invalid credentials. Please try again.</p>
        )}

        <Button type="submit" className="w-full" loading={login.isPending}>
          {!login.isPending && <LogIn className="h-4 w-4 mr-2" />}
          Sign in
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link
          to="/register"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
