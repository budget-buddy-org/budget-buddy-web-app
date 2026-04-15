import * as React from 'react';
import { cn } from '@/lib/cn';
import { Input } from './input';

export interface AmountInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
}

const AmountInput = React.forwardRef<HTMLInputElement, AmountInputProps>(
  ({ className, value, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Extract digits only
      const digits = e.target.value.replace(/\D/g, '');

      if (!digits) {
        onChange('');
        return;
      }

      // Convert to a number (e.g. 1299) then back to decimal string (e.g. 12.99)
      const numericValue = Number.parseInt(digits, 10);
      if (numericValue === 0) {
        onChange('');
        return;
      }
      const decimalValue = (numericValue / 100).toFixed(2);

      onChange(decimalValue);
    };

    // Ensure the display value is always correctly formatted
    const displayValue = value ? Number.parseFloat(value).toFixed(2) : '0.00';

    return (
      <Input
        type="text"
        inputMode="decimal"
        className={cn('text-right font-medium tabular-nums', className)}
        value={displayValue}
        onChange={handleChange}
        ref={ref}
        autoComplete="off"
        {...props}
      />
    );
  },
);
AmountInput.displayName = 'AmountInput';

export { AmountInput };
