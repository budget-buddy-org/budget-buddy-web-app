import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: Readonly<PageContainerProps>) {
  return <div className={cn('space-y-6', className)}>{children}</div>;
}
