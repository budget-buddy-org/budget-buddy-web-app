import { Outlet } from '@tanstack/react-router';

export function AuthLayout() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Budget Buddy</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your personal finance companion</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
