import type { Transaction, TransactionWrite } from '@budget-buddy-org/budget-buddy-contracts';
import { Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { PageHeader } from '@/components/layout/PageHeader';
import { TransactionFilters } from '@/components/transactions/TransactionFilters';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { TransactionList } from '@/components/transactions/TransactionList';
import { TransactionSearchBar } from '@/components/transactions/TransactionSearchBar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { InfiniteScrollSentinel } from '@/components/ui/infinite-scroll-sentinel';
import { PageContainer } from '@/components/ui/page-container';
import { Skeleton } from '@/components/ui/skeleton';
import { ToastAction } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import { useCategories } from '@/hooks/useCategories';
import { useLatchedValue } from '@/hooks/useLatchedValue';
import { useTransactionPageState } from '@/hooks/useTransactionPageState';
import {
  TRANSACTIONS_PAGE_SIZE,
  useCreateTransaction,
  useDeleteTransaction,
  useInfiniteTransactions,
  useTransaction,
} from '@/hooks/useTransactions';

export function TransactionsPage() {
  const { toast } = useToast();
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
  const showSkeleton = isDialogOpen && isEditing && isTransactionLoading && !editingTransaction;

  const createTx = useCreateTransaction();
  const deleteTx = useDeleteTransaction();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const restoreTransaction = (snapshot: TransactionWrite) => {
    createTx.mutate(snapshot, {
      onSuccess: () => toast({ title: 'Transaction restored', variant: 'success' }),
      onError: () => toast({ title: "Couldn't restore transaction", variant: 'destructive' }),
    });
  };

  const handleDelete = () => {
    const tx = render.transaction;
    if (!tx?.id) return;
    const snapshot: TransactionWrite = {
      description: tx.description ?? null,
      amount: tx.amount,
      type: tx.type,
      currency: tx.currency,
      date: tx.date,
      categoryId: tx.categoryId,
    };
    deleteTx.mutate(tx.id, {
      onSuccess: () => {
        const { dismiss } = toast({
          title: 'Transaction deleted',
          variant: 'success',
          duration: 6000,
          action: (
            <ToastAction
              altText="Undo delete"
              onClick={() => {
                restoreTransaction(snapshot);
                dismiss();
              }}
            >
              Undo
            </ToastAction>
          ),
        });
        setShowDeleteConfirm(false);
        closeForm();
      },
      onError: () => {
        toast({ title: "Couldn't delete transaction", variant: 'destructive' });
      },
    });
  };

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
        <DialogContent aria-describedby={undefined}>
          <div className="flex items-center justify-between">
            <DialogTitle>{dialogTitle}</DialogTitle>
            <div className="flex items-center gap-1">
              {render.mode === 'edit' && render.transaction && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  aria-label="Delete transaction"
                >
                  <Trash2 className="size-5" />
                </Button>
              )}
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground"
                  aria-label="Close"
                >
                  <X className="size-5" />
                </Button>
              </DialogClose>
            </div>
          </div>
          {showSkeleton ? (
            <div className="space-y-4">
              {/* Hero: type toggle → amount → currency pill */}
              <div className="flex flex-col items-center gap-3">
                <Skeleton className="h-9 w-full max-w-xs rounded-pill" />
                <Skeleton className="h-12 w-48" />
                <Skeleton className="h-7 w-16 rounded-pill" />
              </div>
              {/* Category */}
              <Skeleton className="h-field w-full" />
              {/* Date */}
              <Skeleton className="h-9 w-full rounded-pill" />
              {/* Description */}
              <Skeleton className="h-20 w-full rounded-md" />
              {/* Save */}
              <div className="-mx-6 -mb-6 mt-6 px-6 pt-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:static sm:mx-0 sm:mb-0 sm:px-0 sm:pb-0 sm:border-t">
                <Skeleton className="h-field w-full rounded-pill" />
              </div>
            </div>
          ) : (
            <TransactionForm
              key={render.mode === 'edit' ? (render.transaction?.id ?? 'edit') : 'add'}
              categories={categories}
              transaction={render.transaction}
              onSuccess={closeForm}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDelete}
        title="Delete Transaction"
        description="Are you sure you want to delete this transaction? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        isLoading={deleteTx.isPending}
      />

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
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={() => {
            void fetchNextPage();
          }}
          total={transactions.length}
        />
      )}
    </PageContainer>
  );
}
