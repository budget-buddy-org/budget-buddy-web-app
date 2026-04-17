import { useNavigate } from '@tanstack/react-router';
import { Filter } from 'lucide-react';
import { useCallback, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { TransactionFilters } from '@/components/transactions/TransactionFilters';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { TransactionList } from '@/components/transactions/TransactionList';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategories } from '@/hooks/useCategories';
import { useTransaction, useTransactions } from '@/hooks/useTransactions';

const PAGE_SIZE = 20;

interface Filters {
  categoryId: string;
  start: string;
  end: string;
  sort: 'asc' | 'desc';
}

export function TransactionsPage() {
  const navigate = useNavigate();
  const { data: categoriesData } = useCategories();
  const categories = categoriesData?.items ?? [];

  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { data: editingTransaction, isLoading: isTransactionLoading } = useTransaction(
    editingId ?? '',
  );

  const closeForm = useCallback(() => {
    setShowForm(false);
    setEditingId(null);
  }, []);

  const [filters, setFilters] = useState<Filters>({
    categoryId: '',
    start: '',
    end: '',
    sort: 'desc',
  });

  const [page, setPage] = useState(0);
  const size = PAGE_SIZE;

  const queryFilters = {
    ...filters,
    page,
    size,
    categoryId: filters.categoryId || undefined,
    start: filters.start || undefined,
    end: filters.end || undefined,
  };

  const { data, isLoading } = useTransactions(queryFilters);
  const transactions = data?.items ?? [];
  const total = data?.meta?.total ?? 0;

  const isFiltered = !!(filters.categoryId || filters.start || filters.end);

  const hasActiveFilters = isFiltered || filters.sort !== 'desc';

  const resetFilters = useCallback(() => {
    setFilters({
      categoryId: '',
      start: '',
      end: '',
      sort: 'desc',
    });
    setPage(0);
  }, []);

  const handleFilterChange = useCallback((newFilters: Filters) => {
    setFilters(newFilters);
    setPage(0);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        subtitle="View and manage your income and expenses."
        primaryAction={{
          label: 'Add',
          onClick: () => setShowForm((v) => !v),
        }}
      >
        <Button
          variant={showFilters ? 'secondary' : 'outline'}
          onClick={() => setShowFilters((v) => !v)}
          aria-label="Toggle filters"
        >
          <Filter className="h-4 w-4" />
          {hasActiveFilters && <span className="ml-1 h-1.5 w-1.5 rounded-full bg-primary" />}
        </Button>
      </PageHeader>

      <Dialog open={showFilters} onOpenChange={setShowFilters}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filter Transactions</DialogTitle>
            <DialogDescription>Apply filters to your transaction history.</DialogDescription>
          </DialogHeader>
          <TransactionFilters
            categories={categories}
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={resetFilters}
            onClose={() => setShowFilters(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showForm || !!editingId} onOpenChange={(open) => !open && closeForm()}>
        <DialogContent hideClose={!!editingId}>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
            <DialogDescription>
              {editingId
                ? 'Update your transaction details including amount, date, and category.'
                : 'Record a new expense or income to track your budget.'}
            </DialogDescription>
          </DialogHeader>
          {isTransactionLoading && editingId ? (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ) : showForm || (editingId && editingTransaction) ? (
            <TransactionForm
              categories={categories}
              transaction={editingId ? editingTransaction : undefined}
              onSuccess={closeForm}
              onCancel={closeForm}
              onDeleteSuccess={() => {
                closeForm();
                navigate({ to: '/transactions' });
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <TransactionList
        transactions={transactions}
        categories={categories}
        isLoading={isLoading}
        isFiltering={isFiltered}
        onResetFilters={resetFilters}
        onEdit={(id) => setEditingId(id)}
      />

      {!isLoading && transactions.length > 0 && (
        <Pagination page={page} total={total} size={size} onPageChange={handlePageChange} />
      )}
    </div>
  );
}
