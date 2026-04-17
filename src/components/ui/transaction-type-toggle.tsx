import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/cn';

type StrictProps = {
  nullable?: false;
  value: 'EXPENSE' | 'INCOME';
  onChange: (value: 'EXPENSE' | 'INCOME') => void;
  className?: string;
  error?: boolean;
};

type NullableProps = {
  nullable: true;
  value: 'EXPENSE' | 'INCOME' | '';
  onChange: (value: 'EXPENSE' | 'INCOME' | '') => void;
  className?: string;
  error?: boolean;
};

type TransactionTypeToggleProps = StrictProps | NullableProps;

export function TransactionTypeToggle({
  value,
  onChange,
  nullable,
  className,
  error,
}: TransactionTypeToggleProps) {
  return (
    <div
      className={cn(
        'flex h-10 p-1 bg-muted rounded-lg transition-colors',
        error && 'border border-destructive',
        className,
      )}
    >
      {nullable && (
        <button
          type="button"
          aria-pressed={value === ''}
          onClick={() => (onChange as NullableProps['onChange'])('')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-3 rounded-md text-sm font-medium transition-all cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
            value === ''
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50',
          )}
        >
          All
        </button>
      )}
      <button
        type="button"
        aria-pressed={value === 'EXPENSE'}
        onClick={() => onChange('EXPENSE')}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 px-3 rounded-md text-sm font-medium transition-all cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
          value === 'EXPENSE'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground hover:bg-background/50',
        )}
      >
        <ArrowDownRight className="h-4 w-4" />
        Expense
      </button>
      <button
        type="button"
        aria-pressed={value === 'INCOME'}
        onClick={() => onChange('INCOME')}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 px-3 rounded-md text-sm font-medium transition-all cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
          value === 'INCOME'
            ? 'bg-background text-income shadow-sm'
            : 'text-muted-foreground hover:text-foreground hover:bg-background/50',
        )}
      >
        <ArrowUpRight className="h-4 w-4" />
        Income
      </button>
    </div>
  );
}
