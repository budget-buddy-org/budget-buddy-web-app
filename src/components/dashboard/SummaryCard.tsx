import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useFormatters } from '@/hooks/useFormatters';
import { cn } from '@/lib/cn';
import type { TransactionSearch } from '@/routes/_app/transactions/index';

export function SummaryCardDescription({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <p className={cn('flex items-center gap-1 text-xs text-muted-foreground', className)}>
      {children}
    </p>
  );
}

export function SummaryCard({
  label,
  amount,
  currency,
  icon,
  className,
  linkSearch,
  children,
}: {
  label: string;
  amount: number;
  currency?: string;
  icon: ReactNode;
  className: string;
  linkSearch?: TransactionSearch;
  children?: ReactNode;
}) {
  const { fmtCurrency } = useFormatters();
  const card = (
    <Card
      glass
      className={cn('h-full', linkSearch && 'cursor-pointer transition-colors hover:bg-muted/30')}
    >
      <CardHeader className="pb-2">
        <SummaryCardDescription>
          {icon}
          {label}
        </SummaryCardDescription>
      </CardHeader>
      <CardContent>
        <AnimatedNumber
          value={amount}
          format={(v) => fmtCurrency(Math.round(v), currency)}
          className={cn('text-xl font-bold', className)}
        />
        {children}
      </CardContent>
    </Card>
  );

  if (linkSearch) {
    return (
      <Link to="/transactions" search={linkSearch} className="block h-full">
        {card}
      </Link>
    );
  }
  return card;
}

export function SummaryCardSkeleton({ wide = false }: { wide?: boolean }) {
  return (
    <Card glass className={cn('h-full', wide && 'col-span-2 md:col-span-1')}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Skeleton className="size-4 rounded-pill" />
          <Skeleton className="h-3 w-16" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className={cn('h-7', wide ? 'w-28' : 'w-24')} />
        <Skeleton className="h-6 w-full" />
      </CardContent>
    </Card>
  );
}
