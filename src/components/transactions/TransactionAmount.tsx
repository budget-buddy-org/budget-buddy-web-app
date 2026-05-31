import type { Transaction } from '@budget-buddy-org/budget-buddy-contracts';
import { useFormatters } from '@/hooks/useFormatters';
import { cn } from '@/lib/cn';
import { useUserPreferencesStore } from '@/stores/user-preferences.store';

interface TransactionAmountProps {
  amount: number;
  currency: string;
  type: Transaction['type'];
  className?: string;
}

export function TransactionAmount({
  amount,
  currency,
  type,
  className,
}: Readonly<TransactionAmountProps>) {
  const { fmtCurrency } = useFormatters();
  const isBalanceHidden = useUserPreferencesStore((s) => s.isBalanceHidden);
  const isIncome = type === 'INCOME';

  return (
    <div
      className={cn(
        'shrink-0 text-sm font-medium tabular-nums',
        isIncome ? 'text-income' : 'text-foreground',
        className,
        isBalanceHidden && 'privacy-blur',
      )}
    >
      {isIncome ? '+' : '-'}
      {fmtCurrency(amount, currency)}
    </div>
  );
}
