import type { Transaction } from '@budget-buddy-org/budget-buddy-contracts';
import { useMemo } from 'react';
import { TransactionRow } from '@/components/transactions/TransactionRow';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ListSkeleton } from '@/components/ui/list-skeleton';
import { useFormatters } from '@/hooks/useFormatters';

interface TransactionListProps {
  transactions: Transaction[];
  categories: { id: string; name: string }[];
  isLoading: boolean;
  isFiltering?: boolean;
  isFetchingMore?: boolean;
  onResetFilters?: () => void;
  onEdit?: (id: string) => void;
}

export function TransactionList({
  transactions,
  categories,
  isLoading,
  isFiltering = false,
  isFetchingMore = false,
  onResetFilters,
  onEdit,
}: TransactionListProps) {
  const { fmtCurrency, fmtDate } = useFormatters();
  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories],
  );

  const groupedTransactions = useMemo(() => {
    const groups: { date: string; items: Transaction[]; balance: number; currency: string }[] = [];
    let currentGroup: {
      date: string;
      items: Transaction[];
      balance: number;
      currency: string;
    } | null = null;

    for (const t of transactions) {
      if (!currentGroup || currentGroup.date !== t.date) {
        currentGroup = { date: t.date, items: [], balance: 0, currency: t.currency };
        groups.push(currentGroup);
      }
      currentGroup.items.push(t);
      if (t.currency !== currentGroup.currency) {
        currentGroup.currency = '';
      } else {
        currentGroup.balance += t.type === 'INCOME' ? t.amount : -t.amount;
      }
    }
    return groups;
  }, [transactions]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-0">
              <div className="bg-muted px-4 py-1.5">
                <div className="h-3 w-24 animate-pulse rounded bg-muted-foreground/20" />
              </div>
              <ListSkeleton count={2} />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="flex flex-col items-center justify-center gap-2 px-6 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              {isFiltering ? 'No transactions match your filters.' : 'No transactions yet.'}
            </p>
            {isFiltering && onResetFilters && (
              <Button variant="link" onClick={onResetFilters} className="h-auto p-0 text-primary">
                Reset filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {groupedTransactions.map((group) => (
        <Card key={group.date}>
          <CardContent className="p-0">
            <h2 className="bg-muted px-4 py-1.5 text-xs font-semibold text-muted-foreground sticky top-0 z-10 flex items-center justify-between">
              <span>{fmtDate(group.date)}</span>
              <span>
                {group.currency
                  ? `${group.balance > 0 ? '+' : ''}${fmtCurrency(group.balance, group.currency)}`
                  : 'N/A'}
              </span>
            </h2>
            <ul className="divide-y">
              {group.items.map((t) => (
                <TransactionRow
                  key={t.id}
                  transaction={t}
                  categoryName={t.categoryId ? categoryMap[t.categoryId] : undefined}
                  onEdit={onEdit}
                />
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
      {isFetchingMore && (
        <Card aria-hidden="true">
          <CardContent className="p-0">
            <ListSkeleton count={2} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
