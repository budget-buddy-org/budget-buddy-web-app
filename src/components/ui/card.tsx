import type * as React from 'react';
import { cn } from '@/lib/cn';
import { useThemeStore } from '@/stores/theme.store';

function Card({
  className,
  glass,
  ref,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  ref?: React.Ref<HTMLDivElement>;
  /** Opt into the translucent + blur treatment when the user has glass enabled. */
  glass?: boolean;
}) {
  const glassEffect = useThemeStore((s) => s.glassEffect);
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden',
        glass && glassEffect && 'border-border/40 bg-card/60 backdrop-blur-xl',
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) {
  return <div ref={ref} className={cn('flex flex-col space-y-1.5 p-4', className)} {...props} />;
}

function CardTitle({
  className,
  as: Component = 'h3',
  ref,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement> & {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  ref?: React.Ref<HTMLHeadingElement>;
}) {
  return (
    <Component
      ref={ref}
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  );
}
function CardContent({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) {
  return <div ref={ref} className={cn('p-4 pt-0', className)} {...props} />;
}

export { Card, CardContent, CardHeader, CardTitle };
