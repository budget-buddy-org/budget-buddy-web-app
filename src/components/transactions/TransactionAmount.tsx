import type { Transaction } from '@budget-buddy-org/budget-buddy-contracts';
import { useFormatters } from '@/hooks/useFormatters';
import { cn } from '@/lib/cn';

interface TransactionAmountProps {
  amount: number;
  currency: string;
  type: Transaction['type'];
  className?: string;
}

export function TransactionAmount({ amount, currency, type, className }: TransactionAmountProps) {
  const { fmtCurrency } = useFormatters();
  const isIncome = type === 'INCOME';

  return (
    <div
      className={cn(
        'shrink-0 text-sm font-medium tabular-nums',
        isIncome ? 'text-income' : 'text-foreground',
        className,
      )}
    >
      {isIncome ? '+' : '-'}
      {fmtCurrency(amount, currency)}
    </div>
  );
}
