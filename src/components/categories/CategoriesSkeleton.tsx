import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { ListSkeleton } from '@/components/ui/list-skeleton';
import { PageContainer } from '@/components/ui/page-container';

export function CategoriesSkeleton() {
  return (
    <PageContainer>
      <PageHeader
        title="Categories"
        subtitle="Manage categories to organize your transactions"
        primaryAction={{
          label: 'Add',
          onClick: () => {},
        }}
      />

      <Card>
        <CardContent className="p-0">
          <ListSkeleton count={6} />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
