import { ListFilter, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { cn } from '@/lib/cn';

interface TransactionSearchBarProps {
  value: string;
  onQueryChange: (next: string | undefined) => void;
  onOpenFilters: () => void;
  isFiltered: boolean;
}

export function TransactionSearchBar({
  value,
  onQueryChange,
  onOpenFilters,
  isFiltered,
}: TransactionSearchBarProps) {
  const [local, setLocal] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  // Sync external value (e.g. URL reset) into local state during render.
  if (prevValue !== value) {
    setPrevValue(value);
    setLocal(value);
  }

  const debounced = useDebouncedValue(local, 300);
  const lastEmittedRef = useRef(value);

  // Push debounced changes upward when they differ from what we last emitted
  // and from the external value (to avoid echoing URL-driven updates back).
  useEffect(() => {
    if (debounced === value || debounced === lastEmittedRef.current) return;
    lastEmittedRef.current = debounced;
    onQueryChange(debounced.length > 0 ? debounced : undefined);
  }, [debounced, value, onQueryChange]);

  return (
    <search className="flex items-center gap-2">
      <div className="relative flex-1">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          aria-label="Search transactions"
          placeholder="Search"
          className="rounded-full pl-9"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
        />
      </div>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={onOpenFilters}
        aria-label="Open filters"
        className={cn('relative size-10 shrink-0 rounded-full')}
      >
        <ListFilter className="size-4" />
        {isFiltered && (
          <span
            aria-hidden="true"
            className="absolute right-1 top-1 size-2 rounded-full bg-primary"
          />
        )}
      </Button>
    </search>
  );
}
