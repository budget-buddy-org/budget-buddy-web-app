import type {
  FieldError,
  Transaction,
  TransactionWrite,
} from '@budget-buddy-org/budget-buddy-contracts';
import type React from 'react';
import { useState } from 'react';
import { CategoryCombobox } from '@/components/transactions/CategoryCombobox';
import { HeroAmountInput } from '@/components/transactions/HeroAmountInput';
import { Button } from '@/components/ui/button';
import { DateQuickPicker } from '@/components/ui/date-quick-picker';
import { useToast } from '@/hooks/use-toast';
import { useCreateTransaction, useUpdateTransaction } from '@/hooks/useTransactions';
import { getApiError } from '@/lib/api-error';
import { cn } from '@/lib/cn';
import { localeCurrency, todayIso, toMinorUnits } from '@/lib/formatters';
import { useUserPreferencesStore } from '@/stores/user-preferences.store';

interface TransactionFormProps {
  categories: { id: string; name: string }[];
  onSuccess: () => void;
  transaction?: Transaction;
}

export function TransactionForm({ categories, onSuccess, transaction }: TransactionFormProps) {
  const { toast } = useToast();
  const createTx = useCreateTransaction();
  const updateTx = useUpdateTransaction(transaction?.id ?? '');

  const preferredCurrency = useUserPreferencesStore((s) => s.currency ?? localeCurrency());
  const defaultCurrency = transaction?.currency ?? preferredCurrency;

  const [form, setForm] = useState({
    description: transaction?.description ?? '',
    amount: transaction ? (transaction.amount / 100).toFixed(2) : '',
    type: (transaction?.type as 'EXPENSE' | 'INCOME') ?? ('EXPENSE' as const),
    currency: defaultCurrency,
    date: transaction?.date ?? todayIso(),
    categoryId: transaction?.categoryId ?? '',
  });

  const isEditing = !!transaction;
  const currentMutation = isEditing ? updateTx : createTx;

  const hasChanges =
    form.description !== (transaction?.description ?? '') ||
    form.amount !== (transaction ? (transaction.amount / 100).toFixed(2) : '') ||
    form.type !== ((transaction?.type as 'EXPENSE' | 'INCOME') ?? 'EXPENSE') ||
    form.currency !== (transaction?.currency ?? defaultCurrency) ||
    form.date !== (transaction?.date ?? todayIso()) ||
    form.categoryId !== (transaction?.categoryId ?? '');

  const fieldErrors = getApiError(currentMutation.error)?.errors as FieldError[] | undefined;
  const getFieldError = (field: string) => fieldErrors?.find((e) => e.field === field)?.message;

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();

    // Send null for description when cleared. The external TransactionWrite
    // type doesn't accept null, so cast at the mutation call site.
    const payload: Record<string, unknown> = {
      description: form.description === '' ? null : form.description,
      amount: toMinorUnits(Number(form.amount)),
      type: form.type,
      currency: form.currency,
      date: form.date,
      categoryId: form.categoryId,
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

  const isFormValid =
    !!form.type &&
    !!form.currency &&
    !!form.date &&
    !!form.amount &&
    Number.parseFloat(form.amount) !== 0 &&
    !!form.categoryId;

  const isFormDisabled = !isFormValid || (isEditing && !hasChanges);
  const isPending = currentMutation.isPending;

  const amountError = getFieldError('amount');
  const categoryError = getFieldError('categoryId');
  const descriptionError = getFieldError('description');

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <HeroAmountInput
        type={form.type}
        amount={form.amount}
        currency={form.currency}
        onTypeChange={(val) => setForm((f) => ({ ...f, type: val }))}
        onAmountChange={(val) => setForm((f) => ({ ...f, amount: val }))}
        onCurrencyChange={(val) => setForm((f) => ({ ...f, currency: val }))}
        amountError={!!amountError}
        typeError={!!getFieldError('type')}
        currencyError={!!getFieldError('currency')}
        autoFocus={!isEditing}
      />
      {amountError && (
        <p className="text-xs font-medium text-destructive text-center -mt-2">{amountError}</p>
      )}

      <CategoryCombobox
        id="tx-category"
        categories={categories}
        value={form.categoryId}
        onChange={(id) => setForm((f) => ({ ...f, categoryId: id }))}
        error={!!categoryError}
      />
      {categoryError && <p className="text-xs font-medium text-destructive">{categoryError}</p>}

      <DateQuickPicker
        id="tx-date"
        value={form.date}
        onChange={(val) => setForm((f) => ({ ...f, date: val }))}
        error={!!getFieldError('date')}
      />

      <textarea
        id="tx-description"
        aria-label="Note"
        placeholder="Add a note (optional)"
        value={form.description}
        rows={3}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        autoComplete="off"
        autoCapitalize="sentences"
        className={cn(
          'w-full resize-none rounded-md border border-input bg-background px-3 py-control text-[max(var(--font-size-base),16px)] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:focus-ring focus-visible:focus-ring-offset disabled:cursor-not-allowed disabled:opacity-50',
          !!descriptionError && 'border-destructive focus-visible:ring-destructive',
        )}
      />
      {descriptionError && (
        <p className="text-xs font-medium text-destructive">{descriptionError}</p>
      )}

      <div className="sticky bottom-0 -mx-6 -mb-6 mt-6 px-6 pt-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-background/95 backdrop-blur-md sm:static sm:mx-0 sm:mb-0 sm:px-0 sm:pb-0 sm:bg-transparent sm:backdrop-blur-none sm:border-t">
        <Button type="submit" className="w-full" loading={isPending} disabled={isFormDisabled}>
          Save
        </Button>
      </div>
    </form>
  );
}
