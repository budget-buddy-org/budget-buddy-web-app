import { useNavigate } from '@tanstack/react-router';
import { Filter } from 'lucide-react';
import { useState } from 'react';
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
import { useTransactionPageState } from '@/hooks/useTransactionPageState';
import { useTransaction, useTransactions } from '@/hooks/useTransactions';

const PAGE_SIZE = 20;

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
    handlePageChange,
  } = useTransactionPageState();

  const [dialogTitle, setDialogTitle] = useState('Add Transaction');
  const [dialogDesc, setDialogDesc] = useState(
    'Record a new expense or income to track your budget',
  );
  const isDialogOpen = showForm || !!editingId;

  const { data: editingTransaction, isLoading: isTransactionLoading } = useTransaction(
    editingId ?? '',
  );

  const queryFilters = {
    ...filters,
    page,
    size: PAGE_SIZE,
    categoryId: filters.categoryId || undefined,
    start: filters.start || undefined,
    end: filters.end || undefined,
    type: filters.type || undefined,
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
          onClick: () => {
            setDialogTitle('Add Transaction');
            setDialogDesc('Record a new expense or income to track your budget');
            setShowForm((v) => !v);
          },
        }}
      >
        <Button
          variant={showFilters ? 'secondary' : 'outline'}
          onClick={() => setShowFilters((v) => !v)}
          aria-label="Toggle filters"
        >
          <Filter className="size-4" />
          {hasActiveFilters && <span className="ml-1 h-1.5 w-1.5 rounded-full bg-primary" />}
        </Button>
      </PageHeader>

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
        onEdit={(id) => {
          setDialogTitle('Edit Transaction');
          setDialogDesc('Update your transaction details including amount, date, and category');
          setEditingId(id);
        }}
      />

      {!isLoading && transactions.length > 0 && (
        <Pagination page={page} total={total} size={PAGE_SIZE} onPageChange={handlePageChange} />
      )}
    </div>
  );
}
