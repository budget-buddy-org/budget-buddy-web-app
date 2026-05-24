import { ChevronDown } from 'lucide-react';
import type * as React from 'react';
import { useEffect, useRef } from 'react';
import { TransactionTypeToggle } from '@/components/ui/transaction-type-toggle';
import { cn } from '@/lib/cn';
import { ISO_CURRENCIES } from '@/lib/formatters';

interface HeroAmountInputProps {
  type: 'EXPENSE' | 'INCOME';
  amount: string;
  currency: string;
  onTypeChange: (value: 'EXPENSE' | 'INCOME') => void;
  onAmountChange: (value: string) => void;
  onCurrencyChange: (value: string) => void;
  amountError?: boolean;
  typeError?: boolean;
  currencyError?: boolean;
  autoFocus?: boolean;
}

export function HeroAmountInput({
  type,
  amount,
  currency,
  onTypeChange,
  onAmountChange,
  onCurrencyChange,
  amountError,
  typeError,
  currencyError,
  autoFocus,
}: HeroAmountInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replaceAll(/\D/g, '');
    if (!digits) {
      onAmountChange('');
      return;
    }
    const numericValue = Number.parseInt(digits, 10);
    if (numericValue === 0) {
      onAmountChange('');
      return;
    }
    onAmountChange((numericValue / 100).toFixed(2));
  };

  const displayValue = amount ? Number.parseFloat(amount).toFixed(2) : '';

  const valueColor =
    amountError && displayValue
      ? 'text-destructive'
      : type === 'INCOME' && displayValue
        ? 'text-income'
        : 'text-foreground';

  return (
    <div className="flex flex-col items-center gap-3">
      <TransactionTypeToggle
        value={type}
        onChange={onTypeChange}
        error={typeError}
        className="w-full max-w-xs"
      />

      {/* Amount — full-width centred so the number is always the focal point */}
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        placeholder="0.00"
        value={displayValue}
        onChange={handleAmountChange}
        autoComplete="off"
        aria-label="Amount"
        aria-invalid={amountError || undefined}
        className={cn(
          'w-full bg-transparent border-0 outline-none text-center',
          'text-4xl sm:text-5xl font-bold tabular-nums tracking-tighter leading-none',
          'placeholder:text-muted-foreground/30',
          'focus-visible:focus-ring focus-visible:rounded-md transition-colors',
          valueColor,
        )}
      />

      {/* Currency picker — pill below the amount */}
      <div className="relative inline-flex">
        <span
          aria-hidden
          className={cn(
            'pointer-events-none inline-flex items-center gap-1 rounded-pill bg-muted px-3 py-1.5',
            'text-sm font-semibold tabular-nums transition-colors',
            currencyError ? 'text-destructive' : 'text-foreground/60',
          )}
        >
          {currency}
          <ChevronDown aria-hidden className="size-3 text-muted-foreground" />
        </span>
        <select
          value={currency}
          onChange={(e) => onCurrencyChange(e.target.value)}
          aria-label="Currency"
          aria-invalid={currencyError || undefined}
          className={cn(
            'absolute inset-0 cursor-pointer appearance-none opacity-0',
            'focus-visible:focus-ring rounded-pill',
          )}
        >
          {ISO_CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
