import type * as React from 'react';
import { ApiUnavailableBanner } from '@/components/ApiUnavailableBanner';
import { OfflineBanner } from '@/components/OfflineBanner';
import { FABProvider } from '@/contexts/fab-provider';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { Sidebar } from './Sidebar';

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <FABProvider>
      <div className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-toast focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-overlay"
        >
          Skip to content
        </a>
        <OfflineBanner />
        <ApiUnavailableBanner />
        <Header />
        <div className="flex flex-1">
          {/* Sidebar — visible on md+ */}
          <Sidebar />

          {/* Main content — extra bottom padding on mobile to clear floating nav */}
          <main
            id="main"
            aria-label="Main content"
            className="min-w-0 flex-1 pb-[calc(env(safe-area-inset-bottom)+5rem)] md:pb-0"
          >
            <div className="mx-auto max-w-2xl px-4 py-6 md:max-w-4xl md:px-6">{children}</div>
          </main>
        </div>

        {/* Floating bottom nav + FAB — visible on mobile */}
        <MobileNav />
      </div>
    </FABProvider>
  );
}
