import type {
  FieldError,
  Transaction,
  TransactionWrite,
} from '@budget-buddy-org/budget-buddy-contracts';
import { Check, Plus, RotateCcw, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { AmountInput } from '@/components/ui/amount-input';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { ToastAction } from '@/components/ui/toast';
import { TransactionTypeToggle } from '@/components/ui/transaction-type-toggle';
import { useToast } from '@/hooks/use-toast';
import { useCreateCategory } from '@/hooks/useCategories';
import {
  useCreateTransaction,
  useDeleteTransaction,
  useUpdateTransaction,
} from '@/hooks/useTransactions';
import { getApiError } from '@/lib/api-error';
import { todayIso, toMinorUnits } from '@/lib/formatters';

const CURRENCIES = ['EUR', 'GBP', 'USD'];

interface TransactionFormProps {
  categories: { id: string; name: string }[];
  onSuccess: () => void;
  onCancel: () => void;
  onDeleteSuccess?: () => void;
  transaction?: Transaction;
}

export function TransactionForm({
  categories,
  onSuccess,
  onCancel,
  onDeleteSuccess,
  transaction,
}: TransactionFormProps) {
  const { toast } = useToast();
  const createTx = useCreateTransaction();
  const updateTx = useUpdateTransaction(transaction?.id ?? '');
  const deleteTx = useDeleteTransaction();
  const createCategory = useCreateCategory();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [form, setForm] = useState({
    description: transaction?.description ?? '',
    amount: transaction ? (transaction.amount / 100).toFixed(2) : '',
    type: (transaction?.type as 'EXPENSE' | 'INCOME') ?? ('EXPENSE' as const),
    currency: transaction?.currency ?? 'EUR',
    date: transaction?.date ?? todayIso(),
    categoryId: transaction?.categoryId ?? '',
  });

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const isEditing = !!transaction;
  const currentMutation = isEditing ? updateTx : createTx;

  const hasChanges =
    form.description !== (transaction?.description ?? '') ||
    form.amount !== (transaction ? (transaction.amount / 100).toFixed(2) : '') ||
    form.type !== ((transaction?.type as 'EXPENSE' | 'INCOME') ?? 'EXPENSE') ||
    form.currency !== (transaction?.currency ?? 'EUR') ||
    form.date !== (transaction?.date ?? todayIso()) ||
    form.categoryId !== (transaction?.categoryId ?? '') ||
    (isAddingCategory && !!newCategoryName);

  const fieldErrors = getApiError(currentMutation.error)?.errors as FieldError[] | undefined;
  const createCategoryError = getApiError(createCategory.error);
  const getFieldError = (field: string) => fieldErrors?.find((e) => e.field === field)?.message;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let categoryId = form.categoryId;

    if (isAddingCategory && newCategoryName) {
      try {
        const newCat = await createCategory.mutateAsync({ name: newCategoryName });
        categoryId = newCat.id;
        // Commit the new category to the form so that if the transaction
        // mutation below fails, retrying won't re-run createCategory (which
        // would either duplicate or error with "already exists").
        setForm((f) => ({ ...f, categoryId: newCat.id }));
        setIsAddingCategory(false);
        setNewCategoryName('');
      } catch (error) {
        const apiError = getApiError(error);
        toast({
          title: "Couldn't create category",
          description: apiError?.detail || apiError?.title,
          variant: 'destructive',
        });
        return;
      }
    }

    // Build a plain payload so we can send null for description when the user
    // clears the field. The external TransactionWrite type doesn't accept null,
    // so cast at the mutation call site to avoid type errors while keeping the
    // runtime behaviour that the API expects.
    const payload: Record<string, unknown> = {
      description: form.description === '' ? null : form.description,
      amount: toMinorUnits(Number(form.amount)),
      type: form.type,
      currency: form.currency,
      date: form.date,
      categoryId,
    };

    currentMutation.mutate(payload as unknown as TransactionWrite, {
      onSuccess: () => {
        toast({
          title: isEditing ? 'Transaction updated' : 'Transaction created',
          variant: 'success',
        });
        onSuccess();
      },
      onError: (error) => {
        const apiError = getApiError(error);
        if (!apiError?.errors) {
          toast({
            title: isEditing ? "Couldn't update transaction" : "Couldn't create transaction",
            description: apiError?.detail || apiError?.title,
            variant: 'destructive',
          });
        }
      },
    });
  };

  const handleDelete = () => {
    if (!transaction?.id) return;
    const snapshot: TransactionWrite = {
      description: transaction.description ?? null,
      amount: transaction.amount,
      type: transaction.type,
      currency: transaction.currency,
      date: transaction.date,
      categoryId: transaction.categoryId,
    } as unknown as TransactionWrite;
    deleteTx.mutate(transaction.id, {
      onSuccess: () => {
        const { dismiss } = toast({
          title: 'Transaction deleted',
          variant: 'success',
          duration: 6000,
          action: (
            <ToastAction
              altText="Undo delete"
              onClick={() => {
                createTx.mutate(snapshot, {
                  onSuccess: () => {
                    toast({ title: 'Transaction restored', variant: 'success' });
                  },
                  onError: () => {
                    toast({ title: "Couldn't restore transaction", variant: 'destructive' });
                  },
                });
                dismiss();
              }}
            >
              Undo
            </ToastAction>
          ),
        });
        if (onDeleteSuccess) {
          onDeleteSuccess();
        } else {
          onSuccess();
        }
      },
      onError: () => {
        toast({
          title: "Couldn't delete transaction",
          variant: 'destructive',
        });
      },
    });
  };

  const isFormValid =
    !!form.type &&
    !!form.currency &&
    !!form.date &&
    !!form.amount &&
    Number.parseFloat(form.amount) !== 0 &&
    (isAddingCategory ? !!newCategoryName : !!form.categoryId);

  const isFormDisabled = !isFormValid || (isEditing && !hasChanges);
  const isPending = currentMutation.isPending || createCategory.isPending || deleteTx.isPending;

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-1">
            <div className="text-xs font-medium text-muted-foreground">
              Type <span className="text-destructive">*</span>
            </div>
            <TransactionTypeToggle
              value={form.type}
              onChange={(val) => setForm((f) => ({ ...f, type: val }))}
              error={!!getFieldError('type')}
            />
            {getFieldError('type') && (
              <p className="text-xs font-medium text-destructive">{getFieldError('type')}</p>
            )}
          </div>

          <div className="flex gap-4 sm:col-span-2">
            <div className="flex-1 space-y-1">
              <label htmlFor="tx-currency" className="text-xs font-medium text-muted-foreground">
                Currency <span className="text-destructive">*</span>
              </label>
              <Select
                id="tx-currency"
                value={form.currency}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                error={!!getFieldError('currency')}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
              {getFieldError('currency') && (
                <p className="text-xs font-medium text-destructive">{getFieldError('currency')}</p>
              )}
            </div>

            <div className="flex-1 space-y-1">
              <label htmlFor="tx-amount" className="text-xs font-medium text-muted-foreground">
                Amount <span className="text-destructive">*</span>
              </label>
              <AmountInput
                id="tx-amount"
                placeholder="0.00"
                value={form.amount}
                onChange={(val) => setForm((f) => ({ ...f, amount: val }))}
                required
                error={!!getFieldError('amount')}
                autoFocus={!isEditing}
              />
              {getFieldError('amount') && (
                <p className="text-xs font-medium text-destructive">{getFieldError('amount')}</p>
              )}
            </div>
          </div>

          <div className="sm:col-span-2 space-y-1">
            <label htmlFor="tx-description" className="text-xs font-medium text-muted-foreground">
              Description
            </label>
            <Input
              id="tx-description"
              placeholder="Coffee, salary…"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              error={!!getFieldError('description')}
            />
            {getFieldError('description') && (
              <p className="text-xs font-medium text-destructive">{getFieldError('description')}</p>
            )}
          </div>

          <div className="sm:col-span-2 space-y-1">
            <label htmlFor="tx-date" className="text-xs font-medium text-muted-foreground">
              Date <span className="text-destructive">*</span>
            </label>
            <DatePicker
              id="tx-date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              required
              error={!!getFieldError('date')}
            />
            {getFieldError('date') && (
              <p className="text-xs font-medium text-destructive">{getFieldError('date')}</p>
            )}
          </div>

          <div className="sm:col-span-2 space-y-1">
            <div className="flex items-center justify-between">
              <label
                htmlFor={isAddingCategory ? 'tx-new-category' : 'tx-category'}
                className="text-xs font-medium text-muted-foreground"
              >
                Category <span className="text-destructive">*</span>
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs font-medium"
                onClick={() => {
                  setIsAddingCategory((v) => !v);
                  setNewCategoryName('');
                  createCategory.reset();
                }}
                disabled={isPending}
              >
                {isAddingCategory ? (
                  <>
                    <RotateCcw className="size-4 mr-1" />
                    Choose existing
                  </>
                ) : (
                  <>
                    <Plus className="size-4 mr-1" />
                    Add new
                  </>
                )}
              </Button>
            </div>

            {isAddingCategory ? (
              <div className="space-y-1">
                <Input
                  id="tx-new-category"
                  placeholder="New category name…"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  disabled={isPending}
                  autoComplete="off"
                  error={!!createCategory.error}
                  autoFocus
                />
                {(createCategoryError?.detail || createCategoryError?.title) && (
                  <p className="text-xs font-medium text-destructive">
                    {createCategoryError.detail || createCategoryError.title}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                <Select
                  id="tx-category"
                  value={form.categoryId}
                  onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                  disabled={isPending}
                  error={!!getFieldError('categoryId')}
                >
                  <option value="">No category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
                {getFieldError('categoryId') && (
                  <p className="text-xs font-medium text-destructive">
                    {getFieldError('categoryId')}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          {isEditing && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Delete transaction"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isPending}
            >
              <Trash2 className="size-4" />
            </Button>
          )}
          <div className="flex flex-1 gap-2">
            <Button type="submit" className="flex-1" loading={isPending} disabled={isFormDisabled}>
              <Check className="size-4 mr-2" />
              Save
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onCancel}
              disabled={isPending}
            >
              <X className="size-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </form>

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
    </>
  );
}
