import type * as React from 'react';
import { cn } from '@/lib/cn';

function Skeleton({ className, ...props }: Readonly<React.HTMLAttributes<HTMLDivElement>>) {
  return (
    <div
      data-testid="skeleton"
      className={cn('skeleton-shimmer rounded-md bg-muted', className)}
      {...props}
    />
  );
}

export { Skeleton };
