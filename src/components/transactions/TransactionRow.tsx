import type { Transaction } from '@budget-buddy-org/budget-buddy-contracts';
import { memo } from 'react';
import { TransactionAmount } from '@/components/transactions/TransactionAmount';
import { ListItem } from '@/components/ui/list-item';

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
  return (
    <ListItem
      onClick={() => onEdit?.(t.id)}
      ariaLabel={`Edit transaction: ${t.description ?? 'unnamed'}`}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{t.description ?? '—'}</p>
        <p className="text-xs text-muted-foreground">{categoryName || 'No Category'}</p>
      </div>
      <TransactionAmount amount={t.amount} currency={t.currency} type={t.type} />
    </ListItem>
  );
});
