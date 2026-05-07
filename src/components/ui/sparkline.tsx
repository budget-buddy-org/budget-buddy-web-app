import { cn } from '@/lib/cn';

const WIDTH = 100;
const HEIGHT = 24;
const PADDING = 2;

export type SparklineVariant = 'income' | 'expense' | 'balance';

const VARIANT_STROKE: Record<SparklineVariant, string> = {
  income: 'var(--color-income)',
  expense: 'var(--color-expense)',
  balance: 'var(--color-primary)',
};

export function Sparkline({
  values,
  isLoading = false,
  variant = 'balance',
  className,
}: {
  values: number[];
  isLoading?: boolean;
  variant?: SparklineVariant;
  className?: string;
}) {
  if (isLoading || values.length < 2) {
    return (
      <div
        aria-hidden
        className={cn(
          'h-6 w-full',
          isLoading && 'skeleton-shimmer rounded-sm bg-muted/60',
          className,
        )}
      />
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = (WIDTH - PADDING * 2) / (values.length - 1);

  const points = values.map((v, i) => {
    const x = PADDING + i * stepX;
    const y = HEIGHT - PADDING - ((v - min) / range) * (HEIGHT - PADDING * 2);
    return [x, y] as const;
  });

  const path = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(' ');
  const area = `${path} L${points[points.length - 1][0].toFixed(2)} ${HEIGHT - PADDING} L${points[0][0].toFixed(2)} ${HEIGHT - PADDING} Z`;
  const stroke = VARIANT_STROKE[variant];
  const last = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={`${variant} trend, last ${values.length} months`}
      className={cn('h-6 w-full overflow-visible', className)}
    >
      <path d={area} fill={stroke} fillOpacity={0.12} />
      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth={1.25}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={last[0]} cy={last[1]} r={1.5} fill={stroke} />
    </svg>
  );
}
