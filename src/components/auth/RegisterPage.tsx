import type { Problem, RegisterRequest } from '@budget-buddy-org/budget-buddy-contracts';
import { registerUser } from '@budget-buddy-org/budget-buddy-contracts';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { UserPlus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function RegisterPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const register = useMutation({
    mutationFn: async (body: RegisterRequest) => {
      const { error } = await registerUser({ body });
      if (error) throw error;
    },
    onSuccess: () => {
      navigate({ to: '/login' });
    },
  });

  const fieldErrors = (register.error as unknown as Problem)?.errors;
  const getFieldError = (field: string) => fieldErrors?.find((e) => e.field === field)?.message;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-medium">Create account</h2>
        <p className="text-sm text-muted-foreground">Choose a username and password</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          register.mutate({ username, password });
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
            placeholder="choose_username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            minLength={3}
            maxLength={50}
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
            autoComplete="new-password"
            minLength={8}
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

        {register.isError && !fieldErrors?.length && (
          <p className="text-sm text-destructive">
            Registration failed. The username may already be taken.
          </p>
        )}

        {register.isSuccess && (
          <p className="text-sm text-income">Account created! Redirecting to login…</p>
        )}

        <Button type="submit" className="w-full" loading={register.isPending}>
          {!register.isPending && <UserPlus className="h-4 w-4 mr-2" />}
          Create account
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
