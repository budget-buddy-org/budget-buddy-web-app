import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { TransactionTypeToggle } from './transaction-type-toggle'

describe('TransactionTypeToggle', () => {
  it('renders correctly with Expense selected', () => {
    render(<TransactionTypeToggle value="EXPENSE" onChange={() => {}} />)
    
    const expenseBtn = screen.getByRole('radio', { name: /expense/i })
    const incomeBtn = screen.getByRole('radio', { name: /income/i })
    
    expect(expenseBtn).toHaveAttribute('aria-checked', 'true')
    expect(incomeBtn).toHaveAttribute('aria-checked', 'false')
    
    // Check for icons
    expect(expenseBtn.querySelector('svg')).toBeDefined()
    expect(incomeBtn.querySelector('svg')).toBeDefined()
  })

  it('renders correctly with Income selected', () => {
    render(<TransactionTypeToggle value="INCOME" onChange={() => {}} />)
    
    const expenseBtn = screen.getByRole('radio', { name: /expense/i })
    const incomeBtn = screen.getByRole('radio', { name: /income/i })
    
    expect(expenseBtn).toHaveAttribute('aria-checked', 'false')
    expect(incomeBtn).toHaveAttribute('aria-checked', 'true')
  })

  it('calls onChange when buttons are clicked', () => {
    const onChange = vi.fn()
    render(<TransactionTypeToggle value="EXPENSE" onChange={onChange} />)
    
    const incomeBtn = screen.getByRole('radio', { name: /income/i })
    fireEvent.click(incomeBtn)
    
    expect(onChange).toHaveBeenCalledWith('INCOME')
    
    const expenseBtn = screen.getByRole('radio', { name: /expense/i })
    fireEvent.click(expenseBtn)
    expect(onChange).toHaveBeenCalledWith('EXPENSE')
  })

  it('shows error state when error prop is true', () => {
    const { container } = render(<TransactionTypeToggle value="EXPENSE" onChange={() => {}} error={true} />)
    expect(container.firstChild).toHaveClass('border-destructive')
  })
})
