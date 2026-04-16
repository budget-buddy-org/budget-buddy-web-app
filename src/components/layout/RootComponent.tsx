import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { VersionCheck } from '@/components/VersionCheck';
import { applyTheme, useThemeStore } from '@/stores/theme.store';

export function RootComponent() {
  const { theme, primaryHue, fontSize } = useThemeStore();

  useEffect(() => {
    applyTheme(theme, primaryHue, fontSize);
  }, [theme, primaryHue, fontSize]);

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
  );
}
