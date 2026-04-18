import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/formatters';
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
  const card = (
    <Card
      className={
        linkSearch ? 'h-full cursor-pointer transition-colors hover:bg-muted/30' : undefined
      }
    >
      <CardHeader className="pb-2">
        <SummaryCardDescription>
          {icon}
          {label}
        </SummaryCardDescription>
      </CardHeader>
      <CardContent>
        <p className={cn('text-xl font-bold', className)}>{formatCurrency(amount, currency)}</p>
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
