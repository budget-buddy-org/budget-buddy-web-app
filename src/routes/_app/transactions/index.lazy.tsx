import { createLazyFileRoute } from '@tanstack/react-router'
import { TransactionsPage } from '@/components/transactions/TransactionsPage'

export const Route = createLazyFileRoute('/_app/transactions/')({
  component: TransactionsPage,
})
