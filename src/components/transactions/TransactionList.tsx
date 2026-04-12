import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmationDialog } from '@/components/ConfirmationDialog'
import { useDeleteTransaction, useUpdateTransaction } from '@/hooks/useTransactions'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency, formatDate, toMinorUnits } from '@/lib/formatters'
import type { Transaction } from '@budget-buddy-org/budget-buddy-contracts'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'

const CURRENCIES = ['EUR', 'USD', 'GBP']

interface TransactionListProps {
  transactions: Transaction[]
  categories: { id: string; name: string }[]
  isLoading: boolean
  hasMore: boolean
  isFetching: boolean
  onLoadMore: () => void
}

export function TransactionList({
  transactions,
  categories,
  isLoading,
  hasMore,
  isFetching,
  onLoadMore,
}: TransactionListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const { toast } = useToast()
  const deleteTx = useDeleteTransaction()

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]))

  const handleDelete = () => {
    if (!deleteId) return
    deleteTx.mutate(deleteId, {
      onSuccess: () => {
        setDeleteId(null)
        toast({
          title: 'Transaction deleted',
          description: 'The transaction has been removed.',
        })
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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="space-y-px p-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-sm" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <p className="px-6 py-4 text-sm text-muted-foreground">No transactions yet.</p>
          ) : (
            <ul className="divide-y">
              {transactions.map((t) =>
                editingId === t.id ? (
                  <TransactionEditRow
                    key={t.id}
                    transaction={t}
                    categories={categories}
                    onDone={() => setEditingId(null)}
                  />
                ) : (
                  <li
                    key={t.id}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30 cursor-pointer"
                  >
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left focus-visible:outline-none cursor-pointer"
                      onClick={() => setEditingId(t.id)}
                    >
                      <p className="truncate text-sm font-medium">{t.description ?? '—'}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(t.date)}
                        {categoryMap[t.categoryId ?? ''] ? ` · ${categoryMap[t.categoryId!]}` : ''}
                      </p>
                    </button>
                    <Badge variant={t.type === 'INCOME' ? 'income' : 'expense'}>
                      {t.type === 'INCOME' ? '+' : '-'}
                      {formatCurrency(t.amount, t.currency)}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteId(t.id)}
                      disabled={deleteTx.isPending && deleteId === t.id}
                      aria-label="Delete transaction"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </li>
                )
              )}
            </ul>
          )}

          {hasMore && (
            <div className="border-t px-4 py-3">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground"
                disabled={isFetching}
                onClick={onLoadMore}
              >
                {isFetching ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmationDialog
        isOpen={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
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

function TransactionEditRow({
  transaction,
  categories,
  onDone,
}: {
  transaction: Transaction
  categories: { id: string; name: string }[]
  onDone: () => void
}) {
  const { toast } = useToast()
  const update = useUpdateTransaction(transaction.id)
  const [form, setForm] = useState({
    description: transaction.description ?? '',
    amount: (transaction.amount / 100).toFixed(2),
    type: transaction.type as 'EXPENSE' | 'INCOME',
    currency: transaction.currency,
    date: transaction.date,
    categoryId: transaction.categoryId ?? '',
  })

  const updateFieldErrors = (update.error as any)?.errors as Array<{
    field: string
    message: string
  }> | undefined
  const getUpdateFieldError = (field: string) =>
    updateFieldErrors?.find((e) => e.field === field)?.message

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    update.mutate(
      {
        description: form.description || undefined,
        amount: toMinorUnits(Number(form.amount)),
        type: form.type,
        currency: form.currency,
        date: form.date,
        categoryId: form.categoryId || undefined,
      },
      {
        onSuccess: () => {
          toast({
            title: 'Transaction updated',
            description: 'Your changes have been saved.',
          })
          onDone()
        },
        onError: (error: any) => {
          if (!error.errors) {
            toast({
              title: 'Error',
              description: 'Failed to update transaction.',
              variant: 'destructive',
            })
          }
        },
      }
    )
  }

  return (
    <li className="bg-muted/20 px-4 py-3 sm:rounded-md">
      <form onSubmit={handleSave} className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-1">
            <Input
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className={getUpdateFieldError('description') ? 'border-destructive ring-destructive focus-visible:ring-destructive' : ''}
              autoFocus
            />
            {getUpdateFieldError('description') && (
              <p className="text-[10px] font-medium text-destructive">{getUpdateFieldError('description')}</p>
            )}
          </div>
          <div className="space-y-1">
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              required
              className={getUpdateFieldError('amount') ? 'border-destructive ring-destructive focus-visible:ring-destructive' : ''}
            />
            {getUpdateFieldError('amount') && (
              <p className="text-[10px] font-medium text-destructive">{getUpdateFieldError('amount')}</p>
            )}
          </div>
          <div className="space-y-1">
            <Select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'EXPENSE' | 'INCOME' }))}
              className={getUpdateFieldError('type') ? 'border-destructive ring-destructive focus-visible:ring-destructive' : ''}
            >
              <option value="EXPENSE">Expense</option>
              <option value="INCOME">Income</option>
            </Select>
            {getUpdateFieldError('type') && (
              <p className="text-[10px] font-medium text-destructive">{getUpdateFieldError('type')}</p>
            )}
          </div>
          <div className="space-y-1">
            <Select
              value={form.currency}
              onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
              className={getUpdateFieldError('currency') ? 'border-destructive ring-destructive focus-visible:ring-destructive' : ''}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            {getUpdateFieldError('currency') && (
              <p className="text-[10px] font-medium text-destructive">{getUpdateFieldError('currency')}</p>
            )}
          </div>
          <div className="space-y-1">
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              required
              className={getUpdateFieldError('date') ? 'border-destructive ring-destructive focus-visible:ring-destructive' : ''}
            />
            {getUpdateFieldError('date') && (
              <p className="text-[10px] font-medium text-destructive">{getUpdateFieldError('date')}</p>
            )}
          </div>
          {categories.length > 0 && (
            <div className="sm:col-span-2 space-y-1">
              <Select
                value={form.categoryId}
                onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                className={getUpdateFieldError('categoryId') ? 'border-destructive ring-destructive focus-visible:ring-destructive' : ''}
              >
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
              {getUpdateFieldError('categoryId') && (
                <p className="text-[10px] font-medium text-destructive">{getUpdateFieldError('categoryId')}</p>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={update.isPending}>
            {update.isPending ? 'Saving…' : 'Save'}
          </Button>
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
        </div>
      </form>
    </li>
  )
}
