import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
}: {
  label: string;
  amount: number;
  currency?: string;
  icon: ReactNode;
  className: string;
  linkSearch?: TransactionSearch;
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
