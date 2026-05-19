import type * as React from 'react';
import { cn } from '@/lib/cn';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  ref?: React.Ref<HTMLInputElement>;
  error?: boolean;
};

function Input({ className, type, ref, error, ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        'flex h-field w-full rounded-md border border-input bg-background px-3 py-control text-[max(var(--font-size-base),16px)] file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:focus-ring focus-visible:focus-ring-offset disabled:cursor-not-allowed disabled:opacity-50',
        error && 'border-destructive ring-destructive focus-visible:ring-destructive',
        className,
      )}
      ref={ref}
      {...props}
    />
  );
}

export { Input };
