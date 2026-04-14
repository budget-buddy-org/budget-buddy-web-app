import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AmountInput } from '@/components/ui/amount-input'
import { DatePicker } from '@/components/ui/date-picker'
import { Select } from '@/components/ui/select'
import { TransactionTypeToggle } from '@/components/ui/transaction-type-toggle'
import { useCreateTransaction, useUpdateTransaction } from '@/hooks/useTransactions'
import { useToast } from '@/hooks/use-toast'
import { toMinorUnits, todayIso } from '@/lib/formatters'
import type { Transaction, TransactionWrite } from '@budget-buddy-org/budget-buddy-contracts'
import { Check, X } from 'lucide-react'
import { useState } from 'react'

const CURRENCIES = ['EUR', 'USD', 'GBP']

interface TransactionFormProps {
  categories: { id: string; name: string }[]
  onSuccess: () => void
  onCancel: () => void
  transaction?: Transaction
}

export function TransactionForm({
  categories,
  onSuccess,
  onCancel,
  transaction,
}: TransactionFormProps) {
  const { toast } = useToast()
  const createTx = useCreateTransaction()
  const updateTx = useUpdateTransaction(transaction?.id ?? '')

  const [form, setForm] = useState({
    description: transaction?.description ?? '',
    amount: transaction ? (transaction.amount / 100).toFixed(2) : '',
    type: (transaction?.type as 'EXPENSE' | 'INCOME') ?? ('EXPENSE' as const),
    currency: transaction?.currency ?? 'EUR',
    date: transaction?.date ?? todayIso(),
    categoryId: transaction?.categoryId ?? '',
  })

  const isEditing = !!transaction
  const currentMutation = isEditing ? updateTx : createTx

  const hasChanges =
    form.description !== (transaction?.description ?? '') ||
    form.amount !== (transaction ? (transaction.amount / 100).toFixed(2) : '') ||
    form.type !== ((transaction?.type as 'EXPENSE' | 'INCOME') ?? 'EXPENSE') ||
    form.currency !== (transaction?.currency ?? 'EUR') ||
    form.date !== (transaction?.date ?? todayIso()) ||
    form.categoryId !== (transaction?.categoryId ?? '')

  const fieldErrors = (currentMutation.error as any)?.errors as Array<{
    field: string
    message: string
  }> | undefined
  const getFieldError = (field: string) =>
    fieldErrors?.find((e) => e.field === field)?.message

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const body: TransactionWrite = {
      description: form.description || undefined,
      amount: toMinorUnits(Number(form.amount)),
      type: form.type,
      currency: form.currency,
      date: form.date,
      categoryId: form.categoryId,
    }

    currentMutation.mutate(body, {
      onSuccess: () => {
        toast({
          title: isEditing ? 'Transaction updated' : 'Transaction created',
          description: isEditing
            ? 'Your changes have been saved.'
            : 'The transaction has been recorded successfully.',
        })
        onSuccess()
      },
      onError: (error: any) => {
        if (!error.errors) {
          toast({
            title: 'Error',
            description: `Failed to ${isEditing ? 'update' : 'create'} transaction.`,
            variant: 'destructive',
          })
        }
      },
    })
  }

  const isFormValid =
    !!form.type &&
    !!form.currency &&
    !!form.date &&
    !!form.amount &&
    Number.parseFloat(form.amount) !== 0 &&
    (categories.length === 0 || !!form.categoryId)

  const isFormDisabled = !isFormValid || (isEditing && !hasChanges)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Type <span className="text-destructive">*</span>
              </label>
              <TransactionTypeToggle
                value={form.type}
                onChange={(val) => setForm((f) => ({ ...f, type: val }))}
                error={!!getFieldError('type')}
              />
              {getFieldError('type') && (
                <p className="text-[0.625rem] font-medium text-destructive">{getFieldError('type')}</p>
              )}
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <Input
                placeholder="Coffee, salary…"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className={getFieldError('description') ? 'border-destructive ring-destructive focus-visible:ring-destructive' : ''}
                autoFocus
              />
              {getFieldError('description') && (
                <p className="text-[0.625rem] font-medium text-destructive">{getFieldError('description')}</p>
              )}
            </div>

            <div className="flex gap-4 sm:col-span-2">
              <div className="flex-1 space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Amount <span className="text-destructive">*</span>
                </label>
                <AmountInput
                  placeholder="12.99"
                  value={form.amount}
                  onChange={(val) => setForm((f) => ({ ...f, amount: val }))}
                  required
                  className={getFieldError('amount') ? 'border-destructive ring-destructive focus-visible:ring-destructive' : ''}
                />
                {getFieldError('amount') && (
                  <p className="text-[0.625rem] font-medium text-destructive">{getFieldError('amount')}</p>
                )}
              </div>

              <div className="flex-1 space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Currency <span className="text-destructive">*</span>
                </label>
                <Select
                  value={form.currency}
                  onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                  className={getFieldError('currency') ? 'border-destructive ring-destructive focus-visible:ring-destructive' : ''}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
                {getFieldError('currency') && (
                  <p className="text-[0.625rem] font-medium text-destructive">{getFieldError('currency')}</p>
                )}
              </div>
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Date <span className="text-destructive">*</span>
              </label>
              <DatePicker
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                required
                className={getFieldError('date') ? 'border-destructive ring-destructive focus-visible:ring-destructive' : ''}
              />
              {getFieldError('date') && (
                <p className="text-[0.625rem] font-medium text-destructive">{getFieldError('date')}</p>
              )}
            </div>

            {categories.length > 0 && (
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Category <span className="text-destructive">*</span>
                </label>
                <Select
                  value={form.categoryId}
                  onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                  className={getFieldError('categoryId') ? 'border-destructive ring-destructive focus-visible:ring-destructive' : ''}
                >
                  <option value="">No category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
                {getFieldError('categoryId') && (
                  <p className="text-[0.625rem] font-medium text-destructive">{getFieldError('categoryId')}</p>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1" loading={currentMutation.isPending} disabled={isFormDisabled}>
              <Check className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={currentMutation.isPending}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
    </form>
  )
}
