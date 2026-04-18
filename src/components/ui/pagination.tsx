import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

interface PaginationProps {
  page: number;
  total: number;
  size: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ page, total, size, onPageChange, className }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / size));
  const canPrevious = page > 0;
  const canNext = (page + 1) * size < total;

  return (
    <div className={cn('flex items-center justify-between md:pb-4', className)}>
      <div className="flex-1 text-sm text-muted-foreground">
        Page {page + 1} of {totalPages}
        <span className="ml-2 hidden sm:inline">({total} total items)</span>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="default"
          onClick={() => onPageChange(page - 1)}
          disabled={!canPrevious}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
          <span className="hidden sm:inline">Previous</span>
        </Button>
        <Button
          variant="outline"
          size="default"
          onClick={() => onPageChange(page + 1)}
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
