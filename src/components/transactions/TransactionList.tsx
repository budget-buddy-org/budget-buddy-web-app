import type { Transaction } from '@budget-buddy-org/budget-buddy-contracts';
import { useMemo } from 'react';
import { TransactionRow } from '@/components/transactions/TransactionRow';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate } from '@/lib/formatters';

interface TransactionListProps {
  transactions: Transaction[];
  categories: { id: string; name: string }[];
  isLoading: boolean;
  isFiltering?: boolean;
  onResetFilters?: () => void;
  onEdit?: (id: string) => void;
}

export function TransactionList({
  transactions,
  categories,
  isLoading,
  isFiltering = false,
  onResetFilters,
  onEdit,
}: TransactionListProps) {
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
              <Skeleton className="h-7 w-full rounded-none" />
              <div className="divide-y">
                {[1, 2].map((j) => (
                  <div key={j} className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                ))}
              </div>
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
              <span>{formatDate(group.date)}</span>
              <span>
                {group.currency
                  ? `${group.balance > 0 ? '+' : ''}${formatCurrency(group.balance, group.currency)}`
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
    </div>
  );
}
