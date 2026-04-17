import { Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { useFABAction } from '@/contexts/fab-context';

interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  children?: ReactNode;
}

export function PageHeader({ title, subtitle, primaryAction, children }: PageHeaderProps) {
  // Register the primary action as the mobile FAB (clears on unmount)
  useFABAction(primaryAction ?? null);

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
    </div>
  );
}
