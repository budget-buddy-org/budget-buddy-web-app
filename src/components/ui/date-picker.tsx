import type * as React from 'react';
import { cn } from '@/lib/cn';
import { Input } from './input';

export type DatePickerProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  ref?: React.Ref<HTMLInputElement>;
  error?: boolean;
};

function DatePicker({ className, ref, error, ...props }: DatePickerProps) {
  return (
    <Input
      type="date"
      className={cn(
        'block h-10 w-full appearance-none',
        'bg-background text-[max(var(--font-size-base),16px)] px-3 py-2',
        '[&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:cursor-pointer',
        '[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-clear-button]:appearance-none',
        className,
      )}
      ref={ref}
      error={error}
      {...props}
    />
  );
}

export { DatePicker };
