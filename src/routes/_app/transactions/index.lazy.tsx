import { createLazyFileRoute } from '@tanstack/react-router'
import { Filter, Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useCategories } from '@/hooks/useCategories'
import { useTransactions } from '@/hooks/useTransactions'
import { Pagination } from '@/components/ui/pagination'
import { TransactionFilters } from '@/components/transactions/TransactionFilters'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import { TransactionList } from '@/components/transactions/TransactionList'

export const Route = createLazyFileRoute('/_app/transactions/')({
  component: TransactionsPage,
})

const PAGE_SIZE = 20

function TransactionsPage() {
  const { data: categoriesData } = useCategories()
  const categories = categoriesData?.items ?? []

  const [showForm, setShowForm] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const [filters, setFilters] = useState<{
    categoryId: string
    start: string
    end: string
    sort: 'asc' | 'desc'
    search: string
  }>({
    categoryId: '',
    start: '',
    end: '',
    sort: 'desc',
    search: '',
  })

  const [page, setPage] = useState(0)
  const size = PAGE_SIZE

  const queryFilters = {
    ...filters,
    page,
    size,
    categoryId: filters.categoryId || undefined,
    start: filters.start || undefined,
    end: filters.end || undefined,
    search: filters.search || undefined,
  }

  const { data, isLoading, isFetching } = useTransactions(queryFilters)
  const transactions = data?.items ?? []
  const total = data?.meta?.total ?? 0

  const hasActiveFilters =
    filters.categoryId ||
    filters.start ||
    filters.end ||
    filters.sort !== 'desc' ||
    filters.search

  const resetFilters = () => {
    setFilters({
      categoryId: '',
      start: '',
      end: '',
      sort: 'desc',
      search: '',
    })
    setPage(0)
  }

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters)
    setPage(0)
  }

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

      {showFilters && (
        <TransactionFilters
          categories={categories}
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={resetFilters}
        />
      )}

      {showForm && (
        <TransactionForm
          categories={categories}
          onSuccess={() => setShowForm(false)}
          onCancel={() => setShowForm(false)}
        />
      )}

      <TransactionList
        transactions={transactions}
        categories={categories}
        isLoading={isLoading}
      />

      {!isLoading && transactions.length > 0 && (
        <Pagination
          page={page}
          total={total}
          size={size}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}
