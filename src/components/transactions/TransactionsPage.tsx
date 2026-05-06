import type { Transaction } from '@budget-buddy-org/budget-buddy-contracts';
import { useMemo } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { TransactionFilters } from '@/components/transactions/TransactionFilters';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { TransactionList } from '@/components/transactions/TransactionList';
import { TransactionSearchBar } from '@/components/transactions/TransactionSearchBar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { InfiniteScrollSentinel } from '@/components/ui/infinite-scroll-sentinel';
import { PageContainer } from '@/components/ui/page-container';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategories } from '@/hooks/useCategories';
import { useLatchedValue } from '@/hooks/useLatchedValue';
import { useTransactionPageState } from '@/hooks/useTransactionPageState';
import {
  TRANSACTIONS_PAGE_SIZE,
  useInfiniteTransactions,
  useTransaction,
} from '@/hooks/useTransactions';

export function TransactionsPage() {
  const { data: categoriesData } = useCategories();
  const categories = categoriesData?.items ?? [];

  const {
    showForm,
    setShowForm,
    showFilters,
    setShowFilters,
    editingId,
    setEditingId,
    filters,
    isFiltered,
    hasActiveFilters,
    closeForm,
    resetFilters,
    handleFilterChange,
    handleQueryChange,
  } = useTransactionPageState();

  const isEditing = !!editingId;
  const isDialogOpen = showForm || isEditing;

  const { data: editingTransaction, isLoading: isTransactionLoading } = useTransaction(
    editingId ?? '',
  );

  // Latch the dialog body while the dialog is open to prevent shrinking during animation.
  type DialogRender = { mode: 'add' | 'edit'; transaction: Transaction | undefined };
  const currentRender: DialogRender = useMemo(
    () => ({
      mode: isEditing ? 'edit' : 'add',
      transaction: isEditing ? editingTransaction : undefined,
    }),
    [isEditing, editingTransaction],
  );
  const render = useLatchedValue(currentRender, isDialogOpen);

  const dialogTitle = render.mode === 'edit' ? 'Edit Transaction' : 'Add Transaction';
  const dialogDesc =
    render.mode === 'edit'
      ? 'Update your transaction details including amount, date, and category'
      : 'Record a new expense or income to track your budget';
  const showSkeleton = isDialogOpen && isEditing && isTransactionLoading && !editingTransaction;

  const queryFilters = {
    ...filters,
    size: TRANSACTIONS_PAGE_SIZE,
    categoryId: filters.categoryId || undefined,
    start: filters.start || undefined,
    end: filters.end || undefined,
    type: filters.type || undefined,
    query: filters.query || undefined,
    amountMin: filters.amountMin,
    amountMax: filters.amountMax,
  };

  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useInfiniteTransactions(queryFilters);
  const transactions = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <PageContainer>
      <PageHeader
        title="Transactions"
        subtitle="View and manage your income and expenses"
        primaryAction={{
          label: 'Add',
          onClick: () => setShowForm((v) => !v),
        }}
      />

      <TransactionSearchBar
        value={filters.query}
        onQueryChange={handleQueryChange}
        onOpenFilters={() => setShowFilters(true)}
        isFiltered={hasActiveFilters}
      />

      <Dialog open={showFilters} onOpenChange={setShowFilters}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filter Transactions</DialogTitle>
            <DialogDescription>Apply filters to your transaction history</DialogDescription>
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

      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && closeForm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDesc}</DialogDescription>
          </DialogHeader>
          {showSkeleton ? (
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
          ) : (
            <TransactionForm
              key={render.mode === 'edit' ? (render.transaction?.id ?? 'edit') : 'add'}
              categories={categories}
              transaction={render.transaction}
              onSuccess={closeForm}
              onCancel={closeForm}
              onDeleteSuccess={closeForm}
            />
          )}
        </DialogContent>
      </Dialog>

      <TransactionList
        transactions={transactions}
        categories={categories}
        isLoading={isLoading}
        isFiltering={isFiltered}
        isFetchingMore={isFetchingNextPage}
        onResetFilters={resetFilters}
        onEdit={setEditingId}
      />

      {!isLoading && transactions.length > 0 && (
        <InfiniteScrollSentinel
          hasNextPage={!!hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={() => {
            void fetchNextPage();
          }}
        />
      )}
    </PageContainer>
  );
}
