import { Link, createLazyFileRoute } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight, Wallet, PlusCircle } from 'lucide-react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useTransactions } from '@/hooks/useTransactions'
import { formatCurrency, formatDate } from '@/lib/formatters'

export const Route = createLazyFileRoute('/_app/')({
  component: DashboardPage,
})

const SUMMARY_LIMIT = 50

function DashboardPage() {
  const { data, isLoading } = useTransactions({ size: SUMMARY_LIMIT, sort: 'desc' })

  if (isLoading) return <DashboardSkeleton />

  const transactions = data?.items ?? []

  const totals = transactions.reduce(
    (acc, t) => {
      if (t.type === 'INCOME') acc.income += t.amount
      else acc.expense += t.amount
      return acc
    },
    { income: 0, expense: 0 },
  )

  const balance = totals.income - totals.expense

  // Group transactions by month for chart
  const chartData = Object.entries(
    transactions.reduce<Record<string, { income: number; expense: number }>>((acc, t) => {
      const month = t.date.slice(0, 7) // YYYY-MM
      if (!acc[month]) acc[month] = { income: 0, expense: 0 }
      if (t.type === 'INCOME') acc[month]!.income += t.amount / 100
      else acc[month]!.expense += t.amount / 100
      return acc
    }, {}),
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, values]) => ({ month, ...values }))

  const recent = transactions.slice(0, 8)

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <span className="text-xs text-muted-foreground">Last {SUMMARY_LIMIT} items</span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Card className="col-span-2 md:col-span-1">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Wallet className="h-3.5 w-3.5" />
              Balance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${balance >= 0 ? 'text-income' : 'text-expense'}`}>
              {formatCurrency(balance)}
            </p>
          </CardContent>
        </Card>

        <SummaryCard
          label="Income"
          amount={totals.income}
          icon={<ArrowUpRight className="h-3.5 w-3.5 text-income" />}
          className="text-income"
        />
        <SummaryCard
          label="Expenses"
          amount={totals.expense}
          icon={<ArrowDownRight className="h-3.5 w-3.5 text-expense" />}
          className="text-expense"
        />
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card className="hidden md:block">
          <CardHeader>
            <CardTitle className="text-sm font-medium" as="h2">Monthly overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={40} />
                <Tooltip
                  formatter={(v) => (typeof v === 'number' ? `€${v.toFixed(2)}` : v)}
                  contentStyle={{ fontSize: 12 }}
                />
                <Bar dataKey="income" name="Income" fill="hsl(142 71% 45%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expenses" fill="hsl(0 84% 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Recent transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium" as="h2">Recent transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-12 px-6 text-center">
              <div className="rounded-full bg-muted p-3">
                <PlusCircle className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">No transactions yet</p>
                <p className="text-xs text-muted-foreground max-w-[200px]">
                  Start tracking your budget by adding your first transaction.
                </p>
              </div>
              <Button asChild size="sm">
                <Link to="/transactions">Add transaction</Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y">
              {recent.map((t) => (
                <li key={t.id} className="flex items-center justify-between px-6 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{t.description ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(t.date)}</p>
                  </div>
                  <div className="ml-4 flex items-center gap-2">
                    <Badge variant={t.type === 'INCOME' ? 'income' : 'expense'}>
                      {t.type === 'INCOME' ? '+' : '-'}
                      {formatCurrency(t.amount, t.currency)}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-7 w-32" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Skeleton className="col-span-2 h-24 md:col-span-1" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="hidden h-52 md:block" />
      <Skeleton className="h-64" />
    </div>
  )
}

function CardDescription({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <p className={`flex items-center gap-1 text-xs text-muted-foreground ${className ?? ''}`}>
      {children}
    </p>
  )
}

function SummaryCard({
  label,
  amount,
  icon,
  className,
}: {
  label: string
  amount: number
  icon: ReactNode
  className: string
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription className="flex items-center gap-1">
          {icon}
          {label}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className={`text-xl font-bold ${className}`}>{formatCurrency(amount)}</p>
      </CardContent>
    </Card>
  )
}
