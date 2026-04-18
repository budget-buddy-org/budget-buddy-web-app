import type { AuthToken, LoginRequest } from '@budget-buddy-org/budget-buddy-contracts';
import { loginUser } from '@budget-buddy-org/budget-buddy-contracts';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { LogIn } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getApiError } from '@/lib/api-error';
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

  const fieldErrors = getApiError(login.error)?.errors;
  const getFieldError = (field: string) => fieldErrors?.find((e) => e.field === field)?.message;
  const usernameError = getFieldError('username');
  const passwordError = getFieldError('password');

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
            error={!!usernameError}
          />
          {usernameError && <p className="text-sm font-medium text-destructive">{usernameError}</p>}
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
            error={!!passwordError}
          />
          {passwordError && <p className="text-sm font-medium text-destructive">{passwordError}</p>}
        </div>

        {login.isError && !fieldErrors?.length && (
          <p className="text-sm text-destructive">Invalid credentials. Please try again.</p>
        )}

        <Button type="submit" className="w-full" loading={login.isPending}>
          {!login.isPending && <LogIn className="size-4 mr-2" />}
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
