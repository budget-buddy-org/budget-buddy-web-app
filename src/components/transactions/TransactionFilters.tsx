import { RotateCcw, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useDebounce } from '@/hooks/use-debounce';
import { useIsMobile } from '@/hooks/useIsMobile';

interface TransactionFiltersProps {
  categories: { id: string; name: string }[];
  filters: {
    categoryId: string;
    start: string;
    end: string;
    sort: 'asc' | 'desc';
    search: string;
  };
  onFilterChange: (filters: TransactionFiltersProps['filters']) => void;
  onReset: () => void;
  onClose: () => void;
}

export function TransactionFilters({
  categories,
  filters,
  onFilterChange,
  onReset,
  onClose,
}: TransactionFiltersProps) {
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState(filters.search);
  const [prevSearch, setPrevSearch] = useState(filters.search);
  const debouncedSearch = useDebounce(searchTerm);

  // Sync local input when the parent resets filters externally (e.g. "Reset All" from parent).
  // This is the React-recommended "setState during render" pattern for derived state.
  if (filters.search !== prevSearch) {
    setSearchTerm(filters.search);
    setPrevSearch(filters.search);
  }

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onFilterChange({ ...filters, search: debouncedSearch });
    }
  }, [debouncedSearch, filters, onFilterChange]);

  const hasActiveFilters =
    filters.categoryId || filters.start || filters.end || filters.sort !== 'desc' || filters.search;

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-2">
        <label htmlFor="search-filter" className="text-sm font-medium">
          Search
        </label>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="search-filter"
            placeholder="Search transactions…"
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus={!isMobile}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="category-filter" className="text-sm font-medium">
          Category
        </label>
        <Select
          id="category-filter"
          value={filters.categoryId}
          onChange={(e) => onFilterChange({ ...filters, categoryId: e.target.value })}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="start-date-filter" className="text-sm font-medium">
            From
          </label>
          <DatePicker
            id="start-date-filter"
            value={filters.start}
            onChange={(e) => onFilterChange({ ...filters, start: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="end-date-filter" className="text-sm font-medium">
            To
          </label>
          <DatePicker
            id="end-date-filter"
            value={filters.end}
            onChange={(e) => onFilterChange({ ...filters, end: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="sort-filter" className="text-sm font-medium">
          Sort
        </label>
        <Select
          id="sort-filter"
          value={filters.sort}
          onChange={(e) => onFilterChange({ ...filters, sort: e.target.value as 'asc' | 'desc' })}
        >
          <option value="desc">Newest first</option>
          <option value="asc">Oldest first</option>
        </Select>
      </div>

      <div className="pt-4 flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSearchTerm('');
            onReset();
          }}
          disabled={!hasActiveFilters}
          className="flex-1"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset
        </Button>
        <Button onClick={onClose} className="flex-1">
          Done
        </Button>
      </div>
    </div>
  );
}
