import type { Transaction } from '@budget-buddy-org/budget-buddy-contracts';
import { useNavigate } from '@tanstack/react-router';
import { PlusCircle } from 'lucide-react';
import { TransactionAmount } from '@/components/transactions/TransactionAmount';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ListItem } from '@/components/ui/list-item';
import { Skeleton } from '@/components/ui/skeleton';
import { useFormatters } from '@/hooks/useFormatters';

export function RecentTransactionsCard({
  transactions,
  isLoading,
  hasFetched,
  firstDayOfPeriod,
  lastDayOfPeriod,
}: {
  transactions: Transaction[];
  isLoading: boolean;
  hasFetched: boolean;
  firstDayOfPeriod: string;
  lastDayOfPeriod: string;
}) {
  const navigate = useNavigate();
  const { fmtDate } = useFormatters();

  if (isLoading && !hasFetched) return <RecentTransactionsCardSkeleton />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold" as="h2">
          Recent transactions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {transactions.length === 0 ? (
          <EmptyState
            icon={<PlusCircle className="size-4 text-muted-foreground" />}
            title="No transactions yet"
            description="Start tracking your budget by adding your first transaction."
            action={{
              label: 'Add transaction',
              onClick: () => navigate({ to: '/transactions' }),
            }}
          />
        ) : (
          <ul className="divide-y">
            {transactions.map((t) => (
              <ListItem
                key={t.id}
                onClick={() =>
                  navigate({
                    to: '/transactions',
                    search: { start: firstDayOfPeriod, end: lastDayOfPeriod },
                  })
                }
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.description ?? '—'}</p>
                  <p className="text-xs text-muted-foreground">{fmtDate(t.date)}</p>
                </div>
                <TransactionAmount amount={t.amount} currency={t.currency} type={t.type} />
              </ListItem>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function RecentTransactionsCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {['tx-1', 'tx-2', 'tx-3', 'tx-4', 'tx-5'].map((key) => (
            <div key={key} className="flex items-center justify-between px-6 py-3">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-6 w-24 rounded-pill" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
