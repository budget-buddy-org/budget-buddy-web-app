import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { haptic } from '@/lib/haptics';

interface PaginationProps {
  page: number;
  total: number;
  size: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ page, total, size, onPageChange, className }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / size));

  if (totalPages <= 1) {
    return null;
  }

  const canPrevious = page > 0;
  const canNext = (page + 1) * size < total;

  const goTo = (next: number) => {
    haptic('tap');
    onPageChange(next);
  };

  return (
    <div className={cn('flex items-center justify-between gap-3 md:pb-4', className)}>
      <div className="text-sm text-muted-foreground">
        Page {page + 1} of {totalPages}
        <span className="ml-2 hidden sm:inline">({total} total items)</span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="sm:w-auto sm:px-4"
          onClick={() => goTo(page - 1)}
          disabled={!canPrevious}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
          <span className="hidden sm:inline">Previous</span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="sm:w-auto sm:px-4"
          onClick={() => goTo(page + 1)}
          disabled={!canNext}
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
