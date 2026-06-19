import { CategoriesCardSkeleton } from '@/components/dashboard/CategoriesCard';
import { RecentTransactionsCardSkeleton } from '@/components/dashboard/RecentTransactionsCard';
import { SummaryCardSkeleton } from '@/components/dashboard/SummaryCard';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContainer } from '@/components/ui/page-container';
import { Skeleton } from '@/components/ui/skeleton';

export function DashboardSkeleton() {
  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        isSubtitleEssential
        subtitle={<Skeleton className="h-6 w-32" />}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <SummaryCardSkeleton wide />
        <SummaryCardSkeleton />
        <SummaryCardSkeleton />
      </div>

      <CategoriesCardSkeleton />
      <RecentTransactionsCardSkeleton />
    </PageContainer>
  );
}
