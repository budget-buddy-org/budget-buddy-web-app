import type * as React from 'react'
import { Header } from './Header'
import { MobileNav, SidebarNav } from './MobileNav'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        {/* Sidebar — visible on md+ */}
        <aside className="hidden w-56 shrink-0 border-r md:block">
          <SidebarNav className="p-4" />
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
          <div className="mx-auto max-w-2xl px-4 py-6 animate-fade-in md:max-w-4xl md:px-6">{children}</div>
        </main>
      </div>

      {/* Bottom nav — visible on mobile */}
      <MobileNav />
    </div>
  )
}
