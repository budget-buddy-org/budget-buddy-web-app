import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDate } from '@/lib/formatters'
import type { Transaction } from '@budget-buddy-org/budget-buddy-contracts'
import { useMemo } from 'react'

interface TransactionListProps {
  transactions: Transaction[]
  categories: { id: string; name: string }[]
  isLoading: boolean
  isFiltering?: boolean
  onResetFilters?: () => void
  onEdit?: (id: string) => void
}

export function TransactionList({
  transactions,
  categories,
  isLoading,
  isFiltering = false,
  onResetFilters,
  onEdit,
}: TransactionListProps) {
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]))

  const groupedTransactions = useMemo(() => {
    const groups: { date: string; items: Transaction[] }[] = []
    let currentGroup: { date: string; items: Transaction[] } | null = null

    for (const t of transactions) {
      if (!currentGroup || currentGroup.date !== t.date) {
        currentGroup = { date: t.date, items: [] }
        groups.push(currentGroup)
      }
      currentGroup.items.push(t)
    }
    return groups
  }, [transactions])

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-0">
              <Skeleton className="h-7 w-full rounded-none" />
              <div className="space-y-px p-2">
                {[...Array(2)].map((_, j) => (
                  <Skeleton key={j} className="h-14 rounded-sm" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="flex flex-col items-center justify-center gap-2 px-6 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              {isFiltering ? 'No transactions match your filters.' : 'No transactions yet.'}
            </p>
            {isFiltering && onResetFilters && (
              <Button variant="link" onClick={onResetFilters} className="h-auto p-0 text-primary">
                Reset filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {groupedTransactions.map((group) => (
          <Card key={group.date}>
            <CardContent className="p-0">
              <div className="bg-muted/30 px-4 py-1.5 text-xs font-semibold text-muted-foreground sticky top-0 z-10 backdrop-blur-sm">
                {formatDate(group.date)}
              </div>
              <ul className="divide-y">
                {group.items.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30 cursor-pointer"
                  >
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left focus-visible:outline-none cursor-pointer"
                      onClick={() => onEdit?.(t.id)}
                    >
                      <p className="truncate text-sm font-medium">{t.description ?? '—'}</p>
                      <p className="text-xs text-muted-foreground">
                        {categoryMap[t.categoryId ?? ''] ? categoryMap[t.categoryId!] : 'No Category'}
                      </p>
                    </button>
                    <Badge variant={t.type === 'INCOME' ? 'income' : 'expense'}>
                      {t.type === 'INCOME' ? '+' : '-'}
                      {formatCurrency(t.amount, t.currency)}
                    </Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}

