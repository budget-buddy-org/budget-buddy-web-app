import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AmountInput } from '@/components/ui/amount-input'
import { DatePicker } from '@/components/ui/date-picker'
import { Select } from '@/components/ui/select'
import { TransactionTypeToggle } from '@/components/ui/transaction-type-toggle'
import { useCreateTransaction, useUpdateTransaction, useDeleteTransaction } from '@/hooks/useTransactions'
import { useCreateCategory } from '@/hooks/useCategories'
import { useToast } from '@/hooks/use-toast'
import { toMinorUnits, todayIso } from '@/lib/formatters'
import type { Transaction, TransactionWrite } from '@budget-buddy-org/budget-buddy-contracts'
import { Check, X, Plus, RotateCcw, MoreVertical, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { ConfirmationDialog } from '@/components/ConfirmationDialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const CURRENCIES = ['EUR', 'GBP', 'USD']

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
  const deleteTx = useDeleteTransaction()
  const createCategory = useCreateCategory()

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [form, setForm] = useState({
    description: transaction?.description ?? '',
    amount: transaction ? (transaction.amount / 100).toFixed(2) : '',
    type: (transaction?.type as 'EXPENSE' | 'INCOME') ?? ('EXPENSE' as const),
    currency: transaction?.currency ?? 'EUR',
    date: transaction?.date ?? todayIso(),
    categoryId: transaction?.categoryId ?? '',
  })

  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')

  const isEditing = !!transaction
  const currentMutation = isEditing ? updateTx : createTx

  const hasChanges =
    form.description !== (transaction?.description ?? '') ||
    form.amount !== (transaction ? (transaction.amount / 100).toFixed(2) : '') ||
    form.type !== ((transaction?.type as 'EXPENSE' | 'INCOME') ?? 'EXPENSE') ||
    form.currency !== (transaction?.currency ?? 'EUR') ||
    form.date !== (transaction?.date ?? todayIso()) ||
    form.categoryId !== (transaction?.categoryId ?? '') ||
    (isAddingCategory && !!newCategoryName)

  const fieldErrors = (currentMutation.error as any)?.errors as Array<{
    field: string
    message: string
  }> | undefined
  const getFieldError = (field: string) =>
    fieldErrors?.find((e) => e.field === field)?.message

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    let categoryId = form.categoryId

    if (isAddingCategory && newCategoryName) {
      try {
        const newCat = await createCategory.mutateAsync({ name: newCategoryName })
        categoryId = newCat.id
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to create new category.',
          variant: 'destructive',
        })
        return
      }
    }

    const body: TransactionWrite = {
      description: form.description || undefined,
      amount: toMinorUnits(Number(form.amount)),
      type: form.type,
      currency: form.currency,
      date: form.date,
      categoryId,
    }

    currentMutation.mutate(body, {
      onSuccess: () => {
        toast({
          title: isEditing ? 'Transaction updated' : 'Transaction created',
          description: isEditing
            ? 'Your changes have been saved.'
            : 'The transaction has been recorded successfully.',
          variant: 'success',
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

  const handleDelete = () => {
    if (!transaction?.id) return
    deleteTx.mutate(transaction.id, {
      onSuccess: () => {
        toast({
          title: 'Transaction deleted',
          description: 'The transaction has been removed.',
          variant: 'success',
        })
        onSuccess()
      },
      onError: () => {
        toast({
          title: 'Error',
          description: 'Failed to delete transaction.',
          variant: 'destructive',
        })
      },
    })
  }

  const isFormValid =
    !!form.type &&
    !!form.currency &&
    !!form.date &&
    !!form.amount &&
    Number.parseFloat(form.amount) !== 0 &&
    (isAddingCategory ? !!newCategoryName : !!form.categoryId)

  const isFormDisabled = !isFormValid || (isEditing && !hasChanges)
  const isPending = currentMutation.isPending || createCategory.isPending

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        {isEditing && (
          <div className="absolute top-4 right-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onCancel} className="cursor-pointer">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
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

            <div className="sm:col-span-2 space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">
                  Category <span className="text-destructive">*</span>
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-[0.625rem] font-medium"
                  onClick={() => setIsAddingCategory((v) => !v)}
                  disabled={isPending}
                >
                  {isAddingCategory ? (
                    <>
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Choose existing
                    </>
                  ) : (
                    <>
                      <Plus className="h-3 w-3 mr-1" />
                      Add new
                    </>
                  )}
                </Button>
              </div>

              {isAddingCategory ? (
                <div className="space-y-1">
                  <Input
                    placeholder="New category name…"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    disabled={isPending}
                    autoComplete="off"
                    className={
                      createCategory.error
                        ? 'border-destructive ring-destructive focus-visible:ring-destructive'
                        : ''
                    }
                    autoFocus
                  />
                  {(createCategory.error as any)?.message && (
                    <p className="text-[0.625rem] font-medium text-destructive">
                      {(createCategory.error as any).message}
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <Select
                    value={form.categoryId}
                    onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                    disabled={isPending}
                    className={
                      getFieldError('categoryId')
                        ? 'border-destructive ring-destructive focus-visible:ring-destructive'
                        : ''
                    }
                  >
                    <option value="">No category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                  {getFieldError('categoryId') && (
                    <p className="text-[0.625rem] font-medium text-destructive">
                      {getFieldError('categoryId')}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1" loading={isPending} disabled={isFormDisabled}>
              <Check className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={isPending}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
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
  )
}
