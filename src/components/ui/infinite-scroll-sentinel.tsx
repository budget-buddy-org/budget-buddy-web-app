import * as React from 'react';
import { Button } from '@/components/ui/button';

interface InfiniteScrollSentinelProps {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}

export function InfiniteScrollSentinel({
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: InfiniteScrollSentinelProps) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMore();
      },
      { rootMargin: '200px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, onLoadMore]);

  if (!hasNextPage) {
    return <p className="py-6 text-center text-xs text-muted-foreground">End of list</p>;
  }

  return (
    <div ref={ref} className="flex justify-center py-4">
      <Button
        variant="outline"
        onClick={onLoadMore}
        loading={isFetchingNextPage}
        disabled={isFetchingNextPage}
      >
        Load more
      </Button>
    </div>
  );
}
