import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Content width per page. `default` keeps the comfortable single-column
 * reading width used everywhere today; `wide` lets the dashboard breathe into
 * a multi-column bento on large screens. Mobile width is identical for both.
 */
type PageContainerSize = 'default' | 'wide';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  size?: PageContainerSize;
}

const SIZE_CLASSES: Record<PageContainerSize, string> = {
  default: 'max-w-2xl md:max-w-4xl',
  wide: 'max-w-2xl md:max-w-4xl lg:max-w-6xl',
};

/**
 * Standard container for all top-level pages — owns centering, max width and
 * the consistent vertical rhythm between sections.
 */
export function PageContainer({
  children,
  className,
  size = 'default',
}: Readonly<PageContainerProps>) {
  return (
    <div className={cn('mx-auto w-full space-y-6', SIZE_CLASSES[size], className)}>{children}</div>
  );
}
