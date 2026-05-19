import type * as React from 'react';
import { cn } from '@/lib/cn';

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  ref?: React.Ref<HTMLInputElement>;
}

function Switch({ className, checked, onCheckedChange, ref, ...props }: SwitchProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onCheckedChange?.(e.target.checked);
  };

  return (
    <label
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-pill transition-colors has-[:focus-visible]:focus-ring has-[:focus-visible]:focus-ring-offset disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-primary' : 'bg-muted',
        className,
      )}
    >
      <input
        type="checkbox"
        className="sr-only"
        ref={ref}
        checked={checked}
        onChange={handleChange}
        {...props}
      />
      <span
        className={cn(
          'pointer-events-none block size-5 rounded-pill bg-background shadow-lg ring-0 transition-transform duration-200 ease-in-out',
          checked ? 'translate-x-5' : 'translate-x-0.5',
        )}
      />
    </label>
  );
}

export { Switch };
