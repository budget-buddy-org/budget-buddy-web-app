import { cn } from '@/lib/cn'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'

interface TransactionTypeToggleProps {
  value: 'EXPENSE' | 'INCOME'
  onChange: (value: 'EXPENSE' | 'INCOME') => void
  className?: string
  error?: boolean
}

export function TransactionTypeToggle({
  value,
  onChange,
  className,
  error,
}: TransactionTypeToggleProps) {
  return (
    <div
      className={cn(
        'flex h-10 p-1 bg-muted rounded-lg transition-colors',
        error && 'border border-destructive',
        className
      )}
    >
      <button
        type="button"
        role="radio"
        aria-checked={value === 'EXPENSE'}
        tabIndex={0}
        onClick={() => onChange('EXPENSE')}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 px-3 rounded-md text-sm font-medium transition-all cursor-pointer select-none outline-none',
          value === 'EXPENSE'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
        )}
      >
        <ArrowDownRight className="h-4 w-4" />
        Expense
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={value === 'INCOME'}
        tabIndex={0}
        onClick={() => onChange('INCOME')}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 px-3 rounded-md text-sm font-medium transition-all cursor-pointer select-none outline-none',
          value === 'INCOME'
            ? 'bg-background text-income shadow-sm'
            : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
        )}
      >
        <ArrowUpRight className="h-4 w-4" />
        Income
      </button>
    </div>
  )
}
