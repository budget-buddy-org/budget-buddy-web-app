import { createFileRoute } from '@tanstack/react-router'
import { Filter, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useCategories } from '@/hooks/useCategories'
import {
  type TransactionFilters,
  useCreateTransaction,
  useDeleteTransaction,
  useTransactions,
  useUpdateTransaction,
} from '@/hooks/useTransactions'
import { formatCurrency, formatDate, todayIso, toMinorUnits } from '@/lib/formatters'
import type { Transaction, TransactionWrite } from '@budget-buddy-org/budget-buddy-contracts'

export const Route = createFileRoute('/_app/transactions/')({
  component: TransactionsPage,
})

const CURRENCIES = ['EUR', 'USD', 'GBP']
const PAGE_SIZE = 20

function TransactionsPage() {
  const { data: categoriesData } = useCategories()
  const deleteTx = useDeleteTransaction()

  // Create form
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

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)

  // Filters
  const [showFilters, setShowFilters] = useState(false)
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStart, setFilterStart] = useState('')
  const [filterEnd, setFilterEnd] = useState('')
  const [filterSort, setFilterSort] = useState<'asc' | 'desc'>('desc')
  const [limit, setLimit] = useState(PAGE_SIZE)

  const txFilters: TransactionFilters = {
    sort: filterSort,
    limit,
    ...(filterCategory ? { categoryId: filterCategory } : {}),
    ...(filterStart ? { start: filterStart } : {}),
    ...(filterEnd ? { end: filterEnd } : {}),
  }

  const { data, isLoading, isFetching } = useTransactions(txFilters)

  const transactions = data?.items ?? []
  const hasMore = transactions.length === limit
  const categories = categoriesData?.items ?? []
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]))

  function resetFilters() {
    setFilterCategory('')
    setFilterStart('')
    setFilterEnd('')
    setFilterSort('desc')
    setLimit(PAGE_SIZE)
  }

  function handleFilterChange(update: () => void) {
    update()
    setLimit(PAGE_SIZE)
  }

  const handleCreate = (e: React.FormEvent) => {
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
        setForm((f) => ({ ...f, description: '', amount: '', categoryId: '' }))
      },
    })
  }

  const hasActiveFilters = filterCategory || filterStart || filterEnd || filterSort !== 'desc'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Transactions</h1>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={showFilters ? 'secondary' : 'outline'}
            onClick={() => setShowFilters((v) => !v)}
          >
            <Filter className="h-4 w-4" />
            {hasActiveFilters && <span className="ml-1 h-1.5 w-1.5 rounded-full bg-primary" />}
          </Button>
          <Button size="sm" onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      {showFilters && (
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Category</label>
                <Select
                  value={filterCategory}
                  onChange={(e) => handleFilterChange(() => setFilterCategory(e.target.value))}
                >
                  <option value="">All categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">From</label>
                <Input
                  type="date"
                  value={filterStart}
                  onChange={(e) => handleFilterChange(() => setFilterStart(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">To</label>
                <Input
                  type="date"
                  value={filterEnd}
                  onChange={(e) => handleFilterChange(() => setFilterEnd(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Sort</label>
                <Select
                  value={filterSort}
                  onChange={(e) =>
                    handleFilterChange(() => setFilterSort(e.target.value as 'asc' | 'desc'))
                  }
                >
                  <option value="desc">Newest first</option>
                  <option value="asc">Oldest first</option>
                </Select>
              </div>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                className="mt-3 text-xs text-muted-foreground underline"
                onClick={resetFilters}
              >
                Clear filters
              </button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create form */}
      {showForm && (
        <Card>
          <CardContent className="pt-4">
            <form onSubmit={handleCreate} className="space-y-3">
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
                  <Select
                    value={form.type}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, type: e.target.value as 'EXPENSE' | 'INCOME' }))
                    }
                  >
                    <option value="EXPENSE">Expense</option>
                    <option value="INCOME">Income</option>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Currency</label>
                  <Select
                    value={form.currency}
                    onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </Select>
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

                {categories.length > 0 && (
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Category</label>
                    <Select
                      value={form.categoryId}
                      onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                    >
                      <option value="">No category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
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

      {/* Transaction list */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-px p-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-sm" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
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
                  <li key={t.id} className="flex items-center gap-3 px-4 py-3">
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
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
                      onClick={() => deleteTx.mutate(t.id)}
                      disabled={deleteTx.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </li>
                ),
              )}
            </ul>
          )}

          {/* Load more */}
          {!isLoading && hasMore && (
            <div className="border-t px-4 py-3">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground"
                disabled={isFetching}
                onClick={() => setLimit((l) => l + PAGE_SIZE)}
              >
                {isFetching ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
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
  const update = useUpdateTransaction(transaction.id)
  const [form, setForm] = useState({
    description: transaction.description ?? '',
    amount: (transaction.amount / 100).toFixed(2),
    type: transaction.type as 'EXPENSE' | 'INCOME',
    currency: transaction.currency,
    date: transaction.date,
    categoryId: transaction.categoryId ?? '',
  })

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    update.mutate(
      {
        description: form.description || undefined,
        amount: toMinorUnits(Number(form.amount)),
        type: form.type,
        currency: form.currency,
        date: form.date,
        categoryId: form.categoryId,
      },
      { onSuccess: onDone },
    )
  }

  return (
    <li className="px-4 py-3">
      <form onSubmit={handleSave} className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="col-span-2">
            <Input
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            required
          />
          <Select
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'EXPENSE' | 'INCOME' }))}
          >
            <option value="EXPENSE">Expense</option>
            <option value="INCOME">Income</option>
          </Select>
          <Select
            value={form.currency}
            onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Input
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            required
          />
          {categories.length > 0 && (
            <div className="col-span-2">
              <Select
                value={form.categoryId}
                onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
              >
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>

        {update.isError && (
          <p className="text-xs text-destructive">Failed to save changes.</p>
        )}

        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={update.isPending}>
            {update.isPending ? 'Saving…' : 'Save'}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onDone}>
            Cancel
          </Button>
        </div>
      </form>
    </li>
  )
}
