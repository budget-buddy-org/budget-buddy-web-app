import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { haptic } from '@/lib/haptics';
import { useThemeStore } from '@/stores/theme.store';

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
  const glassEffect = useThemeStore((s) => s.glassEffect);

  return (
    <div
      role="tablist"
      className={cn(
        'flex p-1 bg-muted rounded-pill transition-colors',
        glassEffect && 'bg-muted/50 backdrop-blur-md',
        error && 'border border-destructive',
        className,
      )}
    >
      {nullable && (
        <button
          type="button"
          role="tab"
          aria-selected={value === ''}
          onClick={() => {
            if (value !== '') haptic('tap');
            (onChange as NullableProps['onChange'])('');
          }}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-3 py-control-inner rounded-pill text-sm font-medium transition-colors cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
            value === ''
              ? cn(
                  'bg-background text-foreground shadow-sm',
                  glassEffect && 'bg-background/80 backdrop-blur-sm',
                )
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50 active:bg-background/70',
          )}
        >
          All
        </button>
      )}
      <button
        type="button"
        role="tab"
        aria-selected={value === 'EXPENSE'}
        onClick={() => {
          if (value !== 'EXPENSE') haptic('tap');
          onChange('EXPENSE');
        }}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 px-3 py-control-inner rounded-pill text-sm font-medium transition-colors cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
          value === 'EXPENSE'
            ? cn(
                'bg-background text-foreground shadow-sm',
                glassEffect && 'bg-background/80 backdrop-blur-sm',
              )
            : 'text-muted-foreground hover:text-foreground hover:bg-background/50 active:bg-background/70',
        )}
      >
        <ArrowDownRight className="size-4" />
        Expense
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === 'INCOME'}
        onClick={() => {
          if (value !== 'INCOME') haptic('tap');
          onChange('INCOME');
        }}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 px-3 py-control-inner rounded-pill text-sm font-medium transition-colors cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
          value === 'INCOME'
            ? cn(
                'bg-background text-income shadow-sm',
                glassEffect && 'bg-background/80 backdrop-blur-sm',
              )
            : 'text-muted-foreground hover:text-foreground hover:bg-background/50 active:bg-background/70',
        )}
      >
        <ArrowUpRight className="size-4" />
        Income
      </button>
    </div>
  );
}
