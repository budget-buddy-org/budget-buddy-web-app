import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

interface SectionHeaderProps {
  title: string;
  icon?: LucideIcon;
  className?: string;
}

/**
 * A reusable section header with an optional icon.
 * Used primarily in Settings and multi-section pages.
 */
export function SectionHeader({ title, icon: Icon, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {Icon && <Icon className="size-4 text-primary" />}
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>
  );
}
