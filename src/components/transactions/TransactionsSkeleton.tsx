import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { PageContainer } from '@/components/ui/page-container';
import { Skeleton } from '@/components/ui/skeleton';

export function TransactionsSkeleton() {
  return (
    <PageContainer>
      <PageHeader
        title="Transactions"
        subtitle="View and manage your income and expenses"
        primaryAction={{
          label: 'Add',
          onClick: () => {},
        }}
      />

      {/* Search bar placeholder */}
      <div className="mb-6 flex gap-2">
        <Skeleton className="h-10 flex-1 rounded-pill" />
        <Skeleton className="h-10 w-10 rounded-pill" />
      </div>

      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            {/* Group header (e.g., date) */}
            <Skeleton className="h-4 w-24 ml-1" />
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {[1, 2].map((j) => (
                    <div key={j} className="flex items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <Skeleton className="h-6 w-24 rounded-pill" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
