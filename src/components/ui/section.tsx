import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { SectionHeader } from '@/components/ui/section-header';
import { cn } from '@/lib/cn';

interface SectionProps {
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
  /** Extra classes merged into the inner Card. Use to override default `p-4 space-y-4`. */
  cardClassName?: string;
  className?: string;
}

/**
 * Lifts the repeated Settings scaffold (`<section><SectionHeader/><Card>...</Card></section>`)
 * into a single primitive. Default Card padding/spacing matches the established
 * Settings rhythm; pass `cardClassName` to override.
 */
export function Section({ title, icon, children, cardClassName, className }: SectionProps) {
  return (
    <section className={cn('space-y-3', className)}>
      <SectionHeader title={title} icon={icon} />
      <Card className={cn('p-4 space-y-4', cardClassName)}>{children}</Card>
    </section>
  );
}
