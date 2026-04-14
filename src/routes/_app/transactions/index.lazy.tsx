import { createLazyFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { Filter } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useCategories } from '@/hooks/useCategories'
import { useTransactions, useTransaction } from '@/hooks/useTransactions'
import { PageHeader } from '@/components/layout/PageHeader'
import { Pagination } from '@/components/ui/pagination'
import { TransactionFilters } from '@/components/transactions/TransactionFilters'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import { TransactionList } from '@/components/transactions/TransactionList'

export const Route = createLazyFileRoute('/_app/transactions/')({
  component: TransactionsPage,
})

const PAGE_SIZE = 20

function TransactionsPage() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/_app/transactions/' }) as any
  const { data: categoriesData } = useCategories()
  const categories = categoriesData?.items ?? []

  const [showForm, setShowForm] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const { data: editingTransaction, isLoading: isTransactionLoading } = useTransaction(search.edit!)

  useEffect(() => {
    if (search.add === 'true') {
      setShowForm(true)
      // Clear the param after opening
      navigate({
        search: { add: undefined } as any,
        replace: true,
      })
    }
  }, [search.add, navigate])

  const closeForm = () => {
    setShowForm(false)
    if (search.edit) {
      navigate({
        search: { edit: undefined } as any,
        replace: true,
      })
    }
  }

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

  const { data, isLoading } = useTransactions(queryFilters)
  const allTransactions = data?.items ?? []
  const total = data?.meta?.total ?? 0

  const isFiltered = !!(filters.categoryId || filters.start || filters.end || filters.search)
  const transactions = filters.search
    ? allTransactions.filter((t) =>
        t.description?.toLowerCase().includes(filters.search.toLowerCase())
      )
    : allTransactions

  const hasActiveFilters =
    isFiltered || filters.sort !== 'desc'

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
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Transactions"
        subtitle="View and manage your income and expenses."
        primaryAction={{
          label: 'Add',
          onClick: () => setShowForm((v) => !v),
        }}
      >
        <Button
          variant={showFilters ? 'secondary' : 'outline'}
          onClick={() => setShowFilters((v) => !v)}
          aria-label="Toggle filters"
        >
          <Filter className="h-4 w-4" />
          {hasActiveFilters && <span className="ml-1 h-1.5 w-1.5 rounded-full bg-primary" />}
        </Button>
      </PageHeader>

      <Dialog open={showFilters} onOpenChange={setShowFilters}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filter Transactions</DialogTitle>
            <DialogDescription>
              Apply filters to your transaction history.
            </DialogDescription>
          </DialogHeader>
          <TransactionFilters
            categories={categories}
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={resetFilters}
            onClose={() => setShowFilters(false)}
          />
        </DialogContent>
      </Dialog>
      
      <Dialog open={showForm || !!search.edit} onOpenChange={(open) => !open && closeForm()}>
        <DialogContent hideClose={!!search.edit}>
          <DialogHeader>
            <DialogTitle>{search.edit ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
            <DialogDescription>
              {search.edit
                ? 'Update your transaction details including amount, date, and category.'
                : 'Record a new expense or income to track your budget.'}
            </DialogDescription>
          </DialogHeader>
          {isTransactionLoading && search.edit ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (showForm || (search.edit && editingTransaction)) ? (
            <TransactionForm
              categories={categories}
              transaction={search.edit ? editingTransaction : undefined}
              onSuccess={closeForm}
              onCancel={closeForm}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <TransactionList
        transactions={transactions}
        categories={categories}
        isLoading={isLoading}
        isFiltering={isFiltered}
        onResetFilters={resetFilters}
        onEdit={(id) => (navigate as any)({ search: (s: any) => ({ ...s, edit: id }) })}
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
