import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useScrollDirection } from '@/hooks/use-scroll-direction'
import { cn } from '@/lib/cn'

interface PageHeaderProps {
  title: string
  subtitle?: ReactNode
  primaryAction?: {
    label: string
    onClick: () => void
    icon?: ReactNode
  }
  children?: ReactNode // Extra elements/buttons
}

export function PageHeader({ title, subtitle, primaryAction, children }: PageHeaderProps) {
  const scrollDirection = useScrollDirection()
  const isHidden = scrollDirection === 'down'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold">{title}</h1>
          {subtitle && <div className="mt-1 text-sm text-muted-foreground">{subtitle}</div>}
        </div>
        <div className="flex items-center gap-2">
          {children}
          {primaryAction && (
            <Button onClick={primaryAction.onClick} className="hidden md:flex">
              {primaryAction.icon || <Plus className="h-4 w-4" />}
              {primaryAction.label}
            </Button>
          )}
        </div>
      </div>
      
      {/* Mobile FAB */}
      {primaryAction && (
        <Button
          onClick={primaryAction.onClick}
          size="icon"
          className={cn(
            'fixed right-4 z-40 h-14 w-14 rounded-full shadow-lg md:hidden transition-all duration-300 transform',
            'bottom-[calc(50px+env(safe-area-inset-bottom)+1.5rem)]',
            isHidden ? 'translate-y-24 opacity-0' : 'translate-y-0 opacity-100'
          )}
          aria-label={primaryAction.label}
        >
          {primaryAction.icon || <Plus className="h-6 w-6" />}
        </Button>
      )}
    </div>
  )
}
