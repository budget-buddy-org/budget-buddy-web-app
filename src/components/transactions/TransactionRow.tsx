import type { Transaction } from '@budget-buddy-org/budget-buddy-contracts';
import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { useFormatters } from '@/hooks/useFormatters';

interface TransactionRowProps {
  transaction: Transaction;
  categoryName?: string;
  onEdit?: (id: string) => void;
}

export const TransactionRow = memo(function TransactionRow({
  transaction: t,
  categoryName,
  onEdit,
}: TransactionRowProps) {
  const { fmtCurrency } = useFormatters();
  return (
    <li className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30 cursor-pointer">
      <button
        type="button"
        aria-label={`Edit transaction: ${t.description ?? 'unnamed'}`}
        className="min-w-0 flex-1 cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        onClick={() => onEdit?.(t.id)}
      >
        <p className="truncate text-sm font-medium">{t.description ?? '—'}</p>
        <p className="text-xs text-muted-foreground">{categoryName || 'No Category'}</p>
      </button>
      <Badge variant={t.type === 'INCOME' ? 'income' : 'expense'}>
        {t.type === 'INCOME' ? '+' : '-'}
        {fmtCurrency(t.amount, t.currency)}
      </Badge>
    </li>
  );
});
