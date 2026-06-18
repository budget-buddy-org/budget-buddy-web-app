import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';
import { PageContainer } from '@/components/ui/page-container';
import { Skeleton } from '@/components/ui/skeleton';

export function SettingsSkeleton() {
  return (
    <PageContainer>
      <PageHeader title="Settings" subtitle="Manage your application appearance and preferences." />

      <div className="mx-auto grid max-w-2xl gap-6 lg:max-w-none lg:grid-cols-2 lg:items-start">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <section key={i} className="space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="size-4 rounded-pill" />
              <Skeleton className="h-5 w-32" />
            </div>
            <Card className="p-4 space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-64" />
                <Skeleton className="h-field w-full rounded-md" />
              </div>
              {i % 2 === 0 && (
                <div className="pt-4 border-t space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-field w-full rounded-md" />
                </div>
              )}
            </Card>
          </section>
        ))}
      </div>
    </PageContainer>
  );
}
