import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function CategoriesSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        subtitle="Manage categories to organize your transactions"
        primaryAction={{
          label: 'Add',
          onClick: () => {},
        }}
      />

      <div className="relative">
        <Skeleton className="h-10 w-full rounded-md" />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-9 w-9 rounded-md" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
