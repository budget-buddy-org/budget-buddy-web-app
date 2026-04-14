import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmationDialog } from '@/components/ConfirmationDialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { TransactionForm } from './TransactionForm'
import { useDeleteTransaction } from '@/hooks/useTransactions'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency, formatDate } from '@/lib/formatters'
import type { Transaction } from '@budget-buddy-org/budget-buddy-contracts'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'

interface TransactionListProps {
  transactions: Transaction[]
  categories: { id: string; name: string }[]
  isLoading: boolean
}

export function TransactionList({
  transactions,
  categories,
  isLoading,
}: TransactionListProps) {
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
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
              {transactions.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30 cursor-pointer"
                >
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left focus-visible:outline-none cursor-pointer"
                    onClick={() => setEditingTransaction(t)}
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
              ))}
            </ul>
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

      <Dialog open={!!editingTransaction} onOpenChange={(open) => !open && setEditingTransaction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          {editingTransaction && (
            <TransactionForm
              categories={categories}
              transaction={editingTransaction}
              onSuccess={() => setEditingTransaction(null)}
              onCancel={() => setEditingTransaction(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

