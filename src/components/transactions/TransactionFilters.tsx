import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useDebounce } from '@/hooks/use-debounce'

interface TransactionFiltersProps {
  categories: { id: string; name: string }[]
  filters: {
    categoryId: string
    start: string
    end: string
    sort: 'asc' | 'desc'
    search: string
  }
  onFilterChange: (filters: any) => void
  onReset: () => void
}

export function TransactionFilters({
  categories,
  filters,
  onFilterChange,
  onReset,
}: TransactionFiltersProps) {
  const [searchTerm, setSearchTerm] = useState(filters.search)
  const debouncedSearch = useDebounce(searchTerm)

  useEffect(() => {
    onFilterChange({ ...filters, search: debouncedSearch })
  }, [debouncedSearch])

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-5">
          <div className="sm:col-span-2 md:col-span-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Search</label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search description..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Category</label>
            <Select
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
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">From</label>
            <Input
              type="date"
              value={filters.start}
              onChange={(e) => onFilterChange({ ...filters, start: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">To</label>
            <Input
              type="date"
              value={filters.end}
              onChange={(e) => onFilterChange({ ...filters, end: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Sort</label>
            <Select
              value={filters.sort}
              onChange={(e) =>
                onFilterChange({ ...filters, sort: e.target.value as 'asc' | 'desc' })
              }
            >
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </Select>
          </div>
        </div>
        {(filters.categoryId || filters.start || filters.end || filters.sort !== 'desc' || filters.search) && (
          <button
            type="button"
            className="mt-3 text-xs text-muted-foreground underline cursor-pointer"
            onClick={() => {
              setSearchTerm('')
              onReset()
            }}
          >
            Clear filters
          </button>
        )}
      </CardContent>
    </Card>
  )
}
