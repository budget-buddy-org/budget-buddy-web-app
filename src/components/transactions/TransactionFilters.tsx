import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Select } from '@/components/ui/select';
import { TransactionTypeToggle } from '@/components/ui/transaction-type-toggle';
import type { TransactionPageFilters } from '@/hooks/useTransactionPageState';

interface TransactionFiltersProps {
  categories: { id: string; name: string }[];
  filters: TransactionPageFilters;
  onFilterChange: (filters: TransactionPageFilters) => void;
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
  const hasActiveFilters =
    filters.categoryId || filters.start || filters.end || filters.sort !== 'desc' || filters.type;

  return (
    <div className="space-y-4 pt-2">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Type</legend>
        <TransactionTypeToggle
          nullable
          value={filters.type}
          onChange={(type) => onFilterChange({ ...filters, type })}
        />
      </fieldset>

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
          onClick={onReset}
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
