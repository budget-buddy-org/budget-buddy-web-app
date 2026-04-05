import { createFileRoute } from '@tanstack/react-router'
import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useCategories } from '@/hooks/useCategories'
import { useCreateTransaction, useDeleteTransaction, useTransactions } from '@/hooks/useTransactions'
import { formatCurrency, formatDate, todayIso, toMinorUnits } from '@/lib/formatters'
import type { TransactionWrite } from '@glebremniov/budget-buddy-contracts/models'

export const Route = createFileRoute('/_app/transactions/')({
  component: TransactionsPage,
})

const CURRENCIES = ['EUR', 'USD', 'GBP']

function TransactionsPage() {
  const { data, isLoading } = useTransactions({ sort: 'desc', limit: 50 })
  const { data: categories } = useCategories()
  const deleteTx = useDeleteTransaction()

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<{
    description: string
    amount: string
    type: 'EXPENSE' | 'INCOME'
    currency: string
    date: string
    categoryId: string
  }>({
    description: '',
    amount: '',
    type: 'EXPENSE',
    currency: 'EUR',
    date: todayIso(),
    categoryId: '',
  })

  const createTx = useCreateTransaction()

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
        setShowForm(false)
        setForm((f) => ({ ...f, description: '', amount: '' }))
      },
    })
  }

  const transactions = data?.items ?? []
  const categoryMap = Object.fromEntries((categories?.items ?? []).map((c) => [c.id, c.name]))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Transactions</h1>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Description</label>
                  <Input
                    placeholder="Coffee, salary…"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Amount</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="12.99"
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Type</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={form.type}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, type: e.target.value as 'EXPENSE' | 'INCOME' }))
                    }
                  >
                    <option value="EXPENSE">Expense</option>
                    <option value="INCOME">Income</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Currency</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={form.currency}
                    onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Date</label>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    required
                  />
                </div>

                {(categories?.items.length ?? 0) > 0 && (
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Category</label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={form.categoryId}
                      onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                      required
                    >
                      <option value="">Select category…</option>
                      {categories?.items.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {createTx.isError && (
                <p className="text-sm text-destructive">Failed to create transaction.</p>
              )}

              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={createTx.isPending}>
                  {createTx.isPending ? 'Saving…' : 'Save'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="px-6 py-4 text-sm text-muted-foreground">Loading…</p>
          ) : transactions.length === 0 ? (
            <p className="px-6 py-4 text-sm text-muted-foreground">No transactions yet.</p>
          ) : (
            <ul className="divide-y">
              {transactions.map((t) => (
                <li key={t.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.description ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(t.date)} · {categoryMap[t.categoryId] ?? ''}
                    </p>
                  </div>
                  <Badge variant={t.type === 'INCOME' ? 'income' : 'expense'}>
                    {t.type === 'INCOME' ? '+' : '-'}
                    {formatCurrency(t.amount, t.currency)}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteTx.mutate(t.id)}
                    disabled={deleteTx.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
