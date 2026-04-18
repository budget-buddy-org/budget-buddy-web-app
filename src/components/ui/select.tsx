import type * as React from 'react';
import { cn } from '@/lib/cn';

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  ref?: React.Ref<HTMLSelectElement>;
  error?: boolean;
};

function Select({ className, ref, error, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-[max(var(--font-size-base),16px)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer',
        error && 'border-destructive ring-destructive focus-visible:ring-destructive',
        className,
      )}
      ref={ref}
      {...props}
    />
  );
}

export { Select };
