import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

/**
 * Standard container for all top-level pages to ensure consistent spacing.
 */
export function PageContainer({ children, className }: PageContainerProps) {
  return <div className={cn('space-y-6', className)}>{children}</div>;
}
