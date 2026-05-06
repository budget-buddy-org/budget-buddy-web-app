import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface FormFieldProps {
  label?: ReactNode;
  error?: string | boolean;
  children: ReactNode;
  className?: string;
  required?: boolean;
  htmlFor?: string;
}

/**
 * A reusable form field wrapper that handles label, error message, and required indicator.
 */
export function FormField({
  label,
  error,
  children,
  className,
  required,
  htmlFor,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-1', className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground">
          {label} {required && <span className="text-destructive">*</span>}
        </label>
      )}
      {children}
      {typeof error === 'string' && error && (
        <p className="text-xs font-medium text-destructive">{error}</p>
      )}
    </div>
  );
}
