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
}: Readonly<{
  values: number[];
  isLoading?: boolean;
  variant?: SparklineVariant;
  className?: string;
}>) {
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
  const last = points.at(-1) ?? points[0];
  const area = `${path} L${last[0].toFixed(2)} ${HEIGHT - PADDING} L${points[0][0].toFixed(2)} ${HEIGHT - PADDING} Z`;
  const stroke = VARIANT_STROKE[variant];
  const dotLeft = `${(last[0] / WIDTH) * 100}%`;
  const dotTop = `${(last[1] / HEIGHT) * 100}%`;

  // The SVG uses preserveAspectRatio="none" so the path stretches to fill the
  // container width. An SVG <circle> would distort into an ellipse under that
  // stretch (the path strokes escape via vectorEffect="non-scaling-stroke",
  // which doesn't apply to <circle>). Render the end dot as an HTML element
  // positioned in percentages so it stays a true circle at any width.
  //
  // The dot anchor is a zero-size element placed at the chart's last point.
  // Both the pulse ring and the static dot center themselves on that anchor
  // independently, so the pulse animation (which uses the standalone CSS
  // `scale` property) cannot clobber the -translate-x/y positioning.
  return (
    <div className={cn('relative h-6 w-full', className)}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`${variant} trend, last ${values.length} months`}
        className="h-full w-full overflow-visible"
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
      </svg>
      <span
        aria-hidden
        className="pointer-events-none absolute"
        style={{ left: dotLeft, top: dotTop }}
      >
        <span
          className="absolute -translate-x-1/2 -translate-y-1/2 size-3 rounded-full motion-safe:animate-dot-pulse"
          style={{ backgroundColor: stroke }}
        />
        <span
          className="absolute -translate-x-1/2 -translate-y-1/2 size-1.5 rounded-full"
          style={{ backgroundColor: stroke }}
        />
      </span>
    </div>
  );
}
