import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useCreateTransaction } from '@/hooks/useTransactions'
import { useToast } from '@/hooks/use-toast'
import { toMinorUnits, todayIso } from '@/lib/formatters'
import type { TransactionWrite } from '@budget-buddy-org/budget-buddy-contracts'
import { useState } from 'react'

const CURRENCIES = ['EUR', 'USD', 'GBP']

interface TransactionFormProps {
  categories: { id: string; name: string }[]
  onSuccess: () => void
  onCancel: () => void
}

export function TransactionForm({
  categories,
  onSuccess,
  onCancel,
}: TransactionFormProps) {
  const { toast } = useToast()
  const createTx = useCreateTransaction()

  const [form, setForm] = useState({
    description: '',
    amount: '',
    type: 'EXPENSE' as 'EXPENSE' | 'INCOME',
    currency: 'EUR',
    date: todayIso(),
    categoryId: '',
  })

  const createFieldErrors = (createTx.error as any)?.errors as Array<{
    field: string
    message: string
  }> | undefined
  const getCreateFieldError = (field: string) =>
    createFieldErrors?.find((e) => e.field === field)?.message

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

    createTx.mutate(body, {
      onSuccess: () => {
        toast({
          title: 'Transaction created',
          description: 'The transaction has been recorded successfully.',
        })
        onSuccess()
      },
      onError: (error: any) => {
        if (!error.errors) {
          toast({
            title: 'Error',
            description: 'Failed to create transaction.',
            variant: 'destructive',
          })
        }
      },
    })
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <Input
                placeholder="Coffee, salary…"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className={getCreateFieldError('description') ? 'border-destructive ring-destructive focus-visible:ring-destructive' : ''}
              />
              {getCreateFieldError('description') && (
                <p className="text-[10px] font-medium text-destructive">{getCreateFieldError('description')}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Amount <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="12.99"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                required
                className={getCreateFieldError('amount') ? 'border-destructive ring-destructive focus-visible:ring-destructive' : ''}
              />
              {getCreateFieldError('amount') && (
                <p className="text-[10px] font-medium text-destructive">{getCreateFieldError('amount')}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Type</label>
              <Select
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, type: e.target.value as 'EXPENSE' | 'INCOME' }))
                }
                className={getCreateFieldError('type') ? 'border-destructive ring-destructive focus-visible:ring-destructive' : ''}
              >
                <option value="EXPENSE">Expense</option>
                <option value="INCOME">Income</option>
              </Select>
              {getCreateFieldError('type') && (
                <p className="text-[10px] font-medium text-destructive">{getCreateFieldError('type')}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Currency</label>
              <Select
                value={form.currency}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                className={getCreateFieldError('currency') ? 'border-destructive ring-destructive focus-visible:ring-destructive' : ''}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
              {getCreateFieldError('currency') && (
                <p className="text-[10px] font-medium text-destructive">{getCreateFieldError('currency')}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Date <span className="text-destructive">*</span>
              </label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                required
                className={getCreateFieldError('date') ? 'border-destructive ring-destructive focus-visible:ring-destructive' : ''}
              />
              {getCreateFieldError('date') && (
                <p className="text-[10px] font-medium text-destructive">{getCreateFieldError('date')}</p>
              )}
            </div>

            {categories.length > 0 && (
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Category</label>
                <Select
                  value={form.categoryId}
                  onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                  className={getCreateFieldError('categoryId') ? 'border-destructive ring-destructive focus-visible:ring-destructive' : ''}
                >
                  <option value="">No category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
                {getCreateFieldError('categoryId') && (
                  <p className="text-[10px] font-medium text-destructive">{getCreateFieldError('categoryId')}</p>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={createTx.isPending}>
              {createTx.isPending ? 'Saving…' : 'Save'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
