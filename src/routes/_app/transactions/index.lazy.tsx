import { createLazyFileRoute } from '@tanstack/react-router'
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

export const Route = createLazyFileRoute('/_app/transactions/')({
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
  const createFieldErrors = (createTx.error as any)?.errors as Array<{ field: string; message: string }> | undefined
  const getCreateFieldError = (field: string) => createFieldErrors?.find((e) => e.field === field)?.message

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)

  // Filters
  const [showFilters, setShowFilters] = useState(false)
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStart, setFilterStart] = useState('')
  const [filterEnd, setFilterEnd] = useState('')
  const [filterSort, setFilterSort] = useState<'asc' | 'desc'>('desc')
  const [size, setSize] = useState(PAGE_SIZE)

  const txFilters: TransactionFilters = {
    sort: filterSort,
    size,
    ...(filterCategory ? { categoryId: filterCategory } : {}),
    ...(filterStart ? { start: filterStart } : {}),
    ...(filterEnd ? { end: filterEnd } : {}),
  }

  const { data, isLoading, isFetching } = useTransactions(txFilters)

  const transactions = data?.items ?? []
  const hasMore = transactions.length === size
  const categories = categoriesData?.items ?? []
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]))

  function resetFilters() {
    setFilterCategory('')
    setFilterStart('')
    setFilterEnd('')
    setFilterSort('desc')
    setSize(PAGE_SIZE)
  }

  function handleFilterChange(update: () => void) {
    update()
    setSize(PAGE_SIZE)
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
            variant={showFilters ? 'secondary' : 'outline'}
            onClick={() => setShowFilters((v) => !v)}
            aria-label="Toggle filters"
          >
            <Filter className="h-4 w-4" />
            {hasActiveFilters && <span className="ml-1 h-1.5 w-1.5 rounded-full bg-primary" />}
          </Button>
          <Button onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      {showFilters && (
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
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
            <form onSubmit={handleCreate} className="space-y-4">
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

              {createTx.isError && !createFieldErrors?.length && (
                <p className="text-sm text-destructive">Failed to create transaction.</p>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={createTx.isPending}>
                  {createTx.isPending ? 'Saving…' : 'Save'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
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
                      onClick={() => deleteTx.mutate(t.id)}
                      disabled={deleteTx.isPending}
                      aria-label="Delete transaction"
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
                onClick={() => setSize((l) => l + PAGE_SIZE)}
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
  const updateFieldErrors = (update.error as any)?.errors as Array<{ field: string; message: string }> | undefined
  const getUpdateFieldError = (field: string) => updateFieldErrors?.find((e) => e.field === field)?.message

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
    <li className="bg-muted/20 px-4 py-3 sm:rounded-md">
      <form onSubmit={handleSave} className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-1">
            <Input
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className={getUpdateFieldError('description') ? 'border-destructive ring-destructive focus-visible:ring-destructive' : ''}
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

        {update.isError && !updateFieldErrors?.length && (
          <p className="text-xs text-destructive">Failed to save changes.</p>
        )}

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
