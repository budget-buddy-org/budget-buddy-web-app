import type { Transaction } from '@budget-buddy-org/budget-buddy-contracts';
import { Clock } from 'lucide-react';
import { memo } from 'react';
import { TransactionAmount } from '@/components/transactions/TransactionAmount';
import { ListItem } from '@/components/ui/list-item';

interface TransactionRowProps {
  transaction: Transaction;
  categoryName?: string;
  onEdit?: (id: string) => void;
}

function isFutureDated(date: string): boolean {
  return date > new Date().toISOString().slice(0, 10);
}

export const TransactionRow = memo(function TransactionRow({
  transaction: t,
  categoryName,
  onEdit,
}: TransactionRowProps) {
  const future = isFutureDated(t.date);

  return (
    <ListItem
      onClick={() => onEdit?.(t.id)}
      ariaLabel={`Edit transaction: ${t.description ?? 'unnamed'}`}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{t.description ?? '—'}</p>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          {future && <Clock className="size-3 shrink-0" aria-label="Future-dated transaction" />}
          {categoryName || 'No Category'}
        </p>
      </div>
      <TransactionAmount amount={t.amount} currency={t.currency} type={t.type} />
    </ListItem>
  );
});
