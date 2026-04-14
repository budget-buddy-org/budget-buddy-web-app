import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { formatCurrency } from '@/lib/formatters'

export function CardDescription({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <p className={`flex items-center gap-1 text-xs text-muted-foreground ${className ?? ''}`}>
      {children}
    </p>
  )
}

export function SummaryCard({
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
