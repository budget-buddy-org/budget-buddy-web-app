import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/cn';

interface ListSkeletonProps {
  count?: number;
  className?: string;
  showIcon?: boolean;
}

const SKELETON_KEYS = Array.from({ length: 20 }, (_, i) => `sk-${i}`);

/**
 * A generic skeleton for lists of items (transactions, categories, etc.)
 */
export function ListSkeleton({ count = 5, className, showIcon = false }: ListSkeletonProps) {
  return (
    <div className={cn('divide-y', className)}>
      {SKELETON_KEYS.slice(0, count).map((key) => (
        <div key={key} className="flex items-center justify-between px-4 py-3">
          <Skeleton className="h-4 w-32" />
          {showIcon && <Skeleton className="h-9 w-9 rounded-md" />}
        </div>
      ))}
    </div>
  );
}
