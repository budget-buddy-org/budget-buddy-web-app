import { render, screen, fireEvent } from '@testing-library/react'
import { TransactionList } from './TransactionList'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

describe('TransactionList empty states', () => {
  it('renders "No transactions yet." when no transactions and not filtering', () => {
    render(<TransactionList transactions={[]} categories={[]} isLoading={false} />)
    expect(screen.getByText(/no transactions yet/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /reset filters/i })).not.toBeInTheDocument()
  })

  it('renders "No transactions match your filters." and reset button when filtering', () => {
    const onResetFilters = vi.fn()
    render(
      <TransactionList 
        transactions={[]} 
        categories={[]} 
        isLoading={false} 
        isFiltering={true} 
        onResetFilters={onResetFilters}
      />
    )
    
    expect(screen.getByText(/no transactions match your filters/i)).toBeInTheDocument()
    const resetButton = screen.getByRole('button', { name: /reset filters/i })
    expect(resetButton).toBeInTheDocument()
    
    fireEvent.click(resetButton)
    expect(onResetFilters).toHaveBeenCalled()
  })

  it('groups transactions by date', () => {
    const transactions = [
      { id: '1', description: 'Item 1', date: '2024-01-01', amount: 1000, currency: 'EUR', type: 'EXPENSE', categoryId: 'c1' },
      { id: '2', description: 'Item 2', date: '2024-01-01', amount: 2000, currency: 'EUR', type: 'INCOME', categoryId: 'c1' },
      { id: '3', description: 'Item 3', date: '2024-01-02', amount: 3000, currency: 'EUR', type: 'EXPENSE', categoryId: 'c1' },
    ] as any[]
    const categories = [{ id: 'c1', name: 'Category 1' }]
    
    render(<TransactionList transactions={transactions} categories={categories} isLoading={false} />)
    
    // Check if dates are rendered as headers (formatDate('2024-01-01') -> Jan 1, 2024)
    expect(screen.getByText('Jan 1, 2024')).toBeInTheDocument()
    expect(screen.getByText('Jan 2, 2024')).toBeInTheDocument()
    
    // Check if items are rendered
    expect(screen.getByText('Item 1')).toBeInTheDocument()
    expect(screen.getByText('Item 2')).toBeInTheDocument()
    expect(screen.getByText('Item 3')).toBeInTheDocument()
  })
})
