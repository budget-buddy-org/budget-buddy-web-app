import { Outlet } from '@tanstack/react-router';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AppShell } from '@/components/layout/AppShell';
import { useSettingsSync } from '@/hooks/useSettingsSync';

export function AppLayout() {
  // Syncs appearance + preference settings with the server while authenticated.
  useSettingsSync();

  return (
    <AppShell>
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
    </AppShell>
  );
}
