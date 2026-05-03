import type { Transaction } from '@budget-buddy-org/budget-buddy-contracts';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
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
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategories } from '@/hooks/useCategories';
import { useTransactionPageState } from '@/hooks/useTransactionPageState';
import { TRANSACTIONS_PAGE_SIZE, useTransaction, useTransactions } from '@/hooks/useTransactions';

export function TransactionsPage() {
  const navigate = useNavigate();
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
    page,
    isFiltered,
    hasActiveFilters,
    closeForm,
    resetFilters,
    handleFilterChange,
    handleQueryChange,
    handlePageChange,
  } = useTransactionPageState();

  const isEditing = !!editingId;
  const isDialogOpen = showForm || isEditing;

  const { data: editingTransaction, isLoading: isTransactionLoading } = useTransaction(
    editingId ?? '',
  );

  // Latch the dialog body while the dialog is open. Without this the form
  // unmounts the moment closeForm() runs, making the dialog visibly shrink
  // to just the header during the bottom-sheet slide-out on mobile.
  // React's "store info from previous renders" pattern:
  // https://react.dev/reference/react/useState#storing-information-from-previous-renders
  type DialogRender = { mode: 'add' | 'edit'; transaction: Transaction | undefined };
  const [render, setRender] = useState<DialogRender>({ mode: 'add', transaction: undefined });
  if (isDialogOpen) {
    const next: DialogRender = {
      mode: isEditing ? 'edit' : 'add',
      transaction: isEditing ? editingTransaction : undefined,
    };
    if (next.mode !== render.mode || next.transaction !== render.transaction) {
      setRender(next);
    }
  }

  const dialogTitle = render.mode === 'edit' ? 'Edit Transaction' : 'Add Transaction';
  const dialogDesc =
    render.mode === 'edit'
      ? 'Update your transaction details including amount, date, and category'
      : 'Record a new expense or income to track your budget';
  const showSkeleton = isDialogOpen && isEditing && isTransactionLoading && !editingTransaction;

  const queryFilters = {
    ...filters,
    page,
    size: TRANSACTIONS_PAGE_SIZE,
    categoryId: filters.categoryId || undefined,
    start: filters.start || undefined,
    end: filters.end || undefined,
    type: filters.type || undefined,
    query: filters.query || undefined,
    amountMin: filters.amountMin,
    amountMax: filters.amountMax,
  };

  const { data, isLoading } = useTransactions(queryFilters);
  const transactions = data?.items ?? [];
  const total = data?.meta?.total ?? 0;

  return (
    <div className="space-y-6">
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
              onDeleteSuccess={() => {
                closeForm();
                navigate({ to: '/transactions' });
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <TransactionList
        transactions={transactions}
        categories={categories}
        isLoading={isLoading}
        isFiltering={isFiltered}
        onResetFilters={resetFilters}
        onEdit={setEditingId}
      />

      {!isLoading && transactions.length > 0 && (
        <Pagination
          page={page}
          total={total}
          size={TRANSACTIONS_PAGE_SIZE}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
