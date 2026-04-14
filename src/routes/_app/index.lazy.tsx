import { createLazyFileRoute } from '@tanstack/react-router'
import { DashboardPage } from '@/components/dashboard/DashboardPage'

export const Route = createLazyFileRoute('/_app/')({
  component: DashboardPage,
})
