import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TransactionTypeToggle } from './transaction-type-toggle';

describe('TransactionTypeToggle', () => {
  it('renders correctly with Expense selected', () => {
    render(<TransactionTypeToggle value="EXPENSE" onChange={() => {}} />);

    const expenseBtn = screen.getByRole('tab', { name: /expense/i });
    const incomeBtn = screen.getByRole('tab', { name: /income/i });

    expect(expenseBtn).toHaveAttribute('aria-selected', 'true');
    expect(incomeBtn).toHaveAttribute('aria-selected', 'false');

    // Check for icons
    expect(expenseBtn.querySelector('svg')).toBeDefined();
    expect(incomeBtn.querySelector('svg')).toBeDefined();
  });

  it('renders correctly with Income selected', () => {
    render(<TransactionTypeToggle value="INCOME" onChange={() => {}} />);

    const expenseBtn = screen.getByRole('tab', { name: /expense/i });
    const incomeBtn = screen.getByRole('tab', { name: /income/i });

    expect(expenseBtn).toHaveAttribute('aria-selected', 'false');
    expect(incomeBtn).toHaveAttribute('aria-selected', 'true');
  });

  it('calls onChange when buttons are clicked', () => {
    const onChange = vi.fn();
    render(<TransactionTypeToggle value="EXPENSE" onChange={onChange} />);

    const incomeBtn = screen.getByRole('tab', { name: /income/i });
    fireEvent.click(incomeBtn);

    expect(onChange).toHaveBeenCalledWith('INCOME');

    const expenseBtn = screen.getByRole('tab', { name: /expense/i });
    fireEvent.click(expenseBtn);
    expect(onChange).toHaveBeenCalledWith('EXPENSE');
  });

  it('shows error state when error prop is true', () => {
    const { container } = render(
      <TransactionTypeToggle value="EXPENSE" onChange={() => {}} error={true} />,
    );
    expect(container.firstChild).toHaveClass('border-destructive');
  });
});
